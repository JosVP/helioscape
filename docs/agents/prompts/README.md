# Helioscape Build Prompts

This folder contains all build prompts from PROMPTS.md and PROMPTS-pt2.md split into individual files for easy copy-paste into new chat sessions.

## File Naming Convention

Files are named: `XX-Y-description.txt`

- `XX` = Block number (00-17)
- `Y` = Sub-prompt number within that block
- `description` = Brief description of what the prompt builds

## Usage

1. Copy the content of each file (without the filename)
2. Paste directly into your AI coding assistant chat
3. Work through them **in numerical order** (00-1, 00-2, ... 17-final-checklist)

## Build Order

### Block 0 (00-1 to 00-6): Interfaces and models

TypeScript interfaces only — no logic. Fast and cheap (use GPT-5.4).

### Block 1 (01-1 to 01-6): Core services

Settings, data loading, game state, game loop, saves, event bus (use Sonnet 4.6).

### Block 2 (02-1 to 02-2): App configuration

Angular routing and root component (use GPT-5.4).

### Block 3 (03-1 to 03-8): System services

Game logic services: tech tree, research, terraforming, culture events, Dyson, Kardashev, bio phases, Mercury builds (use Sonnet 4.6).

### Block 4 (04-1 to 04-3): Title screen & save/settings UI

Title screen, save slot panel, settings component (use GPT-5.4).

### Block 5 (05-1 to 05-5): Game shell & HUD

In-game layout and HUD components (use Sonnet 4.6).

### Block 6 (06-1): Orrery (Three.js)

The 3D solar system view — most complex component (use Sonnet 4.6).

### Block 7 (07-1 to 07-5): Planet panel

Planet detail panel with tabs: tech tree, research, bio phases (use Sonnet 4.6).

### Block 8 (08-1 to 08-2): Culture events

Event card and notification toast (use GPT-5.4).

### Block 9 (09-1 to 09-3): Mercury panel

Isometric grid canvas, container, building selector (use Sonnet 4.6).

### Block 10 (10-1 to 10-2): Pause menu

Pause menu and confirmation dialog (use GPT-5.4).

### Block 11 (11-1 to 11-3): Shared components

Progress bar, status tag, confirm dialog (use GPT-5.4).

### Block 12 (12-1 to 12-3): Pipes & utils

Year pipe, Kardashev pipe, isometric utils (use GPT-5.4).

### Block 13 (13-1): Vignette (placeholder)

Placeholder vignette component for playtest build (use GPT-5.4).

### Block 14 (14-1 to 14-2): App wiring & verification

Final app config and DataService verification (use Sonnet 4.6).

### Block 15 (15-1): Debug utilities

Debug console for browser development (use GPT-5.4).

### Block 16 (16-0 to 16-3): Steam integration

Steam SDK integration (requires Steamworks account — do last) (use Sonnet 4.6).

### Block 17: Final checklist

Verification steps before first run.

### Block 26 (26-0 to 26-6): Research Hub V2 + Arcs

Replacement post-playtest Research Hub rewrite. Converts old tech-tree/RP-capacity architecture into canonical Research Tracks, slot-based research, persistent new-node state, Research Arcs, deterministic knowledge transfer, arc log, and culture-event overlay/unlock fixes. Run after reviewing the new Research Hub GDD files.

## Important Notes

- Always have `AGENTS.md` and `ARCHITECTURE.md` open as context when working
- Each prompt is self-contained — paste the entire content
- The ``` code fences have been removed — just paste the content directly
- Follow the numbered order strictly — later prompts depend on earlier ones
- Use the model recommendations in each block header for cost optimization

## Total Prompts: 58 core (00–17) + 28 post-playtest (18–25) + 7 Research Hub V2 (26) = 93
