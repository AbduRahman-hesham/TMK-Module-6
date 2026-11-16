/**
 * Character portraits using the uploaded character images.
 * If image loading fails, the UI gracefully falls back to 👦 / 👧 emojis.
 */

export const BOY_IMAGE_PATH = '/assets/aistudio/Boy_c0582b26.jpg';
export const GIRL_IMAGE_PATH = '/assets/aistudio/Girl_1936987a.jpg';

export interface CharacterOption {
  id: 'boy' | 'girl';
  name: string;
  emoji: string;
  image: string;
  badge: string;
  tagline: string;
}

export const CHARACTERS: CharacterOption[] = [
  {
    id: 'boy',
    name: 'Leo',
    emoji: '👦',
    image: BOY_IMAGE_PATH,
    badge: 'Curious Builder 🛠️',
    tagline: 'Loves building gadgets & math puzzles!',
  },
  {
    id: 'girl',
    name: 'Maya',
    emoji: '👧',
    image: GIRL_IMAGE_PATH,
    badge: 'Creative Leader ✨',
    tagline: 'Loves smart ideas & team projects!',
  },
];
