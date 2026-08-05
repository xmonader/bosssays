/**
 * Pure platformer physics — AABB collision, gravity, jump, horizontal move.
 * Works in browser (global) and Node (module.exports).
 */
(function (root) {
  "use strict";

  const GRAVITY = 1800;
  const MOVE_SPEED = 220;
  const JUMP_VELOCITY = -520;
  const MAX_FALL = 900;

  function aabb(a, b) {
    return (
      a.x < b.x + b.w &&
      a.x + a.w > b.x &&
      a.y < b.y + b.h &&
      a.y + a.h > b.y
    );
  }

  function createBody(x, y, w, h) {
    return {
      x: x,
      y: y,
      w: w,
      h: h,
      vx: 0,
      vy: 0,
      onGround: false,
    };
  }

  /**
   * Apply horizontal intent and gravity for dt seconds.
   * @param {object} body
   * @param {{left?:boolean,right?:boolean,jump?:boolean}} input
   * @param {number} dt
   * @param {{moveSpeed?:number, jumpVelocity?:number, gravity?:number, stunned?:boolean, slowFactor?:number}} opts
   */
  function integrate(body, input, dt, opts) {
    opts = opts || {};
    const moveSpeed = opts.moveSpeed != null ? opts.moveSpeed : MOVE_SPEED;
    const jumpVel = opts.jumpVelocity != null ? opts.jumpVelocity : JUMP_VELOCITY;
    const gravity = opts.gravity != null ? opts.gravity : GRAVITY;
    const slow = opts.slowFactor != null ? opts.slowFactor : 1;
    const stunned = !!opts.stunned;

    if (stunned) {
      body.vx = 0;
    } else {
      let dir = 0;
      if (input.left) dir -= 1;
      if (input.right) dir += 1;
      body.vx = dir * moveSpeed * slow;
      if (input.jump && body.onGround) {
        body.vy = jumpVel;
        body.onGround = false;
      }
    }

    body.vy += gravity * dt;
    if (body.vy > MAX_FALL) body.vy = MAX_FALL;
  }

  /**
   * Move body by velocity and resolve solid platform collisions.
   * Platforms are {x,y,w,h}. One-way from above only for floor feel.
   */
  function moveAndCollide(body, platforms, dt) {
    body.onGround = false;

    // Horizontal
    body.x += body.vx * dt;
    for (let i = 0; i < platforms.length; i++) {
      const p = platforms[i];
      if (!aabb(body, p)) continue;
      if (body.vx > 0) {
        body.x = p.x - body.w;
      } else if (body.vx < 0) {
        body.x = p.x + p.w;
      }
      body.vx = 0;
    }

    // Vertical
    body.y += body.vy * dt;
    for (let i = 0; i < platforms.length; i++) {
      const p = platforms[i];
      if (!aabb(body, p)) continue;
      if (body.vy > 0) {
        // Landing on top
        body.y = p.y - body.h;
        body.vy = 0;
        body.onGround = true;
      } else if (body.vy < 0) {
        // Hit ceiling
        body.y = p.y + p.h;
        body.vy = 0;
      }
    }
  }

  /**
   * Full player physics step.
   */
  function stepBody(body, input, platforms, dt, opts) {
    integrate(body, input, dt, opts);
    moveAndCollide(body, platforms, dt);
    return body;
  }

  const API = {
    GRAVITY: GRAVITY,
    MOVE_SPEED: MOVE_SPEED,
    JUMP_VELOCITY: JUMP_VELOCITY,
    MAX_FALL: MAX_FALL,
    aabb: aabb,
    createBody: createBody,
    integrate: integrate,
    moveAndCollide: moveAndCollide,
    stepBody: stepBody,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = API;
  }
  root.BossSaysPhysics = API;
})(typeof globalThis !== "undefined" ? globalThis : this);
