/* =========================================================
   Site behaviour: nav, hero animation, character sprites, form
   ========================================================= */
(function () {
  'use strict';
  const S = window.PixelSprites;
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- Mobile nav ----------
  const toggle = document.querySelector('.nav-toggle');
  const links = document.getElementById('nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      const open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      links.classList.toggle('open', !open);
    });
    links.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        toggle.setAttribute('aria-expanded', 'false');
        links.classList.remove('open');
      }
    });
  }

  // ---------- Hero animation: Pip runs, a slime gives chase ----------
  const hero = document.getElementById('hero-canvas');
  if (hero) {
    const hctx = hero.getContext('2d');
    const W = hero.width, H = hero.height;
    const groundY = H - 16;
    let t = 0;
    let jumpY = 0, jumpV = 0;

    const drawHero = function () {
      const cam = t * 1.2;
      S.drawBackdrop(hctx, cam, W, H, t);

      // Ground strip
      const off = Math.floor(cam) % 16;
      for (let x = -off; x < W; x += 16) {
        hctx.drawImage(S.tiles.grass, x, groundY);
      }

      // Coins scrolling past
      const cf = [0, 1, 2, 1][Math.floor(t / 8) % 4];
      for (let i = 0; i < 6; i++) {
        let cx = i * 70 + 40 - (cam % 420);
        if (cx < -20) cx += 420;
        hctx.drawImage(S.coin[cf], Math.round(cx), groundY - 44 + Math.round(Math.sin((t + i * 20) * 0.08) * 2));
      }

      // Pip hops every so often
      if (t % 90 === 0) jumpV = -4.2;
      jumpV += 0.25;
      jumpY = Math.min(0, jumpY + jumpV);
      if (jumpY === 0) jumpV = 0;
      const frame = jumpY < 0 ? S.hero.jump : (Math.floor(t / 6) % 2 ? S.hero.walk1 : S.hero.walk2);
      hctx.drawImage(frame.r, Math.round(W * 0.45), groundY - 16 + Math.round(jumpY));

      // Slime chasing
      const sf = S.slime[Math.floor(t / 10) % 2].r;
      hctx.drawImage(sf, Math.round(W * 0.45 - 46 + Math.sin(t * 0.03) * 6), groundY - 11);
    };

    if (reduceMotion) {
      drawHero();
    } else {
      let visible = true;
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) { visible = entries[0].isIntersecting; }).observe(hero);
      }
      const tick = function () {
        if (visible) { t++; drawHero(); }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
  }

  // ---------- Character sprite previews ----------
  const spriteFrames = {
    hero: [S.hero.idle.r, S.hero.walk1.r, S.hero.idle.r, S.hero.walk2.r],
    slime: [S.slime[0].r, S.slime[1].r],
    bat: [S.bat.r, S.bat.l],
    gem: [S.gem],
  };
  const views = Array.prototype.slice.call(document.querySelectorAll('.sprite-view'));
  const drawViews = function (t) {
    views.forEach(function (c) {
      const frames = spriteFrames[c.getAttribute('data-sprite')] || [];
      if (!frames.length) return;
      const img = frames[Math.floor(t / 12) % frames.length];
      const vctx = c.getContext('2d');
      vctx.imageSmoothingEnabled = false;
      vctx.clearRect(0, 0, c.width, c.height);
      const scale = Math.floor(Math.min(c.width / img.width, c.height / img.height));
      const bob = c.getAttribute('data-sprite') === 'gem' ? Math.round(Math.sin(t * 0.08) * 2) : 0;
      vctx.drawImage(img, Math.floor((c.width - img.width * scale) / 2), Math.floor((c.height - img.height * scale) / 2) + bob, img.width * scale, img.height * scale);
    });
  };
  if (reduceMotion) {
    drawViews(0);
  } else {
    let vt = 0;
    const vtick = function () { drawViews(vt++); requestAnimationFrame(vtick); };
    requestAnimationFrame(vtick);
  }

  // ---------- Feature icons (drawn from tiny pixel maps) ----------
  const ICONS = {
    heart: ['.kk.kk.', 'krrkrrk', 'krlrrrk', 'krrrrrk', '.krrrk.', '..krk..', '...k...'],
    coin: ['.kkkk.', 'kyyyyk', 'kylyYk', 'kylyYk', 'kyyyYk', '.kkkk.'],
    sword: ['......ks', '.....ksk', '....ksk.', 'k..ksk..', '.kksk...', '..kk....', '.kOkk...', 'kO..k...'],
    music: ['...kkkk', '...kbbk', '...k..k', '...k..k', '.kkk.kk', 'kbbkkbk', '.kk..k.'],
    users: ['.kk..kk.', 'kwwkkwwk', 'kwwkkwwk', '.kk..kk.', 'kbbkkrrk', 'kbbkkrrk', 'kkkkkkkk'],
    flag: ['kk....', 'krrrr.', 'krlrrr', 'krrrr.', 'k.....', 'k.....', 'k.....'],
  };
  document.querySelectorAll('.icon').forEach(function (el) {
    const name = (el.className.match(/icon-(\w+)/) || [])[1];
    if (!ICONS[name]) return;
    const c = S.build(ICONS[name]);
    c.className = 'icon-canvas';
    el.appendChild(c);
  });

  // ---------- Newsletter form (front-end only) ----------
  const form = document.getElementById('join-form');
  const msg = document.getElementById('form-msg');
  if (form && msg) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const email = form.email.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        msg.textContent = 'Hmm, that email looks a bit glitchy. Try again?';
        msg.className = 'form-msg error';
        form.email.focus();
        return;
      }
      // TODO: connect to your mailing-list provider here.
      msg.textContent = '1UP! You’re on the list.';
      msg.className = 'form-msg ok';
      form.reset();
    });
  }

  // ---------- Footer year ----------
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
