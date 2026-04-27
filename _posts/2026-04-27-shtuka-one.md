---
layout: post
title: "Shtukas: Part I"
date: 2026-04-27
description: What is a shtuka?
---

For my first post, I want to explain the mathematical object that inspired the naming of this website: shtukas.

Shtukas are an object in modern number theory that play the role of Shimura varieties in the function field setting. In fact, using (moduli spaces of) shtukas, we can often say more about arithmetic phenomenon in the function field setting. In this post, I want to describe one such instance of this phenomenon, which is probably the most interesting one: the global Langlands correspondence.

## The Langlands correspondence

Let $F$ be a global field (so either a finite Galois extension of $\mathbf{Q}$ or the function field of a curve over $\mathbf{F}_q$), and $G/F$ a reductive group. The Langlands correspondence is a conjectural non-abelian generalization of the reciprocity laws of class field theory, in the sense that when $G = \GL_1$, it recovers these laws. It predicts a correspondence between the following two sets:

- Algebraic automorphic representations of $G(\BA_f)$ with complex coefficients (the automorphic side).
- $L$-parameters, which are conjugacy classes of continous homomorphisms $\varphi \colon G_F \to {}^L G(\overline{\BQ}\_\ell)$. Here $\ell$ is a prime different than the characteristic of $F$, and we fix an isomorphism between $\BC$ and $\overline{\BQ}\_\ell$.

The Langlands correspondence then says that there should be a finite-to-one map $\pi \mapsto \varphi\_\pi$. In the number field case, the global Langlands correspondence remains wide open, even for the next simplest possible group $\GL_2$. But for function fields (i.e global fields of characteristic $p > 0$), the state of the conjecture looks much better. In this setting, Drinfeld and L. Lafforgue established the correspondence for $\GL_2$ and $\GL_n$ respectively. Why is this possible? The answer is that essentially all known instances of the Langlands correspondence are realized via the cohomology of some geometric object, and function fields are more intrisically geometric than number fields.

How does such a geometric construction work? Very roughly, one starts with some geometric object $X$ that is defined over $F$, and also has some level structure according to compact open subgroups of $G(\BA_F)$. Then the cohomology $R\Gamma(X)$ carries both an action of the Galois group $G_F$ and also $G(\BA_F)$, and these actions will commute with each other. The Langlands correspondence is then read off of this decomposition. The following example of modular curves illustrates this process.

## Modular Curves

The most transparent situation in which the Langlands correspondence is realized in the cohomology of some geometric object is the case of modular curves. This corresponds to taking $F = \BQ$ and $G = \GL_2$. Then there is a bijection between cuspidal newforms of weight $k \geq 2$ and cuspidal automorphic representations $\pi = \pi_f \otimes \pi\_\infty$ of $G(\BA\_\BQ) = G(\BA_f) \times G(\BR)$ whose archimedean component $\pi\_\infty$ is the discrete series of weight $k$. In this situation, the relevant geometric objects are certain Shimura varieties, namely the modular curves $Y_K$ as $K$ ranges through the compact open subgroups of $\GL_2(\BA\_\BQ)$. These Shimura varieties are defined over $\BQ$. Let $X_K$ be the compactification of $Y_K$, and $X_{K, \bar{\BQ}}$ denote its base change to $\bar{\BQ}$.

Deligne constructs a $\bar{\BQ}\_\ell$-adic local system $\xi_k$ on $X_K$ for each $k \geq 2$. Define

$$H^1(\xi_k) := \varprojlim_K H^1(X_{K, \bar{\BQ}}, \xi_k).$$

This is a representation of $\GL_2(\BA_f) \times G\_\BQ$.

<div class="thm thm-theorem" markdown="1">
<span class="thm-label">Theorem 1 (Deligne–Carayol).</span>
As a representation of $\GL_2(\BA_f) \times G\_\BQ$, the cuspidal part of the cohomology $H^1(\xi_k)$ is isomorphic to (up to some twists)

