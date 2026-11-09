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
    power, freeze, wall, shield, sweep, wave, cleared, warn, boss,
    leak, perk, over, record, tap (or .ogg)
  music/{menu,game,boss}.mp3            looping tracks (or .ogg)
```

Art prompts: `docs/prompts/enemy-characters.md`, `docs/prompts/self-characters.md`.
Sound prompts: `docs/prompts/sound-design.md`.
