# v9.1 — Helicopter rear fix and natural climbing hands

- **`forest/cinema.js`:** `Helicopter.update` shows the cabin interior only when the camera is within 4.2 m of the cabin (it poked out of the tapered rear hull as a square box).
- **`forest/arms.js`:** `reach()` accepts a palm-facing `normal`, and the hand is rolled about its finger axis to match. There is a new `palmNormal()` helper.
- **`forest/fp.js`:**
  - New ladder, rope, swim and mantle poses with palm directions.
  - New `ladderGrip()` that puts each hand on a given rung height.
- **`forest/controller.js`:** `ladderHands()` keeps each hand on a real rung (world height) and moves it two rungs on with a reach arc.
- All v9.0 features retained.

# v9.0 — New places, river and town missions, swimming and climbing

- **New `forest/places.js`:** builds Kessel Docks and Old Kessel through the Structures helpers.
  - A generic multi-storey building generator: switchback stairs with collision ramps, slabs with stair openings and railings, walls with window and door openings, parapets, roof props, fire-escape ladders and balconies.
  - Props: cars, stalls, lamps, tanks, MG nests, the patrol boat and signs.
  - Guard posts go in `siteSpots.docks` and `siteSpots.town`, and anchors for the missions.
- **`forest/world.js`:**
  - `SITES` (docks frame derived from the river, town frame) with flattened pads; `inSite()` keeps grass off the paving.
  - A road to the town; the river depth goes from 1.5 to 2.9 m.
- **`forest/structures.js`:** calls `buildPlaces()` and has a `colOnly` list (invisible stair ramps).
- **New `forest/nav.js` (`ForestNav`):** terrain-relative `free`, `floor` and `inside`, and keeps guards out of deep water. It is identical to `Navigation` on the camp basin and in the village.
- **`forest/controller.js`:**
  - Swimming (`startSwim`, `swimStep`, `endSwim`; breath, dive, current, ripples, underwater state).
  - Mantling (`mantleProbe`, `tryMantle`, `mantleStep`).
  - Water ladders can be used while swimming.
  - Site-based enemy spawning (`enemies.site`, `count`; named and stationary posts always manned).
  - `dockBlast` and `relayBlast` cutscenes; map labels; the HVT is pre-marked.
- **`forest/missions.js`:** Missions 05 and 06; `reach` objectives accept `minY` (roof checks).
- **`forest/fp.js`:** breaststroke and mantle hand poses.
- **Other files:**
  - **`enemies.js`:** `playerHidden` (guards can't see you under water).
  - **`audio.js`:** `setUnderwater()`.
  - **`game.js`:** Space or touch JUMP mantles or climbs out; held jump and crouch drive swimming; SWIMMING, DIVING and CLIMBING stance labels; help text.
  - **UI and assets:** the underwater overlay and AIR meter (`index.html`, `style.css`); lobby cards and art (`assets/ui/m5.jpg`, `m6.jpg`); 24 new voice lines (`assets/vo`, 292 total).
- `sw.js` cache v9.0.0 and `package.json` 9.0.0.
- All v8.7 features retained.

# v8.7 — Brighter look, realistic foliage, recorded voices, new sound mix

- **`forest/world.js`:**
  - Brighter sky presets: exposure, hemisphere light, sun height and fog.
  - New branch-spray needle and leaf-cluster textures; denser and lighter pine whorls; lighter cores; brighter impostors.
  - 3-D blade grass clumps with per-instance colour.
- **`post.js`:** softer vignette and grain, and a black lift.
- **Voices:**
  - New `vo.js` (VoiceBank).
  - New `tools/build_voices.py`, plus `assets/vo/` (268 lines, ~3.9 MB).
  - `voices.js`, `forest/cinema.js` and `forest/controller.js` play the recorded lines, with prefetch of mission lines. The browser-voice fallback now picks the most natural voice.
- **`audio.js`:**
  - Master EQ, compressor and limiter; voice bus; dual reverb with an indoor switch; HDR ducking; radio squelch and static.
  - Re-layered gunshots with echo trains and a speed-of-sound delay; near-miss crack; bigger explosions; impact, kill and headshot sounds; casing landing by surface; running foley.
- **`game.js`:** an indoor check (ray above the player) switches the reverb.
- All v8.6 features retained.

# v8.6 — Rifle holding pose fix

- **`rifle.js`:** the rifle basis had the AK74M's magazine side (local −z) pointing up. The basis is corrected so local +z is up (sights up). The alternate-weapon mount is re-mapped to match.
- **Aim stance:** raised to cheek height (stock at the shoulder). The support hand is moved slightly back, and the reload magazine target is corrected.
- **`forest/blackveil.js`:** the firefight over-the-shoulder camera is re-framed.
- All v8.5 features retained.

# v8.5 — From the play-test recording: rifle handling in the film, opening, mobile UI

- **`rifle.js`:** carry poses are blended (draw, aim, lower, sling) instead of snapping, and the ready pose is lowered.
- **`forest/blackveil.js`:**
  - The hero's rifle is slung while sitting, roping or landing (the source model's inverted shoulder pose is no longer used in the film).
  - The two opening shots are replaced with a helicopter chase and a side-tracking shot, plus a location card.
  - The wrist close-up is reframed.
