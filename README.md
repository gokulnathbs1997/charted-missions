# Charted Missions (v9.1)

*(formerly Concrete Quarter: Strike)*: a cinematic browser FPS and installable web app with four ways to play:

- **Team Deathmatch (new)**: fast 5 v 5 arena matches in the style of mobile online shooters. Respawns, kill feed, scoreboard, killstreaks, grenades, XP levels, coins, an armory with weapon upgrades, loadouts and daily rewards.
- **Operation Black Veil (story campaign)**: five missions in a large forest valley (plus the Dust Yard team match as Mission 03). They have cinematic intros, helicopter insertion, ladders, a zip-line, a medical kit, binoculars and a satellite map. Mission 01 opens with the 105-second Black Veil film.
- **Operation Silent Grid (original campaign)**: the v3 stealth mission across the 650 × 650 m city.
- **Online multiplayer**: team deathmatch with real players (up to 10 per room) over your network or the internet, with live chat and quick-chat emotes.

## Run
1. Extract the whole ZIP.
2. Install Python 3 if needed (enable Add Python to PATH on Windows).
3. Double-click **START_WINDOWS.bat** (macOS/Linux: `sh START_MAC_LINUX.sh` or `python3 start.py`). Keep the terminal open.
4. The lobby opens. Pick **Deploy** (Team Deathmatch) or **Start Mission** (campaign).

The launcher serves on localhost port 8000 (or the next free port up to 8020). No npm install, API keys or internet connection is needed. Opening index.html directly will not load the models. Use a WebGL 2 browser with hardware acceleration (Chrome, Edge, Safari 16+).

Phones: the files must be served over HTTP(S) from somewhere the phone can reach. The easiest way is the online server below (`START_ONLINE_SERVER`), which also listens on your LAN. Any static host works too. The Python launcher binds to localhost only.

## v9.1 — Helicopter rear fix and natural climbing hands
- **Helicopter:** the square box that showed through the back of the helicopter from outside is gone. It was the cabin interior. The interior now only appears when the camera is inside the cabin or at its door, so the shots inside the helicopter in the opening film look exactly as before.
- **Ladder hands:**
  - You see the backs of the gloves, knuckles up, fingers wrapped over the rung and palms toward the ladder.
  - The hands stay on the real rungs while you climb past them, then reach up two rungs, alternating left and right.
- **Rope hands:** hand over hand on the rope, left hand above and right hand below. The fingers wrap round the rope from each side with the backs of the gloves toward you, in the insertion cutscenes and in the opening film.
- **Swimming and mantling hands** use the same palm-facing control: palms down and sweeping out on the stroke, and palms flat on the ledge when you climb up.
- The gloves, arm model, environment and everything else are unchanged.

## v9.0 — New places, river and town missions, swimming and climbing
- **Two new places on the valley map** (they appear on the minimap and the satellite map in every mission):
  - **Kessel Docks**, a militia river outpost on the east bank. It has a concrete quay, a T-pier with a moored patrol boat, a brick boathouse, a two-storey harbour office (with a fire-escape ladder and a rooftop), fuel tanks with a pump, two MG nests over the water, a watchtower, and ladders down into the river.
  - **Old Kessel**, a town north-west of the village, reached by a new road. It has asphalt streets, a stone square with a fountain, and twelve buildings: the 4-storey Hotel Kessel, the 3-storey Town Hall, apartments, a market hall and eight houses.
    - Interiors: switchback stairwells between floors, doors, window openings you can shoot through, furniture, and lit ceilings.
    - Flat roofs with parapets: rooftop terraces with tables and umbrellas, water tanks, a radio relay and sandbag nests.
    - Climbing routes: fire-escape ladders, a dumpster-to-balcony route on the apartments, and stairs up to the roof of every building.
    - Street details: cars (one burnt out), market stalls, lamp posts, barricades and the town gate.
- **Swimming:**
  - The river is now deep enough to swim. Walk in and you start swimming; your weapon is stowed.
  - **C** (crouch) dives, **Space** surfaces, and **Shift** swims faster. A current pushes you downstream.
  - Under water the view turns murky blue and sound is muffled. Guards cannot see you, and an **AIR** meter appears. After about 20 s without air you start taking damage.
  - Use **E** on the water ladders, or **Space** at a low pier or bank to climb out.
- **Climbing (mantle / vault):** press **Space** facing a ledge 0.5–2.3 m above your feet (up to 2.6 m from the water) to climb up and over it. This works on crates, sandbags, walls, the fountain, the dumpster, balconies, the pier and the boat. A **SPACE — CLIMB UP** prompt shows when it is possible.
- **Mission 05 — River Run** (morning):
  1. Insert upstream on the west bank and swim the river under the MG nests.
  2. Climb the pier ladder.
  3. Steal the cargo manifest from the upstairs office.
  4. Plant charges on the patrol boat and the fuel pump, and get clear before the blast.
  5. Swim back across to the LZ.
- **Mission 06 — High Ground** (sunset):
  1. Push up the road into Old Kessel.
  2. Clear the Hotel Kessel floor by floor and take the ledger on the 2nd floor.
  3. Climb to the rooftop terrace and take the sniper rifle there.
  4. Eliminate the spotters on every roof, then the commander on the Town Hall roof (he is marked).
  5. Blow his radio relay and fight your way down to the square for pickup.
- **Guards on high ground:** sentries hold rooftops, windows, upper floors, the watchtower, the MG nests, the pier and the boat. Street and ground-floor guards hunt you across the town and docks with terrain-aware pathfinding, and they don't wade along the river bed.
- **Also new:** lobby cards with art for both missions, 24 new recorded voice lines, and two new cutscenes (the docks blast and the relay blast).
- Missions 01–04, Team Deathmatch, Dust Yard, Silent Grid and online play are unchanged.

