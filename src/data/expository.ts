import type { ResearchItem } from './research';

type ExpositoryItem = Omit<ResearchItem, 'year' | 'abstract'>;

export const expository: ExpositoryItem[] = [
  {
    title: 'p-adic Hodge Theory for Rigid Analytic Varieties (Senior Thesis)',
    description: 'This thesis is an exposition of p-adic Hodge theory, with particular emphasis on the comparison theorems for rigid analytic varieties. The subject grew out of Tate’s study of p-divisible groups [Tat67]. We will follow some of the ideas that led from his work to Scholze’s comparison theorem of 2013 [Sch13b]. A central question in p-adic Hodge theory is how to describe the étale cohomology of a variety over a p-adic field in terms of its differentials. Tate obtained such a description for abelian varieties with good reduction [Tat67], and Faltings extended it to smooth proper algebraic varieties [Fal88]. What is particularly interesting about Scholze’s proof is that it works for smooth proper rigid spaces, using the theory of perfectoid spaces. Our goal is to explain this proof. We begin with the theory of p-adic representations, where we encounter the period rings, and then develop the analytic geometry needed to use these rings on a rigid space. Along the way, we will see why the pro-étale site is so useful in making these two theories work together. We also discuss some applications of the comparison theorems, including de Rham representations, Hodge numbers, and algebraic cycle classes, and conclude with a brief discussion of torsion in integral cohomology.',
    tags: ['math.AG', 'math.NT'],
    date: 'Nov. 2026',
    links: [{ name: 'PDF', url: '/papers/p-adic-hodge-theory-thesis.pdf' }]
  },
  {
    title: 'On the Smooth Transfer of Orbital Integrals Following Waldspurger',
    description: 'A translation of Chaudouard’s “Sur le transfert lisse des intégrales orbitales d’après Waldspurger”.',
    tags: ['math.NT', 'math.RT'],
    date: 'Oct. 2026',
    links: [{ name: 'PDF', url: '/papers/chaudouard-english.pdf' }]
  }
];
