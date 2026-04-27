---
layout: post
title: "Shtukas: Part I"
date: 2026-04-24
description: What is a shtuka?
---

For my first post, I want to explain the mathematical object that inspired the naming of this website: shtukas. 

Shtukas are an object in modern number theory that play the role of Shimura varieties in the function field setting. In fact, using (moduli spaces of) shtukas, we can often say more about arithmetic phenomenon in the function field setting. In this post, I want to describe one such instance of this phenomenon, which is probably the most interesting one: the global Langlands correspondence.

## The Langlands correspondence

Let $F$ be a global field (so either a finite Galois extension of $\mathbf{Q}$ or the function field of a curve over $\mathbf{F}_q$), and $G/F$ a reductive group. The Langlands correspondence is a conjectural non-abelian generalization 
of the reciprocity laws of class field theory, in the sense that when $G = \GL_1$, it recovers these laws. It predicts a correspondence between the following two sets:

\begin{itemize}
    \item Algebraic automorphic representations of $G(\BA_f)$ with complex coefficients (the automorphic side). 
    \item $L$-parameters, which are conjugacy classes of continous homomorphisms $\varphi \colon G_F \to {}^L G(\overline{\BQ}_\ell). Here $\ell$ is a prime different than the characteristic of $F$, and we fix an isomorphism between $\BC$ and $\overline{\BQ}_\ell$.
\end{itemize}

The Langlands correspondence then says that there should be a finite-to-one map $\pi \mapsto \varphi_\pi$. In the number field case, the global Langlands correspondence remains wide open, even for the next simplest possible group $\GL_2$. But for function fields (i.e global fields of characteristic $p > 0$), the state of the conjecture looks much better. In this setting, Drinfeld and L. Lafforgue established the correspondence for $\GL_2$ and $\GL_n$ respectively. Why is this possible? The answer is that essentially all known instances of the Langlands correspondence are realized via the cohomology of some geometric object, and function fields are more intrisically geometric than number fields. 

How does such a geometric construction work? Very roughly, oen starts with some geometric object $X$ that is defined over $F$, and also has some level structure according to compact open subgroups of $G(\BA_F)$. Then the cohomology $R \Gamma(X)$ carries both an action of the Galois group $G_F$ and also $G(\BA_F)$, and these actions will commute with each other. The Langlands correspondence is then read off of this decomposition. The following example of modular curves illustrates this process.

## Modular Curves

The most transparent situation in which the Langlands correspondence is realized in the cohomology of some geometric object is the case of modular curves. This corresponds to taking $F = \BQ$ and $G = \GL_2$. Then there is a bijection between cuspidal newforms of weight $k \geq 2$ and cuspidal automorphic representations $\pi = \pi_f \otimes \pi_\infty$ of $G(\BA_\BQ) = G(\BA_f) \times G(\BR)$ whose archimedean component $\pi_\infty$ is the discrete series of weight $k$. In this situation, the relevant geometric objects are certain Shimura varieties, namely the modular curves $Y_K$ as $K$ ranges through the compact open subgroups of $\GL_2(\BA_\BQ)$. These Shimura varieties are defined over $\BQ$. Let $X_K$ be the compactification of $Y_K$, and $X_{K, \bar{\BQ}}$ denote its base change to $\bar{\BQ}$.

Deligne constructs a $\overline{\BQ}_\ell$-adic local system $\xi_k$ on $X_K$ for each $k \geq 2$. Define 
\[ H^1(\xi_k) := \varprojlim_K H^1(X_{K, \bar{Q}}, \xi_k) \] This is a representation of $\GL_2(\BA_f) \times G_\BQ$.


<div class="thm thm-theorem" markdown="1">
As a representation of $\GL_2(\BA_f) \times G_\BQ$, the cuspidal part of the cohomology $H^1(\xi_k)$ is isomorphic to (up to some twists) \[ \bigoplus_{\pi} \pi_f \otimes \varphi_\pi \] where $\pi = \pi_f \otimes \pi_\infty$ runs over
cuspidal automorphic representations for which $\pi_\infty$ is discrete series of weight $k$, and $\varphi_\pi$ is irreducible and $2$-dimensional.

</div>









<div class="dinkus"></div>

## Further reading

- P. Deligne, *Formes modulaires et représentations $\ell$-adiques*.
- H. Carayol, *Sur les représentations $\ell$-adiques associées aux formes modulaires de Hilbert*.
- V. Drinfeld, *Langlands' conjecture for $GL_2$ over function fields*.
- L. Lafforgue, *Chtoucas de Drinfeld et correspondance de Langlands*.
- V. Lafforgue, *Shtukas for reductive groups and Langlands correspondence for function fields*.