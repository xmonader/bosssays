/**
 * Office map with per-sprint variation — same route length, different feel.
 */
(function (root) {
  "use strict";

  const MAP_WIDTH = 3200;
  const MAP_HEIGHT = 480;
  const GROUND_Y = 420;

  const BRANDS = [
    "SYNTHO",
    "ALIGNLY",
    "PROMPTLY",
    "VIBEOPS",
    "AGENTLY",
    "SHIPFAST",
    "CLOUDNOIR",
    "PIVOTAI",
    "STACKR",
    "MEETLY",
  ];

  const THEMES = [
    {
      id: "open-office",
      sky: ["#c8d8e8", "#e8eef4", "#d0d8e0"],
      floor: "#6b7280",
      floorTop: "#9ca3af",
      desk: "#92400e",
      deskTop: "#d97706",
      accent: "#38bdf8",
      zones: ["LOBBY", "OPEN OFFICE", "KITCHEN", "MEETING PODS", "STAGING / PROD"],
    },
    {
      id: "all-hands",
      sky: ["#fde68a", "#fef3c7", "#fcd34d"],
      floor: "#b45309",
      floorTop: "#fbbf24",
      desk: "#7c2d12",
      deskTop: "#ea580c",
      accent: "#dc2626",
      zones: ["STAGE", "ALL-HANDS", "SNACK SPONSOR", "Q&A PIT", "APPLAUSE ZONE"],
    },
    {
      id: "war-room",
      sky: ["#450a0a", "#7f1d1d", "#450a0a"],
      floor: "#3f3f46",
      floorTop: "#71717a",
      desk: "#1c1917",
      deskTop: "#a8a29e",
      accent: "#f87171",
      zones: ["WAR ROOM", "INCIDENT", "BLAME BOARD", "WAR ROOM 2", "SEV-1 CLOSET"],
    },
    {
      id: "remote",
      sky: ["#312e81", "#4c1d95", "#1e1b4b"],
      floor: "#4c1d95",
      floorTop: "#a78bfa",
      desk: "#5b21b6",
      deskTop: "#c4b5fd",
      accent: "#22d3ee",
      zones: ["ZOOM VOID", "MUTE ZONE", "BG BLUR", "WAITING ROOM", "END MEETING"],
    },
    {
      id: "hackathon",
      sky: ["#064e3b", "#065f46", "#022c22"],
      floor: "#14532d",
      floorTop: "#4ade80",
      desk: "#166534",
      deskTop: "#86efac",
      accent: "#f0abfc",
      zones: ["HACK ZONE", "PIZZA LAB", "DEMO STAGE", "SLEEP PODS", "SHIP OR DIE"],
    },
    {
      id: "board-walk",
      sky: ["#1e293b", "#334155", "#0f172a"],
      floor: "#0f172a",
      floorTop: "#cbd5e1",
      desk: "#1e293b",
      deskTop: "#f8fafc",
      accent: "#fbbf24",
      zones: ["LOBBY LOGO", "INVESTOR PATH", "DECK HALL", "BOARDROOM", "RUNWAY"],
    },
    {
      id: "on-call",
      sky: ["#0c4a6e", "#075985", "#082f49"],
      floor: "#164e63",
      floorTop: "#22d3ee",
      desk: "#155e75",
      deskTop: "#67e8f9",
      accent: "#f97316",
      zones: ["NOC", "PAGER ALLEY", "RUNBOOKS", "ESCALATION", "POSTMORTEM"],
    },
    {
      id: "reorg",
      sky: ["#44403c", "#78716c", "#292524"],
      floor: "#57534e",
      floorTop: "#d6d3d1",
      desk: "#44403c",
      deskTop: "#a8a29e",
      accent: "#fb7185",
      zones: ["TEAM A?", "TEAM B?", "MATRIX ORG", "DOTTED LINE", "NEW MANAGER"],
    },
  ];

  function rect(x, y, w, h, label) {
    return { x: x, y: y, w: w, h: h, label: label || "" };
  }

  function mulberry32(a) {
    return function () {
      let t = (a += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function pick(rng, arr) {
    return arr[Math.floor(rng() * arr.length)];
  }

  function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }

  function rectsOverlap(a, b, pad) {
    pad = pad || 0;
    return (
      a.x < b.x + b.w + pad &&
      a.x + a.w + pad > b.x &&
      a.y < b.y + b.h + pad &&
      a.y + a.h + pad > b.y
    );
  }

  function overlapsAny(list, cand, pad) {
    for (let i = 0; i < list.length; i++) {
      if (rectsOverlap(list[i], cand, pad)) return true;
    }
    return false;
  }

  /**
   * Build office geometry. Varies by sprint (layout + brand + theme).
   * @param {{sprint?:number, rng?:function}|number} opts
   */
  function createOfficeMap(opts) {
    if (typeof opts === "number") opts = { sprint: opts };
    opts = opts || {};
    const sprint = opts.sprint != null ? opts.sprint : 1;
    const rng =
      opts.rng ||
      mulberry32((sprint * 9973 + 42) >>> 0);

    const theme = THEMES[(sprint - 1) % THEMES.length];
    const brand = BRANDS[(sprint - 1) % BRANDS.length];
    // Secondary brand flip mid-name for chaos
    const brandLabel =
      sprint % 3 === 0
        ? brand + " → " + BRANDS[sprint % BRANDS.length]
        : brand + " HQ";

    // Gap pattern between floor segments — wide enough for player (28px) to fall through
    const gapBase = [78, 88, 86, 90];
    const gaps = gapBase.map(function (g, i) {
      return clamp(g + Math.floor((rng() - 0.5) * 28), 64, 120);
    });

    // Floor segment widths vary slightly
    const widths = [700, 500, 600, 500, 580].map(function (w) {
      return clamp(w + Math.floor((rng() - 0.5) * 80), 420, 760);
    });

    const platforms = [];
    let x = 0;
    const floorSegs = [];
    for (let i = 0; i < widths.length; i++) {
      if (x >= MAP_WIDTH - 80) break;
      const isLast = i === widths.length - 1;
      let segW = widths[i];
      if (isLast || x + segW + 40 >= MAP_WIDTH) {
        segW = MAP_WIDTH - x;
      }
      if (segW < 80) break;
      const seg = rect(x, GROUND_Y, segW, 60, "floor-" + i);
      platforms.push(seg);
      floorSegs.push(seg);
      x += segW;
      if (!isLast && i < gaps.length && x < MAP_WIDTH - 200) {
        x += gaps[i];
      }
    }
    // Safety: fill only missing end coverage (no full-overlap with last segment)
    if (floorSegs.length === 0) {
      const end = rect(0, GROUND_Y, MAP_WIDTH, 60, "floor-end");
      platforms.push(end);
      floorSegs.push(end);
    } else {
      const last = floorSegs[floorSegs.length - 1];
      const coverEnd = last.x + last.w;
      if (coverEnd < MAP_WIDTH - 4) {
        const end = rect(coverEnd, GROUND_Y, MAP_WIDTH - coverEnd + 20, 60, "floor-end");
        platforms.push(end);
        floorSegs.push(end);
      }
    }

    // Floating platforms — placed without stacking on each other
    const LOW = 355;
    const MID = 300;
    const floatPlats = [];
    const floatTemplates = [
      { rel: 0.06, y: LOW, w: 110, label: "desk" },
      { rel: 0.12, y: MID, w: 100, label: "whiteboard" },
      { rel: 0.17, y: LOW, w: 90, label: "plant-shelf" },
      { rel: 0.28, y: LOW, w: 130, label: "standup" },
      { rel: 0.34, y: MID, w: 110, label: "monitor" },
      { rel: 0.39, y: LOW, w: 90, label: "side-desk" },
      { rel: 0.47, y: LOW, w: 140, label: "snack-bar" },
      { rel: 0.53, y: MID, w: 100, label: "fridge" },
      { rel: 0.58, y: LOW, w: 90, label: "counter" },
      { rel: 0.68, y: LOW, w: 120, label: "glass-pod" },
      { rel: 0.74, y: MID, w: 100, label: "zoom-room" },
      { rel: 0.79, y: LOW, w: 90, label: "pod-exit" },
      { rel: 0.87, y: LOW, w: 130, label: "server-rack" },
      { rel: 0.93, y: MID, w: 100, label: "deploy-ledge" },
      { rel: 0.97, y: LOW, w: 80, label: "ship-step" },
    ];

    const mode = (sprint - 1) % 5;

    function tryAddFloat(cand) {
      // Keep horizontal corridors so the player (28px) can drop between floats
      if (overlapsAny(floatPlats, cand, 22)) return false;
      // Same-height neighbors need a real drop gap (player + breathing room)
      for (let fi = 0; fi < floatPlats.length; fi++) {
        const o = floatPlats[fi];
        if (Math.abs(o.y - cand.y) > 20) continue;
        const left = cand.x < o.x ? cand : o;
        const right = cand.x < o.x ? o : cand;
        const gap = right.x - (left.x + left.w);
        if (gap >= 0 && gap < 44) return false;
      }
      floatPlats.push(cand);
      platforms.push(cand);
      return true;
    }

    floatTemplates.forEach(function (t, i) {
      if (mode === 3 && i % 3 === 1 && i < floatTemplates.length - 3) return;
      if (mode === 1 && t.y === MID && rng() < 0.35) return;

      let placed = false;
      for (let attempt = 0; attempt < 14 && !placed; attempt++) {
        let y = t.y;
        if (mode === 2) y = i % 2 === 0 ? LOW : MID;
        if (mode === 4) y = i % 2 === 0 ? MID : LOW;
        y = clamp(y + Math.floor((rng() - 0.5) * 18), 295, 365);
        const px = clamp(
          Math.floor(t.rel * MAP_WIDTH + (rng() - 0.5) * (40 + attempt * 8)),
          40,
          MAP_WIDTH - 140
        );
        const w = clamp(t.w + Math.floor((rng() - 0.5) * 24), 70, 150);
        placed = tryAddFloat(rect(px, y, w, 14, t.label));
      }
    });

    // Gap bridges — only if they don't stack on existing floats
    if (mode === 0 || mode === 2 || sprint % 2 === 0) {
      for (let i = 0; i < floorSegs.length - 1; i++) {
        const a = floorSegs[i];
        const b = floorSegs[i + 1];
        const gapStart = a.x + a.w;
        const gapEnd = b.x;
        if (gapEnd - gapStart <= 55 || rng() >= 0.75) continue;
        const gapMid = (gapStart + gapEnd) / 2;
        tryAddFloat(
          rect(gapMid - 35, 360 + Math.floor(rng() * 12), 70, 14, "gap-bridge")
        );
      }
    }

    if (sprint % 2 === 1) {
      tryAddFloat(rect(600 + Math.floor(rng() * 160), 330, 70, 14, "hot-desk"));
      tryAddFloat(rect(1900 + Math.floor(rng() * 160), 330, 70, 14, "hot-desk"));
    }

    // Walls
    platforms.push(rect(-40, 0, 40, MAP_HEIGHT, "wall-l"));
    platforms.push(rect(MAP_WIDTH, 0, 40, MAP_HEIGHT, "wall-r"));

    const spawn = { x: 60, y: GROUND_Y - 40 };
    const deploy = rect(MAP_WIDTH - 120, GROUND_Y - 80, 40, 80, "deploy");

    const COLLECT_SIZE = 26;
    const ENEMY_SIZE = 28;
    function pickup(px, py, kind) {
      return {
        x: px,
        y: py,
        w: COLLECT_SIZE,
        h: COLLECT_SIZE,
        kind: kind || "story",
      };
    }

    const safeTops = [];
    const floorTops = [];
    for (let i = 0; i < platforms.length; i++) {
      const p = platforms[i];
      if (p.label === "wall-l" || p.label === "wall-r") continue;
      if (p.w < 50) continue;
      const margin = p.h >= 40 ? 28 : 12;
      if (p.w < margin * 2 + COLLECT_SIZE) continue;
      safeTops.push(p);
      if (p.h >= 40) floorTops.push(p);
    }

    // Collectibles first so blockers never claim SP/coffee tiles
    const collectibleSpawns = [];
    const PICKUP_PAD = 18; // min separation between pickups

    function placeOnSafeTop(kind, preferFloor) {
      const pool =
        preferFloor && floorTops.length ? floorTops : safeTops;
      if (!pool.length) return null;
      for (let attempt = 0; attempt < 20; attempt++) {
        const p = pick(rng, pool);
        const margin = p.h >= 40 ? 28 : 12;
        const minX = p.x + margin;
        const maxX = p.x + p.w - margin - COLLECT_SIZE;
        if (maxX <= minX) continue;
        const px = Math.floor(minX + rng() * (maxX - minX));
        const py = p.y - COLLECT_SIZE + 4;
        const cand = pickup(px, py, kind);
        if (overlapsAny(collectibleSpawns, cand, PICKUP_PAD)) continue;
        return cand;
      }
      return null;
    }

    const pickupCount = 18 + (sprint % 4);
    for (let i = 0; i < pickupCount; i++) {
      const kind = rng() < 0.28 ? "coffee" : "story";
      const c = placeOnSafeTop(kind, kind === "coffee");
      if (c) collectibleSpawns.push(c);
    }
    // Guaranteed early coffee + SP if space
    const g1 = placeOnSafeTop("coffee", true);
    if (g1) collectibleSpawns.push(g1);
    const g2 = placeOnSafeTop("story", true);
    if (g2) collectibleSpawns.push(g2);
    if (floorSegs[0]) {
      const p = floorSegs[0];
      const early = [
        pickup(Math.floor(p.x + 50), p.y - COLLECT_SIZE + 4, "coffee"),
        pickup(Math.floor(p.x + 130), p.y - COLLECT_SIZE + 4, "story"),
      ];
      for (let i = 0; i < early.length; i++) {
        if (!overlapsAny(collectibleSpawns, early[i], PICKUP_PAD)) {
          collectibleSpawns.push(early[i]);
        }
      }
    }

    // Enemies after pickups: never on SP/coffee, keep off spawn, patrol wide floors
    // Cap density so player can always drop/walk between blockers (player w=28)
    const enemyCount = clamp(4 + Math.floor((sprint - 1) / 2), 4, 9);
    const enemySpawns = [];
    const speedBase = 40 + Math.min(40, sprint * 3);
    const ENEMY_PICKUP_PAD = 36;
    // Edge-to-edge style pad: leave room for player + jump buffer between blockers
    const ENEMY_SEP = 72;
    // Prefer wide solid tops so ledge AI has room to patrol
    const patrolTops = floorTops.filter(function (p) {
      return p.w >= 160;
    });
    // Only LOW floats (desks) — mid/high ledges are often not jumpable without a step chain
    // Player jump peak ~136px; ground feet→LOW is fine; MID from ground is tight/missable
    const REACHABLE_FLOAT_MIN_Y = 330; // only ~desk height
    const floatPatrol = floatPlats.filter(function (p) {
      return p.w >= 120 && p.y >= REACHABLE_FLOAT_MIN_Y && p.label !== "hr-dungeon";
    });
    // Track how many enemies already on each host platform (by approx key)
    const hostLoad = {};

    function hostKey(p) {
      if (!p) return "ground";
      return Math.round(p.x) + ":" + Math.round(p.y) + ":" + Math.round(p.w);
    }

    for (let i = 0; i < enemyCount; i++) {
      let placed = false;
      for (let attempt = 0; attempt < 28 && !placed; attempt++) {
        // Prefer floor (85%); rare desk-only floats so blockers stay stompable
        const onFloat = rng() < 0.12 && floatPatrol.length > 0;
        let host;
        let ex;
        let ey;
        if (onFloat) {
          host = pick(rng, floatPatrol);
          if ((hostLoad[hostKey(host)] || 0) >= 1) continue;
          const inset = 28;
          const span = Math.max(4, host.w - inset * 2 - ENEMY_SIZE);
          ex = host.x + inset + rng() * span;
          ey = host.y - ENEMY_SIZE;
        } else {
          host =
            patrolTops.length > 0
              ? pick(rng, patrolTops)
              : floorTops.length
                ? pick(rng, floorTops)
                : null;
          if (host) {
            // Density cap: ~1 enemy per 220px of floor
            const maxOn = Math.max(1, Math.floor(host.w / 220));
            if ((hostLoad[hostKey(host)] || 0) >= maxOn) continue;
            const inset = 40;
            const span = Math.max(4, host.w - inset * 2 - ENEMY_SIZE);
            ex = host.x + inset + rng() * span;
            ey = host.y - ENEMY_SIZE;
          } else {
            ex = 220 + Math.floor(rng() * (MAP_WIDTH - 480));
            ey = GROUND_Y - ENEMY_SIZE;
          }
        }
        // Never above reachable height
        if (ey + ENEMY_SIZE < REACHABLE_FLOAT_MIN_Y - 4 && onFloat) continue;
        if (ey < GROUND_Y - ENEMY_SIZE - 80) continue; // refuse mid/high float spawns
        const cand = { x: ex, y: ey, w: ENEMY_SIZE, h: ENEMY_SIZE };
        if (ex < 160) continue;
        if (ex < spawn.x + 120) continue;
        if (ex > deploy.x - 90) continue;
        if (
          overlapsAny(
            enemySpawns.map(function (e) {
              return { x: e.x, y: e.y, w: ENEMY_SIZE, h: ENEMY_SIZE };
            }),
            cand,
            ENEMY_SEP
          )
        ) {
          continue;
        }
        if (overlapsAny(collectibleSpawns, cand, ENEMY_PICKUP_PAD)) continue;
        const dir = rng() < 0.5 ? -1 : 1;
        const sp = speedBase + Math.floor(rng() * 30);
        enemySpawns.push({ x: ex, y: ey, vx: dir * sp });
        const hk = hostKey(host);
        hostLoad[hk] = (hostLoad[hk] || 0) + 1;
        placed = true;
      }
    }

    const decor = [
      { x: 80, y: 70, text: brandLabel, kind: "sign" },
      {
        x: 80,
        y: 95,
        text: "Sprint " + sprint + " · " + theme.id,
        kind: "sign",
      },
      { x: floorSegs[1] ? floorSegs[1].x + 20 : 820, y: 80, text: theme.zones[1], kind: "sign" },
      { x: floorSegs[2] ? floorSegs[2].x + 20 : 1500, y: 80, text: theme.zones[2], kind: "sign" },
      { x: floorSegs[3] ? floorSegs[3].x + 20 : 2150, y: 80, text: theme.zones[3], kind: "sign" },
      { x: floorSegs[4] ? floorSegs[4].x + 20 : 2750, y: 80, text: theme.zones[4], kind: "sign" },
      { x: MAP_WIDTH - 140, y: GROUND_Y - 110, text: "DEPLOY", kind: "flag" },
    ];

    const PROP_KINDS = [
      { kind: "chair", emoji: "🪑" },
      { kind: "plant", emoji: "🪴" },
      { kind: "monitor", emoji: "🖥" },
      { kind: "box", emoji: "📦" },
      { kind: "chart", emoji: "📊" },
      { kind: "lock", emoji: "🔐" },
      { kind: "antenna", emoji: "📡" },
      { kind: "beanbag", emoji: "🛋" },
    ];
    const interactableSpawns = [];
    const PROP_PAD = 22;
    const propCount = 10 + (sprint % 5);
    for (let i = 0; i < propCount; i++) {
      let placed = false;
      for (let attempt = 0; attempt < 18 && !placed; attempt++) {
        const pk = pick(rng, PROP_KINDS);
        const floor = floorTops.length ? pick(rng, floorTops) : null;
        if (!floor) break;
        const margin = 36;
        const minX = floor.x + margin;
        const maxX = floor.x + floor.w - margin - 28;
        if (maxX <= minX) continue;
        const px = Math.floor(minX + rng() * (maxX - minX));
        const cand = {
          x: px,
          y: floor.y - 30,
          w: 28,
          h: 30,
          kind: pk.kind,
          emoji: pk.emoji,
        };
        if (overlapsAny(interactableSpawns, cand, PROP_PAD)) continue;
        // Don't sit under/on a pickup
        if (overlapsAny(collectibleSpawns, cand, 12)) continue;
        interactableSpawns.push(cand);
        placed = true;
      }
    }

    // Secret HR dungeon — climbable stair (jump peak ~136px → max ~110px step rise)
    // Always: ground → desk(~350) → mid → high → HR ledge + snack
    const STEP_RISE = 70; // safe under 136px peak
    const stairYs = [350, 350 - STEP_RISE, 350 - STEP_RISE * 2, 350 - STEP_RISE * 3];
    // Find an X band where all 4 steps clear existing floats
    let hrTop = null;
    let stairPlaced = null;
    for (let attempt = 0; attempt < 40 && !hrTop; attempt++) {
      const secretX = clamp(
        900 + Math.floor(rng() * 1600) + attempt * 37,
        180,
        MAP_WIDTH - 300
      );
      const stairDefs = [
        { x: secretX - 30, y: stairYs[0], w: 110, label: "hr-step-0" },
        { x: secretX + 15, y: stairYs[1], w: 100, label: "hr-step-1" },
        { x: secretX + 50, y: stairYs[2], w: 95, label: "hr-step-2" },
        { x: secretX + 70, y: stairYs[3], w: 130, label: "hr-dungeon" },
      ];
      let clear = true;
      const cands = [];
      for (let si = 0; si < stairDefs.length; si++) {
        const s = stairDefs[si];
        const cand = rect(s.x, s.y, s.w, 14, s.label);
        if (overlapsAny(floatPlats, cand, 10)) {
          clear = false;
          break;
        }
        // steps shouldn't stack on each other except intentional cascade
        if (overlapsAny(cands, cand, 6)) {
          clear = false;
          break;
        }
        cands.push(cand);
      }
      if (!clear) continue;
      for (let si = 0; si < cands.length; si++) {
        platforms.push(cands[si]);
        floatPlats.push(cands[si]);
      }
      hrTop = cands[cands.length - 1];
      stairPlaced = cands;
    }
    if (hrTop && stairPlaced) {
      const secretPick = pickup(
        hrTop.x + Math.floor(hrTop.w / 2) - 13,
        hrTop.y - COLLECT_SIZE + 4,
        "secret"
      );
      collectibleSpawns.push(secretPick);
      decor.push({
        x: hrTop.x + 16,
        y: hrTop.y - 30,
        text: "HR?",
        kind: "sign",
      });
      decor.push({
        x: stairPlaced[0].x + 8,
        y: stairPlaced[0].y - 16,
        text: "↑ HR snacks",
        kind: "sign",
      });
    }

    return {
      width: MAP_WIDTH,
      height: MAP_HEIGHT,
      groundY: GROUND_Y,
      platforms: platforms,
      spawn: spawn,
      deploy: deploy,
      enemySpawns: enemySpawns,
      collectibleSpawns: collectibleSpawns,
      interactableSpawns: interactableSpawns,
      decor: decor,
      theme: theme,
      brand: brand,
      brandLabel: brandLabel,
      layoutMode: mode,
      sprint: sprint,
    };
  }

  function solidPlatforms(map, extras) {
    const list = map.platforms.slice();
    if (extras && extras.length) {
      for (let i = 0; i < extras.length; i++) list.push(extras[i]);
    }
    return list;
  }

  const API = {
    MAP_WIDTH: MAP_WIDTH,
    MAP_HEIGHT: MAP_HEIGHT,
    GROUND_Y: GROUND_Y,
    THEMES: THEMES,
    BRANDS: BRANDS,
    createOfficeMap: createOfficeMap,
    solidPlatforms: solidPlatforms,
    mulberry32: mulberry32,
    rectsOverlap: rectsOverlap,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = API;
  }
  root.BossSaysMap = API;
})(typeof globalThis !== "undefined" ? globalThis : this);
