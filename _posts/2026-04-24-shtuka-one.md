---
layout: post
title: "Shtukas: Part I"
date: 2026-04-24
description: What is a shtuka?
---

For my first post, I want to explain the mathematical object that inspired the naming of this website: shtukas. 


This is an object in modern number theory that looks artificial until
one sees what it does: a **shtuka** is a vector bundle on a curve, modified
at a few moving points, and then identified with its Frobenius pullback.{% include sn.html id=1 content="The word comes from Drinfeld's terminology. The point is not the name, but the mechanism: modification plus Frobenius." %}

This small piece of geometry is one of the main reasons the Langlands
program is so much more complete over function fields than over number
fields.

## The Langlands dictionary

The Langlands program predicts a correspondence between two very
different kinds of objects.

On one side are automorphic representations

$$
\pi \;=\; \bigotimes_v' \pi_v,
$$

which are built from harmonic analysis on groups such as
$GL_n(\mathbb A_F)$. On the other side are Galois representations, or more
generally Langlands parameters,

$$
\rho_\pi : \operatorname{Gal}(\overline F/F)
\longrightarrow {}^LG.
$$

The basic compatibility is local. At almost every place $v$, the
automorphic representation $\pi_v$ is unramified, and Langlands predicts
that its Satake parameter is the same data as the semisimple conjugacy
class of Frobenius:

$$
\rho_\pi(\operatorname{Frob}_v)_{\mathrm{ss}}
\quad \leftrightarrow \quad
\text{Satake parameter of } \pi_v.
$$

For $G=GL_n$, this says that the Hecke eigenvalues of $\pi$ should be
the characteristic-polynomial data of Frobenius acting on an
$n$-dimensional Galois representation.

In short: Hecke eigenvalues should be Frobenius eigenvalues.

## The classical template: modular curves

For $GL_2/\mathbb Q$, this dictionary is already visible in the
cohomology of modular curves. A weight two modular eigenform

$$
f(q)=\sum_{m\geq 1} a_m q^m
$$

determines a two-dimensional $\ell$-adic Galois representation

$$
\rho_{f,\ell} :
\operatorname{Gal}(\overline{\mathbb Q}/\mathbb Q)
\longrightarrow GL_2(\overline{\mathbb Q}_\ell),
$$

with

$$
\operatorname{tr}\rho_{f,\ell}(\operatorname{Frob}_p)=a_p,
\qquad
\det\rho_{f,\ell}(\operatorname{Frob}_p)=\varepsilon(p)p^{k-1}
$$

for primes $p\nmid N\ell$.

Geometrically, this representation occurs in the étale cohomology of a
modular curve. Very schematically, one has a decomposition of the form

$$
H^1_{\mathrm{\acute et}}
\!\left(Y_K\otimes \overline{\mathbb Q},\mathcal V_\ell\right)_{\pi_f}
\;\approx\;
\bigoplus \rho_{f,\ell}\otimes \pi_f^K.
$$

Here $Y_K$ is a modular curve, $\mathcal V_\ell$ is the relevant
$\ell$-adic local system, and $\pi_f$ is the automorphic representation
attached to $f$.{% include sn.html id=2 content="The symbol $\approx$ hides the usual normalizations: duals, Tate twists, compactifications, boundary terms, and local-global compatibility conventions." %}

This is the first major pattern: a moduli space carries both Hecke
correspondences and a Galois action. Decomposing its cohomology
simultaneously under both actions produces the Langlands correspondence.

## Why Shimura varieties are powerful but selective

Modular curves are the simplest Shimura varieties. Higher-dimensional
Shimura varieties extend the same idea: they are moduli spaces {% include sn.html id=3 content="Technically I'm lying here: conjecturally all Shimura varieties are moduli spaces of some sort of motivic object, but in practice, the best thing we can say are that some Shimura varieties are moduli spaces of Hodge structures."} whose
cohomology carries Hecke actions and Galois actions at the same time.

But Shimura varieties have a built-in limitation. Their cohomology sees
automorphic representations whose archimedean component is
cohomological:

$$
H^\bullet(\mathfrak g,K_\infty;\pi_\infty\otimes V)\neq 0.
$$

So Shimura varieties do not see the entire automorphic spectrum. They
see the part that is algebraic enough to contribute to cohomology.

This is not a defect; it is what makes them geometric. But it means that
Shimura varieties are a window into Langlands, not the whole building.

## Function fields and the appearance of Frobenius

Now replace a number field by a function field. Let

$$
X/\mathbb F_q
$$

be a smooth, projective, geometrically connected curve, and let

$$
F=\mathbb F_q(X)
$$

be its function field. The places of $F$ are the closed points of $X$.

The crucial new feature is that $X$ lives over a finite field, so there
is a Frobenius morphism. This gives function fields an extra geometric
operation that number fields do not visibly possess.

A shtuka is what happens when one builds Frobenius directly into the
moduli problem.

## What is a shtuka?

For simplicity, take $G=GL_n$. Then a $G$-bundle on $X$ is just a rank
$n$ vector bundle. A shtuka with a finite set of legs $I$ consists,
roughly, of the following data over a test scheme $S$:

$$
(x_i)_{i\in I}, \qquad x_i:S\to X,
$$

together with two vector bundles $\mathcal E$ and $\mathcal E'$ on
$X\times S$, an isomorphism away from the graphs of the $x_i$,

$$
\phi:
\mathcal E\big|_{(X\times S)\setminus \cup_i\Gamma_{x_i}}
\;\xrightarrow{\sim}\;
\mathcal E'\big|_{(X\times S)\setminus \cup_i\Gamma_{x_i}},
$$

