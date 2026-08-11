/**
 * Browser entry: keyboard + touch, rAF loop, canvas, audio, tab pause.
 * Exposes window.BossSays for tests / debug hooks.
 */
(function () {
  "use strict";

  const Game = window.BossSaysGame;
  const Render = window.BossSaysRender;
  const Audio = window.BossSaysAudio;

  const keys = {
    left: false,
    right: false,
    jump: false,
    jumpPressed: false,
    openInbox: false,
  };

  let game = Game.createGame();
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

  function ensureAudio() {
    if (!Audio || audioReady) return;
    if (Audio.unlock()) {
      audioReady = true;
      if (!tabPaused) Audio.startBgm();
    }
  }

  function restart() {
    game = Game.createGame();
    last = 0;
    ensureAudio();
    if (Audio) Audio.play("reply");
    syncMobileChrome();
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
    if (down && (k === "m" || k === "M") && Audio) {
      Audio.setMuted(!Audio.isMuted());
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
        "◀▶ move · JUMP · Slack opens inbox · reply buttons when reading" +
        mute;
    } else {
      hint.innerHTML =
        '<span class="desk-hint">A/D move · W/Space jump · Tab/E Slack · 1–4 reply · 5 QUIT · M mute</span>' +
        mute;
    }
  }

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
  };
})();
