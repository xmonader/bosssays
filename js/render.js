/**
 * Canvas renderer — simple colored rect art for office + entities + HUD.
 */
(function (root) {
  "use strict";

  const VIEW_W = 800;
  const VIEW_H = 480;

  function clear(ctx, w, h) {
    // Office sky / ceiling wash
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#c8d8e8");
    g.addColorStop(0.55, "#e8eef4");
    g.addColorStop(1, "#d0d8e0");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  function drawPlatform(ctx, p, camX) {
    const x = p.x - camX;
    const y = p.y;
    if (x + p.w < 0 || x > VIEW_W) return;

    if (p.kind === "calendar") {
      ctx.fillStyle = "#5b8def";
      ctx.fillRect(x, y, p.w, p.h);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 11px sans-serif";
      ctx.fillText("SYNC?", x + 8, y + 24);
      ctx.font = "10px sans-serif";
      ctx.fillText("Zoom", x + 12, y + 42);
      return;
    }
    if (p.kind === "hallucination") {
      ctx.globalAlpha = p.solid ? 0.85 : 0.35;
      ctx.fillStyle = "#c084fc";
      ctx.fillRect(x, y, p.w, p.h);
      ctx.strokeStyle = "#7c3aed";
      ctx.strokeRect(x, y, p.w, p.h);
      ctx.fillStyle = "#4c1d95";
      ctx.font = "9px sans-serif";
      ctx.fillText(p.solid ? "AI platform" : "hallucinated", x + 4, y - 4);
      ctx.globalAlpha = 1;
      return;
    }

    // Floor vs floating desk
    if (p.h >= 40) {
      ctx.fillStyle = "#6b7280";
      ctx.fillRect(x, y, p.w, p.h);
      ctx.fillStyle = "#9ca3af";
      ctx.fillRect(x, y, p.w, 6);
      // carpet stripes
      ctx.fillStyle = "#4b5563";
      for (let i = 0; i < p.w; i += 40) {
        ctx.fillRect(x + i, y + 20, 20, 4);
      }
    } else {
      ctx.fillStyle = "#92400e";
      ctx.fillRect(x, y, p.w, p.h);
      ctx.fillStyle = "#d97706";
      ctx.fillRect(x, y, p.w, 4);
      // monitor on desk
      if (p.label === "monitor" || p.label === "desk" || p.label === "standup") {
        ctx.fillStyle = "#1f2937";
        ctx.fillRect(x + p.w * 0.3, y - 22, 28, 18);
        ctx.fillStyle = "#38bdf8";
        ctx.fillRect(x + p.w * 0.3 + 3, y - 19, 22, 12);
      }
    }
  }

  function drawDecor(ctx, decor, camX) {
    for (let i = 0; i < decor.length; i++) {
      const d = decor[i];
      const x = d.x - camX;
      if (x < -100 || x > VIEW_W + 100) continue;
      if (d.kind === "flag") {
        ctx.fillStyle = "#16a34a";
        ctx.fillRect(x, d.y, 6, 70);
        ctx.fillStyle = "#22c55e";
        ctx.beginPath();
        ctx.moveTo(x + 6, d.y);
        ctx.lineTo(x + 40, d.y + 12);
        ctx.lineTo(x + 6, d.y + 24);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#14532d";
        ctx.font = "bold 12px sans-serif";
        ctx.fillText("DEPLOY", x - 10, d.y - 6);
      } else {
        ctx.fillStyle = "#334155";
        ctx.font = "bold 14px sans-serif";
        ctx.fillText(d.text, x, d.y);
      }
    }
  }

  function drawPlayer(ctx, p, camX) {
    const x = p.x - camX;
    const y = p.y;
    const blink = p.invuln > 0 && Math.floor(p.invuln * 10) % 2 === 0;
    if (blink) return;

    // body
    ctx.fillStyle = "#2563eb";
    ctx.fillRect(x + 4, y + 10, p.w - 8, p.h - 14);
    // head
    ctx.fillStyle = "#fbbf24";
    ctx.fillRect(x + 6, y, p.w - 12, 14);
    // hoodie hood
    ctx.fillStyle = "#1d4ed8";
    ctx.fillRect(x + 4, y + 8, p.w - 8, 6);
    // eyes
    ctx.fillStyle = "#111";
    const eye = p.facing >= 0 ? x + 16 : x + 8;
    ctx.fillRect(eye, y + 4, 3, 3);
    // laptop bag
    ctx.fillStyle = "#374151";
    ctx.fillRect(x + (p.facing >= 0 ? -2 : p.w - 4), y + 16, 6, 12);
  }

  function drawEnemy(ctx, e, camX) {
    if (!e.alive) return;
    const x = e.x - camX;
    const y = e.y;
    // Bug / ticket monster
    ctx.fillStyle = "#dc2626";
    ctx.fillRect(x, y + 6, e.w, e.h - 6);
    ctx.fillStyle = "#7f1d1d";
    ctx.beginPath();
    ctx.arc(x + e.w / 2, y + 8, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.fillRect(x + 6, y + 6, 4, 4);
    ctx.fillRect(x + e.w - 10, y + 6, 4, 4);
    ctx.fillStyle = "#111";
    ctx.font = "9px sans-serif";
    ctx.fillText("BUG", x + 4, y + e.h - 4);
  }

  function drawCollectible(ctx, c, camX, time) {
    if (c.collected) return;
    const x = c.x - camX;
    const y = c.y;
    if (x + c.w < -20 || x > VIEW_W + 20) return;
    const bob = Math.sin((time || 0) * 6 + c.x * 0.05) * 3;

    if (c.kind === "coffee") {
      // Mug — brown, clearly a pickup
      ctx.fillStyle = "#78350f";
      ctx.fillRect(x + 2, y + 4 + bob, c.w - 4, c.h - 6);
      ctx.fillStyle = "#fef3c7";
      ctx.fillRect(x + 4, y + 6 + bob, c.w - 8, 5);
      ctx.strokeStyle = "#92400e";
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 2, y + 4 + bob, c.w - 4, c.h - 6);
      // handle
      ctx.beginPath();
      ctx.arc(x + c.w - 1, y + 10 + bob, 4, -0.5, 0.5);
      ctx.stroke();
      ctx.fillStyle = "#451a03";
      ctx.font = "bold 8px sans-serif";
      ctx.fillText("☕", x + 3, y + bob - 1);
    } else {
      // Story-point coin — gold disc with SP
      const cx = x + c.w / 2;
      const cy = y + c.h / 2 + bob;
      ctx.fillStyle = "#fbbf24";
      ctx.beginPath();
      ctx.arc(cx, cy, c.w / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#b45309";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = "#78350f";
      ctx.font = "bold 9px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("SP", cx, cy + 3);
      ctx.textAlign = "left";
      // sparkle
      ctx.fillStyle = "#fef9c3";
      ctx.fillRect(cx + 3, cy - 6, 2, 2);
    }
  }

  function drawDeployZone(ctx, d, camX) {
    const x = d.x - camX;
    ctx.fillStyle = "rgba(34,197,94,0.25)";
    ctx.fillRect(x, d.y, d.w, d.h);
    ctx.strokeStyle = "#16a34a";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, d.y, d.w, d.h);
  }

  function drawHUD(ctx, game) {
    // Top bar
    ctx.fillStyle = "rgba(15,23,42,0.82)";
    ctx.fillRect(0, 0, VIEW_W, 40);

    ctx.fillStyle = "#f8fafc";
    ctx.font = "bold 13px sans-serif";
    ctx.fillText("Boss Says", 10, 17);

    ctx.font = "12px sans-serif";
    ctx.fillText("Sprint " + game.sprint, 100, 17);
    ctx.fillText("Ship " + game.deploys, 175, 17);

    // Score / pickups
    ctx.fillStyle = "#fbbf24";
    ctx.font = "bold 12px sans-serif";
    ctx.fillText("SP " + (game.score || 0), 240, 17);
    ctx.fillStyle = "#94a3b8";
    ctx.font = "11px sans-serif";
    const left =
      game.collectibles
        ? game.collectibles.filter(function (c) {
            return !c.collected;
          }).length
        : 0;
    ctx.fillText("left " + left, 300, 17);

    // Lives as PTO hearts
    ctx.fillStyle = "#e2e8f0";
    ctx.fillText("PTO", 355, 17);
    for (let i = 0; i < game.maxLives; i++) {
      ctx.fillStyle = i < game.lives ? "#f43f5e" : "#475569";
      ctx.beginPath();
      const hx = 385 + i * 14;
      ctx.arc(hx, 13, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Context meter
    const cm = game.effects.context;
    const maxC = 100;
    ctx.fillStyle = "#94a3b8";
    ctx.font = "11px sans-serif";
    ctx.fillText("Ctx", 440, 17);
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(468, 8, 100, 10);
    ctx.fillStyle = cm > 80 ? "#ef4444" : cm > 50 ? "#f59e0b" : "#22c55e";
    ctx.fillRect(468, 8, (100 * cm) / maxC, 10);

    // Status
    if (game.effects.stunTimer > 0) {
      ctx.fillStyle = "#fbbf24";
      ctx.fillText("STUNNED", 580, 17);
    } else if (game.effects.slowTimer > 0) {
      ctx.fillStyle = "#c084fc";
      ctx.fillText("SLOW", 580, 17);
    }

    // Legend strip
    ctx.fillStyle = "rgba(15,23,42,0.55)";
    ctx.fillRect(0, 28, VIEW_W, 14);
    ctx.fillStyle = "#fbbf24";
    ctx.font = "10px sans-serif";
    ctx.fillText("● SP = story points (collect)", 10, 38);
    ctx.fillStyle = "#d97706";
    ctx.fillText("☕ coffee = points + clears context", 175, 38);
    ctx.fillStyle = "#94a3b8";
    ctx.fillText("Touch to collect · pickups respawn each sprint", 400, 38);

    if (game.message && game.messageTimer > 0) {
      ctx.fillStyle = "rgba(15,23,42,0.75)";
      ctx.fillRect(VIEW_W / 2 - 200, 52, 400, 28);
      ctx.fillStyle = "#f8fafc";
      ctx.font = "13px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(game.message, VIEW_W / 2, 71);
      ctx.textAlign = "left";
    }
  }

  function drawNotification(ctx, note) {
    if (!note) return;
    const boxW = 420;
    const boxH = 160;
    const x = (VIEW_W - boxW) / 2;
    const y = 90;

    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);

    ctx.fillStyle = "#0f172a";
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 2;
    roundRect(ctx, x, y, boxW, boxH, 10);
    ctx.fill();
    ctx.stroke();

    // Slack-like header
    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 13px sans-serif";
    ctx.fillText("Slack · #" + note.from.toLowerCase() + "-stream", x + 16, y + 24);

    ctx.fillStyle = "#e2e8f0";
    ctx.font = "bold 14px sans-serif";
    ctx.fillText(note.from, x + 16, y + 48);

    ctx.fillStyle = "#cbd5e1";
    ctx.font = "13px sans-serif";
    wrapText(ctx, note.text, x + 16, y + 70, boxW - 32, 16);

    // Timer bar
    const t = Math.max(0, note.timer / note.maxTimer);
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(x + 16, y + 100, boxW - 32, 6);
    ctx.fillStyle = t < 0.3 ? "#ef4444" : "#38bdf8";
    ctx.fillRect(x + 16, y + 100, (boxW - 32) * t, 6);

    // Choices
    const choices = note.choices || [];
    const bw = 90;
    const gap = 8;
    const total = choices.length * bw + (choices.length - 1) * gap;
    let cx = x + (boxW - total) / 2;
    for (let i = 0; i < choices.length; i++) {
      const c = choices[i];
      ctx.fillStyle = "#1e293b";
      ctx.strokeStyle = "#64748b";
      roundRect(ctx, cx, y + 118, bw, 28, 6);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#f1f5f9";
      ctx.font = "11px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(c.label, cx + bw / 2, y + 136);
      ctx.textAlign = "left";
      // key hint
      ctx.fillStyle = "#94a3b8";
      ctx.font = "9px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("[" + (i + 1) + "]", cx + bw / 2, y + 112);
      ctx.textAlign = "left";
      cx += bw + gap;
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

  function wrapText(ctx, text, x, y, maxW, lineH) {
    const words = text.split(" ");
    let line = "";
    let yy = y;
    for (let n = 0; n < words.length; n++) {
      const test = line + words[n] + " ";
      if (ctx.measureText(test).width > maxW && n > 0) {
        ctx.fillText(line, x, yy);
        line = words[n] + " ";
        yy += lineH;
      } else {
        line = test;
      }
    }
    ctx.fillText(line, x, yy);
  }

  function drawGameOver(ctx, game) {
    ctx.fillStyle = "rgba(15,23,42,0.8)";
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.fillStyle = "#f8fafc";
    ctx.font = "bold 36px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("LAID OFF", VIEW_W / 2, VIEW_H / 2 - 20);
    ctx.font = "16px sans-serif";
    ctx.fillStyle = "#94a3b8";
    ctx.fillText(
      "Sprints " +
        game.sprint +
        " · Deploys " +
        game.deploys +
        " · Score " +
        (game.score || 0),
      VIEW_W / 2,
      VIEW_H / 2 + 16
    );
    ctx.fillText("Press R to re-interview (restart)", VIEW_W / 2, VIEW_H / 2 + 48);
    ctx.textAlign = "left";
  }

  function draw(ctx, game) {
    const camX = game.cameraX || 0;
    clear(ctx, VIEW_W, VIEW_H);

    // far wall tint stripes
    ctx.fillStyle = "rgba(148,163,184,0.15)";
    for (let i = 0; i < game.map.width; i += 200) {
      const x = i - camX;
      ctx.fillRect(x, 40, 2, VIEW_H - 40);
    }

    drawDecor(ctx, game.map.decor, camX);
    drawDeployZone(ctx, game.map.deploy, camX);

    const platforms = game.map.platforms;
    for (let i = 0; i < platforms.length; i++) {
      drawPlatform(ctx, platforms[i], camX);
    }
    for (let i = 0; i < game.effects.calendarBlocks.length; i++) {
      drawPlatform(ctx, game.effects.calendarBlocks[i], camX);
    }
    for (let i = 0; i < game.effects.hallucinated.length; i++) {
      drawPlatform(ctx, game.effects.hallucinated[i], camX);
    }

    if (game.collectibles) {
      for (let i = 0; i < game.collectibles.length; i++) {
        drawCollectible(ctx, game.collectibles[i], camX, game.time);
      }
    }
    for (let i = 0; i < game.enemies.length; i++) {
      drawEnemy(ctx, game.enemies[i], camX);
    }
    drawPlayer(ctx, game.player, camX);
    drawHUD(ctx, game);

    if (game.notifications.active) {
      drawNotification(ctx, game.notifications.active);
    }
    if (game.phase === "gameover") {
      drawGameOver(ctx, game);
    }
  }

  const API = {
    VIEW_W: VIEW_W,
    VIEW_H: VIEW_H,
    draw: draw,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = API;
  }
  root.BossSaysRender = API;
})(typeof globalThis !== "undefined" ? globalThis : this);
