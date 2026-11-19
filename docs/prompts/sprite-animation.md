# Sprite sheet prompts: the 11 small leaders, the 4 heroes and the hole

This file is for **image sheets only** (Nano Banana makes a grid of frames). It covers:
- **Part A:** the 11 small leaders (tier 3): `nazmul`, `zakir`, `momotaz`, `inan`, `shohag`,
  `saddam`, `murad`, `ferdous`, `mahi`, `somrat`, `riyaz`. Likeness from the photos in
  `assets/ref_image/<folder>/`.
- **Part B:** the 4 heroes (`farmer`, `studentM`, `studentF`, `common`).
- **Part C (optional):** art for the spawn hole.

**Hasina and the 5 senior leaders are not here.** They get video:
`sprite-video-stars.md`.

Everything here is **square**: square masters, square cells. Written 2026-11-18.

---

## 0. The steps

```
3 reference photos ──(Step 1: Nano Banana)──> MASTER, square (likeness locked)
                                                │
                                 (Step 2: Nano Banana, master attached)
                                                ▼
                                 one sheet per animation (grid of frames)
                                                ▼
              Claude: keys out the background, cuts the cells, lines up the feet,
              scales the frames, adds them to the game
```

**Why a master first:** making every frame straight from the photos gives a slightly
different face each time, so the animation "boils". Lock the face once in the master, then
always animate *from the master* (attach only the master, not the photos).

### What worked in Flow (2026-11-18, Claude driving Chrome)
All 11 masters and 33 P1 sheets were made in the Flow project "KTO sprites v3":
- **Master:** *Characters → New character*, attach the 3 photos with **+**, and paste the A1 prompt.
  It comes out 16:9 (1376×768) even when the prompt asks for square. That's fine: the master only
  has to lock the face.
- **Sheets:** upload the master as `<id>_master.jpg`, attach it in the agent box (**+**, then search
  the name), and ask for the 3 P1 sheets in one message, 1 output each. Use aspect **4:3** for the
  3×2 walk sheet (cells come out slightly tall, which suits standing figures) and **1:1** for the
  2×2 struggle and jailed sheets. Name them `<id>_walk_sheet` etc.
- For the fast runners (`inan`, `shohag`, `murad`), the walk sheet is a **run** cycle.
- Don't press the agent's send button while it is still working: it turns into **Stop** and
  cancels the job.

---

## 1. Rules (already written into the prompts below)

| Rule | Value | Why |
|---|---|---|
| Background | flat solid chroma green **#00B140**, no gradient, no floor, no shadow | `tools/chroma-key.mjs` removes it |
| Heroes' background | flat solid **magenta #FF00FF** (they wear green flag headbands) | green clothing would be keyed out |
| View | full body, **facing right**, three-quarter side view | the game mirrors for left |
| Framing | whole body inside the cell, head top at ~8% from the top, **feet on one baseline at ~92%** | frames line up, no jitter |
| Scale | identical character size in every frame | same reason |
| Forbidden | text, letters, numbers, logos, watermarks, grid lines, frame borders, motion blur, cropped limbs, extra characters | AI likes to add these |
| Style | the style block below, unchanged, for every character | one consistent family |
| Tone | friendly caricature for all ages: exaggerate signature features (glasses, moustache, hair, outfit, prop), **never** cruel, gory, sexualised, or mocking body/skin | keeps the satire fun and keeps platforms from removing it |

### Style block (the current 3D toy look, so everyone still matches)
```
STYLE: 3D rendered cute toy figure, Pixar-like soft clay look, chibi proportions (very big
head about 45% of total height, small body, short legs), soft even studio lighting, bright
friendly colours, clean silhouette, suitable for all ages.
```

---

# Part A: the 11 small leaders

## A1. The MASTER image (one per character)

Attach **all 3 photos** from the character's folder, then paste this prompt with that
character's block (A4) filled in:

```
Create a single character design of the person in the attached photos as a cute caricature.

LIKENESS: Use the photos only as a reference for this person's face and recognisable
features. The cartoon must be instantly recognisable as them: keep {LIKENESS}. Exaggerate
these signature features playfully like a friendly newspaper caricature (big head, small
body), but keep it kind, not ugly.

OUTFIT & PROP: {OUTFIT}. {PROP}

POSE: standing neutral, relaxed, full body, facing right in three-quarter side view, arms
slightly away from the body so the silhouette is clear, mouth closed, expression: {MOOD}.

STYLE: 3D rendered cute toy figure, Pixar-like soft clay look, chibi proportions (very big
head about 45% of total height, small body, short legs), soft even studio lighting, bright
friendly colours, clean silhouette, suitable for all ages.

BACKGROUND: perfectly flat solid chroma green #00B140 filling the whole image, no floor, no
shadow, no gradient. Nothing on the character is green.

Square 1:1 image. The whole body fits with a small margin. No text, no logos, no watermark,
no border.
```

