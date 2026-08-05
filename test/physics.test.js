"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const Physics = require("../js/physics.js");

describe("physics", () => {
  it("applies gravity so player falls when airborne", () => {
    const body = Physics.createBody(0, 0, 20, 30);
    const floor = [{ x: -100, y: 200, w: 400, h: 40 }];
    Physics.stepBody(body, {}, floor, 1 / 60);
    assert.ok(body.vy > 0, "vy should increase under gravity");
    assert.equal(body.onGround, false);
  });

  it("lands on platform and sets onGround", () => {
    const body = Physics.createBody(10, 0, 20, 30);
    body.vy = 0;
    const floor = [{ x: 0, y: 100, w: 200, h: 40 }];
    // simulate until land
    for (let i = 0; i < 120; i++) {
      Physics.stepBody(body, {}, floor, 1 / 60);
    }
    assert.equal(body.onGround, true);
    assert.ok(Math.abs(body.y + body.h - floor[0].y) < 0.5);
    assert.ok(body.vy === 0 || Math.abs(body.vy) < 1);
  });

  it("jumps only when onGround", () => {
    const body = Physics.createBody(10, 70, 20, 30);
    const floor = [{ x: 0, y: 100, w: 200, h: 40 }];
    // settle
    for (let i = 0; i < 30; i++) Physics.stepBody(body, {}, floor, 1 / 60);
    assert.equal(body.onGround, true);
    const yBefore = body.y;
    Physics.stepBody(body, { jump: true }, floor, 1 / 60);
    assert.ok(body.vy < 0, "jump should set upward velocity");
    assert.equal(body.onGround, false);
    // mid-air jump ignored
    const vyMid = body.vy;
    Physics.stepBody(body, { jump: true }, floor, 1 / 60);
    // gravity still applied; should not get another full jump boost
    assert.ok(body.vy > vyMid - 1, "no double jump boost");
    assert.ok(body.y <= yBefore);
  });

  it("jump reaches low and mid office platforms from the side", () => {
    const groundY = 420;
    const h = 36;
    // Start clear of platform so jump is not blocked by ceiling collision
    const body = Physics.createBody(100, groundY - h, 28, h);
    const low = { x: 180, y: 355, w: 110, h: 14 };
    const mid = { x: 340, y: 300, w: 100, h: 14 };
    const floor = [{ x: 0, y: groundY, w: 900, h: 60 }, low, mid];
    for (let i = 0; i < 20; i++) Physics.stepBody(body, {}, floor, 1 / 60);
    assert.equal(body.onGround, true);
    Physics.stepBody(body, { jump: true, right: true }, floor, 1 / 60);
    let landedLow = false;
    for (let i = 0; i < 100; i++) {
      Physics.stepBody(body, { right: true }, floor, 1 / 60);
      if (body.onGround && Math.abs(body.y + body.h - low.y) < 1) {
        landedLow = true;
        break;
      }
    }
    assert.equal(landedLow, true, "should land on low desk (~65px)");

    Physics.stepBody(body, { jump: true, right: true }, floor, 1 / 60);
    let landedMid = false;
    for (let i = 0; i < 100; i++) {
      Physics.stepBody(body, { right: true }, floor, 1 / 60);
      if (body.onGround && Math.abs(body.y + body.h - mid.y) < 1) {
        landedMid = true;
        break;
      }
    }
    assert.equal(landedMid, true, "should step low→mid (~55px more)");
  });

  it("moves horizontally with left/right input", () => {
    const body = Physics.createBody(50, 70, 20, 30);
    const floor = [{ x: 0, y: 100, w: 400, h: 40 }];
    for (let i = 0; i < 10; i++) Physics.stepBody(body, {}, floor, 1 / 60);
    const x0 = body.x;
    for (let i = 0; i < 30; i++) {
      Physics.stepBody(body, { right: true }, floor, 1 / 60);
    }
    assert.ok(body.x > x0 + 20, "should move right");
    const x1 = body.x;
    for (let i = 0; i < 30; i++) {
      Physics.stepBody(body, { left: true }, floor, 1 / 60);
    }
    assert.ok(body.x < x1 - 20, "should move left");
  });

  it("aabb detects overlap", () => {
    assert.equal(
      Physics.aabb({ x: 0, y: 0, w: 10, h: 10 }, { x: 5, y: 5, w: 10, h: 10 }),
      true
    );
    assert.equal(
      Physics.aabb({ x: 0, y: 0, w: 10, h: 10 }, { x: 20, y: 20, w: 5, h: 5 }),
      false
    );
  });

  it("stunned body does not move from input", () => {
    const body = Physics.createBody(50, 70, 20, 30);
    const floor = [{ x: 0, y: 100, w: 400, h: 40 }];
    for (let i = 0; i < 10; i++) Physics.stepBody(body, {}, floor, 1 / 60);
    const x0 = body.x;
    for (let i = 0; i < 20; i++) {
      Physics.stepBody(
        body,
        { right: true, jump: true },
        floor,
        1 / 60,
        { stunned: true }
      );
    }
    assert.ok(Math.abs(body.x - x0) < 1);
  });
});