- **`controls.js`:** a touch-control editor (select, drag, size, hide/show, opacity, reset) and icon buttons.
- **CSS and menu:**
  - Decluttered phone and tablet HUD, plus a contextual USE button.
  - Collapsible pause-menu settings, a portrait toggle, and a simpler lobby on touch devices.
- All v8.4 features retained.

# v8.4 — Real gun models, proper weapon handling, smarter enemies

- **Viewmodels:** SMG, shotgun, sniper and .44 now use detailed models (`gunmodels.js`). They are mounted in the animated AK and pistol rigs, so they get real hands and the draw, fire, reload and inspect animations. On the long guns the magazine follows the rig's magazine bone.
- **Gun models elsewhere:** Dust Yard drops, forest mission pickups, city pickups and the gun picker preview use the same models. Weapon skins skip glass, red-dot, brass and rubber parts.
- **Third-person soldiers** (`rifle.js`):
  - The built-in shoulder pose is replaced by two-hand IK handling: ready, aim with pitch tracking, sprint carry, recoil, reload, throw, signals, scan, and a gun that drops with the body.
  - TDM and yard bots display their actual weapon. This also syncs online.
  - Cinematic actors keep their poses (rope uses the slung carry; sitting and landing use the original pose).
- **AI** (`tactics.js`, `tdm.js`, `enemies.js`):
  - Score-driven team plans (rush, flank, hold, regroup) with a leader hand signal and call-outs.
  - Magazines and reloads.
  - Cover and peek; fall back and request support.
  - Contact sharing and announced grenades.
  - New voice lines: reload, contact, grenade, cover, retreat, push, flank, hold, regroup.
  - Forest guards signal on alarm and flank during searches.
- **HUD:** kill badges moved above the streak banner, and nearby health orbs fade.
- All v8.3 features retained.

# v8.3 — Death Match, Snow map, gun picker, skins, comfort settings, faster loading

- **Mission 03 pre-match flow** (as in the reference video): mode → map → side → weapon → PLAY.
  - URL form: `?mode=yard&side=ct|t&map=dust|snow|random&dm=tdm|ffa`.
- **Death Match (free-for-all)** on the yard:
  - `TDMBots` gained a `foe()` check, map-wide spawns and free-for-all scoring (you vs. the leader).
  - The end screens and the TAB scoreboard rank all players.
  - Team matches are unchanged.
- **Snow map:** snow ground and caps, drifts, falling snow, an overcast sky and cold lighting. Random picks a map at load.
- **Gun picker** with a live 3D preview, stat bars, General/Special tabs, buying locked guns, and the skin row.
- **Weapon skins** (6 finishes, coins), stored per gun in the profile and applied to the gun only, in every mode (city, forest, TDM, yard).
- **Settings:**
  - field of view, shadows toggle, FPS counter
  - key remapping (applies in every mode)
  - touch-button layout editor
- **Loading:** the soldier model is compressed (29.5 MB → 8 MB, `tools/optimize_soldier.py`), and the loading screen rotates tips.
- **Fixes:**
  - The yard sky dome now fits inside the Performance camera range.
  - The weapon bar is hidden while paused.
