/**
 * AudioEngine.ts
 * High-performance Web Audio API engine providing:
 * - Local file drag & drop / picker loading
 * - URL loading (auto-detects /audio.mp3 or /world.execute(me).mp3)
 * - Built-in procedural 140 BPM Chiptune/Cyber preview synthesizer fallback
 * - Real-time FFT frequency extraction (Sub-bass, Vocal Mid, Treble)
 * - Dynamic Beat Detection algorithm with adaptive threshold
 */

export interface AudioFrequencyData {
  bass: number;       // 0.0 - 1.0 (sub-bass / kick)
  mid: number;        // 0.0 - 1.0 (vocals / melody)
  treble: number;     // 0.0 - 1.0 (hi-hat / crisp highs)
  energy: number;     // 0.0 - 1.0 overall loudness
  rawFrequencies: Uint8Array;
}

export type BeatCallback = (intensity: number) => void;

export class AudioEngine {
  private audioContext: AudioContext | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private frequencyBuffer: Uint8Array | null = null;

  // Synthesizer fallback variables
  private isFallbackSynth = false;
  private synthInterval: number | null = null;
  private synthStartTime = 0;
  private synthCurrentTime = 0;

  // Beat detection state
  private beatCutoff = 0;
  private beatDecayRate = 0.98;
  private beatHoldFrames = 0;
  private beatCallbacks: BeatCallback[] = [];

  // Playback state
  public isPlaying = false;
  public duration = 212.5; // ~3m32.5s for world.execute(me);
  public audioLoaded = false;
  public trackTitle = "world.execute(me);";

  constructor() {
    this.audioElement = new Audio();
    this.audioElement.crossOrigin = "anonymous";
    this.audioElement.preload = "auto";

    this.audioElement.addEventListener("timeupdate", () => {
      if (this.audioElement && this.audioElement.duration) {
        this.duration = this.audioElement.duration;
      }
    });

    this.audioElement.addEventListener("ended", () => {
      this.isPlaying = false;
    });

    // Check if public audio file exists
    this.checkDefaultAudio();
  }

  private async checkDefaultAudio() {
    const candidates = [
      "/world.execute(me);.mp3",
      "/world.execute(me).mp3",
      "/world-execute-me.mp3",
      "/audio.mp3"
    ];
    for (const url of candidates) {
      try {
        const res = await fetch(url, { method: "HEAD" });
        if (res.ok) {
          await this.loadFromUrl(url);
          console.log(`[AudioEngine] Auto-loaded audio from: ${url}`);
          return;
        }
      } catch {
        // file not present, continue
      }
    }
  }

