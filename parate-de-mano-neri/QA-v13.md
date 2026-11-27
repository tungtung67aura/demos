# QA v13: TIENDA PLENA MORTAL (headless Chrome + Playwright on http://127.0.0.1:8990, tools-bb/v13/)

## New v13 tests
- [x] **tienda13.py: 26/26, 0 page errors.** It covers:
  - Keyboard: the menu reaches TIENDA PLENA MORTAL (the last option), the shop opens, "TE FALTAN 160 FICHAS" with no fichas, then the purchase confirm.
  - NO cancels without charging. Buying CELESTE DEL 50 charges −160 and equips it. Upgrade CHIVITO level 1 charges −90. A title is bought and equipped, then toggles QUITAR/PONER. LEYENDA DEL INFIERNO stays blocked. ESC goes back to the menu on TIENDA.
  - Persistence across reload: fichas, skin, upgrade and title all survive.
  - Character select: K cycles the skin (original ↔ CELESTE).
  - LIBRE fight: the skin body (`def.traje = celeste`), the title on VS and HP ×1.03. A campaign fight with the same save has no skin, no title and base HP.
  - Ultimate with a skin: no error.
  - Fichas are paid after a LIBRE fight.
  - MODO DIOS: 0 fichas from ganarFichas, premioPelea and premioTorre.
  - Campaign and CPU-vs-CPU fights pay 0; a LIBRE dif-3 win pays 35 (+25 first win with a new fighter = 60).
  - Max upgrades in LIBRE: HP ×1.09, super ×1.21, start meter 30. The rival gets no upgrades. A campaign fight gets no upgrades.
- [x] **nav13.py: 22/22, 0 page errors.**
  - Migration from a v12.2 save: welcome bonus 37×5 + 100 = 285 fichas. The tower already cleared before is marked, ganoCon = [neri, turro], $U/campaign/pelea are kept, the bonus is not repeated after reload, and that tower pays the repeat prize (80), not the first-clear prize.
  - Gamepad (Xbox standard mapping): D-pad ↑ reaches TIENDA, A enters, → → goes to FESTEJOS, ↓ moves down, A + A buys and equips BAILE (−90), ← wraps around, B goes back.
  - Touch (iPhone 852×393): tapping a tab, a row, the same row again (confirm), SÍ (buys), the COMPRAR button and NO (no charge) all work, as do the page-down/page-up arrows and VOLVER. On character select, tapping the TRAJE chip cycles original → celeste → llamadas → original without picking the fighter.
- [x] **beu13.py:** the beat 'em up (MODO INFINITO waves) player is identical with 0 and with max upgrades: HP 100, original sprite, no skin.
- [x] **fin13.py:** LIBRE with NOCHE DE LLAMADAS + GARRA CHARRÚA + CANDOMBE DE FESTEJO + ¡ANDÁ A CANTARLE A GARDEL!:
  - the title shows on VS;
  - the skin is used in the fight, the HUD portrait and the KO;
  - the relator phrase is announced on the player's KO win, and the festejo pose plays;
  - results screen reached, 0 errors.
- [x] **ults13.py:** all 21 skins in their fighter's ultimate scene (2 frames each, tools-bb/v13/ult/hoja0-1.png): the skin is applied in every one, 0 errors.
- [x] **trajes.py:** contact sheet of all 21 skins (original, idle, heavy, win) at shots-bb13/10-hoja-trajes.png, reviewed by eye. Two fixes came out of it:
  - NOCHE DE LLAMADAS: the yellow pañuelo read as blond hair, so it is now red with white dots, and the drum is bigger.
  - Camisas floreadas: the 'flores' pattern wasn't drawn on 'camisa' garments; it is now drawn as four-petal flowers.
- [x] **Towers, CPU-3 bot (torres13.py, same as torres12 plus an upgrade preset):**
  - **0 upgrades:** Barrio ✓ (7 fights), Caos ✓ (10), Infierno ✓ (143 fights, 745 s of test time; random floors incl. chapa/monstruo/capo/zombi). The box was heavily loaded by parallel runs. v12.2 needed 41 fights on a different floor roll; the code path with 0 upgrades is identical to v12.2.
  - **All upgrades at max:** Barrio ✓ (8), Caos ✓ (10), Infierno ✓ (58 fights, 333 s).
  - Max upgrades make Infierno easier but not trivial: about 5.8 attempts per floor, and the bot still loses most fights against the Infierno bosses.
  - Fichas after the three towers: 2,600 (0 upgrades, which includes the many floor retries) / 3,384 (max, ×1.3 ALCANCÍA).
- [x] **perf13.py** (852×393 @3x, CPU ms/frame):
  - Heaviest fight with Ñeri in NOCHE DE LLAMADAS (drum) + festejo vs Patovica, storm, an ultimate every 3 s: render p50 0.2 / p99 0.7 / max 1.4, total p99 0.8 ms. Baseline perf12 in the same run: p99 0.6.
  - Shop, cycling through every item every 0.3 s:
    - 1st pass (each skin's sprite set built once on first view, max 1 per frame): p99 27 ms, max 72 ms.
    - 2nd pass (cached): render p99 0.3 / max 0.9 ms.
  - Fights are unaffected because skin sets are built and warmed exactly like the original fighter set. The only cost is a one-time ~15–30 ms build the first time a skin is shown in the shop or select.
  - Heaviest wave: p99 2.2 ms.

## v12 regression (tools-bb/v13/regresion.sh → tools-bb/v13/reg/*.log)
- [x] flujo12 24/24 · tactil12 23/23 · mando12 33/33 · migracion12 OK (v9→v12 fields kept, 18/30 unlocked without the cheat, 30/30 with it) · bloqueo12 99 ok, 0 holes, ESCAPE OK · espejo (max 1 per tower) · camptrans OK · mapa12 0 errors · zombi12 (level won t=58) · vistas 0 errors · ults 32 scenes, 0 errors
- [x] Attacks (todos.sh): 39 fighters × 11 moves against all 39 rivals, 0 failures, 0 page errors
- [x] infinito12: 11 waves, bosses seen, end screen (record 11, now also "FICHAS +33"), 0 errors
- [x] perf12: fight p99 0.6 ms, wave p99 within budget, 0 errors
- [x] lat12: under load 3.0 / 4.17 frames; re-run with less load (lat12-b.log): beat 'em up 3.0 frames (46 ms), PLENA MORTAL 4.0 frames (65 ms), the same as v12.2
- [x] campana12 (full campaign, bot): 8/8 levels won (tano, patovica→chola, guarda, bocha, gallego, chapa→zombi, parrillero, capo), 0 page errors
- [x] Version: main.js VERSION and sw.js CACHE = bb-v13; sw.js lists tienda-pm.js and tienda-ui.js (54 entries, nothing missing, every .js cached)
- [x] Bundle /workspace/fun/publish-bb-v13.tgz (tools-bb/v13/bundle13.sh, git archive of HEAD): single root parate-de-mano-neri/, same layout as publish-bb-v12.2.tgz plus MISION/NOTAS/QA-v13.md and js/pelea/tienda-pm.js, tienda-ui.js. Smoke test of the extracted bundle served alone on :8991 (smoke13.py, smoke13b.py): SW registered, cache bb-v13 holds 54 entries, a fight starts, the shop opens from the PLENA MORTAL menu, 0 errors. Not published.
- [x] Milestone screenshots: /workspace/fun/shots-bb13/01–10

All checks passed.