$$\bigoplus_{\pi} \pi_f \otimes \varphi_\pi,$$

where $\pi = \pi_f \otimes \pi\_\infty$ runs over cuspidal automorphic representations for which $\pi\_\infty$ is discrete series of weight $k$, and $\varphi\_\pi$ is irreducible and $2$-dimensional.
</div>

## Shimura Varieties

Modular curves are $1$-dimensional examples of Shimura varieties. Here is a crash course on the basic formalism: one begins with a Shimura datum, which is a pair $(G, \mu)$ with $G$ a reductive group over $\BQ$ and $\mu$ a $G(\BR)$-conjugacy class of morphisms $\BC^\times \to G(\BR)$. This pair is forced to satisfy certain axioms, basically ensuring that the conjugacy class $\Hcal\_\mu$ is a Hermitian symmetric domain. We then define the tower of Shimura varieties

$$\Sh(G, \mu)_K := G(\BQ) \backslash \big( \Hcal_\mu \times G(\BA_f) / K \big)$$

as $K$ varies through the compact open subgroups of $G(\BA_f)$. The basic result, due to Deligne and many others, is that $\Sh_K(G, \mu)$ is a quasi-projective variety over $\BC$, canonically defined over a number field $E$.

The $\ell$-adic cohomology of the tower $\Sh(G, \mu)\_K$ admits an action of $G(\BA_f) \times G_E$. Kottwitz proposed that the Langlands correspondence should be realized in this cohomology, in the following sense: to an algebraic representation $\pi\_\infty$ of $G(\BR)$, there is a corresponding local system $\xi$ on $\Sh(G, \mu)\_K$, and one defines

$$H^i(\xi) := \varprojlim_K H^i\big( \Sh(G, \mu)_{K, \bar{\BQ}}, \bar{\BQ}_\ell \big),$$

$$H^*(\xi) := \sum_i (-1)^i H^i(\xi).$$

Here the sum defining $H^*(\xi)$ is taken in the Grothendieck group of $G(\BA_f) \times G_E$-representations.

<div class="thm thm-conjecture" markdown="1">
<span class="thm-label">Conjecture 2 (Kottwitz).</span>
In this Grothendieck group, we have (up to some twists)

$$H^*(\xi) = \sum_\pi a(\pi, \xi) \, \pi_f \otimes (R_\mu \circ \varphi_\pi).$$

Here $\pi$ runs over all cuspidal automorphic representations of $G$, $R_\mu \colon {}^L G \to \GL(N)$ is the representation of highest weight $\mu$, and $a(\pi, \xi)$ is some integer.
</div>

Essentially all approaches to constructing the Langlands correspondence over number fields use this conjecture as a guide, and make use of the cohomology of Shimura varieties in a crucial way. But these attacks have various shortcomings. For example, Shimura varieties don't even exist for some groups $G$, and even when they do, the cohomology of these Shimura varieties can only access the $\pi$ for which $a(\pi, \xi) \neq 0$ for some $\xi$ (these are called "cohomological").

## Shtukas

(Moduli spaces of) shtukas are the function field analogues of Shimura varieties. These spaces will no longer be varieties, or even schemes - they will be algebraic stacks, btu they will have 
the advantage that they exist uniformly for all groups $G$.

<div class="thm thm-definition" markdown="1">
<span class="thm-label">Definition 3.</span>
Let $X / \BF_q$ be a smooth projective curve whose function field is $F$, and let $S$ be any $\BF_q$-scheme. An $X$-shtuka of rank $n$ over $S$ consists of the following data:

- Morphisms $x_1, \ldots, x_r : S \to X$ called the *legs* of the shtuka
- Vector bundles $\Ecal_0, \ldots, \Ecal_r = \Frob_S^* \Ecal_0$ of rank $n$ over $X \times S$.
- For $i = 1, \ldots, r$, an isomorphism $f_i : \Ecal_{i-1} \lvert_{(X \times S) \setminus \Gamma_i} \cong \Ecal_{i} \lvert_{(X \times S) \setminus \Gamma_i}$ defined away from the graph $\Gamma_i \subset X \times S$ of $x_i$.
</div>

