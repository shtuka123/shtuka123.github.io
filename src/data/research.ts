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
    description: 'We prove a GAGA theorem for proper schemes over the Fargues–Fontaine curve.',
    abstract: 'We prove a GAGA theorem for proper schemes over the Fargues–Fontaine curve. Our methods closely follow the work of Clausen–Scholze.',
    tags: ['math.AG'],
    venue: 'Draft',
    links: [{ name: 'PDF', url: '/papers/gaga.pdf' }]
  }
];
