/**
 * ThinkChainOverlay.ts
 * Minimal DeepSeek <think> reasoning panel. Top-right corner, collapsible.
 */

export class ThinkChainOverlay {
  private panel: HTMLElement;
  private bodyEl: HTMLElement;
  private textEl: HTMLElement;
  private isCollapsed = false;

  private fullText = '';
  private displayLen = 0;
  private timer: number | null = null;

  constructor() {
    this.panel = document.createElement('div');
    this.panel.className = 'think-panel';
    this.panel.innerHTML = `
      <div class="think-header">
        <span class="think-tag">DEEPSEEK-R1 &lt;think&gt;</span>
        <button class="think-toggle" id="think-toggle">_</button>
      </div>
      <div class="think-body" id="think-body">
        <span class="think-text" id="think-text"></span><span class="think-cursor">▌</span>
      </div>
    `;
    document.body.appendChild(this.panel);

    this.bodyEl = this.panel.querySelector('#think-body')!;
    this.textEl = this.panel.querySelector('#think-text')!;

    this.panel.querySelector('#think-toggle')!.addEventListener('click', () => {
      this.isCollapsed = !this.isCollapsed;
      this.panel.classList.toggle('collapsed', this.isCollapsed);
    });
  }

  public streamText(text: string) {
    if (this.fullText === text) return;
    this.fullText = text;
    this.displayLen = 0;

    if (this.timer !== null) clearInterval(this.timer);

    this.timer = window.setInterval(() => {
      if (this.displayLen < this.fullText.length) {
        this.displayLen = Math.min(this.fullText.length, this.displayLen + 2);
        this.textEl.textContent = this.fullText.slice(0, this.displayLen);
        this.bodyEl.scrollTop = this.bodyEl.scrollHeight;
      } else {
        if (this.timer !== null) {
          clearInterval(this.timer);
          this.timer = null;
        }
      }
    }, 25);
  }
}