- All v8.2 features retained, including the original Team Deathmatch arena, all missions, Nightfall (Mission 04), online play, kill cam and the utility wheel.

# v8.2 — Mission 03 replaced: Dust Yard (cargo-yard Team Deathmatch)

- New Mission 03 **Dust Yard**, recreated from the reference video, with original assets only:
  - **Mode:** 5 v 5 Team Deathmatch with a 4:00 clock; most kills wins.
  - **Sides:** pick Counter-Terrorist or Terrorist in the lobby, each with its own team look.
  - **Start and end:** VS roster intro, TEAM DEATHMATCH bar with a 3-2-1 countdown, red final-10-second count, then VICTORY → MVP line-up → SCORE (kills, deaths and the new assists).
- New procedural map (`yard.js`):
  - **Structures:** containers with ramps, crates, a warehouse and loading dock, a two-storey office, a market arcade, an archway, barriers and fence.
  - **Surfaces and sky:** graffiti, a skyline, a painted sky and sun shadows.
- New mission HUD:
  - minimap top-left, score top-right
  - AUTO AIM / AUTO FIRE / AUTO PICKUP toggles
  - KILL / HEADSHOT / BOMB KILL badges
  - bottom weapon bar with health
  - green and red team outlines
- New pickups and effects: green health orbs, weapon drops with pick-up-to-swap, green grenade smoke.
- Engine changes:
  - **TDM:** assists are tracked. Respawns avoid occupied spawn spots. Spawn width and team tints can be configured per map.
  - **Lobby:** mission cards can route to non-forest missions, and Dust Yard opens a side picker.
- **Nightfall** is preserved unchanged as Mission 04 (Archive). Progress saved under the old slot 3 is migrated to slot 4. `?mode=forest&m=3` links now open Dust Yard.
- All v8.1 features retained.

# v8.1 — Fixes from the play-test recording

- The opening film now runs on real time, so it lasts about 1:47 on slower PCs too (it had stretched to 2:36).
- Helicopter: the police livery is fully repainted in olive drab, and the hull is single-sided so the cabin shots no longer show its inner walls.
- Specter now stands on the skid at the door while hooking onto the rope, instead of appearing on the roof.
- Re-framed shots: helicopter over-the-shoulder, the eye close-up, the boots close-up, the top-down rope shot (Specter now visible), the binocular start (his helmet no longer appears in the lens), and the silhouette shot (no more black frame). The pine branch is cleared from the landing spot, and the firefight is no longer filmed through the fence. Each new shot snaps its camera on the first frame.
- Binoculars use one soft-edged two-lens mask, with no dark band where the lenses overlap (cutscene and gameplay).
- Searchlight beams are subtle at a distance and no longer show as solid white triangles from the air. Spotlight ground circles are no longer blown out. The alarm light is softer.
- Sunset grading no longer turns the hills pink.
- Distant trees use painted two-card impostors instead of black cones, including on far mountains. The near-tree radius is larger on Performance.
- Faster loading: collision terrain is independent of graphics quality and coarse beyond 300 m, trunk colliders are lighter, and the octree build uses an AABB pre-test (about 30–40 % faster in tests).
- Retry skips the opening film. Enter-to-retry uses the same path.
- Fairer Mission 01 start: no guards inside the facility, guards hunt at the fence where the shots were fired, 5 s of spawn protection and a 30 s accuracy grace period. Guard accuracy and damage are toned down overall.
- Bleeding is rarer and drains slower. The warning is a large centred banner ("BLEEDING — PRESS H › 1 MEDKIT"; "TAP MED" on phones).
- Objective labels shrink as you approach and hide when you're right on top of them.
- The low-health screen tint is capped, so you can still see.
- The HUD (minimap, footer, objectives, portrait) is hidden behind the briefing/pause menu and the binoculars.
- All v8 features retained.

# v8 — Charted Missions