## v8.7 — Brighter look, realistic foliage, recorded voices, new sound mix
- **No more dark scenes:**
  - The sunset and dusk skies (opening film, Missions 01 and 04) and the morning and fog skies are brighter: more sky light, higher exposure, a slightly higher sun.
  - Lighter shadow fill, a softer vignette and a gentle black lift in the colour grade, so shadows are no longer crushed.
- **Realistic trees and grass:**
  - Pines are built from painted branch sprays (branches with needles), roughly 50 % more of them, with lighter greens, sunlit tips and a smaller, lighter inner volume. They no longer read as black cones.
  - Broadleaf trees use leaf clusters made of individual leaves with veins.
  - Distant tree impostors are re-painted to match.
  - Grass is now real 3-D clumps of curved, tapered blades (18–30 per clump) with dark roots and lighter tips, wind sway, and per-patch colour variation (lush and dry).
- **Recorded voices** (`assets/vo`, built by `tools/build_voices.py`):
  - Every briefing, radio call, cutscene line, soldier bark and operator line (268 lines) is pre-rendered with an offline neural voice. It replaces the robotic browser speech.
  - Each character has its own sound: Control and the pilot over a band-limited radio with squelch clicks and static; the operator in person; two different enemy voices; Agent Mira Sol.
  - Lines follow the chosen operator's callsign.
  - Soldier barks are positioned in the world (pan, distance and air absorption).
  - Any line without a recording falls back to the best natural voice installed in the browser.
- **New sound mix:**
  - Master chain: glue EQ → bus compressor → brick-wall limiter.
  - **Dialogue bus:** dialogue ducks music and ambience.
  - **"HDR" mixing:** your gunfire and explosions briefly pull the ambience down.
  - **Reverb:** an outdoor valley reverb and a room reverb, switched automatically when you go indoors.
  - **Gunshots** are layered:
    - transient crack, recorded body, low-end punch, stereo early reflections
    - a rolling terrain-echo tail outdoors and a short room tail indoors
    - distant shots arrive late (speed of sound) and lose their highs
    - surface-aware shell casings
  - **Other effects:**
    - supersonic crack + whizz for near misses
    - layered explosions (crack, body, sub, debris rain, rolling echoes)
    - body-impact hit and kill sounds with a helmet ping on headshots
    - gear foley when running
- Fixed: Agent Mira Sol now calls the player by the chosen operator's name.

## v8.6 — Rifle holding pose fix
- **Upright rifle:** every soldier's rifle (the hero in the opening film, forest guards, TDM and Dust Yard bots, online players) was rolled 180° around the barrel, so the magazine and pistol grip pointed up. It is now upright: sights on top, magazine and grip down, barrel forward.
- **Aiming pose:** the stock sits in the right shoulder with the rifle at cheek height. The right hand is on the pistol grip and the left hand supports the handguard, a little closer to the body.
- **Other guns:** the M4, SMG, shotgun, sniper and suppressed M4 shown on bots use the same corrected alignment.
- **Animations:** idle, walking, sprinting, crouching, aiming, firing (recoil), reloading, grenade throws, hand signals, the sling and death drops all use the corrected orientation.
- **Opening film:** the over-the-shoulder firefight camera is re-framed for the new, higher rifle position.

## v8.5 — Cinematic rifle handling, new opening, clean touch UI with custom controls
- **Rifle handling in the opening film:** the rifle no longer flips to the old upside-down shoulder pose while sitting in the helicopter, on the rope or when landing. It is slung on the back, then smoothly drawn into the hands. Every change of carry (draw, raise to aim, lower) is blended over ~0.5 s instead of snapping.
- **New opening:** the film now starts on the helicopter itself — a low chase over the treetops with a typed location card ("VARGA VALLEY · 18:42 · INSERTION"), then a close side-tracking shot against the sunset — instead of a distant view of the forest. The wrist-device close-up is now an over-the-eyes shot.
- **Customize controls (phones and tablets):** in the pause menu (🎮 Customize controls) or in the lobby Settings.
  - Tap any control and drag it anywhere.
  - Set its size (60–160 %), hide or show it, and set the overall button opacity.
  - Reset restores the defaults. Saved on the device.
- **Cleaner touch UI:**
  - Buttons show icons instead of text.
  - Hidden by default (all can be turned back on in the editor): lean, left-fire, binoculars and map buttons. They remain available in the ◎ utility wheel.
  - The USE button only appears when there is something to use.
  - Hidden on phones and tablets: the header, weapon name, key hints, stance and stamina text, coordinates and the character portrait. The portrait can be turned back on in settings.
  - Shorter objective box, a 3-line kill feed and a compact ammo counter.
- **Simpler pause menu:** title, a 2-line briefing, a big button and "Customize controls". Every other setting sits under "⚙ Settings & controls", which opens by default on desktop.
- **Simpler lobby on touch devices:** mission blurbs and the intel strip are hidden.

## v8.4 — Real gun models, proper weapon handling, smarter enemies
- **First-person guns:** the SMG, pump shotgun, LR-7 sniper and .44 were simple block models with box hands.
  - They are now detailed models (`gunmodels.js`): bevelled receivers, rails, red dot and scope with lenses, fluted barrel, muzzle devices, shell carrier, wood and polymer furniture.
  - They are held by the same animated gloved hands as the AK and the pistol, with real draw, fire, reload and inspect animations. On the long guns the magazine moves with the reload animation.