Save as `art-src/enemies/<id>/master.png`. **Check before moving on:** would a Bangladeshi
teenager name this person at a glance? If not, regenerate, and say which feature is off
("glasses should be thin rectangular frames", "beard fuller").

**If the tool refuses** to work from photos of a real person, drop the photos and use the
same prompt. The LIKENESS text in A4 is written to work from words alone (less exact).

## A2. The sheets

Attach **only the master image** and paste the sheet template with one animation from A3.
The sheet is a grid of equal square cells, read left to right, top to bottom:
- 6 frames: **3 columns × 2 rows, image ratio 3:2**
- 4 frames: **2 columns × 2 rows, image ratio 1:1**
- 2 frames: **2 columns × 1 row, image ratio 2:1**

```
Sprite sheet for a 2D game, using EXACTLY the character in the attached image (same face,
same outfit, same colours, same proportions, same 3D toy render style).

LAYOUT: {COLS} columns × {ROWS} rows of equal square cells, {N} frames in reading order
(left to right, top to bottom). Each cell shows the full character once. No gaps you can see,
no grid lines, no borders, no numbers, no text.

CONSISTENCY: the character is the same size in every cell, facing right in three-quarter side
view, with the feet on the same baseline near the bottom of each cell (about 92% down) and
the head never touching the top. Only the pose changes between frames.

ANIMATION: {ANIMATION NAME}. {FRAME LIST}

BACKGROUND: perfectly flat solid chroma green #00B140 in every cell, no floor, no shadow, no
motion blur, no dust, no speed lines.
```

## A3. The animations

Make **P1 first** for all 11. Tier 3 can stop after P1: the game fakes the rest by tilting,
sliding and squashing frames.

