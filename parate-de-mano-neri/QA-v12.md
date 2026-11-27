# QA v12: checklist (headless Chrome + Playwright, tools-bb/v12/)

Every line gets committed as soon as it passes.

## Already passed
- [x] Attacks: 39 fighters × 11 moves connect against all 39 rivals; 0 failures, 0 page errors (ataques.py / todos.sh)
- [x] Ultimates: all 33 scenes render with sprites (ult/hoja0-1.png)
- [x] flujo12: 24/24 screens/flows OK
- [x] Save migration v9/v11 → v12: all fields kept, `pelea` added, stable after reload; 18/30 unlocked without cheat, 30/30 with bb-dios
- [x] Touch in the fighter: LEVE/FUERTE/ESP/SÚPER map to l/h/s1/ult; D-pad moves (+62 px) and jumps
- [x] Infinito: 11 waves, bosses on 5/10, 56 unique names, end screen (record 11, 57 KOs, $U 2060), 0 errors
- [x] Version: main.js VERSION and sw.js CACHE = bb-v12; sw.js lists every js/pelea/*.js (node check: nothing missing or nonexistent)
- [x] Tower 0 (BARRIO, 7 floors), CPU bot dif 3 with no help: completed in 452 s of test time; floor list repartidor, policia, turro, patovica, rapero, feria, parrillero; unlocks saved; 0 errors
- [x] Campaign, boss lose path (PIERDE=1, level 3 avenida): lost the guarda fight → sinPelea → '¡A LA ANTIGUA!' → classic boss beaten → level won; 0 errors
- [x] Campaign, Patovica event (level 2 feria, with cines): patovica cine → fight → back to the level → chola boss fight → level won; 0 errors
- [x] Campaign, boss win path: bocha (level 4) and gallego (level 5) were beaten in the fighter → boss KO'd in the level → level won (campana12, camp-gana.log)
- [x] Beat 'em up regression: the bot won all 8 levels (cuadra … rambla), 0 page errors; the 6 lost boss fights fell back to the classic fight and were won (camp-gana.log)
- [x] Fix found during QA: a tower could roll two 'PELEA ESPEJO' floors (e.g. tower 2 floors 2–3 both vs Ñeri). Now at most one per tower; 300 random towers checked, max 1
- [x] Tower 1 (CAOS, 8 floors: youtuber[dobleDanio], policia[superLleno], tachero, capo (mid-boss), neri[espejo], mecanico[sinReloj], vecino[dobleSuper], monstruo (boss)): completed by the bot; unlocks + record saved; 0 errors. Bot ran with a test damage boost (×2.5): the plain dif-3 bot stalled 10+ min on the capo mid-boss (AI vs AI)
- [x] Tower 2 (INFIERNO, 10 floors: fisico, neri[espejo]×2 (led to the fix above), gitano, monstruo, bocha, abogado[gigante], capo, turro, zombi (final boss)): completed by the bot (boost ×2.5); infierno record saved; zombi + monstruo unlocked; 0 errors
- [x] Fix found during QA: on the tower map, long modifier labels ran into the rival's name ('POLICÍASÚPER QUE SE CARGA SOLO'). Now the list uses short tags (DAÑO X2, SÚPER LLENO, GIGANTE, SIN RELOJ, ESPEJO, AUTO-SÚPER); the fight title keeps the full text
- [x] Fix found during QA: in cerro, if the Chapa fight was won, the Zombi event left the level unable to end (the pending-event branch still cleared the lock and advanced the wave). Fixed in juego.js; re-run (zombi12.py): Chapa fight won → Zombi cine → Zombi fight → closing cine → LEVEL WON at t=66 s; 0 errors. When the Chapa fight is lost → classic Chapa → level won (t=137 s)
- [x] Fix found during QA: when infinito enemies bunch up, their names overlapped each other and their health bars. Names now dodge each other (shift up, or are skipped when there's no room), stay below the HUD, and are drawn above the bars
- [x] Worst-case perf (perf12.py, 852×393 @3x DPR, headless Chrome on the box, CPU ms per frame, 25 s each):
  - Heaviest fight (monstruo vs patovica, rambla with storm, both CPU dif 3, an ultimate forced every 3 s): render p50 0.2 / p99 0.5 / max 1.4; logic p99 0.2 / max 0.8; total p99 0.6 ms
  - Heaviest wave (infinito wave 13, 8+ enemies kept alive, apagón + rain + llamadas + pigeons + embers + bus): render p50 1.0 / p99 2.1 / max 4.3; logic p99 0.5 / max 1.2; total p99 2.6 ms (budget at 240 Hz: 4.17 ms)
  - 0 page errors
- [x] Final regression after the fixes, full campaign with cines on (camp-final.log, plain dif-3 bot, no damage boost): 8/8 levels won, 0 page errors. Fighter results: bocha, gallego and chapa beaten in the fighter (chapa → Zombi cine → Zombi fight → level won); feria ran Patovica event → chola; tano, guarda, parrillero and capo lost → classic → won. flujo12 re-run: 24/24
- [x] Milestone screenshots in /workspace/fun/shots-bb12/ (00 menu, 01 character select, 02 superflash, 03 fight with ultimate, 04 fight, 05 tower select + tower map, 06 ultimate sheets, 07–08 infinito, 09 campaign boss fight, 10 heavy wave, 11 storm fight, 12 touch HUD)
- [x] Bundle /workspace/fun/publish-bb.tgz (git archive of HEAD, bundle12.sh): single root parate-de-mano-neri/ with index.html, sw.js and js/pelea/* (9 files); VERSION and CACHE = bb-v12; all 52 sw.js entries exist and every .js is cached; smoke test of the extracted bundle served on its own (smoke12.py): SW registered, cache bb-v12 holds 52 entries, a fight starts, 0 errors. Not published (the parent publishes)

## Balance pass: Capo (duelo12.py, alcance12.py, hurt12.py)
Setup: player bot = Ñeri at CPU level 3 with no help, against each rival at dif 2 and tower HP 1.4, 8–10 fights each.
- Capo: 0/10 fights (0–20 rounds). Patovica 4/10, Bocha 4/10, Turro 2/10, Chapa 1/10, Monstruo 1/10. Parrillero 0/10, Zombi 0/10.
- Capo is NOT a stat or AI outlier:
  - No special block or reversal rate (block counter ~2–6 %, 0 contras); he uses the shared CPU profile.
  - Hurtboxes are normal.
  - With Ñeri's stats swapped in he still won 0/8; even CPU level 1 Capo won 10/10.
- The pattern is the GOLPE heavy-punch kit, used by 13 fighters: guarda, policía, mecánico and tano also beat the bot 0/8 at base HP, and turro (no GOLPE) loses 1/10.
  - Swapping Capo's heavy from GOLPE to PATADA in-page took the bot from 0/8 to 4/8 (11–11 rounds).
  - The Ñeri bot gets hit mostly in its own recovery (whiffs punished) and in combo follow-ups. That is an AI weakness against long, high-damage pokes; a human can space and whiff-punish them.
- Fixes (commit 2ecd35b):
  - GOLPE: reach 60 → 50 px (it was ~50 % longer than any other heavy), recovery 0.26 → 0.32 s so a whiff can be punished.
  - PARAGUAZO: startup 0.14 → 0.22 s, dash 240 → 200, recovery 0.26 → 0.40 s, so you can read it and punish it on block or whiff.
  - Capo mid-boss HP: Caos 1.4 → 1.25 (below Patovica's 1.3 mid-boss), Infierno 1.5 → 1.35.
  - Attack regression after the change: all 39 fighters × 11 moves still land on all 39 rivals, 0 errors.
- Tower re-runs after the fix (plain CPU-3 bot):
  - Caos: stuck on Capo (floor 4) for 5+ min, both with no boost and with ×1.3.
  - Infierno (no boost): cleared floors 1–3; stuck on floor 4 (Chapa [gigante]) when stopped.
  - The earlier clears used ×2.5. Cause: the bot AI, not Capo; it also loses 0–10 % to every GOLPE user, including the base-HP campaign bosses.
- Not done (needs AI work, with care): teaching the CPU to keep out of poke range and whiff-punish. A dif-2/3 human-facing Capo should be playtested.

## PLENA MORTAL + 1v1 readability (user request)
- [x] The fighting mode is called PLENA MORTAL everywhere the player sees it:
  - menu entries "PLENA MORTAL: TORRES" / "PLENA MORTAL: LIBRE", plus the descriptions;
  - screen titles "PLENA MORTAL · TORRES" / "PLENA MORTAL · LIBRE";
  - "SUPERVIVENCIA PLENA MORTAL";
  - a red "PLENA MORTAL" header on every fight intro (towers, free fight, survival, campaign);
  - campaign transition title "CAMPAÑA · JEFE · NIVEL n" / "CAMPAÑA · EVENTO"
- [x] 1v1 readability:
  - Ultimate-scene extras (candombe drummers, la barra, zombis, mirror reflections) are now dark, small (≤52 %), semi-transparent silhouettes behind the fighters, fading in/out over 0.3 s.
  - La Barra now cheers from the back while the Turro does the hitting (the crowd's "fists" are gone).
  - The stage crowd is smaller (58 %), darker and fainter.
  - Every fighting mode builds exactly 2 fighters (`this.F = [p1, p2]`, the only place); crowds exist only in the beat 'em up.
- [x] Regressions after these changes: attacks 39/39 rivals, 0 failures; flujo12 24/24; ults 32 scenes, 0 errors; campaign level 1 won; perf fight p99 0.7 ms, wave p99 2.1 ms

All checks passed.
