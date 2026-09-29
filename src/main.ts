/**
 * main.ts
 * Application entry point for world.execute(me); MV
 *
 * Clean orchestration: audio → timeline → visuals.
 * No screen shaking, no hyper-glitch, no CRT effects.
 * Visual intensity follows the music naturally.
 */

import './style.css';
import { AudioEngine } from './audio/AudioEngine';
import { TimelineController } from './timeline/TimelineController';
import { BackgroundStage } from './visuals/BackgroundStage';
import { MotionStage } from './visuals/MotionStage';
import { CharacterStageDirector } from './visuals/CharacterStageDirector';
import { LyricDisplay } from './ui/LyricDisplay';
import { ThinkChainOverlay } from './ui/ThinkChainOverlay';
import { HudController } from './ui/HudController';
import { LyricLine } from './timeline/lyricsData';

class App {
  private audioEngine: AudioEngine;
  private timeline: TimelineController;
  private bgStage: BackgroundStage;
  private motionStage: MotionStage;
  private characterStage: CharacterStageDirector;
  private lyricDisplay: LyricDisplay;
  private thinkOverlay: ThinkChainOverlay;
  private hud: HudController;
  private lastTime = 0;

  constructor() {
    // 1. Audio & Timeline
    this.audioEngine = new AudioEngine();
    this.timeline = new TimelineController(this.audioEngine);

    // 2. Background (smooth color transitions)
    const bgCanvas = document.getElementById('bg-canvas') as HTMLCanvasElement;
    this.bgStage = new BackgroundStage(bgCanvas);

    // 3. Motion graphics overlay
    const motionCanvas = document.getElementById('motion-canvas') as HTMLCanvasElement;
    this.motionStage = new MotionStage(motionCanvas);

    // 4. Character (bottom-left whale-girl)
    this.characterStage = new CharacterStageDirector();

    // 5. Lyric display (centered)
    this.lyricDisplay = new LyricDisplay();

    // 6. Think panel + HUD controls
    this.thinkOverlay = new ThinkChainOverlay();
    this.hud = new HudController(this.audioEngine, this.timeline);

    // 7. Wire timeline events
    this.bindTimeline();

    // 8. Beat response — BOLD
    this.audioEngine.onBeat((intensity) => {
      this.motionStage.triggerBeat(intensity);
      this.bgStage.triggerBeat(intensity);
    });

    // 9. Start render loop
    this.lastTime = performance.now();
    this.timeline.start();
    requestAnimationFrame(this.renderLoop);
  }

  private bindTimeline() {
    this.timeline.onLyric((line: LyricLine | null, prev: LyricLine | null, next: LyricLine | null) => {
      this.lyricDisplay.setLine(line, prev, next);
      this.motionStage.setLine(line);

      if (line) {
        this.bgStage.setScene(line.scene);
        if (line.think) this.thinkOverlay.streamText(line.think);
        this.characterStage.updateLyricContext(line.scene, line.text, line.event);

        // Flash on key events
        if (line.event === 'execute_impact' || line.event === 'climax_shockwave') {
          this.bgStage.triggerFlash(0.8);
        } else if (line.event === 'stack_overflow' || line.event === 'forbidden_alert') {
          this.bgStage.triggerFlash(0.5);
        }

        // Flash on impact word lines
        const impactIds = [26, 33, 49, 56, 57];
        if (impactIds.includes(line.id)) {
          this.bgStage.triggerFlash(line.id === 49 ? 0.7 : 0.4);
        }
      }
    });

    this.timeline.onTime((adjustedTime: number) => {
      this.hud.updateTime(adjustedTime, this.audioEngine.duration || 212.5);
    });
  }

  private renderLoop = (now: number) => {
    const dt = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    const freq = this.audioEngine.getFrequencyData();
    const rawTime = this.audioEngine.getCurrentTime();
    const adjustedTime = Math.max(0, rawTime + this.timeline.getOffset() / 1000);

    // Render layers
    this.bgStage.render(dt, freq);
    this.motionStage.setSongTime(adjustedTime);
    this.motionStage.render(dt, freq);
    this.characterStage.update(dt);
    this.lyricDisplay.updateTime(adjustedTime, freq.bass);

    requestAnimationFrame(this.renderLoop);
  };
}

window.addEventListener('DOMContentLoaded', () => {
  new App();
});
