/**
 * Single office-style map: platforms, spawn, deploy flag, enemy spawns.
 */
(function (root) {
  "use strict";

  const MAP_WIDTH = 3200;
  const MAP_HEIGHT = 480;
  const GROUND_Y = 420;

  function rect(x, y, w, h, label) {
    return { x: x, y: y, w: w, h: h, label: label || "" };
  }

  /**
   * Build static office geometry. Same world every sprint.
   */
  function createOfficeMap() {
    const platforms = [];

    // Main floor segments with small gaps
    platforms.push(rect(0, GROUND_Y, 700, 60, "lobby"));
    platforms.push(rect(780, GROUND_Y, 500, 60, "desks"));
    platforms.push(rect(1360, GROUND_Y, 600, 60, "kitchen"));
    platforms.push(rect(2040, GROUND_Y, 500, 60, "pods"));
    platforms.push(rect(2620, GROUND_Y, 580, 60, "prod"));

    // Floating platforms — stepped heights within jump reach (~135px from ground).
    // Ground top = 420. Low ~355 (65px), mid ~300 (120px), high ~250 via mid step.
    platforms.push(rect(180, 355, 110, 14, "desk"));
    platforms.push(rect(340, 300, 100, 14, "whiteboard"));
    platforms.push(rect(500, 355, 90, 14, "plant-shelf"));
    platforms.push(rect(880, 355, 130, 14, "standup"));
    platforms.push(rect(1060, 300, 110, 14, "monitor"));
    platforms.push(rect(1220, 355, 90, 14, "side-desk"));
    platforms.push(rect(1480, 355, 140, 14, "snack-bar"));
    platforms.push(rect(1680, 300, 100, 14, "fridge"));
    platforms.push(rect(1840, 355, 90, 14, "counter"));
    platforms.push(rect(2180, 355, 120, 14, "glass-pod"));
    platforms.push(rect(2380, 300, 100, 14, "zoom-room"));
    platforms.push(rect(2540, 355, 90, 14, "pod-exit"));
    platforms.push(rect(2780, 355, 130, 14, "server-rack"));
    platforms.push(rect(2960, 300, 100, 14, "deploy-ledge"));
    platforms.push(rect(3080, 355, 80, 14, "ship-step"));

    // Left wall / right soft barrier via tall platforms at edges
    platforms.push(rect(-40, 0, 40, MAP_HEIGHT, "wall-l"));
    platforms.push(rect(MAP_WIDTH, 0, 40, MAP_HEIGHT, "wall-r"));

    const spawn = { x: 60, y: GROUND_Y - 40 };
    const deploy = rect(3080, GROUND_Y - 80, 40, 80, "deploy");

    const enemySpawns = [
      { x: 350, y: GROUND_Y - 28, vx: 60 },
      { x: 950, y: GROUND_Y - 28, vx: -50 },
      { x: 1600, y: GROUND_Y - 28, vx: 55 },
      { x: 2300, y: GROUND_Y - 28, vx: -45 },
      { x: 2900, y: GROUND_Y - 28, vx: 40 },
      { x: 900, y: 355 - 28, vx: 40 },
      { x: 1500, y: 355 - 28, vx: -35 },
    ];

    // Pickups: walk/jump into them. story = score; coffee = score + clears context
    const COLLECT_SIZE = 18;
    function pickup(x, y, kind) {
      return {
        x: x,
        y: y,
        w: COLLECT_SIZE,
        h: COLLECT_SIZE,
        kind: kind || "story",
      };
    }
    const collectibleSpawns = [
      // lobby path
      pickup(250, GROUND_Y - 28, "story"),
      pickup(220, 355 - 28, "story"),
      pickup(380, 300 - 28, "story"),
      pickup(540, 355 - 28, "coffee"),
      // across first gap onto desks
      pickup(820, GROUND_Y - 28, "story"),
      pickup(920, 355 - 28, "story"),
      pickup(1100, 300 - 28, "story"),
      pickup(1280, 355 - 28, "story"),
      // kitchen
      pickup(1450, GROUND_Y - 28, "coffee"),
      pickup(1520, 355 - 28, "story"),
      pickup(1720, 300 - 28, "story"),
      pickup(1900, 355 - 28, "coffee"),
      // pods
      pickup(2100, GROUND_Y - 28, "story"),
      pickup(2220, 355 - 28, "story"),
      pickup(2420, 300 - 28, "story"),
      pickup(2580, 355 - 28, "coffee"),
      // prod / deploy approach
      pickup(2720, GROUND_Y - 28, "story"),
      pickup(2820, 355 - 28, "story"),
      pickup(3000, 300 - 28, "story"),
      pickup(3100, 355 - 28, "coffee"),
      // floating mid-air breadcrumbs over gaps (tempting)
      pickup(740, 360, "story"),
      pickup(1320, 360, "story"),
      pickup(2000, 360, "story"),
      pickup(2660, 360, "story"),
    ];

    // Decor labels for simple art (not solid)
    const decor = [
      { x: 80, y: 80, text: "SYNTHO HQ", kind: "sign" },
      { x: 820, y: 80, text: "OPEN OFFICE", kind: "sign" },
      { x: 1500, y: 80, text: "KITCHEN", kind: "sign" },
      { x: 2150, y: 80, text: "MEETING PODS", kind: "sign" },
      { x: 2750, y: 80, text: "STAGING / PROD", kind: "sign" },
      { x: 3080, y: GROUND_Y - 110, text: "DEPLOY", kind: "flag" },
    ];

    return {
      width: MAP_WIDTH,
      height: MAP_HEIGHT,
      groundY: GROUND_Y,
      platforms: platforms,
      spawn: spawn,
      deploy: deploy,
      enemySpawns: enemySpawns,
      collectibleSpawns: collectibleSpawns,
      decor: decor,
    };
  }

  /**
   * All solid platforms for collision (base + extras like calendar blocks).
   */
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
    createOfficeMap: createOfficeMap,
    solidPlatforms: solidPlatforms,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = API;
  }
  root.BossSaysMap = API;
})(typeof globalThis !== "undefined" ? globalThis : this);
