# Enemy character prompts (Google Nano Banana)

Image prompts for the 17 intruders. For each character you attach **2–3 reference photos**
and paste **STYLE + CHARACTER + POSE** (three blocks below) as one prompt.

> Tone: political satire of each person's *public image*. Cartoon slapstick, funny not
> hateful. No gore, no sexualised depictions, no slurs, no invented accusations. Likeness
> comes from the reference photos; the prompt only adds style, exaggeration, outfit and props.

## How to generate (read once)

1. **Don't put the person's name in the prompt.** Say "the person in the reference photos".
   Image models often refuse prompts naming real politicians; photos + description work better.
2. **Start with `walk`.** When you like it, generate the other poses with that result attached
   as an extra reference and add: *"Same character, same outfit and colours as the last image."*
3. **Background:** ask for a flat chroma-green background (already in STYLE), then remove it
   (remove.bg, Canva, Photoshop "Remove background") and save as **transparent PNG**.
4. **Size:** square, at least 1024×1024. Character centred, feet near the bottom edge with
   ~5% margin, head near the top with ~5% margin. The game scales them down.
5. **Facing:** always draw facing **right** (side / three-quarter view). The game mirrors the
   image when the character moves left.
6. **Save as** `assets/enemies/<id>/<pose>.png` using the ids below, e.g.
   `assets/enemies/quader/walk.png`. Lowercase, exactly these names.

| Pose | File | Needed | What the game does with it |
|---|---|---|---|
| walk | `walk.png` | **yes** | Shown while sneaking towards the border (game adds bobbing) |
| kicked | `kicked.png` | **yes** | Shown when kicked and running back to India (game adds spin + fade) |
| idle | `idle.png` | optional | Shown while frozen by the ❄️ power-up and on the how-to screen |

---

## STYLE block (paste first, every time)

```
Cartoon caricature of the person in the reference photos, keep their face clearly
recognisable. Chibi proportions: very big head (about 45% of total height), small body,
short stubby legs, small hands. Funny exaggerated expression. Thick clean dark outlines,
flat cel shading with one soft highlight, bright saturated colours, mobile-game sticker
style. Full body, centred, facing right in three-quarter side view. Flat solid chroma-green
background (#00B140), no shadows on the background, no text, no logos, no frame.
Square 1:1 image.
```

## POSE blocks (paste last, pick one)

**walk**
```
Pose: sneaking forward on tiptoe towards the right, body leaning forward, one leg lifted
mid-step, sly guilty look over the shoulder, as if trying to cross a border unnoticed.
```

**kicked**
```
Pose: just got kicked in the backside: body jolted forward, back arched, both hands
clutching the backside, eyes huge, mouth wide open in a comic yelp, little sweat drops and
cartoon impact stars near the backside, feet off the ground. Still facing right.
```

**idle** (optional)
```
Pose: standing still, arms at the sides, slightly nervous smile, small shiver.
```

---

## CHARACTER blocks

