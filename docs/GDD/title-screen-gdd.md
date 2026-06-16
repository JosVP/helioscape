# Helioscape — Title Screen GDD

## Overview

The title screen serves as the emotional and narrative entry point into Helioscape. It establishes the player's perspective (humanity on Earth, looking outward), introduces the four key planets of the early game, and reflects the player's progress through a dynamic save-state-driven visual.

---

## Composition

The scene is a fixed, atmospheric wide shot with no active orbiting. It is not an orrery — it is a dramatic establishing view.

- **Foreground:** Earth's surface. The player stands on home. A horizon line grounds the scene and gives it scale.
- **Center-top:** The Sun, large and dominant. The HELIOSCAPE logo and main menu sit in the space between the horizon and the Sun — the logo does not overlap the Sun itself, preserving the Sun's visual authority.
- **Left of the Sun:** Mars, visible in the distance. Size and appearance reflect save state (see below).
- **Right of the Sun:** Venus, slightly larger and brighter than Mars due to its proximity to the Sun. Also save-state-driven.

The composition communicates the game's premise without any text: *this is where you come from — those are where you are going.*

---

## Dynamic Save State

Mars and Venus update their appearance on the title screen to reflect the player's most recent save file.

| Terraforming stage | Visual change |
|---|---|
| Untouched | Default barren appearance (red/orange for Mars, dense cloud cover for Venus) |
| In progress | Partial atmospheric change, early signs of surface transformation |
| Complete | Fully terraformed — greens, blues, atmospheric glow |

This means the title screen is never the same twice for a returning player. It rewards progress visually and creates a moment of reflection each time the game is launched.

Earth's surface in the foreground remains static and consistent — it is the player's anchor, not a terraforming target.

---

## Transition to Game: Start Game Camera Move

When the player selects **Start Game**, a cinematic camera transition plays before gameplay begins.

**Option A — Zoom out and tilt up (preferred)**

The camera slowly pulls back from Earth's surface and tilts upward, gradually revealing the full orrery view from above the ecliptic plane. As the view settles, Mars and Venus smoothly animate into their correct orbital starting positions and begin orbiting the Sun. The game starts.

This option has strong narrative clarity: the player goes from *standing on Earth* to *commanding the solar system*. The shift in perspective mirrors the shift in scale the game asks of the player.

**Option B — Off-screen reposition**

Mars and Venus slide off-screen to their correct orbital positions before orbiting begins. Less cinematic, but simpler to implement and avoids any camera transition complexity.

---

## Technical Notes

- The title screen uses the same real-time pixel art render pipeline as the rest of the game (SubViewport at target low resolution, nearest-neighbour upscale, CIE Lab palette quantisation shader).
- Mars and Venus are rendered as live scene objects — their appearance is driven by palette and shader parameters loaded from the save file, not swapped assets. This keeps the implementation lightweight.
- Planets on the title screen are **not orbiting**. Orbital simulation only begins after the Start Game transition completes.
- The title screen palette may differ slightly from the in-game orrery palette to emphasise the atmospheric, dramatic tone of the opening view.
