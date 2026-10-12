---
title: "An integral formula for dimensions of multiplicity spaces"
date: 2026-10-12
description: "We explain how to compute the dimensions of certain multiplicity spaces between compact Lie groups using a relative trace formula argument."
abstract: "We explain how to compute the dimensions of certain multiplicity spaces between compact Lie groups using a relative trace formula argument."
tags:
  - math.RT
draft: false
---

In this post, I want to explain how to compute the dimensions of certain multiplicity spaces between representations of compact Lie groups using an integral formula. This is an immediate consequence of the Weyl integral and dimension formulas, but I'm going to give a different proof via a relative trace formula that will cleanly generalize to $p$-adic multiplicity spaces.

<div class="thm thm-theorem">

**Theorem 1.** Let $G$ be a (possibly disconnected) compact Lie group, and $H \subset G$ a closed subgroup. Let $H^\circ \subset H$ denote the identity component, and let $\Gamma = H/H^\circ$. For each $\gamma \in \Gamma$, choose an arbitrary representative $h_\gamma \in H$.

Let $\pi$ and $\sigma$ be irreducible continuous complex representations of $G$ and $H$ respectively, with characters $\chi_\pi$ and $\chi_\sigma$. We normalize the Haar measure $dk$ on $H^\circ$ so that $H^\circ$ has volume $1$. Then

<div class="math-block">
$$
\dim_{\mathbb C}\operatorname{Hom}_H(\pi,\sigma)
= \frac{1}{|\Gamma|}\sum_{\gamma\in\Gamma}
\int_{H^\circ}\chi_\pi(h_\gamma k)\overline{\chi_\sigma(h_\gamma k)}\,dk
$$
</div>

</div>

We will prove this theorem via a relative trace formula. For brevity, write $m_H(\pi,\sigma) = \dim_{\mathbb C}\operatorname{Hom}(\pi,\sigma)$. The rough idea is as follows: We will first establish a trace identity for arbitrary test functions on $G$, and then choose a specific test function that exactly extracts $m(\pi,\sigma)$.

## Spectral Expansion

Equip $G$ and $H$ with probability Haar measures $dg$ and $dh$ respectively, and $H\backslash G$ the quotient measure $d\dot{x}$ characterized by

<div class="math-block">
$$
\int_G F(g)\,dg = \int_{H\backslash G}\int_H F(hx)\,dh\,d\dot{x}
$$
</div>

Choose invariant inner products on $\pi$ and $\sigma$, so that we have (in particular)

<div class="math-block">
$$
\chi_\pi(g^{-1}) = \overline{\chi_\pi(g)}
$$
</div>

and similarly for $\chi_\sigma$. Consider the $G$-representation $\mathcal H_\sigma = \operatorname{Ind}_H^G \sigma$. Concretely, this is the Hilbert completion of the space of functions $\phi:G\to\sigma$ satisfying

- $\phi(hx) = \sigma(h)\phi(x)$.
- The norm is given by

<div class="math-block">
$$
\|\phi\|^2 = \int_{H\backslash G}\|\phi(x)\|^2\,d\dot{x}
$$
</div>

The space $\mathcal H_\sigma$ is naturally a unitary representation of $G$ via right translation: $(R(g)\phi)(x) = \phi(xg)$.

<div class="thm thm-lemma">

**Lemma 2.** We have

<div class="math-block">
$$
\mathcal H_\sigma \cong \widehat{\bigoplus}_{\tau\in\widehat G}
\operatorname{Hom}_H(\tau,\sigma)\otimes\tau
$$
</div>

where $\widehat G$ is the set of isomorphism classes of irreducible unitary representations of $G$. On the right-hand side, $G$ acts by $g\cdot(A\otimes v) = A\otimes\tau(v)$.

</div>

*Proof.* The Peter-Weyl theorem gives

<div class="math-block">
$$
L^2(G) \cong \widehat{\bigoplus}_{\tau\in\widehat G}\tau^\vee\otimes\tau
$$
</div>

Now consider the larger space

<div class="math-block">
$$
L^2(G,\sigma) := \sigma\otimes L^2(G)
$$
</div>

Using P-W, we have

