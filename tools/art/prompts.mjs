// Prompt data for the automated character-art pipeline (tools/gen-art.mjs).
//
// Descriptions are distilled from the character prompt docs in docs/prompts/:
// outfit, props, pose mood and accent colour only. Real names and reference /
// likeness wording are deliberately left out — image models refuse prompts that
// name real people, and this repo keeps the pipeline anonymous by design.

// Shared tail: pose/framing plus the chroma-green backdrop that
// tools/chroma-key.mjs keys out later. Do not change the green.
const CHROMA_TAIL =
  'full body, standing, facing right in three-quarter side view, ' +
  'plain flat solid chroma-green (#00B140) background with no shadow and no floor, ' +
  'no text, no logos, no frame, square 1:1';

export const STYLES = {
  '2d':
    'cute cartoon sticker style, chibi proportions (very big head ~45% of height, ' +
    'small body, short legs), thick clean dark outlines, flat cel shading, ' +
    'bright saturated colours, funny friendly expression, suitable for all ages, ' +
    CHROMA_TAIL,
  '3d':
    '3D rendered cute toy figure, Pixar-like soft clay look, the same chibi ' +
    'proportions (very big head ~45% of height, small body, short legs), ' +
    'soft studio lighting, bright friendly colours, suitable for all ages, ' +
    CHROMA_TAIL,
};

