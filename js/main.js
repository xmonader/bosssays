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

  function restart(opts) {
    game = Game.createGame(startOpts(opts || {}));
    last = 0;
    ensureAudio();
    if (Audio && loadSettings().sfx !== false) Audio.play("reply");
    syncMobileChrome();
    updateBestLine();
  }

  function shareCard() {
    const g = game;
    const lines = [
      "Boss Says — run card",
      "Score: " + (g.score || 0) + " SP",
      "Sprint " + g.sprint + " · Deploys " + g.deploys,
      "Best combo x" + (g.bestCombo || 0),
      "Pol " + Math.round(g.political || 0) + " · Debt " + Math.round(g.techDebt || 0),
      "Mode " + (g.mode || "normal") + " / " + (g.difficulty || "mid"),
      g.endReason ? "End: " + g.endReason : "Still employed (somehow)",
      "https://xmonader.github.io/bosssays/",
    ];
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
        Meta.saveSettings({
          difficulty: diff ? diff.value : "mid",
          compactHud: compact ? compact.checked : false,
          reduceMotion: motion ? motion.checked : false,
          colorblind: cb ? cb.checked : false,
          sfx: sfx ? sfx.checked : true,
          bgm: bgm ? bgm.checked : true,
        });
        if (Audio) {
          Audio.setMuted(!(sfx && sfx.checked));
          if (bgm && !bgm.checked) Audio.stopBgm();
          else if (audioReady && sfx && sfx.checked) Audio.startBgm();
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
  }

  function reply(choiceId) {
    if (!game.notifications.active) return;
    game.events = [];
    Game.chooseNotification(game, choiceId);
    if (Audio) Audio.playEvents(game.events);
    game.events = [];
    syncMobileChrome();
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
      if (reading && isCoarse()) slackPad.classList.add("open");
      else slackPad.classList.remove("open");
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

    if (down && game.notifications.active) {
      const map = {
        "1": "dismiss",
        "2": "on_it",
        "3": "love",
        "4": "pushback",
        "5": "quit",
      };
      if (map[k]) {
        reply(map[k]);
        e.preventDefault();
        return;
      }
      if (
        k === " " ||
        k === "ArrowUp" ||
        k === "w" ||
        k === "W" ||
        k === "ArrowLeft" ||
        k === "ArrowRight" ||
        k === "a" ||
        k === "A" ||
        k === "d" ||
        k === "D"
      ) {
        e.preventDefault();
        return;
      }
    }

    if (k === "ArrowLeft" || k === "a" || k === "A") keys.left = down;
    if (k === "ArrowRight" || k === "d" || k === "D") keys.right = down;
    if (k === "ArrowUp" || k === "w" || k === "W" || k === " ") {
      if (down && !keys.jump) keys.jumpPressed = true;
      keys.jump = down;
      if (down) e.preventDefault();
    }
    if (down && (k === "Tab" || k === "e" || k === "E")) {
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
    if (down && (k === "m" || k === "M") && Audio) {
      Audio.setMuted(!Audio.isMuted());
      if (Meta) Meta.saveSettings({ sfx: !Audio.isMuted() });
      updateHint();
      syncMobileChrome();
    }
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
      } else if (act === "mute" && Audio) {
        Audio.setMuted(!Audio.isMuted());
        updateHint();
        syncMobileChrome();
      } else if (act === "restart") {
        if (game.phase === "gameover") restart();
      }
    });
  });
  document.querySelectorAll("#slack-pad [data-reply]").forEach(function (el) {
    bindTap(el, function () {
      reply(el.getAttribute("data-reply"));
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
      game.events = [];
    }
    Render.draw(ctx, game);
    syncMobileChrome();

    canvas.dataset.painted = "1";
    canvas.dataset.tabPaused = "0";
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
        "◀▶ move · JUMP · Slack · powerups FOC/OOP/★ · Settings for difficulty" +
        mute;
    } else {
      hint.innerHTML =
        '<span class="desk-hint">A/D move · W/Space jump · Tab/E Slack · 1–4 reply · 5 QUIT · M mute · S share (game over)</span>' +
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
