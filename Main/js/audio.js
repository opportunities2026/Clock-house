// Звуки игры. Все звуки синтезируются прямо в браузере (Web Audio),
// поэтому никаких звуковых файлов скачивать не нужно.
// Музыки нет — только «живые» звуки дома.

let ctx = null;
let master, dry, wet, noiseBuf, roomVerb;
let volume = 0.8;
const loops = [];

export function audioReady() { return !!ctx; }

// На планшетах звук можно включить только после касания экрана.
export function unlockAudio() {
  if (ctx && ctx.state === "running") return;
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = volume; master.connect(ctx.destination);
    dry = ctx.createGain(); dry.connect(master);
    roomVerb = ctx.createConvolver(); roomVerb.buffer = impulse(2.2, 2.5);
    wet = ctx.createGain(); wet.gain.value = 0.35; roomVerb.connect(wet); wet.connect(master);
    noiseBuf = makeNoise(3);
  }
  if (ctx.state === "suspended") ctx.resume();
  // iOS: короткий тихий звук «будит» аудио
  const o = ctx.createOscillator(), g = ctx.createGain();
  g.gain.value = 0.0001; o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime + 0.05);
}

export function setVolume(v) {
  volume = v;
  if (master) master.gain.setTargetAtTime(v, ctx.currentTime, 0.05);
}

export function suspend(on) {
  if (!ctx) return;
  if (on) ctx.suspend(); else ctx.resume();
}

function makeNoise(sec) {
  const b = ctx.createBuffer(1, ctx.sampleRate * sec, ctx.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return b;
}

function impulse(sec, decay) {
  const len = ctx.sampleRate * sec, b = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = b.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
  }
  return b;
}

// Выход звука: в комнату (с эхом) и, если задано, из точки в 3D.
function out(pos, reverb = 0.5) {
  const g = ctx.createGain();
  let node = g;
  if (pos) {
    const p = ctx.createPanner();
    p.panningModel = "HRTF"; p.distanceModel = "inverse";
    p.refDistance = 1.2; p.rolloffFactor = 1.4; p.maxDistance = 40;
    setPos(p, pos);
    g.connect(p); node = p;
  }
  node.connect(dry);
  if (reverb > 0) {
    const s = ctx.createGain(); s.gain.value = reverb; node.connect(s); s.connect(roomVerb);
  }
  return g;
}

function setPos(p, v) {
  if (p.positionX) { p.positionX.value = v.x; p.positionY.value = v.y; p.positionZ.value = v.z; }
  else p.setPosition(v.x, v.y, v.z);
}

export function updateListener(camera) {
  if (!ctx) return;
  const l = ctx.listener, p = camera.position;
  const f = camera.getWorldDirection(camera.userData.tmpDir || (camera.userData.tmpDir = p.clone()));
  if (l.positionX) {
    const t = ctx.currentTime;
    l.positionX.setTargetAtTime(p.x, t, 0.02); l.positionY.setTargetAtTime(p.y, t, 0.02); l.positionZ.setTargetAtTime(p.z, t, 0.02);
    l.forwardX.setTargetAtTime(f.x, t, 0.02); l.forwardY.setTargetAtTime(f.y, t, 0.02); l.forwardZ.setTargetAtTime(f.z, t, 0.02);
    l.upX.value = 0; l.upY.value = 1; l.upZ.value = 0;
  } else {
    l.setPosition(p.x, p.y, p.z); l.setOrientation(f.x, f.y, f.z, 0, 1, 0);
  }
}

function noiseSrc(rate = 1) {
  const s = ctx.createBufferSource();
  s.buffer = noiseBuf; s.loop = true; s.playbackRate.value = rate;
  s.loopStart = Math.random() * 2; s.loopEnd = 3;
  return s;
}

function env(g, t, a, peak, d) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
}

function filt(type, freq, q = 1) {
  const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q; return f;
}