// kind/id match assets/ folder names (see assets/README.md). Enemies are comic
// villains: cheeky, sneaky or sulky, harmless, no weapons, nothing scary.
export const CHARACTERS = [
  // ---- enemies, tier 1–2 ----
  {
    kind: 'enemies',
    id: 'hasina',
    look:
      'Elderly woman in an elegant pastel sari with a wide deep-red border, the end ' +
      'of the sari draped over her head, large round glasses and a stern bossy pout. ' +
      'She pulls a small rolling suitcase behind her like someone sneaking home from ' +
      'abroad, important and a little dramatic, a funny final-boss air. ' +
      'Accent colour deep red.',
  },
  {
    kind: 'enemies',
    id: 'quader',
    look:
      'Senior politician in a white panjabi and a black sleeveless Mujib coat, ' +
      'mid-speech with one finger raised and a toy microphone in the other hand, ' +
      'theatrical fiery slogan-shouting face as if at a rally. Accent colour orange.',
  },
  {
    kind: 'enemies',
    id: 'nanok',
    look:
      'Sturdy, broad-shouldered senior politician in a cream panjabi and dark Mujib ' +
      'coat, determined sulky frown and a heavy stomping stride. Accent colour purple.',
  },
  {
    kind: 'enemies',
    id: 'taposh',
    look:
      'Former city mayor in a neat suit with a ceremonial mayor chain, holding a ' +
      'small mosquito-fogging machine puffing a harmless little cloud, quick nervous ' +
      'darting eyes, light on his feet as if about to dodge sideways. ' +
      'Accent colour blue.',
  },
  {
    kind: 'enemies',
    id: 'shamim',
    look:
      'Very broad-chested regional politician (still chibi), dark sunglasses, thick ' +
      'gold wristwatch, white panjabi with black Mujib coat, confident unbothered ' +
      'smirk and a heavy slow stride. Accent colour dark brown.',
  },
  {
    kind: 'enemies',
    id: 'arafat',
    look:
      'TV-debate politician in a sharp suit and tie, holding a studio microphone and ' +
      'a stack of talking-point cards, know-it-all smirk, a few static sparkles ' +
      'around him as if he keeps flickering in and out of the broadcast. ' +
      'Accent colour teal.',
  },
  // ---- enemies, tier 3 ----
  {
    kind: 'enemies',
    id: 'nazmul',
    look:
      'Young political activist in a light panjabi with a shoulder bag, sheepish ' +
      'guilty grin, sneaky tiptoe mood. Accent colour crimson.',
  },
  {
    kind: 'enemies',
    id: 'zakir',
    look:
      'Young political activist in a checked shirt and trousers, nervous fake smile, ' +
      'hands in his pockets. Accent colour rust.',
  },
  {
    kind: 'enemies',
    id: 'momotaz',
    look:
      'Folk singer turned politician in a bright sari, eyes closed, singing her ' +
      'heart out into a stage microphone with little music notes floating around ' +
      'her, friendly and funny. Accent colour magenta.',
  },
  {
    kind: 'enemies',
    id: 'inan',
    look:
      'Young student-politics leader wearing a panjabi with sneakers, sprinting at ' +
      'full tilt, sweaty and panicked, glancing back over his shoulder. ' +
      'Accent colour amber.',
  },
  {
    kind: 'enemies',
    id: 'shohag',
    look:
      'Young politician in a panjabi with rolled-up sleeves, caught mid-run with ' +
      'scared wide eyes and hair flying. Accent colour gold.',
  },
  {
    kind: 'enemies',
    id: 'saddam',
    look:
      'Young student-politics leader in a white panjabi, fist raised mid-slogan, ' +
      'intense cheeky energy, slightly messy hair. Accent colour red.',
  },
  {
    kind: 'enemies',
    id: 'murad',
    look:
      'Politician in an ill-fitting suit with the tie askew, fast nervous walk and ' +
      'an embarrassed caught-out face. Accent colour slate blue.',
  },
  {
    kind: 'enemies',
    id: 'ferdous',
    look:
      'Film-hero actor turned politician with stylish movie-star hair and an ' +
      'open-collar shirt, striking a dramatic hero pose while holding a film ' +
      'clapperboard, a soft spotlight glow behind him. Accent colour indigo.',
  },
  {
    kind: 'enemies',
    id: 'mahi',
    look:
      'Film actress turned politician in a modest glamorous salwar kameez with a ' +
      'dupatta and oversized sunglasses, holding her phone up for a selfie with ' +
      'little camera-flash sparkles, funny rather than glamourised. ' +
      'Accent colour pink.',
  },
  {
    kind: 'enemies',
    id: 'somrat',
    look:
      'Flashy man with a thick gold chain, shiny printed shirt and dark sunglasses ' +
      'pushed up on his forehead, cocky grin. Accent colour emerald.',
  },
  {
    kind: 'enemies',
    id: 'riyaz',
    look:
      'Politician in a formal panjabi and waistcoat, smug grin, waving to an ' +
      'imaginary crowd. Accent colour olive.',
  },
  // ---- heroes (cheerful, brave, likeable) ----
  {
    kind: 'heroes',
    id: 'farmer',
    look:
      'Sturdy cheerful middle-aged farmer, sun-tanned with a thick moustache, ' +
      'checked lungi folded up to the knees, white vest, bare feet with a little mud ' +
      'on his legs. He carries a straw hat and a small sickle, with a red-and-white ' +
      'checked gamchha tied around his head — calm, strong, a quiet village hero. ' +
      'Accent colour green.',
  },
  {
    kind: 'heroes',
    id: 'studentM',
    look:
      'Brave fiery young male university student, messy hair, a red-and-green ' +
      'Bangladesh flag tied on as a headband, T-shirt, jeans, sneakers and a ' +
      'backpack, cheeky bring-it-on grin. Accent colour red.',
  },
  {
    kind: 'heroes',
    id: 'studentF',
    look:
      'Fearless quick young female university student with a long braid, a ' +
      'red-and-green Bangladesh flag headband over her hair, modest kurta with ' +
      'jeans and sneakers, a book bag across her shoulder, sharp confident smile. ' +
      'Accent colour crimson.',
  },
  {
    kind: 'heroes',
    id: 'common',
    look:
      'Everyday city working man in his thirties, short-sleeved shirt, lungi and ' +
      'plastic sandals, a small cap and a gamchha over one shoulder, sleeves rolled ' +
      'up — tired but unstoppable, big warm grin. Accent colour yellow.',
  },
];

// Exact prefix the agent brief hands to agy: one image, then stop.
export function buildPrompt(style, ch) {
  return (
    'Use your image generator to create exactly one image, then stop. ' +
    'Do NOT run any commands or write any files yourself. Image: ' +
    STYLES[style] +
    ' Character: ' +
    ch.look
  );
}
