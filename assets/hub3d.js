/* La Guestation Collection — sphere of cards (Three.js), driven by scroll */
import * as THREE from './three.module.min.js';

const root = document.documentElement;
if (!root.classList.contains('no3d')) {
  try { init(); } catch (err) { console.error('[hub3d]', err); root.classList.add('no3d'); }
}

function init() {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const orbit = document.getElementById('orbit');
  const stage = document.getElementById('stage');
  const canvas = document.getElementById('gl');
  const cap = document.getElementById('cap');
  const capN = document.getElementById('capN'), capT = document.getElementById('capT');
  const capD = document.getElementById('capD'), capGo = document.getElementById('capGo'), capGoT = document.getElementById('capGoT');
  const countN = document.getElementById('countN');
  const hint = document.getElementById('hint');

  const MAIN = [
    { n: 'The book · 01', t: 'La Guestation', s: 'The Art of the Table', d: 'The art of the table by Chef Wii — his journey, signature experiences and bespoke offerings.', img: 'guestation/pages/p01.jpg', go: 'Open the book', href: 'guestation/', crop: 'full' },
    { n: 'The book · 02', t: 'L’AZURÉA Residences', s: 'Sainte-Maxime · French Riviera', d: 'A private residence in Sainte-Maxime on the French Riviera, a La Guestation Collection.', img: 'lazurea/pages/p01.jpg', go: 'Open the book', href: 'lazurea/', crop: 'cover' },
    { n: 'Online', t: 'The Website', s: 'laguestationcollection.com', d: 'Stays, gastronomy, experiences and enquiries.', img: 'assets/website.jpg', go: 'Visit the website', href: 'https://laguestationcollection.com', ext: true, crop: 'cover' },
  ];
  const PHOTOS = [
    ['guestation/thumbs/p03.jpg', 'p'], ['lazurea/thumbs/p03.jpg', 'l'], ['guestation/thumbs/p05.jpg', 'p'], ['lazurea/thumbs/p07.jpg', 'l'],
    ['guestation/thumbs/p08.jpg', 'p'], ['lazurea/thumbs/p02.jpg', 'l'], ['guestation/thumbs/p11.jpg', 'p'], ['lazurea/thumbs/p08.jpg', 'l'],
    ['guestation/thumbs/p13.jpg', 'p'], ['lazurea/thumbs/p05.jpg', 'l'], ['guestation/thumbs/p15.jpg', 'p'], ['lazurea/thumbs/p11.jpg', 'l'],
    ['lazurea/thumbs/p06.jpg', 'l'], ['guestation/thumbs/p06.jpg', 'p'],
  ];
  const WORDS = [
    ['The Art', 'of the Table'], ['PRIVATE', 'DINING'], ['Sainte-Maxime', 'French Riviera'], ['PARIS · CANNES', 'BORDEAUX · DUBAI'],
    ['Chef Wii', 'Le Cordon Bleu Paris'], ['BESPOKE', 'EXPERIENCES'], ['L’AZURÉA', 'Residences'], ['La Guestation', 'Collection'],
  ];

  /* ---------- canvas helpers ---------- */
  const GOLD = '#bfa77a', INK = '#1b2731', PAPER = '#f3eee6';
  const rr = (ctx, x, y, w, h, r) => { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); };
  const tracked = (ctx, text, x, y, sp, align = 'center') => {
    const chars = [...text]; const ws = chars.map((c) => ctx.measureText(c).width);
    const tot = ws.reduce((a, b) => a + b, 0) + sp * (chars.length - 1);
    let cx = align === 'center' ? x - tot / 2 : x; const prev = ctx.textAlign; ctx.textAlign = 'left';
    chars.forEach((c, i) => { ctx.fillText(c, cx, y); cx += ws[i] + sp; }); ctx.textAlign = prev;
  };
  const wrap = (ctx, text, maxW) => { const words = text.split(' '); const lines = []; let line = '';
    words.forEach((w) => { const t = line ? line + ' ' + w : w; if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t; });
    if (line) lines.push(line); return lines; };
  const drawCover = (ctx, img, x, y, w, h, mode) => {
    if (!img) { ctx.fillStyle = '#d9d1c3'; ctx.fillRect(x, y, w, h); return; }
    const iw = img.naturalWidth, ih = img.naturalHeight; let sx = 0, sy = 0, sw = iw, sh = ih;
    if (mode === 'full') { // contain-ish for portrait books: fit width, top aligned
      const s = Math.max(w / iw, h / ih); sw = w / s; sh = h / s; sx = (iw - sw) / 2; sy = 0;
    } else { const s = Math.max(w / iw, h / ih); sw = w / s; sh = h / s; sx = (iw - sw) / 2; sy = (ih - sh) / 2; }
    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  };

  function drawMain(c, m, img) {
    const W = c.width, H = c.height, ctx = c.getContext('2d'); ctx.clearRect(0, 0, W, H);
    ctx.save(); rr(ctx, 0, 0, W, H, 30); ctx.clip(); ctx.fillStyle = PAPER; ctx.fillRect(0, 0, W, H);
    const pad = 40, ih = Math.round(H * 0.62);
    ctx.save(); rr(ctx, pad, pad, W - 2 * pad, ih, 10); ctx.clip(); drawCover(ctx, img, pad, pad, W - 2 * pad, ih, m.crop); ctx.restore();
    ctx.strokeStyle = GOLD; ctx.lineWidth = 2; rr(ctx, 16, 16, W - 32, H - 32, 20); ctx.stroke();
    ctx.fillStyle = GOLD; ctx.font = '400 21px Jost, sans-serif'; ctx.textBaseline = 'alphabetic';
    tracked(ctx, m.n.toUpperCase(), W / 2, pad + ih + 62, 7);
    ctx.fillStyle = INK; ctx.font = 'italic 400 64px CG, Georgia, serif'; ctx.textAlign = 'center';
    ctx.fillText(m.t, W / 2, pad + ih + 140);
    ctx.fillStyle = '#6b7178'; ctx.font = '300 23px Jost, sans-serif';
    ctx.fillText(m.s, W / 2, pad + ih + 186);
    const y = H - 70; ctx.strokeStyle = 'rgba(191,167,122,.55)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(W / 2 - 140, y - 36); ctx.lineTo(W / 2 + 140, y - 36); ctx.stroke();
    ctx.fillStyle = GOLD; ctx.font = '400 19px Jost, sans-serif'; tracked(ctx, (m.go + '  →').toUpperCase(), W / 2, y, 5);
    ctx.restore();
  }
  function drawPhoto(c, img) {
    const W = c.width, H = c.height, ctx = c.getContext('2d'); ctx.clearRect(0, 0, W, H);
    ctx.save(); rr(ctx, 0, 0, W, H, 14); ctx.clip(); ctx.fillStyle = '#f3eee6'; ctx.fillRect(0, 0, W, H);
    ctx.save(); rr(ctx, 10, 10, W - 20, H - 20, 8); ctx.clip(); drawCover(ctx, img, 10, 10, W - 20, H - 20, 'cover'); ctx.restore();
    ctx.restore();
  }
  function drawWord(c, pair, i) {
    const W = c.width, H = c.height, ctx = c.getContext('2d'); ctx.clearRect(0, 0, W, H);
    const dark = i % 3 !== 2;
    ctx.save(); rr(ctx, 0, 0, W, H, 16); ctx.clip();
    const g = ctx.createLinearGradient(0, 0, W, H);
    if (dark) { g.addColorStop(0, '#16222c'); g.addColorStop(1, '#0c141b'); } else { g.addColorStop(0, '#f6f1e8'); g.addColorStop(1, '#ebe3d5'); }
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = GOLD; ctx.lineWidth = 1.5; rr(ctx, 12, 12, W - 24, H - 24, 10); ctx.stroke();
    ctx.lineWidth = 1; rr(ctx, 18, 18, W - 36, H - 36, 7); ctx.globalAlpha = .5; ctx.stroke(); ctx.globalAlpha = 1;
    const caps = pair[0] === pair[0].toUpperCase();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    if (caps) {
      ctx.fillStyle = dark ? '#ece5d8' : INK; ctx.font = '400 26px Jost, sans-serif';
      tracked(ctx, pair[0], W / 2, H / 2 - 20, 9); ctx.fillStyle = GOLD; ctx.font = '400 20px Jost, sans-serif'; tracked(ctx, pair[1], W / 2, H / 2 + 22, 8);
    } else {
      ctx.fillStyle = dark ? '#ece5d8' : INK; ctx.font = 'italic 400 46px CG, Georgia, serif'; ctx.fillText(pair[0], W / 2, H / 2 - 16);
      ctx.fillStyle = GOLD; ctx.font = '400 17px Jost, sans-serif'; tracked(ctx, pair[1].toUpperCase(), W / 2, H / 2 + 30, 6);
    }
    // small diamond
    ctx.fillStyle = GOLD; ctx.beginPath(); const dy = caps ? H / 2 + 0 : H / 2 + 6; ctx.moveTo(W / 2, dy - 4); ctx.lineTo(W / 2 + 4, dy); ctx.lineTo(W / 2, dy + 4); ctx.lineTo(W / 2 - 4, dy); ctx.closePath();
    if (caps) ctx.fill();
    ctx.restore();
  }

  /* ---------- three ---------- */
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace; // canvases are already sRGB: pass through untouched
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 60);
  camera.position.set(0, 0, 9.2);

  const vertex = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`;
  const fragment = `uniform sampler2D uMap; uniform float uOpacity; uniform float uDim; uniform vec3 uBack; varying vec2 vUv;
    void main(){
      if (gl_FrontFacing) { vec4 c = texture2D(uMap, vUv); c.rgb *= uDim; c.a *= uOpacity; if (c.a < 0.01) discard; gl_FragColor = c; }
      else { vec4 c = texture2D(uMap, vec2(1.0 - vUv.x, vUv.y)); float a = c.a * uOpacity; if (a < 0.01) discard; gl_FragColor = vec4(uBack * uDim, a); }
    }`;
  const BACK = new THREE.Color('#25333e');
  const CARD_H = 0.92;
  const geoCache = {};
  const planeFor = (aspect) => { const k = aspect.toFixed(3); return geoCache[k] || (geoCache[k] = new THREE.PlaneGeometry(CARD_H * aspect, CARD_H)); };
  const makeMat = (tex) => new THREE.ShaderMaterial({ vertexShader: vertex, fragmentShader: fragment, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: { uMap: { value: tex }, uOpacity: { value: 1 }, uDim: { value: 1 }, uBack: { value: BACK } } });

  // seeded random
  let seed = 7; const rand = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

  const loadImg = (src) => new Promise((res) => { const im = new Image(); im.decoding = 'async'; im.onload = () => res(im); im.onerror = () => res(null); im.src = src; });

  // card list: interleave main cards into the sphere
  const specs = [];
  PHOTOS.forEach((p, i) => specs.push({ kind: 'photo', src: p[0], orient: p[1], i }));
  WORDS.forEach((w, i) => specs.splice(Math.min(specs.length, 1 + i * 3), 0, { kind: 'word', pair: w, i }));
  const mainSlots = [Math.round(specs.length * 0.18), Math.round(specs.length * 0.5), Math.round(specs.length * 0.82)];
  MAIN.forEach((m, k) => specs.splice(mainSlots[k] + k, 0, { kind: 'main', m, k }));
  const N = specs.length;

  const cards = []; const mainCards = [];
  const dummy = new THREE.Object3D();
  specs.forEach((sp, i) => {
    const c = document.createElement('canvas');
    if (sp.kind === 'main') { c.width = 720; c.height = 1000; }
    else if (sp.kind === 'word') { c.width = 440; c.height = 300; }
    else if (sp.orient === 'l') { c.width = 440; c.height = 300; }
    else { c.width = 320; c.height = 452; }
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.NoColorSpace; tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    tex.generateMipmaps = true; tex.minFilter = THREE.LinearMipmapLinearFilter;
    const mesh = new THREE.Mesh(planeFor(c.width / c.height), makeMat(tex));
    // Fibonacci sphere
    const y = 1 - (i / (N - 1)) * 2; const r = Math.sqrt(1 - y * y); const phi = i * Math.PI * (3 - Math.sqrt(5));
    const dir = new THREE.Vector3(Math.cos(phi) * r, y * 0.9, Math.sin(phi) * r).normalize();
    dummy.position.copy(dir); dummy.lookAt(dir.clone().multiplyScalar(2)); dummy.rotateZ((rand() - 0.5) * 0.6);
    const rnd = new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).normalize();
    mesh.userData = { ...sp, canvas: c, tex, dir, baseQ: dummy.quaternion.clone(), rnd, explode: 0.7 + rand() * 1.4,
      spin: new THREE.Vector3((rand() - 0.5) * 5, (rand() - 0.5) * 5, (rand() - 0.5) * 3), phase: rand() * Math.PI * 2, z: 0,
      mainIndex: sp.kind === 'main' ? sp.k : -1 };
    if (sp.kind === 'main') mainCards[sp.k] = mesh;
    scene.add(mesh); cards.push(mesh);
  });

  // centre emblem (logo) + glow
  const glowC = document.createElement('canvas'); glowC.width = glowC.height = 256;
  { const g = glowC.getContext('2d'); const rg = g.createRadialGradient(128, 128, 0, 128, 128, 128); rg.addColorStop(0, 'rgba(191,167,122,0.28)'); rg.addColorStop(0.45, 'rgba(191,167,122,0.08)'); rg.addColorStop(1, 'rgba(191,167,122,0)'); g.fillStyle = rg; g.fillRect(0, 0, 256, 256); }
  const glowTex = new THREE.CanvasTexture(glowC); glowTex.colorSpace = THREE.NoColorSpace;
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(6.2, 6.2), new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  glow.renderOrder = 49; scene.add(glow);
  const logoMat = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, opacity: 1 });
  const logo = new THREE.Mesh(new THREE.PlaneGeometry(2.7, 2.7 * 353 / 900), logoMat); logo.renderOrder = 50; scene.add(logo);
  new THREE.TextureLoader().load('assets/logo-ivory.png', (t) => { t.colorSpace = THREE.NoColorSpace; t.anisotropy = 8; logoMat.map = t; logoMat.needsUpdate = true; });

  /* ---------- draw textures once fonts are ready ---------- */
  const fontsReady = Promise.all(['italic 400 40px CG', '400 20px Jost', '300 20px Jost'].map((f) => document.fonts?.load(f).catch(() => null)));
  cards.forEach((m) => {
    const u = m.userData;
    const src = u.kind === 'main' ? u.m.img : u.kind === 'photo' ? u.src : null;
    const imgP = src ? loadImg(src) : Promise.resolve(null);
    Promise.all([imgP, fontsReady]).then(([img]) => {
      if (u.kind === 'main') drawMain(u.canvas, u.m, img); else if (u.kind === 'photo') drawPhoto(u.canvas, img); else drawWord(u.canvas, u.pair, u.i);
      u.tex.needsUpdate = true;
    });
  });

  /* ---------- layout ---------- */
  const layout = { R: 2.5, cy: 0, focusD: 4.2, focusS: 2.4 };
  const visHAt = (d) => 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * d;
  const resize = () => {
    const w = stage.clientWidth, h = stage.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    const visH = visHAt(camera.position.z), visW = visH * camera.aspect;
    layout.R = Math.min(2.6, Math.max(1.25, Math.min(visH * 0.42, visW * 0.46)));
    layout.cy = camera.aspect > 1 ? -visH * 0.015 : visH * 0.03;
    const s = Math.min(1, (visW * 0.42) / 2.7); logo.scale.setScalar(Math.max(0.55, s)); glow.scale.setScalar(Math.max(0.6, s));
    logo.position.y = glow.position.y = layout.cy;
    const fH = visHAt(layout.focusD), fW = fH * camera.aspect; const mainAspect = 720 / 1000;
    const capSpace = camera.aspect > 1 ? 0.62 : 0.45;
    layout.focusS = Math.min((fH * capSpace) / CARD_H, (fW * 0.8) / (CARD_H * mainAspect));
  };
  new ResizeObserver(resize).observe(stage); resize();

  /* ---------- interaction ---------- */
  const drag = { x: 0, v: 0, on: false, last: 0, moved: 0 };
  stage.addEventListener('pointerdown', (e) => { drag.on = true; drag.last = e.clientX; drag.moved = 0; });
  addEventListener('pointermove', (e) => { if (!drag.on) return; const dx = (e.clientX - drag.last) * 0.006; drag.last = e.clientX; drag.x += dx; drag.v = dx; drag.moved += Math.abs(dx); });
  addEventListener('pointerup', () => { drag.on = false; });
  addEventListener('pointercancel', () => { drag.on = false; });

  const raycaster = new THREE.Raycaster(); const ptr = new THREE.Vector2();
  let focused = -1, focusAmt = 0;
  const openMain = (k) => { const m = MAIN[k]; if (m.ext) window.open(m.href, '_blank', 'noopener'); else location.href = m.href; };
  stage.addEventListener('click', (e) => {
    if (drag.moved > 0.03 || focused < 0 || focusAmt < 0.85) return;
    const r = stage.getBoundingClientRect(); ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(ptr, camera); if (raycaster.intersectObject(mainCards[focused]).length) openMain(focused);
  });

  /* ---------- caption ---------- */
  let shownStep = -2;
  const setStep = (k) => {
    if (k === shownStep) return; shownStep = k;
    countN.textContent = String(k < 0 ? 0 : k + 1).padStart(2, '0');
    if (k < 0) { cap.classList.remove('on'); return; }
    const m = MAIN[k]; capN.textContent = m.n; capT.textContent = m.t; capD.textContent = m.d; capGoT.textContent = m.go; capGo.href = m.href;
    if (m.ext) { capGo.target = '_blank'; capGo.rel = 'noopener'; } else { capGo.removeAttribute('target'); capGo.removeAttribute('rel'); }
    cap.classList.remove('on'); void cap.offsetWidth; cap.classList.add('on');
  };

  /* ---------- progress ---------- */
  const progress = () => { const r = orbit.getBoundingClientRect(); const total = r.height - innerHeight; return total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 0; };

  /* ---------- animation ---------- */
  const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const easeIO = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const qGroup = new THREE.Quaternion(), eul = new THREE.Euler(), qSpin = new THREE.Quaternion();
  const qFace = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, -0.03));
  const pos = new THREE.Vector3(), tgt = new THREE.Vector3();
  let visible = true;
  new IntersectionObserver((en) => { visible = en[0].isIntersecting; }, { rootMargin: '200px' }).observe(orbit);

  const clock = new THREE.Clock(); let pSm = 0;
  const frame = () => {
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, clock.getDelta()); const time = clock.elapsedTime;
    if (!visible) return;
    const pRaw = progress(); pSm += (pRaw - pSm) * Math.min(1, dt * 7); const p = pSm;
    if (!drag.on) { drag.x += drag.v; drag.v *= 0.94; }
    hint.classList.toggle('off', p > 0.12 && p < 0.98 ? shownStep >= 0 : false);

    // phases
    const e = (reduced ? 0.35 : 1) * Math.sin(Math.PI * smooth(0.02, 0.22, p));
    const start = 0.2, seg = (1.0 - start) / MAIN.length;
    let step = -1, best = 0;
    const flys = MAIN.map((_, k) => {
      const u = (p - start - k * seg) / seg;
      const last = k === MAIN.length - 1;
      const f = easeIO(smooth(0.05, 0.3, u)) * (last ? 1 - easeIO(smooth(0.95, 1.2, u)) : 1 - easeIO(smooth(0.78, 1.0, u)));
      if (f > best) { best = f; step = k; } return f;
    });
    focused = best > 0.5 ? step : -1; focusAmt = best;
    setStep(best > 0.55 ? step : -1);

    const spinY = time * (reduced ? 0.03 : 0.12) + p * 4.2 + drag.x;
    eul.set(0.2 + Math.sin(time * 0.3) * 0.05, spinY, 0.07); qGroup.setFromEuler(eul);
    const R = layout.R;
    logoMat.opacity = 1 - best * 0.82; glow.material.opacity = 1 - best * 0.6;

    cards.forEach((m) => {
      const u = m.userData;
      pos.copy(u.dir).applyQuaternion(qGroup).multiplyScalar(R * (1 + e * u.explode * 0.75)).addScaledVector(u.rnd, e * 1.1);
      pos.y += layout.cy + Math.sin(time * 0.9 + u.phase) * 0.03;
      m.quaternion.copy(qGroup).multiply(u.baseQ);
      if (e > 0.001) { qSpin.setFromEuler(eul.set(u.spin.x * e, u.spin.y * e, u.spin.z * e)); m.quaternion.multiply(qSpin); }
      let scale = 1; const f = u.mainIndex >= 0 ? flys[u.mainIndex] : 0;
      if (f > 0) { tgt.set(0, layout.cy + (camera.aspect > 1 ? 0.12 : 0.1), camera.position.z - layout.focusD); pos.lerp(tgt, f); m.quaternion.slerp(qFace, f); scale = THREE.MathUtils.lerp(1, layout.focusS, f); }
      m.position.copy(pos); m.scale.setScalar(scale); u.z = pos.z;
      // keep the logo readable: cards crossing in front of it fade
      const front = smooth(0.2, 0.85, pos.z / R) * (1 - smooth(0.5, 1.3, Math.abs(pos.x) / Math.max(0.8, R * 0.55))) * (1 - smooth(0.35, 0.9, Math.abs(pos.y - layout.cy) / R));
      const depth = THREE.MathUtils.clamp((pos.z / R + 1) / 2, 0, 1);
      const fade = f > 0 ? 1 : 1 - front * 0.88;
      m.material.uniforms.uOpacity.value = fade * (best > 0.3 && f === 0 ? 1 - best * 0.55 : 1);
      m.material.uniforms.uDim.value = f > 0 ? 1 : 0.62 + depth * 0.38;
      m.renderOrder = f > 0.01 ? 1000 : (pos.z < 0 ? Math.round(depth * 48) : 51 + Math.round(depth * 48));
    });
    renderer.render(scene, camera);
  };
  requestAnimationFrame(frame);
}
