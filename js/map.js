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

    // Gap pattern between floor segments (keeps route learnable but not identical)
    const gapBase = [70, 80, 80, 80];
    const gaps = gapBase.map(function (g, i) {
      return clamp(g + Math.floor((rng() - 0.5) * 36), 48, 110);
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
    // Safety: always a landing strip at the end for deploy
    if (floorSegs.length === 0 || floorSegs[floorSegs.length - 1].x + floorSegs[floorSegs.length - 1].w < MAP_WIDTH) {
      const lastX = Math.max(0, MAP_WIDTH - 520);
      const end = rect(lastX, GROUND_Y, MAP_WIDTH - lastX + 20, 60, "floor-end");
      platforms.push(end);
      floorSegs.push(end);
    }

    // Floating platform templates — heights stay jumpable
    const LOW = 355;
    const MID = 300;
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

    // Sprint layout modes
    const mode = (sprint - 1) % 5;
    // 0 default, 1 low-heavy, 2 mid-steps, 3 sparse high, 4 zigzag

    floatTemplates.forEach(function (t, i) {
      // skip some platforms on sparse modes
      if (mode === 3 && i % 3 === 1 && i < floatTemplates.length - 3) return;
      if (mode === 1 && t.y === MID && rng() < 0.35) return;

      let y = t.y;
      if (mode === 2) y = i % 2 === 0 ? LOW : MID;
      if (mode === 4) y = i % 2 === 0 ? MID : LOW;
      // small jitter still within jump range from ground/low
      y = clamp(y + Math.floor((rng() - 0.5) * 20), 295, 365);

      const px = clamp(
        Math.floor(t.rel * MAP_WIDTH + (rng() - 0.5) * 50),
        40,
        MAP_WIDTH - 120
      );
      const w = clamp(t.w + Math.floor((rng() - 0.5) * 30), 70, 160);
      platforms.push(rect(px, y, w, 14, t.label));
    });

    // Optional bridge platforms over gaps (some sprints)
    if (mode === 0 || mode === 2 || sprint % 2 === 0) {
      for (let i = 0; i < floorSegs.length - 1; i++) {
        const a = floorSegs[i];
        const b = floorSegs[i + 1];
        const gapStart = a.x + a.w;
        const gapEnd = b.x;
        const gapMid = (gapStart + gapEnd) / 2;
        if (gapEnd - gapStart > 55 && rng() < 0.75) {
          platforms.push(
            rect(gapMid - 35, 360 + Math.floor(rng() * 15), 70, 14, "gap-bridge")
          );
        }
      }
    }

    // Moving-ish static "standing desk" extras mid-map
    if (sprint % 2 === 1) {
      platforms.push(
        rect(600 + Math.floor(rng() * 200), 330, 70, 14, "hot-desk")
      );
      platforms.push(
        rect(1900 + Math.floor(rng() * 200), 330, 70, 14, "hot-desk")
      );
    }

    // Walls
    platforms.push(rect(-40, 0, 40, MAP_HEIGHT, "wall-l"));
    platforms.push(rect(MAP_WIDTH, 0, 40, MAP_HEIGHT, "wall-r"));

    const spawn = { x: 60, y: GROUND_Y - 40 };
    const deploy = rect(MAP_WIDTH - 120, GROUND_Y - 80, 40, 80, "deploy");

    // Enemies: more and faster each few sprints
    const enemyCount = clamp(5 + Math.floor((sprint - 1) / 2), 5, 12);
    const enemySpawns = [];
    const speedBase = 40 + Math.min(40, sprint * 3);
    for (let i = 0; i < enemyCount; i++) {
      const onFloat = rng() < 0.3;
      const ex = 200 + Math.floor(rng() * (MAP_WIDTH - 400));
      const ey = onFloat
        ? LOW - 28 - Math.floor(rng() * 40)
        : GROUND_Y - 28;
      const dir = rng() < 0.5 ? -1 : 1;
      const sp = speedBase + Math.floor(rng() * 30);
      enemySpawns.push({ x: ex, y: ey, vx: dir * sp });
    }

    // Bigger pickups + sit in the player's torso so walking past always hits
    const COLLECT_SIZE = 26;
    function pickup(px, py, kind) {
      return {
        x: px,
        y: py,
        w: COLLECT_SIZE,
        h: COLLECT_SIZE,
        kind: kind || "story",
      };
    }

    // Safe tops only: solid walkable platforms with margin so pickups never sit over pits
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

    function placeOnSafeTop(kind, preferFloor) {
      const pool =
        preferFloor && floorTops.length ? floorTops : safeTops;
      if (!pool.length) {
        return pickup(80, GROUND_Y - COLLECT_SIZE - 8, kind);
      }
      const p = pick(rng, pool);
      const margin = p.h >= 40 ? 28 : 12;
      const minX = p.x + margin;
      const maxX = p.x + p.w - margin - COLLECT_SIZE;
      const px =
        maxX <= minX
          ? p.x + (p.w - COLLECT_SIZE) / 2
          : minX + rng() * (maxX - minX);
      // Sit on platform, overlapping player torso when walking past
      const py = p.y - COLLECT_SIZE + 4;
      return pickup(Math.floor(px), Math.floor(py), kind);
    }

    const collectibleSpawns = [];
    const pickupCount = 20 + (sprint % 5);
    for (let i = 0; i < pickupCount; i++) {
      const kind = rng() < 0.28 ? "coffee" : "story";
      // Coffee prefers floor so you walk into mugs on the carpet
      collectibleSpawns.push(placeOnSafeTop(kind, kind === "coffee"));
    }
    collectibleSpawns.push(placeOnSafeTop("story", true));
    collectibleSpawns.push(placeOnSafeTop("coffee", true));
    if (floorSegs[0]) {
      const p = floorSegs[0];
      collectibleSpawns.push(
        pickup(Math.floor(p.x + 50), p.y - COLLECT_SIZE + 4, "coffee")
      );
      collectibleSpawns.push(
        pickup(Math.floor(p.x + 120), p.y - COLLECT_SIZE + 4, "story")
      );
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

    // Interactive office junk — walk into for a reaction (on floors only)
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
    const propCount = 10 + (sprint % 5);
    for (let i = 0; i < propCount; i++) {
      const pk = pick(rng, PROP_KINDS);
      const floor = floorTops.length ? pick(rng, floorTops) : null;
      if (!floor) break;
      const margin = 36;
      const minX = floor.x + margin;
      const maxX = floor.x + floor.w - margin - 28;
      if (maxX <= minX) continue;
      const px = Math.floor(minX + rng() * (maxX - minX));
      interactableSpawns.push({
        x: px,
        y: floor.y - 30,
        w: 28,
        h: 30,
        kind: pk.kind,
        emoji: pk.emoji,
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
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = API;
  }
  root.BossSaysMap = API;
})(typeof globalThis !== "undefined" ? globalThis : this);
