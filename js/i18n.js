// English / Bangla strings. Add a key to both languages when adding UI text.
const STRINGS = {
  en: {
    title: 'Keep Them Out!',
    tagline: 'The crooks are trying to sneak back in from across the border.<br>Tap them before they reach Bangladesh!',
    play: '▶ PLAY',
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
      'If <b>Hasina</b> crosses the border, it\'s <b>game over</b> (unless you have a 🛡️ shield, which throws her back).',
      'If a <b>senior leader</b> gets in you lose <b>200</b> points; a <b>small leader</b> costs <b>50</b>. The game goes on.',
      'Hasina comes every 3rd wave (every 2nd from wave 12), gets tougher each time, and keeps calling in helpers.',
      'Catch quickly in a row for a <b>combo</b>: every 5 catches raises the multiplier (up to <b>x5</b>). Missed taps break the combo.',
      'Catch someone right at the border: <b>Close call +25</b>.',
      'Clear a wave: <b>+50 × wave</b>. 90%+ accuracy: <b>+25 × wave</b>. Nobody got in: <b>+30 × wave</b>.',
      'Catches fill the <b>⚡ Sweep</b> meter. When it\'s full, press it (or <kbd>Space</kbd>) to catch everyone on screen (half points; Hasina only takes 4 damage).',
      'A flashing <b>!</b> marks where the next intruder will appear (a gold 👑 means Hasina).',
      'Every 2 waves you pick an <b>upgrade</b>: bigger taps, longer freezes, more power-ups and more.',
    ],
    intruders: 'Intruders',
    tier1: 'Main target', tier1Note: 'Gets in = GAME OVER',
    tier2: 'Senior leaders', tier3: 'Small leaders', tierPenalty: 'Gets in = −{n} points',
    powerups: 'Power-ups',
    tapCollect: '(tap to collect)',
    keys: 'Desktop: <kbd>Space</kbd> sweep · <kbd>P</kbd>/<kbd>Esc</kbd> pause · <kbd>Enter</kbd> play',
    gotIt: 'Got it',
    taps: '{n} taps', tap1: '1 tap', fromWave: 'from wave {n}', pts: 'pts',
    paused: 'Paused', resume: '▶ Resume', quit: 'Quit to menu',
    breached: 'BORDER BREACHED!',
    breachReason: '{who} got into Bangladesh on wave {wave}.',
    record: '🏆 NEW RECORD!',
    again: '↻ Play again', share: 'Share score', menu: 'Menu',
    sWave: 'Wave reached', sCaught: 'Intruders caught', sCombo: 'Best combo', sAcc: 'Accuracy',
    sClose: 'Close calls', sPerks: 'Upgrades', sMain: 'Hasina stopped', sLeaked: 'Got in', sLost: 'Points lost', sBest: 'Best score',
    hudScore: 'SCORE', hudWave: 'WAVE', sweep: '⚡ SWEEP',
    comboHud: '{n} combo · x{m}',
    wave: 'Wave {n}', mainIncoming: '⚠️ Hasina is coming!', nIntruders: '{n} intruders',
    cleared: 'Wave {n} cleared!', clearBonus: 'Clear bonus +{n}', sharp: 'Sharpshooter +{n}', noLeaks: 'Sealed +{n}', leaked: 'GOT IN',
    comboLost: 'combo lost', closeCall: 'CLOSE CALL!', shieldBroken: 'SHIELD BROKEN!',
    tapHint: '👆 TAP!',
    copied: 'Copied!', copiedSub: 'Share text copied to clipboard',
    shareText: 'I kept them out of Bangladesh until wave {wave} and scored {score} points in Keep Them Out! Can you beat me?',
    // Placeholder names, to be replaced with the real roster later.
    char: {
      hasina: 'Hasina',
      senior1: 'Senior Leader 1', senior2: 'Senior Leader 2', senior3: 'Senior Leader 3', senior4: 'Senior Leader 4',
      small1: 'Small Leader 1', small2: 'Small Leader 2', small3: 'Small Leader 3', small4: 'Small Leader 4',
      small5: 'Small Leader 5',
    },
    trait: {
      hasina: 'Slow, very tough, calls in helpers', senior1: 'Takes 3 hits', senior2: 'Jumps aside when hit',
      senior3: 'Calls in small leaders', senior4: 'Very tough, very slow',
      small1: 'Basic', small2: 'Fast, zig-zags', small3: 'Fades in and out', small4: 'Comes in packs of 3',
      small5: 'Splits in two when caught',
    },
    perkTitle: 'Choose an upgrade',
    perkSub: 'Wave {n} cleared. Pick one, it lasts for the rest of the run.',
    perkName: {
      reach: 'Long Arms', push: 'Strong Push', charge: 'Quick Charge', luck: 'Lucky Finds',
      rhythm: 'Rhythm', cold: 'Cold Storage', shield: 'Spare Shield',
    },
    perkDesc: {
      reach: 'Tap radius +25%', push: 'Tough intruders get pushed back twice as far',
      charge: 'Sweep meter fills 30% faster', luck: 'Power-up drop chance +4%',
      rhythm: 'Combo window +0.5s', cold: 'Freeze +2s, Border Wall +3s',
      shield: '+1 shield right now',
    },
    map: { india: 'INDIA', myanmar: 'MYANMAR', bay: 'BAY OF BENGAL', dhaka: 'Dhaka' },
    pu: { freeze: 'FREEZE!', wall: 'BORDER WALL!', shield: '+1 SHIELD', charge: 'SWEEP +40' },
    puName: { freeze: 'Freeze', wall: 'Border Wall', shield: 'Shield', charge: 'Charge' },
    puDesc: {
      freeze: 'Freezes everyone for 4s', wall: 'Slows intruders for 7s',
      shield: 'Throws Hasina back once (max 3)', charge: 'Fills the Sweep meter',
    },
  },
  bn: {
    title: 'ঢুকতে দেবো না!',
    tagline: 'দুর্নীতিবাজরা সীমান্ত পেরিয়ে আবার ঢোকার চেষ্টা করছে।<br>বাংলাদেশে পৌঁছানোর আগেই ওদের ধরো!',
    play: '▶ খেলো',
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
      '<b>হাসিনা</b> সীমান্ত পেরোলেই <b>খেলা শেষ</b> (যদি না তোমার 🛡️ শিল্ড থাকে, যা তাকে পেছনে ছুড়ে দেয়)।',
      '<b>সিনিয়র নেতা</b> ঢুকলে <b>২০০</b> পয়েন্ট কাটা যাবে; <b>ছোট নেতা</b> ঢুকলে <b>৫০</b>। খেলা চলতে থাকবে।',
      'হাসিনা প্রতি ৩য় ওয়েভে আসে (ওয়েভ ১২ থেকে প্রতি ২য়), প্রতিবার আরও শক্ত হয় এবং সাহায্যকারী ডাকে।',
      'দ্রুত পরপর ধরলে <b>কম্বো</b> হয়: প্রতি ৫টি ধরায় গুণক বাড়ে (সর্বোচ্চ <b>x৫</b>)। ভুল ট্যাপে কম্বো ভেঙে যায়।',
      'একদম সীমান্তে ধরলে: <b>অল্পের জন্য +২৫</b>।',
      'ওয়েভ শেষ করলে: <b>+৫০ × ওয়েভ</b>। ৯০%+ নির্ভুলতায়: <b>+২৫ × ওয়েভ</b>। কেউ ঢুকতে না পারলে: <b>+৩০ × ওয়েভ</b>।',
      'ধরলে <b>⚡ সুইপ</b> মিটার ভরে। পূর্ণ হলে চাপো (বা <kbd>Space</kbd>), পর্দার সবাই ধরা পড়বে (অর্ধেক পয়েন্ট; হাসিনা শুধু ৪ ক্ষতি পায়)।',
      'জ্বলজ্বলে <b>!</b> চিহ্ন দেখায় পরের অনুপ্রবেশকারী কোথায় আসবে (সোনালি 👑 মানে হাসিনা)।',
      'প্রতি ২ ওয়েভ পরপর একটি <b>আপগ্রেড</b> বেছে নাও: বড় ট্যাপ, লম্বা বরফ, বেশি পাওয়ার-আপ ইত্যাদি।',
    ],
    intruders: 'অনুপ্রবেশকারী',
    tier1: 'প্রধান লক্ষ্য', tier1Note: 'ঢুকলেই খেলা শেষ',
    tier2: 'সিনিয়র নেতা', tier3: 'ছোট নেতা', tierPenalty: 'ঢুকলে −{n} পয়েন্ট',
    powerups: 'পাওয়ার-আপ',
    tapCollect: '(ট্যাপ করে নাও)',
    keys: 'কম্পিউটারে: <kbd>Space</kbd> সুইপ · <kbd>P</kbd>/<kbd>Esc</kbd> বিরতি · <kbd>Enter</kbd> খেলো',
    gotIt: 'বুঝেছি',
    taps: '{n} ট্যাপ', tap1: '১ ট্যাপ', fromWave: 'ওয়েভ {n} থেকে', pts: 'পয়েন্ট',
    paused: 'বিরতি', resume: '▶ চালিয়ে যাও', quit: 'মেনুতে ফেরো',
    breached: 'সীমান্ত ভেদ হয়েছে!',
    breachReason: 'ওয়েভ {wave}-এ {who} বাংলাদেশে ঢুকে পড়েছে।',
    record: '🏆 নতুন রেকর্ড!',
    again: '↻ আবার খেলো', share: 'স্কোর শেয়ার করো', menu: 'মেনু',
    sWave: 'ওয়েভ', sCaught: 'ধরা পড়েছে', sCombo: 'সেরা কম্বো', sAcc: 'নির্ভুলতা',
    sClose: 'অল্পের জন্য', sPerks: 'আপগ্রেড', sMain: 'হাসিনা থামানো', sLeaked: 'ঢুকে পড়েছে', sLost: 'হারানো পয়েন্ট', sBest: 'সেরা স্কোর',
    hudScore: 'স্কোর', hudWave: 'ওয়েভ', sweep: '⚡ সুইপ',
    comboHud: '{n} কম্বো · x{m}',
    wave: 'ওয়েভ {n}', mainIncoming: '⚠️ হাসিনা আসছে!', nIntruders: '{n} জন অনুপ্রবেশকারী',
    cleared: 'ওয়েভ {n} শেষ!', clearBonus: 'বোনাস +{n}', sharp: 'নিখুঁত নিশানা +{n}', noLeaks: 'সীমান্ত সিল +{n}', leaked: 'ঢুকে পড়েছে',
    comboLost: 'কম্বো শেষ', closeCall: 'অল্পের জন্য!', shieldBroken: 'শিল্ড ভেঙেছে!',
    tapHint: '👆 ধরো!',
    copied: 'কপি হয়েছে!', copiedSub: 'শেয়ারের লেখা কপি হয়েছে',
    shareText: '"ঢুকতে দেবো না!" খেলায় আমি ওয়েভ {wave} পর্যন্ত সীমান্ত পাহারা দিয়ে {score} পয়েন্ট পেয়েছি! তুমি পারবে?',
    char: {
      hasina: 'হাসিনা',
      senior1: 'সিনিয়র নেতা ১', senior2: 'সিনিয়র নেতা ২', senior3: 'সিনিয়র নেতা ৩', senior4: 'সিনিয়র নেতা ৪',
      small1: 'ছোট নেতা ১', small2: 'ছোট নেতা ২', small3: 'ছোট নেতা ৩', small4: 'ছোট নেতা ৪',
      small5: 'ছোট নেতা ৫',
    },
    trait: {
      hasina: 'ধীর, খুব শক্ত, সাহায্যকারী ডাকে', senior1: '৩ বার মারতে হয়', senior2: 'মারলে পাশে লাফ দেয়',
      senior3: 'ছোট নেতাদের ডাকে', senior4: 'খুব শক্ত, খুব ধীর',
      small1: 'সাধারণ', small2: 'দ্রুত, এঁকেবেঁকে চলে', small3: 'দেখা যায়, আবার মিলিয়ে যায়', small4: '৩ জনের দলে আসে',
      small5: 'ধরলে দুই ভাগ হয়ে যায়',
    },
    perkTitle: 'একটি আপগ্রেড বেছে নাও',
    perkSub: 'ওয়েভ {n} শেষ। একটি বেছে নাও, পুরো খেলায় থাকবে।',
    perkName: {
      reach: 'লম্বা হাত', push: 'জোরে ধাক্কা', charge: 'দ্রুত চার্জ', luck: 'ভাগ্যবান',
      rhythm: 'ছন্দ', cold: 'হিমঘর', shield: 'বাড়তি শিল্ড',
    },
    perkDesc: {
      reach: 'ট্যাপের পরিধি +২৫%', push: 'শক্তরা দ্বিগুণ দূরে পিছিয়ে যায়',
      charge: 'সুইপ মিটার ৩০% দ্রুত ভরে', luck: 'পাওয়ার-আপ পাওয়ার সম্ভাবনা +৪%',
      rhythm: 'কম্বোর সময় +০.৫ সেকেন্ড', cold: 'বরফ +২ সেকেন্ড, দেয়াল +৩ সেকেন্ড',
      shield: 'এখনই +১ শিল্ড',
    },
    map: { india: 'ভারত', myanmar: 'মিয়ানমার', bay: 'বঙ্গোপসাগর', dhaka: 'ঢাকা' },
    pu: { freeze: 'জমে যাও!', wall: 'সীমান্ত দেয়াল!', shield: '+১ শিল্ড', charge: 'সুইপ +৪০' },
    puName: { freeze: 'বরফ', wall: 'সীমান্ত দেয়াল', shield: 'শিল্ড', charge: 'চার্জ' },
    puDesc: {
      freeze: '৪ সেকেন্ড সবাই থেমে থাকবে', wall: '৭ সেকেন্ড সবাই ধীরে চলবে',
      shield: 'একবার হাসিনাকে পেছনে ছুড়ে দেয় (সর্বোচ্চ ৩)', charge: 'সুইপ মিটার ভরে দেয়',
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
