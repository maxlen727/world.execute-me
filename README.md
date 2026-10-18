# world.execute(me); — a treatise in fourteen plates

A 3:32 render of **Mili — world.execute(me);**, built with Remotion (1920×1080, 30 fps).

> This branch is the `remotion-treatise` edition. `main` keeps the older interactive
> Vite + Three.js web MV (DeepSeek-chan); that one is untouched.

The film is staged as **plates from an illustrated treatise on love**: each act is a
different instrument — a technical sheet, an invocation, a geometry plate, an
oscilloscope, a form, a bestiary, a tribunal, an execution, a love equation — but
they share one palette, one type system, one grain.

- **Palette:** ink `#0A0A0B`, bone `#EEE9DF`, graphite, ash, and one signal:
  hazard orange `#FF4D12`. No other hues. Dark-dominant: only two bone paper
  inserts (the execution record and the tribunal form) break the black.
- **Type:** Archivo (the lyric voice), IBM Plex Mono (the machine), Cormorant
  Garamond italic (the sacred register, used once).
- **Motion:** hard cuts on lyric cues, a 4-frame punch on every cut, a hard cascade
  on every keyword (scale slam, orange rule, one-frame flash), and word-by-word
  karaoke pops.

## Preview

```bash
npm install
npm run dev        # Remotion Studio, composition "WorldExecuteMe"
```

## Render

```bash
npx remotion render WorldExecuteMe out/world-execute-me.mp4
```

The rendered film is committed at `out/world-execute-me.mp4` (1080p30, AAC audio).

## Karaoke rules

- The lyric is **word-synced**: the sung word is orange, past words are bone,
  future words are held at ~30%. Each word lights on its estimated start.
- The text is **part of the plate**, not a subtitle bar: it sits on the sheet, in the
  diagram, along the axis, inside the form.
- The diagram draws across the whole setup phrase and lands with the keyword.
- Cuts land on lyric cues, not on a fixed clock. Each plate is a page.

| Time | Plate | Sheet |
| --- | --- | --- |
| 0:00 | I Power on | circuit, PROTECTION, parameters, simulation |
| 0:16 | II Invocation | typed `world.execute(me);`, EXECUTE, cardiac module, execution record |
| 0:29 | III Geometry | points → DIMENSION, circle → CIRCUMFERENCE, sine → TANGENTS, infinity → LIMITATIONS |
| 0:44 | IV Current | AC/DC, dizzy spiral, A.D./B.C. clock, two waves unite |
| 0:59 | V Stimulation | form 7-L, satisfaction gauge, EXECUTION button, simulation box |
| 1:14 | VI Objects | botanical/zoological plates: eggplant, tomato, tabby cat, the eye |
| 1:28 | VII Switch | F/M, AM/PM, S/M toggles, trance |
| 1:43 | VIII Signal | vibration rings, completion, “you have left”, isolation |
| 1:58 | IX Fragments | shatter, disheartened, illegal arguments |
| 2:11 | X Tribunal | Form 7-X, rejected stamp, countdown |
| 2:27 | XI Execution | 12 hard cuts, EIN / DOS / TROIS / NE / FEM / LIU |
| 2:42 | XII Trapped | execute buttons, cage, the plea |
| 2:57 | XIII Lo-o-ove | love algebra, heart curve, caged heart, Cormorant finale |
| 3:25 | XIV EOF | final EXECUTION, colophon, signal out |

## Code map

- `src/WorldExecuteMe.tsx` — master timeline, camera shake, impact flash
- `src/core/Plate.tsx` — ink/bone paper, grain, crop marks, hatch pattern, spark
- `src/core/SceneAudio.tsx` — plate tone, plate number, audio analysis
- `src/core/impacts.ts` — keyword hits for shake / flash
- `src/kit/Karaoke.tsx` — word-synced lyric type
- `src/kit/Beat.tsx` — plate layout: diagram + lyric + figure caption
- `src/kit/Diagrams.tsx` — engraved geometry, bestiary, forms, scopes
- `src/scenes/` — 14 plates, one file per act group

## Notes

- The visual grammar (ink/bone/signal, Swiss captions, engraving, karaoke type as part
  of the image) follows the principles documented in
  [mexicat/pdoom-video](https://github.com/mexicat/pdoom-video) — no code was copied.
- Lyric timings come from the official timed lyric (NetEase track 435278010).
- `public/world-execute-me.mp3` is only used for local preview/rendering by the person
  who owns the file; it is not redistributed under the repo's license.
