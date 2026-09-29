/**
 * HudController.ts
 * Minimal bottom controls: scrubber, play/pause, time, offset calibrator, file loader.
 */

import { AudioEngine } from '../audio/AudioEngine';
import { TimelineController } from '../timeline/TimelineController';

export class HudController {
  private audioEngine: AudioEngine;
  private timeline: TimelineController;

  private container: HTMLElement;
  private timeEl!: HTMLElement;
  private playBtn!: HTMLButtonElement;
  private scrubBar!: HTMLInputElement;
  private offsetValEl!: HTMLElement;
  private dropOverlay!: HTMLElement;

  constructor(audioEngine: AudioEngine, timeline: TimelineController) {
    this.audioEngine = audioEngine;
    this.timeline = timeline;

    this.container = document.createElement('div');
    this.container.className = 'hud-controls';
    this.container.innerHTML = `
      <input type="range" class="hud-scrubber" id="hud-scrub" min="0" max="212.5" step="0.1" value="0">
      <div class="hud-row">
        <div class="hud-group">
          <button class="hud-btn primary" id="hud-play">▶ PLAY</button>
          <span class="hud-time" id="hud-time">00:00 / 03:32</span>
          <label class="hud-btn hud-file-label">
            📂 LOAD MP3
            <input type="file" id="hud-file" accept="audio/*" style="display:none;">
          </label>
        </div>
        <div class="hud-offset">
          <span class="hud-offset-label">OFFSET</span>
          <button class="offset-btn" id="off-m100">-100</button>
          <button class="offset-btn" id="off-m20">-20</button>
          <span class="hud-offset-val" id="off-val">0ms</span>
          <button class="offset-btn" id="off-p20">+20</button>
          <button class="offset-btn" id="off-p100">+100</button>
          <button class="offset-btn" id="off-reset">0</button>
        </div>
        <div class="hud-group">
          <button class="hud-btn" id="hud-fs">⛶ FULLSCREEN</button>
        </div>
      </div>
    `;
    document.body.appendChild(this.container);

    // Drop overlay
    this.dropOverlay = document.createElement('div');
    this.dropOverlay.className = 'drop-overlay';
    this.dropOverlay.innerHTML = `
      <div class="drop-box">
        <div class="drop-title">Drop your MP3 here</div>
        <div class="drop-desc">world.execute(me); audio file</div>
      </div>
    `;
    document.body.appendChild(this.dropOverlay);

    this.timeEl = this.container.querySelector('#hud-time')!;
    this.playBtn = this.container.querySelector('#hud-play') as HTMLButtonElement;
    this.scrubBar = this.container.querySelector('#hud-scrub') as HTMLInputElement;
    this.offsetValEl = this.container.querySelector('#off-val')!;

    this.bindEvents();
    this.setupDragAndDrop();
    this.updateOffsetDisplay();
  }

  private bindEvents() {
    this.playBtn.addEventListener('click', () => {
      if (this.audioEngine.isPlaying) {
        this.audioEngine.pause();
        this.playBtn.textContent = '▶ PLAY';
      } else {
        this.audioEngine.play();
        this.playBtn.textContent = '⏸ PAUSE';
      }
    });

    this.scrubBar.addEventListener('input', () => {
      const t = parseFloat(this.scrubBar.value);
      this.timeline.seek(t);
    });

    const fileInput = this.container.querySelector('#hud-file') as HTMLInputElement;
    fileInput.addEventListener('change', async () => {
      if (fileInput.files?.[0]) {
        await this.audioEngine.loadFromFile(fileInput.files[0]);
        this.scrubBar.max = String(this.audioEngine.duration);
        this.audioEngine.play();
        this.playBtn.textContent = '⏸ PAUSE';
      }
    });

    // Offset buttons
    const adjust = (delta: number) => {
      this.timeline.setOffset(this.timeline.getOffset() + delta);
      this.updateOffsetDisplay();
    };
    this.container.querySelector('#off-m100')!.addEventListener('click', () => adjust(-100));
    this.container.querySelector('#off-m20')!.addEventListener('click', () => adjust(-20));
    this.container.querySelector('#off-p20')!.addEventListener('click', () => adjust(20));
    this.container.querySelector('#off-p100')!.addEventListener('click', () => adjust(100));
    this.container.querySelector('#off-reset')!.addEventListener('click', () => {
      this.timeline.setOffset(0);
      this.updateOffsetDisplay();
    });

    // Fullscreen
    this.container.querySelector('#hud-fs')!.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
    });
  }

  private setupDragAndDrop() {
    let dragCounter = 0;
    document.addEventListener('dragenter', (e) => {
      e.preventDefault();
      dragCounter++;
      this.dropOverlay.classList.add('active');
    });
    document.addEventListener('dragleave', () => {
      dragCounter--;
      if (dragCounter <= 0) {
        dragCounter = 0;
        this.dropOverlay.classList.remove('active');
      }
    });
    document.addEventListener('dragover', (e) => e.preventDefault());
    document.addEventListener('drop', async (e) => {
      e.preventDefault();
      dragCounter = 0;
      this.dropOverlay.classList.remove('active');
      const file = e.dataTransfer?.files[0];
      if (file && file.type.startsWith('audio')) {
        await this.audioEngine.loadFromFile(file);
        this.scrubBar.max = String(this.audioEngine.duration);
        this.audioEngine.play();
        this.playBtn.textContent = '⏸ PAUSE';
      }
    });
  }

  private updateOffsetDisplay() {
    this.offsetValEl.textContent = `${this.timeline.getOffset()}ms`;
  }

  public updateTime(currentTime: number, duration: number) {
    const fmt = (s: number) => {
      const m = Math.floor(s / 60);
      const sec = Math.floor(s % 60);
      return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    };
    this.timeEl.textContent = `${fmt(currentTime)} / ${fmt(duration)}`;
    this.scrubBar.value = String(currentTime);
    this.scrubBar.max = String(duration);
  }
}