- Rebrand to Charted Missions: title, icons, install name and menus. Progress is kept.
- New mobile-first main menu modelled on the supplied design: Play (hero mission card, multiplayer Quick Match / Host a Game, solo campaign progress, mission select), Operators, Loadout, Armory, Barracks, plus Settings and Quit dialogs. The menu art is rendered from the game itself.
- Operation Black Veil opening film (about 105 s) for Mission 01, following the storyboard and script. The Mission 01 story was reworked: comms facility, satellite key, 20-minute transfer deadline. The informant map and zip-line objectives moved to Mission 02.
- Valley expanded to 960 m with hills and mountains, rocky ridges, a 1 km river with a waterfall, plunge pool, mist and spray, river and waterfall ambience, wading and splashes, granite formations and cliffs, river stones, splat/triplanar terrain shading, more trees and a distant forest.
- Searchlight towers with volumetric beams, alarm beacons, floodlights, a satellite dish, blinking server racks and a countdown terminal.
- HDR post-processing (bloom, ACES, colour grade, vignette, CA, grain), Ultra/Balanced/Performance presets and dynamic resolution.
- Headshot slow-motion kill cam (bullet follow and orbit), with a setting toggle.
- Radial utility wheel (V / middle mouse / ◎ touch) with a slow-time effect, and a new flashlight.
- Uploaded recordings: rifle and pistol shots, jump, and walking/running loops.
- Operators with callsigns used in radio lines and barks.
- Responsive HUD tuning for phones, tablets and large desktops, and a rotate-to-landscape hint on phones.
- All v7 features retained.

# v7 — Ragdolls, blood, voices & emotions, cinematic VFX, online multiplayer, web app

- Physics ragdoll deaths for every soldier (campaign guards, forest militia, TDM bots, online players). Impulse from the killing shot, bigger throws from explosions, wall and floor collision, settles and sleeps; bots reset on respawn.
- Body language: flinch toward the side that was hit, limp when wounded, cower in fear, cheer after killing the player.
- Realistic blood: directional spray, mist, wall splatter behind targets, ground decals, spreading pools under bodies; blood on the screen edges when you are hurt, pulsing at low health.
- Voices & emotions: context lines for enemies (calm, suspicious, alert, alarm, search, angry, pain, fear, sad, happy) and for the player (kill, headshot, angry, pain, low health, heal, objective, alarm, death, victory). Emotional speech delivery, synthesized grunts, screams, laughs and sobs, speech bubbles, subtitles and an expression portrait.
- New particle VFX engine: flame and smoke atlas, fireballs, smoke columns, sparks, debris, shockwave, scorch marks, bullet holes, muzzle light; particle camp fires and the burning fuel depot.
- Lean (Z/X or touch buttons), searching bodies (E), damage direction indicators in the campaigns, TDM killcam.
- Online multiplayer: Node server with no dependencies (rooms, teams, scores, clock, chat, 20 Hz relay); remote players with ragdolls and nameplates; replicated shots, grenades and airstrikes; chat with quick-chat emotes; lobby card with the live room list; START_ONLINE_SERVER launchers.
- Web app: manifest, icons, service worker (offline shell, cached models), install button, fullscreen and landscape lock on phones, Apple home-screen meta.
- Fixes: the TDM result is judged from your own team; ragdolls cannot climb furniture.
- All v6 features retained.

# v6 — Gloved arms, animated guns, cinematic audio

- Gloved first-person arms replace the box hands for the rope descent, ladder, zip-line and all medical actions, posed with a new IK solver.
- New animated weapons: AK-74, AK-74U and an animated 9mm pistol (replaces the box pistol everywhere). Auto-fitted view-models, idle sway, draw/fire/reload/empty-reload/inspect clips, correct muzzle flash position.
- AK-74 and AK-74U added to the Armory, AI loadouts and forest missions (pickups, guard drops; Mission 3 starts with the AK-74).
- New audio engine: buses, compressor, outdoor reverb, layered per-weapon gunshots with distance echo, shell casings, bullet whiz, ricochets, grass footsteps, explosion muffle and ringing, mission ambience beds, dialogue ducking, music volume slider.
- New adaptive score with stealth/tension/combat states and cutscene cues; victory and defeat themes.
- Slow-motion headshot/multi-kill moments, film grain and cinematic vignette.
- Uploaded models' textures reduced (85 MB → 18 MB) with `tools/optimize_glb.py`.
- All v5 features retained.

