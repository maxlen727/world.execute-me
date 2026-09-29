/**
 * LyricDisplay.ts
 * Clean centered lyric typography with word-by-word karaoke sweep.
 *
 * Three lines: previous (fading), current (active with word sweep), next (preview).
 * Plus a small code line below.
 * Section-aware: word highlight color matches the current song section mood.
 */

import { LyricLine } from '../timeline/lyricsData';

const SECTION_GLOW_CSS: Record<string, string> = {
  boot:        'rgba(100, 160, 255, 0.5)',
  geometry:    'rgba(80, 140, 220, 0.5)',
  oscilloscope:'rgba(60, 200, 140, 0.5)',
  execution:   'rgba(240, 80, 100, 0.5)',
  oop:         'rgba(160, 120, 240, 0.5)',
  trial:       'rgba(240, 60, 60, 0.5)',
  memory:      'rgba(60, 200, 220, 0.5)',
  climax:      'rgba(255, 80, 90, 0.6)',
  outro:       'rgba(120, 120, 140, 0.3)',
};

const SECTION_BORDER_CSS: Record<string, string> = {
  boot:        'rgba(100, 160, 255, 0.3)',
  geometry:    'rgba(80, 140, 220, 0.3)',
  oscilloscope:'rgba(60, 200, 140, 0.3)',
  execution:   'rgba(240, 80, 100, 0.3)',
  oop:         'rgba(160, 120, 240, 0.3)',
  trial:       'rgba(240, 60, 60, 0.3)',
  memory:      'rgba(60, 200, 220, 0.3)',
  climax:      'rgba(255, 80, 90, 0.3)',
  outro:       'rgba(120, 120, 140, 0.2)',
};

export class LyricDisplay {
  private container: HTMLElement;
  private prevEl: HTMLElement;
  private currentEl: HTMLElement;
  private nextEl: HTMLElement;
  private codeEl: HTMLElement;

  private currentLine: LyricLine | null = null;
  private words: { el: HTMLElement; text: string }[] = [];
  private lineStart = 0;
  private lineDuration = 1;
  private currentSection = 'boot';

  constructor() {
    this.container = document.createElement('div');
    this.container.className = 'lyric-stage';
    this.container.innerHTML = `
      <div class="lyric-prev"></div>
      <div class="lyric-current"></div>
      <div class="lyric-next"></div>
      <div class="lyric-code"></div>
    `;
    document.body.appendChild(this.container);

    this.prevEl = this.container.querySelector('.lyric-prev')!;
    this.currentEl = this.container.querySelector('.lyric-current')!;
    this.nextEl = this.container.querySelector('.lyric-next')!;
    this.codeEl = this.container.querySelector('.lyric-code')!;
  }

  public setLine(line: LyricLine | null, prev: LyricLine | null, next: LyricLine | null) {
    if (this.currentLine?.id === line?.id) return;
    this.currentLine = line;

    // Previous line
    this.prevEl.textContent = prev ? prev.text : '';
    this.prevEl.style.opacity = prev ? '1' : '0';

    // Next line
    this.nextEl.textContent = next ? next.text : '';
    this.nextEl.style.opacity = next ? '1' : '0';

    // Current line: build word spans
    this.currentEl.innerHTML = '';
    this.words = [];

    if (!line) {
      this.codeEl.textContent = '';
      this.codeEl.style.opacity = '0';
      return;
    }

    // Track section for color theming
    if (line.scene !== this.currentSection) {
      this.currentSection = line.scene;
      this.codeEl.style.borderColor = SECTION_BORDER_CSS[this.currentSection] || SECTION_BORDER_CSS.boot;
    }

    this.lineStart = line.start;
    this.lineDuration = Math.max(0.5, line.end - line.start);

    const rawWords = line.text.split(' ');
    for (const wText of rawWords) {
      const span = document.createElement('span');
      span.className = 'lyric-word waiting';
      span.textContent = wText + ' ';
      this.currentEl.appendChild(span);
      this.words.push({ el: span, text: wText });
    }

    // Code line
    this.codeEl.innerHTML = this.highlightCode(line.code);
    this.codeEl.style.opacity = '1';

    // Entrance animation
    this.currentEl.classList.remove('entering');
    void this.currentEl.offsetWidth;
    this.currentEl.classList.add('entering');
  }

  public updateTime(currentTime: number, bassEnergy: number) {
    if (!this.currentLine || this.words.length === 0) return;

    const elapsed = currentTime - this.lineStart;
    const progress = Math.max(0, Math.min(1, elapsed / this.lineDuration));
    const activeIdx = Math.floor(progress * this.words.length);
    const glowColor = SECTION_GLOW_CSS[this.currentSection] || SECTION_GLOW_CSS.boot;

    for (let i = 0; i < this.words.length; i++) {
      const w = this.words[i];
      if (i < activeIdx) {
        w.el.className = 'lyric-word passed';
        w.el.style.textShadow = '';
      } else if (i === activeIdx) {
        w.el.className = 'lyric-word active';
        w.el.style.textShadow = `0 0 20px ${glowColor}`;
      } else {
        w.el.className = 'lyric-word waiting';
        w.el.style.textShadow = '';
      }
    }

    // Gentle bass-reactive scale on current line (very subtle)
    if (bassEnergy > 0.35) {
      const s = 1 + bassEnergy * 0.015;
      this.currentEl.style.transform = `scale(${s})`;
    } else {
      this.currentEl.style.transform = '';
    }
  }

  private highlightCode(code: string): string {
    return code
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/\b(const|let|var|class|if|return|implements|extends|void|new|while|throw|assert|private|final)\b/g, '<span class="kw">$1</span>')
      .replace(/\b(switchOn|checkEnvironment|enableProtection|allocate|dispatch|initialize|bootstrap|run|giveTo|sitOn|toggle|executeAll|purr|sweep|inspect|examine|execute|play|fire|satisfy|fulfillAll|streamTensors|canExecute|possess|canTouch|jump|warp|merge|set|forEach|load|cast|beginTrial|swim|yield|extract)\b/g, '<span class="fn">$1</span>')
      .replace(/(\/\/.+)/g, '<span class="cmt">$1</span>')
      .replace(/('.*?'|".*?")/g, '<span class="str">$1</span>');
  }
}
