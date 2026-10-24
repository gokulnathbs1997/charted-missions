# Verification — v9.1

Tested in headless Chromium with software WebGL. No page errors.
- **Helicopter:** renders from six angles before and after the fix. From the rear and three-quarter views the square box behind the cabin is gone, and the hull and tail boom show cleanly. The opening film's shots inside the cabin are pixel-identical to v8.7.
- **Ladder:** captured during a fire-escape climb. The backs of the gloves face the camera, fingers wrap over the rungs, the hands sit inside the rails on real rung heights and alternate as you climb.
- **Rope:** captured during the insertion rope descent. Hand over hand, the rope runs through both fists and the backs of the gloves face the camera.
- **Swim and mantle:** palms down. The measured palm normals match the targets.
- **Regression:** Missions 01, 02, 04, 05 and 06 are all won; TDM ×2, Dust Yard and the mobile touch editor pass.

---

# Verification — v9.0

Tested in headless Chromium with software WebGL. No page errors in any run.

- **New missions, played end to end:**
  - Mission 05 (River Run): all 6 objectives complete and the mission is won.
  - Mission 06 (High Ground): all 8 objectives complete (both rooftop kill objectives included) and the mission is won.
- **Stairs:** walking forward up the Hotel Kessel stairwell climbs from the ground floor (3.6 m) to floor 1 (6.8 m). The second, switch-back flight reaches floor 2 (10.0 m), with no snagging on the steps.
- **Ladders:**
  - The hotel fire escape goes from street level to the roof terrace (16.4 m).
  - The pier ladder can be grabbed while swimming and takes you onto the pier deck.
- **Climbing (mantle):**
  - Street to dumpster (1.25 m), then dumpster to the apartment balcony (1.95 m), then walking inside through the balcony door all work.
  - The fountain rim is climbable.
  - From the water you can climb onto the pier (2.26 m).
  - The 3.3 m quay wall correctly refuses (use the ladder instead).
- **Swimming:**
  - Walking into the river switches to swimming at about 1.3 m depth.
  - Holding C dives: the underwater tint, AIR meter and muffled audio come on, and guards stop seeing you. Releasing C brings you back to the surface.
  - Guards don't path along the river bed.
- **Guards:**
  - Docks: 17 guards.
  - Town: 26 guards. Rooftop, window, tower, MG, pier and boat posts stay put under alarm. Street and ground-floor guards move across the raised terrain and stay on the ground (no sinking or floating).
- **Voices:** 35 of 35 briefing and radio lines across all missions resolve to recordings (292 lines total). The two new cutscene lines are recorded.
- **Load time:** decorative geometry (steps, trims, fittings) is left out of collision. The forest load in software WebGL went from 16.6 s (v8.7) to 20.1 s. On real hardware this is much smaller.
- **Regression:** 18 of 18 runs pass:
  - Missions 01, 02, 04, 05, 06
  - TDM ×3, city, TDM AI, online two-player, Dust Yard ×2, Death Match, Snow yard, tactics
  - Mobile touch editor and sound

---

# Verification — v8.7

Tested in headless Chromium with software WebGL. No page errors.
- **Lighting:** forest screenshots (Missions 01 and 02) and eight opening-film frames before and after show scenes that are clearly brighter and readable, with no crushed blacks.
- **Foliage:** close and mid-distance shots show branch-spray pines, leaf-cluster trees and 3-D blade grass clumps with colour variation.
- **Voices:**
  - The manifest has 268 recorded lines. All six Mission 01 briefing lines resolve to recordings and decode (1.2–7.2 s each).
  - An enemy bark plays through the positional path.
  - Rendered offline with the Piper engine, then pitch-, EQ- and radio-processed per character.
  - Spot-checked durations and loudness; listening on real speakers was not possible here.
- **Audio engine:** shots (all weapons at 0, 20 and 150 m), explosions, whizz, kill/hit sounds, the indoor reverb switch and casings all run without errors. The master chain outputs signal (peaks around −2 dB, limited).
- **Regression:** all 16 runs pass (missions, TDM, city, shop, ragdolls, kill cam, online, Dust Yard, Death Match, tactics, touch editor, sound).

---

# Verification — v8.6

