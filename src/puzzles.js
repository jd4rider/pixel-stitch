// Starter puzzles, written as pixel art. '.' is empty, every other character
// maps to a colour in the puzzle's `colors` table. Clues are derived from the
// art at runtime, so the numbers can never disagree with the picture.

export const PACKS = [
  {
    id: 'sprouts',
    name: 'Sprouts',
    blurb: 'Five-by-five warm-ups',
    bg: ['#2b1a3d', '#150f2b'],
    color: 0xf9a8d4,
  },
  {
    id: 'cosy',
    name: 'Cosy Corner',
    blurb: 'Seven-by-seven comforts',
    bg: ['#3b2420', '#1a100e'],
    color: 0xfbbf24,
  },
  {
    id: 'voyage',
    name: 'Voyage',
    blurb: 'Eight-by-eight adventures',
    bg: ['#0f2b3a', '#08161f'],
    color: 0x38bdf8,
  },
  {
    id: 'wilds',
    name: 'Wilds',
    blurb: 'Ten-by-ten creatures',
    bg: ['#12291f', '#08150f'],
    color: 0x4ade80,
  },
]

const ROSE = '#fb7185'
const GOLD = '#fbbf24'
const AMBER = '#f59e0b'
const GRASS = '#4ade80'
const LEAF = '#22c55e'
const BARK = '#92400e'
const SKY = '#38bdf8'
const CREAM = '#fef3c7'
const CLAY = '#fb923c'
const COCOA = '#7c2d12'
const VIOLET = '#818cf8'
const MINT = '#34d399'
const SNOW = '#e2e8f0'
const SLATE = '#64748b'
const PLUM = '#c084fc'
const BERRY = '#e879f9'