<div class="math-block">
$$
L^2(G,\sigma) \cong \widehat{\bigoplus}_{\tau\in\widehat G}
(\sigma\otimes\tau^\vee)\otimes\tau
$$
</div>

Note that $\mathcal H_\sigma$ is the subspace of $L^2(G,\sigma)$ consisting of functions satisfying $f(hg) = \sigma(h)f(g)$. We will now express this condition as invariance under a certain $H$-action.

Define $U(h)$ by $(U(h)f)(g) = \sigma(h)f(h^{-1}g)$. Then $U(h)f = f$ if and only if $\sigma(h)f(h^{-1}g) = f(g)$, which after making the substitution $g\mapsto hg$ is equivalent to $f(hg) = \sigma(h)f(g)$. Thus we have $\mathcal H_\sigma \cong L^2(G,\sigma)^H$. Using the Peter-Weyl decomposition, we have

<div class="math-block">
$$
\begin{aligned}
\mathcal H_\sigma
&\cong \left(\widehat{\bigoplus}_{\tau\in\widehat G}
(\sigma\otimes\tau^\vee)\otimes\tau\right)^H \\
&\cong \widehat{\bigoplus}_{\tau\in\widehat G}
(\sigma\otimes\tau^\vee)^H\otimes\tau \\
&\cong \widehat{\bigoplus}_{\tau\in\widehat G}
\operatorname{Hom}_H(\tau,\sigma)\otimes\tau
\end{aligned}
$$
</div>

<p class="qed" aria-label="End of proof">□</p>

Let $\mathcal R(G)$ be the space of finite linear combinations of matrix coefficients of finite dimensional representations of $G$. Given $f\in\mathcal R(G)$, define

<div class="math-block">
$$
R(f) = \int_G f(g)R(g)\,dg
$$
</div>

and

<div class="math-block">
$$
\tau(f) = \int_G f(g)\tau(g)\,dg
$$
</div>

By Schur orthogonality, $\tau(f) = 0$ for all but finitely many $\tau$. Moreover, since all the multiplicity spaces we are considering are finite dimensional, the operator $R(f)$ has finite rank. On the $\tau$-summand, it acts as $\operatorname{id}\otimes\tau(f)$, so we have

<div class="math-block">
$$
\operatorname{tr} R(f) = \sum_{\tau\in\widehat G}m(\tau,\sigma)\operatorname{tr}\tau(f)
$$
</div>

This sum is finite, and is the *spectral expansion* of the trace.

## Geometric Expansion

For a smooth equivariant function $\phi$, we have

<div class="math-block">
$$
\begin{aligned}
(R(f)\phi)(x)
&= \int_G f(g)\phi(xg)\,dg \\
&= \int_G f(x^{-1}z)\phi(z)\,dz \\
&= \int_{H\backslash G}\int_H f(x^{-1}hz)\phi(hz)\,dh\,d\dot{z} \\
&= \int_{H\backslash G}\left(\int_H f(x^{-1}hx)\sigma(h)\,dh\right)\phi(z)\,d\dot{z}
\end{aligned}
$$
</div>

Its smooth integral kernel is therefore

<div class="math-block">
$$
K_f(x,z) := \int_H f(x^{-1}hz)\sigma(h)\,dh
$$
</div>

We have the identity $K_f(h_1x,h_2xz) = \sigma(h_1)K_f(x,z)\sigma(h_2^{-1})$. Thus $\operatorname{tr}K_f(x,x)$ is independent of the choice of representative $x$ in the coset $Hx$. Since $R(f)$ has finite rank and smooth kernel, we have

<div class="math-block">
$$
\operatorname{tr}R(f) = \int_{H\backslash G}\operatorname{tr}K_f(x,x)\,d\dot{x}
$$
</div>

Choose an orthonormal basis $u_1,\ldots,u_N$ of the finite dimensional sum of representations supporting $R(f)$. If its matrix in this basis is $(a_{ij})$, then its kernel is

<div class="math-block">
$$
K_f(x,z) = \sum_{i,j}a_{ij}u_i(x)u_j(z)^*
$$
</div>

and integrating the diagonal trace gives

<div class="math-block">
$$
\sum_{i,j}a_{ij}\int_{H\backslash G}u_j(x)^*u_i(x)\,d\dot{x}
= \sum_i a_{ii} = \operatorname{tr}R(f)
$$
</div>