Tested in headless Chromium with software WebGL. No page errors.
- **Rifle orientation:** the AK axes measured at the aim pose are barrel = +forward and local "up" = world +up (before the fix it was world −up).
- **Views and stances:** rear three-quarter, side, front and right views, plus idle, walk, sprint, crouch, aim and fire, all show the magazine and grip down, sights up and the stock at the shoulder. The rifle top sits at 1.53 m, cheek height.
- **Bot weapons:** the M4, sniper and shotgun on bots are also upright.
- **Opening film:** the firefight at the fence matches the supplied reference (shouldered, barrel forward).
- **Dust Yard:** in-game, a bot holds its suppressed M4 upright at low-ready.
- **Regression:** all 15 runs pass.
  - Missions 01, 02 and 04; the TDM arena; the city campaign; shop/streaks; ragdolls; kill cam/wheel; online play.
  - Dust Yard on both sides; Death Match, Snow, skins and settings; lobby and phone; squad tactics; the touch-controls editor.

---

# Verification — v8.5

Tested in headless Chromium with software WebGL. No page errors.
- **Opening film:** frames rendered across all shots.
  - The helicopter chase opens with the location card.
  - The rifle is slung (not inverted) while sitting, on the rope and on landing, and is drawn into both hands afterwards.
  - The wrist close-up is clean, the firefight is shot over the shoulder, and the title hand-off works.
- **Touch controls editor** (844×390 phone):
  - Jump dragged and set to 140 %; reload hidden; lean-left shown; opacity set to 55 %.
  - The layout is saved, survives a page reload, and Reset restores the defaults.
- **Clean touch UI:** phone screenshots of forest, TDM and Dust Yard, plus a 1180×820 tablet, show icon buttons, no header or key-hint text, and a contextual USE button. The pause menu and lobby are decluttered.
- **Regression:**
  - Missions 01, 02 and 04 complete.
  - TDM arena full match, city campaign, shop/streaks, ragdolls, kill cam/wheel and online two-client play pass.
  - Dust Yard passes on both sides; Death Match, Snow, skins, settings and key remap pass; lobby and phone flow pass; squad tactics pass.

---

# Verification — v8.4

Tested in headless Chromium with software WebGL. No page errors in any run.
- **First-person guns:** the SMG, shotgun, LR-7 and .44 render as detailed models in the animated gloved hands, idle and mid-reload. They are framed like the 9 mm and AK-74, and their sizes match the rigs (for example .44: 0.335 m; 9 mm: 0.33 m).
- **Enemy weapon handling:** a pose sheet shows ready, aim (M4, AK-74U, SMG, shotgun, sniper), sprint and reload from the side and the front. Guns point forward with the stock at the shoulder when aiming, and no soldier holds the gun on the shoulder.
  - In-game close-up: a red bot holds his shotgun at low-ready in both hands.
  - All 9 bots display the weapon they are using.
- **Tactics:** over 90 s of bot play:
  - Plans changed 9 times (rush, flank, regroup, hold).
  - 8 leader hand signals and 7 animated reloads.
  - 19 moves to cover and 5 announced grenades.
  - Call-outs included contact, flank, retreat, reload, cover, push, regroup and hold.
- **Intro film:** the cabin close-up, tower briefing and firefight frames render. Guards hold their rifles properly and fire from the muzzle.
- **Regression:**
  - Missions 01, 02 and 04 complete.
  - TDM arena full match, city campaign, shop/streaks, ragdolls, kill cam/wheel and online two-client play pass.
  - Dust Yard passes on both sides; Death Match, Snow, skins and settings pass; lobby and phone pass.

---

# Verification — v8.3

Tested in headless Chromium with software WebGL at 1280×760 and on an 844×390 touch phone. There were no page errors in any run. The only 404s were the expected `/rooms` probes made when no online server is running.
- **Pre-match flow:** mode → map → weapon screens render.
  - Choosing Death Match + Snow + AK-74U + the Gold Rush skin spent 1,500 coins, saved the skin and loaded `?mode=yard&side=ct&map=snow&dm=ffa`.
  - The TDM flow with Terrorist + Dust also works.
  - With the Random map, the phone run loaded the Snow Yard.
- **Death Match:** 9 bots, all hostile to the player and to each other. Over a minute of play bots killed each other (top bot 5 kills). The score shows YOU vs LEADER. The ranked end table and the TAB scoreboard both render.
- **Snow map:** caps, drifts, falling snow, overcast sky, fog and cold light all render. The art was re-rendered for the map card.
- **Skins:** the equipped skin is applied to 3 gun meshes of the in-game AK-74U, and the hands are untouched.
- **Settings:**
  - Remapping forward to I: I moves forward and W no longer does.
  - Field of view 96° reaches the camera.
  - The FPS counter shows.
  - The controls overlay and lobby settings render.
  - Dragging the Jump button saved its new position.
