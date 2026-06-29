# HELIOSCAPE — RESEARCH HUB GDD ADDENDUM
## Paste after DESIGN NOTES section in research-hub-gdd.md

---

## ADDENDUM A: COLLABORATIVE RESEARCH (T3 MEGA-NODES)

Some post-V1 T3 nodes represent civilisation-scale endeavours that no single planet can tackle alone. These are flagged as **COLLABORATIVE** in the node list.

### Rules for collaborative nodes
- Occupy **all available research slots simultaneously** — both Earth slots plus any active colony slots.
- Cannot be split. Cannot run other research in parallel while active.
- Player must consciously commit. UI requires explicit confirmation: "This research will occupy all research capacity until complete. No other nodes can run during this time."
- Completion time reflects the combined effort — faster if more colony slots are online, because more researchers are contributing.
- Framing: not Earth solving a problem and handing it to the colonies. Every inhabited world contributes something irreplaceable.

### Nodes flagged COLLABORATIVE
- **Stellar Engine** — Earth's mass driver infrastructure + Mars geological knowledge + Venus atmospheric chemistry + outer ring station data. All of it feeds into moving a star.
- **Seed Ship Programme** — arguably the most collaborative. Ship design (Earth), long-duration life support (Mars colony experience), extreme environment biology (Venus), propulsion (fusion drives research from all stations).

### Why this matters mechanically
Colony research slots (post-V1 design consideration, flagged in core GDD) are normally optional. For collaborative nodes they become genuinely valuable — more slots means faster completion on the hardest research in the game. This gives late-game players a reason to have invested in colony populations beyond Interplanetary Data Network contributions.

---

## ADDENDUM B: SOLAR GRAVITATIONAL LENS — ARC BEHAVIOUR

The Solar Gravitational Lens is a **post-V1 open arc**. It never concludes. It keeps finding things.

### What it is
A research installation at ~550 AU focal point, enabled by Fusion Drives. Uses the sun's gravitational field as a lens to achieve resolution impossible with conventional telescopes. In real science, this could resolve surface features on exoplanets. In Helioscape, it's the instrument that finally lets humanity see what's out there.

### Arc structure
The lens programme generates **periodic discovery CEs** indefinitely. Each is a standalone moment. No conclusion CE — the arc just keeps accumulating entries in the history book.

Known CE triggers (in rough chronological order):
1. **First light** — the lens achieves focus for the first time. A CE about what it feels like to see this clearly for the first time.
2. **Exoplanet characterisation** — first habitable-zone world resolved in enough detail to assess atmosphere. Gates Seed Ship targeting.
3. **Deep space object detection** — a long-period rogue object detected on a trajectory that will bring it within gravitational influence of the solar system in several thousand years. CE tone: calm, factual, almost wonder. "We have time. We have the tools. We knew this was possible and we built accordingly." This finding is one of many — not a conclusion, not a crisis. It becomes the reason to actually use the Stellar Engine rather than merely build it.
4. **[Open-ended]** — further CEs at developer discretion. Whatever time and energy allows. Could include: unexpected structures in deep space, a signal that may or may not be natural, the void between galaxies described in human terms for the first time.

### Key design note
The lens was not built *for* the deep space threat. It found the threat while looking for seed ship targets. This is how real astronomy works — you look for one thing and find another. The CE should reflect this: a routine observation report from the lens team that contains, buried in the data, something unexpected. The narrator notices before the player does.

---

## ADDENDUM C: MARS LOW GRAVITY — COLONIST HEALTH

Low gravity is a real problem for Mars colonists (0.38g vs Earth 1g). It is handled in Helioscape across three layers, none of which are hidden health stats.

### Layer 1: Centrifuge infrastructure (Mercury build queue item)
- Available once Mars colony is established. No research required.
- "Centrifuge habitat modules" added to dome build options — rotating sleeping quarters that provide near-1g for the hours per day needed to maintain bone density.
- Visible effect: CE frequency of health-related colony stress events reduces once built. Not a hidden stat — CEs explicitly reference the modules when they fire or don't fire.
- Architect flavour: engineering a solution. Naturalist flavour: questioning whether we should be modifying the environment rather than adapting to it.

