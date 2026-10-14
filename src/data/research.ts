type Link = {
  name: string;
  url: string;
};

export type ResearchItem = {
  year: string;
  date?: string;
  title: string;
  description: string;
  abstract: string;
  tags: string[];
  venue?: string;
  links: Link[];
};

export const research: ResearchItem[] = [
  {
    year: '2026',
    date: 'Oct. 2026',
    title: 'GAGA for Proper Schemes over the Fargues–Fontaine Curve',
    description: 'We prove GAGA for proper schemes over the Fargues–Fontaine curve',
    abstract: 'We prove GAGA for proper schemes over the Fargues–Fontaine curve. Analytification gives an equivalence on pseudocoherent complexes and commutes with proper direct images. This yields the coherent, bounded-derived, perfect, and vector-bundle comparisons for Huber analytification.',
    tags: ['math.AG'],
    venue: 'Preprint',
    links: [{ name: 'PDF', url: '/papers/gaga.pdf' }]
  }
];
