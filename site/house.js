// Abstrct's house: a 12x10 tile room, 16px art drawn at 3x. Sprites are pixel maps turned into box-shadows.
(() => {
  const COLS = 12, ROWS = 10, TILE = 48, PX = 3, STEP = 175;
  const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  const KEYS = { ArrowUp: 'up', w: 'up', W: 'up', ArrowDown: 'down', s: 'down', S: 'down', ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right' };
  const BLOCKED = new Set(['0,2', '1,2', '4,2', '5,2', '7,2', '8,2', '9,2', '10,2', '11,2', '5,5', '6,5', '1,6', '10,6', '0,9', '11,9']);
  const WARPS = { door: true, stairs: true };
  const SPOTS = {
    '0,1': 'shelf', '1,1': 'shelf', '0,2': 'shelf', '1,2': 'shelf',
    '2,1': 'window', '3,1': 'window',
    '4,1': 'pc', '5,1': 'pc', '4,2': 'pc', '5,2': 'pc',
    '6,1': 'poster',
    '7,1': 'hats', '7,2': 'hats',
    '8,1': 'tv', '9,1': 'tv', '8,2': 'tv', '9,2': 'tv',
    '10,2': 'stairs', '11,2': 'stairs',
    '5,5': 'decks', '6,5': 'decks',
    '1,6': 'bed', '10,6': 'jar',
    '0,9': 'plant', '11,9': 'plant',
    '5,10': 'door', '6,10': 'door'
  };
  const THINGS = {
    intro: { pages: ["Welcome to ABSTRCT's house!", 'Walk with the arrow keys or WASD. Press Z or ENTER to look at things.', 'PACO will follow you everywhere. PACO always does.'] },
    shelf: { pages: ["It's crammed with standards.", 'The CryptoCurrency Security Standard is in here. JOSH helped write it.', 'Read up on the CCSS?'], links: [{ label: 'CCSS', url: 'https://cryptoconsortium.org' }] },
    window: { pages: ["It's a nice day outside.", 'Somewhere out there a conference is under way, and JOSH is building a tool for it.', 'Tools built that way:'], links: [{ label: 'Tokens.fyi', url: 'https://tokens.fyi' }, { label: 'Key Ceremony Guide', url: 'https://ceremony.guide' }] },
    pc: { pages: ['JOSH booted up the PC.', "A PostgreSQL prompt is open. There's a whole space game running inside the database.", "It's SCHEMAVERSE! DEF CON 19, 2011. People tried to break into it. That was the point.", 'Visit SCHEMAVERSE?'], links: [{ label: 'Schemaverse', url: 'https://schemaverse.com' }] },
    poster: { pages: ["It's a poster for STRUCTS.", 'A game that is an entire blockchain.', 'Go play STRUCTS?'], links: [{ label: 'Structs', url: 'https://playstructs.com' }] },
    hats: { pages: ['A rack of hats. Every one of them is STRUCTS.', 'A toy box, a sky full of dragons, a Dreamcast game and some fur beasts.', 'Try one on?'], links: [{ label: 'pippop', url: 'https://pippop.pet' }, { label: 'wyrmhodl', url: 'https://wyrmhodl.com' }, { label: 'structs.xyz', url: 'https://structs.xyz' }, { label: 'Furrency', url: 'https://furrency.com' }] },
    tv: { pages: ["It's a SUPER NINTENDO!", 'TORONTO GAMES is in the cartridge slot.', "There's a STRUCTS cartridge next to it. It's still in progress.", 'Check out TORONTO GAMES?'], links: [{ label: 'Toronto Games', url: 'https://toronto.ad' }] },
    stairs: { pages: ['The stairs go up to... nowhere, yet.'] },
    decks: { pages: ['Turntables! JOSH also DJs.', 'Listen on SOUNDCLOUD?'], links: [{ label: 'SoundCloud', url: 'https://soundcloud.com/abstrct' }] },
    bed: { pages: ["It's PACO's bed.", "It's covered in fur. Mostly PACO's."] },
    jar: { pages: ['A jar full of coins.', 'The label says COINDROIDS. A game inside a cryptocurrency. DEF CON 22 through 28.'] },
    plant: { pages: ["It's a houseplant.", 'It is thriving. Nobody knows why.'] },
    door: { pages: ['Heading out?'], links: [{ label: 'slow.ninja', url: 'https://slow.ninja' }, { label: 'GitHub', url: 'https://github.com/abstrct' }, { label: 'X', url: 'https://x.com/abstr_ct' }] },
    paco: { pages: ['PACO is happy to see you!', "PACO's tail is going a mile a minute."] }
  };

  // Sprites
  const mirror = (half) => half.map((h) => h + h.split('').reverse().join(''));
  const flip = (rows) => rows.map((r) => r.split('').reverse().join(''));
  const bob = (rows) => rows.slice(1).concat(['................']);
  function shadow(rows, pal) {
    const out = [];
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const c = pal[row[x]];
        if (c) out.push(((x + 1) * PX) + 'px ' + ((y + 1) * PX) + 'px 0 0 ' + c);
      }
    });
    return out.join(', ');
  }

  const HEAD = ['....kkkk', '...kcccc', '..kccccc', '..kccccc', '.kCCCCCC'];
  const ME_DOWN = mirror(HEAD.concat(['.khhssss', '.khsesss', '.khsesss', '..kSssss', '..kjjjjw', '.kjjjjjw', '.kSjjjjw', '..kppppp', '..kpppk.', '..kbbbk.', '...kkk..']));
  const ME_UP = mirror(HEAD.concat(['.khhhhhh', '.khhhhhh', '.khhhhhh', '..khhhhh', '..kjjjjj', '.kjjjjjj', '.kSjjjjj', '..kppppp', '..kpppk.', '..kbbbk.', '...kkk..']));
  const LIFT = ['..kbbbk..kpppk..', '...kkk...kbbbk..', '.........kkk....'];
  const stride = (rows) => { const a = rows.slice(0, 13).concat(LIFT); return [rows, a, flip(a)]; };
  const ME_LEFT = ['.....kkkkk......', '....kccccck.....', '...kccccccck....', '...kccccccck....', '.kCCCCCcccck....', '..kssshhhhhk....', '..kseshhhhhk....', '..ksesshhhhk....', '...kssshhhk.....', '....kjjjjjk.....', '...kjjjjjjjk....', '...kjjSjjjjk....', '....kpppppk.....', '....kpppppk.....', '....kbbkbbk.....', '.....kk.kk......'];
  const ME_LEFT_WALK = ME_LEFT.slice(0, 12).concat(['....kpppppk.....', '...kpppkpppk....', '..kbbk...kbbk...', '...kk.....kk....']);
  const ME_PAL = { k: '#2a2333', e: '#2a2333', c: '#2f8f9d', C: '#1f6470', h: '#3b2a22', s: '#f6c9a0', S: '#d79a72', w: '#f4f4ee', j: '#e8663d', J: '#b04628', p: '#3d4b7a', P: '#2b3558', b: '#4a3428' };

  const DOG_DOWN = mirror(['........', '........', '..kk....', '.kFfk...', '.kFffkkk', '.kffffff', '..kfffff', '..kfefff', '..kffwww', '...kfwwk', '...kffww', '..kfffww', '..kfffff', '..kFffff', '..kwkFff', '...kkkkk']);
  const DOG_UP = mirror(['........', '........', '..kk....', '.kFfk...', '.kFffkkk', '.kffffff', '..kfffff', '..kfffff', '..kFffff', '...kFfff', '...kffff', '..kfffff', '..kfffff', '..kFfffF', '..kfkfff', '...kkkkk']);
  const DOG_LEFT = ['................', '................', '................', '...kk...........', '..kFfkk.........', '.kfffffk........', '.kfeffffk.......', 'kwwfffffkkkkk.k.', 'knwwfffffffffkFk', '.kkwwffffffffFk.', '...kwwfffffffk..', '...kwffffFFffk..', '...kffkkkkFfk...', '...kfk...kfk....', '...kwk...kwk....', '....k.....k.....'];
  const DOG_LEFT_WALK = DOG_LEFT.slice(0, 13).concat(['..kfk.....kfk...', '.kwk.......kwk..', '..k.........k...']);
  const DOG_PAL = { k: '#2a2333', e: '#2a2333', n: '#2a2333', f: '#c98a4b', F: '#91633a', w: '#f3ece0' };
  const HEART = ['.kk.kk.', 'kwrkrrk', 'krrrrrk', '.krrrk.', '..krk..', '...k...'];

  const SPR = {
    me: {
      down: stride(ME_DOWN).map((r) => shadow(r, ME_PAL)),
      up: stride(ME_UP).map((r) => shadow(r, ME_PAL)),
      left: [ME_LEFT, ME_LEFT_WALK, ME_LEFT_WALK].map((r) => shadow(r, ME_PAL)),
      right: [flip(ME_LEFT), flip(ME_LEFT_WALK), flip(ME_LEFT_WALK)].map((r) => shadow(r, ME_PAL))
    },
    dog: {
      down: [DOG_DOWN, bob(DOG_DOWN)].map((r) => shadow(r, DOG_PAL)),
      up: [DOG_UP, bob(DOG_UP)].map((r) => shadow(r, DOG_PAL)),
      left: [DOG_LEFT, DOG_LEFT_WALK].map((r) => shadow(r, DOG_PAL)),
      right: [flip(DOG_LEFT), flip(DOG_LEFT_WALK)].map((r) => shadow(r, DOG_PAL))
    },
    heart: shadow(HEART, { k: '#2a2333', r: '#e0405a', w: '#fbfbf6' })
  };

  // DOM
  const $ = (id) => document.getElementById(id);
  const screen = $('screen'), stage = $('stage');
  const meEl = $('me'), dogEl = $('dog'), heartEl = $('heart');
  const dialogEl = $('dialog'), textEl = $('dialog-text'), nextEl = $('next'), menuEl = $('menu'), startEl = $('start');
  const CURSOR = '<svg width="12" height="18" viewBox="0 0 4 6" shape-rendering="crispEdges" aria-hidden="true"><path d="M0 0h1v1h1v1h1v1h1v1h-1v1h-1v1h-1v1h-1z" fill="#3a3a44"/></svg>';
  heartEl.firstElementChild.style.boxShadow = SPR.heart;

  function fit() { stage.style.setProperty('--s', screen.clientWidth / 576); }
  new ResizeObserver(fit).observe(screen);
  fit();

  // State
  const s = { started: false, px: 5, py: 7, facing: 'down', dogX: 4, dogY: 7, dogFacing: 'right', step: 0, walking: false, dialog: null };
  let held = null, lastMove = 0, menuKey = '';

  const blocked = (x, y) => x < 0 || y < 0 || x >= COLS || y >= ROWS || y <= 1 || BLOCKED.has(x + ',' + y);
  const pageText = (d) => THINGS[d.id].pages[d.page];
  function items(thing) {
    if (!thing.links) return [];
    if (thing.links.length === 1) return [{ label: 'YES', url: thing.links[0].url }, { label: 'NO' }];
    return thing.links.concat([{ label: 'CANCEL' }]);
  }
  function menuUp(d) {
    const thing = THINGS[d.id];
    return !!thing.links && d.page === thing.pages.length - 1 && d.chars >= pageText(d).length;
  }

  function render() {
    const meFrame = s.walking ? (s.step % 2 ? 1 : 2) : 0;
    const dogFrame = s.walking && s.step % 2 ? 1 : 0;
    place(meEl, s.px * TILE, s.py * TILE - 9, s.py * 10 + 2, SPR.me[s.facing][meFrame]);
    place(dogEl, s.dogX * TILE, s.dogY * TILE - 6, s.dogY * 10 + 1, SPR.dog[s.dogFacing][dogFrame]);

    const d = s.dialog;
    heartEl.hidden = !(d && d.id === 'paco');
    if (!heartEl.hidden) { heartEl.style.left = (s.dogX * TILE + 13) + 'px'; heartEl.style.top = (s.dogY * TILE - 28) + 'px'; }
    dialogEl.hidden = !d;
    startEl.hidden = s.started;
    const open = d && menuUp(d);
    menuEl.hidden = !open;
    if (d) {
      const full = pageText(d);
      textEl.textContent = full.slice(0, d.chars);
      nextEl.style.display = d.chars >= full.length && !open ? '' : 'none';
    }
    if (open) drawMenu(d);
  }

  function place(el, left, top, z, box) {
    el.style.left = left + 'px';
    el.style.top = top + 'px';
    el.style.zIndex = z;
    const px = el.lastElementChild;
    if (px.style.boxShadow !== box) px.style.boxShadow = box;
  }

  function drawMenu(d) {
    const list = items(THINGS[d.id]);
    const key = d.id + ':' + d.page;
    if (menuKey !== key) {
      menuKey = key;
      menuEl.replaceChildren(...list.map((it, i) => {
        const el = document.createElement(it.url ? 'a' : 'button');
        el.className = 'opt';
        if (it.url) { el.href = it.url; el.target = '_blank'; el.rel = 'noopener'; el.addEventListener('click', close); }
        else { el.type = 'button'; el.addEventListener('click', () => choose(i)); }
        el.innerHTML = CURSOR;
        const label = document.createElement('span');
        label.textContent = it.label;
        el.append(label);
        return el;
      }));
    }
    [...menuEl.children].forEach((el, i) => el.classList.toggle('on', i === d.cursor));
  }

  // Actions
  function move(dir) {
    if (s.dialog) return;
    const [dx, dy] = DIRS[dir];
    const nx = s.px + dx, ny = s.py + dy;
    lastMove = performance.now();
    if (blocked(nx, ny)) {
      s.facing = dir;
      const id = SPOTS[nx + ',' + ny];
      if (WARPS[id]) open(id); else render();
      return;
    }
    const ddx = s.px - s.dogX, ddy = s.py - s.dogY;
    if (ddx < 0) s.dogFacing = 'left'; else if (ddx > 0) s.dogFacing = 'right'; else if (ddy < 0) s.dogFacing = 'up'; else if (ddy > 0) s.dogFacing = 'down';
    s.dogX = s.px; s.dogY = s.py;
    s.px = nx; s.py = ny; s.facing = dir; s.step++; s.walking = true;
    render();
  }

  function open(id) {
    held = null;
    menuKey = '';
    s.dialog = { id, page: 0, chars: 0, cursor: 0 };
    if (id === 'paco') s.dogFacing = { up: 'down', down: 'up', left: 'right', right: 'left' }[s.facing];
    render();
  }

  function close() { held = null; lastMove = performance.now(); s.dialog = null; render(); }

  function choose(i) {
    const item = items(THINGS[s.dialog.id])[i];
    if (item && item.url) window.open(item.url, '_blank', 'noopener');
    close();
  }

  function nav(dir) {
    const d = s.dialog;
    if (!d || !menuUp(d) || (dir !== 'up' && dir !== 'down')) return;
    const n = items(THINGS[d.id]).length;
    d.cursor = (d.cursor + (dir === 'down' ? 1 : n - 1)) % n;
    render();
  }

  function begin() {
    if (s.started) return;
    s.started = true;
    screen.focus({ preventScroll: true });
    open('intro');
  }

  function pressA() {
    if (!s.started) { begin(); return; }
    const d = s.dialog;
    if (d) {
      const thing = THINGS[d.id];
      if (menuUp(d)) { choose(d.cursor); return; }
      if (d.chars < pageText(d).length) d.chars = pageText(d).length;
      else if (d.page < thing.pages.length - 1) { d.page++; d.chars = 0; }
      else { close(); return; }
      render();
      return;
    }
    const [dx, dy] = DIRS[s.facing];
    const tx = s.px + dx, ty = s.py + dy;
    if (tx === s.dogX && ty === s.dogY) { open('paco'); return; }
    const id = SPOTS[tx + ',' + ty];
    if (id) open(id);
  }

  function pressB() {
    const d = s.dialog;
    if (!d) return;
    if (menuUp(d)) close(); else pressA();
  }

  function push(dir, repeat) {
    if (!s.started) return;
    if (s.dialog) { if (!repeat) nav(dir); return; }
    if (held === dir) return;
    held = dir;
    if (performance.now() - lastMove >= STEP) move(dir);
  }

  setInterval(() => {
    const now = performance.now();
    if (s.dialog) {
      if (s.dialog.chars < pageText(s.dialog).length) { s.dialog.chars += 2; render(); }
      return;
    }
    if (held && now - lastMove >= STEP) { move(held); return; }
    if (s.walking && now - lastMove >= STEP - 25) { s.walking = false; render(); }
  }, 30);

  // Input
  window.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const onControl = e.target.closest && e.target.closest('a, button');
    const dir = KEYS[e.key];
    if (dir) { e.preventDefault(); push(dir, e.repeat); return; }
    if (onControl) return;
    if (e.key === 'z' || e.key === 'Z' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (!e.repeat) pressA(); return; }
    if (e.key === 'x' || e.key === 'X' || e.key === 'Escape' || e.key === 'Backspace') { e.preventDefault(); if (!e.repeat) pressB(); }
  });
  window.addEventListener('keyup', (e) => { if (KEYS[e.key] && held === KEYS[e.key]) held = null; });
  window.addEventListener('blur', () => { held = null; });

  startEl.addEventListener('click', begin);
  $('btn-a').addEventListener('click', pressA);
  $('btn-b').addEventListener('click', pressB);
  document.querySelectorAll('.pad').forEach((pad) => {
    const dir = pad.dataset.dir;
    const release = () => { pad.classList.remove('held'); if (held === dir) held = null; };
    pad.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      pad.setPointerCapture(e.pointerId);
      pad.classList.add('held');
      if (!s.started) { begin(); return; }
      push(dir);
    });
    pad.addEventListener('pointerup', release);
    pad.addEventListener('pointercancel', release);
    pad.addEventListener('lostpointercapture', release);
    pad.addEventListener('click', (e) => { if (e.detail === 0) { held = null; push(dir); held = null; } });
  });

  render();
  requestAnimationFrame(() => requestAnimationFrame(() => stage.classList.add('live')));
})();
