# Video sprite prompts: Hasina and the 5 senior leaders (Google Flow)

**Only for these 6 characters:** `hasina`, `quader`, `nanok`, `taposh`, `shamim`, `arafat`.
They are big on screen and the stars of the share cards, so they get smooth animation made
from short videos.
Everyone else (the 11 small leaders and the 4 heroes) uses image sheets:
`sprite-animation.md`.

Written 2026-11-18 from the reference photos in `assets/ref_image/<folder>/`.

---

## 0. The steps

```
3 reference photos ──(Step 1: Nano Banana)──> MASTER, 16:9 (likeness locked)
                                                │
                                 (Step 2: Flow / Veo, image-to-video)
                                                ▼
                                 2–3 s clip per animation, 16:9
                                                ▼
              Claude: crops a square around the character, keys out the green,
              picks the frames, scales them, adds them to the game
```

1. Make **one master image** per character from the photos (section 2). It locks the face.
   Video made straight from the photos gives a slightly different face every time.
2. In Google Flow, make **one clip per animation** from that master (section 3).
3. Save the files (section 5). Claude does the rest.

**Flow only makes 16:9 video, and that's fine.** Only the character is needed: Claude crops a
square around them in every frame and throws away the green on both sides. At 720p the
character is still about 600 px tall, plenty for 192 px game frames.

---

## 1. Rules (already written into the prompts below)

| Rule | Value | Why |
|---|---|---|
| Image shape | **16:9** for the master and the clips | Flow only makes 16:9; a square master would get cropped and lose the head or feet |
| Framing | character **centred**, filling **about 80% of the frame height**, flat green on both sides | Veo likes to drift sideways; this keeps the whole body on screen |
| Background | flat solid chroma green **#00B140**, no floor, no shadow, no gradient | the green is keyed out |
| View | full body, **facing right**, three-quarter side view | the game mirrors for left |
| Camera | locked, no zoom, no cuts, no camera movement | frames must line up |
| Forbidden | text, logos, watermarks, extra characters, motion blur, anything green on the character | it would be keyed out or cut |
| Tone | friendly caricature for all ages: exaggerate signature features (glasses, moustache, hair, outfit, prop), **never** cruel, gory, sexualised, or mocking body/skin | keeps the satire fun and keeps platforms from removing it |

---

### What worked in Flow (2026-11-18, Claude driving Chrome)
All 6 masters and 30 clips were made this way in the Flow project "KTO sprites v3":
1. **Master:** *Characters → New character*. Attach the 3 photos with **+** (search `<id>_ref1` etc.),
   paste the master prompt, send. The result is 1376×768 (16:9). Download it with the image's
   download button.
2. **Upload the master as a plain image** (`<id>_master.jpg`). **Don't animate the Flow
   "character"**: its main image stays the first photo, and the agent animated the *real photo*
   the first time (5 clips wasted and trashed).
3. In *Images*, right-click the master → **Animate**. That attaches it to the agent box. Ask for
   all 5 clips in one message: "Use ONLY the attached image <id>_master.jpg as the exact first frame
   … 5 separate videos … name them <id>_walk …". Agent settings: *Never confirm*, video 16:9, x1,
   Omni 1.2 Flash; about 9 credits per clip.
4. Download from the video editor (720p). Flow names the files `<id>_<anim>_<hash>.mp4`.
- `emerge` sometimes ignores "start hidden" (Quader, Taposh); it's P2, the game fakes it.
- `struggle` clips draw a rope (the game draws its own; crop or ignore it).

## 2. Step 1: the MASTER image (Nano Banana, in Gemini or Flow)

Attach **all 3 photos** from the character's folder, then paste this prompt with that
character's block (section 4) filled in:

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