// Короткий шумовой «щелчок» через фильтр
function burst({ t = ctx.currentTime, type = "bandpass", freq = 1000, q = 1, a = 0.002, d = 0.08, gain = 0.5, dest, rate = 1 }) {
  const s = noiseSrc(rate), f = filt(type, freq, q), g = ctx.createGain();
  env(g, t, a, gain, d);
  s.connect(f); f.connect(g); g.connect(dest);
  s.start(t, Math.random() * 2); s.stop(t + a + d + 0.05);
}

function tone({ t = ctx.currentTime, type = "sine", freq = 440, to = null, a = 0.003, d = 0.3, gain = 0.3, dest }) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (to) o.frequency.exponentialRampToValueAtTime(to, t + a + d);
  env(g, t, a, gain, d);
  o.connect(g); g.connect(dest);
  o.start(t); o.stop(t + a + d + 0.05);
}

// ---------------------------------------------------------------- звуки
export const sfx = {
  step(surface = "wood", speed = 1) {
    if (!ctx) return;
    const d = out(null, 0.25), t = ctx.currentTime, v = 0.75 + Math.random() * 0.5;
    if (surface === "stone") {
      burst({ t, type: "bandpass", freq: 1800 + Math.random() * 600, q: 0.8, d: 0.05, gain: 0.25 * v, dest: d });
      burst({ t, type: "lowpass", freq: 300, d: 0.07, gain: 0.5 * v, dest: d });
    } else {
      burst({ t, type: "lowpass", freq: 500 + Math.random() * 300, q: 0.7, d: 0.09, gain: 0.55 * v * speed, dest: d });
      tone({ t, freq: 70 + Math.random() * 20, to: 45, d: 0.08, gain: 0.35 * v, dest: d });
      // иногда половица скрипит
      if (Math.random() < 0.12) creakGrain(t + 0.03, d, 0.15, 0.4);
    }
  },

  doorCreak(pos) {
    if (!ctx) return;
    const d = out(pos, 0.6), t = ctx.currentTime;
    creakGrain(t, d, 1.3, 1, 900);
    tone({ t: t + 1.25, freq: 90, to: 50, d: 0.2, gain: 0.4, dest: d });
  },

  unlock(pos) {
    if (!ctx) return;
    const d = out(pos, 0.4), t = ctx.currentTime;
    burst({ t, type: "highpass", freq: 3000, d: 0.03, gain: 0.5, dest: d });
    tone({ t, freq: 2200, d: 0.15, gain: 0.08, dest: d });
    burst({ t: t + 0.18, type: "bandpass", freq: 1200, q: 2, d: 0.06, gain: 0.7, dest: d });
    tone({ t: t + 0.18, freq: 160, to: 90, d: 0.12, gain: 0.4, dest: d });
  },

  locked(pos) {
    if (!ctx) return;
    const d = out(pos, 0.4), t = ctx.currentTime;
    for (let i = 0; i < 2; i++) {
      burst({ t: t + i * 0.12, type: "bandpass", freq: 900, q: 3, d: 0.05, gain: 0.6, dest: d });
      tone({ t: t + i * 0.12, freq: 120, d: 0.06, gain: 0.3, dest: d });
    }
  },

  click(pos, pitch = 1) {
    if (!ctx) return;
    const d = out(pos, 0.2), t = ctx.currentTime;
    burst({ t, type: "bandpass", freq: 2500 * pitch, q: 4, d: 0.03, gain: 0.5, dest: d });
    tone({ t, freq: 1800 * pitch, d: 0.04, gain: 0.08, dest: d });
  },

  drawer(pos, open = true) {
    if (!ctx) return;
    const d = out(pos, 0.3), t = ctx.currentTime;
    const s = noiseSrc(0.6), f = filt("bandpass", 450, 1.5), g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.35, t + 0.05);
    g.gain.setValueAtTime(0.3, t + 0.3); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.42);
    f.frequency.linearRampToValueAtTime(open ? 650 : 350, t + 0.4);
    s.connect(f); f.connect(g); g.connect(d); s.start(t); s.stop(t + 0.5);
    burst({ t: t + 0.4, type: "lowpass", freq: 400, d: 0.08, gain: 0.6, dest: d });
  },

  pickup() {
    if (!ctx) return;
    const d = out(null, 0.2), t = ctx.currentTime;
    burst({ t, type: "bandpass", freq: 3000, q: 1, d: 0.12, gain: 0.15, dest: d, rate: 0.5 });
    for (let i = 0; i < 3; i++) tone({ t: t + 0.04 + i * 0.05, freq: 2600 + Math.random() * 1500, d: 0.18, gain: 0.05, dest: d });
  },

  metal(pos) {
    if (!ctx) return;
    const d = out(pos, 0.4), t = ctx.currentTime;
    burst({ t, type: "lowpass", freq: 800, d: 0.1, gain: 0.6, dest: d });
    for (const f of [520, 1310, 2290]) tone({ t, freq: f, d: 0.5, gain: 0.06, dest: d });
  },

  paper() {
    if (!ctx) return;
    const d = out(null, 0.15), t = ctx.currentTime;
    for (let i = 0; i < 6; i++) burst({ t: t + i * 0.035 + Math.random() * 0.02, type: "highpass", freq: 2500 + Math.random() * 2000, d: 0.04, gain: 0.12, dest: d });
  },

  gearsTurning(pos, sec = 2.2) {
    if (!ctx) return;
    const d = out(pos, 0.5), t = ctx.currentTime;
    for (let i = 0; i < sec * 14; i++) {
      const tt = t + i / 14;
      burst({ t: tt, type: "bandpass", freq: 1800 + (i % 2) * 500, q: 5, d: 0.025, gain: 0.35, dest: d });
    }
    const s = noiseSrc(0.3), f = filt("lowpass", 250), g = ctx.createGain();
    env(g, t, 0.3, 0.25, sec);
    s.connect(f); f.connect(g); g.connect(d); s.start(t); s.stop(t + sec + 0.5);
  },

  wrong(pos) {
    if (!ctx) return;
    const d = out(pos, 0.4), t = ctx.currentTime;
    tone({ t, type: "triangle", freq: 180, to: 120, d: 0.25, gain: 0.25, dest: d });
    burst({ t, type: "lowpass", freq: 500, d: 0.15, gain: 0.5, dest: d });
  },

  // Уханье совы — далеко внизу, с гулким эхом
  owl(pos) {
    if (!ctx) return;
    const d = out(pos, 1.4), t = ctx.currentTime + 0.1;
    const hoot = (tt, f, len) => {
      const o = ctx.createOscillator(), g = ctx.createGain(), lp = filt("lowpass", 900);
      o.type = "sine";
      o.frequency.setValueAtTime(f * 0.92, tt); o.frequency.linearRampToValueAtTime(f, tt + 0.08);
      o.frequency.linearRampToValueAtTime(f * 0.94, tt + len);
      g.gain.setValueAtTime(0.0001, tt); g.gain.exponentialRampToValueAtTime(0.5, tt + 0.06);
      g.gain.setValueAtTime(0.45, tt + len - 0.1); g.gain.exponentialRampToValueAtTime(0.0001, tt + len);
      const vib = ctx.createOscillator(), vg = ctx.createGain(); vib.frequency.value = 6; vg.gain.value = 4;
      vib.connect(vg); vg.connect(o.frequency);
      o.connect(lp); lp.connect(g); g.connect(d);
      o.start(tt); vib.start(tt); o.stop(tt + len + 0.05); vib.stop(tt + len + 0.05);
    };
    hoot(t, 360, 0.35); hoot(t + 0.55, 340, 0.2); hoot(t + 0.85, 350, 0.6);
  },

  heartbeat(times = 6, interval = 0.55) {
    if (!ctx) return;
    const d = out(null, 0), t = ctx.currentTime;
    for (let i = 0; i < times; i++) {
      const tt = t + i * interval;
      tone({ t: tt, freq: 60, to: 40, d: 0.12, gain: 0.6, dest: d });
      tone({ t: tt + 0.18, freq: 55, to: 38, d: 0.1, gain: 0.4, dest: d });
    }
  },

  // Дыхание героя. fast = испуг/бег
  breath(fast = false, count = 4) {
    if (!ctx) return;
    const d = out(null, 0.05), t0 = ctx.currentTime;
    const inh = fast ? 0.35 : 0.9, exh = fast ? 0.4 : 1.1, gap = fast ? 0.05 : 0.5;
    let t = t0;
    for (let i = 0; i < count; i++) {
      for (const [len, f1, peak] of [[inh, 1300, 0.22], [exh, 900, 0.28]]) {
        const s = noiseSrc(1), bp = filt("bandpass", f1, 0.8), bp2 = filt("peaking", 2400, 2), g = ctx.createGain();
        bp2.gain.value = 6;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(peak * (fast ? 1 : 0.6), t + len * 0.35);
        g.gain.exponentialRampToValueAtTime(0.0001, t + len);
        bp.frequency.setValueAtTime(f1, t); bp.frequency.linearRampToValueAtTime(f1 * 0.8, t + len);
        s.connect(bp); bp.connect(bp2); bp2.connect(g); g.connect(d);
        s.start(t, Math.random() * 2); s.stop(t + len + 0.05);
        t += len + 0.02;
      }
      t += gap;
    }
  },

  spin(pos) {
    if (!ctx) return;
    const d = out(pos, 0.3), t = ctx.currentTime;
    const s = noiseSrc(0.4), f = filt("bandpass", 300, 1), g = ctx.createGain();
    env(g, t, 0.05, 0.3, 1.5);
    s.connect(f); f.connect(g); g.connect(d); s.start(t); s.stop(t + 1.6);
  },

  buttonPress(pos) {
    if (!ctx) return;
    const d = out(pos, 0.3), t = ctx.currentTime;
    burst({ t, type: "bandpass", freq: 1500, q: 3, d: 0.04, gain: 0.5, dest: d });
    tone({ t, freq: 900, to: 600, d: 0.08, gain: 0.08, dest: d });
  },

  lidOpen(pos) {
    if (!ctx) return;
    const d = out(pos, 0.4), t = ctx.currentTime;
    burst({ t, type: "bandpass", freq: 2200, q: 2, d: 0.05, gain: 0.4, dest: d });
    creakGrain(t + 0.05, d, 0.5, 0.5, 1600);
    // пружинка
    tone({ t: t + 0.05, type: "triangle", freq: 700, to: 300, d: 0.35, gain: 0.07, dest: d });
  },
};

