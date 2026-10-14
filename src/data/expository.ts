import type { ResearchItem } from './research';

type ExpositoryItem = Omit<ResearchItem, 'year' | 'abstract'>;

export const expository: ExpositoryItem[] = [
  {
    title: 'On the Smooth Transfer of Orbital Integrals Following Waldspurger',
    description: 'A translation of Chaudouard’s “Sur le transfert lisse des intégrales orbitales d’après Waldspurger”.',
    tags: ['math.NT', 'math.RT'],
    date: 'Oct. 2026',
    links: [{ name: 'PDF', url: '/papers/chaudouard-english.pdf' }]
  }
];
