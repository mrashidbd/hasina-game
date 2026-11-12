# assets/

Game art and sounds. The game only loads files listed in
`js/data/asset-manifest.js`; after adding files run:

```bash
node tools/build-assets.mjs
```

Layout (names per `docs/prompts/`):

```
assets/
  enemies/<id>/{walk,kicked,idle}.png   17 intruders, full-body, facing right
  heroes/<id>/{ready,kick,cheer}.png    4 heroes, full-body, facing right
  sfx/enemies/<id>.mp3                  kick reactions (or .ogg)
  sfx/heroes/<id>.mp3                   kick impacts (or .ogg)
  sfx/game/<name>.mp3                   hit, miss, catch, combo, close,
    power, freeze, shield, wave, cleared, warn, boss,
    leak, over, record, tap (or .ogg)
  music/{menu,game,boss}.mp3            looping tracks (or .ogg)
```

Art prompts: `docs/prompts/enemy-characters.md`, `docs/prompts/self-characters.md`.
Sound prompts: `docs/prompts/sound-design.md`.

## Which folder is whom
All folders already exist (each holds an empty `.gitkeep` so git keeps it; leave it there).
File names are lowercase and exact, e.g. `assets/enemies/quader/walk.png`.

| Folder | Character | Tier |
|---|---|---|
| `enemies/hasina` | Hasina | 1 |
| `enemies/quader` | Obaidul Quader | 2 |
| `enemies/nanok` | Nanok | 2 |
| `enemies/taposh` | Taposh | 2 |
| `enemies/shamim` | Samim Osman | 2 |
| `enemies/arafat` | Arafat | 2 |
| `enemies/nazmul` | Siddique Nazmul | 3 |
| `enemies/zakir` | Zakir | 3 |
| `enemies/momotaz` | Momotaz | 3 |
| `enemies/inan` | Inan | 3 |
| `enemies/shohag` | Shohag | 3 |
| `enemies/saddam` | Saddam | 3 |
| `enemies/murad` | Murad | 3 |
| `enemies/ferdous` | Ferdous | 3 |
| `enemies/mahi` | Mahiya Mahi | 3 |
| `enemies/somrat` | Somrat | 3 |
| `enemies/riyaz` | Riyaz | 3 |
| `heroes/farmer` | Farmer | hero |
| `heroes/studentM` | Student (male) | hero |
| `heroes/studentF` | Student (female) | hero |
| `heroes/common` | Common People | hero |

Hero folder names are case-sensitive on the live site (`studentM`, `studentF`).
