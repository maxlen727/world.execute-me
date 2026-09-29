/**
 * BackgroundStage.ts — BOLD EDITION
 * No more restraint. Full visual impact.
 */

import { AudioFrequencyData } from '../audio/AudioEngine';

interface Palette {
  bg: [number, number, number];
  glow: [number, number, number];
}

const PALETTES: Record<string, Palette> = {
  boot:        { bg: [8, 8, 18],     glow: [40, 80, 200] },
  geometry:    { bg: [6, 14, 32],    glow: [50, 100, 220] },
  oscilloscope:{ bg: [6, 20, 14],    glow: [40, 180, 100] },
  execution:   { bg: [28, 6, 14],    glow: [220, 50, 70] },
  oop:         { bg: [18, 8, 28],    glow: [160, 80, 220] },
  trial:       { bg: [30, 4, 6],     glow: [240, 50, 40] },
  memory:      { bg: [4, 16, 22],    glow: [40, 200, 220] },
  climax:      { bg: [32, 4, 8],     glow: [255, 60, 70] },
  outro:       { bg: [5, 5, 7],      glow: [60, 60, 80] },
};

const SECTION_ENERGY: Record<string, number> = {
  boot: 0.4, geometry: 0.5, oscilloscope: 0.65, execution: 0.85,
  oop: 0.55, trial: 0.9, memory: 0.6, climax: 1.0, outro: 0.2,
};

interface Mote {
  x: number; y: number;
  vx: number; vy: number;
  size: number; alpha: number;
}

export class BackgroundStage {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  private currentPalette: Palette = PALETTES.boot;
  private targetPalette: Palette = PALETTES.boot;
  private lerpProgress = 1;
  private section = 'boot';

  private beatBrightness = 0;
  private flashBrightness = 0; // strong event flash
  private motes: Mote[] = [];
  private time = 0;
  private scanY = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No 2D context');
    this.ctx = ctx;
    this.resize();
    window.addEventListener('resize', () => this.resize());