| Anim | Frames / grid | Loop | Used for | Save as | Priority |
|---|---|---|---|---|---|
| `walk` | 6 / 3×2 | yes | walking to the border (classic), lurking and sneaking (Rope 'Em!) | `walk-sheet.png` | **P1** |
| `struggle` | 4 / 2×2 | yes | caught in the rope while you tap to reel in (Rope 'Em!) | `struggle-sheet.png` | **P1** |
| `jailed` | 4 / 2×2 | yes | face behind the jail bars, how-to roster, share cards | `jailed-sheet.png` | **P1** |
| `emerge` | 6 / 3×2 | no | climbing out of the spawn hole | `emerge-sheet.png` | P2 (the game already slides the walk frame up out of the hole) |
| `kicked` | 4 / 2×2 | no | booted by the hero, flying off (classic) | `kicked-sheet.png` | P2 |
| `flung` | 2 / 2×1 | yes | spinning through the air into the jail | `flung-sheet.png` | P3 |

**FRAME LISTs** (paste into `{FRAME LIST}`):

**walk** (6):
```
A natural cartoon walk cycle seen from the side. Frame 1: right foot forward touching the
ground, left arm forward. Frame 2: weight passes over the right leg, body slightly lower.
Frame 3: left leg passes the right, body highest. Frame 4: left foot forward touching the
ground, right arm forward. Frame 5: weight over the left leg, body slightly lower. Frame 6:
right leg passes the left, body highest. Arms swing opposite the legs. Bouncy, sneaky
attitude: {MOOD}. Frame 6 must flow back into frame 1.
```
**struggle** (4):
```
The character is caught around the waist by an invisible lasso (do NOT draw the rope) and is
being pulled to the left. Frame 1: leaning hard to the right away from the pull, heels dug
in, arms flailing up. Frame 2: arms windmilling, mouth open shouting, sweat drops. Frame 3:
leaning right again, one leg kicking. Frame 4: arms flailing down, eyes squeezed shut. Funny,
not distressing. Frame 4 flows back into frame 1.
```
**jailed** (4, head-and-shoulders only, centred, filling ~80% of the cell):
```
Head-and-shoulders portrait, facing the viewer, both hands gripping something at chin height
(do NOT draw bars; the game adds them). Frame 1: sulky pout, eyes looking sideways.
Frame 2: eyes closed (blink), same pout. Frame 3: dramatic sigh, eyebrows up, cheeks puffed.
Frame 4: grumbling mouth, eyes rolled up. Exaggerated comic sulking, for all ages.
```
**emerge** (6):
```
The character climbs up out of a hole in the ground (the hole is NOT drawn; the bottom edge
of each cell is the ground line; parts of the body below the ground line are simply not
visible). Frame 1: only the top of the head and eyes peek above the ground line, looking
around suspiciously. Frame 2: head and shoulders up, hands on the ground line. Frame 3:
pushing up, chest above the ground line. Frame 4: one knee up on the ground line. Frame 5:
standing up, brushing dirt off the clothes. Frame 6: standing ready, sly grin, about to walk
right.
```
**kicked** (4):
```
The character has just been kicked in the backside from the left and flies off to the right.
Frame 1: hit, body jolting forward, eyes popping, mouth an "O". Frame 2: lifted off the
ground, arms and legs flung back, hat or prop flying loose. Frame 3: tumbling forward in the
air, comic panic. Frame 4: running away fast to the right, looking back in fear. Slapstick,
no pain, no injury.
```
**flung** (2):
```
Curled up spinning in the air like a ball, arms around knees, dizzy swirly eyes. Frame 1 and
frame 2 are the same pose rotated 180°.
```

## A4. Character blocks (fill `{LIKENESS}`, `{OUTFIT}`, `{PROP}`, `{MOOD}`)

The likeness notes describe the reference photos. The props and gags carry over from the
current art (they already work in the game).

**`nazmul`**: folder `nazmul/`
- LIKENESS: a stocky man with a **shaved bald head**, broad round face, short stubble, heavy brow and a stern frown
- OUTFIT: a white panjabi (or a brown blazer over a checked shirt)
- PROP: arms crossed, or a small shoulder bag
- MOOD: tough-guy frown that turns sheepish when caught

**`zakir`**: folder `zakir/`
- LIKENESS: a young man in his twenties with short thick black hair, **thin rectangular glasses**, clean-shaven soft round face, neutral serious look
- OUTFIT: a light checked shirt with trousers
- PROP: hands in pockets
- MOOD: nervous fake smile

**`momotaz`**: folder `momotaz/`
- LIKENESS: a woman with black hair in a **long thick braid**, a **large red bindi**, round face, big dangling earrings, warm smile
- OUTFIT: a bright patterned sari (red or blue)
- PROP: singing into a stage microphone with little music notes (she's a folk singer)
- MOOD: eyes closed, singing her heart out

**`inan`**: folder `inan/`
- LIKENESS: a young man with short black hair, a round friendly face, clean-shaven, wide smile
- OUTFIT: a white embroidered panjabi with sneakers (or a dark suit)
- PROP: none; fast zig-zag runner
- MOOD: sweaty panic, glancing over his shoulder

**`shohag`**: folder `shohag/`
- LIKENESS: a young man with thick black hair swept up, **rectangular glasses**, light stubble, a serious face
- OUTFIT: a navy blazer over a white shirt (or a white panjabi with a red-and-white lanyard)
- PROP: none; fast zig-zag runner
- MOOD: scared wide eyes, hair flying

**`saddam`**: folder `saddam/`
- LIKENESS: a young man with short neat black hair styled up, clean-shaven, a slim face, a confident half-smile
- OUTFIT: a light blue embroidered panjabi (or a black panjabi)
- PROP: fist raised mid-slogan (he comes in a pack of 3: make him look like a ringleader)
- MOOD: cheeky, intense

**`murad`**: folder `murad/` (renamed from `maruf/` by the user on 2026-11-18, new photos)
- LIKENESS: a middle-aged man with a **shiny bald head**, **rectangular glasses**, a thin neat moustache, a round face
- OUTFIT: a black sleeveless Mujib coat over a white panjabi
- PROP: a microphone
- MOOD: sweaty, flustered, caught-out face (in game he is a fast zig-zag runner)

**`ferdous`**: folder `ferdaus/`
- LIKENESS: a film actor around fifty with thick wavy black hair, **round glasses** (in one photo), a big beaming smile, full cheeks
- OUTFIT: a black Mujib coat over a white panjabi
- PROP: waving to fans with one hand, holding an award trophy or a film clapperboard
- MOOD: dramatic movie-star hero pose

**`mahi`**: folder `mahi/`
- LIKENESS: a film actress with **long voluminous wavy dark hair** (or a high top-knot bun), bold eye make-up, a sharp chin
- OUTFIT: a modest red shirt or navy top with trousers (keep it modest)
- PROP: phone held up for a selfie with little camera-flash sparkles
- MOOD: pouting selfie face, funny rather than glamourised

**`somrat`**: folder `Somrat/`
- LIKENESS: a man with wavy black hair, a **full trimmed black beard and moustache**, a broad face, a big toothy grin
- OUTFIT: a shiny printed party shirt (or bright blue shirt)
- PROP: a thick gold chain, sunglasses pushed up on his forehead
- MOOD: cocky show-off

**`riyaz`**: folder `Riaz/`
- LIKENESS: an actor with short side-parted black hair, **black rectangular glasses** (one photo), a slim clean-shaven face, a smug grin
- OUTFIT: a pale yellow panjabi (or a patterned shirt)
- PROP: waving to an imaginary crowd
- MOOD: smug

---

# Part B: the 4 heroes

The heroes are generic, likeable everyday Bangladeshis (no photos). **No master step:** the
master is the hero's current image, `assets/heroes/<id>/ready.png` (attach it). Only that
pose exists in the game today, so these sheets also fill in the missing kick, run, throw,
pull and cheer.

Two differences from Part A:
- **Magenta background #FF00FF**, because the students wear green flag headbands.
- The rope is **not drawn** in throw and pull: the game draws it, so it can stretch to the crook.

### Hero sheet template
Attach `assets/heroes/<id>/ready.png` and paste:
```
Sprite sheet for a 2D game, using EXACTLY the character in the attached image (same face,
same outfit, same colours, same proportions, same 3D toy render style). {HERO}

LAYOUT: {COLS} columns × {ROWS} rows of equal square cells, {N} frames in reading order
(left to right, top to bottom). Each cell shows the full character once. No gaps you can see,
no grid lines, no borders, no numbers, no text.

CONSISTENCY: the character is the same size in every cell, facing right in side view, with
the feet on the same baseline near the bottom of each cell (about 92% down) and the head
never touching the top. Only the pose changes between frames.

ANIMATION: {ANIMATION NAME}. {FRAME LIST}

BACKGROUND: perfectly flat solid magenta #FF00FF in every cell, no floor, no shadow, no
motion blur, no dust, no speed lines. Nothing on the character is magenta or pink.
```

### `{HERO}` lines (one sentence, to stop the AI drifting from the outfit)
| Hero | `{HERO}` |
|---|---|
| `farmer` | `A sturdy Bangladeshi farmer: thick moustache, red-and-white checked gamchha tied on his head, white vest, checked lungi folded to the knees, bare feet. Calm, strong village hero.` |
| `studentM` | `A young male university student: messy hair, red-and-green Bangladesh flag headband, T-shirt, jeans, sneakers, backpack. Brave and a bit cheeky.` |
| `studentF` | `A young female university student: long braid, red-and-green Bangladesh flag headband, modest kurta with jeans and sneakers, book bag. Fearless and quick. Fully clothed, not sexualised.` |
| `common` | `An everyday working man in his thirties: short-sleeved shirt, lungi, plastic sandals, gamchha over one shoulder, small cap, rolled-up sleeves. Tired but unstoppable, big warm grin.` |

### Hero animations
| Anim | Frames / grid | Loop | Used for | Save as | Priority |
|---|---|---|---|---|---|
| `kick` | 4 / 2×2 | no | the kick on every tap (classic) | `kick-sheet.png` | **P1** |
| `run` | 6 / 3×2 | yes | chasing a crook (Rope 'Em!) | `run-sheet.png` | **P1** |
| `throw` | 4 / 2×2 | no | throwing the rope | `throw-sheet.png` | **P1** |
| `pull` | 4 / 2×2 | yes | reeling a caught crook in | `pull-sheet.png` | **P1** |
| `cheer` | 2 / 2×1 | yes | after a lockup, new record | `cheer-sheet.png` | P2 |

**kick** (4):
```
A big comic kick to the right. Frame 1: wind-up, standing on the left leg, right knee pulled
up to the chest, arms back, fierce happy face. Frame 2: the kick, right leg fully stretched
out to the right at hip height with the sole of the foot facing right, arms flung back for
balance, shouting. Frame 3: follow-through, leg still high, body leaning back. Frame 4:
landing on both feet with a proud grin. The kicking foot reaches near the right edge of the
cell in frame 2.
```
**run** (6):
```
A fast eager run cycle seen from the side, leaning forward, determined grin. Frame 1: right
foot strikes the ground in front, left arm forward. Frame 2: body low over the right leg.
Frame 3: pushing off, both feet off the ground, body highest. Frame 4: left foot strikes the
ground in front, right arm forward. Frame 5: body low over the left leg. Frame 6: pushing
off, both feet off the ground. Frame 6 must flow back into frame 1.
```
**throw** (4):
```
Throwing a cowboy lasso to the right (do NOT draw the rope; the hand is empty). Frame 1:
throwing arm raised above the head, circling as if swinging a lasso, legs braced apart.
Frame 2: arm swinging behind the head, body leaning back, eyes on the target. Frame 3: step
forward, arm whipping forward and up to the right, releasing. Frame 4: follow-through, arm
stretched out to the right, pointing at the target, confident grin.
```
**pull** (4):
```
Leaning far back to the LEFT and hauling an invisible rope that comes from the right, hand
over hand (do NOT draw the rope; the hands grip empty air at chest height). Frame 1: both
hands forward, heels dug in. Frame 2: right hand pulls back to the chest, body leans further
back, gritted teeth. Frame 3: left hand reaches forward again, straining funny face, sweat
drop. Frame 4: left hand pulls back, body leaning far back. Frame 4 flows back into frame 1.
```
**cheer** (2):
```
Frame 1: both fists in the air, eyes closed, huge happy grin. Frame 2: jumping with both
feet off the ground, fists still up, mouth open shouting with joy.
```

---

# Part C (optional): the spawn hole

**You don't need to make anything for the hole.** The game already draws it in code: it pops
open, dirt flicks out, the crook climbs out, and it closes. Hasina's hole is gold with her 👑.
The character's part of the climb is the `emerge` animation (A3, and the video file for the
stars). Even that is optional: the game slides the walk frame up out of the hole.

If you want a hand-made look instead of the drawn one, make this sheet. Claude would then
need a small engine change to use it, so tell Claude when it's ready.

No master needed; nothing to attach. Paste:
```
Sprite sheet for a 2D game: a cartoon hole in the ground opening up, seen from a low
three-quarter angle (a flat oval). 3D rendered toy style, soft clay look, soft even lighting.

LAYOUT: 3 columns × 2 rows of equal square cells, 6 frames in reading order. The oval is
centred in every cell, at the same height in every cell. No grid lines, no borders, no text.

ANIMATION: Frame 1: a small crack in a patch of brown earth. Frame 2: a tiny dark hole with
a few dirt lumps popping up. Frame 3: half-size hole, dirt clods flying out. Frame 4: full
hole (filling about 80% of the cell width), very dark inside, a lumpy brown dirt rim, a few
clods in the air. Frame 5: full hole, dirt settling. Frame 6: full hole, calm, ready.

BACKGROUND: perfectly flat solid chroma green #00B140 around the earth patch, no shadow
outside it, no grass, no text.
```
Save as `art-src/fx/hole-sheet.png`. For Hasina's version, add `The rim is shiny gold with a
soft golden glow, and a tiny gold crown floats above the hole.` and save it as
`art-src/fx/hole-main-sheet.png`. The game plays the frames backwards to close the hole.

---

## Files to deliver

Put everything in `art-src/` (git-ignored, never published), under the **game id** (`ferdous`
not `ferdaus`, `somrat` not `Somrat`, `riyaz` not `Riaz`):
```
art-src/enemies/<id>/master.png
art-src/enemies/<id>/walk-sheet.png        P1
art-src/enemies/<id>/struggle-sheet.png    P1
art-src/enemies/<id>/jailed-sheet.png      P1
art-src/enemies/<id>/emerge-sheet.png      P2 (optional)
art-src/enemies/<id>/kicked-sheet.png      P2 (optional)
art-src/enemies/<id>/flung-sheet.png       P3 (optional)
art-src/heroes/<id>/<anim>-sheet.png       kick, run, throw, pull (P1), cheer (P2)
art-src/fx/hole-sheet.png                  optional
art-src/fx/hole-main-sheet.png             optional
```

## What Claude still has to build
None of this exists yet. It's planned work, to be done once the first sheets or clips arrive:
1. **A sheet tool:** key out the green or magenta, cut each grid into cells (or pull frames
   out of the stars' MP4 clips with ffmpeg), trim, line the feet up on one baseline, scale to
   192 px frames, and write one WebP strip per animation.
2. **Engine support for frames:** frame-based animation in `assets.js` and the manifest
   (`frames`, `fps`, `loop`), played in `drawEnemy`, the rope, the jail and the hero. While a
   character has no frames yet, the game keeps using today's single image.
3. **Size budget:** about 8 KB per WebP frame, so ~2.5 MB for 17 characters × ~18 frames.
   Load the walk frames first and the rest later.

## Checklist per character
- [ ] Master: recognisable at a glance, kind caricature, nothing green on the character
- [ ] Every frame: same size, feet on the same line, facing right, no text or grid lines
- [ ] Walk / run: the last frame flows into the first with no jump
- [ ] Heroes: magenta background, no rope drawn, nothing pink on the hero
- [ ] Saved under the game id in `art-src/`
