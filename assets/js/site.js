/* Global behaviour: theme, mobile menu, nav scrollspy, filters, copy buttons, reveal, TOC, lightbox, video, math. */
(function () {
  'use strict';
  var root = document.documentElement;
  root.classList.remove('no-js');

  /* ---------- theme (dark-first; light is opt-in and remembered) ---------- */
  function currentTheme() { return root.getAttribute('data-theme') === 'light' ? 'light' : 'dark'; }
  function setTheme(t, persist) {
    root.setAttribute('data-theme', t);
    if (persist) { try { localStorage.setItem('theme', t); } catch (e) { /* storage may be blocked */ } }
    var b = document.getElementById('theme-toggle');
    if (b) {
      b.textContent = t === 'dark' ? '☾' : '☀';
      b.setAttribute('aria-label', 'Switch to ' + (t === 'dark' ? 'light' : 'dark') + ' theme');
      b.setAttribute('aria-pressed', t === 'light' ? 'true' : 'false');
    }
    var m = document.querySelector('meta[name="theme-color"]'); if (m) m.setAttribute('content', t === 'dark' ? '#0b1120' : '#f8fafc');
    document.dispatchEvent(new CustomEvent('themechange'));
  }
  var tb = document.getElementById('theme-toggle');
  if (tb) { setTheme(currentTheme(), false); tb.addEventListener('click', function () { setTheme(currentTheme() === 'dark' ? 'light' : 'dark', true); }); }

  /* ---------- mobile menu ---------- */
  var mb = document.getElementById('menu-btn'), nav = document.getElementById('site-nav');
  if (mb && nav) {
    function setMenu(open) { nav.classList.toggle('open', open); mb.setAttribute('aria-expanded', open ? 'true' : 'false'); mb.textContent = open ? '✕' : '☰'; mb.setAttribute('aria-label', open ? 'Close menu' : 'Open menu'); }
    mb.addEventListener('click', function () { setMenu(!nav.classList.contains('open')); });
    nav.addEventListener('click', function (e) { if (e.target.tagName === 'A') setMenu(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && nav.classList.contains('open')) { setMenu(false); mb.focus(); } });
    window.addEventListener('resize', function () { if (window.innerWidth > 960) setMenu(false); });
  }

  /* ---------- nav scrollspy for in-page links (home page) ---------- */
  var spyLinks = Array.prototype.slice.call(document.querySelectorAll('#site-nav a[data-spy]'));
  if (spyLinks.length && 'IntersectionObserver' in window) {
    var secs = spyLinks.map(function (a) { return document.getElementById(a.getAttribute('data-spy')); }).filter(Boolean);
    var vis = {};
    var so = new IntersectionObserver(function (es) {
      es.forEach(function (e) { vis[e.target.id] = e.isIntersecting ? e.intersectionRatio : 0; });
      var best = null, bv = 0;
      secs.forEach(function (s) { if ((vis[s.id] || 0) > bv) { bv = vis[s.id]; best = s.id; } });
      spyLinks.forEach(function (a) { if (a.getAttribute('data-spy') === best) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current'); });
    }, { rootMargin: '-25% 0px -55% 0px', threshold: [0, 0.1, 0.4, 1] });
    secs.forEach(function (s) { so.observe(s); });
  }

  /* ---------- category filter pills ---------- */
  document.querySelectorAll('[data-filter-group]').forEach(function (group) {
    var target = document.getElementById(group.getAttribute('data-filter-group'));
    if (!target) return;
    var cards = Array.prototype.slice.call(target.querySelectorAll('[data-cat]'));
    var count = document.getElementById(group.getAttribute('data-filter-group') + '-count');
    function apply(cat) {
      var n = 0;
      cards.forEach(function (c) {
        var show = cat === 'all' || c.getAttribute('data-cat').split(/\s+/).indexOf(cat) !== -1;
        c.hidden = !show; if (show) n++;
      });
      group.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-cat') === cat ? 'true' : 'false'); });
      if (count) count.textContent = n + ' of ' + cards.length + ' shown';
    }
    group.addEventListener('click', function (e) { var b = e.target.closest('button[data-cat]'); if (b) apply(b.getAttribute('data-cat')); });
    apply('all');
  });

  /* ---------- graceful fallback for images that have not been added yet ---------- */
  function markMissing(img) {
    var host = img.closest('[data-fallback]'); if (!host || host.classList.contains('missing')) return;
    host.classList.add('missing');
    var f = img.getAttribute('src') || '', msg = 'Image not added yet: ' + f.split('/').pop();
    host.setAttribute('data-missing', msg);
    host.querySelectorAll('.frame').forEach(function (fr) { fr.setAttribute('data-missing', msg); });
  }
  document.querySelectorAll('[data-fallback] img').forEach(function (img) {
    if (img.complete && img.naturalWidth === 0) markMissing(img);
    img.addEventListener('error', function () { markMissing(img); });
  });

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

/* ---------- media: lightbox, autoplaying loops, compare slider ---------- */
(function () {
  'use strict';
  var all = Array.prototype.slice.call(document.querySelectorAll('button.lb'));
  if (all.length) {
    var box = document.createElement('div');
    box.className = 'lightbox'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', 'Image viewer');
    box.innerHTML = '<button class="lb-btn lb-close" type="button" aria-label="Close">✕</button>' +
      '<button class="lb-btn lb-prev" type="button" aria-label="Previous image">‹</button>' +
      '<img alt=""><div class="lb-cap"></div>' +
      '<button class="lb-btn lb-next" type="button" aria-label="Next image">›</button>';
    document.body.appendChild(box);
    var img = box.querySelector('img'), cap = box.querySelector('.lb-cap'), idx = 0, opener = null, items = [];
    function live() { return all.filter(function (b) { var im = b.querySelector('img'); return im && b.offsetParent !== null && !(im.complete && im.naturalWidth === 0); }); }
    function show(i) {
      idx = (i + items.length) % items.length;
      var b = items[idx], im = b.querySelector('img');
      img.src = b.getAttribute('data-full') || im.currentSrc || im.src; img.alt = im.alt;
      var fc = b.closest('figure') && b.closest('figure').querySelector('figcaption');
      cap.textContent = fc ? fc.textContent : im.alt;
    }
    function open(btn) { items = live(); idx = Math.max(0, items.indexOf(btn)); opener = btn; show(idx); box.classList.add('open'); document.body.style.overflow = 'hidden'; box.querySelector('.lb-close').focus(); }
    function close() { box.classList.remove('open'); document.body.style.overflow = ''; if (opener) opener.focus(); }
    all.forEach(function (b) { b.addEventListener('click', function () { open(b); }); });
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
  (function () {
    var vids = document.querySelectorAll('video[data-autoplay]');
    if (!vids.length) return;
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting && e.intersectionRatio >= 0.5) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
        else if (!v.paused) v.pause();
      });
    }, { threshold: [0, 0.5] });
    vids.forEach(function (v) { io.observe(v); });
  })();
  document.querySelectorAll('.compare').forEach(function (c) {
    var r = c.querySelector('input[type="range"]');
    function set() { c.style.setProperty('--pos', r.value + '%'); }
    r.addEventListener('input', set); set();
  });
})();
