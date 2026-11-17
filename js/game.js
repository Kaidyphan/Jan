/* =========================================================
   PIXEL QUEST — playable demo level
   Tiny canvas platformer: run, jump, stomp slimes, grab coins,
   reach the flag. No dependencies.
   ========================================================= */
(function () {
  'use strict';

  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const S = window.PixelSprites;

  const TILE = 16;
  const VW = canvas.width;   // 320
  const VH = canvas.height;  // 176
  const FONT = '8px "Press Start 2P", monospace';

  // ---------- Storage helpers (may be unavailable) ----------
  function loadBest() {
    try { return parseInt(localStorage.getItem('pq-best') || '0', 10) || 0; } catch (e) { return 0; }
  }
  function saveBest(v) {
    try { localStorage.setItem('pq-best', String(v)); } catch (e) { /* ignore */ }
  }

  // ---------- Sound (tiny WebAudio blips) ----------
  let audioCtx = null;
  let muted = false;
  function beep(freq, dur, type, slide) {
    if (muted) return;
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = type || 'square';
      o.frequency.setValueAtTime(freq, audioCtx.currentTime);
      if (slide) o.frequency.exponentialRampToValueAtTime(slide, audioCtx.currentTime + dur);
      g.gain.setValueAtTime(0.06, audioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur);
      o.connect(g).connect(audioCtx.destination);
      o.start();
      o.stop(audioCtx.currentTime + dur);
    } catch (e) { /* audio unavailable */ }
  }
  const sfx = {
    jump: function () { beep(320, 0.15, 'square', 640); },
    coin: function () { beep(988, 0.06); setTimeout(function () { beep(1319, 0.12); }, 60); },
    stomp: function () { beep(200, 0.12, 'triangle', 80); },
    hurt: function () { beep(400, 0.4, 'sawtooth', 60); },
    win: function () {
      [523, 659, 784, 1047].forEach(function (f, i) {
        setTimeout(function () { beep(f, 0.18); }, i * 120);
      });
    },
  };

  // ---------- Level ----------
  const LW = 124; // level width in tiles
  const LH = 11;  // level height in tiles

  function buildLevel() {
    const g = [];
    for (let y = 0; y < LH; y++) g.push(new Array(LW).fill(' '));
    const put = function (x, y, ch) { if (x >= 0 && x < LW && y >= 0 && y < LH) g[y][x] = ch; };
    const ground = function (a, b) { for (let x = a; x <= b; x++) { put(x, 9, '#'); put(x, 10, '#'); } };
    const plat = function (x, y, n, ch) { for (let i = 0; i < n; i++) put(x + i, y, ch || 'B'); };
    const coins = function (x, y, n, step) { for (let i = 0; i < n; i++) put(x + i * (step || 1), y, 'o'); };

    ground(0, 27); ground(31, 46); ground(50, 77); ground(81, 100); ground(104, LW - 1);

    plat(10, 6, 4); coins(10, 5, 4);
    put(16, 8, 'e');
    put(20, 8, 'S'); put(21, 8, 'S'); put(21, 7, 'S'); put(22, 8, 'S'); put(22, 7, 'S'); put(22, 6, 'S');
    coins(28, 6, 3);
    plat(34, 6, 5); plat(38, 3, 4); coins(38, 2, 4);
    put(41, 8, 'e'); put(45, 8, 'e');
    coins(47, 6, 3);
    put(54, 8, '^'); put(55, 8, '^');
    coins(53, 5, 4);
    put(59, 8, 'S'); put(60, 8, 'S'); put(60, 7, 'S'); put(61, 8, 'S'); put(61, 7, 'S'); put(61, 6, 'S');
    coins(63, 4, 3);
    plat(64, 6, 4); put(66, 5, 'e');
    put(72, 8, 'e');
    coins(78, 6, 3);
    plat(84, 6, 3); plat(88, 4, 3); coins(88, 3, 3);
    put(92, 8, '^'); put(93, 8, '^'); put(94, 8, '^');
    coins(92, 5, 3);
    put(97, 8, 'e');
    plat(101, 6, 3, 'S'); coins(101, 5, 3);
    put(108, 8, 'e');
    put(111, 8, 'S'); put(112, 8, 'S'); put(112, 7, 'S'); put(113, 8, 'S'); put(113, 7, 'S'); put(113, 6, 'S');
    put(118, 8, 'F');
    put(2, 8, 'P');
    return g;
  }

  // ---------- Game state ----------
  let timeBonus = 0;
  let grid, player, enemies, coins, particles, flag, camX, state, score, coinCount, lives, timer, frame, best, stateTimer;
  const start = { x: 0, y: 0 };

  function isSolidCh(ch) { return ch === '#' || ch === 'B' || ch === 'S'; }
  function solid(tx, ty) {
    if (tx < 0 || tx >= LW) return true;
    if (ty < 0 || ty >= LH) return false;
    return isSolidCh(grid[ty][tx]);
  }

  function resetLevel(full) {
    grid = buildLevel();
    enemies = [];
    coins = [];
    particles = [];
    for (let y = 0; y < LH; y++) {
      for (let x = 0; x < LW; x++) {
        const ch = grid[y][x];
        if (ch === 'P') { start.x = x * TILE + 2; start.y = y * TILE + 2; grid[y][x] = ' '; }
        else if (ch === 'e') { enemies.push({ x: x * TILE + 1, y: y * TILE + 5, w: 14, h: 11, vx: -0.45, vy: 0, dead: 0, alive: true }); grid[y][x] = ' '; }
        else if (ch === 'o') { coins.push({ x: x * TILE + 4, y: y * TILE + 3, w: 8, h: 9, taken: false }); grid[y][x] = ' '; }
        else if (ch === 'F') { flag = { x: x * TILE, y: y * TILE }; grid[y][x] = ' '; }
      }
    }
    if (full) { score = 0; coinCount = 0; lives = 3; }
    timer = 0;
    spawnPlayer();
  }

  function spawnPlayer() {
    player = { x: start.x, y: start.y, w: 10, h: 14, vx: 0, vy: 0, onGround: false, facing: 'r', coyote: 0, jumpBuf: 0, anim: 0, invuln: 60 };
    camX = 0;
  }

  // ---------- Physics ----------
  function moveX(e) {
    e.x += e.vx;
    e.hitWall = false;
    const y0 = Math.floor(e.y / TILE), y1 = Math.floor((e.y + e.h - 0.01) / TILE);
    if (e.vx > 0) {
      const tx = Math.floor((e.x + e.w - 0.01) / TILE);
      for (let ty = y0; ty <= y1; ty++) if (solid(tx, ty)) { e.x = tx * TILE - e.w; e.hitWall = true; break; }
    } else if (e.vx < 0) {
      const tx = Math.floor(e.x / TILE);
      for (let ty = y0; ty <= y1; ty++) if (solid(tx, ty)) { e.x = (tx + 1) * TILE; e.hitWall = true; break; }
    }
  }
  function moveY(e) {
    e.y += e.vy;
    e.onGround = false;
    const x0 = Math.floor(e.x / TILE), x1 = Math.floor((e.x + e.w - 0.01) / TILE);
    if (e.vy > 0) {
      const ty = Math.floor((e.y + e.h - 0.01) / TILE);
      for (let tx = x0; tx <= x1; tx++) if (solid(tx, ty)) { e.y = ty * TILE - e.h; e.vy = 0; e.onGround = true; break; }
    } else if (e.vy < 0) {
      const ty = Math.floor(e.y / TILE);
      for (let tx = x0; tx <= x1; tx++) if (solid(tx, ty)) { e.y = (ty + 1) * TILE; e.vy = 0; break; }
    }
  }
  function overlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  // ---------- Input ----------
  const keys = { left: false, right: false, jump: false };
  let jumpPressed = false;
  const KEYMAP = {
    ArrowLeft: 'left', KeyA: 'left',
    ArrowRight: 'right', KeyD: 'right',
    ArrowUp: 'jump', KeyW: 'jump', Space: 'jump', KeyZ: 'jump', KeyK: 'jump',
  };

  canvas.addEventListener('keydown', function (e) {
    const k = KEYMAP[e.code];
    if (k) {
      e.preventDefault();
      if (k === 'jump' && !keys.jump) jumpPressed = true;
      keys[k] = true;
    }
    if (e.code === 'Enter' || (e.code === 'Space' && state !== 'play')) { e.preventDefault(); confirmAction(); }
    if (e.code === 'KeyP' || e.code === 'Escape') togglePause();
    if (e.code === 'KeyM') toggleMute();
  });
  canvas.addEventListener('keyup', function (e) {
    const k = KEYMAP[e.code];
    if (k) { e.preventDefault(); keys[k] = false; }
  });
  canvas.addEventListener('blur', function () {
    keys.left = keys.right = keys.jump = false;
    if (state === 'play') state = 'paused';
  });
  canvas.addEventListener('pointerdown', function () {
    canvas.focus();
    if (state !== 'play') confirmAction();
  });

  // Touch buttons
  document.querySelectorAll('[data-btn]').forEach(function (btn) {
    const k = btn.getAttribute('data-btn');
    const down = function (e) {
      e.preventDefault();
      canvas.focus({ preventScroll: true });
      if (state !== 'play') { confirmAction(); return; }
      if (k === 'jump' && !keys.jump) jumpPressed = true;
      keys[k] = true;
      btn.classList.add('is-down');
    };
    const up = function (e) {
      e.preventDefault();
      keys[k] = false;
      btn.classList.remove('is-down');
    };
    btn.addEventListener('pointerdown', down);
    btn.addEventListener('pointerup', up);
    btn.addEventListener('pointerleave', up);
    btn.addEventListener('pointercancel', up);
    btn.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  });

  const startBtn = document.getElementById('start-btn');
  if (startBtn) startBtn.addEventListener('click', function () { canvas.focus(); confirmAction(); });
  const muteBtn = document.getElementById('mute-btn');
  if (muteBtn) muteBtn.addEventListener('click', toggleMute);

  function toggleMute() {
    muted = !muted;
    if (muteBtn) {
      muteBtn.textContent = muted ? 'Sound: Off' : 'Sound: On';
      muteBtn.setAttribute('aria-pressed', String(muted));
    }
  }
  function togglePause() {
    if (state === 'play') state = 'paused';
    else if (state === 'paused') state = 'play';
  }
  function confirmAction() {
    if (state === 'title' || state === 'gameover' || state === 'win') {
      resetLevel(true);
      state = 'play';
      jumpPressed = false;
    } else if (state === 'paused') {
      state = 'play';
    }
  }

  // ---------- Effects ----------
  function burst(x, y, color, n) {
    for (let i = 0; i < n; i++) {
      particles.push({
        x: x, y: y,
        vx: (Math.random() - 0.5) * 3,
        vy: -Math.random() * 3 - 0.5,
        life: 20 + Math.random() * 15,
        color: color,
      });
    }
  }

  function hurtPlayer() {
    if (player.invuln > 0 || state !== 'play') return;
    sfx.hurt();
    lives -= 1;
    state = 'dead';
    stateTimer = 70;
    player.vy = -5;
    player.vx = 0;
  }

  // ---------- Update ----------
  function update() {
    frame++;
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx; p.y += p.vy; p.vy += 0.2; p.life--;
      if (p.life <= 0) particles.splice(i, 1);
    }

    if (state === 'dead') {
      player.vy += 0.3;
      player.y += player.vy;
      if (--stateTimer <= 0) {
        if (lives <= 0) {
          state = 'gameover';
          if (score > best) { best = score; saveBest(best); }
        } else {
          spawnPlayer();
          state = 'play';
        }
      }
      return;
    }
    if (state === 'win') {
      if (stateTimer > 0) stateTimer--;
      return;
    }
    if (state !== 'play') return;

    timer++;
    const p = player;

    // Horizontal movement
    const ACC = 0.28, MAX = 2.1, FRICTION = 0.78;
    if (keys.left && !keys.right) { p.vx -= ACC; p.facing = 'l'; }
    else if (keys.right && !keys.left) { p.vx += ACC; p.facing = 'r'; }
    else { p.vx *= FRICTION; if (Math.abs(p.vx) < 0.05) p.vx = 0; }
    p.vx = Math.max(-MAX, Math.min(MAX, p.vx));

    // Jump with coyote time + jump buffer
    p.coyote = p.onGround ? 6 : Math.max(0, p.coyote - 1);
    p.jumpBuf = jumpPressed ? 6 : Math.max(0, p.jumpBuf - 1);
    jumpPressed = false;
    if (p.jumpBuf > 0 && p.coyote > 0) {
      p.vy = -6.1;
      p.coyote = 0;
      p.jumpBuf = 0;
      sfx.jump();
    }
    if (!keys.jump && p.vy < -2.2) p.vy = -2.2; // variable jump height

    p.vy = Math.min(p.vy + 0.34, 7);
    moveX(p);
    moveY(p);
    if (p.invuln > 0) p.invuln--;
    if (Math.abs(p.vx) > 0.2 && p.onGround) p.anim += Math.abs(p.vx) * 0.12;

    // Fell into a pit
    if (p.y > LH * TILE + 10) { p.invuln = 0; hurtPlayer(); return; }

    // Spikes
    const sx0 = Math.floor(p.x / TILE), sx1 = Math.floor((p.x + p.w - 1) / TILE);
    const sy0 = Math.floor(p.y / TILE), sy1 = Math.floor((p.y + p.h - 1) / TILE);
    for (let ty = sy0; ty <= sy1; ty++) {
      for (let tx = sx0; tx <= sx1; tx++) {
        if (ty >= 0 && ty < LH && tx >= 0 && tx < LW && grid[ty][tx] === '^') {
          if (overlap(p, { x: tx * TILE + 1, y: ty * TILE + 9, w: 14, h: 7 })) hurtPlayer();
        }
      }
    }

    // Enemies
    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (!e.alive) { if (e.dead > 0) e.dead--; continue; }
      if (Math.abs(e.x - p.x) > VW * 1.5) continue; // sleep off-screen
      e.vy = Math.min(e.vy + 0.34, 7);
      moveX(e);
      moveY(e);
      if (e.hitWall) e.vx = -e.vx;
      else if (e.onGround) {
        const aheadX = e.vx > 0 ? e.x + e.w + 1 : e.x - 1;
        if (!solid(Math.floor(aheadX / TILE), Math.floor((e.y + e.h + 1) / TILE))) e.vx = -e.vx;
      }
      if (e.y > LH * TILE + 20) e.alive = false;
      if (overlap(p, e)) {
        if (p.vy > 0 && p.y + p.h - e.y < 9) {
          e.alive = false;
          e.dead = 30;
          p.vy = keys.jump ? -6 : -4;
          score += 100;
          sfx.stomp();
          burst(e.x + 7, e.y + 6, S.PAL.g, 10);
        } else {
          hurtPlayer();
        }
      }
    }

    // Coins
    for (let i = 0; i < coins.length; i++) {
      const c = coins[i];
      if (!c.taken && overlap(p, c)) {
        c.taken = true;
        coinCount++;
        score += 10;
        sfx.coin();
        burst(c.x + 4, c.y + 4, S.PAL.y, 6);
      }
    }

    // Flag
    if (p.x + p.w > flag.x + 6) {
      state = 'win';
      stateTimer = 120;
      timeBonus = Math.max(0, 120 - Math.floor(timer / 60)) * 10;
      score += 500 + timeBonus;
      sfx.win();
      burst(flag.x + 8, flag.y - 40, S.PAL.r, 20);
      burst(flag.x + 8, flag.y - 40, S.PAL.y, 20);
      if (score > best) { best = score; saveBest(best); }
    }

    // Camera
    const target = p.x + p.w / 2 - VW / 2;
    camX += (target - camX) * 0.15;
    camX = Math.max(0, Math.min(LW * TILE - VW, camX));
  }

  // ---------- Render ----------
  function drawText(txt, x, y, color, align) {
    ctx.font = FONT;
    ctx.textAlign = align || 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#1a1c2c';
    ctx.fillText(txt, x + 1, y + 1);
    ctx.fillStyle = color || '#ffffff';
    ctx.fillText(txt, x, y);
  }

  function drawTiles(cx) {
    const x0 = Math.max(0, Math.floor(cx / TILE));
    const x1 = Math.min(LW - 1, Math.floor((cx + VW) / TILE) + 1);
    for (let y = 0; y < LH; y++) {
      for (let x = x0; x <= x1; x++) {
        const ch = grid[y][x];
        let img = null;
        if (ch === '#') img = (y > 0 && grid[y - 1][x] === '#') ? S.tiles.dirt : S.tiles.grass;
        else if (ch === 'B') img = S.tiles.brick;
        else if (ch === 'S') img = S.tiles.stone;
        else if (ch === '^') img = S.tiles.spike;
        if (img) ctx.drawImage(img, x * TILE - cx, y * TILE);
      }
    }
  }

  function heroFrame() {
    const p = player;
    if (state === 'dead') return S.hero.hurt;
    if (!p.onGround) return S.hero.jump;
    if (Math.abs(p.vx) > 0.2) return Math.floor(p.anim) % 2 ? S.hero.walk1 : S.hero.walk2;
    return S.hero.idle;
  }

  function render() {
    const cx = Math.round(camX);
    S.drawBackdrop(ctx, cx, VW, VH, frame);
    drawTiles(cx);

    // Flag pole
    ctx.fillStyle = '#566c86';
    ctx.fillRect(flag.x + 7 - cx, flag.y - 56, 2, 72);
    ctx.fillStyle = '#ffcd75';
    ctx.fillRect(flag.x + 6 - cx, flag.y - 60, 4, 4);
    const wave = Math.floor(frame / 12) % 2;
    ctx.drawImage(S.flag, flag.x + 9 - cx, flag.y - 54 + wave);

    // Coins
    const cf = [0, 1, 2, 1][Math.floor(frame / 8) % 4];
    for (let i = 0; i < coins.length; i++) {
      const c = coins[i];
      if (c.taken) continue;
      const bob = Math.round(Math.sin((frame + i * 10) * 0.08));
      ctx.drawImage(S.coin[cf], Math.round(c.x - cx), c.y + bob);
    }

    // Enemies
    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      const dir = e.vx > 0 ? 'r' : 'l';
      if (e.alive) {
        const f = S.slime[Math.floor(frame / 14) % 2][dir];
        ctx.drawImage(f, Math.round(e.x - cx), Math.round(e.y));
      } else if (e.dead > 0) {
        ctx.drawImage(S.slimeDead[dir], Math.round(e.x - cx), Math.round(e.y));
      }
    }

    // Player (sprite is 12x16; hitbox is 10x14)
    if (!(player.invuln > 0 && Math.floor(frame / 3) % 2 && state === 'play')) {
      const spr = heroFrame()[player.facing];
      ctx.drawImage(spr, Math.round(player.x - 1 - cx), Math.round(player.y - 2));
    }

    // Particles
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.round(p.x - cx), Math.round(p.y), 2, 2);
    }

    // HUD
    if (state !== 'title') {
      ctx.fillStyle = 'rgba(26,28,44,0.55)';
      ctx.fillRect(0, 0, VW, 14);
      drawText('SCORE ' + String(score).padStart(5, '0'), 4, 3);
      ctx.drawImage(S.coin[0], 124, 2);
      drawText('x' + String(coinCount).padStart(2, '0'), 134, 3, '#ffcd75');
      for (let i = 0; i < lives; i++) ctx.drawImage(S.heart, 186 + i * 9, 3);
      drawText(String(Math.floor(timer / 60)).padStart(3, '0') + 's', VW - 4, 3, '#73eff7', 'right');
    }

    // Overlays
    if (state === 'title') {
      overlay();
      drawText('PIXEL QUEST', VW / 2, 46, '#ffcd75', 'center');
      drawText('DEMO LEVEL 1-1', VW / 2, 62, '#73eff7', 'center');
      if (Math.floor(frame / 30) % 2) drawText('PRESS ENTER OR TAP', VW / 2, 96, '#ffffff', 'center');
      drawText('BEST ' + String(best).padStart(5, '0'), VW / 2, 124, '#94b0c2', 'center');
    } else if (state === 'paused') {
      overlay();
      drawText('PAUSED', VW / 2, 70, '#ffcd75', 'center');
      drawText('CLICK OR PRESS ENTER', VW / 2, 92, '#ffffff', 'center');
    } else if (state === 'gameover') {
      overlay();
      drawText('GAME OVER', VW / 2, 56, '#e43b44', 'center');
      drawText('SCORE ' + score, VW / 2, 78, '#ffffff', 'center');
      drawText('BEST ' + best, VW / 2, 92, '#94b0c2', 'center');
      if (Math.floor(frame / 30) % 2) drawText('PRESS ENTER TO RETRY', VW / 2, 120, '#ffffff', 'center');
    } else if (state === 'win') {
      overlay(0.35);
      drawText('LEVEL CLEAR!', VW / 2, 50, '#ffcd75', 'center');
      drawText('SCORE ' + score, VW / 2, 72, '#ffffff', 'center');
      drawText('COINS ' + coinCount + '/' + coins.length, VW / 2, 86, '#ffffff', 'center');
      drawText('TIME BONUS ' + timeBonus, VW / 2, 100, '#ffffff', 'center');
      if (stateTimer <= 0 && Math.floor(frame / 30) % 2) drawText('PRESS ENTER TO PLAY AGAIN', VW / 2, 126, '#73eff7', 'center');
    }
  }

  function overlay(a) {
    ctx.fillStyle = 'rgba(26,28,44,' + (a || 0.6) + ')';
    ctx.fillRect(0, 0, VW, VH);
  }

  // ---------- Loop (fixed 60 Hz step) ----------
  let last = performance.now();
  let acc = 0;
  const STEP = 1000 / 60;
  function loop(now) {
    acc += Math.min(100, now - last);
    last = now;
    while (acc >= STEP) { update(); acc -= STEP; }
    render();
    requestAnimationFrame(loop);
  }

  best = loadBest();
  frame = 0;
  state = 'title';
  resetLevel(true);
  ctx.imageSmoothingEnabled = false;
  requestAnimationFrame(loop);
})();
