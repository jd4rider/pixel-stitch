# Pixel Stitch

A nonogram (picross) game where every row and column of numbers describes a hidden picture. Built with Phaser 4, Vite and Electron — playable in the browser and as a desktop app for macOS, Windows and Linux.

- Play in your browser: <https://jd4rider.github.io/pixel-stitch/play/>
- Downloads: <https://github.com/jd4rider/pixel-stitch/releases/latest>

## How to play

The numbers beside each row and above each column describe groups of filled squares, in order. `3 2` means three filled squares, at least one gap, then two more.

- Tap or drag to fill squares. Tap a filled square again to clear it.
- Switch to **✕ Mark** (or right-click) to cross out squares you know are empty.
- A row or column that already matches its clue crosses off its leftovers for you, so progress compounds.
- Filling a wrong square counts as a mistake. Three stars means perfect; hints cost you a star.

**24 starter patterns** across four packs: Sprouts (5×5), Cosy Corner (7×7), Voyage (8×8) and Wilds (10×10). Every one of them is verified to be solvable with pure line logic — no guessing required.

**Create your own:** paint a design in the editor, test it, then share it. A design becomes a short code (`PS1…`) that opens as `…/play/#PS1…`, and your saved designs stay on the start screen.

## Develop

```bash
npm install
npm run dev      # web dev server
npm test         # engine, puzzle and share-code tests
npm start        # build and open in Electron
npm run dist:mac # package an installer (also dist:win, dist:linux)
```

The puzzle engine lives in `src/game.js` (clues, painting rules, auto-marking, a line solver and share codes). Starter art is `src/puzzles.js`. Scenes are in `src/phaser/`.

`npm test` checks every starter puzzle against the solver, so a typo in the art is caught before it ships.

## Release

Pushing a `v*` tag runs `.github/workflows/release.yml`, which builds installers on macOS, Windows and Linux and attaches them to the GitHub release. Pushing to `main` redeploys the website (landing page at `/`, game at `/play/`) via `.github/workflows/pages.yml`.
