/**
 * CharacterStageDirector.ts
 * DeepSeek Whale-Girl in the bottom-left corner.
 * Simplified: just sprite crossfade + emotion switching. No holographic rings.
 */

export type WhaleEmotion =
  | 'idle' | 'thinking' | 'music' | 'thunder' | 'abstract' | 'star'
  | 'heart' | 'smug' | 'shock' | 'melting' | 'failure' | 'cry'
  | 'smile_pain' | 'celebrate' | 'wink';

const EMOTION_MAP: Record<WhaleEmotion, string> = {
  idle:       '/assets/community_whale/dsh-whale-state-idle-cute.webp',
  thinking:   '/assets/community_whale/dsh-whale-state-thinking.webp',
  music:      '/assets/community_whale/dsh-whale-state-meme-music.webp',
  thunder:    '/assets/community_whale/dsh-whale-state-weather-thunder.webp',
  abstract:   '/assets/community_whale/dsh-whale-state-abstract.webp',
  star:       '/assets/community_whale/dsh-whale-state-star.webp',
  heart:      '/assets/community_whale/dsh-whale-state-meme-heart.webp',
  smug:       '/assets/community_whale/dsh-whale-state-meme-smug.webp',
  shock:      '/assets/community_whale/dsh-whale-state-meme-shock.webp',
  melting:    '/assets/community_whale/dsh-whale-state-daily-melt.webp',
  failure:    '/assets/community_whale/dsh-whale-state-failure.webp',
  cry:        '/assets/community_whale/dsh-whale-state-meme-cry.webp',
  smile_pain: '/assets/community_whale/dsh-whale-state-meme-smile-pain.webp',
  celebrate:  '/assets/community_whale/dsh-whale-state-celebrate.webp',
  wink:       '/assets/community_whale/dsh-whale-state-wink.webp',
};

// Map scene + keywords to emotions
const SCENE_EMOTIONS: Record<string, WhaleEmotion> = {
  boot: 'idle',
  geometry: 'abstract',
  oscilloscope: 'thunder',
  execution: 'music',
  oop: 'smug',
  trial: 'shock',
  memory: 'thinking',
  climax: 'cry',
  outro: 'smile_pain',
};

export class CharacterStageDirector {
  private container: HTMLElement;
  private spriteA: HTMLImageElement;
  private spriteB: HTMLImageElement;
  private labelEl: HTMLElement;
  private activeLayer: 'A' | 'B' = 'A';
  private currentEmotion: WhaleEmotion = 'idle';
  private breathPhase = 0;

  constructor() {
    this.container = document.createElement('div');
    this.container.className = 'character-stage';
    this.container.innerHTML = `
      <div class="character-sprite-wrap">
        <img class="character-sprite visible" id="whale-a" alt="" />
        <img class="character-sprite" id="whale-b" alt="" />
      </div>
      <div class="character-label">DEEPSEEK-CHAN</div>
    `;
    document.body.appendChild(this.container);

    this.spriteA = this.container.querySelector('#whale-a') as HTMLImageElement;
    this.spriteB = this.container.querySelector('#whale-b') as HTMLImageElement;
    this.labelEl = this.container.querySelector('.character-label') as HTMLElement;

    this.setEmotion('idle');
  }

  public setEmotion(emotion: WhaleEmotion) {
    if (this.currentEmotion === emotion) return;
    this.currentEmotion = emotion;

    const url = EMOTION_MAP[emotion] || EMOTION_MAP.idle;

    // Crossfade between two sprite layers
    if (this.activeLayer === 'A') {
      this.spriteB.src = url;
      this.spriteB.classList.add('visible');
      this.spriteA.classList.remove('visible');
      this.activeLayer = 'B';
    } else {
      this.spriteA.src = url;
      this.spriteA.classList.add('visible');
      this.spriteB.classList.remove('visible');
      this.activeLayer = 'A';
    }
  }

  /** Called when a new lyric line arrives */
  public updateLyricContext(scene: string, text: string, event?: string) {
    // Event-specific emotions
    if (event === 'whale_burst' || event === 'stack_overflow' || event === 'glitch_tear') {
      this.setEmotion('cry');
      return;
    }
    if (event === 'execute_impact' || event === 'climax_shockwave') {
      this.setEmotion('failure');
      return;
    }
    if (event === 'protection_shield') {
      this.setEmotion('thinking');
      return;
    }
    if (event === 'forbidden_alert') {
      this.setEmotion('shock');
      return;
    }
    if (event === 'cat_ears_purr') {
      this.setEmotion('heart');
      return;
    }
    if (event === 'god_polyhedra') {
      this.setEmotion('star');
      return;
    }
    if (event === 'exit_fade') {
      this.setEmotion('smile_pain');
      return;
    }

    // Text-based hints
    const lower = text.toLowerCase();
    if (lower.includes('love') || lower.includes('secretly') || lower.includes('deeply')) {
      this.setEmotion('heart');
      return;
    }
    if (lower.includes('dizzy') || lower.includes('blind')) {
      this.setEmotion('melting');
      return;
    }
    if (lower.includes('bullet') || lower.includes('star, stump') || lower.includes('lightning')) {
      this.setEmotion('thunder');
      return;
    }
    if (lower.includes('celebrate') || lower.includes('fulfillment')) {
      this.setEmotion('celebrate');
      return;
    }

    // Fallback to scene default
    this.setEmotion(SCENE_EMOTIONS[scene] || 'idle');
  }

  /** Gentle breathing float animation */
  public update(dt: number) {
    this.breathPhase += dt * 1.5;
    const offset = Math.sin(this.breathPhase) * 3;
    const wrap = this.container.querySelector('.character-sprite-wrap') as HTMLElement;
    if (wrap) {
      wrap.style.transform = `translateY(${offset}px)`;
    }
  }

  public triggerBeat(_intensity: number) {
    // Intentionally minimal — just a slight bounce via CSS would be overkill
    // The breathing animation is enough
  }
}