- **Soldier model:** 29.5 MB → 8 MB. Ragdolls, TDM, missions and online play all still pass.
- **Regression:**
  - Missions 01, 02 and 04 (Nightfall) complete.
  - TDM arena full match, city campaign, shop/streaks, ragdolls, kill cam/wheel and online two-client play pass.
  - Dust Yard passes on both sides.

---

# Verification — v8.2 (Mission 03: Dust Yard)

Tested in headless Chromium with software WebGL at 1280×720, 1280×800 and an 844×390 touch phone. No page errors in any run.
- **Dust Yard, both sides (Counter-Terrorist and Terrorist):**
  - **Start:** loads in about 23–31 s headless. The VS roster intro and the TEAM DEATHMATCH 3-2-1 countdown show.
  - **Spawn:** the player no longer spawns inside a teammate.
  - **Combat and pickups:**
    - Kills show KILL / HEADSHOT badges.
    - Fallen bots drop their guns. Auto pickup swapped M4 → sniper and M4 → AK-74U.
    - The health orb gave +40 and then waited 20 s to respawn.
    - Auto aim pulls the view toward an enemy near the crosshair.
    - A grenade produced 16 green smoke puffs.
  - **Match end:** the red final-seconds countdown shows. The match ends on time with VICTORY → MVP → SCORE (kills, deaths, assists) and rewards. Assists counted.
- **Lobby:**
  - Mission Select lists 01, 02, 03 Dust Yard (5 V 5) and 04 Nightfall (Archive).
  - The Dust Yard card opens the side picker; choosing Terrorist loads `?mode=yard&side=t`.
  - The phone layout has no overlap with the touch controls.
- **Regression:**
  - Missions 01, 02 and 04 (Nightfall: prisoner rescue, codebook, LZ) complete start to finish.
  - The original TDM arena plays a full 5:00 match. City campaign, shop/streaks, ragdolls, kill cam and wheel tests pass.
  - Online two-client play works: hits, kill sync, score and respawn.
  - The old `?mode=forest&m=3` link now opens Dust Yard (by design).

Not verified: real-GPU frame rates and shadow cost on phones.

---

# Verification — v8.1

Each issue from the user's recording was re-checked in headless Chromium with software rendering:
- Intro frames re-rendered for the aerial shot (no white beam triangles, painted far trees), the helicopter over-the-shoulder and boots shots, the rope hook-up, the descent and landing, the orbit reveal, the binocular start, the firefight (now along the fence, not through it), the door reveal and the face close-up. There is no black frame and no hull-interior wall.
- Binocular overlay: smooth two-lens mask with no dark centre band.
- Mission 01 start: no guards within 18 m. Standing idle at the spawn for 20 s cost 10 health (before the fix: dead in 14 s).
- The objective label at 1 m is hidden, and the "E / USE" prompt is readable.
- The briefing menu shows without the HUD behind it.
- Regression results are below.

---

# Verification — v8 (Charted Missions)

Headless Chromium with software WebGL (SwiftShader). Screens tested: 1440×900, 1024×768 touch tablet, 390×844 and 844×390 touch phone, plus 960×540 and 480–640 px for 3D renders. No page errors in any run.
- **Main menu:** renders correctly on desktop, tablet, phone portrait and phone landscape. Operators, Barracks and Settings dialogs open. Deploy, Quick Match, Host, bots and mission select all route correctly (the lobby-flow tests start TDM and the city campaign from the new menu).
- **Black Veil film:** rendered frame by frame through all 10 shot segments. It hands over at the comms-facility doorway with the objective *Infiltrate the communications facility*, the alarm active and the 20:00 transfer deadline running. Skipping works.
- **Missions:** Mission 01 (new Black Veil flow: facility, key, panels, C4, blast, exfil), Mission 02 (now with the informant map, tower snipes, ridge, zip-line, schedule, fuel and extract) and Mission 03 all completed start to finish. Medkit, medicine and aspirin, binocular marking (7 marked), and the 5.7 m ladder climb still work.
- **World:** the river, waterfall (25 m drop), plunge pool, granite cliffs and boulders render. Tree LOD cut the software-renderer frame time from about 120 s to about 19 s per frame, so real GPUs and phones benefit equally.
- **Kill cam:** a headshot kill starts the bullet-follow and orbit kill cam, which then ends and returns control. **Utility wheel** opens with V and closes on release or tap.
- **Sounds:** rifle_fire, pistol_fire, jump, walking and running decode and play through the engine.
- **Regression:** a full TDM match ran to the score limit with results saved. The armory, upgrades, loadout and profile tests pass. The city campaign (775 doors, 28 guards) passes. All audio and music states run. TDM ragdolls and respawn work. In online two-client play, hits, kill sync, scores and chat work (see the notes below).

