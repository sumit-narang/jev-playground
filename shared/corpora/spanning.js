// A deliberately small corpus chosen to SPAN the space rather than enumerate
// categories. Two rules:
//
//   1. Every item must differ from every other on some axis a predicate could
//      probe. Five fruits answer almost every question identically — that is
//      five items carrying one item of information.
//   2. Prefer boundary cases over typical members. 💀 was alive and is not,
//      🤖 moves but is not alive, 🧊 will cease to exist, 🥚 might become alive,
//      🌈 has no substance at all. These split predicates; a sixth fruit does not.
//
// `tags` are only for the offline stub; the live model reads the name.
export default {
  id: 'spanning',
  name: 'spanning set',
  credit: 'chosen for coverage, not category',
  examples: ['could be eaten', 'is alive', 'a magnet would attract it',
             'would still exist in a hundred years', 'could fit in a pocket',
             'would hurt to step on', 'is worth more than €100'],
  pairWith: 'is found in nature',
  items: [
    // alive, across scale and kingdom
    { id: 'cat',     name: 'cat',        glyph: '🐈', tags: ['animal','alive','soft','natural','warm'] },
    { id: 'bee',     name: 'bee',        glyph: '🐝', tags: ['animal','alive','small','light','dangerous','natural'] },
    { id: 'tree',    name: 'tree',       glyph: '🌳', tags: ['plant','alive','heavy','natural','large'] },
    { id: 'mushroom',name: 'mushroom',   glyph: '🍄', tags: ['plant','alive','soft','natural','edible','food'] },
    { id: 'baby',    name: 'baby',       glyph: '👶', tags: ['animal','alive','soft','warm','small'] },
    // was alive / might be alive — the boundary
    { id: 'skull',   name: 'skull',      glyph: '💀', tags: ['hard','natural','small'] },
    { id: 'egg',     name: 'egg',        glyph: '🥚', tags: ['food','round','fragile','natural','edible','small'] },
    { id: 'log',     name: 'log',        glyph: '🪵', tags: ['plant','heavy','hard','natural'] },
    // food across processing, temperature and form
    { id: 'apple',   name: 'apple',      glyph: '🍎', tags: ['food','fruit','round','natural','sweet','edible','small'] },
    { id: 'broccoli',name: 'broccoli',   glyph: '🥦', tags: ['food','vegetable','natural','edible'] },
    { id: 'pizza',   name: 'pizza',      glyph: '🍕', tags: ['food','hot','edible','manmade'] },
    { id: 'chocolate',name: 'chocolate', glyph: '🍫', tags: ['food','sweet','edible','manmade','small'] },
    { id: 'coffee',  name: 'coffee',     glyph: '☕', tags: ['food','liquid','hot','edible'] },
    // metal and tools, across size, sharpness and worth
    { id: 'hammer',  name: 'hammer',     glyph: '🔨', tags: ['metal','tool','heavy','hard','manmade'] },
    { id: 'scissors',name: 'scissors',   glyph: '✂️', tags: ['metal','tool','sharp','hard','dangerous','manmade','small'] },
    { id: 'paperclip',name: 'paperclip', glyph: '📎', tags: ['metal','small','light','manmade'] },
    { id: 'key',     name: 'key',        glyph: '🔑', tags: ['metal','small','hard','manmade'] },
    // powered things, and the thing that moves but is not alive
    { id: 'phone',   name: 'phone',      glyph: '📱', tags: ['electronic','metal','hard','fragile','manmade','valuable','small'] },
    { id: 'lightbulb',name: 'lightbulb', glyph: '💡', tags: ['electronic','fragile','round','manmade','hot'] },
    { id: 'battery', name: 'battery',    glyph: '🔋', tags: ['electronic','metal','heavy','manmade','small'] },
    { id: 'robot',   name: 'robot',      glyph: '🤖', tags: ['electronic','metal','hard','manmade','heavy'] },
    // mineral, across worth and permanence
    { id: 'rock',    name: 'rock',       glyph: '🪨', tags: ['heavy','hard','natural'] },
    { id: 'diamond', name: 'diamond',    glyph: '💎', tags: ['hard','valuable','small','natural'] },
    { id: 'ice',     name: 'ice cube',   glyph: '🧊', tags: ['cold','hard','liquid','natural','small'] },
    // soft, worn, sentimental
    { id: 'gloves',  name: 'gloves',     glyph: '🧤', tags: ['clothing','soft','light','manmade'] },
    { id: 'shoe',    name: 'shoe',       glyph: '👞', tags: ['clothing','soft','manmade'] },
    { id: 'teddy',   name: 'teddy bear', glyph: '🧸', tags: ['toy','soft','light','manmade'] },
    // information and paper
    { id: 'books',   name: 'books',      glyph: '📚', tags: ['writing','heavy','manmade'] },
    { id: 'pencil',  name: 'pencil',     glyph: '✏️', tags: ['writing','small','light','sharp','manmade'] },
    // household, including things consumed by their own use
    { id: 'mirror',  name: 'mirror',     glyph: '🪞', tags: ['fragile','hard','heavy','manmade'] },
    { id: 'candle',  name: 'candle',     glyph: '🕯️', tags: ['hot','soft','manmade','small'] },
    { id: 'soap',    name: 'soap',       glyph: '🧼', tags: ['soft','small','manmade'] },
    // things far too big to hold
    { id: 'car',     name: 'car',        glyph: '🚗', tags: ['vehicle','metal','heavy','hard','manmade','large','valuable'] },
    { id: 'bicycle', name: 'bicycle',    glyph: '🚲', tags: ['vehicle','metal','hard','manmade','large'] },
    { id: 'house',   name: 'house',      glyph: '🏠', tags: ['heavy','hard','manmade','large','valuable'] },
    // culture
    { id: 'guitar',  name: 'guitar',     glyph: '🎸', tags: ['music','hard','manmade','large'] },
    // elemental — dangerous, temporary, or with no substance at all
    { id: 'fire',    name: 'fire',       glyph: '🔥', tags: ['hot','dangerous','natural'] },
    { id: 'snowflake',name: 'snowflake', glyph: '❄️', tags: ['cold','light','fragile','natural','small'] },
    { id: 'wave',    name: 'wave',       glyph: '🌊', tags: ['liquid','cold','natural','large'] },
    { id: 'lightning',name: 'lightning', glyph: '⚡', tags: ['dangerous','light','natural'] },
    { id: 'rainbow', name: 'rainbow',    glyph: '🌈', tags: ['natural','light','large'] },
    // purely abstract, drawn as objects
    { id: 'heart',   name: 'a heart symbol', glyph: '❤️', tags: ['small'] },
    { id: 'music',   name: 'a musical note', glyph: '🎵', tags: ['music','small'] },
    { id: 'clock',   name: 'a clock',    glyph: '⏰', tags: ['electronic','round','manmade','small'] },
    { id: 'money',   name: 'a bag of money', glyph: '💰', tags: ['valuable','heavy','manmade'] },
  ],
};
