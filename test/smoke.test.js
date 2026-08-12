"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");

describe("scaffold smoke", () => {
  it("loads shipped modules", () => {
    const Physics = require("../js/physics.js");
    const Map = require("../js/map.js");
    const Notes = require("../js/notifications.js");
    const Game = require("../js/game.js");
    const Audio = require("../js/audio.js");
    assert.equal(typeof Physics.stepBody, "function");
    assert.equal(typeof Map.createOfficeMap, "function");
    assert.equal(typeof Notes.resolveNotification, "function");
    assert.equal(typeof Game.createGame, "function");
    assert.equal(typeof Audio.playEvents, "function");
    assert.ok(Audio.SFX_NAMES.includes("jump"));
    assert.ok(Audio.SFX_NAMES.includes("notify"));
    assert.ok(Audio.SFX_NAMES.includes("collect"));
  });

  it("index.html uses relative plain script tags (file:// safe)", () => {
    const html = fs.readFileSync(
      path.join(__dirname, "..", "index.html"),
      "utf8"
    );
    assert.match(html, /id=["']game["']/);
    assert.match(html, /src="js\/physics\.js"/);
    assert.match(html, /src="js\/game\.js"/);
    assert.match(html, /src="js\/audio\.js"/);
    assert.match(html, /src="js\/main\.js"/);
    assert.doesNotMatch(html, /type=["']module["']/);
  });

  it("main.js pauses simulation when the tab is hidden", () => {
    const main = fs.readFileSync(
      path.join(__dirname, "..", "js", "main.js"),
      "utf8"
    );
    assert.match(main, /visibilitychange/);
    assert.match(main, /document\.hidden/);
    assert.match(main, /setTabPaused/);
    assert.match(main, /tabPaused/);
  });

  it("render exposes Slack click hit-testing", () => {
    const render = require("../js/render.js");
    assert.equal(typeof render.hitTestNotification, "function");
    assert.equal(typeof render.getNotificationHitTargets, "function");
    const note = {
      kind: "slack",
      choices: [
        { id: "dismiss", label: "Mute" },
        { id: "on_it", label: "On it" },
        { id: "love", label: "Love" },
        { id: "pushback", label: "Push" },
        { id: "quit", label: "QUIT" },
      ],
      thread: [],
      timer: 10,
      maxTimer: 10,
    };
    const hits = render.getNotificationHitTargets(note);
    assert.ok(hits.length >= 4);
    const mid = hits[0];
    assert.equal(
      render.hitTestNotification(note, mid.x + mid.w / 2, mid.y + mid.h / 2),
      mid.id
    );
    assert.equal(render.hitTestNotification(note, 0, 0), null);
  });

  it("main.js supports user pause and abandon", () => {
    const main = fs.readFileSync(
      path.join(__dirname, "..", "js", "main.js"),
      "utf8"
    );
    assert.match(main, /userPaused/);
    assert.match(main, /setUserPaused|toggleUserPause/);
    assert.match(main, /Escape/);
    assert.match(main, /abandonRun|paused_out/);
    const html = fs.readFileSync(
      path.join(__dirname, "..", "index.html"),
      "utf8"
    );
    assert.match(html, /btn-pause/);
  });

  it("index has mobile touch controls and viewport meta", () => {
    const html = fs.readFileSync(
      path.join(__dirname, "..", "index.html"),
      "utf8"
    );
    assert.match(html, /viewport-fit=cover/);
    assert.match(html, /id="touch"/);
    assert.match(html, /data-hold="left"/);
    assert.match(html, /data-hold="jump"/);
    assert.match(html, /id="slack-pad"/);
    assert.match(html, /data-reply="quit"/);
    assert.match(html, /pointer:\s*coarse/);
  });

  it("main.js wires touch hold/tap handlers", () => {
    const main = fs.readFileSync(
      path.join(__dirname, "..", "js", "main.js"),
      "utf8"
    );
    assert.match(main, /bindHold/);
    assert.match(main, /bindTap/);
    assert.match(main, /syncMobileChrome/);
    assert.match(main, /data-hold/);
    assert.match(main, /data-reply/);
  });
});
