/**
 * Juice: screen shake, flash, particles, floating combat text.
 */
(function (root) {
  "use strict";

  function createFx() {
    return {
      shake: 0,
      flash: 0,
      flashColor: "#fff",
      particles: [],
      floats: [],
      toasts: [], // achievement / mode toasts
    };
  }

  function shake(fx, amount) {
    fx.shake = Math.max(fx.shake, amount || 0.25);
  }

  function flash(fx, color, amount) {
    fx.flash = Math.max(fx.flash, amount != null ? amount : 0.2);
    if (color) fx.flashColor = color;
  }

  function addFloat(fx, x, y, text, color) {
    fx.floats.push({
      x: x,
      y: y,
      text: text,
      color: color || "#f8fafc",
      ttl: 1.1,
      max: 1.1,
      vy: -40,
    });
  }

  function addParticles(fx, x, y, color, n) {
    n = n || 8;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 40 + Math.random() * 120;
      fx.particles.push({
        x: x,
        y: y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 30,
        ttl: 0.35 + Math.random() * 0.35,
        max: 0.7,
        color: color || "#fbbf24",
        size: 2 + Math.random() * 3,
      });
    }
  }

  function addToast(fx, title, body) {
    fx.toasts.push({
      title: title,
      body: body || "",
      ttl: 3.2,
      max: 3.2,
    });
  }

  function tick(fx, dt, reduceMotion) {
    if (reduceMotion) {
      fx.shake = 0;
      fx.flash = Math.max(0, fx.flash - dt * 4);
    } else {
      fx.shake = Math.max(0, fx.shake - dt * 2.2);
      fx.flash = Math.max(0, fx.flash - dt * 3.5);
    }

    const nextP = [];
    for (let i = 0; i < fx.particles.length; i++) {
      const p = fx.particles[i];
      p.ttl -= dt;
      if (p.ttl <= 0) continue;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 280 * dt;
      nextP.push(p);
    }
    fx.particles = nextP;

    const nextF = [];
    for (let i = 0; i < fx.floats.length; i++) {
      const f = fx.floats[i];
      f.ttl -= dt;
      if (f.ttl <= 0) continue;
      f.y += f.vy * dt;
      nextF.push(f);
    }
    fx.floats = nextF;

    const nextT = [];
    for (let i = 0; i < fx.toasts.length; i++) {
      const t = fx.toasts[i];
      t.ttl -= dt;
      if (t.ttl > 0) nextT.push(t);
    }
    fx.toasts = nextT;
  }

  const API = {
    createFx: createFx,
    shake: shake,
    flash: flash,
    addFloat: addFloat,
    addParticles: addParticles,
    addToast: addToast,
    tick: tick,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = API;
  }
  root.BossSaysFx = API;
})(typeof globalThis !== "undefined" ? globalThis : this);
