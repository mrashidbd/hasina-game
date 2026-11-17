# Plan v3 — from "a game" to "a meme that plays"

Status: **approved 2026-11-17; Phase 1 done (not yet merged to `main`)**. Open decisions at the end of this file. Tick the
boxes as work lands. Earlier plans: `PLAN-v2.md` (done except phase F), `PLAN-lasso.md` (live).

## 1. What the game is for (fresh read)
The ousted regime's people keep hyping on social media that they are "coming back soon". The game
answers that hype with a joke: **every time they try to come back, ordinary Bangladeshis (a
farmer, students, common people) kick them right back out.** It is a troll aimed at that hype,
played and shared by young people.

So the real product is **the moment someone shares it**, not the high score. The gameplay is the
punchline delivery. The game is judged by:
1. **Is it instantly playable from a Facebook / WhatsApp / TikTok link?** (1 tap, under 3 s on mobile data)
2. **Does the run end with something funny worth posting?** (an image, a line, a number to brag about)
3. **Can it answer a new hype claim within hours?** (topical content without code changes)
4. **Does it bring people back tomorrow?** (daily challenge, streaks)

Today the engine and art are solid (two modes, 21 3D characters, bilingual, PWA, offline). Points
1 to 4 are mostly missing. That is where the next work should go.

## 2. Findings

### Macro (product level)
| # | Finding | Why it matters |
|---|---|---|
| M1 | **Sharing is text only.** `navigator.share` with one sentence and a URL. No image. | On Facebook/Instagram/TikTok an image or clip is what spreads. A text line gets ignored. |
| M2 | **Classic mode always ends in defeat** ("BORDER BREACHED! Hasina got in"), and that's what gets shared. | The troll message flips: the shared moment says *she got in*. Frame runs around what the player did: "She tried 6 times. Kicked back 6 times." |
| M3 | **Link previews are broken.** `og:image` is a relative path to the app icon, there is no `og:url`/`twitter:card`, and the text is English only. | Facebook needs an absolute 1200×630 image. The preview card *is* the ad for most of the audience. |
| M4 | **The satire is generic.** Quips are stock lines ("Ouch!", "My hat!"); nothing refers to the actual "coming back" hype or well-known public moments (e.g. the helicopter exit of Aug 2024). | Topical jokes are what make people tag friends. Generic slapstick is just another tap game. |
| M5 | **No way to react to news.** A new hype claim trends → a code change is needed to answer it. | The hype cycle moves in days. A data file of dated events / headlines / quips lets us ship a themed answer in an hour. |
| M6 | **No reason to come back tomorrow.** No daily challenge, no streak, no lifetime stats. | Retention drives repeat shares. |
| M7 | **Funnel friction from a link:** menu → pick mode → pick hero → start (3 taps) before any action. | Social traffic bounces fast. A link should drop the player straight into a run. |
| M8 | **We are blind.** No analytics at all. | We can't tell which mode, language or share path works. A cookie-free counter (GoatCounter / Cloudflare Web Analytics) is enough. |
| M9 | **Weight on BD mobile data:** ~2.6 MB of 384 px PNG, no loading screen. | First load on 3G/4G in Bangladesh is slow; emoji pop into sprites mid-game. |
| M10 | **Hosting / name.** `mrashidbd.github.io/hasina-game` is hard to remember or type, and it ties the game to one GitHub account. | A short custom domain (Bangla-memorable) is better for sharing and resilience. |
| M11 | **Content risk.** Real public figures are named. | Keep to cartoon slapstick and well-known public persona/record. No invented crimes, no gore, no sexualised content (this rule already exists in PLAN-v2). That protects the game from platform takedowns and keeps it for all ages. |

### Micro (game and code level)
| # | Finding |
|---|---|
| m1 | No **win state** in classic: it's endless and only ends with a breach. A "Hasina's return attempt #N foiled" counter per run (and in lifetime stats) gives a positive headline. |
| m2 | Hasina defeat (kicked back) has no big moment. It should get a slow-mo kick, a big banner ("Return cancelled!") and a jingle. It is the core joke. |
| m3 | On portrait phones the **bottom ~35% of the screen is sea** and unused; the map could sit higher or zoom a bit, giving bigger targets. |
| m4 | Hero select comes before every run started from the menu. Remember the hero and offer "change hero" from the game-over screen instead. |
| m5 | Music keeps playing on pause (TODO). Power-up text in the how-to still mentions removed perks (TODO). |
| m6 | `spawnPoint()` can return `null` and silently drop an intruder (TODO). |
| m7 | No automated tests (PLAN-v2 phase F still open). Pure logic is easy to test with `node --test`. |
| m8 | Sound: everything is synth; no Bangla voice lines. Hero shouts ("ধর!", "আর আসবি?", "যা ভাগ!") would add more personality than any visual change. |
| m9 | The how-to screen is long text. A 3-panel picture tutorial (or the first run teaching itself, which the tap hint partly does) reads faster for all ages. |
| m10 | Game-over stats are a 9-cell grid of equal weight. Lead with one big funny number, the rest smaller. |
| m11 | Rope 'Em!: lurkers crowd the side edges on narrow phones (TODO), and rope sounds are missing. |
| m12 | GitHub default branch is still `claude/modest-bohr-vzpqz0` (TODO). |