Not verified: real-GPU frame rates on actual phones and tablets, how the recorded sounds and music sound on speakers, and online play across the internet.

---

# Verification — v7

Headless Chromium (software WebGL), 960×540, 1280×800 and an 844×390 touch phone profile. Two browser clients were connected at once to test online play. No page errors in any run.
- **Ragdolls:** TDM bot killed by a bullet falls and settles on the ground (sleeps after about 1.5 s, hips 0.13 m above the floor). A bot hit by a grenade is thrown and settles. Bots respawn with the ragdoll reset. A forest militia soldier killed indoors next to bunk beds settles on the floor; this was a bug, now fixed, where the body climbed the furniture. A campaign city guard ragdolls and settles.
- **Blood/VFX:** blood spray, wall and ground decals and pools are visible; the explosion sequence is captured at 0.1 s, 0.5 s and 2.3 s (fireball, then smoke and debris, then scorch and smoke); forest camp fires use particle fire (`fires: [true]`); the blood-on-screen overlay scales with damage and low health.
- **Voices/emotions:** an enemy hit at 60 hp barks "You will pay for that!" with a speech bubble; player lines appear ("Got him.", "Tango down.", "I cannot take much more."); the portrait switches to FEAR at low health. The browser speech output itself was not audible headless.
- **New features:** lean moves the camera 0.42 m and rolls it, then returns to 0 on release. The search-body prompt and ammo work; the hit direction indicator shows in the campaigns.
- **Online multiplayer:** two clients joined room "test" and were balanced to BLUE and RED, and each sees the other moving. Alpha's hits killed Bravo through the server (Bravo down, deaths 1; Alpha kills 1; both show score 1–0 and the same kill feed). Chat "gg wp" arrived on the other client. Bravo respawned and became visible again on Alpha's screen. `/rooms` lists the room live, and the lobby card detects the server.
- **Web app:** the manifest loads; the service worker and icons are served; the install button appears when the browser offers installation.
- **Regression (v6 features):** full TDM match to the score limit with results saved; campaign 775 doors, 28 guards, weapons fire; forest missions 1, 2 and 3 completed start to finish (meds, binoculars, ladder, zip-line, sniper sentries, fuel depot, prisoner rescue); shop, loadout, upgrades, killstreaks up to airstrike; every audio and music state; weapon rigs.

Not verified: real-speaker sound, real-device frame rate, internet play through NAT or HTTPS hosting (tested only on localhost), and installing on real phones.

---

# Verification — v6

Headless Chromium (software WebGL), 960×540 and a 844×390 touch profile. No page errors in any run.
- Team Deathmatch with the AK-74 and AK-74U: draw, fire (ammo decreases), reload, switch to the animated pistol; a full match ran to the score limit with results saved.
- Armory lists and sells the new rifles; upgrades, loadout and profile still save.
- Original campaign: 775 doors, 28 guards, rifle fires.
- Forest missions 1, 2 and 3 completed start to finish. Medkit/medicine/aspirin, binoculars, ladder (5.7 m tower) and zip-line pass with the gloved arms visible in each action and in the rope-descent cutscene.
- Audio: the context runs and produces output in menu, stealth, tension, combat and cinematic states. All weapon shot types, whiz, explosion, ambience beds, every cinematic cue, ducking and slow motion (time scale drops) run without errors.

Not verified: how the score sounds on real speakers (headless tests only check output level), real-device frame rate, and browser voice narration.

---

# Verification — v5 (story campaign)

Tested in headless Chromium with software WebGL at 960×540 (Performance quality) and 640×360 (High quality with shadows), plus a touch phone profile at 844×390.