# v5 — Story campaign: Operation Timberline

- New story campaign with three missions (Silent Descent, Eyes in the Trees, Nightfall) in a new procedural forest valley. Each mission has its own time of day, insertion and objectives.
- Cutscene system: letterbox, title cards, radio subtitles, optional browser voice narration, skippable. Helicopter insertion with flyover and first-person fast-rope descent. Mid-mission scenes for the camp reveal, mast explosion, fuel depot fire, prisoner rescue and helicopter extraction.
- Uploaded helicopter model added with spinning main and tail rotors, rotor sound, rope and banking flight.
- Forest world: terrain with mountains and clearings, sky shader and clouds, sun shadows, ~3,600 instanced trees with wind, rocks, ~22,000 grass tufts, roads.
- Camp and village: barracks, command house, shed, generator hut, radio mast, four watchtowers, fence and gate, sandbags, containers, trucks, four log cabins, camp fire; 12 opening doors.
- Ladder climbing, zip-line ride, bleeding and pain, medical kit menu (medkit, medicine, aspirin injection) with first-person animations, binoculars with enemy marking, satellite map, compass bar.
- Guards can be placed on watchtower platforms as stationary sentries (backwards compatible change to `enemies.js`).
- Suppressor now mounts on the rifle barrel and follows its animations.
- Mission rewards: XP, coins, ghost bonus for no alarms; completed missions are marked in the lobby.
- Phones default to the Performance quality setting.

# v4 — Strike update (Team Deathmatch)

- New lobby with Play, Loadout, Armory and Profile tabs. Progress saves in the browser.
- New Team Deathmatch mode: 5 v 5 with AI squads on the original TDM district (doorways opened, perimeter walls and cover added). First to 30 kills or 5:00.
- Bot AI for team play: target acquisition by line of sight, reaction delay, strafing, crouching, weapon-appropriate range, hunting, hearing, grenades, respawns, three difficulty levels. Soldiers tinted per team with name tags.
- Respawn with spawn protection, health regeneration, kill feed, multi-kill banners, XP pops, headshot hit markers, directional damage indicator, death screen, Tab scoreboard, results screen with XP/coins/level-up.
- Killstreaks: UAV (3), armor drop (5), airstrike (7).
- Frag grenades with bouncing physics and radius damage. Explosion effects and sound.
- New weapons: K9 SMG, LR-7 sniper (scope overlay), .44 magnum. Per-weapon recoil with recovery, hip-fire spread, aim-down-sights movement in TDM.
- Progression: 30 levels, coins, weapon unlocks by level, 3-tier upgrades (damage, magazine, reload), loadouts, daily supply streak.
- Mobile-first touch controls: floating joystick, push-to-sprint, dual fire buttons, auto-fire, aim/crouch toggles, grenade and scoreboard buttons.
- Settings (sensitivity, quality, volume, mute, auto-fire, difficulty) now persist.
- Campaign mode unchanged and reachable from the lobby.

# v3 — Tactical gameplay update

- Added 28 source-model guards, including 18 indoor placements, patrols, hearing, detection, pursuit, cover, crouching, alarms, damage and death behavior.
- Authored missing locomotion and crouching motion on the soldier's skeleton; source model contains only a stay-pose clip.
- Added pistol, shotgun and suppressed-M4 pickups, finite ammo supplies, ammo drops, medkits, health and armor.
- Added original muzzle-flash, smoke, tracer and impact effects; synthesized weapon, movement, interaction and siren audio; volume/mute controls.
- Added two alarm-control objectives, two intel terminals, extraction, death/completion screens and a complete restart flow.
- Retained the existing city, all 775 doors, original knife/M4 rigs, movement, minimap, stamina, sensitivity/quality settings, touch input, launchers and bundled offline dependencies.
- Grouped door rendering into 31 instanced batches while retaining individual hinges and collision.
- Fixed shot-ray camera matrix updates and guarded large pointer-lock mouse jumps.

New controls: 3/4/5 additional weapons, Q cycles available weapons, RMB aims, H heals, E operates pickups/consoles as well as doors. T remains reload and R remains position reset.
