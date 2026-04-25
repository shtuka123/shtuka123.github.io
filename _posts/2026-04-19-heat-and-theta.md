---
layout: post
title: Heat, Theta, and a Flat Connection
date: 2026-04-19
description: Why the Jacobi theta function is a heat kernel in disguise, and what the Weil representation has to do with it.
---

There is an observation that takes a while to stop surprising you: the
Jacobi theta function is a solution to the heat
equation.{% include sn.html id=1 content="With imaginary time, which is the whole source of the trouble — and the whole source of the connection to representation theory." %}
More than that — in a precise sense, *it is* the heat kernel on a
circle.

## The heat equation, briefly

Fix the one-variable Jacobi theta function

$$\theta(z, \tau) \;=\; \sum_{n \in \mathbb{Z}} e^{\pi i n^{2} \tau \,+\, 2\pi i n z},\qquad z \in \mathbb{C},\ \tau \in \mathbb{H}.$$

A direct differentiation under the sum{% include sn.html id=2 content="The series converges absolutely and uniformly on compact subsets of $\mathbb{C} \times \mathbb{H}$, owing to $\operatorname{Im}(\tau) > 0$." %} gives

$$\frac{\partial \theta}{\partial \tau} \;=\; \frac{1}{4\pi i} \frac{\partial^{2} \theta}{\partial z^{2}}.$$

This is the heat equation, but with the time variable rotated ninety
degrees into the complex plane. Taking $\tau = it$ with $t > 0$
recovers the ordinary heat kernel on $\mathbb{R}/\mathbb{Z}$.

## Why this matters

Theta is a section of a line bundle $\mathcal{L}$ on the universal
elliptic curve, and the heat equation equips $\mathcal{L}$ with a
*projectively flat connection*{% include sn.html id=3 content="The flatness is up to a scalar — a framing anomaly, in the language of Chern–Simons theory." %}
over the base. Parallel transport around a loop in moduli space is
the **Weil representation** of $\operatorname{SL}\_2(\mathbb{Z})$
acting on theta functions.

In short: modularity is monodromy.

<div class="dinkus"></div>

## A small numerical check

A handful of lines of Python: compute $\theta(z, \tau)$ by truncating
the series and verify the heat equation numerically.

```python
import numpy as np

def theta(z, tau, N=40):
    """Jacobi theta function, truncated to |n| <= N."""
    n = np.arange(-N, N + 1)
    phase = np.pi * 1j * n[:, None]**2 * tau + 2 * np.pi * 1j * n[:, None] * z
    return np.exp(phase).sum(axis=0)

def check_heat_equation(z0=0.3 + 0.1j, tau0=0.2 + 0.7j, h=1e-5):
    d_tau = (theta(z0, tau0 + h) - theta(z0, tau0 - h)) / (2 * h)
    d2_z  = (theta(z0 + h, tau0) - 2 * theta(z0, tau0)
             + theta(z0 - h, tau0)) / h**2
    return d_tau, d2_z / (4j * np.pi), abs(d_tau - d2_z / (4j * np.pi))

lhs, rhs, err = check_heat_equation()
print(f"error: {err:.2e}")   # ~1e-7
```

The identity holds pointwise — unsurprising, but pleasant to watch.