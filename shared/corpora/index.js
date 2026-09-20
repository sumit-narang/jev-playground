import emoji from './emoji.js';
import artworksData from './artworks.js';
import restaurants from './restaurants.js';
import counties from './counties.js';
import flags from './flags.js';
import typefaces from './typefaces.js';

// Every corpus exposes the same item shape. How an item renders depends on
// which optional field it carries:
//   glyph  -> drawn as text (emoji)
//   thumb  -> drawn as an <img>, routed via /api/img
//   font   -> drawn as its own name set in its own typeface
//   none   -> drawn as a plain text chip
// Instruments never branch on this; makePile does it once.
const artworks = {
  id: 'artworks',
  name: 'artworks',
  desc: '96 public-domain works from the Art Institute of Chicago.',
  credit: artworksData.source,
  examples: [
    'the subject looks unhappy', 'this was made before 1800',
    'this is a portrait of a specific person', 'this would have been expensive to make',
    'I would hang this in a bedroom', 'this depicts the outdoors',
  ],
  pairWith: 'this was made before 1800',
  items: artworksData.items,
};

// Archived corpora live in shared/corpora/_archive — unregistered, not deleted.
export const CORPORA = [
  restaurants, counties, flags, typefaces, artworks, emoji,
];
export const DEFAULT_CORPUS = 'restaurants';
export const getCorpus = (id) => CORPORA.find((c) => c.id === id) ?? CORPORA[0];

// The stub resolves item names without knowing which corpus is active, so it
// needs one lookup across all of them. Later corpora win on a name collision.
export const ALL_BY_NAME = Object.fromEntries(
  CORPORA.flatMap((c) => c.items.map((i) => [i.name, i])),
);
