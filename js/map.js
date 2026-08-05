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

    // Standing desks / floating platforms
    platforms.push(rect(200, 320, 120, 16, "desk"));
    platforms.push(rect(400, 260, 100, 16, "whiteboard"));
    platforms.push(rect(900, 340, 140, 16, "standup"));
    platforms.push(rect(1100, 280, 100, 16, "monitor"));
    platforms.push(rect(1500, 300, 160, 16, "snack-bar"));
    platforms.push(rect(1750, 240, 90, 16, "fridge"));
    platforms.push(rect(2200, 330, 130, 16, "glass-pod"));
    platforms.push(rect(2450, 270, 100, 16, "zoom-room"));
    platforms.push(rect(2800, 300, 150, 16, "server-rack"));
    platforms.push(rect(3000, 220, 100, 16, "deploy-ledge"));

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
      { x: 920, y: 340 - 28, vx: 40 },
      { x: 1520, y: 300 - 28, vx: -35 },
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
