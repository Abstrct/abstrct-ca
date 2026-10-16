(function () {
  var PALETTES = [
    { bg: '#1F3BFF', ink: ['#FF5A36', '#FFD23F', '#F4F0E6'], text: '#FFFFFF' },
    { bg: '#FF5A36', ink: ['#1F3BFF', '#FFD23F', '#111111'], text: '#111111' },
    { bg: '#F4F0E6', ink: ['#1F3BFF', '#FF5A36', '#111111'], text: '#111111' },
    { bg: '#2EC4B6', ink: ['#111111', '#FF9EC7', '#FFD23F'], text: '#111111' },
    { bg: '#9B8CFF', ink: ['#111111', '#C8FF4D', '#FF5A36'], text: '#111111' }
  ];
  // printed faintly into the paint, between the "rub here"s
  var SNIPPETS = [
    'SELECT * FROM my_ships;', 'PRESS START', 'dig. pop. bonk!', 'alpha matter',
    'DC19', 'shoot money', 'be the alpha', 'DEFCOIN', 'TTC surfing', 'hodl the sky'
  ];
  var R = 40, CELL = 24, DONE_AT = 0.62;
  var FONT = '"Bricolage Grotesque", system-ui, sans-serif';

  var area = document.getElementById('area');
  var cv = document.getElementById('cover');
  var pctEl = document.getElementById('pct');
  var doneEl = document.getElementById('done');
  var ctx = cv.getContext('2d');

  var grid, cols, rows, hits, total, last = null, cleared = false;

  function paint() {
    var r = cv.getBoundingClientRect();
    if (!r.width || !r.height) return;
    var W = r.width, H = r.height, dpr = window.devicePixelRatio || 1;
    cv.width = Math.round(W * dpr);
    cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = 'source-over';

    var P = PALETTES[Math.floor(Math.random() * PALETTES.length)], rnd = Math.random;
    ctx.fillStyle = P.bg;
    ctx.fillRect(0, 0, W, H);

    // a painting: two circles, a slab, a stripe
    ctx.fillStyle = P.ink[0];
    ctx.beginPath();
    ctx.arc(W * (0.2 + rnd() * 0.25), H * (0.3 + rnd() * 0.4), H * (0.22 + rnd() * 0.16), 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = P.ink[1];
    ctx.beginPath();
    ctx.arc(W * (0.6 + rnd() * 0.3), H * (0.2 + rnd() * 0.5), H * (0.1 + rnd() * 0.12), 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.translate(W * (0.45 + rnd() * 0.2), H * (0.55 + rnd() * 0.2));
    ctx.rotate((rnd() - 0.5) * 0.6);
    ctx.fillStyle = P.ink[2];
    ctx.fillRect(-W * 0.12, -H * 0.18, W * 0.24, H * 0.36);
    ctx.restore();
    ctx.save();
    ctx.translate(0, H * (0.15 + rnd() * 0.7));
    ctx.rotate((rnd() - 0.5) * 0.25);
    ctx.fillStyle = P.ink[1];
    ctx.fillRect(-20, -9, W + 40, 18);
    ctx.restore();

    // paint grain
    ctx.fillStyle = 'rgba(0,0,0,0.07)';
    for (var g = 0; g < 1600; g++) ctx.fillRect(rnd() * W, rnd() * H, 1.5, 1.5);
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    for (var g2 = 0; g2 < 1200; g2++) ctx.fillRect(rnd() * W, rnd() * H, 1.5, 1.5);

    // lettering
    ctx.textAlign = 'center';
    ctx.fillStyle = P.text;
    ctx.globalAlpha = 0.55;
    ctx.font = '800 14px ' + FONT;
    for (var y = 54, row = 0; y < H; y += 96, row++) {
      for (var x = (row % 2 ? 110 : 30); x < W; x += 220) {
        ctx.fillText(rnd() < 0.22 ? SNIPPETS[Math.floor(rnd() * SNIPPETS.length)] : 'rub here', x, y);
      }
    }
    ctx.globalAlpha = 1;
    var big = Math.round(Math.min(W / 6, 170));
    ctx.font = '800 ' + big + 'px ' + FONT;
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(6, big * 0.07);
    ctx.strokeStyle = P.bg;
    ctx.strokeText('scratch.', W / 2, H / 2 + big * 0.33);
    ctx.fillText('scratch.', W / 2, H / 2 + big * 0.33);

    // coverage grid, used to work out how much has been scratched off
    cols = Math.ceil(W / CELL);
    rows = Math.ceil(H / CELL);
    grid = new Uint8Array(cols * rows);
    hits = 0;
    total = cols * rows;
    last = null;
    setCleared(false);
    pctEl.textContent = '0';
  }

  function setCleared(on) {
    cleared = on;
    cv.classList.toggle('gone', on);
    doneEl.hidden = !on;
  }

  function mark(x, y) {
    var c0 = Math.max(0, Math.floor((x - R) / CELL)), c1 = Math.min(cols - 1, Math.floor((x + R) / CELL));
    var r0 = Math.max(0, Math.floor((y - R) / CELL)), r1 = Math.min(rows - 1, Math.floor((y + R) / CELL));
    for (var cy = r0; cy <= r1; cy++) {
      for (var cx = c0; cx <= c1; cx++) {
        var mx = (cx + 0.5) * CELL - x, my = (cy + 0.5) * CELL - y, i = cy * cols + cx;
        if (mx * mx + my * my <= R * R && !grid[i]) { grid[i] = 1; hits++; }
      }
    }
  }

  // one rough dab: a solid core plus a ragged ring of chips
  function dab(x, y) {
    ctx.beginPath();
    ctx.arc(x, y, R * 0.78, 0, Math.PI * 2);
    ctx.fill();
    for (var k = 0; k < 7; k++) {
      var a = Math.random() * Math.PI * 2, d = R * (0.6 + Math.random() * 0.5);
      ctx.beginPath();
      ctx.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, 2 + Math.random() * 8, 0, Math.PI * 2);
      ctx.fill();
    }
    mark(x, y);
  }

  function scratchTo(x, y) {
    if (!grid || cleared) return;
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = '#000';
    var from = last || { x: x, y: y };
    var dist = Math.hypot(x - from.x, y - from.y), steps = Math.max(1, Math.ceil(dist / 7));
    for (var s = 1; s <= steps; s++) dab(from.x + (x - from.x) * s / steps, from.y + (y - from.y) * s / steps);
    last = { x: x, y: y };
    var p = hits / total;
    if (p >= DONE_AT) { pctEl.textContent = '100'; doneEl.textContent = 'That’s everything. The hippo says hi.'; setCleared(true); }
    else pctEl.textContent = String(Math.round(p * 100));
  }

  function at(e) {
    var r = cv.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  area.addEventListener('pointermove', function (e) {
    if (e.pointerType === 'mouse' || e.buttons) { var p = at(e); scratchTo(p.x, p.y); }
  });
  area.addEventListener('pointerdown', function (e) { last = null; var p = at(e); scratchTo(p.x, p.y); });
  ['pointerleave', 'pointerup', 'pointercancel'].forEach(function (t) {
    area.addEventListener(t, function () { last = null; });
  });

  // captions: hovering or tabbing to a name says a line about it.
  // keyboard: tabbing to a name also scratches its spot clear.
  var caption = document.getElementById('caption');
  var DEFAULT_CAPTION = caption.textContent;
  area.querySelectorAll('.words [data-note]').forEach(function (a) {
    function say() { caption.textContent = a.textContent.trim() + ' — ' + a.dataset.note; }
    a.addEventListener('mouseenter', say);
    a.addEventListener('focus', function () {
      say();
      var b = a.getBoundingClientRect(), c = cv.getBoundingClientRect();
      var x0 = b.left - c.left, y0 = b.top + b.height / 2 - c.top;
      last = null;
      for (var x = x0; x <= x0 + b.width; x += 18) scratchTo(x, y0);
      last = null;
    });
  });
  area.querySelector('.words').addEventListener('mouseleave', function () { caption.textContent = DEFAULT_CAPTION; });

  // for Schemaverse players: type DELETE FROM paint; anywhere
  var typed = '';
  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey || e.key.length !== 1) return;
    typed = (typed + e.key.toLowerCase()).slice(-24);
    if (/delete from paint;?$/.test(typed) && !cleared) {
      typed = '';
      pctEl.textContent = '100';
      doneEl.textContent = 'DELETE 1';
      setCleared(true);
    }
  });

  document.getElementById('repaint').addEventListener('click', paint);

  var w0 = 0, h0 = 0;
  if ('ResizeObserver' in window) {
    new ResizeObserver(function (en) {
      var w = Math.round(en[0].contentRect.width), h = Math.round(en[0].contentRect.height);
      if (Math.abs(w - w0) > 40 || Math.abs(h - h0) > 40) { w0 = w; h0 = h; paint(); }
    }).observe(area);
  } else {
    window.addEventListener('resize', paint);
  }

  paint();
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { if (hits === 0) paint(); });
  }
})();