and a Frobenius identification

$$
\theta:
\mathcal E'
\;\xrightarrow{\sim}\;
(\operatorname{id}_X\times \operatorname{Frob}_S)^*\mathcal E.
$$

The points $x_i$ are called the **legs** of the shtuka.{% include sn.html id=4 content="A leg is a point of the curve where the bundle is allowed to change. Away from the legs, the bundle and its Frobenius pullback are identified." %}

Thus a shtuka is a vector bundle which is modified at finitely many
points and then closed up by Frobenius.

It is a geometric incarnation of the phrase:

$$
\text{Hecke modification} \;+\; \text{Frobenius} .
$$

## One leg is not enough

A one-legged shtuka has a single moving point where the modification is
allowed. This already resembles the geometry of Shimura varieties. In
the local $p$-adic world, one-legged minuscule local shtukas recover
local Shimura varieties and Rapoport--Zink spaces.

But for global Langlands, one leg is too small.

The reason becomes very clear in the excursion-operator formalism. Let
$\widehat G$ be the Langlands dual group. The functions relevant to
one-legged excursions live on

$$
\widehat G\backslash \widehat G/\widehat G.
$$

But this double quotient is just a point. With one leg, there is no
nontrivial relative position between different Frobenius motions. The
geometry can carry Hecke and Galois actions, but it does not yet have
enough room to manufacture the operators that separate global
Langlands parameters.

So the issue is analogous to the Shimura-variety limitation, but not
identical. For Shimura varieties, the obstruction is archimedean and
cohomological. For one-legged shtukas, the obstruction is that the
geometry has only one Frobenius-moving point.

## Two legs change the story

With two legs, the invariant quotient becomes

$$
\widehat G\backslash \widehat G^2/\widehat G
\;\cong\;
\widehat G//\widehat G,
$$

where the map is given by

$$
(g_1,g_2)\longmapsto g_1^{-1}g_2.
$$

Thus two legs see conjugacy classes in $\widehat G$. For
$G=GL_n$, functions on conjugacy classes are controlled by characteristic
polynomials, or equivalently by traces of exterior powers.

This is exactly the kind of data needed to reconstruct a semisimple
$n$-dimensional Galois representation.

A two-legged shtuka can detect quantities of the form

$$
\operatorname{tr}\rho(\gamma_1^{-1}\gamma_2).
$$

Taking $\gamma_2=1$, this recovers

$$
\operatorname{tr}\rho(\gamma_1).
$$

For $GL_n$, traces determine semisimple Galois representations. This is
why Drinfeld's shtukas for $GL_2$, and Laurent Lafforgue's higher-rank
shtukas for $GL_n$, are powerful enough to prove the global Langlands
correspondence over function fields.{% include sn.html id=5 content="Strictly speaking, Vincent Lafforgue's general excursion formalism uses arbitrary finite sets of legs. But for $GL_n$, two-legged Drinfeld shtukas already capture the classical trace/pseudocharacter mechanism." %}

## Excursion operators

The modern way to package this is through **excursion operators**.

Given a finite set $I$, a function

$$
f\in \mathcal O(\widehat G\backslash \widehat G^I/\widehat G),
$$

and Galois elements $(\gamma_i)_{i\in I}$, one constructs an operator

$$
S_{I,f,(\gamma_i)}
$$

on the space of cuspidal automorphic forms.

Morally, the construction has three steps.

First, create several legs at the same generic point of the curve.
Second, move those legs independently using the Galois elements
$\gamma_i$. Third, bring the legs back together and annihilate them.

This is why the operator is called an excursion: the legs go out, pick
up Galois monodromy, and return.

If an automorphic form belongs to the summand associated with a
Langlands parameter

$$
\sigma:\operatorname{Gal}(\overline F/F)\to {}^LG,
$$

then the excursion operator acts by the scalar

$$
f\left((\sigma(\gamma_i))_{i\in I}\right).
$$

Thus the automorphic side secretly carries enough operators to recover
the Galois parameter.

In short:

$$
\text{excursion operators} \quad = \quad
\text{Galois parameters acting on automorphic forms}.
$$

## Why shtukas matter

Shtukas matter because they give a geometric machine for producing the
Langlands correspondence over function fields.

They combine three structures in one moduli problem:

$$
\text{bundles on a curve},\qquad
\text{Hecke modifications},\qquad
\text{Frobenius}.
$$

The cohomology of their moduli stacks carries Hecke actions from
modifications and Galois actions from Frobenius. Multi-legged shtukas
then provide the extra degrees of freedom needed to build excursion
operators, which cut the automorphic spectrum into pieces indexed by
Langlands parameters.

This is the conceptual leap:

$$
\text{Langlands correspondence}
\quad \rightsquigarrow \quad
\text{spectral decomposition of shtuka cohomology}.
$$

For modular curves, the slogan was that modularity appears in
cohomology. For shtukas, the slogan is stronger.

Modularity is the monodromy of Frobenius-modified bundles.

<div class="dinkus"></div>

## Further reading

- P. Deligne, *Formes modulaires et représentations $\ell$-adiques*.
- H. Carayol, *Sur les représentations $\ell$-adiques associées aux formes modulaires de Hilbert*.
- V. Drinfeld, *Langlands' conjecture for $GL_2$ over function fields*.
- L. Lafforgue, *Chtoucas de Drinfeld et correspondance de Langlands*.
- V. Lafforgue, *Shtukas for reductive groups and Langlands correspondence for function fields*.