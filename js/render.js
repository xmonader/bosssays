/**
 * Canvas renderer — polished geometric office art (code-drawn sprites).
 */
(function (root) {
  "use strict";

  // Logical playfield (camera / world units). Canvas is scaled up for a bigger window.
  const LOGIC_W = 800;
  const LOGIC_H = 480;
  const SCALE = 1.6;
  const VIEW_W = Math.round(LOGIC_W * SCALE); // 1280 — canvas pixel width
  const VIEW_H = Math.round(LOGIC_H * SCALE); // 768 — canvas pixel height

  function rr(ctx, x, y, w, h, r) {
    r = Math.min(r || 4, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function clear(ctx, w, h, theme) {
    const sky = (theme && theme.sky) || ["#c8d8e8", "#e8eef4", "#d0d8e0"];
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, sky[0] || "#c8d8e8");
    g.addColorStop(0.45, sky[1] || sky[0]);
    g.addColorStop(1, sky[2] || sky[1] || sky[0]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    // soft ceiling lights
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    for (let i = 80; i < w; i += 140) {
      ctx.beginPath();
      ctx.ellipse(i, 28, 36, 10, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawPlatform(ctx, p, camX, theme) {
    const x = p.x - camX;
    const y = p.y;
    if (x + p.w < 0 || x > LOGIC_W) return;
    theme = theme || {};
    const accent = theme.accent || "#38bdf8";

    if (p.kind === "calendar") {
      // Zoom brick
      const g = ctx.createLinearGradient(x, y, x, y + p.h);
      g.addColorStop(0, "#60a5fa");
      g.addColorStop(1, "#1d4ed8");
      ctx.fillStyle = g;
      rr(ctx, x, y, p.w, p.h, 6);
      ctx.fill();
      ctx.strokeStyle = "#93c5fd";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = "#fff";
      ctx.font = "bold 11px sans-serif";
      ctx.fillText("SYNC?", x + 10, y + 22);
      ctx.font = "10px sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.fillText("Zoom", x + 14, y + 40);
      // cam dot
      ctx.fillStyle = "#f87171";
      ctx.beginPath();
      ctx.arc(x + p.w - 12, y + 14, 4, 0, Math.PI * 2);
      ctx.fill();
      return;
    }
    if (p.kind === "hallucination") {
      ctx.globalAlpha = p.solid ? 0.9 : 0.35;
      const g = ctx.createLinearGradient(x, y, x + p.w, y);
      g.addColorStop(0, "#e9d5ff");
      g.addColorStop(1, "#a855f7");
      ctx.fillStyle = g;
      rr(ctx, x, y, p.w, p.h, 4);
      ctx.fill();
      ctx.setLineDash([4, 3]);
      ctx.strokeStyle = "#6b21a8";
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "#4c1d95";
      ctx.font = "bold 9px sans-serif";
      ctx.fillText(p.solid ? "✦ AI ledge" : "✧ glitch", x + 4, y - 4);
      ctx.globalAlpha = 1;
      return;
    }

    if (p.h >= 40) {
      // Floor slab with carpet + baseboard
      const floor = theme.floor || "#64748b";
      const top = theme.floorTop || "#94a3b8";
      ctx.fillStyle = floor;
      ctx.fillRect(x, y, p.w, p.h);
      // carpet surface
      const cg = ctx.createLinearGradient(x, y, x, y + 14);
      cg.addColorStop(0, top);
      cg.addColorStop(1, floor);
      ctx.fillStyle = cg;
      ctx.fillRect(x, y, p.w, 12);
      // weave
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      for (let i = 0; i < p.w; i += 16) {
        ctx.fillRect(x + i, y + 2, 8, 8);
      }
      // baseboard
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.fillRect(x, y + 12, p.w, 3);
      // edge highlight
      ctx.fillStyle = "rgba(255,255,255,0.2)";
      ctx.fillRect(x, y, p.w, 2);
    } else {
      // Floating desk / shelf with legs + optional monitor
      const desk = theme.desk || "#92400e";
      const deskTop = theme.deskTop || "#f59e0b";
      // shadow under desk
      ctx.fillStyle = "rgba(0,0,0,0.15)";
      ctx.fillRect(x + 4, y + p.h + 2, p.w - 8, 3);
      // legs
      ctx.fillStyle = "#44403c";
      ctx.fillRect(x + 4, y + p.h, 4, 10);
      ctx.fillRect(x + p.w - 8, y + p.h, 4, 10);
      // top
      const dg = ctx.createLinearGradient(x, y, x, y + p.h);
      dg.addColorStop(0, deskTop);
      dg.addColorStop(1, desk);
      ctx.fillStyle = dg;
      rr(ctx, x, y, p.w, p.h, 3);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.25)";
      ctx.fillRect(x + 2, y + 1, p.w - 4, 2);

      const fancy =
        p.label === "monitor" ||
        p.label === "desk" ||
        p.label === "standup" ||
        p.label === "hot-desk" ||
        p.label === "whiteboard" ||
        p.label === "server-rack";
      if (fancy || p.w > 100) {
        // monitor
        const mx = x + p.w * 0.28;
        const my = y - 20;
        ctx.fillStyle = "#1e293b";
        rr(ctx, mx, my, 30, 18, 2);
        ctx.fill();
        ctx.fillStyle = accent;
        ctx.globalAlpha = 0.85;
        ctx.fillRect(mx + 3, my + 3, 24, 12);
        ctx.globalAlpha = 1;
        // code lines
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.fillRect(mx + 5, my + 5, 12, 1.5);
        ctx.fillRect(mx + 5, my + 8, 18, 1.5);
        ctx.fillRect(mx + 5, my + 11, 8, 1.5);
        // stand
        ctx.fillStyle = "#334155";
        ctx.fillRect(mx + 13, my + 18, 4, 4);
        ctx.fillRect(mx + 8, y - 2, 14, 3);
      }
      if (p.label === "server-rack") {
        ctx.fillStyle = "#0f172a";
        rr(ctx, x + 6, y - 28, p.w - 12, 26, 2);
        ctx.fill();
        for (let i = 0; i < 3; i++) {
          ctx.fillStyle = i === 1 ? "#22c55e" : "#334155";
          ctx.fillRect(x + 10, y - 24 + i * 7, p.w - 20, 5);
          ctx.fillStyle = "#4ade80";
          ctx.beginPath();
          ctx.arc(x + p.w - 16, y - 21 + i * 7, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  function drawDecor(ctx, decor, camX, theme) {
    const accent = (theme && theme.accent) || "#38bdf8";
    for (let i = 0; i < decor.length; i++) {
      const d = decor[i];
      const x = d.x - camX;
      if (x < -100 || x > LOGIC_W + 100) continue;
      if (d.kind === "flag") {
        // pole
        ctx.fillStyle = "#78716c";
        ctx.fillRect(x, d.y, 5, 72);
        ctx.fillStyle = "#a8a29e";
        ctx.fillRect(x, d.y, 5, 3);
        // flag cloth
        const fg = ctx.createLinearGradient(x, d.y, x + 44, d.y + 20);
        fg.addColorStop(0, "#22c55e");
        fg.addColorStop(1, "#15803d");
        ctx.fillStyle = fg;
        ctx.beginPath();
        ctx.moveTo(x + 5, d.y + 2);
        ctx.lineTo(x + 42, d.y + 12);
        ctx.lineTo(x + 5, d.y + 24);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.font = "bold 9px sans-serif";
        ctx.fillText("GO", x + 10, d.y + 15);
        ctx.fillStyle = "#14532d";
        ctx.font = "bold 11px sans-serif";
        ctx.fillText("DEPLOY", x - 8, d.y - 4);
      } else if (d.kind === "prop") {
        ctx.font = "16px sans-serif";
        ctx.fillText(d.text, x, d.y);
      } else {
        // wall plaque
        ctx.font = "bold 12px sans-serif";
        const tw = Math.min(180, ctx.measureText(d.text).width + 16);
        ctx.fillStyle = "rgba(15,23,42,0.55)";
        rr(ctx, x - 4, d.y - 14, tw, 20, 4);
        ctx.fill();
        ctx.strokeStyle = accent;
        ctx.globalAlpha = 0.5;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.fillStyle = "#e2e8f0";
        ctx.fillText(d.text, x + 4, d.y);
      }
    }
  }

  function drawPlayer(ctx, p, camX, sleepDebt, time) {
    const x = p.x - camX;
    const y = p.y;
    const blink = p.invuln > 0 && Math.floor(p.invuln * 10) % 2 === 0;
    if (blink) return;
    sleepDebt = sleepDebt || 0;
    time = time || 0;
    const face = p.facing >= 0 ? 1 : -1;
    const run = Math.abs(p.vx) > 20;
    const air = !p.onGround;
    const bob = air ? 0 : run ? Math.sin(time * 14) * 1.5 : Math.sin(time * 3) * 0.5;
    const leg = run ? Math.sin(time * 14) * 3 : 0;

    ctx.save();
    ctx.translate(0, bob);

    // soft shadow
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    ctx.beginPath();
    ctx.ellipse(x + p.w / 2, y + p.h + 1, 11, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // legs
    ctx.fillStyle = "#1e3a8a";
    ctx.fillRect(x + 7, y + 26, 5, 9 + (leg > 0 ? leg : 0));
    ctx.fillRect(x + 16, y + 26, 5, 9 + (leg < 0 ? -leg : 0));
    // shoes
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(x + 6, y + 33, 7, 3);
    ctx.fillRect(x + 15, y + 33, 7, 3);

    // hoodie body
    const bodyG = ctx.createLinearGradient(x, y + 12, x, y + 28);
    bodyG.addColorStop(0, "#3b82f6");
    bodyG.addColorStop(1, "#1d4ed8");
    ctx.fillStyle = bodyG;
    rr(ctx, x + 5, y + 12, p.w - 10, 16, 4);
    ctx.fill();
    // pocket
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth = 1;
    rr(ctx, x + 9, y + 20, p.w - 18, 6, 2);
    ctx.stroke();

    // arms
    ctx.fillStyle = "#2563eb";
    if (face > 0) {
      ctx.fillRect(x + p.w - 7, y + 14, 5, 10);
    } else {
      ctx.fillRect(x + 2, y + 14, 5, 10);
    }

    // head
    const skin =
      sleepDebt > 60 ? "#d6d3d1" : sleepDebt > 35 ? "#f5f5f4" : "#fde68a";
    ctx.fillStyle = skin;
    rr(ctx, x + 7, y + 1, p.w - 14, 13, 5);
    ctx.fill();

    // hoodie hood
    ctx.fillStyle = "#1e40af";
    ctx.beginPath();
    ctx.moveTo(x + 5, y + 12);
    ctx.quadraticCurveTo(x + p.w / 2, y - 2, x + p.w - 5, y + 12);
    ctx.lineTo(x + p.w - 7, y + 10);
    ctx.quadraticCurveTo(x + p.w / 2, y + 2, x + 7, y + 10);
    ctx.closePath();
    ctx.fill();

    // face
    const eyeX = face > 0 ? x + 16 : x + 9;
    ctx.fillStyle = "#0f172a";
    // eyes
    ctx.fillRect(eyeX, y + 5, 3, 3);
    ctx.fillRect(eyeX + (face > 0 ? -6 : 6), y + 5, 2.5, 3);
    // smile / tired mouth
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    if (sleepDebt >= 50) {
      ctx.moveTo(eyeX - 1, y + 11);
      ctx.lineTo(eyeX + 5, y + 11);
    } else {
      ctx.arc(eyeX + 1, y + 9, 3, 0.15, Math.PI - 0.15);
    }
    ctx.stroke();

    if (sleepDebt >= 30) {
      ctx.fillStyle = "rgba(55,48,40,0.4)";
      ctx.fillRect(eyeX - 1, y + 8, 4, 1.5);
      ctx.fillRect(eyeX + (face > 0 ? -7 : 5), y + 8, 3, 1.5);
    }
    if (sleepDebt >= 70) {
      ctx.fillStyle = "#64748b";
      ctx.font = "bold 10px sans-serif";
      ctx.fillText("z", x + p.w - 2, y);
      if (sleepDebt >= 85) {
        ctx.font = "9px sans-serif";
        ctx.fillText("z", x + p.w + 5, y - 7);
      }
    }

    // laptop bag strap + bag
    const bagX = face > 0 ? x - 1 : x + p.w - 5;
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + p.w / 2, y + 12);
    ctx.lineTo(bagX + 3, y + 22);
    ctx.stroke();
    ctx.fillStyle = "#1e293b";
    rr(ctx, bagX, y + 18, 7, 11, 2);
    ctx.fill();
    ctx.fillStyle = accentDot();
    ctx.fillRect(bagX + 2, y + 21, 3, 2);

    ctx.restore();

    function accentDot() {
      return "#38bdf8";
    }
  }

  /**
   * Comic-style thought bubble above the player (inner monologue).
   */
  function drawThoughtBubble(ctx, game, camX) {
    const th = game.thought;
    if (!th || !th.text || th.timer <= 0) return;
    const p = game.player;
    const px = p.x - camX + p.w / 2;
    const py = p.y - 8;

    ctx.font = "11px sans-serif";
    const padX = 8;
    const padY = 6;
    const maxW = 160;
    // simple wrap measure
    const words = th.text.split(" ");
    const lines = [];
    let line = "";
    for (let i = 0; i < words.length; i++) {
      const test = line ? line + " " + words[i] : words[i];
      if (ctx.measureText(test).width > maxW && line) {
        lines.push(line);
        line = words[i];
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);

    let textW = 0;
    for (let i = 0; i < lines.length; i++) {
      textW = Math.max(textW, ctx.measureText(lines[i]).width);
    }
    const boxW = textW + padX * 2;
    const lineH = 13;
    const boxH = lines.length * lineH + padY * 2;
    let bx = px - boxW / 2;
    bx = Math.max(4, Math.min(LOGIC_W - boxW - 4, bx));
    const by = Math.max(48, py - boxH - 14);

    // fade near end
    const fade = th.timer < 0.4 ? th.timer / 0.4 : 1;
    ctx.globalAlpha = 0.55 + 0.45 * fade;

    // cloud bubble
    ctx.fillStyle = "#fffbeb";
    ctx.strokeStyle = "#a8a29e";
    ctx.lineWidth = 1.5;
    roundRect(ctx, bx, by, boxW, boxH, 10);
    ctx.fill();
    ctx.stroke();

    // little thought dots
    ctx.fillStyle = "#fffbeb";
    ctx.strokeStyle = "#a8a29e";
    const dots = [
      { x: px - 4, y: py - 6, r: 3 },
      { x: px - 10, y: py - 2, r: 2.2 },
      { x: px - 14, y: py + 2, r: 1.5 },
    ];
    for (let i = 0; i < dots.length; i++) {
      ctx.beginPath();
      ctx.arc(dots[i].x, dots[i].y, dots[i].r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    ctx.fillStyle = "#44403c";
    ctx.font = "11px sans-serif";
    ctx.textAlign = "left";
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], bx + padX, by + padY + lineH * (i + 0.75));
    }
    ctx.globalAlpha = 1;
  }

  function drawEnemy(ctx, e, camX, time) {
    if (!e.alive) return;
    const x = e.x - camX;
    const y = e.y;
    time = time || 0;
    const wiggle = Math.sin(time * 10 + e.x * 0.1) * 1.5;
    const dir = e.vx >= 0 ? 1 : -1;

    // shadow
    ctx.fillStyle = "rgba(0,0,0,0.2)";
    ctx.beginPath();
    ctx.ellipse(x + e.w / 2, y + e.h + 1, 10, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // shell / body
    const bg = ctx.createLinearGradient(x, y, x, y + e.h);
    bg.addColorStop(0, "#f87171");
    bg.addColorStop(1, "#b91c1c");
    ctx.fillStyle = bg;
    rr(ctx, x + 2, y + 8 + wiggle, e.w - 4, e.h - 10, 6);
    ctx.fill();

    // ticket stub head
    ctx.fillStyle = "#7f1d1d";
    rr(ctx, x + 3, y + 2 + wiggle, e.w - 6, 12, 3);
    ctx.fill();
    ctx.fillStyle = "#fecaca";
    ctx.font = "bold 7px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("BUG", x + e.w / 2, y + 11 + wiggle);
    ctx.textAlign = "left";

    // eyes
    const ex = dir > 0 ? x + 16 : x + 6;
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(ex, y + 16 + wiggle, 3.5, 0, Math.PI * 2);
    ctx.arc(ex + (dir > 0 ? -8 : 8), y + 16 + wiggle, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#0f172a";
    ctx.beginPath();
    ctx.arc(ex + dir, y + 16 + wiggle, 1.6, 0, Math.PI * 2);
    ctx.arc(ex + (dir > 0 ? -8 : 8) + dir, y + 16 + wiggle, 1.6, 0, Math.PI * 2);
    ctx.fill();

    // angry brow
    ctx.strokeStyle = "#450a0a";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(ex - 3, y + 12 + wiggle);
    ctx.lineTo(ex + 3, y + 14 + wiggle);
    ctx.moveTo(ex + (dir > 0 ? -11 : 5), y + 14 + wiggle);
    ctx.lineTo(ex + (dir > 0 ? -5 : 11), y + 12 + wiggle);
    ctx.stroke();

    // little legs
    ctx.fillStyle = "#7f1d1d";
    ctx.fillRect(x + 6, y + e.h - 4 + wiggle, 4, 4);
    ctx.fillRect(x + e.w - 10, y + e.h - 4 - wiggle, 4, 4);
  }

  function drawCollectible(ctx, c, camX, time) {
    if (c.collected) return;
    const x = c.x - camX;
    const y = c.y;
    if (x + c.w < -20 || x > LOGIC_W + 20) return;
    const bob = Math.sin((time || 0) * 5 + c.x * 0.05) * 2.5;
    const spin = (time || 0) * 3 + c.x * 0.02;

    ctx.fillStyle =
      c.kind === "coffee"
        ? "rgba(251,146,60,0.3)"
        : "rgba(250,204,21,0.35)";
    ctx.beginPath();
    ctx.arc(x + c.w / 2, y + c.h / 2 + bob, c.w * 0.72, 0, Math.PI * 2);
    ctx.fill();

    if (
      c.kind === "focus" ||
      c.kind === "oop" ||
      c.kind === "standup" ||
      c.kind === "snack" ||
      c.kind === "double" ||
      c.kind === "wall" ||
      c.kind === "secret"
    ) {
      const cx = x + c.w / 2;
      const cy = y + c.h / 2 + bob;
      const colors = {
        focus: "#38bdf8",
        oop: "#a78bfa",
        standup: "#fbbf24",
        snack: "#4ade80",
        double: "#67e8f9",
        wall: "#c4b5fd",
        secret: "#f472b6",
      };
      const labels = {
        focus: "FOC",
        oop: "OOP",
        standup: "★",
        snack: "🍪",
        double: "2J",
        wall: "WJ",
        secret: "HR",
      };
      ctx.fillStyle = colors[c.kind] || "#fff";
      ctx.globalAlpha = 0.35;
      ctx.beginPath();
      ctx.arc(cx, cy, c.w * 0.7, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = colors[c.kind] || "#fff";
      rr(ctx, x + 2, y + 2 + bob, c.w - 4, c.h - 4, 5);
      ctx.fill();
      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 9px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(labels[c.kind] || "?", cx, cy);
      ctx.textBaseline = "alphabetic";
      ctx.textAlign = "left";
      return;
    }

    if (c.kind === "coffee") {
      const mx = x + 4;
      const my = y + 5 + bob;
      // mug body
      const mg = ctx.createLinearGradient(mx, my, mx, my + c.h - 8);
      mg.addColorStop(0, "#a16207");
      mg.addColorStop(1, "#713f12");
      ctx.fillStyle = mg;
      rr(ctx, mx, my, c.w - 10, c.h - 10, 3);
      ctx.fill();
      // coffee surface
      ctx.fillStyle = "#44403c";
      rr(ctx, mx + 2, my + 2, c.w - 14, 6, 2);
      ctx.fill();
      ctx.fillStyle = "#a8a29e";
      ctx.globalAlpha = 0.5;
      ctx.fillRect(mx + 4, my + 3, c.w - 18, 2);
      ctx.globalAlpha = 1;
      // handle
      ctx.strokeStyle = "#a16207";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(x + c.w - 5, my + 8, 5, -1.1, 1.1);
      ctx.stroke();
      // steam
      ctx.strokeStyle = "rgba(255,255,255,0.45)";
      ctx.lineWidth = 1.2;
      for (let i = 0; i < 2; i++) {
        const sx = mx + 6 + i * 6;
        ctx.beginPath();
        ctx.moveTo(sx, my - 1);
        ctx.quadraticCurveTo(
          sx + Math.sin(spin + i) * 3,
          my - 8,
          sx,
          my - 14
        );
        ctx.stroke();
      }
      ctx.fillStyle = "#fef3c7";
      ctx.font = "bold 8px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("JAVA", x + c.w / 2 - 1, y + c.h + bob + 9);
      ctx.textAlign = "left";
    } else {
      // gold SP coin with 3D rim
      const cx = x + c.w / 2;
      const cy = y + c.h / 2 + bob;
      const squash = 0.55 + Math.abs(Math.cos(spin)) * 0.45;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(squash, 1);
      ctx.fillStyle = "#b45309";
      ctx.beginPath();
      ctx.arc(0, 1, c.w / 2, 0, Math.PI * 2);
      ctx.fill();
      const cg = ctx.createRadialGradient(-3, -3, 2, 0, 0, c.w / 2);
      cg.addColorStop(0, "#fef08a");
      cg.addColorStop(0.5, "#facc15");
      cg.addColorStop(1, "#ca8a04");
      ctx.fillStyle = cg;
      ctx.beginPath();
      ctx.arc(0, 0, c.w / 2 - 1, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#a16207";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = "#78350f";
      ctx.font = "bold 10px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("SP", 0, 1);
      ctx.textBaseline = "alphabetic";
      ctx.textAlign = "left";
      ctx.restore();
    }
  }

  function drawInteractable(ctx, it, camX) {
    const x = it.x - camX;
    const y = it.y;
    if (x + it.w < -20 || x > LOGIC_W + 20) return;
    ctx.globalAlpha = it.used ? 0.4 : 1;

    // floor shadow
    ctx.fillStyle = "rgba(0,0,0,0.12)";
    ctx.beginPath();
    ctx.ellipse(x + it.w / 2, y + it.h + 1, 12, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    const kind = it.kind || "prop";
    if (kind === "chair") {
      ctx.fillStyle = "#57534e";
      rr(ctx, x + 4, y + 10, it.w - 8, 12, 2);
      ctx.fill();
      ctx.fillStyle = "#44403c";
      ctx.fillRect(x + 6, y + 22, 3, 8);
      ctx.fillRect(x + it.w - 9, y + 22, 3, 8);
      ctx.fillStyle = "#78716c";
      rr(ctx, x + 6, y + 4, it.w - 12, 10, 2);
      ctx.fill();
    } else if (kind === "plant") {
      ctx.fillStyle = "#78716c";
      rr(ctx, x + 8, y + 18, it.w - 16, 10, 2);
      ctx.fill();
      ctx.fillStyle = "#16a34a";
      ctx.beginPath();
      ctx.ellipse(x + it.w / 2, y + 12, 10, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#22c55e";
      ctx.beginPath();
      ctx.ellipse(x + it.w / 2 - 5, y + 10, 5, 6, -0.4, 0, Math.PI * 2);
      ctx.ellipse(x + it.w / 2 + 5, y + 10, 5, 6, 0.4, 0, Math.PI * 2);
      ctx.fill();
    } else if (kind === "monitor") {
      ctx.fillStyle = "#0f172a";
      rr(ctx, x + 2, y + 4, it.w - 4, 16, 2);
      ctx.fill();
      ctx.fillStyle = "#38bdf8";
      ctx.globalAlpha = it.used ? 0.2 : 0.85;
      ctx.fillRect(x + 5, y + 7, it.w - 10, 10);
      ctx.globalAlpha = it.used ? 0.4 : 1;
      ctx.fillStyle = "#334155";
      ctx.fillRect(x + it.w / 2 - 2, y + 20, 4, 5);
      ctx.fillRect(x + 6, y + 24, it.w - 12, 3);
    } else if (kind === "box") {
      ctx.fillStyle = "#a16207";
      rr(ctx, x + 3, y + 8, it.w - 6, 18, 2);
      ctx.fill();
      ctx.strokeStyle = "#713f12";
      ctx.strokeRect(x + 3, y + 8, it.w - 6, 18);
      ctx.beginPath();
      ctx.moveTo(x + it.w / 2, y + 8);
      ctx.lineTo(x + it.w / 2, y + 26);
      ctx.stroke();
    } else {
      // generic pedestal + emoji
      ctx.fillStyle = "rgba(255,255,255,0.1)";
      rr(ctx, x, y + it.h - 8, it.w, 8, 3);
      ctx.fill();
      ctx.font = it.used ? "16px sans-serif" : "20px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(it.emoji || "📦", x + it.w / 2, y + it.h - 10);
      ctx.textAlign = "left";
    }

    if (!it.used) {
      ctx.fillStyle = "rgba(148,163,184,0.9)";
      ctx.font = "7px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("tap", x + it.w / 2, y - 1);
      ctx.textAlign = "left";
    }
    ctx.globalAlpha = 1;
  }

  function drawDeployZone(ctx, d, camX, time) {
    const x = d.x - camX;
    const pulse = 0.2 + Math.sin((time || 0) * 4) * 0.08;
    ctx.fillStyle = "rgba(34,197,94," + pulse + ")";
    rr(ctx, x - 4, d.y - 4, d.w + 8, d.h + 8, 6);
    ctx.fill();
    ctx.strokeStyle = "#4ade80";
    ctx.lineWidth = 2;
    rr(ctx, x, d.y, d.w, d.h, 4);
    ctx.stroke();
    // chevrons
    ctx.strokeStyle = "#86efac";
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      const cy = d.y + 16 + i * 14 + Math.sin((time || 0) * 5 + i) * 2;
      ctx.beginPath();
      ctx.moveTo(x + 8, cy);
      ctx.lineTo(x + d.w / 2, cy + 6);
      ctx.lineTo(x + d.w - 8, cy);
      ctx.stroke();
    }
  }

  function drawHUD(ctx, game) {
    const compact = game.settings && game.settings.compactHud;
    const barH = compact ? 28 : 40;
    // Top bar
    ctx.fillStyle = "rgba(15,23,42,0.82)";
    ctx.fillRect(0, 0, LOGIC_W, barH);

    ctx.fillStyle = "#f8fafc";
    ctx.font = "bold 13px sans-serif";
    ctx.fillText("Boss Says", 10, 17);

    ctx.font = "12px sans-serif";
    ctx.fillText("S" + game.sprint, 100, 17);
    ctx.fillText("Ship " + game.deploys, 140, 17);
    if (game.map && game.map.brand && !compact) {
      ctx.fillStyle = (game.map.theme && game.map.theme.accent) || "#38bdf8";
      ctx.font = "bold 10px sans-serif";
      ctx.fillText(String(game.map.brand).slice(0, 10), 10, 38);
    }

    // Score / combo
    ctx.fillStyle = "#fbbf24";
    ctx.font = "bold 12px sans-serif";
    ctx.fillText("SP " + (game.score || 0), 210, 17);
    if (game.combo > 1) {
      ctx.fillStyle = game.combo >= 5 ? "#f472b6" : "#fde68a";
      ctx.fillText("x" + game.combo, 275, 17);
    }

    // Lives as PTO hearts
    ctx.fillStyle = "#e2e8f0";
    ctx.font = "11px sans-serif";
    ctx.fillText("PTO", 310, 17);
    for (let i = 0; i < game.maxLives; i++) {
      ctx.fillStyle = i < game.lives ? "#f43f5e" : "#475569";
      ctx.beginPath();
      const hx = 340 + i * 14;
      ctx.arc(hx, 13, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Context meter
    const cm = game.effects.context;
    const maxC = 100;
    const cb = game.settings && game.settings.colorblind;
    ctx.fillStyle = "#94a3b8";
    ctx.font = "11px sans-serif";
    ctx.fillText("Ctx", 390, 17);
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(412, 8, 52, 10);
    ctx.fillStyle = cb
      ? cm > 80
        ? "#fff"
        : "#94a3b8"
      : cm > 80
        ? "#ef4444"
        : cm > 50
          ? "#f59e0b"
          : "#22c55e";
    ctx.fillRect(412, 8, (52 * cm) / maxC, 10);

    // Sleep debt
    const sd = game.effects.sleepDebt || 0;
    ctx.fillStyle = "#94a3b8";
    ctx.fillText("Zzz", 470, 17);
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(492, 8, 48, 10);
    ctx.fillStyle = sd > 75 ? "#6366f1" : sd > 45 ? "#818cf8" : "#a5b4fc";
    ctx.fillRect(492, 8, (48 * sd) / 100, 10);

    // Political capital
    const pol = game.political != null ? game.political : 50;
    ctx.fillStyle = "#94a3b8";
    ctx.fillText("Pol", 548, 17);
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(570, 8, 40, 10);
    ctx.fillStyle = pol > 80 ? "#f472b6" : "#e879f9";
    ctx.fillRect(570, 8, (40 * pol) / 100, 10);

    // Tech debt
    const td = game.techDebt || 0;
    ctx.fillStyle = "#94a3b8";
    ctx.fillText("Debt", 618, 17);
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(648, 8, 36, 10);
    ctx.fillStyle = td > 70 ? "#f97316" : "#fb923c";
    ctx.fillRect(648, 8, (36 * td) / 100, 10);

    // Status buffs
    let statusX = 690;
    const buffs = [];
    if (game.effects.stunTimer > 0) buffs.push({ t: "STUN", c: "#fbbf24" });
    else if (game.effects.slowTimer > 0) buffs.push({ t: "SLOW", c: "#c084fc" });
    if (game.effects.focusTimer > 0) buffs.push({ t: "FOC", c: "#38bdf8" });
    if (game.effects.oopTimer > 0) buffs.push({ t: "OOP", c: "#a78bfa" });
    if (game.effects.standupTimer > 0) buffs.push({ t: "★", c: "#fbbf24" });
    if (game.effects.pureMarioTimer > 0) buffs.push({ t: "DND", c: "#4ade80" });
    if (game.effects.doubleJumpTimer > 0) buffs.push({ t: "2J", c: "#67e8f9" });
    if (game.effects.wallJumpTimer > 0) buffs.push({ t: "WJ", c: "#c4b5fd" });
    if (game.stormTimer > 0) buffs.push({ t: "STORM", c: "#ef4444" });
    if (game.bossChase && game.bossChase.alive) buffs.push({ t: "MGR", c: "#f87171" });
    if (game.mode === "oncall") buffs.push({ t: "PAGER", c: "#fb923c" });
    if (sd >= 60 && !buffs.length) buffs.push({ t: "TIRED", c: "#a5b4fc" });
    ctx.font = "bold 9px sans-serif";
    for (let bi = 0; bi < buffs.length && bi < 3; bi++) {
      ctx.fillStyle = buffs[bi].c;
      ctx.fillText(buffs[bi].t, statusX, 17);
      statusX += 38;
    }

    // Slack inbox badge
    const inbox = game.notifications
      ? game.notifications.inbox
        ? game.notifications.inbox.length
        : 0
      : 0;
    const toast =
      game.notifications && game.notifications.toastTimer > 0
        ? game.notifications.toastTimer
        : 0;
    if (inbox > 0 || toast > 0) {
      const pulse = toast > 0 && Math.floor(toast * 8) % 2 === 0;
      ctx.fillStyle = pulse ? "#ef4444" : "#dc2626";
      roundRect(ctx, LOGIC_W - 118, 6, 108, 22, 6);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "bold 11px sans-serif";
      ctx.fillText(
        "Slack " + (inbox > 0 ? inbox : "!") + "  [Tab]",
        LOGIC_W - 110,
        21
      );
    }

    if (!compact) {
      ctx.fillStyle = "rgba(15,23,42,0.55)";
      ctx.fillRect(0, 28, LOGIC_W, 14);
      ctx.font = "10px sans-serif";
      ctx.fillStyle = "#fbbf24";
      ctx.fillText("● SP", 70, 38);
      ctx.fillStyle = "#d97706";
      ctx.fillText("☕ wake", 105, 38);
      ctx.fillStyle = "#38bdf8";
      ctx.fillText("FOC/OOP/★ powerups", 155, 38);
      ctx.fillStyle = "#94a3b8";
      const mode = game.mode || "normal";
      const diff = game.difficulty || "mid";
      ctx.fillText(
        "Tab Slack · 5 quit · " + mode + "/" + diff,
        300,
        38
      );
    }

    if (game.message && game.messageTimer > 0) {
      ctx.fillStyle = "rgba(15,23,42,0.75)";
      ctx.fillRect(LOGIC_W / 2 - 230, compact ? 36 : 52, 460, 28);
      ctx.fillStyle = "#f8fafc";
      ctx.font = "12px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(game.message, LOGIC_W / 2, compact ? 55 : 71);
      ctx.textAlign = "left";
    }

    // Achievement / mode toasts
    if (game.fx && game.fx.toasts && game.fx.toasts.length) {
      for (let ti = 0; ti < game.fx.toasts.length; ti++) {
        const t = game.fx.toasts[ti];
        const alpha = Math.min(1, t.ttl / 0.4, (t.max - t.ttl) < 0.3 ? t.ttl / 0.3 : 1);
        ctx.globalAlpha = Math.max(0, alpha);
        const ty = 90 + ti * 36;
        ctx.fillStyle = "rgba(15,23,42,0.9)";
        roundRect(ctx, LOGIC_W - 220, ty, 210, 32, 6);
        ctx.fill();
        ctx.fillStyle = "#fbbf24";
        ctx.font = "bold 11px sans-serif";
        ctx.fillText(t.title, LOGIC_W - 210, ty + 13);
        ctx.fillStyle = "#94a3b8";
        ctx.font = "10px sans-serif";
        ctx.fillText((t.body || "").slice(0, 32), LOGIC_W - 210, ty + 26);
      }
      ctx.globalAlpha = 1;
    }
  }

  function drawProjectiles(ctx, game, camX) {
    if (!game.projectiles) return;
    for (let i = 0; i < game.projectiles.length; i++) {
      const pr = game.projectiles[i];
      const x = pr.x - camX;
      if (x < -40 || x > LOGIC_W + 40) continue;
      ctx.fillStyle = "rgba(239,68,68,0.85)";
      roundRect(ctx, x, pr.y, pr.w, pr.h, 4);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "bold 8px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText((pr.text || "ping").slice(0, 10), x + pr.w / 2, pr.y + 10);
      ctx.textAlign = "left";
    }
  }

  function drawFx(ctx, game, camX) {
    if (!game.fx) return;
    const fx = game.fx;
    // particles in world space
    for (let i = 0; i < fx.particles.length; i++) {
      const p = fx.particles[i];
      const a = Math.max(0, p.ttl / p.max);
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - camX, p.y, p.size, p.size);
    }
    ctx.globalAlpha = 1;
    for (let i = 0; i < fx.floats.length; i++) {
      const f = fx.floats[i];
      const a = Math.max(0, f.ttl / f.max);
      ctx.globalAlpha = a;
      ctx.fillStyle = f.color;
      ctx.font = "bold 12px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(f.text, f.x - camX, f.y);
      ctx.textAlign = "left";
    }
    ctx.globalAlpha = 1;
  }

  function drawNotification(ctx, note) {
    if (!note) return;
    const large = !!(arguments[2] && arguments[2].largeText);
    const boxW = 560;
    const hasThread = note.thread && note.thread.length;
    const nChoices = (note.choices && note.choices.length) || 5;
    const boxH = hasThread ? 300 : 268;
    const x = (LOGIC_W - boxW) / 2;
    const y = 48;

    // Dim world — game is frozen while you read
    ctx.fillStyle = "rgba(2,6,23,0.55)";
    ctx.fillRect(0, 0, LOGIC_W, LOGIC_H);

    // PAUSED banner
    ctx.fillStyle = "#fbbf24";
    ctx.font = "bold 12px sans-serif";
    ctx.textAlign = "center";
    let banner = "READING SLACK · paused · keys 1–" + Math.min(5, nChoices);
    if (note.kind === "meeting") banner = "MEETING INVITE · Accept / Decline / Tentative";
    if (note.kind === "review") banner = "PERFORMANCE REVIEW QUIZ · pick the culture-fit answer";
    if (note.kind === "vent")
      banner = "ENG VENT CIRCLE · no managers · complain freely · heal a little";
    ctx.fillText(banner, LOGIC_W / 2, y - 12);
    ctx.textAlign = "left";

    const accent = note.color || "#38bdf8";
    ctx.fillStyle = "#0f172a";
    ctx.strokeStyle = note.urgent ? "#e11d48" : accent;
    ctx.lineWidth = 3;
    roundRect(ctx, x, y, boxW, boxH, 12);
    ctx.fill();
    ctx.stroke();

    // Top bar
    ctx.fillStyle = "#1e293b";
    roundRect(ctx, x, y, boxW, 36, 12);
    ctx.fill();
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(x, y + 24, boxW, 14);

    ctx.fillStyle = accent;
    ctx.font = "bold 12px sans-serif";
    const channel = note.channel || "#exec-stream";
    ctx.fillText("Slack  " + channel, x + 14, y + 22);

    if (note.kind === "meeting") {
      ctx.fillStyle = "#38bdf8";
      ctx.font = "bold 10px sans-serif";
      ctx.fillText("● CALENDAR", x + boxW - 100, y + 22);
    } else if (note.kind === "review") {
      ctx.fillStyle = "#fbbf24";
      ctx.font = "bold 10px sans-serif";
      ctx.fillText("● PERF", x + boxW - 80, y + 22);
    } else if (note.kind === "vent") {
      ctx.fillStyle = "#34d399";
      ctx.font = "bold 10px sans-serif";
      ctx.fillText("● ENG-ONLY", x + boxW - 100, y + 22);
    } else if (note.urgent) {
      ctx.fillStyle = "#e11d48";
      ctx.font = "bold 10px sans-serif";
      ctx.fillText("● URGENT · KNOW-IT-ALL ENERGY", x + boxW - 200, y + 22);
    }

    // Avatar circle
    const ax = x + 22;
    const ay = y + 58;
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(ax, ay, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 11px sans-serif";
    ctx.textAlign = "center";
    const initials = (note.name || note.from || "?")
      .split(/\s+/)
      .map(function (w) {
        return w[0];
      })
      .join("")
      .slice(0, 2)
      .toUpperCase();
    ctx.fillText(initials, ax, ay + 4);
    ctx.textAlign = "left";

    // Name + title
    ctx.fillStyle = "#f8fafc";
    ctx.font = large ? "bold 17px sans-serif" : "bold 15px sans-serif";
    ctx.fillText(note.name || note.from, x + 48, y + 54);
    ctx.fillStyle = "#94a3b8";
    ctx.font = large ? "13px sans-serif" : "12px sans-serif";
    ctx.fillText(
      (note.title || note.from) + "  ·  just now  ·  expects a reply",
      x + 48,
      y + 72
    );

    // Body
    ctx.fillStyle = "#e2e8f0";
    ctx.font = large ? "15px sans-serif" : "14px sans-serif";
    wrapText(ctx, note.text, x + 18, y + 100, boxW - 36, large ? 20 : 18, 4);

    // Thread panel
    if (hasThread) {
      ctx.fillStyle = "rgba(30,41,59,0.9)";
      roundRect(ctx, x + 18, y + 168, boxW - 36, 44, 6);
      ctx.fill();
      ctx.fillStyle = "#64748b";
      ctx.font = "9px sans-serif";
      ctx.fillText("Thread", x + 24, y + 180);
      ctx.fillStyle = "#94a3b8";
      ctx.font = "10px sans-serif";
      for (let ti = 0; ti < Math.min(2, note.thread.length); ti++) {
        ctx.fillText(
          String(note.thread[ti]).slice(0, 70),
          x + 24,
          y + 194 + ti * 12
        );
      }
    }

    // Timer bar
    const t = Math.max(0, note.timer / note.maxTimer);
    const barY = hasThread ? y + 220 : y + 168;
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(x + 18, barY, boxW - 36, 8);
    ctx.fillStyle = t < 0.25 ? "#ef4444" : accent;
    ctx.fillRect(x + 18, barY, (boxW - 36) * t, 8);
    ctx.fillStyle = "#64748b";
    ctx.font = "10px sans-serif";
    ctx.fillText(
      note.kind === "meeting"
        ? "1 Accept · 2 Decline · 3 Tentative · 5 QUIT"
        : note.kind === "review"
          ? "1–3 answers · 5 QUIT"
          : note.kind === "vent"
            ? "1 Vent · 2 Silent nod · 3 Leave · 5 QUIT"
            : "1–4 normal replies · [5] FUCK YOU I QUIT ends the run",
      x + 18,
      barY + 18
    );

    // Choices — row of up to 4 + optional nuclear
    const choices = note.choices || [];
    const gap = 8;
    const row1 = choices.filter(function (c) {
      return c.id !== "quit";
    }).slice(0, 4);
    const quitC = choices.filter(function (c) {
      return c.id === "quit";
    })[0];
    const bw = Math.min(128, Math.floor((boxW - 40 - (row1.length - 1) * gap) / Math.max(1, row1.length)));
    let total = row1.length * bw + (row1.length - 1) * gap;
    let cx = x + (boxW - total) / 2;
    const cy1 = barY + 28;
    for (let i = 0; i < row1.length; i++) {
      const c = row1[i];
      ctx.fillStyle = "#1e293b";
      ctx.strokeStyle = "#64748b";
      roundRect(ctx, cx, cy1, bw, 26, 6);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#f1f5f9";
      ctx.font = "9px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(
        "[" + (i + 1) + "] " + String(c.label).slice(0, 14),
        cx + bw / 2,
        cy1 + 17
      );
      ctx.textAlign = "left";
      cx += bw + gap;
    }
    if (quitC) {
      const qbw = 280;
      const qx = x + (boxW - qbw) / 2;
      const qy = cy1 + 32;
      ctx.fillStyle = "#7f1d1d";
      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 2;
      roundRect(ctx, qx, qy, qbw, 26, 6);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#fecaca";
      ctx.font = "bold 11px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("[5] " + quitC.label, qx + qbw / 2, qy + 17);
      ctx.textAlign = "left";
      ctx.lineWidth = 1;
    }
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function wrapText(ctx, text, x, y, maxW, lineH, maxLines) {
    const words = text.split(" ");
    let line = "";
    let yy = y;
    let linesUsed = 0;
    maxLines = maxLines || 8;
    for (let n = 0; n < words.length; n++) {
      const test = line + words[n] + " ";
      if (ctx.measureText(test).width > maxW && n > 0) {
        ctx.fillText(line, x, yy);
        line = words[n] + " ";
        yy += lineH;
        linesUsed++;
        if (linesUsed >= maxLines) {
          ctx.fillText(line.trim() + "…", x, yy);
          return;
        }
      } else {
        line = test;
      }
    }
    ctx.fillText(line, x, yy);
  }

  function drawGameOver(ctx, game) {
    ctx.fillStyle = "rgba(15,23,42,0.8)";
    ctx.fillRect(0, 0, LOGIC_W, LOGIC_H);
    const quit = game.endReason === "quit";
    const promoted = game.endReason === "promoted";
    ctx.fillStyle = quit ? "#fecaca" : promoted ? "#f9a8d4" : "#f8fafc";
    ctx.font = "bold 34px sans-serif";
    ctx.textAlign = "center";
    const afkTitle = game.endReason === "paused_out";
    ctx.fillText(
      quit
        ? "I QUIT."
        : promoted
          ? "PROMOTED"
          : afkTitle
            ? "AFK"
            : "LAID OFF",
      LOGIC_W / 2,
      LOGIC_H / 2 - 28
    );
    ctx.font = "15px sans-serif";
    ctx.fillStyle = quit
      ? "#fca5a5"
      : promoted
        ? "#fbcfe8"
        : afkTitle
          ? "#93c5fd"
          : "#94a3b8";
    ctx.fillText(
      quit
        ? "You sent the message. HR is typing. Birds are singing."
        : promoted
          ? "Jump key unbound. Welcome to middle management."
          : afkTitle
            ? "You paused the game and walked away. Calendar still booked you."
            : "They said it was a restructuring. Of your employment.",
      LOGIC_W / 2,
      LOGIC_H / 2 + 4
    );
    ctx.fillStyle = "#94a3b8";
    ctx.font = "14px sans-serif";
    ctx.fillText(
      "Sprints " +
        game.sprint +
        " · Deploys " +
        game.deploys +
        " · Score " +
        (game.score || 0) +
        " · Combo " +
        (game.bestCombo || 0) +
        " · Zzz " +
        Math.round(game.effects.sleepDebt || 0),
      LOGIC_W / 2,
      LOGIC_H / 2 + 32
    );
    ctx.fillText(
      "Pol " +
        Math.round(game.political || 0) +
        " · Debt " +
        Math.round(game.techDebt || 0) +
        " · " +
        (game.mode || "normal") +
        "/" +
        (game.difficulty || "mid"),
      LOGIC_W / 2,
      LOGIC_H / 2 + 52
    );
    const afk = game.endReason === "paused_out";
    ctx.fillText(
      quit
        ? "Press R to un-quit · S share card"
        : promoted
          ? "Press R to demote yourself · S share"
          : afk
            ? "Press R for a new run · S share card"
            : "Press R to re-interview · S share card",
      LOGIC_W / 2,
      LOGIC_H / 2 + 78
    );
    ctx.textAlign = "left";
  }

  function drawBoss(ctx, boss, camX) {
    if (!boss || !boss.alive) return;
    const x = boss.x - camX;
    if (x < -40 || x > LOGIC_W + 40) return;
    ctx.fillStyle = "#7f1d1d";
    rr(ctx, x, boss.y, boss.w, boss.h, 4);
    ctx.fill();
    ctx.fillStyle = "#fecaca";
    ctx.font = "bold 8px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(boss.label || "MGR", x + boss.w / 2, boss.y - 4);
    ctx.fillText("👔", x + boss.w / 2, boss.y + 22);
    ctx.textAlign = "left";
  }

  function drawGhost(ctx, game, camX) {
    const g = game.ghostPlayback;
    if (!g || !g.samples || !g.samples.length) return;
    // Find sample nearest current time fraction of run
    const t = game.time || 0;
    let best = g.samples[0];
    for (let i = 0; i < g.samples.length; i++) {
      if (g.samples[i].t <= t) best = g.samples[i];
      else break;
    }
    const x = best.x - camX;
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = "#38bdf8";
    rr(ctx, x, best.y, 28, 36, 4);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = "rgba(56,189,248,0.7)";
    ctx.font = "8px sans-serif";
    ctx.fillText("ghost", x, best.y - 4);
  }

  function draw(ctx, game) {
    const camX = game.cameraX || 0;
    const theme = (game.map && game.map.theme) || null;
    const reduce = game.settings && game.settings.reduceMotion;
    const oncall = game.mode === "oncall";
    let shakeX = 0;
    let shakeY = 0;
    if (!reduce && game.fx && game.fx.shake > 0) {
      const a = game.fx.shake * 8;
      shakeX = (Math.random() - 0.5) * a;
      shakeY = (Math.random() - 0.5) * a;
    }
    // Upscale logical playfield to full canvas (bigger on-screen game area)
    ctx.setTransform(SCALE, 0, 0, SCALE, shakeX * SCALE, shakeY * SCALE);
    clear(ctx, LOGIC_W, LOGIC_H, theme);

    // On-call night wash
    if (oncall) {
      ctx.fillStyle = "rgba(15,23,42,0.35)";
      ctx.fillRect(0, 0, LOGIC_W, LOGIC_H);
    }

    // Parallax layers — far buildings
    ctx.fillStyle = oncall ? "rgba(30,58,138,0.25)" : "rgba(15,23,42,0.12)";
    for (let i = 0; i < game.map.width; i += 220) {
      const x = i - camX * 0.35;
      const h = 80 + ((i / 40) % 5) * 18;
      ctx.fillRect(x, LOGIC_H - 90 - h, 48, h);
    }
    // Mid parallax pillars
    ctx.fillStyle = "rgba(15,23,42,0.1)";
    const stripe = 160 + ((game.sprint || 1) % 5) * 12;
    for (let i = 0; i < game.map.width; i += stripe) {
      const x = i - camX * 0.85;
      ctx.fillRect(x, 48, 18, LOGIC_H - 90);
      ctx.fillStyle = "rgba(255,255,255,0.04)";
      ctx.fillRect(x + 3, 56, 4, LOGIC_H - 110);
      ctx.fillStyle = "rgba(15,23,42,0.1)";
    }

    // theme accent wash
    if (theme && theme.accent) {
      ctx.fillStyle = theme.accent;
      ctx.globalAlpha = 0.07;
      ctx.fillRect(0, 40, LOGIC_W, 10);
      ctx.globalAlpha = 1;
    }

    // draw floors first so desks layer on top
    const platforms = game.map.platforms;
    for (let i = 0; i < platforms.length; i++) {
      if (platforms[i].h >= 40) drawPlatform(ctx, platforms[i], camX, theme);
    }
    drawDecor(ctx, game.map.decor, camX, theme);
    for (let i = 0; i < platforms.length; i++) {
      if (platforms[i].h < 40) drawPlatform(ctx, platforms[i], camX, theme);
    }
    for (let i = 0; i < game.effects.calendarBlocks.length; i++) {
      drawPlatform(ctx, game.effects.calendarBlocks[i], camX, theme);
    }
    for (let i = 0; i < game.effects.hallucinated.length; i++) {
      drawPlatform(ctx, game.effects.hallucinated[i], camX, theme);
    }

    drawDeployZone(ctx, game.map.deploy, camX, game.time);

    if (game.interactables) {
      for (let i = 0; i < game.interactables.length; i++) {
        drawInteractable(ctx, game.interactables[i], camX);
      }
    }
    if (game.collectibles) {
      for (let i = 0; i < game.collectibles.length; i++) {
        drawCollectible(ctx, game.collectibles[i], camX, game.time);
      }
    }
    drawProjectiles(ctx, game, camX);
    drawGhost(ctx, game, camX);
    for (let i = 0; i < game.enemies.length; i++) {
      drawEnemy(ctx, game.enemies[i], camX, game.time);
    }
    drawBoss(ctx, game.bossChase, camX);
    drawPlayer(
      ctx,
      game.player,
      camX,
      (game.effects && game.effects.sleepDebt) || 0,
      game.time
    );
    // Star invuln sparkle
    if (game.effects && (game.effects.standupTimer > 0 || game.effects.pureMarioTimer > 0)) {
      ctx.strokeStyle = "rgba(251,191,36,0.6)";
      ctx.lineWidth = 2;
      const px = game.player.x - camX + game.player.w / 2;
      const py = game.player.y + game.player.h / 2;
      ctx.beginPath();
      ctx.arc(px, py, 22 + Math.sin((game.time || 0) * 10) * 3, 0, Math.PI * 2);
      ctx.stroke();
    }
    drawFx(ctx, game, camX);
    drawThoughtBubble(ctx, game, camX);
    // HUD without shake
    ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
    drawHUD(ctx, game);

    if (game.notifications.active) {
      drawNotification(ctx, game.notifications.active, {
        largeText: !!(game.settings && game.settings.largeText),
      });
    }
    if (game.phase === "gameover") {
      drawGameOver(ctx, game);
    }
    // Sleep debt vision filter
    const sd = (game.effects && game.effects.sleepDebt) || 0;
    if (sd > 40 && !(game.settings && game.settings.reduceMotion)) {
      ctx.fillStyle = "rgba(30,27,75," + Math.min(0.45, (sd - 40) / 140) + ")";
      ctx.fillRect(0, 0, LOGIC_W, LOGIC_H);
      if (sd > 70) {
        ctx.fillStyle = "rgba(15,23,42," + Math.min(0.25, (sd - 70) / 200) + ")";
        ctx.fillRect(0, 0, LOGIC_W, LOGIC_H);
      }
    }
    // Screen flash
    if (game.fx && game.fx.flash > 0 && !(game.settings && game.settings.reduceMotion)) {
      ctx.fillStyle = game.fx.flashColor || "#fff";
      ctx.globalAlpha = Math.min(0.45, game.fx.flash);
      ctx.fillRect(0, 0, LOGIC_W, LOGIC_H);
      ctx.globalAlpha = 1;
    }
  }

  const API = {
    VIEW_W: VIEW_W,
    VIEW_H: VIEW_H,
    LOGIC_W: LOGIC_W,
    LOGIC_H: LOGIC_H,
    SCALE: SCALE,
    draw: draw,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = API;
  }
  root.BossSaysRender = API;
})(typeof globalThis !== "undefined" ? globalThis : this);
