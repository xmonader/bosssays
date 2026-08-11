/**
 * Browser entry: keyboard input + rAF loop + canvas + audio.
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

  function clearHeldKeys() {
    keys.left = false;
    keys.right = false;
    keys.jump = false;
    keys.jumpPressed = false;
    keys.openInbox = false;
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
      // Freeze frame with overlay so resume isn't a black gap
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

  function onKey(e, down) {
    const k = e.key;
    if (down) ensureAudio();

    // While reading Slack: 1–4 corporate, 5 = nuclear quit (never Space)
    if (down && game.notifications.active) {
      const map = {
        "1": "dismiss",
        "2": "on_it",
        "3": "love",
        "4": "pushback",
        "5": "quit",
      };
      if (map[k]) {
        game.events = [];
        Game.chooseNotification(game, map[k]);
        if (Audio) Audio.playEvents(game.events);
        game.events = [];
        e.preventDefault();
        return;
      }
      // Swallow movement keys while reading so you don't "buffer" a jump into a pit
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
    // Open Slack inbox when player chooses (Tab or E)
    if (down && (k === "Tab" || k === "e" || k === "E")) {
      keys.openInbox = true;
      e.preventDefault();
    }
    if (down && (k === "r" || k === "R") && game.phase === "gameover") {
      restart();
    }
    // Mute toggle
    if (down && (k === "m" || k === "M") && Audio) {
      Audio.setMuted(!Audio.isMuted());
      updateHint();
    }
  }

  window.addEventListener("keydown", function (e) {
    onKey(e, true);
  });
  window.addEventListener("keyup", function (e) {
    onKey(e, false);
  });
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
    // Clamp hard after resume so long background gaps don't teleport physics
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
  // Extra safety for some browsers when window loses focus
  window.addEventListener("blur", function () {
    if (document.hidden) setTabPaused(true);
  });
  window.addEventListener("focus", function () {
    if (!document.hidden && tabPaused) setTabPaused(false);
  });

  function updateHint() {
    const hint = document.getElementById("hint");
    if (!hint) return;
    const mute = Audio && Audio.isMuted() ? " · sound OFF (M)" : " · M mute";
    hint.textContent =
      "A/D move · W/Space jump · Tab/E Slack · 1–4 reply · 5 FUCK YOU I QUIT · M mute" +
      mute;
  }

  Render.draw(ctx, game);
  canvas.dataset.painted = "1";
  canvas.dataset.tabPaused = tabPaused ? "1" : "0";
  updateHint();
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
      return game.notifications.inbox[
        game.notifications.inbox.length - 1
      ] || null;
    },
    unlockAudio: ensureAudio,
    Audio: Audio,
    Game: Game,
    Render: Render,
  };
})();
