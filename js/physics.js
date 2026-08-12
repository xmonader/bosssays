/**
 * Pure platformer physics — AABB, gravity, jump, double-jump, wall-jump.
 * Works in browser (global) and Node (module.exports).
 */
(function (root) {
  "use strict";

  const GRAVITY = 1700;
  const MOVE_SPEED = 240;
  // ~135px peak height — enough to clear low desks and step up mid platforms
  const JUMP_VELOCITY = -680;
  const WALL_JUMP_VX = 260;
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
      touchingWall: 0, // -1 left wall, 1 right wall
      jumpsLeft: 1,
      maxJumps: 1,
      wallJump: false,
    };
  }

  /**
   * Apply horizontal intent and gravity for dt seconds.
   * @param {object} body
   * @param {{left?:boolean,right?:boolean,jump?:boolean}} input
   * @param {number} dt
   * @param {object} opts moveSpeed, jumpVelocity, gravity, stunned, slowFactor,
   *   canDoubleJump, canWallJump
   */
  function integrate(body, input, dt, opts) {
    opts = opts || {};
    const moveSpeed = opts.moveSpeed != null ? opts.moveSpeed : MOVE_SPEED;
    const jumpVel = opts.jumpVelocity != null ? opts.jumpVelocity : JUMP_VELOCITY;
    const gravity = opts.gravity != null ? opts.gravity : GRAVITY;
    const slow = opts.slowFactor != null ? opts.slowFactor : 1;
    const stunned = !!opts.stunned;
    const canDouble = !!opts.canDoubleJump;
    const canWall = !!opts.canWallJump || !!body.wallJump;

    body.maxJumps = canDouble ? 2 : 1;
    if (body.onGround) {
      body.jumpsLeft = body.maxJumps;
    }

    if (stunned) {
      body.vx = 0;
    } else {
      let dir = 0;
      if (input.left) dir -= 1;
      if (input.right) dir += 1;
      body.vx = dir * moveSpeed * slow;

      if (input.jump) {
        let jumped = false;
        // Wall jump first if clinging
        if (
          canWall &&
          !body.onGround &&
          body.touchingWall !== 0 &&
          body.jumpsLeft > 0
        ) {
          body.vy = jumpVel * 0.95;
          body.vx = -body.touchingWall * WALL_JUMP_VX * slow;
          body.jumpsLeft = Math.max(0, body.jumpsLeft - 1);
          body.onGround = false;
          jumped = true;
        } else if (body.onGround || body.jumpsLeft > 0) {
          body.vy = jumpVel;
          if (!body.onGround) {
            body.jumpsLeft = Math.max(0, body.jumpsLeft - 1);
          } else {
            body.jumpsLeft = Math.max(0, body.maxJumps - 1);
          }
          body.onGround = false;
          jumped = true;
        }
        if (jumped) body._didJump = true;
      }
    }

    // Slight wall slide
    let g = gravity;
    if (canWall && !body.onGround && body.touchingWall !== 0 && body.vy > 0) {
      g *= 0.45;
    }
    body.vy += g * dt;
    if (body.vy > MAX_FALL) body.vy = MAX_FALL;
  }

  /**
   * Move body by velocity and resolve solid platform collisions.
   */
  function moveAndCollide(body, platforms, dt) {
    body.onGround = false;
    body.touchingWall = 0;

    // Horizontal
    body.x += body.vx * dt;
    for (let i = 0; i < platforms.length; i++) {
      const p = platforms[i];
      if (!aabb(body, p)) continue;
      if (body.vx > 0 || (body.vx === 0 && body.x + body.w / 2 < p.x + p.w / 2)) {
        // prefer right collision if moving right
      }
      if (body.vx >= 0 && body.x + body.w > p.x && body.x < p.x) {
        body.x = p.x - body.w;
        body.vx = 0;
        body.touchingWall = 1;
      } else if (body.vx <= 0 && body.x < p.x + p.w && body.x + body.w > p.x + p.w) {
        body.x = p.x + p.w;
        body.vx = 0;
        body.touchingWall = -1;
      } else if (body.vx > 0) {
        body.x = p.x - body.w;
        body.vx = 0;
        body.touchingWall = 1;
      } else if (body.vx < 0) {
        body.x = p.x + p.w;
        body.vx = 0;
        body.touchingWall = -1;
      }
    }

    // Vertical
    body.y += body.vy * dt;
    for (let i = 0; i < platforms.length; i++) {
      const p = platforms[i];
      if (!aabb(body, p)) continue;
      if (body.vy > 0) {
        body.y = p.y - body.h;
        body.vy = 0;
        body.onGround = true;
        body.jumpsLeft = body.maxJumps != null ? body.maxJumps : 1;
      } else if (body.vy < 0) {
        body.y = p.y + p.h;
        body.vy = 0;
      }
    }
  }

  function stepBody(body, input, platforms, dt, opts) {
    body._didJump = false;
    integrate(body, input, dt, opts);
    moveAndCollide(body, platforms, dt);
    return body;
  }

  const API = {
    GRAVITY: GRAVITY,
    MOVE_SPEED: MOVE_SPEED,
    JUMP_VELOCITY: JUMP_VELOCITY,
    WALL_JUMP_VX: WALL_JUMP_VX,
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
