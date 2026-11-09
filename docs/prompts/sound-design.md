# Sound design prompts (ElevenLabs Sound Effects)

Paste each **Prompt** into ElevenLabs → Sound Effects, set the **Duration** shown, keep
*Prompt influence* around 0.5–0.7, generate 3–4 takes and keep the funniest clean one.
Until a file exists the game keeps playing its built-in synth sound, so you can add sounds
one by one.

> Rule: **non-verbal cartoon voices only** (yelps, grunts, squeaks, gasps, no words).
> Don't clone or imitate any real person's voice.

## Technical specs (all files)
- Format: **MP3** (128–192 kbps) or OGG, **mono**, 44.1 kHz
- Trim silence at the start (the sound must hit instantly), short fade-out at the end
- Peak about −1 dBFS; reactions and kicks roughly equally loud (normalise them together)
- Length: reactions ≤ 1.2 s, UI sounds ≤ 0.6 s unless stated
- File names exactly as listed (lowercase)

## 1. Enemy kick reactions — `assets/sfx/enemies/<id>.mp3`
Played when that intruder gets kicked (layered on top of the hero's kick impact), so
**no impact thud here**, only the character's reaction. Each one must be easy to tell apart.

| id | Duration | Prompt |
|---|---|---|
| `hasina` | 1.2 s | Dramatic cartoon outraged gasp of an older woman, rising into a long indignant wail, followed by a tiny comic gong hit, non-verbal, theatrical villain reaction |
| `quader` | 1.0 s | Cartoon man mid-shout at a rally gets cut off into a squeaky surprised yelp, with a short microphone feedback squeal at the end, non-verbal |
| `nanok` | 0.9 s | Deep heavy cartoon "oof" grunt of a big man, then a low rubbery bounce boing, non-verbal |
| `taposh` | 0.8 s | Quick panicked cartoon man yelp followed by a short hiss of a fogging spray machine sputtering, non-verbal |
| `shamim` | 1.0 s | Very deep slow cartoon groan of a huge strongman, like a heavy door creaking, ending with a small surprised hiccup, non-verbal |
| `arafat` | 0.9 s | Smooth confident cartoon man "hm?" that glitches into TV static and a channel-switch blip, non-verbal |
| `saddam` | 0.7 s | Young man's energetic cartoon battle-cry cut short into a high squeak, non-verbal |
| `inan` | 0.7 s | Fast high-pitched cartoon yelp with a quick whistle zip running away, non-verbal |
| `nazmul` | 0.6 s | Short sheepish cartoon "eep!" of a young man, with a tiny slide-whistle down, non-verbal |
| `zakir` | 0.6 s | Short nervous cartoon gulp then a squeaky "hup!", non-verbal |
| `shohag` | 0.7 s | Startled cartoon yelp with comic running footsteps scurrying away, non-verbal |
| `somrat` | 0.9 s | Cocky cartoon chuckle cut off into a yelp, with a jingle of gold chains and coins scattering, non-verbal |
| `murad` | 0.7 s | Embarrassed cartoon whimper with a quick record-scratch, non-verbal |
| `riyaz` | 0.7 s | Smug cartoon "heh" turning into an "oops" squeak, with a soft pop, non-verbal |
| `ferdous` | 1.0 s | Dramatic movie-hero gasp with a short cheesy film orchestral sting and a clapperboard clap, non-verbal |
| `momotaz` | 1.0 s | Woman singing a sustained folk-style vocal note "aaa" that cracks comically into a surprised squeak, non-verbal, no lyrics |
| `mahi` | 0.9 s | Surprised cartoon gasp of a young woman with a phone camera shutter click and a sparkly chime, non-verbal |

## 2. Hero kicks — `assets/sfx/heroes/<id>.mp3`
Played on every tap. This is the **impact**: a whoosh + a meaty comic boot-to-backside thump,
with a short hero shout. Must feel satisfying when repeated fast (combos), so keep them short.

| id | Duration | Prompt |
|---|---|---|
| `farmer` | 0.5 s | Fast swoosh then a heavy comic thump of a bare foot kicking, with a short deep "hah!" grunt of a strong man, cartoon fighting game |
| `studentM` | 0.5 s | Quick whoosh and punchy cartoon kick impact, with a young man's sharp "hyah!" shout, arcade fighting game |
| `studentF` | 0.5 s | Quick whoosh and snappy cartoon kick impact, with a young woman's fierce "hyah!" shout, arcade fighting game |
| `common` | 0.5 s | Whoosh and a flappy sandal slap kick impact, with a cheerful working man's "ey!" shout, cartoon comedy |

## 3. Game sounds — `assets/sfx/game/<name>.mp3`

| name | Duration | Prompt |
|---|---|---|
| `hit` | 0.25 s | Short soft cartoon bonk on a tough character, not fully defeated, light and bouncy |
| `miss` | 0.25 s | Soft muted whiff of a kick missing air, quiet and short |
| `catch` | 0.4 s | Bright rising arcade coin pickup chime, playful, short |
| `combo` | 0.5 s | Quick ascending three-note arcade jingle, sparkly, for a combo multiplier going up |
| `close` | 0.6 s | Tense "phew" swoosh with a bright ding, for a last-second save |
| `power` | 0.6 s | Magical power-up pickup sparkle with a rising synth arpeggio |
| `freeze` | 0.8 s | Icy crystal freezing crackle with a shimmering chime |
| `wall` | 0.8 s | Heavy bricks stacking quickly into a wall, cartoon thud |
| `shield` | 0.7 s | Energy shield deflecting with a metallic bwong and a short electric hum |
| `sweep` | 1.2 s | Big whoosh of a crowd charging forward with a rising roar and a final burst |
| `wave` | 1.0 s | Short heroic brass fanfare, three notes, for "next wave starts" |
| `cleared` | 1.2 s | Triumphant short victory jingle with a drum roll hit, cartoon |
| `warn` | 0.4 s | Short alert ping, two quick high beeps, not annoying |
| `boss` | 1.5 s | Ominous low cartoon villain-arrival drum hit with a dramatic brass "dun dun", the main target is coming |
| `leak` | 0.7 s | Descending sad trombone "wah-wah", short |
| `perk` | 0.8 s | Bright magical upgrade sound with a choir "ahh" swell, non-verbal |
| `over` | 2.0 s | Dramatic game-over sting: low brass fall and a gong, cartoon tragedy |
| `record` | 1.5 s | Celebration with confetti pop, crowd cheer and a bright fanfare |
| `tap` | 0.1 s | Tiny soft UI click for menu buttons |

## 4. Music (optional) — `assets/music/`
ElevenLabs Music (or any music tool). Loop-able, no vocals with words.

| file | Length | Prompt |
|---|---|---|
| `menu.mp3` | 30–60 s loop | Upbeat playful Bangladeshi folk-pop instrumental, dotara, flute and dhol, cheerful and patriotic, cartoon game menu, seamless loop |
| `game.mp3` | 60–90 s loop | Fast energetic arcade action track with Bangladeshi dhol rhythms, dotara riff and synth bass, tense but fun, 140 BPM, seamless loop |
| `boss.mp3` | 30–60 s loop | Intense dramatic boss-fight version of the same theme, heavy dhol, low brass, urgent, seamless loop |

Music volume will be set lower than effects in `js/config.js` (and mutable with the 🔊 button).