Passed, with no page errors:
- All three missions load (about 8 s locally) with 20+ guards, 12 interactive doors, terrain and tree collision.
- The intro cutscene plays to the end (title, briefing subtitles, helicopter flyover, door view, fast-rope, departure) and hands control to the player on the ground. Skipping works.
- Mission 1, 2 and 3 were each completed from start to finish (objectives driven by teleporting the player and using the real interaction, ladder, zip-line and timer code paths), ending in the extraction cutscene and Mission Complete screen with XP and coins saved.
- Medical: bleeding is stopped by the medkit (+55); medicine adds +20 and pain relief; the aspirin injection adds +35. Each plays its animation and uses one item.
- Binoculars marked 6 guards from the ridge; the satellite map draws terrain, buildings, zip-line, markers and objectives.
- Ladder: climbed a 5.6 m watchtower and stepped onto the platform. Zip-line: rode from the ridge to the camp and released.
- Combat: guards spot, attack and damage the player in the open; the player kills a guard with the rifle.
- Team Deathmatch and the original campaign still load and play (regression).

Not tested: real-device frame rate (the forest is much heavier than the city on low-end phones; use Performance quality) and voice narration (headless browsers have no voices).

---

# Verification — v4

Tested in headless Chromium (software WebGL), desktop 1280×800 and a touch phone profile at 844×390 landscape. Mechanics were driven with accelerated simulation plus real clicks and touch-pointer events.

Passed:
- Lobby renders; tabs, daily claim, buying (with level and coin locks), 3-tier upgrades, auto-equip on purchase, loadout change and callsign edit all save to localStorage.
- Team Deathmatch loads with no page errors: 9 bots (4 allies, 5 enemies) spawn at both bases, path across the arena, fight each other and the player, throw grenades and respawn.
- The player kills bots with M4, shotgun, magnum and knife. Headshots register. Magazines, reloads and reserve ammo are correct. Upgraded damage applies in match.
- Grenade throw arcs, bounces and detonates. Airstrike kills appear in the kill feed.
- Killstreaks at 3, 5 and 7 grant UAV, 100 armor and airstrike.
- Player death shows killer, respawns after 4 s at the blue spawn with full health and ammo.
- A full match ran to the score limit; the results screen shows the result, scoreboard, XP and coins; the saved profile gained XP, coins, a level-up and stats.
- Touch: floating joystick moves the player; AIM toggle on the sniper shows the scope at 20° FOV.
- Campaign still loads from the lobby with 775 doors and 28 guards, and the weapons fire as before.

Not tested: real-device performance and real multiplayer (bots stand in for online players; see README → Going online).

---

# Verification — v3

Tested in headless Chromium with software WebGL, including visual inspection of the game, soldier scale, weapons and mission screens.

Passed:
- All models and local modules load without page JavaScript errors.
- 28 soldiers spawn at collision-free positions, including 18 roof-covered indoor positions. Soldier standing height is approximately 1.85m.
- Authored walk and run motion changes leg-bone rotations; crouch lowers the body approximately 0.34m. Knife action changes 11 bones.
- Shots damage and kill a guard, including a crouched guard after adjusting aim; kills are counted. Headshot multiplier and magazine consumption work.
- Reload refills the magazine while subtracting exactly the rounds used from reserve ammo.
- Pistol, shotgun and suppressed M4 pickups unlock their slots and fire with their own ammunition.
- Medkit consumption and timed healing restore health.
- Alarm activation starts a live Web Audio siren; disabling a panel stops it.
- Closed door blocks movement at approximately 0.341m from the panel; open door allows passage. All 775 panels remain independently interactive, drawn in 31 batches.
- An indoor-to-exterior route contains traversable navigation nodes and reaches the starting-area grid.
- A watched guard enters SEEK_COVER and moves approximately 1.60m along a reachable cover route.
- A designated guard reaches an alarm control and triggers the active siren.
- Wall line-of-sight obstruction, crouch/stand heights, sprint stamina, jumping/landing and map controls pass.
- Both alarm controls and both intelligence interactions can complete, and returning to extraction displays Mission Complete.
- Restart clears mission state. Player damage can display Mission Failed.
- Original uploaded GLBs match the included originals byte-for-byte.

Tests use accelerated simulation for deterministic mechanics checks and selected real mouse/keyboard interactions. They are not a hardware frame-rate benchmark. Every location and physical touch device has not been exhaustively tested. Source-asset and procedural-animation limitations are documented in README.md.
