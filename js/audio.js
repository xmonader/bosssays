/**
 * Procedural SFX via Web Audio API (no external files — file:// safe).
 * Silent no-op when AudioContext is unavailable (Node tests).
 */
(function (root) {
  "use strict";

  let ctx = null;
  let master = null;
  let muted = false;
  let unlocked = false;
  let bgmNodes = null;
  let bgmPlaying = false;

  function hasAudio() {
    return (
      typeof AudioContext !== "undefined" ||
      typeof webkitAudioContext !== "undefined"
    );
  }

  function ensure() {
    if (ctx) return ctx;
    if (!hasAudio()) return null;
    const AC = AudioContext || webkitAudioContext;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.35;
    master.connect(ctx.destination);
    return ctx;
  }

  function unlock() {
    const c = ensure();
    if (!c) return false;
    if (c.state === "suspended") {
      c.resume();
    }
    unlocked = true;
    return true;
  }

  function setMuted(m) {
    muted = !!m;
    if (master) master.gain.value = muted ? 0 : 0.35;
    if (muted) stopBgm();
    else if (unlocked) startBgm();
  }

  function isMuted() {
    return muted;
  }

  function envGain(duration, peak, attack, release) {
    const c = ensure();
    if (!c || !master) return null;
    peak = peak == null ? 0.25 : peak;
    attack = attack == null ? 0.01 : attack;
    release = release == null ? 0.08 : release;
    const g = c.createGain();
    const t = c.currentTime;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(
      0.0001,
      t + Math.max(attack + 0.02, duration - release)
    );
    g.connect(master);
    return g;
  }

  function tone(freq, duration, type, peak) {
    const c = ensure();
    if (!c || muted || !unlocked) return;
    const g = envGain(duration, peak != null ? peak : 0.22);
    if (!g) return;
    const o = c.createOscillator();
    o.type = type || "square";
    o.frequency.setValueAtTime(freq, c.currentTime);
    o.connect(g);
    o.start();
    o.stop(c.currentTime + duration);
  }

  function slide(freq0, freq1, duration, type, peak) {
    const c = ensure();
    if (!c || muted || !unlocked) return;
    const g = envGain(duration, peak != null ? peak : 0.2);
    if (!g) return;
    const o = c.createOscillator();
    o.type = type || "square";
    const t = c.currentTime;
    o.frequency.setValueAtTime(freq0, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(40, freq1), t + duration);
    o.connect(g);
    o.start();
    o.stop(t + duration);
  }

  function noiseBurst(duration, peak) {
    const c = ensure();
    if (!c || muted || !unlocked) return;
    const g = envGain(duration, peak != null ? peak : 0.15, 0.005, 0.05);
    if (!g) return;
    const n = Math.floor(c.sampleRate * duration);
    const buf = c.createBuffer(1, n, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < n; i++) data[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource();
    src.buffer = buf;
    const filter = c.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 1200;
    src.connect(filter);
    filter.connect(g);
    src.start();
  }

  const SFX = {
    jump: function () {
      slide(280, 520, 0.12, "square", 0.18);
    },
    land: function () {
      noiseBurst(0.05, 0.08);
      tone(120, 0.06, "triangle", 0.1);
    },
    stomp: function () {
      slide(400, 140, 0.14, "square", 0.22);
      noiseBurst(0.08, 0.12);
    },
    hurt: function () {
      slide(320, 90, 0.28, "sawtooth", 0.2);
    },
    gameover: function () {
      slide(400, 100, 0.35, "square", 0.18);
      setTimeout(function () {
        slide(300, 70, 0.45, "square", 0.16);
      }, 180);
      setTimeout(function () {
        tone(55, 0.5, "triangle", 0.14);
      }, 400);
    },
    notify: function () {
      // Slack-ish double ping
      tone(880, 0.08, "sine", 0.2);
      setTimeout(function () {
        tone(1175, 0.1, "sine", 0.18);
      }, 90);
    },
    reply: function () {
      tone(660, 0.06, "sine", 0.14);
      setTimeout(function () {
        tone(880, 0.08, "sine", 0.12);
      }, 50);
    },
    timeout: function () {
      slide(500, 120, 0.35, "sawtooth", 0.18);
    },
    deploy: function () {
      tone(523, 0.1, "square", 0.16);
      setTimeout(function () {
        tone(659, 0.1, "square", 0.16);
      }, 90);
      setTimeout(function () {
        tone(784, 0.14, "square", 0.18);
      }, 180);
      setTimeout(function () {
        tone(1047, 0.22, "square", 0.16);
      }, 300);
    },
    stun: function () {
      tone(180, 0.15, "triangle", 0.12);
      noiseBurst(0.12, 0.08);
    },
  };

  function play(name) {
    if (muted || !unlocked) return false;
    const fn = SFX[name];
    if (!fn) return false;
    try {
      fn();
      return true;
    } catch (e) {
      return false;
    }
  }

  /** Soft looping office arpeggio (very quiet). */
  function startBgm() {
    const c = ensure();
    if (!c || muted || !unlocked || bgmPlaying) return;
    const notes = [262, 330, 392, 523, 392, 330]; // C major-ish
    const gain = c.createGain();
    gain.gain.value = 0.035;
    gain.connect(master);
    const osc = c.createOscillator();
    osc.type = "triangle";
    osc.connect(gain);
    let step = 0;
    const beat = 0.28;
    function schedule() {
      if (!bgmPlaying || !ctx) return;
      const t = ctx.currentTime;
      const f = notes[step % notes.length];
      osc.frequency.setValueAtTime(f, t);
      step++;
      bgmNodes.timer = setTimeout(schedule, beat * 1000);
    }
    osc.start();
    bgmPlaying = true;
    bgmNodes = { osc: osc, gain: gain, timer: null };
    schedule();
  }

  function stopBgm() {
    if (!bgmNodes) {
      bgmPlaying = false;
      return;
    }
    bgmPlaying = false;
    if (bgmNodes.timer) clearTimeout(bgmNodes.timer);
    try {
      bgmNodes.osc.stop();
    } catch (e) {
      /* already stopped */
    }
    try {
      bgmNodes.osc.disconnect();
      bgmNodes.gain.disconnect();
    } catch (e2) {
      /* ignore */
    }
    bgmNodes = null;
  }

  /**
   * Map game event types to SFX names and play them.
   * @param {Array<{type:string}>} events
   */
  function playEvents(events) {
    if (!events || !events.length) return;
    for (let i = 0; i < events.length; i++) {
      const t = events[i].type;
      if (t === "jump") play("jump");
      else if (t === "land") play("land");
      else if (t === "stomp") play("stomp");
      else if (t === "hurt") play("hurt");
      else if (t === "gameover") play("gameover");
      else if (t === "notify") play("notify");
      else if (t === "notify_reply") play("reply");
      else if (t === "notify_timeout") play("timeout");
      else if (t === "deploy") play("deploy");
      else if (t === "stun") play("stun");
    }
  }

  const API = {
    unlock: unlock,
    play: play,
    playEvents: playEvents,
    setMuted: setMuted,
    isMuted: isMuted,
    startBgm: startBgm,
    stopBgm: stopBgm,
    SFX_NAMES: Object.keys(SFX),
    // for tests without AudioContext
    _resetForTests: function () {
      stopBgm();
      unlocked = false;
      muted = false;
      ctx = null;
      master = null;
    },
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = API;
  }
  root.BossSaysAudio = API;
})(typeof globalThis !== "undefined" ? globalThis : this);
