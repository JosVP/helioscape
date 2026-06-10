---
name: create-placeholder-audio
description: Generate a short, basic placeholder sound (synthesised WAV) for any Helioscape SFX so a feature is never blocked on audio
---

## Role & Goal

When a Helioscape prompt needs a sound effect (UI click, notification, milestone sting, ambient bed)
and the real audio doesn't exist, generate a **short, basic placeholder** — a brief synthesised tone
of the right category and length — at the **exact path** the code references, so the user can swap it
for a real sound later. **Never block a feature on audio.**

## Golden rules

1. **Short and obviously placeholder.** A simple beep/blip/sweep, not a designed sound. Keep it brief
   (see table) and low-ish volume.
2. **Correct category & length.** A click is ~80 ms; a milestone sting is ~1.2 s. Match intent so the
   timing in code feels right.
3. **Right path & format.** Save where the code/`AudioService` looks for it. **WAV** is the safe
   default (uncompressed, trivial to generate, no dependencies). Only make MP3/OGG if the code
   specifically requires it (then convert — see below).
4. **No dependencies.** Generate the WAV with a tiny Node script (the project already uses Node/npm).
   Don't add audio libraries.
5. **Leave a trail.** Name it clearly and mention in your summary that it's a placeholder tone.

## Where audio lives

Audio isn't created in early blocks, so confirm the path from the consuming code first. Default to:

```
src/assets/audio/         # e.g. ui/click.wav, events/notification.wav, milestones/type1.wav
```

If `AudioService`, `SettingsService`, or a JSON field names a path/key, **match it exactly**.

## Suggested categories

| Category                     | Length     | Character                               | Example file              |
| ---------------------------- | ---------- | --------------------------------------- | ------------------------- |
| UI click / tick              | 60–100 ms  | short blip, ~660 Hz square, quick decay | `ui/click.wav`            |
| Toggle / confirm             | 120–200 ms | two quick tones (up = confirm)          | `ui/confirm.wav`          |
| Notification (culture event) | 250–500 ms | gentle sine chime ~880 Hz               | `events/notification.wav` |
| Milestone / Kardashev sting  | 1.0–1.5 s  | rising sine sweep, soft fade            | `milestones/sting.wav`    |
| Ambient loop bed             | 2–4 s      | very low sine, loopable, quiet          | `ambient/space.wav`       |

## Procedure

1. Identify the **category**, the **exact path**, and the **length** from the prompt/code.
2. Create `tools/make-placeholder-wav.mjs` (if it doesn't already exist) with the generator below.
3. Run it for the asset(s) you need, writing to the correct path.
4. Confirm the code/JSON references that path; create the folder if needed.
5. Note in your summary that it's a placeholder tone to be replaced.

## Generator script (no dependencies)

`tools/make-placeholder-wav.mjs`:

```js
// Generates a tiny placeholder WAV. Usage:
//   node tools/make-placeholder-wav.mjs <outPath> [ms] [freq] [wave] [sweepTo]
//   wave = sine | square ; sweepTo = optional end frequency for a sweep
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const [out, msArg, freqArg, wave = 'sine', sweepArg] = process.argv.slice(2);
if (!out) {
  console.error('Usage: node make-placeholder-wav.mjs <out> [ms] [freq] [sine|square] [sweepTo]');
  process.exit(1);
}

const ms = Number(msArg ?? 200);
const f0 = Number(freqArg ?? 660);
const f1 = sweepArg ? Number(sweepArg) : f0;
const rate = 44100;
const n = Math.floor((rate * ms) / 1000);
const data = Buffer.alloc(n * 2); // 16-bit mono

for (let i = 0; i < n; i++) {
  const t = i / rate;
  const p = i / n;
  const freq = f0 + (f1 - f0) * p; // linear sweep (or constant)
  const phase = 2 * Math.PI * freq * t;
  const raw = wave === 'square' ? (Math.sin(phase) >= 0 ? 1 : -1) : Math.sin(phase);
  const env = Math.min(1, p * 20) * Math.min(1, (1 - p) * 8); // quick attack, smooth release
  const sample = Math.max(-1, Math.min(1, raw * env * 0.35)); // 0.35 = headroom
  data.writeInt16LE((sample * 32767) | 0, i * 2);
}

// Minimal 44-byte WAV header + PCM data
const header = Buffer.alloc(44);
header.write('RIFF', 0);
header.writeUInt32LE(36 + data.length, 4);
header.write('WAVE', 8);
header.write('fmt ', 12);
header.writeUInt32LE(16, 16);
header.writeUInt16LE(1, 20);
header.writeUInt16LE(1, 22);
header.writeUInt32LE(rate, 24);
header.writeUInt32LE(rate * 2, 28);
header.writeUInt16LE(2, 32);
header.writeUInt16LE(16, 34);
header.write('data', 36);
header.writeUInt32LE(data.length, 40);

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, Buffer.concat([header, data]));
console.log(`Wrote placeholder WAV: ${out} (${ms}ms, ${f0}->${f1}Hz, ${wave})`);
```

## Example commands

```bash
# UI click — short square blip
node tools/make-placeholder-wav.mjs src/assets/audio/ui/click.wav 80 660 square

# Culture-event notification — gentle chime
node tools/make-placeholder-wav.mjs src/assets/audio/events/notification.wav 400 880 sine

# Kardashev milestone — rising sweep
node tools/make-placeholder-wav.mjs src/assets/audio/milestones/sting.wav 1200 440 sine 880
```

## If the code truly needs MP3/OGG

Generate the WAV first, then convert with ffmpeg if it's available; otherwise keep the WAV and note
that conversion is pending:

```bash
ffmpeg -y -i src/assets/audio/ui/click.wav src/assets/audio/ui/click.mp3
```

## Boundaries

- Don't design real sound — a basic tone is the whole point.
- Don't add npm audio dependencies.
- Always place the file where the code expects it and flag it as a placeholder.