// ---------------------------------------------------------------- звуки главы 2
Object.assign(sfx, {
  lever(pos) {
    if (!ctx) return;
    const d = out(pos, 0.5), t = ctx.currentTime;
    burst({ t, type: "bandpass", freq: 700, q: 2, d: 0.08, gain: 0.7, dest: d });
    tone({ t, freq: 140, to: 80, d: 0.15, gain: 0.35, dest: d });
    burst({ t: t + 0.09, type: "bandpass", freq: 2200, q: 4, d: 0.03, gain: 0.4, dest: d });
  },

  meow(pos) {
    if (!ctx) return;
    const d = out(pos, 0.3), t = ctx.currentTime;
    const o = ctx.createOscillator(), g = ctx.createGain(), f1 = filt("bandpass", 1100, 3), f2 = filt("bandpass", 2600, 4);
    o.type = "sawtooth";
    o.frequency.setValueAtTime(520, t); o.frequency.linearRampToValueAtTime(780, t + 0.18); o.frequency.linearRampToValueAtTime(560, t + 0.55);
    f1.frequency.setValueAtTime(800, t); f1.frequency.linearRampToValueAtTime(1500, t + 0.2); f1.frequency.linearRampToValueAtTime(900, t + 0.55);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.25, t + 0.06);
    g.gain.setValueAtTime(0.22, t + 0.4); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
    const mix = ctx.createGain(); mix.gain.value = 1;
    o.connect(f1); o.connect(f2); f1.connect(g); f2.connect(g); g.connect(d);
    o.start(t); o.stop(t + 0.65);
  },

  purr(pos, sec = 2) {
    if (!ctx) return;
    const d = out(pos, 0.1), t = ctx.currentTime;
    const s = noiseSrc(0.4), lp = filt("lowpass", 300), g = ctx.createGain();
    const lfo = ctx.createOscillator(), lg = ctx.createGain();
    lfo.frequency.value = 24; lg.gain.value = 0.12; lfo.connect(lg); lg.connect(g.gain);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.14, t + 0.3); g.gain.setValueAtTime(0.14, t + sec - 0.3); g.gain.linearRampToValueAtTime(0.0001, t + sec);
    s.connect(lp); lp.connect(g); g.connect(d); s.start(t); lfo.start(t); s.stop(t + sec); lfo.stop(t + sec);
  },

  drain(pos, sec = 3.5) {
    if (!ctx) return;
    const d = out(pos, 0.7), t = ctx.currentTime;
    const s = noiseSrc(0.5), lp = filt("lowpass", 500), g = ctx.createGain();
    env(g, t, 0.3, 0.5, sec);
    s.connect(lp); lp.connect(g); g.connect(d); s.start(t); s.stop(t + sec + 0.4);
    for (let i = 0; i < sec * 9; i++) {
      const tt = t + i / 9 + Math.random() * 0.1;
      tone({ t: tt, freq: 200 + Math.random() * 400, to: 600 + Math.random() * 500, d: 0.06, gain: 0.08, dest: d });
    }
  },

  splash(pos) {
    if (!ctx) return;
    const d = out(pos, 0.5), t = ctx.currentTime;
    burst({ t, type: "lowpass", freq: 1500, d: 0.3, gain: 0.5, dest: d });
    for (let i = 0; i < 4; i++) tone({ t: t + 0.05 + i * 0.06, freq: 500 + Math.random() * 600, to: 1200, d: 0.05, gain: 0.06, dest: d });
  },

  bong(pos, times = 3) {
    if (!ctx) return;
    const d = out(pos, 1.0), t = ctx.currentTime;
    for (let i = 0; i < times; i++) {
      const tt = t + i * 1.1;
      for (const [f, gn] of [[196, 0.35], [392, 0.15], [523, 0.08], [784, 0.05]]) tone({ t: tt, freq: f, d: 1.8, gain: gn, dest: d });
      burst({ t: tt, type: "bandpass", freq: 1200, q: 2, d: 0.05, gain: 0.3, dest: d });
    }
  },

  owlScreech(pos) {
    if (!ctx) return;
    const d = out(pos, 0.8), t = ctx.currentTime;
    const o = ctx.createOscillator(), g = ctx.createGain(), bp = filt("bandpass", 1800, 1.5);
    o.type = "sawtooth";
    o.frequency.setValueAtTime(900, t); o.frequency.linearRampToValueAtTime(1300, t + 0.15); o.frequency.linearRampToValueAtTime(700, t + 0.6);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.35, t + 0.04); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.65);
    o.connect(bp); bp.connect(g); g.connect(d); o.start(t); o.stop(t + 0.7);
    burst({ t, type: "highpass", freq: 3000, d: 0.5, gain: 0.15, dest: d });
  },

  flap(pos) {
    if (!ctx) return;
    const d = out(pos, 0.3), t = ctx.currentTime;
    burst({ t, type: "bandpass", freq: 600, q: 0.8, a: 0.02, d: 0.12, gain: 0.35, dest: d });
    burst({ t: t + 0.02, type: "bandpass", freq: 2500, q: 2, d: 0.03, gain: 0.15, dest: d });
  },

  wardrobe(pos) {
    if (!ctx) return;
    const d = out(pos, 0.4), t = ctx.currentTime;
    creakGrain(t, d, 0.45, 0.6, 1100);
    burst({ t: t + 0.45, type: "lowpass", freq: 600, d: 0.08, gain: 0.5, dest: d });
  },
});