## 3. Plan (phases in priority order)
Each phase ends with a deploy to `main`, an SW `VERSION` bump, docs updates and a headless
smoke test (desktop + phone). Bulk coding goes to opencode/GLM-5.3 per the team workflow; Claude
writes briefs, reviews and tests. **Bangla copy is written or reviewed by the user** (it carries
the jokes).

### Phase 1 — The share loop (highest impact)
- [x] **Share card:** after a run, draw a 1080×1350 (and 1080×1920 story) image on an off-screen
      canvas: hero sprite kicking Hasina's sprite, a big meme headline (bn/en), score, "return
      attempts foiled ×N", date, and the URL. Share with `navigator.share({ files })`; fall back to
      download + copy text. New module `js/share.js`.
- [x] **Reframe the result:** the classic title and share text lead with what the player did
      ("Hasina tried to come back 4 times. Kicked out 4 times. 🦶"), plus a fun **rank** from the
      score ("Rookie guard" → "Border legend"; names in `i18n.js`, thresholds in `CONFIG`).
- [x] **Challenge links:** shared URL carries `?c=<score>&m=<mode>`. Opening it shows "Your friend
      kicked her out 4 times. Beat that!" with one big Play button.
- [x] **Instant play:** `?play=classic|lasso` (and challenge links) skip menu + hero select, using
      the remembered hero (or a random one).
- [x] **Link preview:** absolute `og:image` 1200×630 made from the art, `og:url`, `twitter:card`,
      Bangla title/description (the main audience), `og:locale` + `og:locale:alternate`.
- [x] Direct buttons for WhatsApp and Facebook in addition to the system share sheet.
- [ ] Test on real phones, including inside the Facebook and Messenger in-app browsers (where
      `navigator.share` with files often fails) and the Facebook Sharing Debugger for the preview.

### Phase 2 — Satire that hits (content)
- [ ] **Hype ticker:** a scrolling "BREAKING" strip on the menu and the wave break, with mock
      "coming back" headlines ("She's returning on the 16th — for the 37th time"), rotating from a
      data list. Bangla first.
- [ ] **Topical quips:** replace the stock lines with 30+ in each language aimed at the comeback
      hype, per tier (Hasina, seniors, smalls). Keep the PLAN-v2 tone rule.
- [ ] **Hasina's entrance and exit:** she arrives by helicopter (a nod to Aug 2024) and gets kicked
      back into it; the defeat gets a slow-mo, a banner ("Return cancelled! ✈️❌") and a jingle.
- [ ] **Voice:** short Bangla shouts for the 4 heroes (recorded by volunteers or generic TTS, no
      cloning of real voices), real kick SFX, a menu loop and a boss loop (`docs/prompts/sound-design.md`).

### Phase 3 — Come back tomorrow (retention)
- [ ] **Daily challenge:** a seeded RNG (date → seed) so everyone gets the same waves that day;
      its own best score and a "Day N" badge on the share card. Needs `Math.random` calls in
      spawning to go through one `rng()` (engine change; brief carefully).
- [ ] **Streaks + lifetime stats:** days played in a row, total crooks kicked, total return
      attempts foiled, shown on the menu ("You've kicked them out 1,204 times").
- [ ] **Cosmetic unlocks only** (kick trails, hero hats, jail decorations) from lifetime stats; no
      upgrades, to keep it simple for all ages.

### Phase 4 — Answer the news fast (live events)
- [ ] `js/data/events.js`: date-ranged events `{ from, to, banner, ticker[], quips[], tweaks }`
      (e.g. Hasina every wave, a themed jail, a special share headline). The game picks the active
      one at start, so shipping a response = edit one data file + bump the SW.
- [ ] A short "meme response" checklist in `docs/` (from a trending claim to live in under 1 h).
- [ ] Prepare events for known dates in advance (16 Dec, 26 Mar, 5 Aug, verdict anniversaries).

### Phase 5 — Reach, speed and quality
- [ ] Sprites at 256 px and/or WebP in the manifest (target under 1 MB total), plus a small
      loading screen with progress.
- [ ] Layout: use the empty sea area on portrait phones (shift or zoom the map), and the
      Rope 'Em! lurk band fix (m3, m11).
- [ ] Cookie-free analytics: plays per mode, language, share-button taps, challenge-link opens.
- [ ] `node --test` unit tests for pure logic (map geometry, wave building, scoring, seeded RNG,
      events picker) + one scripted smoke test in `tools/`.
- [ ] Small fixes: m4, m5, m6, m9, m10, m12.
- [ ] Custom domain (if the user wants one) with GitHub Pages.

### Phase 6 — Optional (needs a backend; decide later)
- [ ] Global counter "Return attempts foiled by all players" and a daily leaderboard
      (Cloudflare Worker + KV or Supabase, free tier). Needs light anti-cheat (server caps).
- [ ] 10 s highlight clip export (`canvas.captureStream` + `MediaRecorder`) for Reels/TikTok.
- [ ] A third ultra-short mode for clips (e.g. 30 s "kick frenzy" at the border).

## 4. Decisions needed from the user
1. Order: start with Phase 1 (share loop)? (recommended)
2. Bangla first? Default to Bangla for everyone except non-Bangla devices, and Bangla in link previews.
3. Analytics: OK to add a cookie-free counter (GoatCounter or Cloudflare)?
4. Custom domain: yes/no, and a name.
5. Backend features (Phase 6): later, never, or now?
6. Who writes the Bangla jokes (ticker, quips, ranks): the user, or Claude drafts and the user edits?
