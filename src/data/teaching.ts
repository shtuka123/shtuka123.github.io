type Link = {
  name: string;
  url: string;
};

type TeachingItem = {
  semester: string;
  course: string;
  title: string;
  role: string;
  description: string;
  links: Link[];
};

export const teaching: TeachingItem[] = [
  {
    semester: 'Fall 2026', course: 'Math 174', title: 'Introduction to Category Theory', role: 'Instructor',
    description: 'Student-led course. Covers categories, functors, natural transformations, universal properties, (co)limits, and adjunctions.', links: [],
  },
  // Short topic summaries from the Berkeley course catalog:
  // https://undergraduate.catalog.berkeley.edu/courses/1145291
  // https://berkeleyguidearchive.github.io/2024-25/courses/math/#math121a
  { semester: 'Fall 2026', course: 'Math 126', title: 'Introduction to PDEs', role: 'Reader', description: 'An introduction to equations describing waves and diffusion, with initial and boundary conditions. Topics include Fourier methods, Green’s functions, maximum principles, and estimates for solutions.', links: [] },
  { semester: 'Fall 2026', course: 'Math 121A', title: 'Math Methods for Physical Sciences', role: 'Reader', description: 'Mathematical methods for students in the physical sciences, covering series, partial derivatives, complex analysis, integral transforms, and variational calculus.', links: [] },
  {
    semester: 'Spring 2026',
    course: 'Math 254b',
    title: 'Algebraic Number Theory II',
    role: 'T.A',
    description:
      'Graduate course. Statements and proofs of (local and global) class field theory, complex multiplication of elliptic curves',
    links: [{ name: 'syllabus', url: '#' }]
  },
  {
    semester: 'Spring 2026',
    course: 'Math 256b',
    title: 'Algebraic Geometry II',
    role: 'T.A',
    description: 'Graduate course. Sheaf cohomology, divisors, intersection theory, curves and surfaces.',
    links: [{ name: 'syllabus', url: '#' }]
  },
  {
    semester: 'Fall 2025',
    course: 'Math 256a',
    title: 'Algebraic Geometry I',
    role: 'T.A',
    description: 'Graduate course. Sheaves, schemes, morphisms of schemes, sheaf cohomology.',
    links: [{ name: 'syllabus', url: '#' }]
  },
  {
    semester: 'Fall 2025, Spring 2025, Fall 2024',
    course: 'Math 174',
    title: 'Introduction to Category Theory',
    role: 'Lead Instructor',
    description:
      'Student-led course. Covers categories, functors, natural transformations, universal properties, (co)limits, and adjunctions.',
    links: [{ name: 'syllabus', url: '#' }]
  }
];