// ---------------------------------------------------------------- звуки главы 3
Object.assign(sfx, {
  // колокол: низкий, средний или высокий
  bell(pos, which = "mid") {
    if (!ctx) return;
    const d = out(pos, 1.2), t = ctx.currentTime;
    const base = { low: 220, mid: 330, high: 494 }[which] || 330;
    for (const [k, g, dur] of [[1, 0.3, 2.6], [2.0, 0.12, 1.8], [2.76, 0.08, 1.4], [5.4, 0.04, 0.8], [0.5, 0.1, 3]]) {
      tone({ t, freq: base * k, d: dur, gain: g, dest: d });
    }
    burst({ t, type: "bandpass", freq: base * 4, q: 3, d: 0.04, gain: 0.25, dest: d });
  },

  crystal(pos) {
    if (!ctx) return;
    const d = out(pos, 1.0), t = ctx.currentTime;
    [1318, 1760, 2093, 2637].forEach((f, i) => tone({ t: t + i * 0.09, freq: f, d: 1.4, gain: 0.07, dest: d }));
  },

  mirror(pos) {
    if (!ctx) return;
    const d = out(pos, 0.4), t = ctx.currentTime;
    creakGrain(t, d, 0.25, 0.5, 1400);
    burst({ t: t + 0.25, type: "bandpass", freq: 900, q: 2, d: 0.05, gain: 0.4, dest: d });
  },

  weight(pos) {
    if (!ctx) return;
    const d = out(pos, 0.5), t = ctx.currentTime;
    tone({ t, freq: 110, to: 60, d: 0.25, gain: 0.5, dest: d });
    for (const f of [700, 1650]) tone({ t, freq: f, d: 0.6, gain: 0.05, dest: d });
    burst({ t, type: "lowpass", freq: 900, d: 0.06, gain: 0.5, dest: d });
  },
});

