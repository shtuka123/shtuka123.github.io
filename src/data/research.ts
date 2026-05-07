type Link = {
  name: string;
  url: string;
};

type ResearchItem = {
  year: string;
  title: string;
  description: string;
  venue: string;
  links: Link[];
};

export const research: ResearchItem[] = [
  {
    year: '2026',
    title: 'GAGA For Varieties Over the Fargues-Fontaine Cuvve',
    description: 'We prove a GAGA theorem for proper varieties over Fargues-Fontaine curves',
    venue: 'preprint',
    links: [{ name: 'pdf', url: '#' }]
  }
];
