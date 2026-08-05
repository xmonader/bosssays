/**
 * Browser entry: keyboard input + rAF loop + canvas.
 * Exposes window.BossSays for tests / debug hooks.
 */
(function () {
  "use strict";

  const Game = window.BossSaysGame;
  const Render = window.BossSaysRender;

  const keys = {
    left: false,
    right: false,
    jump: false,
    jumpPressed: false,
  };

  let game = Game.createGame();
  let last = 0;
  let rafId = 0;

  const canvas = document.getElementById("game");
  if (!canvas) {
    document.body.innerHTML =
      "<p>Missing #game canvas. Open index.html from this folder.</p>";
    return;
  }
  const ctx = canvas.getContext("2d");
  canvas.width = Render.VIEW_W;
  canvas.height = Render.VIEW_H;

  function restart() {
    game = Game.createGame();
    last = 0;
  }

  function onKey(e, down) {
    const k = e.key;
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
    // Notification choices 1-4
    if (down && game.notifications.active) {
      const map = { "1": "dismiss", "2": "on_it", "3": "love", "4": "pushback" };
      if (map[k]) {
        Game.chooseNotification(game, map[k]);
      }
    }
  }

  window.addEventListener("keydown", function (e) {
    onKey(e, true);
  });
  window.addEventListener("keyup", function (e) {
    onKey(e, false);
  });

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
    Render.draw(ctx, game);

    // Paint fingerprint for headless checks
    canvas.dataset.painted = "1";
    canvas.dataset.sprint = String(game.sprint);
    canvas.dataset.lives = String(game.lives);
    canvas.dataset.phase = game.phase;
    canvas.dataset.playerX = String(Math.round(game.player.x));

    rafId = requestAnimationFrame(frame);
  }

  // Start
  Render.draw(ctx, game);
  canvas.dataset.painted = "1";
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
      return game.notifications.active;
    },
    Game: Game,
    Render: Render,
  };

  const hint = document.getElementById("hint");
  if (hint) {
    hint.textContent =
      "← → / A D move · Space / W jump · 1–4 reply to Slack · R restart after layoff";
  }
})();