- **Same models elsewhere:** dropped weapons in Dust Yard, mission weapon pickups, the city campaign pickups and the 3D gun picker all use the detailed models.
- **Enemy gun handling:** soldiers no longer carry the rifle on the shoulder (the source model's only pose).
  - The rifle is held in both hands with arm IK: low-ready, shouldered aim that tracks the target up and down, across the chest while sprinting, recoil per shot, reload (support hand to the magazine and the pouch), grenade throw, hand signals and look-around scans.
  - Shots come from the muzzle. On death the gun falls with the body.
  - Team Deathmatch and Dust Yard bots show the gun they actually use (M4, AK-74, AK-74U, SMG, shotgun, sniper, suppressed M4).
- **Enemy tactics** (`tactics.js`):
  - Each team runs a plan that changes every 15–25 s based on the score: RUSH, FLANK, HOLD or REGROUP. The squad leader announces it with a hand signal and a call-out.
  - Soldiers track magazines and reload ("Reloading!"). When hurt or reloading under fire they take cover and peek out to shoot. Badly hurt soldiers fall back and call a teammate in.
  - Spotted enemies are shared with nearby teammates. Grenade throws are announced ("Frag out!").
  - Forest guards use hand signals when the alarm goes off, and search parties fan out to the sides.
- **Fixes from the play-test video:**
  - Kill badges no longer overlap the DOUBLE / TRIPLE KILL banner.
  - Health orbs fade and shrink when you are right next to them, so they no longer block your view.

## v8.3 — Death Match, Snow map, gun picker, skins, comfort settings
- **Pre-match flow for Mission 03:** MODE → MAP → SIDE → WEAPON → PLAY.
  - **Mode:** Death Match (free-for-all) or Team Death Match.
  - **Map:** Random, Dust or Snow.
  - **Side:** Counter-Terrorist or Terrorist (Team Death Match only).
- **Death Match (free-for-all):** 10 players, everyone is an enemy (red outlines). Players spawn across the whole map. The clock runs 4:00. The score shows YOU against the LEADER. The end screens rank all ten players.
- **Snow map:**
  - Packed snow with tyre ruts, and snow caps on every wall, container, crate and roof.
  - Drifts along the walls, falling snow, an overcast sky and fog, and cold lighting.
  - Random picks Dust or Snow each time.
- **Gun picker:**
  - A turning 3D gun with bars for Damage, Rate of Fire, Range, Accuracy, Magazine and Reload Speed.
  - General (primary) and Special (secondary) tabs and a weapon strip. Locked guns show their price and can be bought there.
- **Weapon skins:**
  - Desert Tiger, Neon Viper, Arctic Hex, Royal Purple, Inferno and Gold Rush, bought with coins and set per gun.
  - Skins appear on your first-person gun in every mode. Hands and arms keep their original look.
- **Settings** (main-menu gear and pause menu):
  - field of view (60–100°)
  - real-time shadows on/off
  - an FPS counter
  - **key remapping** (click an action, press a key; Backspace resets it, and Reset All restores every default)
  - **drag-to-move touch buttons** on phones (Edit touch layout → drag → Done; Reset restores the defaults)
- **Faster loading:**
  - The soldier model is 8 MB instead of 29.5 MB. Face, hands and shirt textures stay at full resolution for close-ups.
  - Rotating tips show on the loading screen.

## v8.2 — Mission 03: Dust Yard
Mission 03 is now **Dust Yard**, a 5 v 5 Team Deathmatch in a sunny desert cargo yard, recreated from the reference gameplay video. Everything is built from original procedural geometry and canvas-painted textures; no assets from the reference game are used.
- **Flow:** in the lobby, choose Mission 03 and pick a side, **Counter-Terrorist** or **Terrorist**. A VS line-up shows both rosters, then the green **TEAM DEATHMATCH** bar and a 3-2-1 ring. There are 4:00 on the clock and the team with the most kills wins. You respawn in 4 seconds, and big red numbers count the last 10 seconds.
- **End screens:** **VICTORY / DEFEAT** with team scores (10 per kill), then an MVP line-up, then the **SCORE** table (kills · deaths · assists), with Play Again and Lobby buttons.
- **Map (72 × 100 m):**
  - Plaster perimeter walls with a teal band.
  - A two-storey yard office with a balcony at the north end.
  - A long brick warehouse with roller shutters and a loading dock (ramps at both ends).
  - A covered market arcade with checker tiles.
  - An archway divider and a doorway wall.
  - 14 shipping containers (CARGO stencils, some stacked, two with plywood ramps you can run up), crate stacks, concrete barriers and a chain-link corner.
  - Red graffiti arrows and tags, a skyline beyond the walls, and a painted blue sky with cumulus clouds.
  - Bright sun with real-time shadows (Balanced/Ultra).
- **HUD:**
  - Minimap top-left with the kill feed under it.
  - Blue/red score boxes and the clock top-right.
  - **AUTO AIM / AUTO FIRE / AUTO PICKUP** toggles (click or tap; saved).
  - **KILL / HEADSHOT / BOMB KILL** skull-shield badges that stack for multi-kills, and a red hit-marker.
  - A bottom weapon bar (primary · knife · pistol, tap to switch) with ammo and a green health bar.
  - Teammates have a green outline and enemies a red one.
- **Pickups:**
  - Green **+** health orbs (+40, respawn in 20 s).
  - Every fallen soldier drops his gun (green outline). Walk over it with Auto Pickup on, or press E, to swap your primary.
  - Grenades burst in green smoke.
- **Nightfall is kept:** it moved unchanged to **Mission 04 (Archive)** in Mission Select, with its prisoner rescue, codebook, dusk sky and western insertion. Saved progress is migrated.
- Direct link: `?mode=yard&side=ct` or `?mode=yard&side=t`.

## v8 highlights: Charted Missions
- **New main menu** in the Charted Missions style:
  - Tabs: Play, Operators, Loadout, Armory, Barracks.
  - **Play** has the Operation Black Veil hero card with DEPLOY, a Multiplayer card (Quick Match, Host a Game, rooms/server and bot training) and a Solo Campaign card with progress.
  - **Mission select** lists all four ops.
  - **Footer** shows the daily supply and your current loadout.
  - Settings (gear) and Quit (power) buttons.
  - The layout is mobile-first: phone portrait, phone landscape, tablet and desktop.
  - The menu art is rendered from the game's own engine (`assets/ui/`). Swap in your own images with the same file names.
- **Black Veil opening film (Mission 01).** It follows the storyboard and script:
  1. Aerial establishing shot at sunset, with searchlights and smoke.
  2. Inside the helicopter: wrist device, boots, eye close-up, the "Specter / Control" radio exchange.
  3. Rope drop with a slow-motion jump.
  4. Slow-motion landing and a 180° orbit that reveals the base.
  5. Binocular recon, a telephoto watchtower shot and the wrist display, with the typed objective HUD.
  6. Stealth approach while a searchlight sweeps over the cover rock, and a guard silhouette in a floodlit doorway.
  7. First contact: the alarm sounds, a short firefight, one slow-motion impact in the searchlight beam and a headshot ragdoll.
  8. The countdown terminal and server racks seen through the window, a face close-up under red lights, and a dolly to the door.
  9. The CHARTED MISSIONS / OPERATION BLACK VEIL title, then the camera lands exactly on the first-person camera and you take control.

  Skip with Space/Enter/tap. Mission 01 is now the Black Veil story: infiltrate the comms facility, recover the satellite key, cut the alarms, blow the uplink mast before the **20:00 satellite transfer** runs out, then exfiltrate. The informant's map and the zip-line moved to Mission 02, so every earlier objective type is still in the campaign.
- **Bigger, more realistic valley:**
  - The playable area is 960 × 960 m (up from 720 m), ringed by hills and mountains with rocky ridges and distant forested peaks.
  - A river runs about 1 km from a gorge down a **25 m waterfall** (spray, mist and roar) into a plunge pool, then winds through the valley.
  - Wading slows you down and splashes.
  - Granite domes and cliffs, river boulders, and terrain shading that blends grass, forest floor and triplanar rock by slope.
  - More trees, plus searchlight towers, alarm beacons, a satellite dish and live server racks in the comms facility.
- **Cinematic rendering ("Ultra"):**
  - HDR post-processing with bloom, ACES filmic grading, cool-shadow/warm-highlight split toning, vignette, chromatic aberration and grain.
  - Kill-cam and slow-motion grading.
  - Dynamic resolution keeps phones near 50 fps.
  - Graphics presets: Ultra, Balanced (phone default) and Performance.
- **Headshot kill cam:** a headshot kill (with a cooldown) shows a bullet-follow shot, then a slow-motion orbit as the enemy ragdolls. Toggle it in Settings.
- **Utility wheel:** hold **V** (or the middle mouse button, or tap ◎ on touch). Time slows while it is open (offline). It holds your weapons, knife, frag, medical kit, binoculars, map, a **new flashlight** and quick chat (online).
- **Your sounds:** recorded rifle and pistol shots (pitch-varied per gun, with distance filtering and the original echo layers), a jump sound, and walking/running footstep loops matched to your speed. Footsteps are muffled when wading.
- **Operators:** Specter (default), Hawk, Viper and Ghost (unlocked by level). Your operator is your callsign in radio lines and voice barks.
- **Rebrand:** the title, app icons and install name are now Charted Missions. Saved progress carries over.

## Online multiplayer (new in v7)
1. Install **Node.js 18 or newer** (https://nodejs.org) on one computer. It acts as the host.
2. On that computer, double-click **START_ONLINE_SERVER.bat** (macOS/Linux: `sh START_ONLINE_SERVER.sh` or `npm run online`). It prints addresses such as `http://localhost:8080` and `http://192.168.1.20:8080`.
3. Everyone opens the **Friends on LAN** address in their browser (phones work too). In the lobby, the **Play with friends** card shows the open rooms. Type a room name, or click a room, then press **Join online**. Friends in the same room play together.
4. To play over the internet, run the server on a machine with a public address or port forward, or put it behind any HTTPS host or tunnel. On HTTPS the game connects with `wss://` automatically. You can also type a server address in the card (for example `myserver.com:8080`) when the page is hosted somewhere else.

How it works:
- `server/server.mjs` is a small Node server with no dependencies. It serves the game and runs the WebSocket rooms: roster, team balancing, scores, the 5-minute match clock, the end of match and a 12-second intermission, chat, and movement relayed 20 times a second.
- Each player's own browser is authoritative for their health, the way many browser shooters work. Shooters report hits, and victims apply the damage and report their deaths. Grenades and airstrikes are replicated, so each player works out their own blast damage.
- Remote players are the same tinted soldiers as the bots, with name plates, smooth movement, gun sounds, tracers, bullet whiz and ragdoll deaths. The killfeed, scoreboard (Tab), killstreaks, UAV and airstrike all work online.
- **Chat:** press Enter or Y (or the CHAT button on phones). Keys 1–7 send quick-chat emotes such as "Nice shot!", "Need backup!" or "GG!". They show above your soldier in an emotional speech bubble for the other players.
- The bot modes and the story campaign work offline as before. If the online server cannot be reached, the game says so and offers offline play with bots.

## Install as an app (new in v7)
The game is now a Progressive Web App: it has a manifest, icons and a service worker.
- In Chrome or Edge on `localhost` or HTTPS, an **Install app** button appears in the lobby (or use the browser's install icon). On iPhone and iPad, use Share › Add to Home Screen.
- Once installed it opens fullscreen in landscape like a native game. The code is cached for offline use, and every 3D model is cached the first time it loads.
- On phones, pressing Play also enters fullscreen and locks to landscape where the browser allows it.
- Browsers only enable service workers on `localhost` or HTTPS. A plain-HTTP LAN address still plays fine but cannot be installed.

## v7 highlights: realistic deaths, blood, voices & emotions, cinematic fire
- **Ragdoll deaths** (`ragdoll.js`): enemies no longer freeze like statues. When killed, the soldier's skeleton becomes a physics ragdoll that takes the impulse of the killing shot. Headshots snap the head back, explosions throw bodies, and bodies crumple against walls and stairs and settle on the ground. It works in all modes, including online players and TDM bots (reset on respawn).
- **Body language:** hit soldiers flinch toward the side they were hit, limp when badly wounded, cower when afraid, and cheer when they kill you.
- **Realistic blood:** directional spray and mist on every hit (heavier for headshots), splatter on the wall behind the target, blood decals on the ground, and a pool that spreads under bodies. When you're hurt, blood splatters on the screen edges and pulses at low health.
- **Voices and emotions** (`voices.js`):
  - Enemies talk and react: bored chatter on patrol, suspicious ("Who is there?"), alert, raising the alarm, searching, angry when hurt ("You will pay for that!"), pain, fear and panic when wounded or outnumbered, grief or rage when a comrade dies nearby ("No! They got Viktor!"), and laughing and celebrating when they kill you.
  - Your character (Hawk) reacts too: kill and headshot lines, anger and pain when hit, a "low health" plea, relief after healing, happiness when objectives are done, a sob on death, and victory.
  - Each line is voiced with emotional delivery (speed, pitch and volume per emotion, a different voice per soldier, and loudness and stereo by distance). Each also has a synthesized vocal layer: grunts, screams, laughs, sobs, shouts and panicked cries.
  - Speech bubbles appear above the soldier in the emotion's color, with subtitles at the side. The voice toggle in the pause menu mutes the spoken words.
  - An **expression portrait** next to your health bar shows your character's face: calm, angry, happy, scared, in pain, crying. It gets bloodied as your health drops.
- **Fire and explosions** (`effects.js`), rebuilt like modern games:
  - GPU particle system with an animated flame and smoke atlas, soft billboards and fog.
  - Explosions have a flash of light, a rolling fireball, a rising smoke column, sparks, flying debris, a ground dust ring, a heat shockwave and a scorch mark.
  - Camp fires and the burning fuel depot are now real particle fires with smoke and flickering light.
  - Bullet impacts throw sparks and dust and leave bullet holes. Muzzle flashes light the scene.
- **New gameplay features:**
  - **Lean** left and right with Z / X (or the LEAN buttons on phones) to peek and shoot around corners.
  - **Search bodies** with E for ammunition and medical supplies.
  - **Damage direction indicators** now appear in the campaigns too.
  - **Killcam:** in TDM your camera turns to face the player who killed you.
- **Fixes:** the TDM result is now judged from your own team (needed online, where you can be red). Ragdolls cannot climb furniture.

## v6 highlights: new hands, new guns, movie-style sound
- **Gloved first-person arms** (`fps_arms_gloved.glb`) now perform the fast-rope descent, ladder climbing, zip-line, medkit, pills and aspirin injection. The model has no animations, so the arms are posed live by a two-bone IK solver (`forest/arms.js`). The gripping finger pose is borrowed from the AK rig, which uses the same skeleton naming.
- **New animated guns:**
  - **AK-74** (Armory, level 4)
  - **AK-74U** (Armory, level 2)
  - **animated 9mm pistol**, replacing the box pistol in every mode

  Each has draw, fire, reload, empty reload, idle sway and inspect/melee animations. `viewmodels.js` fits them to the view automatically and cuts their single "all animations" clips into named moves. The forest missions use them too: Mission 3 starts with the AK-74, AKs can be found in the camps, and guards sometimes drop their AK. AI soldiers in Team Deathmatch carry them.
- **Adaptive movie score** (`music.js`): an original soundtrack synthesized live. It has strings pad, ostinato pulses, taiko, snare and hi-hat drums, "braam" brass hits, risers, impacts and a heroic lead theme. It follows the game: calm while undetected, tension when spotted, full combat drums under fire or alarm, and victory and defeat themes. Cutscenes are scored shot by shot: title impact, drum build over the flyover, riser into the rope drop, hit on landing, reveal theme over the camp, heroic theme at extraction.
- **Sound effects** (`audio.js`):
  - Separate music, effects and ambience mixes into a compressor, with an outdoor reverb.
  - Layered gunshots per weapon (crack, body, thump, reverb tail, and a valley echo for distant fire). Shell casings, bullet whiz past your head from the correct side, and ricochets.
  - Grass and hard-floor footsteps.
  - Ambience: wind and birds, crickets at dusk, thunder in the fog, city hum.
  - Explosions muffle your hearing and leave a short ringing.
  - Dialogue ducks the music. Music volume has its own slider in the pause menu.
- **Action-movie feel:** headshot kills and multi-kills trigger a brief slow motion with muffled sound and a desaturated frame. Film grain and a stronger vignette, especially in cutscenes.

## Story campaign: Operation Timberline (new in v5)
Three story missions in a forest valley, in the style of classic tactical shooters such as IGI. Pick them in the lobby under **Story campaign**.

| Mission | Time | Story |
|---|---|---|
| 01 · Silent Descent | Morning | Fast-rope from a helicopter, recover the informant’s map in the forest village, ride the zip-line from the ridge into Camp Varga, disable two alarm panels, plant C4 on the radio mast, download the convoy data, extract by helicopter. |
| 02 · Eyes in the Trees | Heavy fog | Ridge drop, collect a hidden sniper rifle, eliminate the four watchtower sentries, steal the patrol schedule, torch the fuel depot, extract. |
| 04 · Nightfall *(Archive — formerly Mission 03)* | Dusk | Infiltrate from the west, free a captured agent from the command house (this triggers the alarm), take the cipher codebook, fight your way to the LZ. |

- **Cinematics:** each mission opens with a widescreen story intro: title card, radio briefing with subtitles and optional voice narration from the browser's built-in voice, a helicopter flyover, and a first-person fast-rope descent. Mid-mission scenes play when you first see the camp from the ridge, when the mast or fuel depot blows, when the agent is freed, and when the extraction helicopter lands. Press Space, Enter or E, or tap, to skip.
- **World:** a 720 m valley with mountains on every side, about 3,600 pines and broadleaf trees swaying in the wind, rocks, about 22,000 grass tufts, dirt roads, clouds and sun shadows.
  - **Camp Varga:** fence and gate, two barracks with bunks, the command house, a storage shed, a generator hut, a 20 m radio mast, four watchtowers with ladders, sandbags, containers and trucks.
  - **Forest village:** four log cabins around a camp fire.
  - All 12 doors open.
- **Ladders:** walk to the foot of a watchtower ladder and press E. W/S climbs; at the top you step onto the platform. E lets go.
- **Zip-line:** at the ridge-top platform press E to hook on. You accelerate down the cable into the camp and drop off at the end.
- **Medical kit (H):** opens the medical menu.
  - **1 Medkit:** dress wounds, +55 health, stops bleeding.
  - **2 Take medicine:** painkillers, +20 health, steadies the aim shake you get at low health.
  - **3 Inject aspirin:** syringe, +35 health instantly plus slow regeneration.
  - Each has its own first-person animation. Heavy hits can make you bleed until you use a medkit. More supplies are hidden around the map.
- **Binoculars (B):** zoom with the mouse wheel. Enemies you look at get a red marker, which also shows on your map.
- **Satellite map (M):** terrain, buildings, zip-line, marked enemies, your position, and the objective list.
- **Other HUD:** compass bar with an objective marker, a minimap that follows you, and a stealth detection meter.
- **Stealth:** guards patrol and guard the watchtowers. They react to sight and noise, take cover, and run to alarm panels. Finishing a mission without an alarm earns a ghost bonus.
- **Weapons:** knife, pistol, (suppressed) M4. The sniper rifle and shotgun are picked up or included depending on the mission. Frag grenades on G.

Controls (desktop): WASD move · mouse look · Shift sprint · Space jump · C crouch · LMB fire · RMB aim/scope · R reload · G grenade · E use (doors, ladders, zip-line, objectives) · H medical · B binoculars · M map · 1–5 weapons · Esc pause.
Touch: same as Team Deathmatch, plus USE, MED, BINO and MAP buttons.

### Models that would make it look more realistic
The forest, buildings and first-person hands are generated in code. These GLB models would be drop-in upgrades:
1. A realistic pine and a broadleaf tree (game-ready, low poly).
2. A wooden cabin or house.
3. A soldier with walk, run, shoot and death animations (Mixamo). The current soldier has a single pose, and its motion is generated in code.
4. First-person arms holding a rifle, plus climbing and medical animations.

## Team Deathmatch
- **Match:** you plus 4 AI squadmates (blue) against 5 AI opponents (red) on the original TDM district. The painted doors are opened into walk-through doorways, and the arena adds perimeter walls, crates, barriers and containers for cover. First team to **30 kills** wins, or the most kills when the **5:00** clock ends.
- **Respawn:** 4 seconds after death, at your team's spawn line, with 2.5 s of spawn protection. Ammo and grenades refill. Health regenerates after 4 s without damage.
- **Killstreaks** (reset on death): **3** UAV (all enemies on the radar for 20 s) · **5** armor drop (+100 armor) · **7** airstrike (explosions on every living enemy).
- **Feedback:** kill feed, multi-kill banners (double, triple…), XP pops, red-dot hit markers for headshots, directional damage arcs, death screen showing who killed you, scoreboard (Tab).
- **Radar:** allies always show. Enemies show when you can see them, when they fire unsuppressed weapons, or during UAV.
- **Bots:** each bot picks a random weapon per life (rifle, SMG, shotgun, sniper, suppressed rifle). Bots spot targets with line of sight and a field of view, have a reaction delay, strafe and crouch in fights, keep a range suited to their weapon, hunt last-known positions, react to gunfire noise, throw grenades, and respawn. Difficulty (Recruit / Veteran / Elite) scales accuracy, reaction time and damage. Bots are marked **AI** on the scoreboard.
- **Dropped supplies:** enemies you kill sometimes drop an ammo box. Walk over it for ammo and +1 grenade.

### Progression and armory
- **Levels 1–30.** XP: 200 per match + 100 per kill + 25 per headshot + 500 for a win + 30 × best streak. Each level-up also pays coins.
- **Coins:** 50 per match + 12 per kill + 150 for a win, plus daily supply (100 × streak day, up to 700).
- **Weapons:** M4 rifle and 9mm pistol to start. Buy K9 SMG (lv 3), pump shotgun (lv 5), .44 magnum (lv 6), suppressed M4 (lv 8) and LR-7 sniper with scope (lv 12).
- **Upgrades:** 3 tiers each of damage (+8%/tier), magazine (+20%/tier) and reload speed (−12%/tier).
- **Loadout:** one primary + one secondary + knife + 2 frag grenades.
- Progress and settings save in the browser (localStorage). Clearing site data resets them. The Profile tab has a reset button.

### Controls — desktop
| Action | Control |
|---|---|
| Move / look | WASD or arrows / mouse |
| Sprint / jump / crouch | Shift / Space / hold C |
| Fire / aim (scope on sniper) | Left mouse (hold for automatic) / hold right mouse |
| Reload | R or T |
| Frag grenade | G |
| Primary / secondary / knife | 1 / 2 / 3 · Q cycles |
| Scoreboard | hold Tab |
| Map / pause | M / Escape |

### Controls — touch
- **Left thumb:** the joystick appears wherever you touch on the left side. Push fully forward to sprint.
- **Right thumb:** drag anywhere to look.
- **FIRE** buttons on both sides (hold). **Auto-fire** (on by default, toggle in the pause menu) shoots automatically while your crosshair is on an enemy; the crosshair turns red.
- **AIM** and **CROUCH** are toggles. **FRAG** throws a grenade, **RELOAD**, **SWAP** cycles weapons, **SCORE** (hold) shows the scoreboard, **Ⅱ** pauses.

## Campaign: Operation Silent Grid

### Mission
Disable both alarm controls, recover both intelligence files inside buildings, then return to the marked extraction circle at your starting position. Follow the objective text, distance and yellow minimap marker. Neutralizing every guard is optional.

Look toward an item or console and press E when the prompt appears. Console interactions take two seconds; moving away or taking damage interrupts them. Closed doors obstruct interaction and gunfire.

### Controls
| Action | Control |
|---|---|
| Move / look | WASD or arrows / mouse |
| Sprint / jump / crouch | Shift / Space / hold C |
| Knife action / shoot | Left mouse; hold for automatic rifles |
| Aim / reload | Hold right mouse / T |
| Inspect | F |
| Knife / M4 | 1 / 2 |
| Pistol / shotgun / suppressed M4 | 3 / 4 / 5, after finding the pickups |
| Cycle available weapons | Q |
| Use, pickup, alarm, intel, door | E |
| Use medkit | H |
| Toggle map / reset position | M / R |
| Pause and release mouse | Escape |
| Restart after death or extraction | Enter or Restart Mission button |

R preserves the earlier position-reset function. It does not restore health, ammunition or completed objectives. Restart Mission starts a fresh run.

Touch controls retain movement, look, action, jump and pause, and add weapon switching, reload, use and healing. A physical touch-device performance test was not performed. A phone must access an HTTP(S) server on its own device or reachable network; the supplied launcher intentionally binds to localhost only.

### Enemies and stealth
- 28 copies of your uploaded city_soldier_outdated.glb: 18 validated ground-floor indoor positions and 10 outdoor patrol positions across several districts.
- Patrol walking, investigation, running to cover or alarm controls, crouching, firing and animated death poses.
- Vision cones, distance and wall/door line-of-sight checks. Crouching slows detection. Unsuppressed fire is heard farther away; sprinting makes nearby noise.
- Alert guards seek reachable cover when watched and cover is available. In open areas they can return fire. Designated guards can run to a usable alarm panel. An active alarm alerts nearby guards to the last known position.
- A grid pathfinder uses the actual city collision geometry. Guards operate nearby doors while moving. They do not intentionally spawn inside walls or in mid-air.
- The supplied soldier contains only one embedded “stay pose” clip. Walking, running, crouch and cover motions are newly authored procedural skeletal animation layered onto that pose. Death includes a procedural body fall. These are not imported motion-capture clips, and the uploaded GLB remains unchanged.

### Weapons, effects and survival
- Original animated knife and M4 with their arms, skeletons and original textures. M4 draw, fire and reload clips preserve their source animation with corrected timeline offsets.
- Additional original procedural pistol and pump-shotgun models, with recoil/reload movement and simple glove/arm geometry.
- Suppressed M4 variant uses a cloned M4 rig with an added suppressor.
- Finite per-weapon magazines and reserve ammunition, ammo crates, weapon pickups and ammo drops from some defeated guards.
- Hitscan damage, headshot multiplier, shotgun spread, hit feedback and wall/door obstruction.
- Health, armor, carried medkits, healing time, death screen, mission-complete screen and restart.
- Original layered muzzle-flash sprites, warm light pulses, tracers, spark impacts and smoke puffs. These approximate a classic tactical FPS style; they are not extracted IGI 2 assets or a pixel-exact reproduction of its effects.
- Original synthesized gunfire, suppressed shots, reload clicks, knife swishes, footsteps, impacts, door sounds, pickups, damage and alarm siren. Volume and mute controls are in the pause menu. No background music.

### Existing features retained
Full expanded city, original building textures and roads, separate editable extended_city.glb, hinged doors with two-sided moving collision and protection against closing through the player, minimap, sprint/stamina, gravity, jump, crouch, sensitivity, quality selector, touch movement/look, pause, reset, launch scripts and bundled Three.js. The entire city remains explorable.

Buildings use the source model’s existing spaces. This update does not add furniture or staircases to inaccessible upper floors. Doors, inventory and mission progress last for the current run; there is no checkpoint system (profile progress is saved in the browser).

## Project files
- `game.js`: main loop, player movement, shooting, HUD, input (desktop + touch), mode loading.
- `forest/world.js`: valley terrain, sky, clouds, trees, rocks, grass, time-of-day presets.
- `forest/structures.js`: camp, cabins, watchtowers with ladders, radio mast, fence, cover, zip-line.
- `forest/missions.js`: the mission list (forest stories plus the Dust Yard entry) and the mission rules (objectives, items, alarms, bleeding, medical kit).
- `forest/controller.js`: cutscenes, ladders, zip-line, medical actions, binoculars, satellite map, compass.
- `forest/cinema.js`: cutscene player and the helicopter. `forest/fp.js`: first-person hands for the rope, ladder, zip-line and medical animations.
- `viewmodels.js`: fits the animated gun rigs to the view and cuts their animation clips.
- `music.js`: adaptive procedural score and cinematic cues. `audio.js`: sound engine, layered weapons, ambience.
- `forest/arms.js`: gloved arms with two-bone IK. `tools/optimize_glb.py`: shrinks GLB textures (used for the v6 models).
- `tdm.js`: Team Deathmatch rules, bot AI, arena cover and walls.
- `gunmodels.js`: detailed procedural gun models (first person, pickups, drops, preview, bots). `rifle.js`: third-person rifle handling (arm IK poses, recoil, reload, throw, signals, weapon swap). `tactics.js`: squad plans and call-outs.
- `yardlobby.js`: Mission 03 pre-match flow (mode, map, side, gun picker with 3D preview and skins). `skins.js`: weapon skins (tri-planar paint, gun only). `controls.js`: key remapping, touch-layout editor, FPS meter, loading tips. `tools/optimize_soldier.py`: soldier GLB compression.
- `yard.js`: Mission 03 Dust Yard — the procedural cargo-yard map and textures, team outlines, health orbs, weapon drops, green smoke, aim assist, badges, the VS intro and the Victory / MVP / Score screens.
- `profile.js`: levels, XP, coins, shop, upgrades, loadout, daily reward, stats.
- `lobby.js`: lobby screens (Play, Loadout, Armory, Profile).
- `grenades.js`: frag grenade physics, bounces, fuse and explosions.
- `weapons.js`: weapon stats, imported rigs and procedural models (pistol, magnum, SMG, shotgun, sniper), recoil, reload.
- `enemies.js` / `mission.js` / `doors.js`: campaign guards, mission and the 775 interactive doors (unchanged behavior).
- `navigation.js`: collision-aware placement, line of sight, path search and cover selection (shared by both modes).
- `audio.js` / `effects.js`: synthesized sound and visual effects (now with explosions, kill and streak sounds).
- `tools/build_arena.py` builds `assets/arena_tdm.glb` (single district with opened doorways). `tools/build_city.py` / `tools/extract_doors.py` build the campaign city.
- `ragdoll.js`: Verlet ragdoll on the soldier skeleton. `voices.js`: barks, emotions, speech bubbles, subtitles, expression portrait.
- `net.js`: online client (`NetClient`, `NetBots` with the bots' API). `server/server.mjs`: Node server for multiplayer, with no dependencies.
- `manifest.webmanifest`, `sw.js`, `icons/`: web-app install and offline cache.
- `assets/`: all four original GLBs, the expanded city and the arena.

## Credits
**Dialogue voice** — Piper TTS voice model *en_US "joe" (medium)*, CC0 1.0 (obtained from the npm package `vowel-lab-voices-float`). Lines were rendered offline with the Piper engine; the game only ships the resulting audio.

All user-supplied assets retain their embedded CC BY 4.0 attribution. Preserve it when sharing or publishing.

**Shooting Game Enviornment Map TDM** — 00amza
https://sketchfab.com/00amza
https://sketchfab.com/3d-models/shooting-game-enviornment-map-tdm-37f7c0eeabbc42e8be926512f84c9fd9

**knife Animated** — DJMaesen
https://sketchfab.com/bumstrum
https://sketchfab.com/3d-models/knife-animated-f3140db917cc43389c14b5b2536c1dc8

**M4 - FPS Weapon Animations Pack (v.1)** — BarcodeGames
https://sketchfab.com/barcodegames
https://sketchfab.com/3d-models/m4-fps-weapon-animations-pack-v1-662fc74dda2646cfb48fc610705768ef

**FPS Arms gloved** — DJMaesen — **CC BY-NC 4.0 (non-commercial)**
https://sketchfab.com/bumstrum
Textures reduced to 1024 px; posed at runtime with IK. Because of the NC license, the game may only be distributed non-commercially while this model is included (no ads/sales) unless the author grants permission.

**fps AK animated** — DJMaesen — CC BY 4.0 (textures reduced; animation cut into clips at runtime)
https://sketchfab.com/bumstrum

**fps pistol Animated** — DJMaesen — CC BY 4.0 (textures reduced; animation cut into clips at runtime)
https://sketchfab.com/bumstrum

**AK74U | FREE ANIMATION.** — BURNER — CC BY 4.0 (textures reduced)
https://sketchfab.com/Alexander_Ovelar

**Police Helicopter 2 (Unity3D)** — jsa201077 (re-tinted, rotors re-pivoted at runtime)
https://sketchfab.com/unityjsa7
https://sketchfab.com/3d-models/police-helicopter-2-unity3d-da9d886634044c2aa25ddecd927ae6bb

**City Soldier (outdated)** — buh
https://sketchfab.com/buh-late
https://sketchfab.com/3d-models/city-soldier-outdated-636b5a7c7e0c400abda269ba382f3252

License: https://creativecommons.org/licenses/by/4.0/
Modifications: city expansion, separated doors, opened arena doorways and team tinting of soldiers, runtime placement and animation, M4 material compatibility and suppressed variant. Original uploaded GLBs remain unchanged. Extra models, interface, synthesized audio and voices, particle effects, ragdoll physics, multiplayer server and gameplay code are original additions.
Three.js and utilities: MIT; vendor/THREE-LICENSE.txt.
