/* Global behaviour: theme, copy buttons, reveal-on-scroll, TOC highlight, hero flow field, math. */
(function () {
  'use strict';
  var root = document.documentElement;
  root.classList.remove('no-js');

  /* ---------- theme ---------- */
  function currentTheme() {
    var t = root.getAttribute('data-theme');
    if (t) return t;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
  function setTheme(t) {
    root.setAttribute('data-theme', t);
    try { localStorage.setItem('theme', t); } catch (e) { /* storage may be blocked */ }
    var b = document.getElementById('theme-toggle');
    if (b) { b.textContent = t === 'dark' ? '☾' : '☀'; b.setAttribute('aria-label', 'Switch to ' + (t === 'dark' ? 'light' : 'dark') + ' theme'); }
    document.dispatchEvent(new CustomEvent('themechange'));
  }
  var tb = document.getElementById('theme-toggle');
  if (tb) {
    setTheme(currentTheme());
    tb.addEventListener('click', function () { setTheme(currentTheme() === 'dark' ? 'light' : 'dark'); });
  }

  /* ---------- copy buttons ---------- */
  document.querySelectorAll('pre.code').forEach(function (pre) {
    var btn = document.createElement('button');
    btn.className = 'copy'; btn.type = 'button'; btn.textContent = 'copy';
    btn.addEventListener('click', function () {
      var text = pre.innerText.replace(/\ncopy$/, '').replace(/^copy\n?/, '');
      var done = function () { btn.textContent = 'copied'; setTimeout(function () { btn.textContent = 'copy'; }, 1400); };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, function () { btn.textContent = 'press Ctrl+C'; });
      } else { btn.textContent = 'press Ctrl+C'; }
    });
    pre.appendChild(btn);
  });

  /* ---------- reveal on scroll ---------- */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  } else { reveals.forEach(function (el) { el.classList.add('in'); }); }

  /* ---------- TOC scrollspy ---------- */
  var toc = document.querySelectorAll('.toc a[href^="#"]');
  if (toc.length && 'IntersectionObserver' in window) {
    var map = {};
    toc.forEach(function (a) { var id = a.getAttribute('href').slice(1); var el = document.getElementById(id); if (el) map[id] = a; });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          toc.forEach(function (a) { a.classList.remove('on'); });
          if (map[e.target.id]) map[e.target.id].classList.add('on');
        }
      });
    }, { rootMargin: '-20% 0px -70% 0px' });
    Object.keys(map).forEach(function (id) { spy.observe(document.getElementById(id)); });
  }

  /* ---------- hero flow field (decorative) ---------- */
  var cv = document.getElementById('flow');
  if (cv && !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)) {
    var ctx = cv.getContext('2d');
    var W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2), P = [], N = 0, t = 0, raf = 0;
    function css(v) { return getComputedStyle(root).getPropertyValue(v).trim(); }
    var cA = '#4cc9f0', cB = '#ff5468';
    function colors() { cA = css('--accent-2') || cA; cB = css('--accent') || cB; }
    function resize() {
      var r = cv.getBoundingClientRect();
      W = r.width; H = r.height;
      cv.width = Math.floor(W * dpr); cv.height = Math.floor(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      N = Math.min(260, Math.floor(W * H / 5200));
      P = [];
      for (var i = 0; i < N; i++) P.push({ x: Math.random() * W, y: Math.random() * H, a: Math.random() });
      ctx.clearRect(0, 0, W, H);
    }
    // cheap smooth vector field: superposed sinusoids (a stand-in for a velocity field)
    function field(x, y) {
      var u = Math.sin(y * .008 + t * .25) + .6 * Math.sin(x * .006 - t * .15 + 2);
      var v = Math.cos(x * .007 + t * .2) + .6 * Math.cos(y * .011 + t * .1 + 1);
      return [u, v];
    }
    function frame() {
      t += .016;
      ctx.fillStyle = 'rgba(0,0,0,0)';
      // fade trails using destination-out so the page background shows through
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0,0,0,0.08)';
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'source-over';
      ctx.lineWidth = 1.1;
      for (var i = 0; i < N; i++) {
        var p = P[i], f = field(p.x, p.y), nx = p.x + f[0] * 1.5, ny = p.y + f[1] * 1.5;
        ctx.strokeStyle = p.a > .8 ? cB : cA;
        ctx.globalAlpha = .55;
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(nx, ny); ctx.stroke();
        p.x = nx; p.y = ny;
        if (p.x < 0 || p.x > W || p.y < 0 || p.y > H || Math.random() < .004) { p.x = Math.random() * W; p.y = Math.random() * H; }
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(frame);
    }
    colors(); resize();
    window.addEventListener('resize', function () { resize(); });
    document.addEventListener('themechange', colors);
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) cancelAnimationFrame(raf); else raf = requestAnimationFrame(frame);
    });
    raf = requestAnimationFrame(frame);
  }

  /* ---------- math (KaTeX loaded with defer; render when ready) ---------- */
  function math() {
    if (window.renderMathInElement) {
      window.renderMathInElement(document.body, {
        delimiters: [{ left: '$$', right: '$$', display: true }, { left: '\\(', right: '\\)', display: false }],
        throwOnError: false
      });
    }
  }
  if (document.readyState === 'complete') math(); else window.addEventListener('load', math);

  var y = document.getElementById('yr'); if (y) y.textContent = new Date().getFullYear();
})();

/* ---------- media: lightbox + compare slider ---------- */
(function () {
  'use strict';
  var items = Array.prototype.slice.call(document.querySelectorAll('button.lb'));
  if (items.length) {
    var box = document.createElement('div');
    box.className = 'lightbox'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', 'Image viewer');
    box.innerHTML = '<button class="lb-btn lb-close" type="button" aria-label="Close">✕</button>' +
      '<button class="lb-btn lb-prev" type="button" aria-label="Previous image">‹</button>' +
      '<img alt=""><div class="lb-cap"></div>' +
      '<button class="lb-btn lb-next" type="button" aria-label="Next image">›</button>';
    document.body.appendChild(box);
    var img = box.querySelector('img'), cap = box.querySelector('.lb-cap'), idx = 0, opener = null;
    function show(i) {
      idx = (i + items.length) % items.length;
      var b = items[idx], im = b.querySelector('img');
      img.src = b.getAttribute('data-full') || im.src; img.alt = im.alt;
      var fc = b.parentNode.querySelector('figcaption');
      cap.textContent = fc ? fc.textContent : im.alt;
    }
    function open(i, btn) { opener = btn; show(i); box.classList.add('open'); document.body.style.overflow = 'hidden'; box.querySelector('.lb-close').focus(); }
    function close() { box.classList.remove('open'); document.body.style.overflow = ''; if (opener) opener.focus(); }
    items.forEach(function (b, i) { b.addEventListener('click', function () { open(i, b); }); });
    box.addEventListener('click', function (e) { if (e.target === box) close(); });
    box.querySelector('.lb-close').addEventListener('click', close);
    box.querySelector('.lb-prev').addEventListener('click', function () { show(idx - 1); });
    box.querySelector('.lb-next').addEventListener('click', function () { show(idx + 1); });
    document.addEventListener('keydown', function (e) {
      if (!box.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') show(idx - 1);
      else if (e.key === 'ArrowRight') show(idx + 1);
    });
  }
  document.querySelectorAll('.compare').forEach(function (c) {
    var r = c.querySelector('input[type="range"]');
    function set() { c.style.setProperty('--pos', r.value + '%'); }
    r.addEventListener('input', set); set();
  });
})();
