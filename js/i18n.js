// English / Bangla strings. Add a key to both languages when adding UI text.
const STRINGS = {
  en: {
    title: 'Keep Them Out!',
    tagline: 'The crooks are trying to sneak back in from across the border.<br>Tap them before they reach Bangladesh!',
    play: '▶ KEEP THEM OUT',
    how: 'How to play & points',
    install: '📲 Install app',
    iosHint: 'On iPhone: tap <b>Share</b> → <b>Add to Home Screen</b> to install.',
    disclaimer: 'Characters are placeholders. Satire / fan game.',
    best: 'Best: {score} · wave {wave}',
    noBest: 'No record yet. Be the first guard!',
    langBtn: 'বাংলা',
    howTitle: 'How to play',
    rules: [
      '<b>Tap / click</b> intruders to catch them and send them back.',
      '<b>Tap</b> an intruder and <b>your hero</b> kicks them back towards India.',
      'If <b>Hasina</b> crosses the border, it\'s <b>game over</b> (unless you have a 🛡️ shield, which throws her back).',
      'If a <b>senior leader</b> gets in you lose <b>200</b> points; a <b>small leader</b> costs <b>50</b>. The game goes on.',
      'Hasina comes every 3rd wave (every 2nd from wave 12), gets tougher each time, and keeps calling in helpers.',
      'Catch quickly in a row for a <b>combo</b>: every 5 catches raises the multiplier (up to <b>x5</b>). Missed taps break the combo.',
      'Catch someone right at the border: <b>Close call +25</b>.',
      'Clear a wave: <b>+50 × wave</b>. 90%+ accuracy: <b>+25 × wave</b>. Nobody got in: <b>+30 × wave</b>.',
      'A flashing <b>!</b> marks where the next intruder will appear (a gold 👑 means Hasina).',
    ],
    intruders: 'Intruders',
    tier1: 'Main target', tier1Note: 'Gets in = GAME OVER',
    tier2: 'Senior leaders', tier3: 'Small leaders', tierPenalty: 'Gets in = −{n} points',
    powerups: 'Power-ups',
    tapCollect: '(tap to collect)',
    keys: 'Desktop: <kbd>R</kbd> turn (rope mode) · <kbd>P</kbd>/<kbd>Esc</kbd> pause · <kbd>Enter</kbd> play',
    gotIt: 'Got it',
    taps: '{n} taps', tap1: '1 tap', fromWave: 'from wave {n}', pts: 'pts',
    paused: 'Paused', resume: '▶ Resume', quit: 'Quit to menu',
    breached: 'BORDER BREACHED!',
    breachReason: '{who} got into Bangladesh on wave {wave}.',
    record: '🏆 NEW RECORD!',
    again: '↻ Play again', share: 'Share score', menu: 'Menu',
    sWave: 'Wave reached', sCaught: 'Intruders caught', sCombo: 'Best combo', sAcc: 'Accuracy',
    sClose: 'Close calls', sMain: 'Hasina stopped', sLeaked: 'Got in', sLost: 'Points lost', sBest: 'Best score',
    hudScore: 'SCORE', hudWave: 'WAVE',
    comboHud: '{n} combo · x{m}',
    wave: 'Wave {n}', mainIncoming: '⚠️ Hasina is coming!', nIntruders: '{n} intruders',
    cleared: 'Wave {n} cleared!', clearBonus: 'Clear bonus +{n}', sharp: 'Sharpshooter +{n}', noLeaks: 'Sealed +{n}', leaked: 'GOT IN',
    comboLost: 'combo lost', closeCall: 'CLOSE CALL!', shieldBroken: 'SHIELD BROKEN!',
    tapHint: '👆 TAP!',
    // Funny reaction bubbles ("Ouch!") over caught characters (js/game.js).
    quips: [
      'Ouch!', 'Not again!', 'I was just visiting!', 'My lawyer will hear of this!',
      'Let me go!', "It wasn't me!", 'Help!', 'Okay okay!', 'Wrong person!',
      'I live here, I swear!', 'I dropped my wallet!', 'My hat!', 'Not so hard!', 'Wait, my shoe!',
    ],
    quipsMain: [
      'Do you know who I am?!', 'This is a conspiracy!', 'Call Delhi!',
      'I will remember this!', 'How dare you!', 'This is all a mistake!',
    ],
    // "Rope 'Em!" mode
    playLasso: "🪢 ROPE 'EM!",
    hudLevel: 'LEVEL', hudLocked: 'JAILED', hudLives: 'LIVES', dirBtn: 'Reverse direction',
    lLevelUp: 'LEVEL {n}!',
    lSneaking: 'sneaking in!', lGotIn: 'GOT IN!',
    lSnapped: 'SNAPPED!', lDodged: 'dodged!', lTapFast: 'TAP TAP!',
    lHint: '👆 Tap a crook to throw the rope',
    lMainSpotted: '👑 Hasina spotted!', lMainSub: 'The fastest of them all — lock her up before she slips away!',
    lMainGone: '💨 Hasina slipped away!',
    lReeling: 'tap to reel in!', lOnTheLoose: 'on the loose',
    lWinTitle: 'YOU WIN!', lWinReason: 'Hasina is behind bars — case closed in {time} s!',
    lLostTitle: 'OVERRUN!', lOverSneak: 'Three crooks made it into Dhaka. The city is overrun.',
    lShareWin: "I locked up Hasina and won Rope 'Em! with {score} points in {time} s! Can you beat that?",
    lShareText: "I reached level {level} and scored {score} points in Rope 'Em! Can you beat me?",
    lHowTitle: "🪢 Rope 'Em! mode",
    lRules: [
      'The crooks <b>lurk on Indian land</b> around Bangladesh. Every now and then one <b>sneaks in</b> and runs for Dhaka — 3 that get in end the run (❤️❤️❤️).',
      'Your hero <b>circles the jail at Dhaka</b>. <b>Tap</b> a crook or a spot: in reach (the faint ring) the rope flies at once; out of reach the hero runs over, throws and returns. ⇄ (or <kbd>R</kbd>) flips the orbit direction.',
      'The loop homes in on the crook you tapped (stealthy or dodging ones can slip it). Small crooks are pulled in at once; tough ones need <b>fast tapping</b> to fill the tug meter before the rope snaps.',
      'Caught crooks are flung into the <b>jail at Dhaka</b> — points × combo. Every <b>6 lockups</b> is a level-up: more crooks, faster crooks, sneakier crooks.',
      'After <b>12 lockups Hasina</b> shows up — fastest of them all, she never sneaks in, and slips away if not caught in ~30 s. <b>Lock her up and you win!</b> Bonus: 500 × ❤️ left.',
    ],
    sLevel: 'Level reached', sLocked: 'Locked up', sLives: '❤️ left', sTime: 'Time (s)',
    bestLasso: "Rope 'Em best: {score} · level {wave}",
    copied: 'Copied!', copiedSub: 'Share text copied to clipboard',
    shareText: 'I kept them out of Bangladesh until wave {wave} and scored {score} points in Keep Them Out! Can you beat me?',
    char: {
      hasina: 'Hasina', quader: 'Obaidul Quader', nanok: 'Nanok', taposh: 'Taposh',
      shamim: 'Samim Osman', arafat: 'Arafat',
      nazmul: 'Siddique Nazmul', zakir: 'Zakir', momotaz: 'Momotaz', inan: 'Inan',
      shohag: 'Shohag', saddam: 'Saddam', murad: 'Murad', ferdous: 'Ferdous',
      mahi: 'Mahiya Mahi', somrat: 'Somrat', riyaz: 'Riyaz',
    },
    trait: {
      hasina: 'Slow, very tough, calls in helpers', quader: 'Calls in small leaders',
      nanok: 'Takes 3 kicks', taposh: 'Jumps aside when kicked', shamim: 'Very tough, very slow',
      arafat: 'Flickers like a TV signal',
      nazmul: 'Basic', zakir: 'Basic', momotaz: 'Basic',
      inan: 'Fast, zig-zags', shohag: 'Fast, zig-zags', saddam: 'Comes in a pack of 3',
      murad: 'Fast, zig-zags', ferdous: 'Fades in and out', mahi: 'Fades in and out',
      somrat: 'Splits in two when kicked', riyaz: 'Splits in two when kicked',
    },
    hero: {
      farmer: 'Farmer', studentM: 'Student', studentF: 'Student', common: 'Common People',
    },
    heroTitle: 'Choose your champion',
    heroDesc: {
      farmer: 'Hard work, harder kicks', studentM: 'Quick feet, fearless heart',
      studentF: 'Sharp mind, sharper kick', common: 'The people’s champion',
    },
    start: '▶ Start',
    map: { india: 'INDIA', myanmar: 'MYANMAR', bay: 'BAY OF BENGAL', dhaka: 'Dhaka' },
    pu: { freeze: 'FREEZE!', shield: '+1 SHIELD' },
    puName: { freeze: 'Freeze', shield: 'Shield' },
    puDesc: {
      freeze: 'Freezes everyone for 4s',
      shield: 'Throws Hasina back once (max 3)',
    },
  },
  bn: {
    title: 'ঢুকতে দেবো না!',
    tagline: 'দুর্নীতিবাজরা সীমান্ত পেরিয়ে আবার ঢোকার চেষ্টা করছে।<br>বাংলাদেশে পৌঁছানোর আগেই ওদের ধরো!',
    play: '▶ ঢুকতে দেবো না',
    how: 'কীভাবে খেলবে ও পয়েন্ট',
    install: '📲 অ্যাপ ইনস্টল করো',
    iosHint: 'আইফোনে: <b>Share</b> → <b>Add to Home Screen</b> চাপো।',
    disclaimer: 'চরিত্রগুলো আপাতত ডামি। ব্যঙ্গাত্মক / ফ্যান গেম।',
    best: 'সেরা: {score} · ওয়েভ {wave}',
    noBest: 'এখনো কোনো রেকর্ড নেই। প্রথম পাহারাদার হও!',
    langBtn: 'English',
    howTitle: 'কীভাবে খেলবে',
    rules: [
      'অনুপ্রবেশকারীদের <b>ট্যাপ / ক্লিক</b> করে ধরো এবং ফেরত পাঠাও।',
      'অনুপ্রবেশকারীকে <b>ট্যাপ করলে</b> <b>তোমার নায়ক</b> লাথি মেরে ভারতের দিকে পাঠায়।',
      '<b>হাসিনা</b> সীমান্ত পেরোলেই <b>খেলা শেষ</b> (যদি না তোমার 🛡️ শিল্ড থাকে, যা তাকে পেছনে ছুড়ে দেয়)।',
      '<b>সিনিয়র নেতা</b> ঢুকলে <b>২০০</b> পয়েন্ট কাটা যাবে; <b>ছোট নেতা</b> ঢুকলে <b>৫০</b>। খেলা চলতে থাকবে।',
      'হাসিনা প্রতি ৩য় ওয়েভে আসে (ওয়েভ ১২ থেকে প্রতি ২য়), প্রতিবার আরও শক্ত হয় এবং সাহায্যকারী ডাকে।',
      'দ্রুত পরপর ধরলে <b>কম্বো</b> হয়: প্রতি ৫টি ধরায় গুণক বাড়ে (সর্বোচ্চ <b>x৫</b>)। ভুল ট্যাপে কম্বো ভেঙে যায়।',
      'একদম সীমান্তে ধরলে: <b>অল্পের জন্য +২৫</b>।',
      'ওয়েভ শেষ করলে: <b>+৫০ × ওয়েভ</b>। ৯০%+ নির্ভুলতায়: <b>+২৫ × ওয়েভ</b>। কেউ ঢুকতে না পারলে: <b>+৩০ × ওয়েভ</b>।',
      'জ্বলজ্বলে <b>!</b> চিহ্ন দেখায় পরের অনুপ্রবেশকারী কোথায় আসবে (সোনালি 👑 মানে হাসিনা)।',
    ],
    intruders: 'অনুপ্রবেশকারী',
    tier1: 'প্রধান লক্ষ্য', tier1Note: 'ঢুকলেই খেলা শেষ',
    tier2: 'সিনিয়র নেতা', tier3: 'ছোট নেতা', tierPenalty: 'ঢুকলে −{n} পয়েন্ট',
    powerups: 'পাওয়ার-আপ',
    tapCollect: '(ট্যাপ করে নাও)',
    keys: 'কম্পিউটারে: <kbd>R</kbd> দিক বদল (দড়ি মোড) · <kbd>P</kbd>/<kbd>Esc</kbd> বিরতি · <kbd>Enter</kbd> খেলো',
    gotIt: 'বুঝেছি',
    taps: '{n} ট্যাপ', tap1: '১ ট্যাপ', fromWave: 'ওয়েভ {n} থেকে', pts: 'পয়েন্ট',
    paused: 'বিরতি', resume: '▶ চালিয়ে যাও', quit: 'মেনুতে ফেরো',
    breached: 'সীমান্ত ভেদ হয়েছে!',
    breachReason: 'ওয়েভ {wave}-এ {who} বাংলাদেশে ঢুকে পড়েছে।',
    record: '🏆 নতুন রেকর্ড!',
    again: '↻ আবার খেলো', share: 'স্কোর শেয়ার করো', menu: 'মেনু',
    sWave: 'ওয়েভ', sCaught: 'ধরা পড়েছে', sCombo: 'সেরা কম্বো', sAcc: 'নির্ভুলতা',
    sClose: 'অল্পের জন্য', sMain: 'হাসিনা থামানো', sLeaked: 'ঢুকে পড়েছে', sLost: 'হারানো পয়েন্ট', sBest: 'সেরা স্কোর',
    hudScore: 'স্কোর', hudWave: 'ওয়েভ',
    comboHud: '{n} কম্বো · x{m}',
    wave: 'ওয়েভ {n}', mainIncoming: '⚠️ হাসিনা আসছে!', nIntruders: '{n} জন অনুপ্রবেশকারী',
    cleared: 'ওয়েভ {n} শেষ!', clearBonus: 'বোনাস +{n}', sharp: 'নিখুঁত নিশানা +{n}', noLeaks: 'সীমান্ত সিল +{n}', leaked: 'ঢুকে পড়েছে',
    comboLost: 'কম্বো শেষ', closeCall: 'অল্পের জন্য!', shieldBroken: 'শিল্ড ভেঙেছে!',
    tapHint: '👆 ধরো!',
    // ধরা পড়া চরিত্রদের মজার ছোট বুদবুদ-ডায়ালগ (js/game.js)।
    quips: [
      'আরে বাবা!', 'আবারও!', 'ঘুরতেই এসেছিলাম!', 'উকিল সব শুনবে!',
      'ছেড়ে দাও না!', 'আমি না, আমি না!', 'বাঁচাও!', 'ঠিক আছে, ঠিক আছে!', 'ভুল লোক ধরেছ!',
      'আমি তো এখানকারই লোক!', 'মানিব্যাগ পড়ে গেল!', 'টুপিটা রইল কোথায়!', 'এত জোরে না!', 'জুতাটা পড়ে গেল!',
    ],
    quipsMain: [
      'আমার পরিচয় জানো?!', 'এ যে ষড়যন্ত্র!', 'দিল্লিতে ফোন দাও!',
      'মনে রাখব মনে রাখব!', 'কী সাহস!', 'সবই ভুল বুঝেছ!',
    ],
    // "দড়ি মারো!" মোড
    playLasso: '🪢 দড়ি মারো!',
    hudLevel: 'লেভেল', hudLocked: 'জেলে', hudLives: 'জীবন', dirBtn: 'দিক বদলাও',
    lLevelUp: 'লেভেল {n}!',
    lSneaking: 'চুপিচুপি ঢুকছে!', lGotIn: 'ঢুকে পড়েছে!',
    lSnapped: 'দড়ি ছিঁড়ে গেল!', lDodged: 'ফসকে গেল!', lTapFast: 'টানো টানো!',
    lHint: '👆 কাউকে ট্যাপ করে দড়ি ছোড়ো',
    lMainSpotted: '👑 হাসিনাকে দেখা গেছে!', lMainSub: 'সবার চেয়ে দ্রুত — পালিয়ে যাওয়ার আগেই জেলে ভরো!',
    lMainGone: '💨 হাসিনা পালিয়ে গেল!',
    lReeling: 'ট্যাপ করে টেনে আনো!', lOnTheLoose: 'ঘুরে বেড়াচ্ছে',
    lWinTitle: 'তুমি জিতেছ!', lWinReason: 'হাসিনা এখন জেলে — {time} সেকেন্ডে মামলা নিষ্পত্তি!',
    lLostTitle: 'শহর দখল হয়ে গেছে!', lOverSneak: 'তিনজন দুর্বৃত্ত ঢাকায় ঢুকে পড়েছে।',
    lShareWin: '"দড়ি মারো!" খেলায় আমি হাসিনাকে জেলে ভরে {score} পয়েন্ট নিয়ে জিতেছি ({time} সেকেন্ড)! তুমি পারবে?',
    lShareText: '"দড়ি মারো!" খেলায় আমি লেভেল {level} পর্যন্ত গিয়ে {score} পয়েন্ট পেয়েছি! তুমি পারবে?',
    lHowTitle: '🪢 "দড়ি মারো!" মোড',
    lRules: [
      'দুর্বৃত্তরা বাংলাদেশের চারপাশে <b>ভারতের জমিতে ঘুরে বেড়ায়</b>। মাঝে মাঝে একজন <b>চুপিচুপি ঢুকে</b> ঢাকার দিকে ছোটে — ৩ জন ঢুকলে খেলা শেষ (❤️❤️❤️)।',
      'তোমার নায়ক <b>ঢাকার জেলঘর ঘিরে ঘোরে</b>। কাউকে বা কোনো জায়গায় <b>ট্যাপ</b> করো: নাগালের মধ্যে হলে (হালকা বৃত্ত) সঙ্গে সঙ্গে দড়ি যায়, বাইরে হলে নায়ক ছুটে গিয়ে দড়ি ছুড়ে ফিরে আসে। ⇄ (বা <kbd>R</kbd>) ঘোরার দিক বদলায়।',
      'ফাঁদ ট্যাপ করা কারও পেছন পেছন এগোয় (আড়াল হওয়া বা পাশে লাফানো কেউ ফাঁদ এড়িয়ে যেতে পারে)। ছোটদের সঙ্গে সঙ্গে টেনে আনা যায়; শক্তদের জন্য দড়ি ছেঁড়ার আগে <b>দ্রুত ট্যাপ</b> করে টানার মিটার ভরতে হয়।',
      'ধরা পড়লে দুর্বৃত্তদের ছুড়ে দেওয়া হয় <b>ঢাকার জেলে</b> — পয়েন্ট × কম্বো। প্রতি <b>৬টি বন্দিতে একটি লেভেল</b>: বেশি দুর্বৃত্ত, দ্রুততর দুর্বৃত্ত, বেশি চুপিচুপি ঢোকা।',
      '<b>১২টি বন্দির পর হাসিনা</b> আসে — সবার চেয়ে দ্রুত, নিজে কখনো ঢুকতে আসে না, আর সময়মতো না ধরলে পালিয়ে যায়। <b>তাকে জেলে ভরলেই তুমি জিতে যাবে!</b> বোনাস: ৫০০ × বাকি ❤️।',
    ],
    sLevel: 'লেভেল', sLocked: 'জেলে ভরা', sLives: 'বাকি ❤️', sTime: 'সময় (সেকেন্ড)',
    bestLasso: 'দড়ি মারো সেরা: {score} · লেভেল {wave}',
    copied: 'কপি হয়েছে!', copiedSub: 'শেয়ারের লেখা কপি হয়েছে',
    shareText: '"ঢুকতে দেবো না!" খেলায় আমি ওয়েভ {wave} পর্যন্ত সীমান্ত পাহারা দিয়ে {score} পয়েন্ট পেয়েছি! তুমি পারবে?',
    char: {
      hasina: 'হাসিনা', quader: 'ওবায়দুল কাদের', nanok: 'নানক', taposh: 'তাপস',
      shamim: 'শামীম ওসমান', arafat: 'আরাফাত',
      nazmul: 'সিদ্দিকী নাজমুল', zakir: 'জাকির', momotaz: 'মমতাজ', inan: 'ইনান',
      shohag: 'সোহাগ', saddam: 'সাদ্দাম', murad: 'মুরাদ', ferdous: 'ফেরদৌস',
      mahi: 'মাহিয়া মাহি', somrat: 'সম্রাট', riyaz: 'রিয়াজ',
    },
    trait: {
      hasina: 'ধীরে চলে, খুব শক্ত, সাহায্যকারী ডাকে', quader: 'ছোট নেতাদের ডাকে',
      nanok: '৩ বার লাথি লাগে', taposh: 'লাথি খেলে পাশে লাফ দেয়', shamim: 'খুব শক্ত, খুব ধীর',
      arafat: 'টিভি সিগন্যালের মতো ঝিলমিল করে',
      nazmul: 'সাধারণ', zakir: 'সাধারণ', momotaz: 'সাধারণ',
      inan: 'দ্রুত, এঁকেবেঁকে চলে', shohag: 'দ্রুত, এঁকেবেঁকে চলে', saddam: '৩ জনের দলে আসে',
      murad: 'দ্রুত, এঁকেবেঁকে চলে', ferdous: 'দেখা যায়, আবার মিলিয়ে যায়', mahi: 'দেখা যায়, আবার মিলিয়ে যায়',
      somrat: 'লাথি খেলে দুই ভাগ হয়ে যায়', riyaz: 'লাথি খেলে দুই ভাগ হয়ে যায়',
    },
    hero: {
      farmer: 'কৃষক', studentM: 'ছাত্র', studentF: 'ছাত্রী', common: 'সাধারণ মানুষ',
    },
    heroTitle: 'তোমার নায়ক বেছে নাও',
    heroDesc: {
      farmer: 'পরিশ্রমী হাত, কঠোর লাথি', studentM: 'দ্রুত পা, নির্ভীক মন',
      studentF: 'তীক্ষ্ণ বুদ্ধি, আরও তীক্ষ্ণ লাথি', common: 'জনগণের চ্যাম্পিয়ন',
    },
    start: '▶ শুরু করো',
    map: { india: 'ভারত', myanmar: 'মিয়ানমার', bay: 'বঙ্গোপসাগর', dhaka: 'ঢাকা' },
    pu: { freeze: 'জমে যাও!', shield: '+১ শিল্ড' },
    puName: { freeze: 'বরফ', shield: 'শিল্ড' },
    puDesc: {
      freeze: '৪ সেকেন্ড সবাই থেমে থাকবে',
      shield: 'একবার হাসিনাকে পেছনে ছুড়ে দেয় (সর্বোচ্চ ৩)',
    },
  },
};

function detect() {
  try {
    const saved = localStorage.getItem('kto-lang');
    if (saved && STRINGS[saved]) return saved;
  } catch { /* storage unavailable */ }
  return (navigator.language || '').toLowerCase().startsWith('bn') ? 'bn' : 'en';
}

let lang = detect();

export const getLang = () => lang;
export function setLang(l) {
  lang = STRINGS[l] ? l : 'en';
  try { localStorage.setItem('kto-lang', lang); } catch { /* ignore */ }
}

const BN_DIGITS = '০১২৩৪৫৬৭৮৯';
/** Format a number with locale digits (Bangla digits in bn). */
export function fmt(n) {
  const s = Number(n).toLocaleString('en-US');
  return lang === 'bn' ? s.replace(/\d/g, (d) => BN_DIGITS[d]) : s;
}

/** Look up a key like 'char.cadre' and fill {placeholders}. Numbers are localized. */
export function t(key, vars = {}) {
  const get = (dict) => key.split('.').reduce((o, k) => o?.[k], dict);
  let s = get(STRINGS[lang]) ?? get(STRINGS.en) ?? key;
  if (typeof s !== 'string') return s;
  for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, typeof v === 'number' ? fmt(v) : v);
  return s;
}