// Постоянный звук, который можно двигать (жужжание механизма совы)
export function movingLoop() {
  if (!ctx) return null;
  const p = ctx.createPanner();
  p.panningModel = "HRTF"; p.distanceModel = "inverse"; p.refDistance = 1.5; p.rolloffFactor = 1.6;
  const g = ctx.createGain(); g.gain.value = 0;
  const o = ctx.createOscillator(); o.type = "sawtooth"; o.frequency.value = 62;
  const o2 = ctx.createOscillator(); o2.type = "square"; o2.frequency.value = 124.5;
  const lp = filt("lowpass", 420, 2);
  const trem = ctx.createOscillator(), tg = ctx.createGain(); trem.frequency.value = 9; tg.gain.value = 0.3;
  const og = ctx.createGain(); og.gain.value = 0.5;
  trem.connect(tg); tg.connect(og.gain);
  o.connect(lp); o2.connect(lp); lp.connect(og); og.connect(g); g.connect(p); p.connect(dry);
  const s = ctx.createGain(); s.gain.value = 0.4; p.connect(s); s.connect(roomVerb);
  o.start(); o2.start(); trem.start();
  return {
    setPos(v) { setPos(p, v); },
    setGain(v) { g.gain.setTargetAtTime(v, ctx.currentTime, 0.2); },
    setPitch(k) { o.frequency.setTargetAtTime(62 * k, ctx.currentTime, 0.3); o2.frequency.setTargetAtTime(124.5 * k, ctx.currentTime, 0.3); },
  };
}

