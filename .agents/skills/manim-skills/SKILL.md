---
name: manim-skills
description: Mathematical animation algorithms, procedural curve generation, dynamic tangent calculus, matrix transformations, and geometric visualization patterns for browser-based canvas rendering.
---

# Manim Skills (Mathematical Motion Graphics)

This skill provides algorithms and visual patterns for rendering elegant, precise mathematical motion graphics (in the spirit of 3Blue1Brown's Manim) on HTML5 Canvas and WebGL.

## 1. Core Mathematical Primitives for *world.execute(me);*

### A. Dynamic Polynomial & Tangent Vector Calculation
Lyrics: *"If I can feel your vibrations / Then I can finally be completion / Then I'm tangent to the polynomial"*

The visual requires drawing a continuous polynomial curve $f(x)$ and an animated tangent line at point $(x_0, f(x_0))$ with dynamic derivative $m = f'(x_0)$:

```typescript
// Tangent equation: y - y0 = m * (x - x0) => y = m * (x - x0) + y0
function drawManimPolynomialAndTangent(
  ctx: CanvasRenderingContext2D,
  t: number,
  width: number,
  height: number
) {
  const originX = width * 0.5;
  const originY = height * 0.5;
  const scale = 80;

  // Polynomial f(x) = 0.05 * x^3 - 0.4 * x + sin(x)
  const f = (x: number) => 0.04 * Math.pow(x, 3) - 0.3 * x + Math.sin(x + t);
  const df = (x: number) => 0.12 * Math.pow(x, 2) - 0.3 + Math.cos(x + t);

  // 1. Draw coordinate grid & axes
  drawCoordinateGrid(ctx, originX, originY, scale);

  // 2. Draw smooth polynomial path
  ctx.strokeStyle = 'rgba(0, 240, 255, 0.7)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  for (let px = -originX; px <= originX; px += 2) {
    const x = px / scale;
    const y = f(x);
    const screenX = originX + px;
    const screenY = originY - y * scale;
    if (px === -originX) ctx.moveTo(screenX, screenY);
    else ctx.lineTo(screenX, screenY);
  }
  ctx.stroke();

  // 3. Dynamic tangent point traversing the curve
  const x0 = 2.5 * Math.sin(t * 1.5);
  const y0 = f(x0);
  const m = df(x0);
  const pScreenX = originX + x0 * scale;
  const pScreenY = originY - y0 * scale;

  // Tangent line segment
  const tangentLength = 160;
  const angle = Math.atan(m);
  const dx = Math.cos(angle) * tangentLength;
  const dy = Math.sin(angle) * tangentLength;

  ctx.strokeStyle = 'rgba(255, 0, 128, 0.9)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(pScreenX - dx, pScreenY + dy); // Note: screen Y is inverted
  ctx.lineTo(pScreenX + dx, pScreenY - dy);
  ctx.stroke();

  // Highlight contact point
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(pScreenX, pScreenY, 5, 0, Math.PI * 2);
  ctx.fill();
}
```

### B. Sine Curve Propagation & Fourier Synthesis
Lyrics: *"sine curve / sine wave"*
- Dual oscillating harmonics showing phase shifts $\Delta\phi$ and frequency modulation driven by audio FFT spectrum.
- Vector circle rolling visualization (epicycles) unfolding into the sine wave.

### C. Dimensional Matrix Grid Transformation
- Linear transformation matrix $\begin{pmatrix} a & b \\ c & d \end{pmatrix}$ smoothly interpolating between identity $\mathbf{I}$ and shear/rotation matrices to simulate spatial warping.
