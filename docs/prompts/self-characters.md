# Self character (hero) prompts (Google Nano Banana)

The player picks one of four heroes before each run. On every tap the hero pops up at the
tap point and kicks the intruder in the backside. Heroes should look **likeable, brave and a
bit funny**: the people of Bangladesh guarding their border.

Same workflow as `enemy-characters.md`: paste **STYLE + CHARACTER + POSE**, attach reference
photos if you have a model or look in mind (optional for heroes), start with `ready`, then use
that result as a reference for the other poses.

- Background: flat chroma-green, then remove it → **transparent PNG**, square, ≥ 1024×1024.
- Facing: always **right**. The game mirrors the image to kick in the other direction.
- Save as `assets/heroes/<id>/<pose>.png`, e.g. `assets/heroes/farmer/kick.png`.

| Pose | File | Needed | Used for |
|---|---|---|---|
| ready | `ready.png` | **yes** | Hero-select screen; first frame when the hero pops up |
| kick | `kick.png` | **yes** | The kick (shown ~0.25 s per tap) |
| cheer | `cheer.png` | optional | Wave cleared / new record |

---

## STYLE block (paste first)

```
Cartoon hero character, friendly and heroic, Bangladeshi. Chibi proportions: very big head
(about 45% of total height), small body, short legs, small hands. Big expressive eyes,
determined confident grin. Thick clean dark outlines, flat cel shading with one soft
highlight, bright saturated colours, mobile-game sticker style. Full body, centred, facing
right in side view. Flat solid chroma-green background (#00B140), no shadows on the
background, no text, no logos, no frame. Square 1:1 image.
```

## POSE blocks (paste last)

**ready**
```
Pose: fighting-ready stance, knees bent, fists up, leaning slightly forward, eager
"bring it on" expression.
```

**kick**
```
Pose: big comic flying side-kick to the right: kicking leg fully stretched out to the right
at hip height with the sole of the foot facing right, other leg bent, arms flung back for
balance, motion lines behind the kicking foot, fierce happy shout.
```

**cheer** (optional)
```
Pose: jumping with both fists in the air, eyes closed, huge happy grin.
```

---

## CHARACTER blocks

#### `farmer` — Farmer (কৃষক)
```
Character: sturdy middle-aged Bangladeshi farmer, sun-tanned, thick moustache, checked
lungi folded up to the knees, white vest, gamchha (red-and-white checked towel) tied around
his head, bare feet, mud on his legs. Strong and calm, a quiet village hero.
Accent colour: green.
```

#### `studentM` — Student, male (ছাত্র)
```
Character: young male university student, about 20, messy hair, a red-and-green Bangladesh
flag tied as a headband, T-shirt, jeans and sneakers, backpack. Brave, fiery, a bit cheeky.
Accent colour: red.
```

#### `studentF` — Student, female (ছাত্রী)
```
Character: young female university student, about 20, long braid, a red-and-green
Bangladesh flag tied as a headband over her hair (or a hijab with a flag pin, choose from
the reference), modest kurta with jeans and sneakers, a book bag across her shoulder.
Fearless and quick, sharp confident smile. Fully clothed, not sexualised.
Accent colour: crimson.
```

#### `common` — Common People (সাধারণ মানুষ)
```
Character: everyday city working man in his thirties, rickshaw-puller / day-labourer look:
short-sleeved shirt, lungi, plastic sandals, a gamchha over one shoulder, a small cap.
Tired but unstoppable, big warm grin, rolled-up sleeves. Represents ordinary people.
Accent colour: yellow.
```

---

## Checklist per hero
- [ ] `ready.png` and `kick.png`, transparent, facing right, same outfit in both
- [ ] The kicking foot reaches the right edge area of the image (the game lines the foot up
      with the intruder's backside)
- [ ] Readable at small size (~60–100 px in game)
