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
      'If <b>anyone crosses the border</b> into Bangladesh, it\'s <b>game over</b> (unless you have a 🛡️ shield).',
      'Catch quickly in a row for a <b>combo</b>: every 5 catches raises the multiplier (up to <b>x5</b>). Missed taps break the combo.',
      'Catch someone right at the border: <b>Close call +25</b>.',
      'Clear a wave: <b>+50 × wave</b>. 90%+ accuracy in a wave: <b>+25 × wave</b>.',
      'Catches fill the <b>⚡ Sweep</b> meter. When it\'s full, press it (or <kbd>Space</kbd>) to catch everyone on screen (half points, bosses take 4 damage).',
      'A <b>Boss</b> arrives every 5th wave and keeps calling in cadres. Bosses always drop a power-up.',
    ],
    intruders: 'Intruders',
    powerups: 'Power-ups',
    tapCollect: '(tap to collect)',
    keys: 'Desktop: <kbd>Space</kbd> sweep · <kbd>P</kbd>/<kbd>Esc</kbd> pause · <kbd>Enter</kbd> play',
    gotIt: 'Got it',
    taps: '{n} taps', tap1: '1 tap', fromWave: 'from wave {n}', pts: 'pts',
    paused: 'Paused', resume: '▶ Resume', quit: 'Quit to menu',
    breached: 'BORDER BREACHED!',
    breachReason: 'A {who} slipped across the border on wave {wave}.',
    record: '🏆 NEW RECORD!',
    again: '↻ Play again', share: 'Share score', menu: 'Menu',
    sWave: 'Wave reached', sCaught: 'Intruders caught', sCombo: 'Best combo', sAcc: 'Accuracy',
    sClose: 'Close calls', sBoss: 'Bosses stopped', sBest: 'Best score',
    hudScore: 'SCORE', hudWave: 'WAVE', sweep: '⚡ SWEEP',
    comboHud: '{n} combo · x{m}',
    wave: 'Wave {n}', bossIncoming: '⚠️ Boss incoming!', nIntruders: '{n} intruders',
    cleared: 'Wave {n} cleared!', clearBonus: 'Clear bonus +{n}', sharp: 'Sharpshooter +{n}',
    comboLost: 'combo lost', closeCall: 'CLOSE CALL!', shieldBroken: 'SHIELD BROKEN!',
    tapHint: '👆 TAP!',
    copied: 'Copied!', copiedSub: 'Share text copied to clipboard',
    shareText: 'I kept them out of Bangladesh until wave {wave} and scored {score} points in Keep Them Out! Can you beat me?',
    char: { cadre: 'Cadre', runner: 'Runner', leader: 'Leader', sneaky: 'Sneaky', boss: 'Boss' },
    pu: { freeze: 'FREEZE!', wall: 'BORDER WALL!', shield: '+1 SHIELD', charge: 'SWEEP +40' },
    puName: { freeze: 'Freeze', wall: 'Border Wall', shield: 'Shield', charge: 'Charge' },
    puDesc: {
      freeze: 'Freezes everyone for 4s', wall: 'Slows intruders for 7s',
      shield: 'Absorbs one breach (max 3)', charge: 'Fills the Sweep meter',
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
      '<b>কেউ সীমান্ত পেরিয়ে</b> বাংলাদেশে ঢুকলেই <b>খেলা শেষ</b> (যদি না তোমার 🛡️ শিল্ড থাকে)।',
      'দ্রুত পরপর ধরলে <b>কম্বো</b> হয়: প্রতি ৫টি ধরায় গুণক বাড়ে (সর্বোচ্চ <b>x৫</b>)। ভুল ট্যাপে কম্বো ভেঙে যায়।',
      'একদম সীমান্তে ধরলে: <b>অল্পের জন্য +২৫</b>।',
      'ওয়েভ শেষ করলে: <b>+৫০ × ওয়েভ</b>। ৯০%+ নির্ভুলতায়: <b>+২৫ × ওয়েভ</b>।',
      'ধরলে <b>⚡ সুইপ</b> মিটার ভরে। পূর্ণ হলে চাপো (বা <kbd>Space</kbd>), পর্দার সবাই ধরা পড়বে (অর্ধেক পয়েন্ট, বস ৪ ক্ষতি পায়)।',
      'প্রতি ৫ম ওয়েভে একজন <b>বস</b> আসে এবং ক্যাডার ডাকতে থাকে। বস সবসময় পাওয়ার-আপ ফেলে।',
    ],
    intruders: 'অনুপ্রবেশকারী',
    powerups: 'পাওয়ার-আপ',
    tapCollect: '(ট্যাপ করে নাও)',
    keys: 'কম্পিউটারে: <kbd>Space</kbd> সুইপ · <kbd>P</kbd>/<kbd>Esc</kbd> বিরতি · <kbd>Enter</kbd> খেলো',
    gotIt: 'বুঝেছি',
    taps: '{n} ট্যাপ', tap1: '১ ট্যাপ', fromWave: 'ওয়েভ {n} থেকে', pts: 'পয়েন্ট',
    paused: 'বিরতি', resume: '▶ চালিয়ে যাও', quit: 'মেনুতে ফেরো',
    breached: 'সীমান্ত ভেদ হয়েছে!',
    breachReason: 'ওয়েভ {wave}-এ একজন {who} সীমান্ত পেরিয়ে ঢুকে পড়েছে।',
    record: '🏆 নতুন রেকর্ড!',
    again: '↻ আবার খেলো', share: 'স্কোর শেয়ার করো', menu: 'মেনু',
    sWave: 'ওয়েভ', sCaught: 'ধরা পড়েছে', sCombo: 'সেরা কম্বো', sAcc: 'নির্ভুলতা',
    sClose: 'অল্পের জন্য', sBoss: 'বস থামানো', sBest: 'সেরা স্কোর',
    hudScore: 'স্কোর', hudWave: 'ওয়েভ', sweep: '⚡ সুইপ',
    comboHud: '{n} কম্বো · x{m}',
    wave: 'ওয়েভ {n}', bossIncoming: '⚠️ বস আসছে!', nIntruders: '{n} জন অনুপ্রবেশকারী',
    cleared: 'ওয়েভ {n} শেষ!', clearBonus: 'বোনাস +{n}', sharp: 'নিখুঁত নিশানা +{n}',
    comboLost: 'কম্বো শেষ', closeCall: 'অল্পের জন্য!', shieldBroken: 'শিল্ড ভেঙেছে!',
    tapHint: '👆 ধরো!',
    copied: 'কপি হয়েছে!', copiedSub: 'শেয়ারের লেখা কপি হয়েছে',
    shareText: '"ঢুকতে দেবো না!" খেলায় আমি ওয়েভ {wave} পর্যন্ত সীমান্ত পাহারা দিয়ে {score} পয়েন্ট পেয়েছি! তুমি পারবে?',
    char: { cadre: 'ক্যাডার', runner: 'দৌড়বাজ', leader: 'নেতা', sneaky: 'চোরাগোপ্তা', boss: 'বস' },
    pu: { freeze: 'জমে যাও!', wall: 'সীমান্ত দেয়াল!', shield: '+১ শিল্ড', charge: 'সুইপ +৪০' },
    puName: { freeze: 'বরফ', wall: 'সীমান্ত দেয়াল', shield: 'শিল্ড', charge: 'চার্জ' },
    puDesc: {
      freeze: '৪ সেকেন্ড সবাই থেমে থাকবে', wall: '৭ সেকেন্ড সবাই ধীরে চলবে',
      shield: 'একবার সীমান্ত ভেদ আটকায় (সর্বোচ্চ ৩)', charge: 'সুইপ মিটার ভরে দেয়',
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
