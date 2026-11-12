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
    date: 'Nov. 2026',
    title: 'Bootstrapping GAGA Theorems',
    description: 'A GAGA comparison on a noetherian base with affine diagonal extends to every proper scheme over it, with an application to the Fargues–Fontaine curve.',
    abstract: 'Let $X$ be a noetherian scheme with affine diagonal, and let $\\lambda : \\mathcal{X} \\to X$ be a morphism of locally ringed spaces from a qcqs locally strongly noetherian analytic adic space. We prove that an equivalence on coherent sheaves, together with comparison of their cohomology, extends to every proper $X$-scheme. As an application, we obtain GAGA for proper schemes over the Fargues–Fontaine curve in equal and mixed characteristic.',
    tags: ['math.AG'],
    venue: 'Preprint',
    links: [
      { name: '[pdf]', url: '/papers/gaga.pdf' },
      { name: '[hexagon]', url: 'https://hexagonmath.org/2611.00363v1' }
    ]
  }
];