Thus we obtain:

<div class="math-block">
$$
\operatorname{tr}R(f) = J_\sigma(f)
:= \int_{H\backslash G}\int_H f(x^{-1}hx)\chi_\sigma(h)\,dh\,d\dot{x}
$$
</div>

## Orbital Integrals

We now rewrite the right-hand side of the above formula in terms of orbital integrals. For $a\in G$, define its *conjugacy average* by

<div class="math-block">
$$
O_a^G(f) = \int_G f(x^{-1}ax)\,dx
$$
</div>

The function

<div class="math-block">
$$
x\mapsto\int_H f(x^{-1}hx)\chi_\sigma(h)\,dh
$$
</div>

is left invariant. Since the Haar measure on $H$ has been normalized to have volume one, we may replace its quotient integral by an integral over $G$. By Fubini we then have

<div class="math-block">
$$
\begin{aligned}
J_\sigma(f) &= \int_G\int_H f(x^{-1}hx)\chi_\sigma(h)\,dh\,dx \\
&= \int_H\chi_\sigma(h)O_h^G(f)\,dh
\end{aligned}
$$
</div>

Decomposing, we have

<div class="math-block">
$$
J_\sigma(f) = \frac{1}{|\Gamma|}\sum_{\gamma\in\Gamma}
\int_{H^\circ}\chi_\sigma(h_\gamma k)O_{h_\gamma k}^G(f)\,dk
$$
</div>

We have shown:

<div class="thm thm-theorem">

**Theorem 3.** Keeping the notation above,

<div class="math-block">
$$
\sum_{\tau\in\widehat G}m_H(\tau,\sigma)\operatorname{tr}\tau(f)
= \frac{1}{|\Gamma|}\sum_{\gamma\in\Gamma}
\int_{H^\circ}\chi_\sigma(h_\gamma k)O_{h_\gamma k}^G(f)\,dk
$$
</div>

</div>

This is our relative trace formula.

## Wrapping Up

Armed with our RTF, we can now finish the proof. This will involve carefully choosing a function $f$ so that the spectral side gives us our desired multiplicity.

Let $d_\pi = \dim\pi$, and let $P:\pi\to\pi$ be an orthogonal rank-one projector. Define

<div class="math-block">
$$
f_P(g) = d_\pi\operatorname{tr}(P\pi(g^{-1}))
$$
</div>

By Schur orthogonality, we have $\tau(f_P) = 0$ if $\tau\not\cong\pi$, and $\pi(f_P) = P$. Thus, taking $f=f_P$ in the RTF, the spectral side collapses to $m_H(\pi,\sigma)$. On the geometric side, we compute

<div class="math-block">
$$
\begin{aligned}
O_a^G(f_P)
&= d_\pi\int_G\operatorname{tr}(P\pi(x^{-1}a^{-1}x))\,dx \\
&= d_\pi\operatorname{tr}\left(
\left[\int_G\pi(x)P\pi(x)^{-1}\,dx\right]\pi(a^{-1})
\right)
\end{aligned}
$$
</div>

The endomorphism

<div class="math-block">
$$
B := \int_G\pi(x)P\pi(x)^{-1}\,dx
$$
</div>

commutes with $\pi(G)$. Since $\pi$ is irreducible, Schur's lemma implies that $B$ is a scalar. In fact, $\operatorname{tr}B = \operatorname{tr}P = 1$. Thus $B = \frac{1}{d_\pi}\mathbf 1$ and hence

<div class="math-block">
$$
O_a^G(f_P) = \chi_\pi(a^{-1})
$$
</div>

Combining everything so far, we have

<div class="math-block">
$$
m_H(\pi,\sigma) = \int_H\chi_\sigma(h)\chi_\pi(h^{-1})\,dh
$$
</div>

A probability Haar measure on a compact group is invariant under inversion. Changing $h$ with its inverse, we arrive at

<div class="math-block">
$$
m_H(\pi,\sigma) = \frac{1}{|\Gamma|}\sum_{\gamma\in\Gamma}
\int_{H^\circ}\chi_\pi(h_\gamma k)\overline{\chi_\sigma(h_\gamma k)}\,dk
$$
</div>

which is our desired formula.
