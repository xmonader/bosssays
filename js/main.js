/**
 * Browser entry: keyboard + touch, rAF loop, canvas, audio, tab pause.
 * Exposes window.BossSays for tests / debug hooks.
 */
(function () {
  "use strict";

  const Game = window.BossSaysGame;
  const Render = window.BossSaysRender;
  const Audio = window.BossSaysAudio;
  const Meta = window.BossSaysMeta;

  const keys = {
    left: false,
    right: false,
    jump: false,
    jumpPressed: false,
    openInbox: false,
  };

  function loadSettings() {
    return Meta && Meta.loadSettings ? Meta.loadSettings() : {};
  }

  function startOpts(overrides) {
    const settings = loadSettings();
    const o = {
      settings: settings,
      difficulty: settings.difficulty || "mid",
      mode: settings.mode || "normal",
    };
    if (overrides) {
      const k = Object.keys(overrides);
      for (let i = 0; i < k.length; i++) o[k[i]] = overrides[k[i]];
    }
    if (o.mode === "daily" && Meta) {
      o.seed = Meta.dailySeed();
    }
    return o;
  }

  let game = Game.createGame(startOpts());
  let last = 0;
  let rafId = 0;
  let audioReady = false;
  let tabPaused = typeof document !== "undefined" && document.hidden;
  let userPaused = false;

  const canvas = document.getElementById("game");
  if (!canvas) {
    document.body.innerHTML =
      "<p>Missing #game canvas. Open index.html from this folder.</p>";
    return;
  }
  const ctx = canvas.getContext("2d");
  canvas.width = Render.VIEW_W;
  canvas.height = Render.VIEW_H;

  const slackPad = document.getElementById("slack-pad");
  const btnSlack = document.getElementById("btn-slack");
  const btnMute = document.getElementById("btn-mute");
  const btnRestart = document.getElementById("btn-restart");
  const btnPause = document.getElementById("btn-pause");
  const btnPauseTouch = document.getElementById("btn-pause-touch");
  const settingsPanel = document.getElementById("settings-panel");
  const bestLine = document.getElementById("best-line");

  function clearHeldKeys() {
    keys.left = false;
    keys.right = false;
    keys.jump = false;
    keys.jumpPressed = false;
    keys.openInbox = false;
    document.querySelectorAll("#touch button.held").forEach(function (b) {
      b.classList.remove("held");
    });
  }

  function applyAudioPrefs() {
    const s = loadSettings();
    if (!Audio) return;
    if (s.sfx === false) {
      Audio.setMuted(true);
    } else if (Audio.isMuted() && s.sfx !== false) {
      // don't unmute if user hit M — only if settings say sfx on and we forced mute from settings
    }
    if (s.bgm === false && typeof Audio.stopBgm === "function") {
      Audio.stopBgm();
    } else if (s.bgm !== false && audioReady && !Audio.isMuted() && !tabPaused) {
      Audio.startBgm();
    }
  }

  function ensureAudio() {
    if (!Audio || audioReady) return;
    const s = loadSettings();
    if (Audio.unlock()) {
      audioReady = true;
      if (s.sfx === false) Audio.setMuted(true);
      if (!tabPaused && s.bgm !== false && !Audio.isMuted()) Audio.startBgm();
    }
  }

  function updateBestLine() {
    if (!bestLine || !Meta) return;
    const b = Meta.loadBest();
    if (!b || !b.score) {
      bestLine.textContent = "No best run yet — ship something.";
      return;
    }
    bestLine.textContent =
      "Best: " +
      b.score +
      " SP · S" +
      b.sprint +
      " · " +
      (b.mode || "normal") +
      "/" +
      (b.difficulty || "mid");
  }

  function isSimPaused() {
    return userPaused || tabPaused || document.hidden;
  }

  function restart(opts) {
    userPaused = false;
    game = Game.createGame(startOpts(opts || {}));
    last = 0;
    ensureAudio();
    syncBgmMood();
    if (Audio && loadSettings().sfx !== false) Audio.play("reply");
    syncMobileChrome();
    updateBestLine();
    if (!tabPaused && !rafId) {
      rafId = requestAnimationFrame(frame);
    }
  }

  function abandonRun() {
    if (game.phase === "gameover") return;
    game.phase = "gameover";
    game.endReason = "paused_out";
    game.message = "You stepped away. HR marked you AFK.";
    game.messageTimer = 99;
    game.notifications.active = null;
    if (Meta && Game.snapshotRun) {
      Meta.considerBest(Game.snapshotRun(game));
    }
    userPaused = false;
    clearHeldKeys();
    if (Audio) Audio.play("gameover");
    Render.draw(ctx, game);
    syncMobileChrome();
    updateBestLine();
  }

  function setUserPaused(paused) {
    if (game.phase === "gameover") {
      userPaused = false;
      return;
    }
    userPaused = !!paused;
    canvas.dataset.userPaused = userPaused ? "1" : "0";
    clearHeldKeys();
    last = 0;
    if (userPaused) {
      if (Audio && typeof Audio.stopBgm === "function") Audio.stopBgm();
      Render.draw(ctx, game);
      drawUserPauseOverlay(ctx);
    } else {
      if (
        audioReady &&
        Audio &&
        !Audio.isMuted() &&
        loadSettings().bgm !== false &&
        !tabPaused
      ) {
        Audio.startBgm();
      }
      if (!rafId && !tabPaused) {
        rafId = requestAnimationFrame(frame);
      }
    }
    if (btnPause) btnPause.textContent = userPaused ? "Resume" : "Pause";
    if (btnPauseTouch) {
      btnPauseTouch.textContent = userPaused ? "▶" : "❚❚";
    }
    syncMobileChrome();
  }

  function toggleUserPause() {
    setUserPaused(!userPaused);
  }

  function shareCard() {
    const g = game;
    const clk =
      Game.formatOfficeClock && Game.formatOfficeClock(g.officeMin || 0);
    const lines = [
      "Boss Says — run card",
      "Score: " + (g.score || 0) + " SP",
      "Sprint " + g.sprint + " · Deploys " + g.deploys,
      "Best combo x" + (g.bestCombo || 0),
      "Pol " + Math.round(g.political || 0) + " · Debt " + Math.round(g.techDebt || 0),
      clk ? "Office clock: " + clk.long : null,
      "Mode " + (g.mode || "normal") + " / " + (g.difficulty || "mid"),
      g.endReason ? "End: " + g.endReason : "Still employed (somehow)",
      "https://xmonader.github.io/bosssays/",
    ].filter(Boolean);
    const text = lines.join("\n");
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        function () {
          g.message = "Run card copied to clipboard";
          g.messageTimer = 2.5;
        },
        function () {
          window.prompt("Copy run card:", text);
        }
      );
    } else {
      window.prompt("Copy run card:", text);
    }
  }

  function wireSettings() {
    const s = loadSettings();
    const diff = document.getElementById("set-difficulty");
    const compact = document.getElementById("set-compact");
    const motion = document.getElementById("set-motion");
    const cb = document.getElementById("set-cb");
    const sfx = document.getElementById("set-sfx");
    const bgm = document.getElementById("set-bgm");
    if (diff) diff.value = s.difficulty || "mid";
    if (compact) compact.checked = !!s.compactHud;
    if (motion) motion.checked = !!s.reduceMotion;
    if (cb) cb.checked = !!s.colorblind;
    if (sfx) sfx.checked = s.sfx !== false;
    if (bgm) bgm.checked = s.bgm !== false;

    const btnSet = document.getElementById("btn-settings");
    if (btnSet) {
      btnSet.addEventListener("click", function () {
        if (!settingsPanel) return;
        const open = settingsPanel.classList.toggle("open");
        btnSet.setAttribute("aria-expanded", open ? "true" : "false");
        if (open) wireSettings();
      });
    }
    const close = document.getElementById("set-close");
    if (close) {
      close.addEventListener("click", function () {
        if (settingsPanel) settingsPanel.classList.remove("open");
      });
    }
    const apply = document.getElementById("set-apply");
    if (apply && Meta) {
      apply.addEventListener("click", function () {
        const largeEl = document.getElementById("set-large");
        const ghostEl = document.getElementById("set-ghost");
        Meta.saveSettings({
          difficulty: diff ? diff.value : "mid",
          compactHud: compact ? compact.checked : false,
          reduceMotion: motion ? motion.checked : false,
          colorblind: cb ? cb.checked : false,
          sfx: sfx ? sfx.checked : true,
          bgm: bgm ? bgm.checked : true,
          largeText: largeEl ? largeEl.checked : false,
          showGhost: ghostEl ? ghostEl.checked : false,
        });
        if (Audio) {
          Audio.setMuted(!(sfx && sfx.checked));
          if (bgm && !bgm.checked) Audio.stopBgm();
          else if (audioReady && sfx && sfx.checked) {
            Audio.startBgm(moodForGame(game));
          }
        }
        if (settingsPanel) settingsPanel.classList.remove("open");
        restart();
      });
    }
    document.querySelectorAll("#menu-bar [data-mode]").forEach(function (el) {
      el.addEventListener("click", function () {
        const mode = el.getAttribute("data-mode");
        if (Meta) Meta.saveSettings({ mode: mode });
        restart({ mode: mode });
      });
    });
    const btnShare = document.getElementById("btn-share");
    if (btnShare) btnShare.addEventListener("click", shareCard);
    const btnCont = document.getElementById("btn-continue");
    if (btnCont) {
      btnCont.addEventListener("click", function () {
        if (!tryContinue()) {
          if (game) {
            game.message = "No saved run";
            game.messageTimer = 2;
          }
        }
      });
      const snap = Meta && Meta.loadContinue && Meta.loadContinue();
      btnCont.style.opacity = snap && snap.v ? "1" : "0.45";
    }
    const btnFs = document.getElementById("btn-fullscreen");
    if (btnFs) btnFs.addEventListener("click", toggleFullscreen);
    const btnBoard = document.getElementById("btn-board");
    if (btnBoard) {
      btnBoard.addEventListener("click", function () {
        showBoard();
      });
    }
    const btnAchieve = document.getElementById("btn-achieve");
    if (btnAchieve) {
      btnAchieve.addEventListener("click", function () {
        showAchievements();
      });
    }
    const btnSeed = document.getElementById("btn-seed");
    if (btnSeed) {
      btnSeed.addEventListener("click", function () {
        const seedStr = window.prompt(
          "Enter daily seed (YYYYMMDD) or leave blank for today:",
          Meta ? String(Meta.dailySeed()) : ""
        );
        if (seedStr == null) return;
        const seed = parseInt(seedStr, 10) || (Meta && Meta.dailySeed());
        if (Meta) Meta.saveSettings({ mode: "daily" });
        restart({ mode: "daily", seed: seed });
      });
    }
    const large = document.getElementById("set-large");
    if (large) large.checked = !!s.largeText;
    const ghost = document.getElementById("set-ghost");
    if (ghost) ghost.checked = !!s.showGhost;
  }

  function showAchievements() {
    if (!Meta) return;
    const unlocked = Meta.loadAchievements();
    const lines = Meta.ACHIEVEMENT_DEFS.map(function (d) {
      return (unlocked[d.id] ? "★ " : "· ") + d.name + " — " + d.desc;
    });
    window.alert("Achievements\n\n" + lines.join("\n"));
  }

  function showBoard() {
    if (!Meta) return;
    const board = Meta.loadBoard();
    if (!board.length) {
      window.alert("Local leaderboard is empty. Finish a run to post.");
      return;
    }
    const lines = board.slice(0, 10).map(function (e, i) {
      return (
        i +
        1 +
        ". " +
        e.name +
        " — " +
        e.score +
        " SP · S" +
        e.sprint +
        " · " +
        e.card
      );
    });
    window.alert("Local leaderboard (device)\n\n" + lines.join("\n"));
  }

  function reply(choiceId) {
    if (!game.notifications.active) return;
    game.events = [];
    Game.chooseNotification(game, choiceId);
    if (Audio) Audio.playEvents(game.events);
    game.events = [];
    syncMobileChrome();
  }

  /** Map 1–5 to current note choices (supports meeting/review). */
  function replyByIndex(idx) {
    const note = game.notifications.active;
    if (!note || !note.choices) return;
    // Special: 5 always prefers quit if present
    if (idx === 4) {
      const q = note.choices.filter(function (c) {
        return c.id === "quit";
      })[0];
      if (q) {
        reply(q.id);
        return;
      }
    }
    const nonQuit = note.choices.filter(function (c) {
      return c.id !== "quit";
    });
    if (nonQuit[idx]) reply(nonQuit[idx].id);
  }

  function moodForGame(g) {
    if (!g) return "office";
    if (g.mode === "oncall") return "oncall";
    const tid = g.map && g.map.theme && g.map.theme.id;
    if (tid === "war-room") return "war";
    if (tid === "all-hands") return "allhands";
    if (tid === "remote") return "remote";
    return "office";
  }

  function syncBgmMood() {
    if (Audio && typeof Audio.setBgmMood === "function") {
      Audio.setBgmMood(moodForGame(game));
    }
  }

  function tryContinue() {
    if (!Meta || !Meta.loadContinue) return false;
    const snap = Meta.loadContinue();
    if (!snap || !snap.v) return false;
    restart({
      continueSnap: snap,
      sprint: snap.sprint,
      lives: snap.lives,
      score: snap.score,
      deploys: snap.deploys,
      difficulty: snap.difficulty,
      mode: snap.mode,
      seed: snap.seed,
    });
    return true;
  }

  function setTabPaused(paused) {
    tabPaused = !!paused;
    canvas.dataset.tabPaused = tabPaused ? "1" : "0";
    if (tabPaused) {
      clearHeldKeys();
      last = 0;
      if (Audio && typeof Audio.stopBgm === "function") Audio.stopBgm();
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
      if (ctx && game) {
        Render.draw(ctx, game);
        drawTabPauseOverlay(ctx);
      }
    } else {
      last = 0;
      if (audioReady && Audio && !Audio.isMuted()) {
        Audio.startBgm();
      }
      if (!rafId) {
        rafId = requestAnimationFrame(frame);
      }
    }
  }

  function drawTabPauseOverlay(c) {
    const w = Render.VIEW_W;
    const h = Render.VIEW_H;
    c.save();
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.fillStyle = "rgba(15,23,42,0.55)";
    c.fillRect(0, 0, w, h);
    c.fillStyle = "#f8fafc";
    c.font = "bold 28px system-ui,sans-serif";
    c.textAlign = "center";
    c.fillText("PAUSED", w / 2, h / 2 - 8);
    c.font = "16px system-ui,sans-serif";
    c.fillStyle = "#94a3b8";
    c.fillText("Tab inactive — come back to keep shipping", w / 2, h / 2 + 24);
    c.textAlign = "left";
    c.restore();
  }

  function drawUserPauseOverlay(c) {
    const w = Render.VIEW_W;
    const h = Render.VIEW_H;
    c.save();
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.fillStyle = "rgba(15,23,42,0.72)";
    c.fillRect(0, 0, w, h);
    c.fillStyle = "#f8fafc";
    c.font = "bold 34px system-ui,sans-serif";
    c.textAlign = "center";
    c.fillText("PAUSED", w / 2, h / 2 - 48);
    c.font = "16px system-ui,sans-serif";
    c.fillStyle = "#cbd5e1";
    c.fillText("Esc / P — resume", w / 2, h / 2 - 8);
    c.fillText("R — new run · Q — abandon (AFK end)", w / 2, h / 2 + 22);
    c.fillStyle = "#94a3b8";
    c.font = "14px system-ui,sans-serif";
    c.fillText(
      "Sprint " +
        game.sprint +
        " · Score " +
        (game.score || 0) +
        " · PTO " +
        game.lives,
      w / 2,
      h / 2 + 56
    );
    c.textAlign = "left";
    c.restore();
  }

  function isCoarse() {
    try {
      return window.matchMedia("(pointer: coarse)").matches || window.innerWidth <= 900;
    } catch (e) {
      return window.innerWidth <= 900;
    }
  }

  function syncMobileChrome() {
    const inbox =
      (game.notifications.inbox && game.notifications.inbox.length) || 0;
    const reading = !!game.notifications.active;

    if (slackPad) {
      // Show reply buttons whenever reading (mouse click + touch)
      if (reading) slackPad.classList.add("open");
      else slackPad.classList.remove("open");
      // Relabel pad from current note choices when possible
      if (reading && game.notifications.active) {
        const note = game.notifications.active;
        const nonQuit = (note.choices || []).filter(function (c) {
          return c.id !== "quit";
        });
        const map = ["dismiss", "on_it", "love", "pushback"];
        for (let i = 0; i < map.length; i++) {
          const btn = slackPad.querySelector(
            '[data-reply="' + map[i] + '"]'
          );
          if (!btn) continue;
          if (nonQuit[i]) {
            btn.style.display = "";
            btn.textContent = i + 1 + " " + nonQuit[i].label;
          } else {
            btn.style.display = "none";
          }
        }
      }
    }
    if (btnSlack) {
      if (inbox > 0 || reading) btnSlack.classList.add("has-mail");
      else btnSlack.classList.remove("has-mail");
      btnSlack.textContent = reading
        ? "Reading…"
        : inbox > 0
          ? "Slack " + inbox
          : "Slack";
    }
    if (btnRestart) {
      btnRestart.style.opacity = game.phase === "gameover" ? "1" : "0.55";
    }
    if (btnMute && Audio) {
      btnMute.textContent = Audio.isMuted() ? "Unmute" : "Mute";
    }
  }

  function onKey(e, down) {
    const k = e.key;
    if (down) ensureAudio();

    // Pause / resume always available (except pure gameover — use R)
    if (
      down &&
      (k === "Escape" || k === "p" || k === "P" || k === "Pause")
    ) {
      if (game.phase !== "gameover") {
        toggleUserPause();
        e.preventDefault();
        return;
      }
    }

    const binds =
      (Meta && Meta.loadSettings && Meta.loadSettings().keybinds) ||
      (Meta && Meta.DEFAULT_KEYBINDS) ||
      null;
    function match(action) {
      if (Meta && Meta.keyMatches) return Meta.keyMatches(binds, action, k);
      const fb = {
        left: ["ArrowLeft", "a", "A"],
        right: ["ArrowRight", "d", "D"],
        jump: ["ArrowUp", "w", "W", " "],
        slack: ["Tab", "e", "E"],
        mute: ["m", "M"],
      };
      const list = fb[action] || [];
      for (let i = 0; i < list.length; i++) if (list[i] === k) return true;
      return false;
    }

    if (userPaused) {
      if (down && (k === "r" || k === "R")) {
        restart();
        e.preventDefault();
        return;
      }
      if (down && (k === "q" || k === "Q")) {
        abandonRun();
        e.preventDefault();
        return;
      }
      if (down) e.preventDefault();
      return;
    }

    if (down && game.notifications.active) {
      if (k === "1") {
        replyByIndex(0);
        e.preventDefault();
        return;
      }
      if (k === "2") {
        replyByIndex(1);
        e.preventDefault();
        return;
      }
      if (k === "3") {
        replyByIndex(2);
        e.preventDefault();
        return;
      }
      if (k === "4") {
        replyByIndex(3);
        e.preventDefault();
        return;
      }
      if (k === "5") {
        replyByIndex(4);
        e.preventDefault();
        return;
      }
      if (match("jump") || match("left") || match("right")) {
        e.preventDefault();
        return;
      }
    }

    if (match("left")) keys.left = down;
    if (match("right")) keys.right = down;
    if (match("jump")) {
      if (down && !keys.jump) keys.jumpPressed = true;
      keys.jump = down;
      if (down) e.preventDefault();
    }
    if (down && match("slack")) {
      keys.openInbox = true;
      e.preventDefault();
    }
    if (down && (k === "r" || k === "R") && game.phase === "gameover") {
      restart();
    }
    if (down && (k === "s" || k === "S") && game.phase === "gameover") {
      shareCard();
      e.preventDefault();
    }
    if (down && match("mute") && Audio) {
      Audio.setMuted(!Audio.isMuted());
      if (Meta) Meta.saveSettings({ sfx: !Audio.isMuted() });
      updateHint();
      syncMobileChrome();
    }
    if (down && (k === "f" || k === "F") && !e.ctrlKey && !e.metaKey) {
      toggleFullscreen();
      e.preventDefault();
    }
  }

  function toggleFullscreen() {
    const el = document.documentElement;
    if (!document.fullscreenElement) {
      if (el.requestFullscreen) el.requestFullscreen().catch(function () {});
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }

  // Gamepad poll
  const padState = { left: false, right: false, jump: false, slack: false, pause: false };
  function pollGamepad() {
    if (!navigator.getGamepads) return;
    const pads = navigator.getGamepads();
    if (!pads) return;
    let gp = null;
    for (let i = 0; i < pads.length; i++) {
      if (pads[i]) {
        gp = pads[i];
        break;
      }
    }
    if (!gp) return;
    const ax = gp.axes[0] || 0;
    const left = ax < -0.4 || (gp.buttons[14] && gp.buttons[14].pressed);
    const right = ax > 0.4 || (gp.buttons[15] && gp.buttons[15].pressed);
    const jump = (gp.buttons[0] && gp.buttons[0].pressed) || (gp.buttons[1] && gp.buttons[1].pressed);
    const slack = gp.buttons[2] && gp.buttons[2].pressed;
    const pause = gp.buttons[9] && gp.buttons[9].pressed;
    keys.left = keys.left || left;
    keys.right = keys.right || right;
    if (jump && !padState.jump) keys.jumpPressed = true;
    keys.jump = keys.jump || jump;
    if (slack && !padState.slack) keys.openInbox = true;
    if (pause && !padState.pause) toggleUserPause();
    padState.left = left;
    padState.right = right;
    padState.jump = jump;
    padState.slack = slack;
    padState.pause = pause;
  }

  window.addEventListener("keydown", function (e) {
    onKey(e, true);
  });
  window.addEventListener("keyup", function (e) {
    onKey(e, false);
  });

  // —— Touch / pointer controls ——
  function bindHold(el, which) {
    if (!el) return;
    function down(ev) {
      ensureAudio();
      ev.preventDefault();
      el.classList.add("held");
      if (which === "left") keys.left = true;
      if (which === "right") keys.right = true;
      if (which === "jump") {
        if (!keys.jump) keys.jumpPressed = true;
        keys.jump = true;
      }
    }
    function up(ev) {
      if (ev) ev.preventDefault();
      el.classList.remove("held");
      if (which === "left") keys.left = false;
      if (which === "right") keys.right = false;
      if (which === "jump") keys.jump = false;
    }
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointerleave", up);
    el.addEventListener("pointercancel", up);
    // Prevent context menu / scroll on long-press
    el.addEventListener("contextmenu", function (e) {
      e.preventDefault();
    });
  }

  function bindTap(el, fn) {
    if (!el) return;
    el.addEventListener("pointerdown", function (ev) {
      ensureAudio();
      ev.preventDefault();
      fn();
    });
    el.addEventListener("contextmenu", function (e) {
      e.preventDefault();
    });
  }

  document.querySelectorAll("#touch [data-hold]").forEach(function (el) {
    bindHold(el, el.getAttribute("data-hold"));
  });
  document.querySelectorAll("#touch [data-tap]").forEach(function (el) {
    const act = el.getAttribute("data-tap");
    bindTap(el, function () {
      if (act === "slack") {
        if (game.notifications.active) return;
        keys.openInbox = true;
      } else if (act === "pause") {
        toggleUserPause();
      } else if (act === "mute" && Audio) {
        Audio.setMuted(!Audio.isMuted());
        updateHint();
        syncMobileChrome();
      } else if (act === "restart") {
        if (game.phase === "gameover" || userPaused) restart();
      }
    });
  });
  if (btnPause) {
    btnPause.addEventListener("click", function () {
      ensureAudio();
      toggleUserPause();
    });
  }
  document.querySelectorAll("#slack-pad [data-reply]").forEach(function (el) {
    bindTap(el, function () {
      const id = el.getAttribute("data-reply");
      const note = game.notifications.active;
      if (note && note.kind === "meeting") {
        const map = {
          dismiss: "accept",
          on_it: "decline",
          love: "tentative",
          pushback: "decline",
          quit: "quit",
        };
        reply(map[id] || id);
        return;
      }
      if (note && note.kind === "vent") {
        const map = {
          dismiss: "vent",
          on_it: "nod",
          love: "leave",
          pushback: "leave",
          quit: "quit",
        };
        reply(map[id] || id);
        return;
      }
      if (note && note.kind === "review") {
        const nonQuit = note.choices.filter(function (c) {
          return c.id !== "quit";
        });
        const idx = { dismiss: 0, on_it: 1, love: 2, pushback: 3 }[id];
        if (id === "quit") reply("quit");
        else if (nonQuit[idx]) reply(nonQuit[idx].id);
        return;
      }
      reply(id);
    });
  });

  // Prevent page scroll while using touch UI
  document.addEventListener(
    "touchmove",
    function (e) {
      if (e.target.closest && e.target.closest("#touch, #slack-pad, #game")) {
        e.preventDefault();
      }
    },
    { passive: false }
  );

  window.addEventListener(
    "pointerdown",
    function () {
      ensureAudio();
    },
    { once: false }
  );

  // Click Slack options drawn on the canvas (desktop mouse / trackpad)
  function canvasLogicCoords(ev) {
    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width / rect.width;
    const sy = canvas.height / rect.height;
    const px = (ev.clientX - rect.left) * sx;
    const py = (ev.clientY - rect.top) * sy;
    // Canvas is SCALE times logical playfield
    return {
      x: px / Render.SCALE,
      y: py / Render.SCALE,
    };
  }

  canvas.addEventListener("pointerdown", function (ev) {
    ensureAudio();
    if (!game.notifications.active) return;
    if (userPaused || tabPaused) return;
    const pt = canvasLogicCoords(ev);
    const id =
      Render.hitTestNotification &&
      Render.hitTestNotification(game.notifications.active, pt.x, pt.y);
    if (id) {
      ev.preventDefault();
      reply(id);
      // brief pointer feedback
      canvas.style.cursor = "pointer";
    }
  });

  canvas.addEventListener("pointermove", function (ev) {
    if (!game.notifications.active || !Render.hitTestNotification) {
      canvas.style.cursor = "";
      return;
    }
    const pt = canvasLogicCoords(ev);
    const id = Render.hitTestNotification(
      game.notifications.active,
      pt.x,
      pt.y
    );
    canvas.style.cursor = id ? "pointer" : "default";
  });

  function frame(ts) {
    if (tabPaused || document.hidden) {
      last = 0;
      rafId = 0;
      return;
    }

    if (!last) last = ts;
    let dt = (ts - last) / 1000;
    last = ts;
    if (dt > 0.05) dt = 0.05;

    pollGamepad();

    if (userPaused) {
      keys.jumpPressed = false;
      keys.openInbox = false;
      Render.draw(ctx, game);
      drawUserPauseOverlay(ctx);
      syncMobileChrome();
      canvas.dataset.userPaused = "1";
      canvas.dataset.painted = "1";
      rafId = requestAnimationFrame(frame);
      return;
    }

    const input = {
      left: keys.left,
      right: keys.right,
      jump: keys.jumpPressed,
      openInbox: keys.openInbox,
    };
    keys.jumpPressed = false;
    keys.openInbox = false;

    Game.step(game, input, dt);
    if (Audio && game.events && game.events.length) {
      Audio.playEvents(game.events);
      // BGM mood on deploy / storm
      for (let ei = 0; ei < game.events.length; ei++) {
        if (game.events[ei].type === "deploy") syncBgmMood();
      }
      game.events = [];
    }
    Render.draw(ctx, game);
    syncMobileChrome();

    canvas.dataset.painted = "1";
    canvas.dataset.tabPaused = "0";
    canvas.dataset.userPaused = "0";
    canvas.dataset.sprint = String(game.sprint);
    canvas.dataset.lives = String(game.lives);
    canvas.dataset.phase = game.phase;
    canvas.dataset.playerX = String(Math.round(game.player.x));
    canvas.dataset.inbox = String(
      (game.notifications.inbox && game.notifications.inbox.length) || 0
    );

    rafId = requestAnimationFrame(frame);
  }

  document.addEventListener("visibilitychange", function () {
    setTabPaused(document.hidden);
  });
  window.addEventListener("blur", function () {
    if (document.hidden) setTabPaused(true);
  });
  window.addEventListener("focus", function () {
    if (!document.hidden && tabPaused) setTabPaused(false);
  });
  window.addEventListener("resize", function () {
    syncMobileChrome();
  });

  function updateHint() {
    const hint = document.getElementById("hint");
    if (!hint) return;
    const mute = Audio && Audio.isMuted() ? " · sound OFF" : "";
    if (isCoarse()) {
      hint.textContent =
        "◀▶ move · JUMP · ❚❚ pause · Slack · Settings for difficulty" + mute;
    } else {
      hint.innerHTML =
        '<span class="desk-hint">A/D move · W/Space jump · Esc/P pause · Tab/E Slack · click or 1–5 to reply · M mute</span>' +
        mute;
    }
  }

  wireSettings();
  updateBestLine();
  applyAudioPrefs();
  Render.draw(ctx, game);
  canvas.dataset.painted = "1";
  canvas.dataset.tabPaused = tabPaused ? "1" : "0";
  updateHint();
  syncMobileChrome();
  if (!tabPaused) {
    rafId = requestAnimationFrame(frame);
  } else {
    drawTabPauseOverlay(ctx);
  }

  window.BossSays = {
    getGame: function () {
      return game;
    },
    isTabPaused: function () {
      return tabPaused || document.hidden;
    },
    isUserPaused: function () {
      return userPaused;
    },
    isSimPaused: isSimPaused,
    pause: function () {
      setUserPaused(true);
    },
    resume: function () {
      setUserPaused(false);
    },
    togglePause: toggleUserPause,
    abandon: abandonRun,
    continueRun: tryContinue,
    toggleFullscreen: toggleFullscreen,
    showAchievements: showAchievements,
    showBoard: showBoard,
    isMobileUi: isCoarse,
    restart: restart,
    shareCard: shareCard,
    step: function (input, dt) {
      return Game.step(game, input, dt || 1 / 60);
    },
    choose: function (id) {
      return Game.chooseNotification(game, id);
    },
    openSlack: function () {
      return Game.openSlack(game);
    },
    forceNotify: function () {
      game.notifications.timeSince = 999;
      Game.step(game, {}, 0.016);
      if (Audio && game.events) Audio.playEvents(game.events);
      syncMobileChrome();
      return (
        game.notifications.inbox[game.notifications.inbox.length - 1] || null
      );
    },
    unlockAudio: ensureAudio,
    Audio: Audio,
    Game: Game,
    Render: Render,
    Meta: Meta,
  };
})();
