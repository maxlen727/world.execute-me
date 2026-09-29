import { AudioFrequencyData } from '../audio/AudioEngine';
import { LyricLine } from '../timeline/lyricsData';

const SECTION_ENERGY: Record<string, number> = {
  boot: 0.4, geometry: 0.5, oscilloscope: 0.65, execution: 0.85, oop: 0.55, trial: 0.9, memory: 0.6, climax: 1.0, outro: 0.2
};

const SECTION_COLOR: Record<string, [number, number, number]> = {
  boot: [100, 160, 255], geometry: [80, 140, 220], oscilloscope: [60, 200, 140], execution: [240, 80, 100], oop: [160, 120, 240], trial: [240, 60, 60], memory: [60, 200, 220], climax: [255, 80, 90], outro: [120, 120, 140]
};

const IMPACT_WORDS: Record<number, string> = {
  3: 'PROTECTION', 6: 'OBJECT CREATION', 8: 'INITIALIZATION', 11: 'SIMULATION', 26: 'EXECUTION', 33: 'world.execute(me);', 39: 'TRIAL', 43: 'FORBIDDEN', 49: 'EXECUTION', 56: 'world.execute(me);', 57: 'world.execute(me);', 58: 'world.execute(me);'
};

const RAPID_WORDS_41 = ['STAR', 'STUMP', 'CARBIDE', 'COCK', 'CARTRIDGE', 'CORE'];
const RAPID_WORDS_42 = ['LIGHTNING', 'FIRE', 'RAIN', 'EARTH', 'WIND', 'SKY'];

interface Ring { radius: number; speed: number; alpha: number; lineWidth: number; }
interface Spark { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; size: number; }

export class MotionStage {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private currentLine: LyricLine | null = null;
  private time: number = 0;
  private section: string = 'boot';
  
  private beatPulse: number = 0;
  private sectionFade: number = 0;
  
  private impactWord: string = '';
  private impactAlpha: number = 0;
  private impactScale: number = 1.0;
  
  private rings: Ring[] = [];
  private sparks: Spark[] = [];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  private resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  public setLine(line: LyricLine | null) {
    if (!line) {
        this.currentLine = null;
        return;
    }
    
    if (line.scene && line.scene !== this.section) {
        this.section = line.scene;
        this.sectionFade = 1.0;
    }
    this.currentLine = line;

    if (IMPACT_WORDS[line.id]) {
        this.impactWord = IMPACT_WORDS[line.id];
        this.impactAlpha = 0.65;
        this.impactScale = 1.08;
    }
    
    if (line.id === 26) {
      for (let i = 0; i < 6; i++) {
        this.rings.push({ radius: i * 30, speed: 250, alpha: 0.2, lineWidth: 3 });
      }
    } else if (line.id === 33) {
      this.sectionFade = 0.5;
      for (let i = 0; i < 8; i++) {
        this.rings.push({ radius: i * 40, speed: 300, alpha: 0.18, lineWidth: 2 });
      }
    } else if (line.id === 49) {
      this.sectionFade = 0.7;
      for (let i = 0; i < 9; i++) {
        this.rings.push({ radius: i * 40, speed: 400, alpha: 0.2, lineWidth: 3 });
      }
    }
  }

  public setSongTime(t: number) {
    this.time = t;
  }