`Accent` = the colour of the ring drawn around the character in the game; use it in the outfit
so the sprite matches. `Role` = how the character behaves in the game (for context; it
doesn't go in the prompt).

### Tier 1 — main target (if she gets in: game over)

#### `hasina` — Hasina
Role: boss. Slow, very tough (15+ taps), calls in helpers, gold aura.
```
Character: elderly woman in an elegant pastel sari with a wide border, the end of the sari
draped over her head, large round glasses, stern determined expression. She pulls a small
rolling suitcase behind her (she is trying to come back from abroad). Accent colour: deep
red. Make her look important and a little dramatic, like a final boss.
```

### Tier 2 — senior leaders (if one gets in: −200 points)

#### `quader` — Obaidul Quader
Role: Organizer. Keeps calling in small leaders.
```
Character: senior politician in a white panjabi with a black sleeveless "Mujib coat",
mid-speech with one finger raised and a microphone in the other hand, theatrical fiery
expression as if shouting a slogan at a rally. Exaggerate the most recognisable features from
the photos (glasses, hairline, moustache, whatever stands out). Accent colour: orange.
```

#### `nanok` — Nanok
Role: Heavy. Takes 3 taps.
```
Character: sturdy, broad-shouldered senior politician (sturdy, not mocking body size) in a
cream panjabi and dark Mujib coat, determined frown, stomping walk. Exaggerate his most
recognisable facial features from the photos. Accent colour: purple.
```

#### `taposh` — Taposh
Role: Dodger. Jumps sideways when tapped.
```
Character: former city mayor in a neat suit with a mayor's ceremonial chain, holding a
small mosquito-fogging machine puffing a little cloud of smoke, quick nervous darting eyes,
light on his feet like he's about to dodge. Accent colour: blue.
```

#### `shamim` — Samim Osman
Role: Tank. Very tough (7 taps), very slow.
```
Character: powerful-looking regional strongman politician, very broad chest (still chibi
proportions), dark sunglasses, thick gold wristwatch, white panjabi with black Mujib coat,
confident unbothered smirk, heavy slow stride. Accent colour: dark brown.
```

#### `arafat` — Arafat
Role: Spin doctor. Takes 2 taps and flickers in and out of view.
```
Character: TV-debate politician in a sharp suit and tie, holding a studio microphone and a
stack of talking-point cards, confident know-it-all smile, small "TV static" sparkles around
him as if he's a broadcast signal. Accent colour: teal.
```

### Tier 3 — small leaders (if one gets in: −50 points)

#### `saddam` — Saddam
Role: Pack leader. Arrives with two copies of himself.
```
Character: young student-politics leader in a white panjabi, fist raised shouting a
slogan, intense energetic look, slightly messy hair. Accent colour: red.
```

#### `inan` — Inan
Role: Runner. Fast, zig-zags.
```
Character: young student-politics leader in a panjabi with sneakers, sprinting pose
energy, sweaty and panicked, looking back over his shoulder. Accent colour: amber.
```

#### `nazmul` — Siddique Nazmul
Role: Basic.
```
Character: young political activist in a light panjabi with a shoulder bag, sheepish
guilty grin. Exaggerate his most recognisable features from the photos. Accent colour: crimson.
```

#### `zakir` — Zakir
Role: Basic.
```
Character: young political activist in a checked shirt and trousers, nervous fake smile,
hands in pockets. Exaggerate his most recognisable features from the photos. Accent colour: rust.
```

#### `shohag` — Shohag
Role: Runner. Fast, zig-zags.
```
Character: young politician in a panjabi with rolled-up sleeves, mid-run, scared wide eyes,
hair flying. Accent colour: gold.
```

#### `somrat` — Somrat
Role: Splitter. Splits into two basic small leaders when kicked.
```
Character: flashy man with a thick gold chain, shiny printed shirt, dark sunglasses pushed
up on his head, cocky grin. Accent colour: emerald.
```

#### `murad` — Murad
Role: Runner. Fast, zig-zags.
```
Character: politician in an ill-fitting suit, tie askew, fast nervous walk, embarrassed
"caught out" expression. Exaggerate his most recognisable features from the photos.
Accent colour: slate blue.
```

#### `riyaz` — Riyaz
Role: Splitter. Splits into two basic small leaders when kicked.
```
Character: politician in a formal panjabi and waistcoat, smug grin, waving to an imaginary
crowd. Exaggerate his most recognisable features from the photos. Accent colour: olive.
```

#### `ferdous` — Ferdous
Role: Film star. Fades in and out of view.
```
Character: film-hero actor turned politician, stylish movie-star hair, dramatic hero pose,
shirt with an open collar, holding a film clapperboard, a soft spotlight glow behind him.
Accent colour: indigo.
```

#### `momotaz` — Momotaz
Role: Basic.
```
Character: folk singer turned politician, in a bright sari, holding a stage microphone and
singing with her eyes closed, little music notes floating around her. Friendly, comic, not
mocking. Accent colour: magenta.
```

#### `mahi` — Mahiya Mahi
Role: Film star. Fades in and out of view.
```
Character: film actress turned politician in a modest glamorous salwar kameez with a
dupatta, oversized sunglasses, holding a phone up for a selfie, little camera-flash
sparkles. Fully clothed, not sexualised, funny not glamourised. Accent colour: pink.
```

---

## Checklist per character
- [ ] `walk.png` transparent, facing right, feet near the bottom
- [ ] `kicked.png` same character and outfit, facing right
- [ ] `idle.png` (optional)
- [ ] Face recognisable at small size (look at it at 64×64 px; the game draws ~40–90 px)
