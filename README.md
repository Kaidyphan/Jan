# Pixel Quest — game website

A retro pixel-art website for a platformer game, with a **playable demo level built into the page**.

Plain HTML, CSS and JavaScript. There is no build step and nothing to install.

## Run it

Open `index.html` in a browser. To use a local server instead:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## What's inside

| File | Purpose |
| --- | --- |
| `index.html` | The page: hero, demo, features, characters, roadmap, FAQ, sign-up and footer |
| `css/style.css` | Pixel styling: chunky borders, pixel buttons, responsive layout |
| `js/sprites.js` | All pixel art (hero, slime, bat, coins, tiles), defined as text maps, plus the parallax backdrop |
| `js/game.js` | The demo platformer: physics, enemies, coins, spikes, flag, HUD, sound effects, touch controls |
| `js/main.js` | Site behaviour: mobile menu, animated hero banner, character previews, feature icons, sign-up form |

## Game controls

- **Move:** ← → or A D
- **Jump:** Space, ↑ or W. Hold it to jump higher.
- **Start:** Enter, or click the game. **Pause:** P. **Mute:** M.
- On phones, on-screen buttons appear under the game.

The best score is saved in the browser's localStorage.

## Customising

- **Game name and text:** edit `index.html`. The canvas title screen text is in `render()` in `js/game.js`.
- **Level layout:** edit `buildLevel()` in `js/game.js`. It uses helpers such as `ground()`, `plat()` and `coins()`, and `put(x, y, 'e')` places an enemy.
- **Sprites:** edit the text maps in `js/sprites.js`. Each character is one pixel and its colour comes from `PAL`.
- **Colours:** change the CSS variables at the top of `css/style.css`.
- **Sign-up form:** it only works on the page for now. Connect it to your mailing-list provider where the `TODO` is in `js/main.js`.

## Deploy

The site is fully static, so it works on GitHub Pages, Netlify, Vercel or any static host. For GitHub Pages, go to *Settings → Pages* and deploy from your branch's root folder.