    for (let i = 0; i < 120; i++) {
      this.motes.push(this.spawnMote());
    }
  }

  private resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  private spawnMote(): Mote {
    return {
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 12,
      vy: (Math.random() - 0.5) * 8 - 4,
      size: Math.random() * 2.5 + 0.5,
      alpha: Math.random() * 0.25 + 0.05,
    };
  }

  public setScene(sceneId: string) {
    const next = PALETTES[sceneId] || PALETTES.boot;
    if (next === this.targetPalette) return;
    this.section = sceneId;
    this.currentPalette = this.getInterpolatedPalette();
    this.targetPalette = next;
    this.lerpProgress = 0;
  }

  public triggerBeat(intensity: number) {
    const energy = SECTION_ENERGY[this.section] || 0.4;
    this.beatBrightness = Math.max(this.beatBrightness, intensity * energy * 0.35);
  }

  public triggerFlash(intensity: number) {
    this.flashBrightness = Math.max(this.flashBrightness, intensity);
  }

  public render(dt: number, freq: AudioFrequencyData) {
    this.time += dt;

    if (this.lerpProgress < 1) {
      this.lerpProgress = Math.min(1, this.lerpProgress + dt * 0.6);
    }

    this.beatBrightness *= 0.88;
    if (this.beatBrightness < 0.003) this.beatBrightness = 0;
    this.flashBrightness *= 0.90;
    if (this.flashBrightness < 0.005) this.flashBrightness = 0;

    const pal = this.getInterpolatedPalette();
    const w = window.innerWidth;
    const h = window.innerHeight;
    const ctx = this.ctx;
    const energy = SECTION_ENERGY[this.section] || 0.4;

    // 1. Background fill + beat brightness
    const bMul = 1 + this.beatBrightness * 8;
    const br = Math.min(255, pal.bg[0] * bMul);
    const bg = Math.min(255, pal.bg[1] * bMul);
    const bb = Math.min(255, pal.bg[2] * bMul);
    ctx.fillStyle = `rgb(${br | 0},${bg | 0},${bb | 0})`;
    ctx.fillRect(0, 0, w, h);

    // 2. Center radial glow — BOLD, pulses with bass
    const glowAlpha = 0.12 + this.beatBrightness * 0.8 + freq.bass * 0.08;
    const grad = ctx.createRadialGradient(w * 0.5, h * 0.42, 0, w * 0.5, h * 0.42, w * 0.55);
    grad.addColorStop(0, `rgba(${pal.glow[0]},${pal.glow[1]},${pal.glow[2]},${glowAlpha})`);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // 3. Section patterns — VISIBLE
    this.renderSectionPattern(ctx, w, h, pal, freq);

    // 4. Floating motes — MORE, BRIGHTER
    this.updateAndDrawMotes(ctx, w, h, dt, pal, energy, freq);

    // 5. Scan line
    this.scanY += dt * 40 * (1 + energy);
    if (this.scanY > h) this.scanY -= h;
    ctx.fillStyle = `rgba(${pal.glow[0]},${pal.glow[1]},${pal.glow[2]},0.03)`;
    ctx.fillRect(0, this.scanY - 1, w, 2);

    // 6. Edge vignette
    const vigAlpha = 0.25 + energy * 0.45;
    const vig = ctx.createRadialGradient(w * 0.5, h * 0.5, w * 0.2, w * 0.5, h * 0.5, w * 0.72);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, `rgba(0,0,0,${vigAlpha})`);
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, w, h);

    // 7. Event flash overlay
    if (this.flashBrightness > 0.01) {
      ctx.fillStyle = `rgba(255,255,255,${this.flashBrightness * 0.25})`;
      ctx.fillRect(0, 0, w, h);
    }
  }

  private renderSectionPattern(ctx: CanvasRenderingContext2D, w: number, h: number, pal: Palette, freq: AudioFrequencyData) {
    const [gr, gg, gb] = pal.glow;

    switch (this.section) {
      case 'boot': {
        ctx.fillStyle = `rgba(${gr},${gg},${gb},0.06)`;
        const spacing = 40;
        for (let x = spacing; x < w; x += spacing) {
          for (let y = spacing; y < h; y += spacing) {
            ctx.fillRect(x, y, 1.5, 1.5);
          }
        }
        break;
      }
      case 'geometry': {
        ctx.strokeStyle = `rgba(${gr},${gg},${gb},0.07)`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2);
        ctx.moveTo(w / 2, 0); ctx.lineTo(w / 2, h);
        ctx.stroke();
        ctx.fillStyle = `rgba(${gr},${gg},${gb},0.05)`;
        for (let i = -12; i <= 12; i++) {
          const x = w / 2 + i * 36;
          const y = h / 2 + i * 36;
          ctx.fillRect(x - 4, h / 2, 8, 1);
          ctx.fillRect(w / 2, y - 4, 1, 8);
        }
        break;
      }
      case 'oscilloscope': {
        ctx.strokeStyle = `rgba(${gr},${gg},${gb},0.06)`;
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 6]);
        for (let i = 1; i < 5; i++) {
          const y = h * (i / 5);
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
        }
        ctx.setLineDash([]);
        break;
      }
      case 'execution':
      case 'climax': {
        const lineCount = this.section === 'climax' ? 24 : 16;
        ctx.strokeStyle = `rgba(${gr},${gg},${gb},${0.04 + freq.bass * 0.04})`;
        ctx.lineWidth = 1;
        for (let i = 0; i < lineCount; i++) {
          const a = (i / lineCount) * Math.PI * 2;
          ctx.beginPath();
          ctx.moveTo(w / 2, h / 2);
          ctx.lineTo(w / 2 + Math.cos(a) * w, h / 2 + Math.sin(a) * h);
          ctx.stroke();
        }
        break;
      }
      case 'trial': {
        ctx.strokeStyle = `rgba(${gr},${gg},${gb},0.04)`;
        ctx.lineWidth = 1;
        const spacing = 80;
        for (let i = -12; i < 24; i++) {
          ctx.beginPath();
          ctx.moveTo(i * spacing, 0);
          ctx.lineTo(i * spacing + h, h);
          ctx.stroke();
        }
        break;
      }
      case 'memory': {
        ctx.fillStyle = `rgba(${gr},${gg},${gb},0.05)`;
        ctx.font = '9px "JetBrains Mono", monospace';
        const cols = Math.ceil(w / 72);
        const rows = Math.ceil(h / 20);
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const addr = ((r * cols + c) * 16).toString(16).toUpperCase().padStart(4, '0');
            ctx.fillText(addr, c * 72 + 8, r * 20 + 14);
          }
        }
        break;
      }
    }
  }

  private updateAndDrawMotes(ctx: CanvasRenderingContext2D, w: number, h: number, dt: number, pal: Palette, energy: number, freq: AudioFrequencyData) {
    const [gr, gg, gb] = pal.glow;
    const speed = 0.8 + energy * 2.0 + freq.bass * 1.0;

    for (const m of this.motes) {
      m.x += m.vx * speed * dt;
      m.y += m.vy * speed * dt;
      if (m.x < -10) m.x = w + 10;
      if (m.x > w + 10) m.x = -10;
      if (m.y < -10) m.y = h + 10;
      if (m.y > h + 10) m.y = -10;

      const a = m.alpha + freq.energy * 0.08 + this.beatBrightness * 0.3;
      ctx.fillStyle = `rgba(${gr},${gg},${gb},${a})`;
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.size + this.beatBrightness * 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private getInterpolatedPalette(): Palette {
    const t = this.smoothstep(this.lerpProgress);
    return {
      bg: [
        this.lerp(this.currentPalette.bg[0], this.targetPalette.bg[0], t),
        this.lerp(this.currentPalette.bg[1], this.targetPalette.bg[1], t),
        this.lerp(this.currentPalette.bg[2], this.targetPalette.bg[2], t),
      ],
      glow: [
        this.lerp(this.currentPalette.glow[0], this.targetPalette.glow[0], t),
        this.lerp(this.currentPalette.glow[1], this.targetPalette.glow[1], t),
        this.lerp(this.currentPalette.glow[2], this.targetPalette.glow[2], t),
      ],
    };
  }

  private lerp(a: number, b: number, t: number): number { return a + (b - a) * t; }
  private smoothstep(x: number): number { return x * x * (3 - 2 * x); }
}