export const PUZZLES = [
  // ---------- Sprouts (5 x 5) ----------
  {
    id: 'heart',
    pack: 'sprouts',
    name: 'Tiny Heart',
    colors: { r: ROSE },
    art: ['.r.r.', 'rrrrr', 'rrrrr', '.rrr.', '..r..'],
  },
  {
    id: 'star',
    pack: 'sprouts',
    name: 'Gold Star',
    colors: { y: GOLD },
    art: ['..y..', '.yyy.', 'yyyyy', '.yyy.', '.y.y.'],
  },
  {
    id: 'cat',
    pack: 'sprouts',
    name: 'Cat Face',
    colors: { o: AMBER },
    art: ['o...o', 'ooooo', 'o.o.o', 'ooooo', '.o.o.'],
  },
  {
    id: 'leaf',
    pack: 'sprouts',
    name: 'Little Leaf',
    colors: { g: LEAF },
    art: ['..gg.', '.gggg', 'ggggg', '.ggg.', '..g..'],
  },
  {
    id: 'drop',
    pack: 'sprouts',
    name: 'Water Drop',
    colors: { b: SKY },
    art: ['..b..', '.bbb.', 'bbbbb', '.bbb.', '..b..'],
  },
  {
    id: 'tree',
    pack: 'sprouts',
    name: 'Pine Tree',
    colors: { g: LEAF, n: BARK },
    art: ['..g..', '.ggg.', 'ggggg', '.ggg.', '..n..'],
  },

  // ---------- Cosy Corner (7 x 7) ----------
  {
    id: 'mug',
    pack: 'cosy',
    name: 'Hot Mug',
    colors: { c: CLAY, w: CREAM },
    art: ['..ccc..', 'ccccccc', 'c.....c', 'c.www.c', 'c.....c', '.ccccc.', '.cccc..'],
  },
  {
    id: 'candle',
    pack: 'cosy',
    name: 'Candle',
    colors: { y: GOLD, p: CREAM },
    art: ['...y...', '..yyy..', '...y...', '..ppp..', '..ppp..', '..ppp..', '.ppppp.'],
  },
  {
    id: 'book',
    pack: 'cosy',
    name: 'Open Book',
    colors: { u: VIOLET },
    art: ['.uuuuu.', 'uu...uu', '.uuuuu.', 'uu...uu', '.uuuuu.', 'uu...uu', '.uuuuu.'],
  },
  {
    id: 'moon',
    pack: 'cosy',
    name: 'Crescent Moon',
    colors: { m: GOLD },
    art: ['.mmmm..', '.mmm...', 'mmm....', 'mmm....', 'mmm....', '.mmm...', '..mmm..'],
  },
  {
    id: 'flower',
    pack: 'cosy',
    name: 'Flower',
    colors: { p: BERRY, y: GOLD },
    art: ['..p.p..', '.ppppp.', 'pp.y.pp', 'pp.y.pp', 'pp.y.pp', '.ppppp.', '..p.p..'],
  },
  {
    id: 'plant',
    pack: 'cosy',
    name: 'Potted Plant',
    colors: { p: LEAF, o: CLAY },
    art: ['.p.p.p.', '.ppppp.', '..ppp..', '.ppppp.', '.ooooo.', '.ooooo.', '..ooo..'],
  },

  // ---------- Voyage (8 x 8) ----------
  {
    id: 'rocket',
    pack: 'voyage',
    name: 'Rocket',
    colors: { r: SNOW, b: VIOLET, y: GOLD },
    art: [
      '...rr...',
      '..rrrr..',
      '..rbbr..',
      '..rbbr..',
      '..rrrr..',
      '.rrrrrr.',
      '..y..y..',
      '..y..y..',
    ],
  },
  {
    id: 'planet',
    pack: 'voyage',
    name: 'Ringed Planet',
    colors: { p: PLUM, y: GOLD },
    art: [
      '..pppp..',
      '.pppppp.',
      'pppppppp',
      'yyyyyyyy',
      'pppppppp',
      '.pppppp.',
      '..pppp..',
      '........',
    ],
  },
  {
    id: 'ufo',
    pack: 'voyage',
    name: 'Flying Saucer',
    colors: { b: MINT, g: SLATE, w: GOLD },
    art: [
      '...bb...',
      '..bbbb..',
      '.gggggg.',
      'gggggggg',
      'g.gggg.g',
      '.w....w.',
      '........',
      '........',
    ],
  },
  {
    id: 'robot',
    pack: 'voyage',
    name: 'Little Robot',
    colors: { g: SLATE, r: ROSE },
    art: [
      '.gggggg.',
      '.g.gg.g.',
      '.gggggg.',
      '.gg..gg.',
      '.grrrrg.',
      '..g..g..',
      '..g..g..',
      '.gg..gg.',
    ],
  },
  {
    id: 'flag',
    pack: 'voyage',
    name: 'Summit Flag',
    colors: { f: ROSE, p: SLATE },
    art: [
      '.ff.....',
      '.fffffff',
      '.fffffff',
      '.ff.....',
      '.ff.....',
      '.ff.....',
      '.pppppp.',
      '.pppppp.',
    ],
  },
  {
    id: 'beacon',
    pack: 'voyage',
    name: 'Beacon',
    colors: { r: ROSE, p: SLATE, y: GOLD },
    art: [
      '...r....',
      '..rrr...',
      '...r....',
      '..rrr...',
      '.rrrrr..',
      '...r....',
      '...r....',
      '..ppp...',
    ],
  },

  // ---------- Wilds (10 x 10) ----------
  {
    id: 'fox',
    pack: 'wilds',
    name: 'Fox',
    colors: { o: CLAY, w: CREAM },
    art: [
      '..o....o..',
      '..oo..oo..',
      '.oooooooo.',
      '.oo.ww.oo.',
      '.oooooooo.',
      '..oooooo..',
      '...oooo...',
      '...o..o...',
      '..........',
      '..........',
    ],
  },
  {
    id: 'cactus',
    pack: 'wilds',
    name: 'Cactus',
    colors: { g: LEAF, p: COCOA },
    art: [
      '....gg....',
      '....gg....',
      '.g..gg..g.',
      '.gg.gg.gg.',
      '.g..gg..g.',
      '.gggggggg.',
      '....gg....',
      '....gg....',
      '..pppppp..',
      '..pppppp..',
    ],
  },
  {
    id: 'whale',
    pack: 'wilds',
    name: 'Whale',
    colors: { b: SKY, w: SNOW },
    art: [
      '..........',
      '....bbbb..',
      '..bbbbbbb.',
      '.bbbb.bbbb',
      'bbbbbbbbbb',
      '.bbbbbbbb.',
      '..bbbbbb..',
      '.......b..',
      '.....ww...',
      '..........',
    ],
  },
  {
    id: 'owl',
    pack: 'wilds',
    name: 'Owl',
    colors: { o: COCOA, w: CREAM, y: GOLD },
    art: [
      '..oooooo..',
      '.oooooooo.',
      '.owwoowwo.',
      '.oywoowyo.',
      '.oooooooo.',
      '..oooooo..',
      '...oooo...',
      '..oo..oo..',
      '..........',
      '..........',
    ],
  },
  {
    id: 'mushroom',
    pack: 'wilds',
    name: 'Mushroom',
    colors: { r: ROSE, w: CREAM, p: CLAY },
    art: [
      '...rrrr...',
      '..rrwwrr..',
      '.rrrwwrrr.',
      'rrrrrrrrrr',
      '.rrrrrrrr.',
      '...pppp...',
      '...pppp...',
      '...pppp...',
      '..pppppp..',
      '..........',
    ],
  },
  {
    id: 'mountains',
    pack: 'wilds',
    name: 'Mountains',
    colors: { w: SNOW, s: SLATE, g: GRASS },
    art: [
      '..........',
      '.....w....',
      '....www...',
      '...wwwww..',
      '..wwwwwww.',
      '.sssssssss',
      'ssssssssss',
      '..gggggg..',
      '.gggggggg.',
      '..........',
    ],
  },
]

export const PACK_OF = (packId) => PACKS.find((pack) => pack.id === packId) || PACKS[0]
