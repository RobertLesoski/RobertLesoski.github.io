/* Charts for the CM1 emulator results. All numbers come from assets/js/emu-data.js (my own run logs and evaluation files). */
(function () {
  'use strict';
  var D = window.EMU; if (!D) return;
  var NS = 'http://www.w3.org/2000/svg';
  function safe(fn) { try { fn(); } catch (e) { if (window.console) console.warn('[emu chart]', e); } }
  function el(name, attrs, parent, text) {
    var e = document.createElementNS(NS, name);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (text != null) e.textContent = text;
    if (parent) parent.appendChild(e);
    return e;
  }
  function lin(d0, d1, r0, r1) { return function (v) { return r0 + (v - d0) / (d1 - d0) * (r1 - r0); }; }
  function make(id, W, H, label) {
    var host = document.getElementById(id); if (!host) return null;
    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'chart', role: 'img', 'aria-label': label }, null);
    host.appendChild(svg); return svg;
  }
  var COL = { cyan: 'var(--accent)', amber: 'var(--warn)', green: 'var(--good)', gray: 'var(--faint)', light: 'var(--accent-3)', text: 'var(--muted)' };

  function axes(svg, m, W, H, x, y, xt, yt, xl, yl) {
    el('rect', { x: m.l, y: m.t, width: W - m.l - m.r, height: H - m.t - m.b, fill: 'none', stroke: 'var(--line-2)' }, svg);
    yt.forEach(function (v) {
      el('line', { x1: m.l, x2: W - m.r, y1: y(v), y2: y(v), class: 'grid-l' }, svg);
      el('text', { x: m.l - 6, y: y(v) + 3.5, 'text-anchor': 'end' }, svg, (Math.abs(v) < 1e-9 ? '0' : (+v.toFixed(2)).toString()));
    });
    xt.forEach(function (v) { el('text', { x: x(v), y: H - m.b + 15, 'text-anchor': 'middle' }, svg, String(v)); });
    if (xl) el('text', { x: (m.l + W - m.r) / 2, y: H - 4, 'text-anchor': 'middle' }, svg, xl);
    if (yl) el('text', { x: 12, y: (m.t + H - m.b) / 2, transform: 'rotate(-90 12 ' + ((m.t + H - m.b) / 2) + ')', 'text-anchor': 'middle' }, svg, yl);
  }
  function legend(id, items) {
    var host = document.getElementById(id); if (!host) return;
    var d = document.createElement('div'); d.className = 'legend';
    items.forEach(function (it) { var s = document.createElement('span'); s.innerHTML = '<i style="background:' + it[1] + '"></i>' + it[0]; d.appendChild(s); });
    host.appendChild(d);
  }
  function path(pts, x, y) { return pts.map(function (p, i) { return (i ? 'L' : 'M') + x(p[0]).toFixed(1) + ' ' + y(p[1]).toFixed(1); }).join(' '); }

  /* ---- 1. validation skill by epoch, four runs ---- */
  safe(function () {
    var W = 720, H = 330, m = { l: 48, r: 16, t: 14, b: 44 };
    var svg = make('c-curves', W, H, 'Validation skill versus persistence by training epoch for four training runs'); if (!svg) return;
    var x = lin(1, 36, m.l, W - m.r), y = lin(-0.05, 0.5, H - m.b, m.t);
    axes(svg, m, W, H, x, y, [1, 6, 12, 18, 24, 30, 36], [0, 0.1, 0.2, 0.3, 0.4, 0.5], 'epoch', 'validation skill');
    el('line', { x1: m.l, x2: W - m.r, y1: y(0), y2: y(0), stroke: 'var(--line-2)' }, svg);
    var series = [['real_unet_v3', COL.gray, '4 4', 1.6, 'run 1 · 1.8 M'], ['real_unet_big', COL.amber, '4 4', 1.8, 'run 1 · 4.1 M'], ['full_v3', COL.light, '', 2, 'run 2 · 1.8 M'], ['full_big', COL.cyan, '', 2.6, 'run 2 · 4.1 M, regularized']];
    series.forEach(function (s) {
      var h = D.history[s[0]]; var pts = h.map(function (r) { return [r[0], r[3]]; });
      var p = el('path', { d: path(pts, x, y), fill: 'none', stroke: s[1], 'stroke-width': s[3], 'stroke-linejoin': 'round' }, svg);
      if (s[2]) p.setAttribute('stroke-dasharray', s[2]);
      var last = pts[pts.length - 1]; el('circle', { cx: x(last[0]), cy: y(last[1]), r: 3.4, fill: s[1] }, svg);
    });
    legend('c-curves', series.map(function (s) { return [s[4], s[1]]; }));
  });

  /* ---- 2. skill per variable, step 1 and step 5 ---- */
  safe(function () {
    var vars = ['u', 'v', 'w', 'th', 'prs', 'qv', 'qc', 'qr', 'qi', 'qs', 'qg'];
    var W = 720, H = 330, m = { l: 48, r: 16, t: 14, b: 40 };
    var svg = make('c-var', W, H, 'Per-variable skill versus persistence at 100 seconds and 500 seconds for two models'); if (!svg) return;
    var y = lin(-0.3, 0.5, H - m.b, m.t), bw = (W - m.l - m.r) / vars.length;
    var x = lin(0, vars.length, m.l, W - m.r);
    axes(svg, m, W, H, x, y, [], [-0.2, 0, 0.2, 0.4], null, 'skill');
    el('line', { x1: m.l, x2: W - m.r, y1: y(0), y2: y(0), stroke: 'var(--text)', 'stroke-opacity': .5 }, svg);
    var sk = D.skill;
    vars.forEach(function (v, i) {
      var vals = [[sk.full_v3[v][0], COL.gray], [sk.full_big[v][0], COL.cyan], [sk.full_big[v][4], COL.light]];
      vals.forEach(function (p, j) {
        var bx = m.l + i * bw + 5 + j * ((bw - 10) / 3), w = (bw - 10) / 3 - 2;
        var y0 = y(0), y1 = y(p[0]);
        el('rect', { x: bx, y: Math.min(y0, y1), width: w, height: Math.max(1, Math.abs(y1 - y0)), fill: p[1], rx: 1.5 }, svg);
      });
      el('text', { x: m.l + i * bw + bw / 2, y: H - m.b + 16, 'text-anchor': 'middle' }, svg, v);
    });
    legend('c-var', [['smaller model, +100 s', COL.gray], ['larger model, +100 s', COL.cyan], ['larger model, +500 s', COL.light]]);
  });

  /* ---- 3. skill versus lead time ---- */
  safe(function () {
    var W = 720, H = 300, m = { l: 48, r: 16, t: 14, b: 40 };
    var svg = make('c-lead', W, H, 'Skill versus lead time for selected variables, larger model, validation period'); if (!svg) return;
    var x = lin(100, 500, m.l + 14, W - m.r - 14), y = lin(-0.6, 0.45, H - m.b, m.t);
    axes(svg, m, W, H, x, y, [100, 200, 300, 400, 500], [-0.4, -0.2, 0, 0.2, 0.4], 'lead (s)', 'skill');
    el('line', { x1: m.l, x2: W - m.r, y1: y(0), y2: y(0), stroke: 'var(--text)', 'stroke-opacity': .5 }, svg);
    var s = D.skill.full_big;
    [['w', COL.cyan, ''], ['th', COL.light, ''], ['v', COL.green, ''], ['qr', COL.amber, ''], ['prs', COL.gray, '4 4']].forEach(function (k) {
      var pts = s[k[0]].map(function (v, i) { return [100 * (i + 1), v]; });
      var p = el('path', { d: path(pts, x, y), fill: 'none', stroke: k[1], 'stroke-width': 2.2 }, svg); if (k[2]) p.setAttribute('stroke-dasharray', k[2]);
      pts.forEach(function (q) { el('circle', { cx: x(q[0]), cy: y(q[1]), r: 2.8, fill: k[1] }, svg); });
      var l = pts[pts.length - 1]; el('text', { x: x(l[0]) + 6, y: y(l[1]) + 3.5, style: 'fill:' + k[1] }, svg, k[0]);
    });
  });

  /* ---- 4. online trainer against the gate ---- */
  safe(function () {
    var W = 720, H = 310, m = { l: 48, r: 24, t: 14, b: 44 };
    var svg = make('c-online', W, H, 'Validation MSE ratio against persistence while training online against a running CM1, with the G2 target line'); if (!svg) return;
    var pts = D.online; var x = lin(30, 170, m.l, W - m.r), y = lin(0, 1.1, H - m.b, m.t);
    axes(svg, m, W, H, x, y, [40, 60, 80, 100, 120, 140, 160], [0, 0.2, 0.4, 0.6, 0.8, 1], 'CM1 simulated minutes available to the trainer', 'MSE ratio (lower is better)');
    el('line', { x1: m.l, x2: W - m.r, y1: y(1), y2: y(1), stroke: 'var(--faint)', 'stroke-dasharray': '5 4' }, svg);
    el('text', { x: W - m.r - 4, y: y(1) - 5, 'text-anchor': 'end' }, svg, '1.0  =  "nothing changes"');
    el('line', { x1: m.l, x2: W - m.r, y1: y(0.2), y2: y(0.2), stroke: 'var(--warn)', 'stroke-width': 1.6 }, svg);
    el('text', { x: W - m.r - 4, y: y(0.2) - 6, 'text-anchor': 'end', style: 'fill:var(--warn)' }, svg, 'gate G2 target ≤ 0.2');
    el('path', { d: path(pts.map(function (p) { return [p[0], p[1]]; }), x, y), fill: 'none', stroke: COL.cyan, 'stroke-width': 2.4 }, svg);
    var three = pts.filter(function (p) { return p[2] > 0; });
    el('path', { d: path(three.map(function (p) { return [p[0], p[2]]; }), x, y), fill: 'none', stroke: COL.light, 'stroke-width': 1.6, 'stroke-dasharray': '3 3' }, svg);
    legend('c-online', [['1-step ratio', COL.cyan], ['3-step rollout ratio', COL.light]]);
  });

  /* ---- 5. storm: domain-max updraft with the data split ---- */
  safe(function () {
    var W = 720, H = 280, m = { l: 48, r: 16, t: 14, b: 44 };
    var svg = make('c-storm', W, H, 'Domain-maximum updraft through the 283-minute CM1 run, with training, validation and test periods shaded'); if (!svg) return;
    var w = D.storm.wmax_series, n = w.length;
    var x = lin(0, n - 1, m.l, W - m.r), y = lin(0, 70, H - m.b, m.t);
    var bands = [[0, 119, 'train', 'rgba(148,163,184,0.06)'], [119, 153, 'validation', 'rgba(56,189,248,0.10)'], [153, 170, 'test', 'rgba(245,158,11,0.10)']];
    bands.forEach(function (b) {
      el('rect', { x: x(b[0]), y: m.t, width: x(b[1]) - x(b[0]), height: H - m.t - m.b, fill: b[3] }, svg);
      el('text', { x: (x(b[0]) + x(b[1])) / 2, y: m.t + 14, 'text-anchor': 'middle' }, svg, b[2]);
    });
    axes(svg, m, W, H, x, y, [], [0, 20, 40, 60], null, 'max w (m/s)');
    [0, 60, 120, 180, 240].forEach(function (mn) { var i = mn * 60 / 100; el('text', { x: x(i), y: H - m.b + 15, 'text-anchor': 'middle' }, svg, mn); });
    el('text', { x: (m.l + W - m.r) / 2, y: H - 4, 'text-anchor': 'middle' }, svg, 'simulated minutes');
    el('path', { d: path(w.map(function (v, i) { return [i, v]; }), x, y), fill: 'none', stroke: COL.cyan, 'stroke-width': 2 }, svg);
  });

  /* ---- 6. base state: hodograph and theta ---- */
  safe(function () {
    var b = D.base; var W = 720, H = 330;
    var svg = make('c-base', W, H, 'Base-state hodograph and potential-temperature profile of the idealized CM1 environment'); if (!svg) return;
    // hodograph (left)
    var hx = { l: 56, r: 380, t: 18, b: 300 };
    var u0 = -2, u1 = 36, v0 = -2, v1 = 10;
    var x = lin(u0, u1, hx.l, hx.r), y = lin(v0, v1, hx.b, hx.t * 3.2);
    el('rect', { x: hx.l, y: hx.t * 3.2, width: hx.r - hx.l, height: hx.b - hx.t * 3.2, fill: 'none', stroke: 'var(--line-2)' }, svg);
    [0, 10, 20, 30].forEach(function (v) { el('line', { x1: x(v), x2: x(v), y1: hx.t * 3.2, y2: hx.b, class: 'grid-l' }, svg); el('text', { x: x(v), y: hx.b + 15, 'text-anchor': 'middle' }, svg, v); });
    [0, 5, 10].forEach(function (v) { el('line', { x1: hx.l, x2: hx.r, y1: y(v), y2: y(v), class: 'grid-l' }, svg); el('text', { x: hx.l - 6, y: y(v) + 3.5, 'text-anchor': 'end' }, svg, v); });
    el('text', { x: (hx.l + hx.r) / 2, y: H - 4, 'text-anchor': 'middle' }, svg, 'u (m/s)'); el('text', { x: 14, y: (hx.b + hx.t * 3.2) / 2, transform: 'rotate(-90 14 ' + ((hx.b + hx.t * 3.2) / 2) + ')', 'text-anchor': 'middle' }, svg, 'v (m/s)');
    el('text', { x: hx.l, y: 20, style: 'fill:var(--text);font-weight:600' }, svg, 'Hodograph: 0–15 km, labeled in km');
    var pts = b.z_km.map(function (z, i) { return [b.u[i], b.v[i], z]; }).filter(function (p) { return p[2] <= 9; });
    el('path', { d: path(pts.map(function (p) { return [p[0], p[1]]; }), x, y), fill: 'none', stroke: COL.cyan, 'stroke-width': 2.4 }, svg);
    [0.15, 1.05, 3.15, 6.15].forEach(function (z) {
      var i = b.z_km.indexOf(z); if (i < 0) return;
      el('circle', { cx: x(b.u[i]), cy: y(b.v[i]), r: 4, fill: COL.amber }, svg);
      el('text', { x: x(b.u[i]) + 8, y: y(b.v[i]) - 8 }, svg, (z < 1 ? 'sfc' : Math.round(z) + ' km'));
    });
    // theta0 (right)
    var tx = { l: 450, r: 700 };
    var x2 = lin(300, 360, tx.l, tx.r), y2 = lin(0, 15, hx.b, hx.t * 3.2);
    el('rect', { x: tx.l, y: hx.t * 3.2, width: tx.r - tx.l, height: hx.b - hx.t * 3.2, fill: 'none', stroke: 'var(--line-2)' }, svg);
    [300, 320, 340, 360].forEach(function (v) { el('line', { x1: x2(v), x2: x2(v), y1: hx.t * 3.2, y2: hx.b, class: 'grid-l' }, svg); el('text', { x: x2(v), y: hx.b + 15, 'text-anchor': 'middle' }, svg, v); });
    [0, 5, 10, 15].forEach(function (v) { el('line', { x1: tx.l, x2: tx.r, y1: y2(v), y2: y2(v), class: 'grid-l' }, svg); el('text', { x: tx.l - 6, y: y2(v) + 3.5, 'text-anchor': 'end' }, svg, v); });
    el('text', { x: (tx.l + tx.r) / 2, y: H - 4, 'text-anchor': 'middle' }, svg, 'base-state θ (K)');
    el('text', { x: tx.l, y: 20, style: 'fill:var(--text);font-weight:600' }, svg, 'Potential temperature vs height (km)');
    var tp = b.z_km.map(function (z, i) { return [b.th0[i], z]; }).filter(function (p) { return p[0] <= 360; });
    el('path', { d: path(tp, x2, y2), fill: 'none', stroke: COL.light, 'stroke-width': 2.4 }, svg);
  });

  /* ---- table: per-variable skill, larger model, validation ---- */
  safe(function () {
    var tb = document.getElementById('tbl-skill'); if (!tb) return;
    var names = { u: 'u wind', v: 'v wind', w: 'vertical velocity w', th: 'potential temperature θ', prs: 'pressure', qv: 'water vapour qv', qc: 'cloud water qc', qr: 'rain qr', qi: 'cloud ice qi', qs: 'snow qs', qg: 'graupel qg' };
    var s = D.skill.full_big, html = '';
    Object.keys(names).forEach(function (k) {
      html += '<tr><td>' + names[k] + '</td>' + s[k].map(function (v) { return '<td class="num ' + (v > 0.02 ? 'pos' : (v < -0.02 ? 'neg' : '')) + '">' + (v >= 0 ? '+' : '') + v.toFixed(2) + '</td>'; }).join('') + '</tr>';
    });
    tb.innerHTML = html;
  });
})();