// «Скрип»: серия маленьких щелчков с меняющейся частотой (эффект трения)
function creakGrain(t, dest, dur, gain = 1, center = 700) {
  const n = Math.floor(dur * 55);
  let tt = t;
  for (let i = 0; i < n; i++) {
    const k = i / n;
    const rate = 35 + Math.sin(k * Math.PI * 3.3) * 18 + Math.random() * 10;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = "sawtooth"; o.frequency.value = center * (0.8 + Math.sin(k * 5) * 0.2 + Math.random() * 0.1);
    const f = filt("bandpass", center * 1.2, 4);
    g.gain.setValueAtTime(0.0001, tt);
    g.gain.exponentialRampToValueAtTime(0.06 * gain * (0.6 + Math.random() * 0.6), tt + 0.003);
    g.gain.exponentialRampToValueAtTime(0.0001, tt + 0.03);
    o.connect(f); f.connect(g); g.connect(dest);
    o.start(tt); o.stop(tt + 0.035);
    tt += 1 / rate;
    if (tt > t + dur) break;
  }
}

// ---------------------------------------------------------------- постоянные звуки
// Тиканье часов в определённой точке
export function addTicking(pos, { loud = 1, pitch = 1, fast = false } = {}) {
  loops.push({ kind: "tick", pos, loud, pitch, interval: fast ? 0.5 : 1, next: 0, tock: false });
}