  public initContext(): AudioContext {
    if (!this.audioContext) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioContext = new AudioCtx();

      this.analyserNode = this.audioContext.createAnalyser();
      this.analyserNode.fftSize = 512;
      this.analyserNode.smoothingTimeConstant = 0.8;
      this.frequencyBuffer = new Uint8Array(this.analyserNode.frequencyBinCount);

      if (this.audioElement && !this.sourceNode) {
        this.sourceNode = this.audioContext.createMediaElementSource(this.audioElement);
        this.sourceNode.connect(this.analyserNode);
        this.analyserNode.connect(this.audioContext.destination);
      }
    }
    if (this.audioContext.state === "suspended") {
      this.audioContext.resume();
    }
    return this.audioContext;
  }

  public async loadFromFile(file: File): Promise<void> {
    this.initContext();
    this.stopFallbackSynth();

    const url = URL.createObjectURL(file);
    if (this.audioElement) {
      this.audioElement.src = url;
      this.audioElement.load();
      this.trackTitle = file.name;
      this.audioLoaded = true;
      this.isFallbackSynth = false;

      return new Promise((resolve) => {
        const onLoaded = () => {
          if (this.audioElement) {
            this.duration = this.audioElement.duration || 212.5;
          }
          this.audioElement?.removeEventListener("loadedmetadata", onLoaded);
          resolve();
        };
        this.audioElement?.addEventListener("loadedmetadata", onLoaded);
      });
    }
  }

  public async loadFromUrl(url: string): Promise<void> {
    this.initContext();
    this.stopFallbackSynth();

    if (this.audioElement) {
      this.audioElement.src = url;
      this.audioElement.load();
      this.trackTitle = url.split("/").pop() || "world.execute(me);";
      this.audioLoaded = true;
      this.isFallbackSynth = false;

      return new Promise((resolve) => {
        const onLoaded = () => {
          if (this.audioElement) {
            this.duration = this.audioElement.duration || 212.5;
          }
          this.audioElement?.removeEventListener("loadedmetadata", onLoaded);
          resolve();
        };
        this.audioElement?.addEventListener("loadedmetadata", onLoaded);
      });
    }
  }

  public async play(): Promise<void> {
    this.initContext();
    if (this.audioLoaded && this.audioElement) {
      try {
        await this.audioElement.play();
        this.isPlaying = true;
      } catch (err) {
        console.warn("Audio autoplay blocked or failed:", err);
      }
    } else {
      // Fallback Synth Mode: Start synchronized 140 BPM cyber-metronome arpeggio
      this.startFallbackSynth();
      this.isPlaying = true;
    }
  }

  public pause(): void {
    if (this.audioLoaded && this.audioElement) {
      this.audioElement.pause();
    }
    if (this.isFallbackSynth) {
      this.stopFallbackSynth();
    }
    this.isPlaying = false;
  }

  public seek(seconds: number): void {
    const clamped = Math.max(0, Math.min(seconds, this.duration));
    if (this.audioLoaded && this.audioElement) {
      this.audioElement.currentTime = clamped;
    } else if (this.isFallbackSynth) {
      this.synthCurrentTime = clamped;
      this.synthStartTime = performance.now() - (clamped * 1000);
    }
  }

  public getCurrentTime(): number {
    if (this.audioLoaded && this.audioElement) {
      return this.audioElement.currentTime;
    } else if (this.isFallbackSynth) {
      return (performance.now() - this.synthStartTime) / 1000;
    }
    return 0;
  }

  public setVolume(val: number): void {
    if (this.audioElement) {
      this.audioElement.volume = Math.max(0, Math.min(1, val));
    }
  }

  public onBeat(cb: BeatCallback): void {
    this.beatCallbacks.push(cb);
  }

  /**
   * Extracts real-time FFT frequency bands and triggers beat callbacks.
   */
  public getFrequencyData(): AudioFrequencyData {
    if (this.analyserNode && this.frequencyBuffer) {
      this.analyserNode.getByteFrequencyData(this.frequencyBuffer as any);

      let bassSum = 0;
      let midSum = 0;
      let trebleSum = 0;
      let totalSum = 0;

      const binCount = this.frequencyBuffer.length; // 256 bins
      const bassEnd = Math.floor(binCount * 0.12);   // ~0-1200Hz
      const midEnd = Math.floor(binCount * 0.45);    // ~1200-4500Hz

      for (let i = 0; i < binCount; i++) {
        const val = this.frequencyBuffer[i] / 255;
        totalSum += val;
        if (i < bassEnd) {
          bassSum += val;
        } else if (i < midEnd) {
          midSum += val;
        } else {
          trebleSum += val;
        }
      }

      const bass = bassEnd > 0 ? (bassSum / bassEnd) : 0;
      const mid = (midEnd - bassEnd) > 0 ? (midSum / (midEnd - bassEnd)) : 0;
      const treble = (binCount - midEnd) > 0 ? (trebleSum / (binCount - midEnd)) : 0;
      const energy = totalSum / binCount;

      // Real-time beat onset detection
      if (bass > this.beatCutoff && bass > 0.35) {
        if (this.beatHoldFrames <= 0) {
          const intensity = Math.min(1.0, (bass - this.beatCutoff) * 2.5 + 0.3);
          for (const cb of this.beatCallbacks) {
            cb(intensity);
          }
          this.beatCutoff = bass * 1.15;
          this.beatHoldFrames = 12; // hold ~200ms
        }
      } else {
        this.beatCutoff *= this.beatDecayRate;
        this.beatCutoff = Math.max(this.beatCutoff, 0.25);
      }

      if (this.beatHoldFrames > 0) {
        this.beatHoldFrames--;
      }

      return {
        bass,
        mid,
        treble,
        energy,
        rawFrequencies: this.frequencyBuffer
      };
    }

    // Default empty frequencies
    return {
      bass: 0,
      mid: 0,
      treble: 0,
      energy: 0,
      rawFrequencies: new Uint8Array(256)
    };
  }

  /**
   * Fallback 140 BPM Synthesizer: Provides rhythmic cyber arpeggios & kick pulses
   * ensuring that visual and character animations operate seamlessly before an MP3 is loaded.
   */
  private startFallbackSynth() {
    this.isFallbackSynth = true;
    this.synthStartTime = performance.now() - (this.synthCurrentTime * 1000);
    const ctx = this.initContext();

    const bpm = 140;
    const intervalMs = (60 / bpm / 2) * 1000; // 8th notes

    let step = 0;
    const scale = [220, 261.63, 293.66, 329.63, 392.00, 440, 523.25]; // A minor

    this.synthInterval = window.setInterval(() => {
      if (!this.isPlaying || this.audioLoaded) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = step % 4 === 0 ? "sawtooth" : "sine";

      const freq = scale[step % scale.length];
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);

      if (this.analyserNode) {
        osc.connect(gain);
        gain.connect(this.analyserNode);
      }

      osc.start();
      osc.stop(ctx.currentTime + 0.2);

      // Trigger beat callback on quarter beats
      if (step % 2 === 0) {
        for (const cb of this.beatCallbacks) {
          cb(0.65);
        }
      }

      step++;
    }, intervalMs);
  }

  private stopFallbackSynth() {
    if (this.synthInterval) {
      clearInterval(this.synthInterval);
      this.synthInterval = null;
    }
    this.isFallbackSynth = false;
  }
}