Wide 16:9 image. The character stands in the centre, filling about 80% of the image height,
with flat green on both sides. No text, no logos, no watermark, no border.
```

Save as `art-src/enemies/<id>/master.png`. **Check before moving on:** would a Bangladeshi
teenager name this person at a glance? If not, regenerate, and say which feature is off
("glasses should be thin rectangular metal frames", "moustache thicker").

- **If the image comes out square anyway** (or you already have a good square master), either
  attach it with this prompt:
  ```
  Same image, 16:9. Extend the flat green background left and right. Don't change the
  character in any way: same pose, size, face, outfit and colours, centred in the frame.
  ```
  or ask Claude to pad it with green to 16:9 (ffmpeg, no AI needed).
- **If the tool refuses** to work from photos of a real politician, drop the photos and use the
  same prompt. The LIKENESS text in section 4 is written to work from words alone (less exact).

---

## 3. Step 2: the clips (Google Flow → Veo, image-to-video)

In Flow use **Frames to Video** with the master as the **first frame**. Paste the prompt and
replace `{ACTION}` with a line from the table:

```
The character from the image {ACTION}. Locked-off static camera, the character stays in the
same place in the frame (in-place animation, like a game sprite on a treadmill), always
facing right in three-quarter side view, full body visible the whole time. Keep the face,
outfit, colours and 3D toy style exactly as in the image. Background stays perfectly flat
solid chroma green #00B140 with no shadows, no floor, no camera movement, no zoom, no cuts,
no other objects, no text. The character stays centred in the frame, filling about 80% of
the frame height, with flat green on both sides. Smooth, bouncy cartoon motion. Duration 2–3
seconds.
```

| Anim | Priority | Used for | `{ACTION}` |
|---|---|---|---|
| `walk` | **P1** | walking to the border, lurking, sneaking | `walks in place with a bouncy, sneaky cartoon walk cycle, arms swinging; the last frame matches the first so it loops` |
| `struggle` | **P1** | caught in the rope (Rope 'Em!) | `is caught by an invisible rope around the waist and comically struggles against a pull to the left, leaning away, arms flailing, legs kicking` |
| `jailed` | **P1** | face behind the jail bars, share cards | `is shown head-and-shoulders, facing the viewer, gripping invisible bars at chin height; sulks, blinks, sighs dramatically and grumbles` |
| `emerge` | P2 | climbing out of the spawn hole | `starts hidden below the bottom edge of the frame and climbs up out of an unseen hole into view, brushes off dirt and stands ready with a sly grin` |
| `kicked` | P2 | booted by the hero (classic) | `gets kicked in the backside from the left, jolts forward with popping eyes and runs off in panic but stays in the centre of the frame` |

- **Make P1 first** for all 6. P2 is optional: the game already fakes both (it slides the walk
  frame up out of the hole, and tilts and flings the kicked one).
- `kicked` and `emerge` are where Veo most likes to move the character sideways or out of the
  frame. Some drift is OK as long as the **whole body stays on screen**: Claude follows the
  character when cropping. If the head or feet leave the frame, regenerate.
- Don't crop or edit the clip. Save it as Flow makes it (16:9).

---

## 4. Character blocks (fill `{LIKENESS}`, `{OUTFIT}`, `{PROP}`, `{MOOD}`)

The likeness notes describe the reference photos. The props and gags carry over from the
current art (they already work in the game).

**`hasina`**: folder `hasina/`
- LIKENESS: an elderly woman with silver-grey hair mostly covered by the end of her sari draped over her head, **thin rectangular metal-framed glasses**, a soft round face with full cheeks, small mouth with a tight polite smile, gentle arched eyebrows
- OUTFIT: an elegant pastel sari (cream, peach or teal) with a wide golden-red border, the sari end over her head
- PROP: pulls a small red rolling suitcase behind her, like someone trying to sneak back home from abroad
- MOOD: bossy and dramatic, a scheming final-boss air with a sly sideways glance

**`quader`**: folder `kader/`
- LIKENESS: an older man with thick swept-back silver-and-black hair, **heavy black rectangular glasses**, a thin neat black moustache, deep smile lines, very expressive eyebrows
- OUTFIT: a dark suit with a white shirt, a red pocket square and a small lapel badge (or a black Mujib coat with a checked scarf)
- PROP: one finger raised mid-speech, a microphone in the other hand
- MOOD: fiery, theatrical, slogan-shouting

**`nanok`**: folder `nanok/`
- LIKENESS: a man in his sixties with thick black hair combed back, thin metal glasses, a **full bushy black moustache**, a broad cheerful face
- OUTFIT: a light beige check blazer over a blue or red open-collar shirt
- PROP: none; heavy stomping stride (he takes 3 kicks)
- MOOD: stubborn, sulky determination

**`taposh`**: folder `tapos/`
- LIKENESS: a middle-aged man with neat side-parted jet-black hair, **black rectangular glasses**, clean-shaven, round smooth face, small calm smile
- OUTFIT: a dark suit, white shirt and dark tie
- PROP: a small mosquito-fogging machine puffing a harmless white cloud (he was city mayor)
- MOOD: nervous darting eyes, ready to dodge sideways

**`shamim`**: folder `samim osman/`
- LIKENESS: an older man with black hair combed back, a **thick black moustache**, strong jaw, stern unsmiling face, heavy eyelids
- OUTFIT: a black sleeveless Mujib coat over a white panjabi, a brown patterned shawl over the shoulders
- PROP: thick gold wristwatch
- MOOD: unbothered, slow, heavy confident stride (very tough)

**`arafat`**: folder `arafat/`
- LIKENESS: a man with **medium-length wavy silver-grey hair** swept back, clean-shaven, prominent nose, animated talking face
- OUTFIT: a grey blazer over a light blue shirt, no tie
- PROP: a studio microphone, a few TV-static sparkles around him (he flickers in and out)
- MOOD: know-it-all smirk, pointing while he talks

---

## 5. Files to deliver

Put everything in `art-src/` (git-ignored, never published), under the **game id** (`quader`
not `kader`, `shamim` not `samim osman`, `taposh` not `tapos`):
```
art-src/enemies/<id>/master.png        16:9 master
art-src/enemies/<id>/walk.mp4          P1
art-src/enemies/<id>/struggle.mp4      P1
art-src/enemies/<id>/jailed.mp4        P1
art-src/enemies/<id>/emerge.mp4        P2 (optional)
art-src/enemies/<id>/kicked.mp4        P2 (optional)
```
Claude picks about 8 frames for the walk loop and 4–6 for the others.

## 6. Checklist per character
- [ ] Master: 16:9, recognisable at a glance, kind caricature, centred, nothing green on the character
- [ ] Clips: whole body on screen the whole time, camera doesn't move, background stays flat green
- [ ] Walk: the end flows back into the start with no jump
- [ ] Saved under the game id in `art-src/`