### Layer 2: Genetic adaptation (CE chain, not a research node)
- Triggers when Mars colony reaches multigenerational age (a population threshold + time threshold — roughly third generation of colonists).
- The colony itself initiates the conversation, not Earth. A CE presents: researchers on Mars propose a voluntary genetic programme to better suit human physiology to 0.38g.
- Player's Naturalist/Architect tag influences the tone of available responses but does not lock the outcome. This is a Suzerain-style moment — you weigh in, you don't control.
- Naturalist response options lean toward "let adaptation happen naturally" or "we shouldn't engineer humans." Architect options lean toward "this is responsible long-term planning."
- No mechanical effect in V1. The CE is the reward. History book records the decision.

### Layer 3: Generational adaptation (CE observation, no mechanic)
- Very late game — century-scale timescales.
- A single CE, not a chain. A Mars scientist notes that the third generation of colonists has measurably different bone density distribution and muscle fibre composition than their grandparents. Wonders aloud what the tenth generation will look like.
- Not presented as a problem or a triumph. Just a fact of deep time. One of the quietest CEs in the game.
- No mechanical effect. Pure tone.

---

## ADDENDUM D: DEEP OCEAN EXPLORATION

**Category:** IDENTITY [T3] — post-V1, Naturalist primary with fork.
**Arc membership:** Deep Ocean Exploration arc (closed arc, see research-arcs-gdd.md).

### The node
**Hadal Exploration Programme**
Time: 40yr
Unlocks: Fusion Drives done (fusion reactor powers active pressure compensation at 10,000m+) + Mercury rare metals available (chromium-hardened hulls)
Effect: Triggers Deep Ocean Exploration arc. CE chain begins. Feeds Hunt for Life arc (see below).
Collaborative: No — single-planet Earth research, though colony scientists contribute data remotely.

### Technology framing
- Fusion-powered submersibles: reactor solves energy problem for pressure compensation, sensor arrays, lighting at extreme depth. Not propulsion primarily — endurance and systems power.
- Mercury-derived materials: same titanium/chromium metallurgy that builds Dyson components, scaled down into hulls rated for 1,000+ atmospheres. The knowledge transfer from Mercury operations is explicit in the CE.
- No separate "hardening" research node required — this is already inside the Hadal Exploration Programme node's 40yr research time.

### Fork CE
On completion, a fork CE fires (like Automated Food Systems):

**Naturalist framing:** "We have lived above this for all of recorded history and never looked. What we found was not a resource. It was a world." CE chain focuses on the ecosystems, the hydrothermal vents, the life that evolved in total darkness under crushing pressure with no reference to the sun.

**Architect framing:** "Earth's systems are now fully mapped. The last unmapped territory has been surveyed. We know our planet completely." CE chain focuses on completion — Earth as a fully understood designed system. The ocean floor data integrates into the Planetary Coordination Network's model of Earth.

Both framings are valid. Same research, same discoveries, different meaning based on civilisation tag. The fork is in CE tone and self-image, not in divergent mechanics.

### Hunt for Life connection
If Hadal Exploration Programme is complete before Hunt for Life probes reach Enceladus or Europa:
- The hydrothermal vent biology data from Earth's deep ocean directly informs probe targeting and sensor calibration.
- Effect: Hunt for Life conclusion at Enceladus/Europa is **only reachable with a positive (life found) outcome if Hadal Exploration is complete.**
- Without it: probes may pass within range of a life-bearing hydrothermal system and not recognise the signatures. The Hunt for Life arc concludes with "no definitive findings" — not failure, not silence, just inconclusiveness.
- With it: the probe team knows exactly what to look for. If life is there, they find it.
- Framing: not a difficulty gate. A knowledge gate. "We found life in Earth's deep ocean first. That told us what life in an ocean looks like when it has never seen the sun. Without that, we were searching with the wrong map."

### Note on Architect angle
The deep ocean mineral deposit angle (polymetallic nodules, rare earth concentrations) is **not included** as a mechanical effect. Mercury already supplies everything needed. Adding a competing Earth-ocean resource source creates unnecessary bookkeeping without meaningful gameplay tension. The Architect meaning is completion and full-system knowledge, not resource extraction.
