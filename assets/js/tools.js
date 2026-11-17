/* Interactive charts + calculators. Every block is guarded: it only runs if its container exists on the page.
   All constants come from the public bg-flood-map docs or from my CM1 / meteorology notes. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var NS = 'http://www.w3.org/2000/svg';
  function el(tag, attrs, parent) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function txt(parent, x, y, s, attrs) { var t = el('text', Object.assign({ x: x, y: y }, attrs || {}), parent); t.textContent = s; return t; }
  function fmt(x, d) { return Number.isFinite(x) ? x.toLocaleString('en-US', { maximumFractionDigits: d == null ? 2 : d, minimumFractionDigits: 0 }) : '—'; }
  function num(id) { var v = parseFloat($(id).value); return Number.isFinite(v) ? v : NaN; }
  function css(v) { return getComputedStyle(document.documentElement).getPropertyValue(v).trim(); }

  /* ======================================================================
     DATA (from README.md / STORM_DATA_SOURCES.md in bg-flood-map)
     ====================================================================== */
  var STORMS = [
    { rp: '2-year',   used: 3.5, noaa: 3.54, aep: '50%' },
    { rp: '5-year',   used: 4.2, noaa: 4.32, aep: '20%' },
    { rp: '10-year',  used: 4.9, noaa: 4.97, aep: '10%' },
    { rp: '25-year',  used: 5.9, noaa: 5.89, aep: '4%'  },
    { rp: '50-year',  used: 6.7, noaa: 6.65, aep: '2%'  },
    { rp: '100-year', used: 7.6, noaa: 7.45, aep: '1%'  }
  ];
  // 11-point cumulative curve: fraction of 24 h -> fraction of depth (first 2-yr run, reused for all design storms)
  var CUM = [[0, 0], [.1, .04], [.2, .10], [.3, .19], [.4, .31], [.5, .50], [.6, .70], [.7, .79], [.8, .86], [.9, .92], [1, 1]];

  /* ======================================================================
     1. Return-period chart: depth used in runs vs NOAA Atlas 14
     ====================================================================== */
  var c1 = $('chart-return');
  if (c1) {
    var drawReturn = function () {
      c1.innerHTML = '';
      var W = 640, H = 300, m = { l: 46, r: 14, t: 16, b: 42 };
      c1.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      var ymax = 8, iw = W - m.l - m.r, ih = H - m.t - m.b;
      for (var g = 0; g <= ymax; g += 2) {
        var gy = m.t + ih - (g / ymax) * ih;
        el('line', { x1: m.l, x2: W - m.r, y1: gy, y2: gy, 'class': 'grid-l' }, c1);
        txt(c1, m.l - 8, gy + 4, g + '"', { 'text-anchor': 'end' });
      }
      var bw = iw / STORMS.length;
      STORMS.forEach(function (s, i) {
        var x0 = m.l + i * bw + bw * .14, w = bw * .34;
        var h1 = (s.used / ymax) * ih, h2 = (s.noaa / ymax) * ih;
        el('rect', { x: x0, y: m.t + ih - h1, width: w, height: h1, rx: 3, fill: css('--accent') }, c1);
        el('rect', { x: x0 + w + 4, y: m.t + ih - h2, width: w, height: h2, rx: 3, fill: css('--accent-2') }, c1);
        txt(c1, x0 + w, m.t + ih - Math.max(h1, h2) - 6, (((s.used - s.noaa) / s.noaa) * 100 >= 0 ? '+' : '') + fmt(((s.used - s.noaa) / s.noaa) * 100, 1) + '%', { 'text-anchor': 'middle' });
        txt(c1, x0 + w + 2, H - m.b + 18, s.rp, { 'text-anchor': 'middle' });
        txt(c1, x0 + w + 2, H - m.b + 32, 'AEP ' + s.aep, { 'text-anchor': 'middle' });
      });
      el('line', { x1: m.l, x2: W - m.r, y1: m.t + ih, y2: m.t + ih, 'class': 'axis' }, c1);
      txt(c1, 4, 12, '24-h depth (in)');
    };
    drawReturn();
    document.addEventListener('themechange', drawReturn);
  }

  /* ======================================================================
     2. Hyetograph: incremental rainfall of the shared 11-point curve
     ====================================================================== */
  var c2 = $('chart-hyeto');
  if (c2) {
    var sel = $('hy-storm');
    STORMS.forEach(function (s, i) { var o = document.createElement('option'); o.value = i; o.textContent = s.rp + ' (' + s.used + ' in)'; sel.appendChild(o); });
    var drawHy = function () {
      var s = STORMS[parseInt(sel.value || '0', 10)];
      var mm = s.used * 25.4;
      c2.innerHTML = '';
      var W = 640, H = 300, m = { l: 50, r: 50, t: 16, b: 42 }, iw = W - m.l - m.r, ih = H - m.t - m.b;
      var incs = [], i;
      for (i = 1; i < CUM.length; i++) incs.push(CUM[i][1] - CUM[i - 1][1]);
      var blockH = 2.4;                                  // 10 % of 24 h
      var rates = incs.map(function (f) { return mm * f / blockH; });   // mm/h averaged over each block
      var rmax = Math.max.apply(null, rates) * 1.2;
      var bw = iw / incs.length;
      [0, .25, .5, .75, 1].forEach(function (f) {
        var gy = m.t + ih - f * ih;
        el('line', { x1: m.l, x2: W - m.r, y1: gy, y2: gy, 'class': 'grid-l' }, c2);
        txt(c2, m.l - 8, gy + 4, fmt(f * rmax, 1), { 'text-anchor': 'end' });
        txt(c2, W - m.r + 8, gy + 4, Math.round(f * mm) + '', { 'text-anchor': 'start' });
      });
      rates.forEach(function (r, k) {
        var h = (r / rmax) * ih;
        el('rect', { x: m.l + k * bw + 3, y: m.t + ih - h, width: bw - 6, height: h, rx: 3, fill: css('--accent-2'), opacity: k === 5 ? 1 : .6 }, c2);
        txt(c2, m.l + k * bw + bw / 2, H - m.b + 16, (k * blockH).toFixed(1).replace(/\.0$/, '') + '–' + ((k + 1) * blockH).toFixed(1), { 'text-anchor': 'middle' });
      });
      var pts = CUM.map(function (p) { return (m.l + p[0] * iw).toFixed(1) + ',' + (m.t + ih - p[1] * ih).toFixed(1); }).join(' ');
      el('polyline', { points: pts, fill: 'none', stroke: css('--accent'), 'stroke-width': 2 }, c2);
      el('line', { x1: m.l, x2: W - m.r, y1: m.t + ih, y2: m.t + ih, 'class': 'axis' }, c2);
      txt(c2, 4, 12, 'mm/h (bars)');
      txt(c2, W - 4, 12, 'cum. mm (line)', { 'text-anchor': 'end' });
      txt(c2, W / 2, H - 4, 'hour of storm', { 'text-anchor': 'middle' });
      var pk = Math.max.apply(null, rates);
      $('hy-out').innerHTML =
        '<div class="o"><b>' + fmt(mm, 1) + ' mm</b><span>total rain (' + s.used + ' in)</span></div>' +
        '<div class="o"><b>' + fmt(pk, 2) + ' mm/h</b><span>peak block rate (hours 12–14.4)</span></div>' +
        '<div class="o"><b>' + fmt(pk / 25.4, 2) + ' in/h</b><span>same, in inches</span></div>';
    };
    sel.addEventListener('change', drawHy);
    drawHy();
    document.addEventListener('themechange', drawHy);
  }

  /* ======================================================================
     3. SCS Curve Number runoff
        S = 1000/CN - 10 (in),  Ia = 0.2 S,  Q = (P-Ia)^2 / (P-Ia+S)
     ====================================================================== */
  function scs(P, CN) {
    var S = 1000 / CN - 10, Ia = 0.2 * S;
    var Q = P > Ia ? Math.pow(P - Ia, 2) / (P - Ia + S) : 0;
    return { S: S, Ia: Ia, Q: Q };
  }
  window.__scs = scs; // exposed for the self-test below
  if ($('scs-P')) {
    var runScs = function () {
      var P = num('scs-P'), CN = num('scs-CN');
      if (!(P >= 0) || !(CN > 30 && CN <= 100)) { $('scs-out').innerHTML = '<div class="o"><b>—</b><span>enter P ≥ 0 and CN 31–100</span></div>'; return; }
      var r = scs(P, CN), r98 = scs(P, 98);
      $('scs-out').innerHTML =
        '<div class="o"><b>' + fmt(r.Q, 2) + ' in</b><span>runoff Q (' + fmt(r.Q * 25.4, 1) + ' mm)</span></div>' +
        '<div class="o"><b>' + fmt(P > 0 ? r.Q / P * 100 : 0, 0) + '%</b><span>runoff ratio, CN ' + CN + '</span></div>' +
        '<div class="o"><b>' + fmt(r.S, 2) + ' in</b><span>S (potential retention)</span></div>' +
        '<div class="o"><b>' + fmt(r.Ia, 2) + ' in</b><span>Ia = 0.2 S (initial abstraction)</span></div>' +
        '<div class="o"><b>' + fmt(r98.Q, 2) + ' in</b><span>runoff if CN = 98 (roads, roofs)</span></div>';
    };
    ['scs-P', 'scs-CN'].forEach(function (id) { $(id).addEventListener('input', runScs); });
    document.querySelectorAll('[data-scs-p]').forEach(function (b) {
      b.addEventListener('click', function () { $('scs-P').value = b.getAttribute('data-scs-p'); runScs(); });
    });
    runScs();
  }

  /* ======================================================================
     4. Grid / memory / stability-limit calculator for the flood solver
        local-inertial time-step limit:  dt <= alpha * dx / sqrt(g h)
     ====================================================================== */
  if ($('gr-nx')) {
    var G = 9.81;
    var runGrid = function () {
      var nx = num('gr-nx'), ny = num('gr-ny'), dx = num('gr-dx'), h = num('gr-h'), al = num('gr-al');
      if (!(nx > 0 && ny > 0 && dx > 0 && h > 0 && al > 0)) return;
      var cells = nx * ny, areaKm2 = cells * dx * dx / 1e6;
      var dtMax = al * dx / Math.sqrt(G * h);
      $('gr-out').innerHTML =
        '<div class="o"><b>' + fmt(cells / 1e6, 1) + ' M</b><span>cells</span></div>' +
        '<div class="o"><b>' + fmt(nx * dx / 1000, 1) + ' × ' + fmt(ny * dx / 1000, 1) + ' km</b><span>domain (' + fmt(areaKm2, 0) + ' km²)</span></div>' +
        '<div class="o"><b>' + fmt(cells * 4 / 1e9, 2) + ' GB</b><span>one float32 field</span></div>' +
        '<div class="o"><b>' + fmt(dtMax, 3) + ' s</b><span>max Δt at h = ' + h + ' m (CFL α = ' + al + ')</span></div>' +
        '<div class="o"><b>' + fmt(86400 / dtMax, 0) + '</b><span>steps to cover 24 h at that Δt</span></div>';
    };
    ['gr-nx', 'gr-ny', 'gr-dx', 'gr-h', 'gr-al'].forEach(function (id) { $(id).addEventListener('input', runGrid); });
    document.querySelectorAll('[data-grid]').forEach(function (b) {
      b.addEventListener('click', function () {
        var v = b.getAttribute('data-grid').split(',');
        $('gr-nx').value = v[0]; $('gr-ny').value = v[1]; $('gr-dx').value = v[2]; runGrid();
      });
    });
    runGrid();
  }

  /* ======================================================================
     5. CM1 grid + time-step planner (rules of thumb from README.namelist)
          psolver 2-6 : dtl ~ min(dx,dy,dz)/67     psolver 1 : dtl ~ min(dx,dy,dz)/700
     ====================================================================== */
  if ($('cm-nx')) {
    var runCm = function () {
      var nx = num('cm-nx'), ny = num('cm-ny'), nz = num('cm-nz'), dx = num('cm-dx'), dy = num('cm-dy'), dz = num('cm-dz');
      var timax = num('cm-timax'), U = num('cm-U'), ps = $('cm-ps').value;
      if (![nx, ny, nz, dx, dy, dz, timax].every(function (v) { return v > 0; })) return;
      var mn = Math.min(dx, dy, dz), div = ps === '1' ? 700 : 67;
      var dtl = mn / div, steps = timax / dtl, cells = nx * ny * nz;
      var C = Number.isFinite(U) && U > 0 ? U * dtl / mn : NaN;
      var warn = '';
      if (ps === '3' && !(dz * 4 < Math.min(dx, dy))) warn += 'psolver=3 is meant for dz ≪ dx,dy. ';
      if (ps === '2' && Math.max(dx, dy) / dz > 5) warn += 'Large dx/dz aspect ratio: consider psolver=3. ';
      $('cm-out').innerHTML =
        '<div class="o"><b>' + fmt(nx * dx / 1000, 1) + ' × ' + fmt(ny * dy / 1000, 1) + ' × ' + fmt(nz * dz / 1000, 1) + ' km</b><span>domain (x × y × z, unstretched)</span></div>' +
        '<div class="o"><b>' + fmt(cells / 1e6, 2) + ' M</b><span>grid points</span></div>' +
        '<div class="o"><b>' + fmt(dtl, 2) + ' s</b><span>suggested dtl (min Δ / ' + div + ')</span></div>' +
        '<div class="o"><b>' + fmt(steps, 0) + '</b><span>large steps to reach timax</span></div>' +
        '<div class="o"><b>' + (Number.isFinite(C) ? fmt(C, 2) : '—') + '</b><span>Courant number at U = ' + (Number.isFinite(U) ? U : '?') + ' m/s</span></div>';
      $('cm-note').textContent = warn || 'Starting values only: with adapt_dt = 1 the solver adjusts the step to hold cfl_limit (1.0 recommended).';
    };
    ['cm-nx', 'cm-ny', 'cm-nz', 'cm-dx', 'cm-dy', 'cm-dz', 'cm-timax', 'cm-U', 'cm-ps'].forEach(function (id) { $(id).addEventListener('input', runCm); });
    runCm();
  }

  /* ======================================================================
     6. Namelist explorer (paraphrased from README.namelist, cm1r22.0)
     ====================================================================== */
  var NL = [
    ['&param0', 'nx, ny, nz', 'Grid points in x, y, z', 'Any positive integer. ny = 1 for 2-D runs.'],
    ['&param1', 'dx, dy, dz', 'Grid spacing (m)', 'dz used only when stretch_z = 0.'],
    ['&param1', 'dtl', 'Large time step (s)', 'psolver 2-6: ~ min(Δ)/67. psolver 1: ~ min(Δ)/700.'],
    ['&param1', 'cfl_limit', 'Max Courant number when adapt_dt = 1', '1.0 recommended.'],
    ['&param1', 'timax', 'Total integration time (s)', 'e.g. 7200 = 2 h.'],
    ['&param1', 'tapfrq', '3-D output interval (s)', 'Writes cm1out files.'],
    ['&param1', 'rstfrq', 'Restart interval (s)', 'Negative = no restart files.'],
    ['&param2', 'cm1setup', 'How turbulence is handled', '0 none (Euler) · 1 LES · 2 mesoscale + PBL · 3 DNS · 4 LES nested in mesoscale.'],
    ['&param2', 'adapt_dt', 'Adaptive time step', '0 fixed dtl · 1 hold cfl_limit.'],
    ['&param2', 'hadvordrs / vadvordrs', 'Scalar advection order', '2-10. Odd orders carry implicit diffusion (idiff = 0 usually fine). 5th is the common choice.'],
    ['&param2', 'hadvordrv / vadvordrv', 'Velocity advection order', 'Same options as scalars.'],
    ['&param2', 'advwenos / advwenov', 'WENO advection', 'weno_order 3/5/7/9; default 5.'],
    ['&param2', 'idiff, difforder', 'Extra numerical diffusion', 'Even-order advection usually wants idiff = 1. difforder 6 recommended (damps 2-6 Δx noise).'],
    ['&param2', 'imoist', 'Moisture on/off', '0 dry · 1 moist.'],
    ['&param2', 'ptype', 'Microphysics scheme', '1 Kessler · 3 Thompson · 5 Morrison (default) · 7 WSM6 · 26/27 NSSL 2-moment (graupel / graupel+hail) · 28 NSSL 1-moment · 50-53 P3.'],
    ['&param2', 'eqtset', 'Moist equation set', '1 traditional · 2 energy-conserving incl. hydrometeor heat capacity (Bryan & Fritsch 2002).'],
    ['&param2', 'ipbl / sgsmodel', 'PBL scheme / LES subgrid model', 'ipbl needs cm1setup = 2 (YSU, MYNN, MYJ, …); sgsmodel needs cm1setup = 1 (Deardorff TKE, Smagorinsky, NBA, …).'],
    ['&param2', 'wbc, ebc, sbc, nbc', 'Lateral boundary conditions', '1 periodic · 2 open-radiative · 3 free-slip wall · 4 no-slip wall. Periodic must be paired.'],
    ['&param2', 'bbc / tbc', 'Bottom / top wind BC', '1 free-slip · 2 no-slip · 3 semi-slip (needs surface settings).'],
    ['&param2', 'irdamp, hrdamp', 'Rayleigh damping (top / lateral)', 'rdalpha ~ 1/300 s⁻¹, zd sets start height.'],
    ['&param2', 'psolver', 'Pressure / acoustic treatment', '2 Klemp-Wilhelmson split (usual choice) · 3 vertically implicit (dz ≪ dx,dy) · 4 anelastic · 5 incompressible.'],
    ['&param2', 'icor, fcor', 'Coriolis', 'fcor e.g. 1e-4 s⁻¹ (~43°N).'],
    ['&param2', 'isnd', 'Base-state sounding', '5 Weisman-Klemp analytic · 7 read input_sounding (most common).'],
    ['&param2', 'iwnd', 'Base-state wind profile', 'Ignored when isnd = 7.'],
    ['&param2', 'iinit', '3-D initial perturbation', '1 warm bubble · 2 cold pool · 3 line of warm bubbles · 9 forced convergence · 14 Bryan-Rotunno cold pool in shear.'],
    ['&param2', 'irandp, numrand', 'Random initial perturbations', 'numrand = ensemble-member index (1, 2, 3, …).'],
    ['&param2', 'imove, umove, vmove', 'Domain translation', 'Keeps a moving storm in the domain.'],
    ['&param2', 'iprcl, nparcels', 'Passive parcels', 'Lagrangian trajectories for updraft source analysis.'],
    ['&param3', 'kdiff6', '6th-order diffusion coefficient', '0.02-0.24 recommended.'],
    ['&param3', 'kdiv', 'Divergence damper', '~0.1; psolver 2 or 3 only.'],
    ['&param3', 'ndcnst', 'Droplet concentration (cm⁻³), Morrison', '~100 maritime, ~300 continental.'],
    ['&param6', 'stretch_z, ztop, dz_bot, dz_top', 'Vertical grid stretching', 'Fine dz near the ground, coarser aloft (stretch_z 1-4).'],
    ['&param9', 'output_format, output_filetype', 'Output layout', '1 GrADS · 2 netCDF; filetype 1-4 (one file / per time / per process / per node).'],
    ['&param9', 'output_dbz', 'Simulated reflectivity', 'ptype 2, 3, 5, 26-28, 50-53, 55.'],
    ['&param9', 'output_uh, output_shs', 'Updraft helicity (2-5 km) and swath', 'Mesocyclone tracking.'],
    ['&param9', 'output_vort, output_svs', '3-D vorticity / low-level max vertical vorticity swath', 'Tornado-vortex and QLCS mesovortex tracking.'],
    ['&param9', 'output_sws, output_rain', 'Max surface wind swath / surface rain', 'Damaging-wind and QPF verification.'],
    ['&param9', 'output_cape, output_cin, output_lcl, output_lfc', 'Column thermodynamic diagnostics', 'Environment evolution inside the run.'],
    ['&param9', 'output_pdcomp', 'Buoyancy / dynamic-pressure decomposition', 'Updraft forcing analysis.'],
    ['&param10', 'stat_cfl', 'Max Courant number in stats file', 'Keep KSHMAX < ~0.125 in 3-D.'],
    ['&param11', 'radopt, dtrad', 'Radiation scheme and call interval', '1 NASA-Goddard · 2 RRTMG.'],
    ['&param12', 'sfcmodel, oceanmodel', 'Surface layer / ocean', 'bbc = 3 needs sfcmodel ≥ 1.'],
    ['&param14', 'dodomaindiag, diagfrq', 'Domain diagnostics (budgets)', 'Needed for budget output option 2.'],
    ['&nssl2mom_params', 'ccn, infall, nssl_3moment', 'NSSL microphysics knobs', 'ccn default 0.6e9 (low continental); infall = 4 recommended; 3-moment reflectivity option.']
  ];
  var nlBody = $('nl-body');
  if (nlBody) {
    var blocks = {};
    NL.forEach(function (r) { blocks[r[0]] = 1; });
    var bsel = $('nl-block');
    Object.keys(blocks).forEach(function (b) { var o = document.createElement('option'); o.value = b; o.textContent = b; bsel.appendChild(o); });
    var renderNl = function () {
      var q = $('nl-q').value.trim().toLowerCase(), b = bsel.value, n = 0;
      nlBody.innerHTML = '';
      NL.forEach(function (r) {
        if (b && r[0] !== b) return;
        if (q && (r.join(' ').toLowerCase().indexOf(q) < 0)) return;
        var tr = document.createElement('tr'); n++;
        tr.innerHTML = '<td class="mono">' + r[0] + '</td><td class="mono"><b>' + r[1] + '</b></td><td>' + r[2] + '</td><td class="muted">' + r[3] + '</td>';
        nlBody.appendChild(tr);
      });
      $('nl-count').textContent = n + ' of ' + NL.length + ' parameters shown';
    };
    $('nl-q').addEventListener('input', renderNl); bsel.addEventListener('change', renderNl);
    renderNl();
  }

  /* ======================================================================
     7. LCL + stability classifier (course rules of thumb)
     ====================================================================== */
  if ($('lc-T')) {
    var runLc = function () {
      var T = num('lc-T'), Td = num('lc-Td'), elr = num('lc-elr');
      if (!Number.isFinite(T) || !Number.isFinite(Td)) return;
      var dd = T - Td;
      var lcl = dd > 0 ? 125 * dd : 0;
      var DALR = 9.8, MALR = 6;
      var cls = '—', col = 'var(--muted)';
      if (Number.isFinite(elr)) {
        if (elr > DALR) { cls = 'Absolutely unstable'; col = 'var(--bad)'; }
        else if (elr < MALR) { cls = 'Absolutely stable'; col = 'var(--good)'; }
        else { cls = 'Conditionally unstable'; col = 'var(--warn)'; }
      }
      $('lc-out').innerHTML =
        '<div class="o"><b>' + fmt(dd, 1) + ' °C</b><span>dew point depression</span></div>' +
        '<div class="o"><b>≈ ' + fmt(lcl, 0) + ' m</b><span>LCL / cloud base (125 m per °C)</span></div>' +
        '<div class="o"><b style="color:' + col + '">' + cls + '</b><span>ELR ' + (Number.isFinite(elr) ? elr : '?') + ' °C/km vs MALR ≈ ' + MALR + ', DALR = ' + DALR + '</span></div>';
    };
    ['lc-T', 'lc-Td', 'lc-elr'].forEach(function (id) { $(id).addEventListener('input', runLc); });
    runLc();
  }

  /* ======================================================================
     Self-test (console only): SCS runoff must reproduce the 2-yr run summary (33.2 mm of 88.9 mm).
     ====================================================================== */
  try {
    var q = scs(3.5, 75).Q * 25.4;
    if (Math.abs(q - 33.2) > 0.6) console.warn('[self-test] SCS mismatch vs. run summary:', q);
  } catch (e) { /* no-op */ }
})();
