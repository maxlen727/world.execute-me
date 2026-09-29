/**
 * TimelineController.ts
 * Central synchronization clock connecting the AudioEngine to:
 * - Lyric lines & dual code display
 * - DeepSeek <think> CoT token stream
 * - 3D Scene transitions and special visual events
 * - Real-time user Offset calibration (stored in localStorage)
 */

import { AudioEngine } from '../audio/AudioEngine';
import { LYRICS, LyricLine } from './lyricsData';

export type LyricCallback = (line: LyricLine | null, prevLine: LyricLine | null, nextLine: LyricLine | null) => void;
export type ChapterCallback = (chapter: string) => void;
export type EventCallback = (eventName: string, line: LyricLine) => void;
export type TimeCallback = (adjustedTime: number, rawTime: number, progress: number) => void;

export class TimelineController {
  private audioEngine: AudioEngine;
  private offsetMs = 0; // offset in milliseconds (+ or -)
  private currentLineIndex = -1;
  private currentChapter = "";
  private firedEvents = new Set<string>();

  private lyricListeners: LyricCallback[] = [];
  private chapterListeners: ChapterCallback[] = [];
  private eventListeners: EventCallback[] = [];
  private timeListeners: TimeCallback[] = [];

  private isRunning = false;
  private rafId: number | null = null;

  constructor(audioEngine: AudioEngine) {
    this.audioEngine = audioEngine;

    // Load saved offset from localStorage if available
    const savedOffset = localStorage.getItem("world_execute_offset_ms");
    if (savedOffset !== null) {
      const parsed = parseFloat(savedOffset);
      if (!isNaN(parsed)) {
        this.offsetMs = parsed;
      }
    }
  }

  public setOffset(ms: number) {
    this.offsetMs = ms;
    localStorage.setItem("world_execute_offset_ms", ms.toString());
  }

  public getOffset(): number {
    return this.offsetMs;
  }

  public start() {
    if (!this.isRunning) {
      this.isRunning = true;
      this.tick();
    }
  }

  public stop() {
    this.isRunning = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  public onLyric(cb: LyricCallback) {
    this.lyricListeners.push(cb);
  }

  public onChapter(cb: ChapterCallback) {
    this.chapterListeners.push(cb);
  }

  public onEvent(cb: EventCallback) {
    this.eventListeners.push(cb);
  }

  public onTime(cb: TimeCallback) {
    this.timeListeners.push(cb);
  }

  public seek(seconds: number) {
    this.audioEngine.seek(seconds);
    this.firedEvents.clear();
    this.currentLineIndex = -1;
    this.updateTimeline();
  }

  private tick = () => {
    if (!this.isRunning) return;

    this.updateTimeline();
    this.rafId = requestAnimationFrame(this.tick);
  };

  private updateTimeline() {
    const rawTime = this.audioEngine.getCurrentTime();
    // Offset applied: e.g. +200ms means the audio is 200ms ahead, so adjusted time = rawTime + 0.2
    const adjustedTime = Math.max(0, rawTime + (this.offsetMs / 1000));
    const duration = this.audioEngine.duration || 212.5;
    const progress = Math.min(1.0, adjustedTime / duration);

    // Notify time listeners
    for (const cb of this.timeListeners) {
      cb(adjustedTime, rawTime, progress);
    }

    // Locate matching lyric line
    let activeIndex = -1;
    for (let i = 0; i < LYRICS.length; i++) {
      const line = LYRICS[i];
      if (adjustedTime >= line.start && adjustedTime < line.end) {
        activeIndex = i;
        break;
      }
    }

    // If past the last lyric line or in gaps
    if (activeIndex !== this.currentLineIndex) {
      this.currentLineIndex = activeIndex;
      const current = activeIndex >= 0 ? LYRICS[activeIndex] : null;
      const prev = (activeIndex > 0) ? LYRICS[activeIndex - 1] : null;
      const next = (activeIndex >= 0 && activeIndex + 1 < LYRICS.length) ? LYRICS[activeIndex + 1] : null;

      for (const cb of this.lyricListeners) {
        cb(current, prev, next);
      }

      if (current && current.chapter !== this.currentChapter) {
        this.currentChapter = current.chapter;
        for (const cb of this.chapterListeners) {
          cb(this.currentChapter);
        }
      }

      if (current && current.event) {
        const eventKey = `${current.id}_${current.event}`;
        if (!this.firedEvents.has(eventKey)) {
          this.firedEvents.add(eventKey);
          for (const cb of this.eventListeners) {
            cb(current.event, current);
          }
        }
      }
    }
  }

  public getCurrentLine(): LyricLine | null {
    if (this.currentLineIndex >= 0 && this.currentLineIndex < LYRICS.length) {
      return LYRICS[this.currentLineIndex];
    }
    return null;
  }
}
