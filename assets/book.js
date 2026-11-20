/* La Guestation Collection — flipbook reader
   window.BOOK = { type: 'portrait' | 'spread', count: N, ratio: pageWidth/pageHeight (one page) } */
(function () {
  var cfg = window.BOOK, DUR = 950;
  var stage = document.getElementById('stage'), wrap = document.querySelector('main.reader');
  var counter = document.getElementById('counter'), bar = document.getElementById('bar');
  var btnPrev = document.getElementById('prev'), btnNext = document.getElementById('next');
  var thumbs = document.getElementById('thumbs');
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };
  var src = function (n) { return 'pages/p' + pad(n) + '.jpg'; };
  var tsrc = function (n) { return 'thumbs/p' + pad(n) + '.jpg'; };

  /* preload */
  for (var i = 1; i <= cfg.count; i++) { var im = new Image(); im.src = src(i); }

  var mode, spreads, idx = 0, busy = false, book, slotL, slotR, leaf, faceF, faceB;

  /* a page descriptor: {n: image number, crop: 'full'|'l'|'r'} or null */
  function build() {
    var narrow = window.innerWidth < 760 && window.innerHeight > window.innerWidth * 0.9;
    var pages = [], s = [];
    if (cfg.type === 'spread') {
      if (narrow) { mode = 'single'; for (var a = 1; a <= cfg.count; a++) s.push([{ n: a, crop: 'full' }]); }
      else { mode = 'double'; for (var b = 1; b <= cfg.count; b++) s.push([{ n: b, crop: 'l' }, { n: b, crop: 'r' }]); }
    } else {
      for (var c = 1; c <= cfg.count; c++) pages.push({ n: c, crop: 'full' });
      if (narrow) { mode = 'single'; pages.forEach(function (p) { s.push([p]); }); }
      else {
        mode = 'double'; s.push([null, pages[0]]);
        for (var d = 1; d < pages.length; d += 2) s.push([pages[d], pages[d + 1] || null]);
      }
    }
    return s;
  }

  function paint(el, p) {
    el.className = el.className.replace(/\b(full|half-l|half-r|empty)\b/g, '').trim();
    if (!p) { el.classList.add('empty'); el.style.backgroundImage = 'none'; return; }
    el.style.backgroundImage = 'url(' + src(p.n) + ')';
    el.classList.add(p.crop === 'full' ? 'full' : 'half-' + p.crop);
  }

  function pageRatio() {
    if (cfg.type === 'spread') return mode === 'single' ? cfg.ratio * 2 : cfg.ratio;
    return cfg.ratio;
  }

  function size() {
    var mast = document.querySelector('.mast').offsetHeight;
    var ctrl = document.querySelector('.controls').offsetHeight + document.querySelector('.hint').offsetHeight + (thumbs.hidden ? 0 : thumbs.offsetHeight) + 64;
    var availW = Math.min(window.innerWidth - 24, 1700), availH = window.innerHeight - mast - ctrl;
    var pr = pageRatio(), bookR = mode === 'double' ? pr * 2 : pr;
    var w = Math.min(availW, availH * bookR), h = w / bookR;
    if (h < 120) { h = 120; w = h * bookR; }
    stage.style.width = Math.round(w) + 'px'; stage.style.height = Math.round(h) + 'px';
    var pw = mode === 'double' ? w / 2 : w;
    [slotL, slotR].forEach(function (s) { s.style.width = Math.round(pw) + 'px'; });
    book.style.width = Math.round(w) + 'px';
    leaf.style.width = Math.round(pw) + 'px';
  }

  function center() {
    if (mode !== 'double') { book.style.transform = 'none'; return; }
    var sp = spreads[idx], w = stage.offsetWidth;
    if (!sp[0]) book.style.transform = 'translateX(' + (-w / 4) + 'px)';
    else if (!sp[1]) book.style.transform = 'translateX(' + (w / 4) + 'px)';
    else book.style.transform = 'none';
  }

  function show() {
    var sp = spreads[idx];
    if (mode === 'double') { paint(slotL.firstChild, sp[0]); paint(slotR.firstChild, sp[1]); slotL.style.display = ''; }
    else { paint(slotR.firstChild, sp[0]); slotL.style.display = 'none'; }
    center(); update();
  }

  function label() {
    var sp = spreads[idx], nums = [];
    sp.forEach(function (p) { if (p) nums.push(p.n); });
    if (cfg.type === 'spread') return pad(sp[0].n) + ' / ' + pad(cfg.count);
    var tot = cfg.count;
    return (nums.length > 1 ? nums[0] + '–' + nums[1] : nums[0]) + ' / ' + tot;
  }

  function update() {
    counter.textContent = label();
    bar.style.width = ((idx + 1) / spreads.length * 100) + '%';
    btnPrev.disabled = idx === 0; btnNext.disabled = idx === spreads.length - 1;
    document.querySelector('.hot.prev').classList.toggle('off', idx === 0);
    document.querySelector('.hot.next').classList.toggle('off', idx === spreads.length - 1);
    var on = spreads[idx].filter(Boolean).map(function (p) { return p.n; });
    [].forEach.call(thumbs.children, function (t) { t.classList.toggle('on', on.indexOf(+t.dataset.n) > -1); });
  }

  function turn(target) {
    if (busy || target < 0 || target >= spreads.length || target === idx) return;
    var fwd = target > idx, cur = spreads[idx], nxt = spreads[target];
    busy = true;
    leaf.className = 'leaf';
    if (mode === 'double') {
      if (fwd) {
        paint(faceF, cur[1]); paint(faceB, nxt[0]);
        leaf.style.left = 'auto'; leaf.style.right = '0';
        paint(slotR.firstChild, nxt[1]);
        leaf.classList.add('fwd');
      } else {
        paint(faceF, cur[0]); paint(faceB, nxt[1]);
        leaf.style.right = 'auto'; leaf.style.left = '0';
        paint(slotL.firstChild, nxt[0]);
        leaf.classList.add('bwd');
      }
      faceF.classList.remove('empty'); faceB.classList.remove('empty');
      if (!faceF.style.backgroundImage || faceF.style.backgroundImage === 'none') faceF.style.backgroundImage = 'none';
    } else {
      leaf.style.right = 'auto'; leaf.style.left = '0';
      if (fwd) { paint(faceF, cur[0]); paint(faceB, null); faceB.classList.remove('empty'); paint(slotR.firstChild, nxt[0]); leaf.classList.add('fwd'); }
      else { paint(faceF, nxt[0]); paint(faceB, null); faceB.classList.remove('empty'); leaf.classList.add('fwd', 'rev'); }
    }
    idx = target;
    if (mode === 'double') {
      /* re-center while turning (cover / back cover) */
      var sp = spreads[idx], w = stage.offsetWidth;
      book.style.transform = !sp[0] ? 'translateX(' + (-w / 4) + 'px)' : (!sp[1] ? 'translateX(' + (w / 4) + 'px)' : 'none');
    }
    leaf.classList.add('on');
    void leaf.offsetWidth;
    if (leaf.classList.contains('rev')) {
      leaf.style.transform = 'rotateY(-180deg)';
      void leaf.offsetWidth;
      leaf.style.transition = 'transform ' + DUR + 'ms cubic-bezier(.45,.05,.25,1)';
      leaf.style.transform = 'rotateY(0deg)';
    } else {
      leaf.classList.add('go');
    }
    update();
    setTimeout(function () {
      leaf.className = 'leaf'; leaf.style.transition = ''; leaf.style.transform = '';
      show(); busy = false;
    }, DUR + 30);
  }

  function setup() {
    stage.innerHTML = '';
    book = document.createElement('div'); book.className = 'book';
    slotL = document.createElement('div'); slotL.className = 'slot l';
    slotR = document.createElement('div'); slotR.className = 'slot r';
    slotL.appendChild(Object.assign(document.createElement('div'), { className: 'pg' }));
    slotR.appendChild(Object.assign(document.createElement('div'), { className: 'pg' }));
    leaf = document.createElement('div'); leaf.className = 'leaf';
    faceF = document.createElement('div'); faceF.className = 'face f';
    faceB = document.createElement('div'); faceB.className = 'face b';
    faceF.appendChild(Object.assign(document.createElement('div'), { className: 'shade' }));
    faceB.appendChild(Object.assign(document.createElement('div'), { className: 'shade' }));
    leaf.appendChild(faceF); leaf.appendChild(faceB);
    book.appendChild(slotL); book.appendChild(slotR); book.appendChild(leaf);
    stage.appendChild(book);
    var hp = document.createElement('div'); hp.className = 'hot prev';
    var hn = document.createElement('div'); hn.className = 'hot next';
    hp.addEventListener('click', function () { turn(idx - 1); });
    hn.addEventListener('click', function () { turn(idx + 1); });
    stage.appendChild(hp); stage.appendChild(hn);
    document.body.classList.toggle('single', mode === 'single');
    stage.classList.toggle('single', mode === 'single');
    size(); show();
  }

  /* paint() keeps the 'pg' / 'face' class, so patch for leaf faces */
  var _paint = paint;
  paint = function (el, p) {
    var base = el.classList.contains('face') ? (el.classList.contains('f') ? 'face f' : 'face b') : 'pg';
    el.className = base;
    if (!p) { el.style.backgroundImage = 'none'; if (base === 'pg') el.classList.add('empty'); return; }
    el.style.backgroundImage = 'url(' + src(p.n) + ')';
    el.classList.add(p.crop === 'full' ? 'full' : 'half-' + p.crop);
  };
  /* leaf faces use the same background sizing classes */
  var st = document.createElement('style');
  st.textContent = '.face.full{background-size:100% 100%}.face.half-l{background-size:200% 100%;background-position:0 0}.face.half-r{background-size:200% 100%;background-position:100% 0}';
  document.head.appendChild(st);
  document.documentElement.style.setProperty('--dur', DUR + 'ms');

  /* thumbnails */
  for (var t = 1; t <= cfg.count; t++) {
    var b = document.createElement('button'); b.className = 'thumb'; b.dataset.n = t; b.setAttribute('aria-label', 'Page ' + t);
    var ti = document.createElement('img'); ti.src = tsrc(t); ti.alt = ''; ti.loading = 'lazy'; b.appendChild(ti);
    b.addEventListener('click', (function (n) { return function () {
      for (var k = 0; k < spreads.length; k++) { if (spreads[k].some(function (p) { return p && p.n === n; })) { turn(k); break; } }
    }; })(t));
    thumbs.appendChild(b);
  }
  document.getElementById('thumbToggle').addEventListener('click', function () { thumbs.hidden = !thumbs.hidden; size(); center(); });
  document.getElementById('full').addEventListener('click', function () {
    var el = document.documentElement;
    if (!document.fullscreenElement) { (el.requestFullscreen || el.webkitRequestFullscreen || function () {}).call(el); }
    else { (document.exitFullscreen || document.webkitExitFullscreen).call(document); }
  });
  btnPrev.addEventListener('click', function () { turn(idx - 1); });
  btnNext.addEventListener('click', function () { turn(idx + 1); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') { e.preventDefault(); turn(idx + 1); }
    if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); turn(idx - 1); }
    if (e.key === 'Home') turn(0);
    if (e.key === 'End') turn(spreads.length - 1);
  });
  var sx = 0, sy = 0;
  stage.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
  stage.addEventListener('touchend', function (e) {
    var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) turn(idx + (dx < 0 ? 1 : -1));
  }, { passive: true });

  var lastMode;
  function init() {
    var prevFirst = spreads ? (spreads[idx].filter(Boolean)[0] || { n: 1 }).n : 1;
    spreads = build();
    idx = 0;
    for (var k = 0; k < spreads.length; k++) { if (spreads[k].some(function (p) { return p && p.n === prevFirst; })) { idx = k; break; } }
    if (mode !== lastMode || !book) { lastMode = mode; setup(); } else { size(); show(); }
  }
  var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { if (!busy) init(); }, 150); });
  document.addEventListener('fullscreenchange', function () { setTimeout(init, 120); });
  init();
})();
