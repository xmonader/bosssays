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
  };

  let game = Game.createGame();
  let last = 0;
  let rafId = 0;
  let audioReady = false;

  const canvas = document.getElementById("game");
  if (!canvas) {
    document.body.innerHTML =
      "<p>Missing #game canvas. Open index.html from this folder.</p>";
    return;
  }
  const ctx = canvas.getContext("2d");
  canvas.width = Render.VIEW_W;
  canvas.height = Render.VIEW_H;

  function ensureAudio() {
    if (!Audio || audioReady) return;
    if (Audio.unlock()) {
      audioReady = true;
      Audio.startBgm();
    }
  }

  function restart() {
    game = Game.createGame();
    last = 0;
    ensureAudio();
    if (Audio) Audio.play("reply");
  }

  function onKey(e, down) {
    const k = e.key;
    if (down) ensureAudio();

    if (k === "ArrowLeft" || k === "a" || k === "A") keys.left = down;
    if (k === "ArrowRight" || k === "d" || k === "D") keys.right = down;
    if (k === "ArrowUp" || k === "w" || k === "W" || k === " ") {
      if (down && !keys.jump) keys.jumpPressed = true;
      keys.jump = down;
      if (down) e.preventDefault();
    }
    if (down && (k === "r" || k === "R") && game.phase === "gameover") {
      restart();
    }
    // Mute toggle
    if (down && (k === "m" || k === "M") && Audio) {
      Audio.setMuted(!Audio.isMuted());
      updateHint();
    }
    // Notification choices 1-4
    if (down && game.notifications.active) {
      const map = { "1": "dismiss", "2": "on_it", "3": "love", "4": "pushback" };
      if (map[k]) {
        game.events = [];
        Game.chooseNotification(game, map[k]);
        if (Audio) Audio.playEvents(game.events);
        game.events = [];
      }
    }
  }

  window.addEventListener("keydown", function (e) {
    onKey(e, true);
  });
  window.addEventListener("keyup", function (e) {
    onKey(e, false);
  });
  // Unlock on first pointer too (browser autoplay policy)
  window.addEventListener(
    "pointerdown",
    function () {
      ensureAudio();
    },
    { once: false }
  );

  function frame(ts) {
    if (!last) last = ts;
    let dt = (ts - last) / 1000;
    last = ts;
    if (dt > 0.05) dt = 0.05;

    const input = {
      left: keys.left,
      right: keys.right,
      jump: keys.jumpPressed,
    };
    keys.jumpPressed = false;

    Game.step(game, input, dt);
    if (Audio && game.events && game.events.length) {
      Audio.playEvents(game.events);
      game.events = [];
    }
    Render.draw(ctx, game);

    // Paint fingerprint for headless checks
    canvas.dataset.painted = "1";
    canvas.dataset.sprint = String(game.sprint);
    canvas.dataset.lives = String(game.lives);
    canvas.dataset.phase = game.phase;
    canvas.dataset.playerX = String(Math.round(game.player.x));

    rafId = requestAnimationFrame(frame);
  }

  function updateHint() {
    const hint = document.getElementById("hint");
    if (!hint) return;
    const mute = Audio && Audio.isMuted() ? " · sound OFF (M)" : " · M mute";
    hint.textContent =
      "← → / A D move · Space / W jump · 1–4 reply to Slack · R restart after layoff" +
      mute;
  }

  // Start
  Render.draw(ctx, game);
  canvas.dataset.painted = "1";
  updateHint();
  rafId = requestAnimationFrame(frame);

  // Debug / test hooks
  window.BossSays = {
    getGame: function () {
      return game;
    },
    restart: restart,
    step: function (input, dt) {
      return Game.step(game, input, dt || 1 / 60);
    },
    choose: function (id) {
      return Game.chooseNotification(game, id);
    },
    forceNotify: function () {
      game.notifications.timeSince = 999;
      Game.step(game, {}, 0.016);
      if (Audio && game.events) Audio.playEvents(game.events);
      return game.notifications.active;
    },
    unlockAudio: ensureAudio,
    Audio: Audio,
    Game: Game,
    Render: Render,
  };
})();
