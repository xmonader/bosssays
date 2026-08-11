/**
 * Canvas renderer — simple colored rect art for office + entities + HUD.
 */
(function (root) {
  "use strict";

  // Logical playfield (camera / world units). Canvas is scaled up for a bigger window.
  const LOGIC_W = 800;
  const LOGIC_H = 480;
  const SCALE = 1.6;
  const VIEW_W = Math.round(LOGIC_W * SCALE); // 1280 — canvas pixel width
  const VIEW_H = Math.round(LOGIC_H * SCALE); // 768 — canvas pixel height

  function clear(ctx, w, h, theme) {
    const sky = (theme && theme.sky) || ["#c8d8e8", "#e8eef4", "#d0d8e0"];
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, sky[0] || "#c8d8e8");
    g.addColorStop(0.55, sky[1] || sky[0]);
    g.addColorStop(1, sky[2] || sky[1] || sky[0]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  function drawPlatform(ctx, p, camX, theme) {
    const x = p.x - camX;
    const y = p.y;
    if (x + p.w < 0 || x > LOGIC_W) return;
    theme = theme || {};

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

    // Floor vs floating desk — colors follow sprint theme
    if (p.h >= 40) {
      ctx.fillStyle = theme.floor || "#6b7280";
      ctx.fillRect(x, y, p.w, p.h);
      ctx.fillStyle = theme.floorTop || "#9ca3af";
      ctx.fillRect(x, y, p.w, 6);
      ctx.fillStyle = "rgba(0,0,0,0.18)";
      for (let i = 0; i < p.w; i += 40) {
        ctx.fillRect(x + i, y + 20, 20, 4);
      }
    } else {
      ctx.fillStyle = theme.desk || "#92400e";
      ctx.fillRect(x, y, p.w, p.h);
      ctx.fillStyle = theme.deskTop || "#d97706";
      ctx.fillRect(x, y, p.w, 4);
      if (
        p.label === "monitor" ||
        p.label === "desk" ||
        p.label === "standup" ||
        p.label === "hot-desk"
      ) {
        ctx.fillStyle = "#1f2937";
        ctx.fillRect(x + p.w * 0.3, y - 22, 28, 18);
        ctx.fillStyle = theme.accent || "#38bdf8";
        ctx.fillRect(x + p.w * 0.3 + 3, y - 19, 22, 12);
      }
    }
  }

  function drawDecor(ctx, decor, camX) {
    for (let i = 0; i < decor.length; i++) {
      const d = decor[i];
      const x = d.x - camX;
      if (x < -100 || x > LOGIC_W + 100) continue;
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
      } else if (d.kind === "prop") {
        ctx.font = "16px sans-serif";
        ctx.fillText(d.text, x, d.y);
      } else {
        ctx.fillStyle = "#334155";
        ctx.font = "bold 14px sans-serif";
        ctx.fillText(d.text, x, d.y);
      }
    }
  }

  function drawPlayer(ctx, p, camX, sleepDebt) {
    const x = p.x - camX;
    const y = p.y;
    const blink = p.invuln > 0 && Math.floor(p.invuln * 10) % 2 === 0;
    if (blink) return;
    sleepDebt = sleepDebt || 0;

    // body
    ctx.fillStyle = "#2563eb";
    ctx.fillRect(x + 4, y + 10, p.w - 8, p.h - 14);
    // head — greyer when sleep-deprived
    ctx.fillStyle = sleepDebt > 60 ? "#d6d3d1" : sleepDebt > 35 ? "#e7e5e4" : "#fbbf24";
    ctx.fillRect(x + 6, y, p.w - 12, 14);
    // hoodie hood
    ctx.fillStyle = "#1d4ed8";
    ctx.fillRect(x + 4, y + 8, p.w - 8, 6);
    // eyes
    const eye = p.facing >= 0 ? x + 16 : x + 8;
    ctx.fillStyle = "#111";
    ctx.fillRect(eye, y + 4, 3, 3);
    // bags under eyes / Zzz when tired
    if (sleepDebt >= 30) {
      ctx.fillStyle = "rgba(55,48,40,0.45)";
      ctx.fillRect(eye - 1, y + 7, 5, 2);
      if (sleepDebt >= 55) {
        ctx.fillRect(eye - 1, y + 9, 4, 1);
      }
    }
    if (sleepDebt >= 70) {
      ctx.fillStyle = "#64748b";
      ctx.font = "9px sans-serif";
      ctx.fillText("z", x + p.w - 2, y - 2);
      if (sleepDebt >= 85) ctx.fillText("z", x + p.w + 4, y - 8);
    }
    // laptop bag
    ctx.fillStyle = "#374151";
    ctx.fillRect(x + (p.facing >= 0 ? -2 : p.w - 4), y + 16, 6, 12);
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
    if (x + c.w < -20 || x > LOGIC_W + 20) return;
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
    ctx.fillRect(0, 0, LOGIC_W, 40);

    ctx.fillStyle = "#f8fafc";
    ctx.font = "bold 13px sans-serif";
    ctx.fillText("Boss Says", 10, 17);

    ctx.font = "12px sans-serif";
    ctx.fillText("Sprint " + game.sprint, 100, 17);
    ctx.fillText("Ship " + game.deploys, 175, 17);
    if (game.map && game.map.brand) {
      ctx.fillStyle = (game.map.theme && game.map.theme.accent) || "#38bdf8";
      ctx.font = "bold 10px sans-serif";
      ctx.fillText(String(game.map.brand).slice(0, 10), 10, 38);
    }

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
    ctx.fillText("Ctx", 430, 17);
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(452, 8, 70, 10);
    ctx.fillStyle = cm > 80 ? "#ef4444" : cm > 50 ? "#f59e0b" : "#22c55e";
    ctx.fillRect(452, 8, (70 * cm) / maxC, 10);

    // Sleep debt — rises with stupid Slack, falls with coffee
    const sd = game.effects.sleepDebt || 0;
    ctx.fillStyle = "#94a3b8";
    ctx.fillText("Zzz", 530, 17);
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(554, 8, 70, 10);
    ctx.fillStyle = sd > 75 ? "#6366f1" : sd > 45 ? "#818cf8" : "#a5b4fc";
    ctx.fillRect(554, 8, (70 * sd) / 100, 10);

    // Status
    if (game.effects.stunTimer > 0) {
      ctx.fillStyle = "#fbbf24";
      ctx.fillText("STUNNED", 632, 17);
    } else if (game.effects.slowTimer > 0) {
      ctx.fillStyle = "#c084fc";
      ctx.fillText("SLOW", 632, 17);
    } else if (sd >= 60) {
      ctx.fillStyle = "#a5b4fc";
      ctx.fillText("TIRED", 632, 17);
    }

    // Slack inbox badge — unread does NOT freeze the game
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

    // Legend strip
    ctx.fillStyle = "rgba(15,23,42,0.55)";
    ctx.fillRect(0, 28, LOGIC_W, 14);
    ctx.fillStyle = "#fbbf24";
    ctx.font = "10px sans-serif";
    ctx.fillStyle = "#fbbf24";
    ctx.fillText("● SP", 70, 38);
    ctx.fillStyle = "#d97706";
    ctx.fillText("☕ coffee = wake up", 105, 38);
    ctx.fillStyle = "#94a3b8";
    ctx.fillText(
      "Tab=Slack · 1–4 reply · 5=QUIT · Zzz↑ from nonsense",
      230,
      38
    );

    if (game.message && game.messageTimer > 0) {
      ctx.fillStyle = "rgba(15,23,42,0.75)";
      ctx.fillRect(LOGIC_W / 2 - 220, 52, 440, 28);
      ctx.fillStyle = "#f8fafc";
      ctx.font = "12px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(game.message, LOGIC_W / 2, 71);
      ctx.textAlign = "left";
    }
  }

  function drawNotification(ctx, note) {
    if (!note) return;
    const boxW = 540;
    const boxH = 268;
    const x = (LOGIC_W - boxW) / 2;
    const y = 58;

    // Dim world — game is frozen while you read
    ctx.fillStyle = "rgba(2,6,23,0.55)";
    ctx.fillRect(0, 0, LOGIC_W, LOGIC_H);

    // PAUSED banner
    ctx.fillStyle = "#fbbf24";
    ctx.font = "bold 12px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(
      "READING SLACK · paused · 1–4 reply · 5 = nuclear quit",
      LOGIC_W / 2,
      y - 12
    );
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

    if (note.urgent) {
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
    ctx.font = "bold 15px sans-serif";
    ctx.fillText(note.name || note.from, x + 48, y + 54);
    ctx.fillStyle = "#94a3b8";
    ctx.font = "12px sans-serif";
    ctx.fillText(
      (note.title || note.from) + "  ·  just now  ·  expects a reply",
      x + 48,
      y + 72
    );

    // Body
    ctx.fillStyle = "#e2e8f0";
    ctx.font = "14px sans-serif";
    wrapText(ctx, note.text, x + 18, y + 100, boxW - 36, 18, 5);

    // Timer bar
    const t = Math.max(0, note.timer / note.maxTimer);
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(x + 18, y + 168, boxW - 36, 8);
    ctx.fillStyle = t < 0.25 ? "#ef4444" : accent;
    ctx.fillRect(x + 18, y + 168, (boxW - 36) * t, 8);
    ctx.fillStyle = "#64748b";
    ctx.font = "10px sans-serif";
    ctx.fillText(
      "1–4 normal replies · [5] FUCK YOU I QUIT ends the run",
      x + 18,
      y + 186
    );

    // Choices — row of 4 + nuclear row
    const choices = note.choices || [];
    const gap = 8;
    const row1 = choices.slice(0, 4);
    const row2 = choices.slice(4);
    const bw = 118;
    let total = row1.length * bw + (row1.length - 1) * gap;
    let cx = x + (boxW - total) / 2;
    for (let i = 0; i < row1.length; i++) {
      const c = row1[i];
      ctx.fillStyle = i === 2 ? "#14532d" : "#1e293b";
      ctx.strokeStyle = i === 2 ? "#22c55e" : "#64748b";
      roundRect(ctx, cx, y + 196, bw, 26, 6);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#f1f5f9";
      ctx.font = "10px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("[" + (i + 1) + "] " + c.label, cx + bw / 2, y + 213);
      ctx.textAlign = "left";
      cx += bw + gap;
    }
    if (row2.length) {
      const q = row2[0];
      const qbw = 280;
      const qx = x + (boxW - qbw) / 2;
      ctx.fillStyle = "#7f1d1d";
      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 2;
      roundRect(ctx, qx, y + 228, qbw, 28, 6);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#fecaca";
      ctx.font = "bold 12px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("[5] " + q.label, qx + qbw / 2, y + 247);
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
    ctx.fillStyle = quit ? "#fecaca" : "#f8fafc";
    ctx.font = "bold 34px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(
      quit ? "I QUIT." : "LAID OFF",
      LOGIC_W / 2,
      LOGIC_H / 2 - 28
    );
    ctx.font = "15px sans-serif";
    ctx.fillStyle = quit ? "#fca5a5" : "#94a3b8";
    ctx.fillText(
      quit
        ? "You sent the message. HR is typing. Birds are singing."
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
        " · Zzz " +
        Math.round(game.effects.sleepDebt || 0),
      LOGIC_W / 2,
      LOGIC_H / 2 + 32
    );
    ctx.fillText(
      quit ? "Press R to un-quit (restart)" : "Press R to re-interview (restart)",
      LOGIC_W / 2,
      LOGIC_H / 2 + 58
    );
    ctx.textAlign = "left";
  }

  function draw(ctx, game) {
    const camX = game.cameraX || 0;
    const theme = (game.map && game.map.theme) || null;
    // Upscale logical playfield to full canvas (bigger on-screen game area)
    ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
    clear(ctx, LOGIC_W, LOGIC_H, theme);

    // far wall tint stripes
    ctx.fillStyle = "rgba(148,163,184,0.12)";
    const stripe = 160 + ((game.sprint || 1) % 5) * 12;
    for (let i = 0; i < game.map.width; i += stripe) {
      const x = i - camX;
      ctx.fillRect(x, 40, 2, LOGIC_H - 40);
    }

    // theme accent wash
    if (theme && theme.accent) {
      ctx.fillStyle = theme.accent;
      ctx.globalAlpha = 0.06;
      ctx.fillRect(0, 40, LOGIC_W, 8);
      ctx.globalAlpha = 1;
    }

    drawDecor(ctx, game.map.decor, camX);
    drawDeployZone(ctx, game.map.deploy, camX);

    const platforms = game.map.platforms;
    for (let i = 0; i < platforms.length; i++) {
      drawPlatform(ctx, platforms[i], camX, theme);
    }
    for (let i = 0; i < game.effects.calendarBlocks.length; i++) {
      drawPlatform(ctx, game.effects.calendarBlocks[i], camX, theme);
    }
    for (let i = 0; i < game.effects.hallucinated.length; i++) {
      drawPlatform(ctx, game.effects.hallucinated[i], camX, theme);
    }

    if (game.collectibles) {
      for (let i = 0; i < game.collectibles.length; i++) {
        drawCollectible(ctx, game.collectibles[i], camX, game.time);
      }
    }
    for (let i = 0; i < game.enemies.length; i++) {
      drawEnemy(ctx, game.enemies[i], camX);
    }
    drawPlayer(
      ctx,
      game.player,
      camX,
      (game.effects && game.effects.sleepDebt) || 0
    );
    drawThoughtBubble(ctx, game, camX);
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