  public triggerBeat(intensity: number) {
    const energy = SECTION_ENERGY[this.section] || 0.5;
    this.beatPulse = Math.max(this.beatPulse, intensity * energy);
    
    if (intensity > 0.35 && energy > 0.4) {
      this.rings.push({
        radius: 0,
        speed: 200 + intensity * 200,
        alpha: 0.45 * energy,
        lineWidth: 1
      });
    }
    
    if (intensity > 0.5) {
      const count = 25 + Math.floor(Math.random() * 10);
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 80 + Math.random() * 170;
        const life = 0.8 + Math.random() * 0.7;
        this.sparks.push({
          x: this.canvas.width / 2,
          y: this.canvas.height / 2,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life,
          maxLife: life,
          size: 1.5 + Math.random() * 2.5
        });
      }
    }
  }

  public render(dt: number, freq: AudioFrequencyData) {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const cx = w / 2;
    const cy = h / 2;
    
    this.ctx.clearRect(0, 0, w, h);
    
    this.beatPulse *= 0.85;
    if (this.impactAlpha > 0) {
      this.impactAlpha *= 0.98;
      this.impactScale += (1.0 - this.impactScale) * 0.1;
    }
    this.sectionFade *= 0.88;
    
    for (let i = this.rings.length - 1; i >= 0; i--) {
      const r = this.rings[i];
      r.radius += r.speed * dt;
      r.alpha *= 0.95;
      if (r.alpha < 0.01 || r.radius > Math.max(w, h)) {
        this.rings.splice(i, 1);
      }
    }
    
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const s = this.sparks[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
      if (s.life <= 0) {
        this.sparks.splice(i, 1);
      }
    }

    const cArray = SECTION_COLOR[this.section] || [255,255,255];
    const colorStr = `${cArray[0]}, ${cArray[1]}, ${cArray[2]}`;
    
    this.ctx.save();
    
    const lineId = this.currentLine ? this.currentLine.id : -1;
    let progress = 0;
    if (this.currentLine) {
       const duration = this.currentLine.end - this.currentLine.start;
       if (duration > 0) {
           progress = (this.time - this.currentLine.start) / duration;
           progress = Math.max(0, Math.min(1, progress));
       }
    }
    const bass = freq.bass;
    const energy = SECTION_ENERGY[this.section] || 0.5;
    
    switch(this.section) {
        case 'boot': this.renderBoot(lineId, progress, w, h, cx, cy, colorStr); break;
        case 'geometry': this.renderGeometry(lineId, progress, w, h, cx, cy, colorStr); break;
        case 'oscilloscope': this.renderOscilloscope(lineId, progress, w, h, cx, cy, colorStr, freq); break;
        case 'execution': this.renderExecution(lineId, progress, w, h, cx, cy, colorStr, bass, energy); break;
        case 'oop': this.renderOOP(lineId, progress, w, h, cx, cy, colorStr); break;
        case 'trial': this.renderTrial(lineId, progress, w, h, cx, cy, colorStr, bass); break;
        case 'memory': this.renderMemory(lineId, progress, w, h, cx, cy, colorStr); break;
        case 'climax': this.renderClimax(lineId, progress, w, h, cx, cy, colorStr, freq, energy); break;
        case 'outro': this.renderOutro(lineId, progress, w, h, cx, cy, colorStr); break;
    }
    
    for (const r of this.rings) {
      this.ctx.strokeStyle = `rgba(${colorStr}, ${r.alpha})`;
      this.ctx.lineWidth = r.lineWidth;
      this.ctx.beginPath();
      this.ctx.arc(cx, cy, r.radius, 0, Math.PI * 2);
      this.ctx.stroke();
    }
    this.ctx.lineWidth = 1;
    
    for (const s of this.sparks) {
      this.ctx.fillStyle = `rgba(${colorStr}, ${(s.life / s.maxLife) * 0.8})`;
      this.ctx.beginPath();
      this.ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      this.ctx.fill();
    }
    
    if (this.beatPulse > 0.01) {
      const grad = this.ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(w, h) * 0.5);
      grad.addColorStop(0, `rgba(${colorStr}, ${this.beatPulse * 0.4})`);
      grad.addColorStop(1, `rgba(${colorStr}, 0)`);
      this.ctx.fillStyle = grad;
      this.ctx.fillRect(0, 0, w, h);
    }
    
    this.renderRapidWords(lineId, progress, w, h, colorStr);
    
    if (this.impactAlpha > 0.01 && this.impactWord) {
      this.ctx.save();
      this.ctx.translate(cx, cy);
      this.ctx.scale(this.impactScale, this.impactScale);
      
      const isLong = this.impactWord.length > 12;
      const fontSize = isLong ? '6vw' : '10vw';
      this.ctx.font = `800 ${fontSize} "Syne", sans-serif`;
      this.ctx.fillStyle = `rgba(${colorStr}, ${this.impactAlpha})`;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(this.impactWord, 0, 0);
      
      this.ctx.restore();
    }
    
    if (this.sectionFade > 0.01) {
      this.ctx.fillStyle = `rgba(255, 255, 255, ${this.sectionFade * 0.2})`;
      this.ctx.fillRect(0, 0, w, h);
    }
    
    this.ctx.restore();
  }

  private renderRapidWords(lineId: number, progress: number, w: number, h: number, colorStr: string) {
    let wordList: string[] | null = null;
    if (lineId === 41) wordList = RAPID_WORDS_41;
    if (lineId === 42) wordList = RAPID_WORDS_42;
    if (!wordList) return;
    
    const index = Math.floor(progress * wordList.length);
    const word = wordList[Math.min(index, wordList.length - 1)];
    
    this.ctx.font = '800 6vw "Syne", sans-serif';
    this.ctx.fillStyle = `rgba(${colorStr}, 0.4)`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(word, w / 2, h * 0.35);
  }

  private renderBoot(lineId: number, progress: number, w: number, h: number, cx: number, cy: number, colorStr: string) {
    this.ctx.strokeStyle = `rgb(${colorStr})`;
    switch(lineId) {
      case 1:
        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = `rgba(${colorStr}, 0.4)`;
        this.ctx.beginPath();
        const pw = w * progress;
        this.ctx.moveTo(cx - pw/2, cy);
        this.ctx.lineTo(cx + pw/2, cy);
        this.ctx.stroke();
        this.ctx.fillStyle = `rgba(${colorStr}, 0.6)`;
        for(let i=0; i<10; i++) {
            const dx = (Math.random() - 0.5) * pw;
            this.ctx.beginPath();
            this.ctx.arc(cx + dx, cy + (Math.random()-0.5)*10, 2, 0, Math.PI*2);
            this.ctx.fill();
        }
        break;
      case 2:
        this.ctx.font = '0.8vw sans-serif';
        this.ctx.fillStyle = `rgba(${colorStr}, 0.15)`;
        this.ctx.textAlign = 'right';
        this.ctx.fillText('REMEMBER', w - 20, 30);
        break;
      case 3:
        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = `rgba(${colorStr}, 0.35)`;
        this.ctx.beginPath();
        for(let i=0; i<6; i++) {
          const a = (i/6)*Math.PI*2;
          const px = cx + Math.cos(a)*80;
          const py = cy + Math.sin(a)*80;
          if (i===0) this.ctx.moveTo(px, py); else this.ctx.lineTo(px, py);
        }
        this.ctx.closePath();
        this.ctx.stroke();
        break;
      case 4:
        this.ctx.fillStyle = `rgba(${colorStr}, 0.25)`;
        for(let i=0; i<8; i++) {
            const x = cx - 140 + i * 40;
            const y = (progress * h) - (i % 3) * 50;
            this.ctx.fillRect(x - 6, y - 6, 12, 12);
        }
        break;
      case 5:
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, progress * Math.min(w,h) * 0.3, 0, Math.PI*2);
        this.ctx.fillStyle = `rgba(${colorStr}, ${(1 - progress) * 0.3})`;
        this.ctx.fill();
        break;
      case 6:
        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = `rgba(${colorStr}, 0.3)`;
        const rw = w * 0.4;
        const rh = h * 0.3;
        const rx = cx - rw/2;
        const ry = cy - rh/2;
        const p = progress * 4;
        this.ctx.beginPath();
        this.ctx.moveTo(rx, ry);
        if (p > 0) this.ctx.lineTo(rx + Math.min(p, 1) * rw, ry);
        if (p > 1) this.ctx.lineTo(rx + rw, ry + Math.min(p-1, 1) * rh);
        if (p > 2) this.ctx.lineTo(rx + rw - Math.min(p-2, 1) * rw, ry + rh);
        if (p > 3) this.ctx.lineTo(rx, ry + rh - Math.min(p-3, 1) * rh);
        this.ctx.stroke();
        break;
      case 7:
        this.ctx.fillStyle = `rgba(${colorStr}, 0.3)`;
        for (let i=0; i<20; i++) {
            const angle = (i/20)*Math.PI*2;
            const dist = (Math.max(w,h)/2) * (1 - progress);
            this.ctx.beginPath();
            this.ctx.arc(cx + Math.cos(angle)*dist, cy + Math.sin(angle)*dist, 3, 0, Math.PI*2);
            this.ctx.fill();
        }
        break;
      case 8:
        this.ctx.fillStyle = `rgba(${colorStr}, 0.1)`;
        this.ctx.fillRect(cx - w*0.2, cy - 2, w*0.4, 4);
        this.ctx.fillStyle = `rgba(${colorStr}, 0.4)`;
        this.ctx.fillRect(cx - w*0.2, cy - 2, w*0.4 * progress, 4);
        break;
      case 9:
      case 10:
        this.ctx.strokeStyle = `rgba(${colorStr}, 0.25)`;
        this.ctx.strokeRect(cx - w*0.25*progress, cy - h*0.2*progress, w*0.5*progress, h*0.4*progress);
        break;
      case 11:
        this.ctx.fillStyle = `rgba(${colorStr}, 0.35)`;
        const cols = 8, rows = 6;
        const total = cols * rows;
        const limit = total * progress;
        for (let i = 0; i < limit; i++) {
            const c = i % cols;
            const r = Math.floor(i / cols);
            const gx = cx - 140 + c * 40;
            const gy = cy - 100 + r * 40;
            this.ctx.beginPath();
            this.ctx.arc(gx, gy, 3, 0, Math.PI*2);
            this.ctx.fill();
        }
        break;
    }
  }

  private renderGeometry(lineId: number, progress: number, w: number, h: number, cx: number, cy: number, colorStr: string) {
    switch(lineId) {
      case 12:
        const circlePhase = this.time * 0.2;
        this.ctx.fillStyle = `rgba(${colorStr}, 0.35)`;
        this.ctx.strokeStyle = `rgba(${colorStr}, 0.15)`;
        const pts: {x:number, y:number}[] = [];
        for(let i=0; i<50; i++) {
            const ang = circlePhase + i * 2.4;
            const rad = 20 + ((i*17)%150);
            pts.push({x: cx + Math.cos(ang)*rad, y: cy + Math.sin(ang)*rad});
            this.ctx.beginPath();
            this.ctx.arc(pts[i].x, pts[i].y, 3, 0, Math.PI*2);
            this.ctx.fill();
        }
        this.ctx.beginPath();
        for(let i=0; i<pts.length; i++){
            for(let j=i+1; j<pts.length; j++){
                const dx = pts[i].x - pts[j].x;
                const dy = pts[i].y - pts[j].y;
                if(dx*dx + dy*dy < 4900) {
                    this.ctx.moveTo(pts[i].x, pts[i].y);
                    this.ctx.lineTo(pts[j].x, pts[j].y);
                }
            }
        }
        this.ctx.stroke();
        break;
      case 13:
        const phase = this.time;
        const maxAng = Math.min(phase * 1.5, Math.PI * 2);
        const radius = Math.min(w,h) * 0.2;
        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = `rgba(${colorStr}, 0.4)`;
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, radius, 0, maxAng);
        this.ctx.stroke();
        
        this.ctx.setLineDash([5,5]);
        this.ctx.beginPath();
        this.ctx.moveTo(cx, cy);
        this.ctx.lineTo(cx + radius, cy);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
        
        if (maxAng > Math.PI) {
            this.ctx.font = '2rem sans-serif';
            this.ctx.fillStyle = `rgba(${colorStr}, 0.35)`;
            this.ctx.textAlign = 'center';
            this.ctx.fillText('C = 2πr', cx, cy + radius + 40);
        }
        break;
      case 14:
        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = `rgba(${colorStr}, 0.4)`;
        this.ctx.fillStyle = `rgba(${colorStr}, 0.4)`;
        this.ctx.beginPath();
        const amp = h * 0.16;
        for (let x = 0; x <= w; x += 10) {
            const y = cy + Math.sin((x/w)*Math.PI*4 + this.time*2) * amp;
            if (x === 0) this.ctx.moveTo(x, y);
            else this.ctx.lineTo(x, y);
        }
        this.ctx.stroke();
        for (let i = 0; i < 4; i++) {
            const p = i * 0.25 + 0.125 - (this.time*2)/(Math.PI*4);
            const nx = p * w;
            const px = ((nx % w) + w) % w;
            const py = cy + Math.sin((px/w)*Math.PI*4 + this.time*2) * amp;
            this.ctx.beginPath();
            this.ctx.arc(px, py, 4, 0, Math.PI*2);
            this.ctx.fill();
            this.ctx.beginPath();
            this.ctx.moveTo(px - 30, py);
            this.ctx.lineTo(px + 30, py);
            this.ctx.stroke();
        }
        break;
      case 15:
        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = `rgba(${colorStr}, 0.4)`;
        this.ctx.beginPath();
        for(let t=0; t<=Math.PI*2; t+=0.1) {
            const scale = 150 / (1 + Math.sin(t)*Math.sin(t));
            const x = cx + scale * Math.cos(t);
            const y = cy + scale * Math.sin(t) * Math.cos(t);
            if(t===0) this.ctx.moveTo(x,y); else this.ctx.lineTo(x,y);
        }
        this.ctx.stroke();
        this.ctx.setLineDash([5,5]);
        this.ctx.beginPath();
        this.ctx.moveTo(cx-150, 0); this.ctx.lineTo(cx-150, h);
        this.ctx.moveTo(cx+150, 0); this.ctx.lineTo(cx+150, h);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
        
        this.ctx.font = '4rem sans-serif';
        this.ctx.fillStyle = `rgba(${colorStr}, 0.3)`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('∞', cx, cy);
        break;
    }
  }

  private renderOscilloscope(lineId: number, progress: number, w: number, h: number, cx: number, cy: number, colorStr: string, freq: AudioFrequencyData) {
    this.ctx.lineWidth = 2;
    this.ctx.strokeStyle = `rgba(${colorStr}, 0.35)`;
    this.ctx.beginPath();
    const len = freq.rawFrequencies.length;
    for(let i=0; i<len; i++) {
        const x = (i/len)*w;
        const y = cy + (freq.rawFrequencies[i] / 255 - 0.5) * h * 0.35;
        if(i===0) this.ctx.moveTo(x,y); else this.ctx.lineTo(x,y);
    }
    this.ctx.stroke();
    
    this.ctx.strokeStyle = `rgba(${colorStr}, 0.12)`;
    this.ctx.beginPath();
    for(let i=0; i<len; i++) {
        const x = (i/len)*w;
        const y = cy - (freq.rawFrequencies[i] / 255 - 0.5) * h * 0.35;
        if(i===0) this.ctx.moveTo(x,y); else this.ctx.lineTo(x,y);
    }
    this.ctx.stroke();
    
    this.ctx.fillStyle = `rgba(${colorStr}, 0.15)`;
    for(let i=0; i<32; i++) {
        const val = freq.rawFrequencies[i];
        this.ctx.fillRect(0, cy - val, 10, val*2);
    }
    
    this.ctx.strokeStyle = `rgba(${colorStr}, 0.2)`;
    this.ctx.beginPath();
    this.ctx.moveTo(0, cy);
    this.ctx.lineTo(w, cy);
    this.ctx.stroke();

    switch(lineId) {
      case 16:
        this.ctx.strokeStyle = `rgba(${colorStr}, 0.3)`;
        this.ctx.fillStyle = `rgba(${colorStr}, 0.3)`;
        this.ctx.strokeRect(cx - 10, cy - 40, 20, 80);
        this.ctx.beginPath();
        const swY = cy + Math.sin(this.time * 8) * 30;
        this.ctx.arc(cx, swY, 8, 0, Math.PI*2);
        this.ctx.fill();
        break;
      case 17:
        this.ctx.strokeStyle = `rgba(${colorStr}, 0.4)`;
        this.ctx.beginPath();
        for(let x=0; x<cx; x+=5) this.ctx.lineTo(x, cy + Math.sin(x*0.05)*30);
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.moveTo(cx, cy); this.ctx.lineTo(w, cy);
        this.ctx.stroke();
        this.ctx.setLineDash([5,5]);
        this.ctx.beginPath();
        this.ctx.moveTo(cx, 0); this.ctx.lineTo(cx, h);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
        this.ctx.font = '1.2rem sans-serif';
        this.ctx.fillStyle = `rgba(${colorStr}, 0.3)`;
        this.ctx.fillText('AC', cx/2, cy + 60);
        this.ctx.fillText('DC', cx + cx/2, cy + 60);
        break;
      case 18:
        this.ctx.fillStyle = `rgba(255, 255, 255, ${Math.sin(progress*Math.PI)*0.25})`;
        this.ctx.fillRect(0, 0, w, h);
        break;
      case 19:
        for(let lay=0; lay<3; lay++) {
            this.ctx.save();
            this.ctx.translate(cx, cy);
            this.ctx.rotate(Math.sin(progress*Math.PI*4 + lay*1.2));
            this.ctx.strokeStyle = `rgba(${colorStr}, 0.2)`;
            this.ctx.beginPath();
            for(let i=0; i<len; i+=4) {
                const x = (i/len)*400 - 200;
                const y = (freq.rawFrequencies[i] - 128);
                if(i===0) this.ctx.moveTo(x,y); else this.ctx.lineTo(x,y);
            }
            this.ctx.stroke();
            this.ctx.restore();
        }
        break;
      case 20:
      case 21:
        this.ctx.strokeStyle = `rgba(${colorStr}, 0.3)`;
        this.ctx.beginPath();
        this.ctx.moveTo(w*0.1, cy); this.ctx.lineTo(w*0.9, cy);
        this.ctx.moveTo(w*0.9 - 10, cy - 10); this.ctx.lineTo(w*0.9, cy); this.ctx.lineTo(w*0.9 - 10, cy + 10);
        for(let x=w*0.1; x<=w*0.9; x+=w*0.1) {
            this.ctx.moveTo(x, cy-10); this.ctx.lineTo(x, cy+10);
        }
        this.ctx.stroke();
        this.ctx.fillStyle = `rgba(${colorStr}, 0.4)`;
        this.ctx.beginPath();
        this.ctx.arc(w*0.1 + (w*0.8)*progress, cy, 6, 0, Math.PI*2);
        this.ctx.fill();
        if (lineId === 21) {
            this.ctx.font = '1.2rem sans-serif';
            this.ctx.fillText('B.C.', w*0.2, cy - 30);
            this.ctx.fillText('A.D.', w*0.8, cy - 30);
        }
        break;
      case 22:
        const gap = (1-progress)*100 + 10;
        this.ctx.strokeStyle = `rgba(${colorStr}, 0.4)`;
        this.ctx.beginPath();
        this.ctx.arc(cx - gap, cy, 50, 0, Math.PI*2);
        this.ctx.arc(cx + gap, cy, 50, 0, Math.PI*2);
        this.ctx.stroke();
        if (gap < 40) {
            this.ctx.fillStyle = `rgba(${colorStr}, 0.2)`;
            this.ctx.beginPath();
            this.ctx.arc(cx, cy, 30, 0, Math.PI*2);
            this.ctx.fill();
        }
        break;
      case 23:
        this.ctx.strokeStyle = `rgba(${colorStr}, 0.4)`;
        this.ctx.lineWidth = 2.5;
        this.ctx.beginPath();
        const p = this.time * 2;
        for (let x=0; x<w; x+=5) {
            const cycle = ((x/w) * 4 - p) % 1;
            const cyc = cycle < 0 ? cycle + 1 : cycle;
            let y = cy;
            if (cyc > 0.4 && cyc < 0.6) {
                if (cyc < 0.45) y -= 20;
                else if (cyc < 0.5) y += 60;
                else if (cyc < 0.55) y -= 40;
            }
            if (x===0) this.ctx.moveTo(x,y); else this.ctx.lineTo(x,y);
        }
        this.ctx.stroke();
        break;
    }
  }

  private renderExecution(lineId: number, progress: number, w: number, h: number, cx: number, cy: number, colorStr: string, bass: number, energy: number) {
    for (let i=1; i<=6; i++) {
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, i * 40 * energy, 0, Math.PI*2);
        this.ctx.strokeStyle = `rgba(${colorStr}, ${0.1 + bass*0.1})`;
        this.ctx.lineWidth = 1.5 + bass*3;
        this.ctx.stroke();
    }
    
    if (this.beatPulse > 0.05) {
        this.ctx.beginPath();
        this.ctx.moveTo(0, cy); this.ctx.lineTo(w, cy);
        this.ctx.strokeStyle = `rgba(${colorStr}, ${this.beatPulse * 0.3})`;
        this.ctx.stroke();
    }

    switch(lineId) {
        case 24:
        case 27:
            const s = lineId === 24 ? 1 : 1.5;
            this.ctx.fillStyle = `rgba(${colorStr}, 0.2)`;
            for(let i=-1; i<=1; i++) {
                this.ctx.beginPath();
                this.ctx.arc(cx + i*40*s, cy, 6*s + Math.sin(this.time*5 + i)*3, 0, Math.PI*2);
                this.ctx.fill();
            }
            break;
        case 25:
            this.ctx.strokeStyle = `rgba(${colorStr}, 0.25)`;
            this.ctx.lineWidth = 2;
            const exp = bass * 10;
            this.ctx.beginPath();
            this.ctx.moveTo(cx, cy - 60 - exp);
            this.ctx.lineTo(cx + 40 + exp, cy - 30);
            this.ctx.lineTo(cx + 40 + exp, cy + 30);
            this.ctx.lineTo(cx, cy + 60 + exp);
            this.ctx.lineTo(cx - 40 - exp, cy + 30);
            this.ctx.lineTo(cx - 40 - exp, cy - 30);
            this.ctx.closePath();
            this.ctx.stroke();
            break;
        case 28:
            this.ctx.strokeStyle = `rgba(${colorStr}, 0.3)`;
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(w*0.2, h*0.2);
            this.ctx.lineTo(w*0.2 + (w*0.6)*progress, h*0.2 + (h*0.6)*progress);
            this.ctx.stroke();
            break;
        case 29:
            this.ctx.font = '3vw sans-serif';
            this.ctx.fillStyle = `rgba(${colorStr}, 0.25)`;
            this.ctx.textAlign = 'center';
            this.ctx.fillText('world.execute(me);', cx, cy);
            this.ctx.beginPath();
            this.ctx.arc(cx, cy, progress * 200, 0, Math.PI*2);
            this.ctx.strokeStyle = `rgba(${colorStr}, ${(1-progress)*0.2})`;
            this.ctx.stroke();
            break;
        case 30:
            const scanY = h * progress;
            this.ctx.fillStyle = `rgba(${colorStr}, 0.2)`;
            this.ctx.fillRect(0, scanY - 20, w, 40);
            this.ctx.strokeStyle = `rgba(${colorStr}, 0.4)`;
            this.ctx.beginPath();
            this.ctx.moveTo(0, scanY); this.ctx.lineTo(w, scanY);
            this.ctx.stroke();
            break;
        case 31:
            this.ctx.setLineDash([10, 10]);
            this.ctx.strokeStyle = `rgba(${colorStr}, 0.18)`;
            this.ctx.lineWidth = 4;
            this.ctx.beginPath();
            this.ctx.moveTo(cx, 0); this.ctx.lineTo(cx, h);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
            break;
        case 32:
            this.ctx.strokeStyle = `rgba(${colorStr}, 0.2)`;
            this.ctx.lineWidth = 3;
            this.ctx.strokeRect(cx - 20, cy, 40, 30);
            this.ctx.beginPath();
            this.ctx.arc(cx, cy, 15, Math.PI, 0);
            this.ctx.stroke();
            this.ctx.fillStyle = `rgba(${colorStr}, 0.2)`;
            this.ctx.beginPath();
            this.ctx.arc(cx, cy + 10, 4, 0, Math.PI*2);
            this.ctx.fill();
            this.ctx.fillRect(cx - 2, cy + 10, 4, 10);
            break;
        case 34:
            this.ctx.save();
            this.ctx.translate(cx, cy);
            this.ctx.scale(2.5, 2.5);
            this.ctx.beginPath();
            this.ctx.moveTo(20, 0);
            this.ctx.bezierCurveTo(40, -20, -10, -40, -30, -10);
            this.ctx.bezierCurveTo(-50, 0, -30, 20, -10, 10);
            this.ctx.bezierCurveTo(0, 30, 30, 20, 20, 0);
            const wFade = Math.sin(progress * Math.PI) * 0.25;
            this.ctx.fillStyle = `rgba(${colorStr}, ${wFade})`;
            this.ctx.fill();
            this.ctx.restore();
            this.ctx.strokeStyle = `rgba(${colorStr}, 0.2)`;
            for(let i=1; i<=4; i++) {
                const ry = cy + 100 + i*20;
                this.ctx.beginPath();
                this.ctx.ellipse(cx, ry, 150 + i*40, 10 + i*5, 0, 0, Math.PI*2);
                this.ctx.stroke();
            }
            break;
    }
  }

  private renderOOP(lineId: number, progress: number, w: number, h: number, cx: number, cy: number, colorStr: string) {
    this.ctx.save();
    this.ctx.translate(cx, cy);
    const scale = 1.3 + Math.sin(this.time * 2) * 0.05;
    this.ctx.scale(scale, scale);
    
    this.ctx.fillStyle = `rgba(${colorStr}, 0.06)`;
    this.ctx.strokeStyle = `rgba(${colorStr}, 0.25)`;
    this.ctx.lineWidth = 2;

    switch(lineId) {
        case 35:
            this.ctx.beginPath();
            this.ctx.ellipse(0, 0, 30, 50, 0, 0, Math.PI*2);
            this.ctx.fill(); this.ctx.stroke();
            this.ctx.beginPath();
            this.ctx.arc(0, -50, 15, 0, Math.PI, true);
            this.ctx.stroke();
            this.ctx.font = '1rem sans-serif';
            this.ctx.fillStyle = `rgba(${colorStr}, 0.4)`;
            this.ctx.textAlign = 'center';
            this.ctx.fillText('nutrients', 0, 80);
            break;
        case 36:
            this.ctx.beginPath();
            this.ctx.arc(0, 0, 40, 0, Math.PI*2);
            this.ctx.fill(); this.ctx.stroke();
            this.ctx.beginPath();
            this.ctx.moveTo(0, -40); this.ctx.lineTo(0, -55);
            this.ctx.moveTo(-10, -40); this.ctx.lineTo(0, -45);
            this.ctx.moveTo(10, -40); this.ctx.lineTo(0, -45);
            this.ctx.stroke();
            this.ctx.font = '1rem sans-serif';
            this.ctx.fillStyle = `rgba(${colorStr}, 0.4)`;
            this.ctx.textAlign = 'center';
            this.ctx.fillText('antioxidants', 0, 70);
            break;
        case 37:
            this.ctx.beginPath();
            this.ctx.arc(0, 0, 45, 0, Math.PI*2);
            this.ctx.moveTo(-45, 0); this.ctx.lineTo(-30, -55); this.ctx.lineTo(-10, -43);
            this.ctx.moveTo(45, 0); this.ctx.lineTo(30, -55); this.ctx.lineTo(10, -43);
            this.ctx.stroke();
            this.ctx.fillStyle = `rgba(${colorStr}, 0.25)`;
            this.ctx.beginPath();
            this.ctx.arc(-15, -5, 4, 0, Math.PI*2);
            this.ctx.arc(15, -5, 4, 0, Math.PI*2);
            this.ctx.fill();
            this.ctx.beginPath();
            this.ctx.moveTo(-25, 5); this.ctx.lineTo(-45, 10);
            this.ctx.moveTo(-25, 15); this.ctx.lineTo(-45, 20);
            this.ctx.moveTo(25, 5); this.ctx.lineTo(45, 10);
            this.ctx.moveTo(25, 15); this.ctx.lineTo(45, 20);
            this.ctx.stroke();
            this.ctx.font = '1rem sans-serif';
            this.ctx.fillStyle = `rgba(${colorStr}, 0.4)`;
            this.ctx.textAlign = 'center';
            this.ctx.fillText('purr ~40Hz', 0, 75);
            break;
        case 38:
            this.ctx.beginPath();
            this.ctx.arc(0, 0, 50, 0, Math.PI*2);
            this.ctx.stroke();
            this.ctx.beginPath();
            this.ctx.arc(0, 0, 20, 0, Math.PI*2);
            this.ctx.fill(); this.ctx.stroke();
            const rot = this.time * 0.5;
            for(let i=0; i<16; i++) {
                const a = rot + (i/16)*Math.PI*2;
                this.ctx.beginPath();
                this.ctx.moveTo(Math.cos(a)*55, Math.sin(a)*55);
                this.ctx.lineTo(Math.cos(a)*75, Math.sin(a)*75);
                this.ctx.stroke();
            }
            this.ctx.font = '1rem sans-serif';
            this.ctx.fillStyle = `rgba(${colorStr}, 0.4)`;
            this.ctx.textAlign = 'center';
            this.ctx.fillText('fulfillment', 0, 100);
            break;
    }
    this.ctx.restore();
  }

  private renderTrial(lineId: number, progress: number, w: number, h: number, cx: number, cy: number, colorStr: string, bass: number) {
    this.ctx.strokeStyle = `rgba(${colorStr}, ${0.15 + bass*0.15})`;
    this.ctx.lineWidth = 2;
    const rp = 1 - (this.beatPulse % 1)*0.2;
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, 65 * rp, 0, Math.PI*2);
    this.ctx.stroke();
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, 25 * rp, 0, Math.PI*2);
    this.ctx.stroke();
    this.ctx.beginPath();
    this.ctx.moveTo(cx - 85*rp, cy); this.ctx.lineTo(cx - 35*rp, cy);
    this.ctx.moveTo(cx + 35*rp, cy); this.ctx.lineTo(cx + 85*rp, cy);
    this.ctx.moveTo(cx, cy - 85*rp); this.ctx.lineTo(cx, cy - 35*rp);
    this.ctx.moveTo(cx, cy + 35*rp); this.ctx.lineTo(cx, cy + 85*rp);
    this.ctx.stroke();

    switch(lineId) {
        case 39:
            const r2 = 65 - progress*40;
            this.ctx.beginPath();
            this.ctx.arc(cx, cy, r2, 0, Math.PI*2);
            this.ctx.stroke();
            break;
        case 40:
            const bx = w*0.2 + (w*0.6)*progress;
            const by = h*0.2 + (h*0.6)*progress;
            this.ctx.strokeStyle = `rgba(${colorStr}, 0.3)`;
            this.ctx.beginPath();
            this.ctx.moveTo(w*0.2, h*0.2); this.ctx.lineTo(bx, by);
            this.ctx.stroke();
            this.ctx.fillStyle = `rgba(${colorStr}, 0.5)`;
            this.ctx.beginPath();
            this.ctx.arc(bx, by, 5, 0, Math.PI*2);
            this.ctx.fill();
            for(let i=1; i<=3; i++) {
                const tx = bx - i*20*0.6;
                const ty = by - i*20*0.6;
                this.ctx.fillStyle = `rgba(${colorStr}, ${0.4 - i*0.1})`;
                this.ctx.beginPath();
                this.ctx.arc(tx, ty, 5-i, 0, Math.PI*2);
                this.ctx.fill();
            }
            break;
        case 43:
            this.ctx.strokeStyle = `rgba(${colorStr}, 0.3)`;
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.moveTo(cx - 60, cy - 60); this.ctx.lineTo(cx + 60, cy + 60);
            this.ctx.moveTo(cx + 60, cy - 60); this.ctx.lineTo(cx - 60, cy + 60);
            this.ctx.stroke();
            break;
        case 44:
            this.ctx.strokeStyle = `rgba(${colorStr}, 0.08)`;
            this.ctx.lineWidth = 1;
            for(let i=0; i<25; i++) {
                this.ctx.beginPath();
                for(let x=0; x<w; x+=20) {
                    const y = h*0.2 + i*20 + Math.sin(x*0.01 + this.time + i)*20;
                    if (x===0) this.ctx.moveTo(x, y); else this.ctx.lineTo(x, y);
                }
                this.ctx.stroke();
            }
            break;
    }
  }

  private renderMemory(lineId: number, progress: number, w: number, h: number, cx: number, cy: number, colorStr: string) {
    const sp = 24;
    const cols = Math.floor(w/sp);
    const rows = Math.floor(h/sp);
    
    switch(lineId) {
        case 45:
            this.ctx.fillStyle = `rgba(${colorStr}, 0.2)`;
            for(let c=0; c<cols; c++) {
                for(let r=0; r<rows; r++) {
                    this.ctx.fillRect(c*sp, r*sp, 2, 2);
                }
            }
            const px = w * progress;
            this.ctx.fillStyle = `rgba(${colorStr}, 0.35)`;
            this.ctx.beginPath();
            this.ctx.moveTo(px, cy);
            this.ctx.lineTo(px - 15, cy - 10);
            this.ctx.lineTo(px - 15, cy + 10);
            this.ctx.fill();
            this.ctx.font = '1rem monospace';
            this.ctx.fillText(`0x${Math.floor(px*1000).toString(16).toUpperCase()}`, px + 10, cy + 5);
            break;
        case 46:
            const sweepX = w * progress;
            this.ctx.fillStyle = `rgba(${colorStr}, 0.2)`;
            for(let c=0; c<cols; c++) {
                if (c*sp > sweepX) {
                    for(let r=0; r<rows; r++) {
                        this.ctx.fillRect(c*sp, r*sp, 2, 2);
                    }
                }
            }
            this.ctx.strokeStyle = `rgba(${colorStr}, 0.25)`;
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(sweepX, 0); this.ctx.lineTo(sweepX, h);
            this.ctx.stroke();
            break;
    }
  }

  private renderClimax(lineId: number, progress: number, w: number, h: number, cx: number, cy: number, colorStr: string, freq: AudioFrequencyData, energy: number) {
    const numRings = 6 + Math.floor(progress * 6);
    for (let i=1; i<=numRings; i++) {
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, i * 40 * energy, 0, Math.PI*2);
        this.ctx.strokeStyle = `rgba(${colorStr}, ${0.1 + freq.bass*0.15})`;
        this.ctx.lineWidth = 2 + freq.bass*4;
        this.ctx.stroke();
    }
    const rays = 12 + Math.floor(progress * 12);
    this.ctx.strokeStyle = `rgba(${colorStr}, 0.1)`;
    for(let i=0; i<rays; i++) {
        const a = (i/rays)*Math.PI*2 + this.time;
        this.ctx.beginPath();
        this.ctx.moveTo(cx + Math.cos(a)*100, cy + Math.sin(a)*100);
        this.ctx.lineTo(cx + Math.cos(a)*w, cy + Math.sin(a)*w);
        this.ctx.stroke();
    }

    switch(lineId) {
        case 47:
            this.ctx.fillStyle = `rgba(${colorStr}, 0.3)`;
            for(let i=-1; i<=1; i++) {
                this.ctx.beginPath();
                this.ctx.arc(cx + i*60, cy, 10 + Math.sin(this.time*8 + i)*4, 0, Math.PI*2);
                this.ctx.fill();
            }
            const grad = this.ctx.createRadialGradient(cx, cy, 0, cx, cy, w*0.3);
            grad.addColorStop(0, `rgba(${colorStr}, 0.2)`);
            grad.addColorStop(1, `rgba(${colorStr}, 0)`);
            this.ctx.fillStyle = grad;
            this.ctx.beginPath();
            this.ctx.arc(cx, cy, w*0.3 * progress, 0, Math.PI*2);
            this.ctx.fill();
            break;
        case 48:
            this.ctx.fillStyle = `rgba(${colorStr}, 0.15)`;
            this.ctx.fillRect(0, h*progress - 20, w, 40);
            this.ctx.fillRect(0, h*(1-progress) - 20, w, 40);
            break;
        case 50:
            const rPulse = Math.sin(this.time*3) * 0.1;
            const rg = this.ctx.createRadialGradient(cx, cy, 0, cx, cy, w*0.4);
            rg.addColorStop(0, `rgba(${colorStr}, ${0.2 + rPulse})`);
            rg.addColorStop(1, `rgba(${colorStr}, 0)`);
            this.ctx.fillStyle = rg;
            this.ctx.fillRect(0, 0, w, h);
            break;
        case 51:
            this.ctx.strokeStyle = `rgba(${colorStr}, 0.25)`;
            this.ctx.lineWidth = 4;
            for(let i=-1; i<=1; i++) {
                this.ctx.beginPath();
                this.ctx.moveTo(w*0.1, h*0.1 + i*100);
                this.ctx.lineTo(w*0.1 + (w*0.8)*progress, h*0.1 + i*100 + (h*0.8)*progress);
                this.ctx.stroke();
            }
            break;
        case 52:
            this.ctx.font = '4vw sans-serif';
            this.ctx.textAlign = 'center';
            for(let i=0; i<3; i++) {
                const sc = 0.8 + i*0.2;
                this.ctx.save();
                this.ctx.translate(cx, cy);
                this.ctx.scale(sc, sc);
                this.ctx.fillStyle = `rgba(${colorStr}, ${0.3 - i*0.1})`;
                this.ctx.fillText('world.execute(me);', 0, 0);
                this.ctx.restore();
            }
            break;
        case 53:
            this.ctx.font = '4vw sans-serif';
            this.ctx.textAlign = 'center';
            for(let i=0; i<5; i++) {
                const sc = 0.6 + i*0.3;
                this.ctx.save();
                this.ctx.translate(cx, cy);
                this.ctx.scale(sc, sc);
                this.ctx.fillStyle = `rgba(${colorStr}, ${0.4 - i*0.08})`;
                this.ctx.fillText('world.execute(me);', 0, 0);
                this.ctx.restore();
            }
            break;
        case 54:
            this.ctx.setLineDash([15, 15]);
            this.ctx.strokeStyle = `rgba(${colorStr}, 0.3)`;
            this.ctx.lineWidth = 6;
            this.ctx.beginPath();
            this.ctx.moveTo(cx, 0); this.ctx.lineTo(cx, h);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
            const eg1 = this.ctx.createLinearGradient(cx, 0, cx+100, 0);
            eg1.addColorStop(0, `rgba(${colorStr}, 0.2)`); eg1.addColorStop(1, `rgba(${colorStr}, 0)`);
            this.ctx.fillStyle = eg1; this.ctx.fillRect(cx, 0, 100, h);
            const eg2 = this.ctx.createLinearGradient(cx, 0, cx-100, 0);
            eg2.addColorStop(0, `rgba(${colorStr}, 0.2)`); eg2.addColorStop(1, `rgba(${colorStr}, 0)`);
            this.ctx.fillStyle = eg2; this.ctx.fillRect(cx-100, 0, 100, h);
            break;
        case 55:
            const lg1 = this.ctx.createLinearGradient(0, 0, 150, 0);
            lg1.addColorStop(0, `rgba(${colorStr}, 0.08)`); lg1.addColorStop(1, `rgba(${colorStr}, 0)`);
            this.ctx.fillStyle = lg1; this.ctx.fillRect(0, 0, 150, h);
            const lg2 = this.ctx.createLinearGradient(w, 0, w-150, 0);
            lg2.addColorStop(0, `rgba(${colorStr}, 0.08)`); lg2.addColorStop(1, `rgba(${colorStr}, 0)`);
            this.ctx.fillStyle = lg2; this.ctx.fillRect(w-150, 0, 150, h);
            break;
        case 56:
            const sg1 = this.ctx.createLinearGradient(0, 0, 250, 0);
            sg1.addColorStop(0, `rgba(${colorStr}, 0.15)`); sg1.addColorStop(1, `rgba(${colorStr}, 0)`);
            this.ctx.fillStyle = sg1; this.ctx.fillRect(0, 0, 250, h);
            const sg2 = this.ctx.createLinearGradient(w, 0, w-250, 0);
            sg2.addColorStop(0, `rgba(${colorStr}, 0.15)`); sg2.addColorStop(1, `rgba(${colorStr}, 0)`);
            this.ctx.fillStyle = sg2; this.ctx.fillRect(w-250, 0, 250, h);
            this.ctx.fillStyle = `rgba(${colorStr}, 0.04)`;
            for(let i=0; i<15; i++) {
                this.ctx.fillRect(0, Math.random()*h, w, 4 + Math.random()*10);
            }
            break;
        case 57:
            this.ctx.fillStyle = `rgba(${colorStr}, 0.05)`;
            for(let i=0; i<25; i++) {
                const yy = Math.random()*h;
                this.ctx.fillRect(Math.random()*20 - 10, yy, w, 6 + Math.random()*15);
            }
            break;
    }
  }

  private renderOutro(lineId: number, progress: number, w: number, h: number, cx: number, cy: number, colorStr: string) {
      if (lineId === 58) {
          const r = 6 * (1 - progress);
          const alpha = 0.4 * (1 - progress);
          this.ctx.fillStyle = `rgba(${colorStr}, ${alpha})`;
          this.ctx.beginPath();
          this.ctx.arc(cx, cy, r, 0, Math.PI*2);
          this.ctx.fill();
          
          const grad = this.ctx.createRadialGradient(cx, cy, 0, cx, cy, 100 * (1-progress));
          grad.addColorStop(0, `rgba(${colorStr}, ${alpha * 0.5})`);
          grad.addColorStop(1, `rgba(${colorStr}, 0)`);
          this.ctx.fillStyle = grad;
          this.ctx.beginPath();
          this.ctx.arc(cx, cy, 100 * (1-progress), 0, Math.PI*2);
          this.ctx.fill();
      }
  }
}
