"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const Meta = require("../js/meta.js");
const Fx = require("../js/fx.js");
const Game = require("../js/game.js");

describe("meta", () => {
  it("daily seed is YYYYMMDD integer", () => {
    const d = new Date(Date.UTC(2026, 7, 12)); // Aug 12 2026 local-ish
    const seed = Meta.dailySeed(d);
    assert.equal(typeof seed, "number");
    assert.ok(seed >= 20260101);
  });

  it("mulberry32 is deterministic", () => {
    const a = Meta.mulberry32(42);
    const b = Meta.mulberry32(42);
    assert.equal(a(), b());
    assert.equal(a(), b());
  });

  it("difficulty table has chill/mid/toxic", () => {
    assert.ok(Meta.DIFFICULTY.chill.slackMul > Meta.DIFFICULTY.toxic.slackMul);
    assert.ok(Meta.DIFFICULTY.toxic.enemySpeedMul > 1);
  });
});

describe("fx", () => {
  it("creates and ticks particles/floats", () => {
    const fx = Fx.createFx();
    Fx.shake(fx, 0.5);
    Fx.flash(fx, "#fff", 0.3);
    Fx.addFloat(fx, 10, 10, "+1", "#fff");
    Fx.addParticles(fx, 0, 0, "#f00", 5);
    Fx.addToast(fx, "Hi", "there");
    assert.ok(fx.particles.length === 5);
    assert.ok(fx.floats.length === 1);
    Fx.tick(fx, 0.5, false);
    assert.ok(fx.shake < 0.5);
    Fx.tick(fx, 5, true);
    assert.equal(fx.shake, 0);
  });
});

describe("combo / political / powerups / storm", () => {
  it("stomp builds combo and score", () => {
    const map = require("../js/map.js").createOfficeMap();
    map.enemySpawns = [
      { x: 100, y: map.groundY - 28, vx: 0 },
      { x: 160, y: map.groundY - 28, vx: 0 },
    ];
    const game = Game.createGame({
      map: map,
      skipTutorial: true,
      settings: { tutorialDone: true },
    });
    for (let i = 0; i < 20; i++) Game.step(game, {}, 1 / 60);
    const score0 = game.score;
    const e = game.enemies[0];
    game.player.x = e.x;
    game.player.y = e.y - game.player.h + 4;
    game.player.vy = 200;
    game.player.invuln = 0;
    Game.step(game, {}, 1 / 60);
    assert.ok(game.combo >= 1);
    assert.ok(game.score > score0);
  });

  it("love reply raises political capital", () => {
    const game = Game.createGame({
      skipTutorial: true,
      settings: { tutorialDone: true },
    });
    const before = game.political;
    game.notifications.timeSince = 999;
    Game.step(game, {}, 0.05);
    Game.step(game, { openInbox: true }, 0.05);
    assert.ok(game.notifications.active);
    Game.chooseNotification(game, "love");
    assert.ok(game.political > before);
  });

  it("focus powerup mutes slack arrivals", () => {
    const game = Game.createGame({
      skipTutorial: true,
      settings: { tutorialDone: true },
      mode: "normal",
    });
    game.effects.focusTimer = 5;
    game.notifications.timeSince = 0;
    const inbox0 = game.notifications.inbox.length;
    for (let i = 0; i < 120; i++) Game.step(game, {}, 0.1);
    assert.equal(game.notifications.inbox.length, inbox0);
  });

  it("startStorm floods projectiles and inbox", () => {
    const game = Game.createGame({ skipTutorial: true });
    Game.startStorm(game);
    assert.ok(game.stormTimer > 0);
    assert.ok(game.projectiles.length > 0);
  });

  it("noslack mode does not enqueue slack", () => {
    const game = Game.createGame({
      mode: "noslack",
      skipTutorial: true,
    });
    for (let i = 0; i < 100; i++) Game.step(game, {}, 0.2);
    assert.equal(game.notifications.inbox.length, 0);
  });

  it("daily mode uses seed", () => {
    const seed = Meta.dailySeed(new Date(2026, 5, 1));
    const a = Game.createGame({
      mode: "daily",
      seed: seed,
      skipTutorial: true,
    });
    const b = Game.createGame({
      mode: "daily",
      seed: seed,
      skipTutorial: true,
    });
    assert.equal(a.seed, b.seed);
    assert.equal(a.map.brand, b.map.brand);
  });

  it("tech debt rises on deploy", () => {
    const game = Game.createGame({ skipTutorial: true });
    const d0 = game.techDebt;
    Game.advanceSprint(game);
    assert.ok(game.techDebt > d0);
    assert.equal(game.sprint, 2);
  });

  it("applyPowerup focus sets timer", () => {
    const game = Game.createGame({ skipTutorial: true });
    Game.applyPowerup(game, "focus");
    assert.ok(game.effects.focusTimer >= 12);
  });
});
