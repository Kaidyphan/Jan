/* =========================================================
   Pixel sprites, tiles and backdrop — shared by the site and the game.
   All art is defined as strings: one character = one pixel.
   ========================================================= */
(function () {
  'use strict';

  // Palette (single-letter keys used in the sprite strings below)
  const PAL = {
    k: '#1a1c2c', // outline / dark
    r: '#e43b44', // red
    R: '#a22633', // dark red
    w: '#f7c99b', // skin
    b: '#3b5dc9', // blue
    B: '#29366f', // dark blue
    y: '#ffcd75', // yellow
    Y: '#ef7d57', // orange
    g: '#38b764', // green
    G: '#257179', // teal
    l: '#ffffff', // white / highlight
    o: '#8f563b', // brown
    O: '#5d3a28', // dark brown
    s: '#94b0c2', // light grey
    S: '#566c86', // grey
    p: '#b13e53', // berry
    v: '#5d275d', // purple
    c: '#73eff7', // cyan
  };

  // ---------- Hero ("Pip") 12x16, facing right ----------
  const HEAD = [
    '...RRRRR....',
    '..Rrrrrrr...',
    '..rrrrrrrrr.',
    '..kkwwwww...',
    '.kkwwwkwk...',
    '.kwwwwwwww..',
    '..kwwwwww...',
  ];
  const BODY = [
    '...bbbbb....',
    '..bbybbbb...',
    '.wbbbbbbbw..',
    '.wbbbbbbbw..',
  ];
  const HERO = {
    idle: HEAD.concat(BODY, [
      '..BBBBBBB...',
      '..BB...BB...',
      '..BB...BB...',
      '.OOO...OOO..',
      '.OOO...OOO..',
    ]),
    walk1: HEAD.concat(BODY, [
      '..BBBBBBB...',
      '.BBB...BB...',
      '.BB.....BB..',
      'OOO.....BB..',
      'OOO.....OOO.',
    ]),
    walk2: HEAD.concat(BODY, [
      '..BBBBBBB...',
      '...BB.BB....',
      '...BB.BB....',
      '...OOOBB....',
      '...OOOOOO...',
    ]),
    jump: HEAD.concat([
      'w..bbbbb..w.',
      'wbbbybbbbbw.',
      '..bbbbbbb...',
      '..bbbbbbb...',
      '..BBBBBBB...',
      '.BBB...BBB..',
      'OOO.....OOO.',
      'OO.......OO.',
      '............',
    ]),
    hurt: [
      '...RRRRR....',
      '..Rrrrrrr...',
      '..rrrrrrrrr.',
      '..kkwwwww...',
      '.kkwkwkwk...',
      '.kwwwkwwww..',
      '..kwkwkww...',
      'w..bbbbb..w.',
      'wbbbybbbbbw.',
      '..bbbbbbb...',
      '..bbbbbbb...',
      '..BBBBBBB...',
      '..BB...BB...',
      '..BB...BB...',
      '.OOO...OOO..',
      '.OOO...OOO..',
    ],
  };

  // ---------- Slime enemy 14x11 ----------
  const SLIME1 = [
    '....kkkkkk....',
    '..kkggggggkk..',
    '.kggllggggggk.',
    '.kglggggggggk.',
    'kggggkggggkggk',
    'kggggkggggkggk',
    'kggggggggggggk',
    'kgggGGGGGGgggk',
    'kggggggggggggk',
    '.kGGGGGGGGGGk.',
    '..kkkkkkkkkk..',
  ];
  const SLIME2 = ['..............'].concat(SLIME1.slice(0, 2), SLIME1.slice(3));
  const SLIME_DEAD = [
    '..............',
    '..............',
    '..............',
    '..............',
    '..............',
    '..............',
    '..............',
    '..kkkkkkkkkk..',
    '.kggkggggkggk.',
    'kggggggggggggk',
    'kkkkkkkkkkkkkk',
  ];

  // ---------- Bat enemy 14x9 (character card) ----------
  const BAT = [
    'k............k',
    'kk...kkkk...kk',
    'kvk.kvvvvk.kvk',
    'kvvkvlvvlvkvvk',
    'kvvvvkvvkvvvvk',
    '.kvvvvvvvvvvk.',
    '..kk.kvvk.kk..',
    '......kk......',
    '..............',
  ];

  // ---------- Coin 8x9 (4 frame spin) ----------
  const COIN = [
    [
      '..kkkk..',
      '.kyyyyk.',
      'kyylyyYk',
      'kylyyyYk',
      'kylyyyYk',
      'kylyyyYk',
      'kyyyyyYk',
      '.kYYYYk.',
      '..kkkk..',
    ],
    [
      '...kk...',
      '..kyyk..',
      '..kylk..',
      '..kylk..',
      '..kylk..',
      '..kylk..',
      '..kyYk..',
      '..kYYk..',
      '...kk...',
    ],
    [
      '...kk...',
      '...kk...',
      '...kk...',
      '...kk...',
      '...kk...',
      '...kk...',
      '...kk...',
      '...kk...',
      '...kk...',
    ],
  ];

  const HEART = [
    '.kk.kk.',
    'krrkrrk',
    'krlrrrk',
    'krrrrrk',
    '.krrrk.',
    '..krk..',
    '...k...',
  ];

  const GEM = [
    '..kkkk..',
    '.kcclck.',
    'kcclccck',
    'kcccccGk',
    '.kccGGk.',
    '..kcGk..',
    '...kk...',
  ];

  const FLAG = [
    'rrrrrrrr..',
    'rrlrrrrrrr',
    'rllrrrrrrr',
    'rrlrrrrrr.',
    'rrrrrrr...',
  ];

  // ---------- Builders ----------
  function makeCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
  }

  function build(rows, flip) {
    const h = rows.length;
    const w = rows[0].length;
    const c = makeCanvas(w, h);
    const ctx = c.getContext('2d');
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const ch = rows[y][x];
        if (ch === '.' || !PAL[ch]) continue;
        ctx.fillStyle = PAL[ch];
        ctx.fillRect(flip ? w - 1 - x : x, y, 1, 1);
      }
    }
    return c;
  }

  function pair(rows) {
    return { r: build(rows, false), l: build(rows, true) };
  }

  // Deterministic pseudo random for tile speckles
  function rand(seed) {
    const x = Math.sin(seed * 9301 + 49297) * 233280;
    return x - Math.floor(x);
  }

  function tile(drawFn) {
    const c = makeCanvas(16, 16);
    const ctx = c.getContext('2d');
    drawFn(ctx);
    return c;
  }

  function px(ctx, color, x, y, w, h) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w || 1, h || 1);
  }

  const TILES = {
    dirt: tile(function (ctx) {
      px(ctx, PAL.o, 0, 0, 16, 16);
      for (let i = 0; i < 14; i++) {
        px(ctx, PAL.O, Math.floor(rand(i) * 15), Math.floor(rand(i + 50) * 15), 2, 1);
      }
    }),
    grass: tile(function (ctx) {
      px(ctx, PAL.o, 0, 0, 16, 16);
      for (let i = 0; i < 10; i++) {
        px(ctx, PAL.O, Math.floor(rand(i + 7) * 15), 6 + Math.floor(rand(i + 80) * 9), 2, 1);
      }
      px(ctx, PAL.g, 0, 0, 16, 4);
      for (let x = 0; x < 16; x++) {
        if (rand(x + 3) > 0.45) px(ctx, PAL.g, x, 4, 1, 1 + (rand(x + 11) > 0.6 ? 1 : 0));
      }
      px(ctx, '#a7f070', 0, 0, 16, 1);
      px(ctx, '#a7f070', 3, 1, 2, 1);
      px(ctx, '#a7f070', 10, 1, 3, 1);
    }),
    brick: tile(function (ctx) {
      px(ctx, PAL.Y, 0, 0, 16, 16);
      px(ctx, PAL.R, 0, 7, 16, 1);
      px(ctx, PAL.R, 0, 15, 16, 1);
      px(ctx, PAL.R, 7, 0, 1, 7);
      px(ctx, PAL.R, 3, 8, 1, 7);
      px(ctx, PAL.R, 11, 8, 1, 7);
      px(ctx, PAL.y, 0, 0, 7, 1);
      px(ctx, PAL.y, 8, 0, 8, 1);
      px(ctx, PAL.y, 4, 8, 7, 1);
    }),
    stone: tile(function (ctx) {
      px(ctx, PAL.s, 0, 0, 16, 16);
      px(ctx, PAL.S, 0, 14, 16, 2);
      px(ctx, PAL.S, 14, 0, 2, 16);
      px(ctx, PAL.l, 0, 0, 15, 1);
      px(ctx, PAL.l, 0, 0, 1, 15);
      px(ctx, PAL.S, 5, 5, 2, 2);
      px(ctx, PAL.S, 9, 9, 2, 2);
    }),
    spike: tile(function (ctx) {
      for (let s = 0; s < 2; s++) {
        const ox = s * 8;
        for (let y = 0; y < 8; y++) {
          const half = Math.floor(y / 2);
          px(ctx, PAL.S, ox + 4 - half - 1, 8 + y, half * 2 + 2, 1);
          px(ctx, PAL.s, ox + 4 - half - 1, 8 + y, 1, 1);
        }
      }
    }),
  };

  // ---------- Backdrop (parallax sky, mountains, clouds, hills) ----------
  function drawBackdrop(ctx, camX, W, H, t) {
    // Sky bands
    const bands = ['#3b5dc9', '#41a6f6', '#41a6f6', '#73eff7'];
    const bh = Math.ceil(H / bands.length);
    for (let i = 0; i < bands.length; i++) {
      ctx.fillStyle = bands[i];
      ctx.fillRect(0, i * bh, W, bh);
    }
    // Sun
    ctx.fillStyle = '#ffcd75';
    ctx.fillRect(W - 60, 18, 20, 20);
    ctx.fillRect(W - 62, 22, 24, 12);
    ctx.fillRect(W - 56, 16, 12, 24);

    // Clouds
    const cloudSpan = 480;
    for (let i = 0; i < 5; i++) {
      let cx = i * 110 + 20 - camX * 0.15 - t * 0.08;
      cx = ((cx % cloudSpan) + cloudSpan) % cloudSpan - 60;
      const cy = 12 + ((i * 37) % 40);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(cx, cy + 4, 40, 8);
      ctx.fillRect(cx + 8, cy, 18, 6);
      ctx.fillRect(cx + 22, cy + 2, 10, 4);
      ctx.fillStyle = '#c7e9ff';
      ctx.fillRect(cx + 2, cy + 10, 36, 2);
    }

    // Far mountains
    ctx.fillStyle = '#566c86';
    for (let x = 0; x < W; x += 4) {
      const wx = x + camX * 0.2;
      let h = 46 + 18 * Math.sin(wx * 0.018) + 10 * Math.sin(wx * 0.047 + 1);
      h = Math.round(h / 4) * 4;
      ctx.fillRect(x, H - h - 20, 4, h + 20);
    }
    // Snow caps
    ctx.fillStyle = '#f4f4f4';
    for (let x = 0; x < W; x += 4) {
      const wx = x + camX * 0.2;
      let h = 46 + 18 * Math.sin(wx * 0.018) + 10 * Math.sin(wx * 0.047 + 1);
      h = Math.round(h / 4) * 4;
      if (h > 62) ctx.fillRect(x, H - h - 20, 4, 4);
    }
    // Near hills
    for (let x = 0; x < W; x += 4) {
      const wx = x + camX * 0.5;
      let h = 26 + 10 * Math.sin(wx * 0.03) + 6 * Math.sin(wx * 0.07 + 2);
      h = Math.round(h / 4) * 4;
      ctx.fillStyle = '#257179';
      ctx.fillRect(x, H - h, 4, h);
      ctx.fillStyle = '#38b764';
      ctx.fillRect(x, H - h, 4, 4);
    }
  }

  window.PixelSprites = {
    PAL: PAL,
    build: build,
    hero: {
      idle: pair(HERO.idle),
      walk1: pair(HERO.walk1),
      walk2: pair(HERO.walk2),
      jump: pair(HERO.jump),
      hurt: pair(HERO.hurt),
    },
    slime: [pair(SLIME1), pair(SLIME2)],
    slimeDead: pair(SLIME_DEAD),
    bat: pair(BAT),
    coin: COIN.map(function (f) { return build(f); }),
    heart: build(HEART),
    gem: build(GEM),
    flag: build(FLAG),
    tiles: TILES,
    drawBackdrop: drawBackdrop,
  };
})();