// Треск камина
export function addFire(pos) {
  loops.push({ kind: "fire", pos, next: 0, started: false });
}

let windStarted = false;
function startWind() {
  windStarted = true;
  const s = noiseSrc(0.25), lp = filt("lowpass", 380, 0.5), g = ctx.createGain();
  g.gain.value = 0.05;
  const lfo = ctx.createOscillator(), lg = ctx.createGain();
  lfo.frequency.value = 0.07; lg.gain.value = 0.035; lfo.connect(lg); lg.connect(g.gain);
  const lfo2 = ctx.createOscillator(), lg2 = ctx.createGain();
  lfo2.frequency.value = 0.13; lg2.gain.value = 140; lfo2.connect(lg2); lg2.connect(lp.frequency);
  s.connect(lp); lp.connect(g); g.connect(master);
  s.start(); lfo.start(); lfo2.start();
}

// Вызывается каждый кадр: планирует тиканье, треск и т.п.
export function tickAudio() {
  if (!ctx || ctx.state !== "running") return;
  if (!windStarted) startWind();
  const now = ctx.currentTime;
  for (const L of loops) {
    if (L.kind === "tick") {
      if (L.next < now) L.next = now + 0.05;
      while (L.next < now + 0.2) {
        const d = out(L.pos, 0.5);
        const f = (L.tock ? 2400 : 3000) * L.pitch;
        burst({ t: L.next, type: "bandpass", freq: f, q: 6, d: 0.02, gain: 0.5 * L.loud, dest: d });
        tone({ t: L.next, freq: f * 0.5, d: 0.03, gain: 0.05 * L.loud, dest: d });
        L.tock = !L.tock;
        L.next += L.interval;
      }
    } else if (L.kind === "fire") {
      if (!L.started) {
        L.started = true;
        const d = out(L.pos, 0.3);
        const s = noiseSrc(0.5), lp = filt("lowpass", 600), g = ctx.createGain();
        g.gain.value = 0.25; s.connect(lp); lp.connect(g); g.connect(d); s.start();
        L.dest = d;
      }
      if (L.next < now + 0.2) {
        const t = Math.max(now, L.next);
        burst({ t, type: "highpass", freq: 1500 + Math.random() * 3000, d: 0.01 + Math.random() * 0.03, gain: 0.2 + Math.random() * 0.5, dest: L.dest });
        L.next = t + Math.random() * 0.25;
      }
    }
  }
}