For each geometric point $s \to S$, the failure of $f_i$ to be an isomorphism at $X \times s$ is measured by a tuple of integers $\mu = (k_1, \ldots, k_n)$, with $k_1, \geq \cdots \geq k_n$. For example, an $f$ of type 
$(1, 0, \ldots, 0)$ is a map $\Ecal \to \Ecal '$ whose cokernel is the pushforward from $x$ of a $1$-dimensional vector space. 
There is a notion of level structure as well: for each effective divisor $D \subset X$ not meeting the legs of the shtuka, a level $D$ structure is a collection of trivializations $\Ecal_i \lvert_D \cong \Ocal_D^{\oplus n}$ for each $i = 0, \ldots, r-1$, which are compatible with the $f_i$.

Let $\mu := (\mu_1, \ldots, \mu_r)$ be tuples of integers as defined above measuring the failure of each $f_i$ to be an isomorphism. We write $\Sht_{n, D}^\mu$ for the moduli stack of $r$-legged $\GL_n$-shtukas, with modification type $\mu$ and level $D$ structure.

Drinfeld's proof of the Langlands correspondence for $\GL_2$ makes use of the moduli stack of shtukas of rank $2$ with legs $\mu_1$ and $\mu_2$, of type $(1, 0)$ and $(0, -1)$ respectively. He first shows that $\Sht_{2, D}^{\mu}$ is a Deligne-Mumford stack, and that the natural morphism $\Sht_{2, D}^{\mu} \to (X \setminus D)^2$ is smooth of relative dimension $2$. The tower of stacks $\Sht_{2, D}^{\mu}$ (as $D$ varies through all effective divisors) admits an action of $\GL_2(\BA_f)$. Drinfeld defines

$$V_\ell := \varinjlim_{D} H^2(\Sht_{2, D}^{\mu} \times \bar{\eta}_2, \bar{\BQ}_\ell)$$

where $\eta_2 = \Spec F_2$ is the generic point of the surface $X^2$, and $\bar{\eta}_2 = \Spec \bar{F\_2}$. Then $\GL_2(\BA_f)$ acts on $V\_\ell$. If $\pi$ is a cuspidal automorphic representation of $\GL_2(\BA_f)$ with $\bar{\BQ}\_\ell$ coefficients, then the representation of $G\_{F_2}$ on $\Hom\_{\GL_2(\BA_f)}(\pi, V\_\ell)$ factors through a representation of $W_F \times W_F$ of the form $\varphi \otimes \hat{\varphi}$, where $\varphi$ is irreducible and $2$-dimensional. Then $\pi \mapsto \varphi$ *is* the Langlands correspondence for $\GL_2$ over $F$.

Later, L. Lafforgue extended Drinfeld's methods to prove Langlands for $\GL_n$ over $F$, again using moduli of rank $n$ shtukas with two legs. Varshavsky also defined stacks of shtukas for all reductive groups $G$. A version of Conjecture 2 also exists for these stacks as well, which I won't write out here. 

Finally, I should mention another fascinating application of shtukas - their relation to (derivatives of) $L$-functions. This is something I hope to write more about later on, and in fact was my original motivation for learning about shtukas!



<div class="dinkus"></div>

## Further reading

- P. Deligne, *Formes modulaires et représentations $\ell$-adiques*.
- H. Carayol, *Sur les représentations $\ell$-adiques associées aux formes modulaires de Hilbert*.
- V. Drinfeld, *Langlands' conjecture for $\GL_2$ over function fields*.
- L. Lafforgue, *Chtoucas de Drinfeld et correspondance de Langlands*.
- V. Lafforgue, *Shtukas for reductive groups and Langlands correspondence for function fields*.
- J. Weinstein, *Shtukas and the Langlands Program: A Birds-Eye View*.