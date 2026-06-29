# HELIOSCAPE — RESEARCH ARCS
## Sub-GDD v1.0
## Companion to research-hub-gdd.md. Does not supersede it — extends it.

*Caveman-compressed. Precise.*

---

## WHAT A RESEARCH ARC IS

A research arc is a **narrative thread** that runs through multiple research nodes and/or discoveries over time, with a payoff that is felt rather than merely unlocked. Arcs give the Research Hub a story dimension — not just a prerequisite graph, but a record of what humanity chose to pursue and what it found.

Arcs are **not** a replacement for the node prerequisite system. They are an organising layer on top of it.

---

## ARC TYPES

### Closed arc
Has a definitive conclusion CE. The player knows roughly where it ends. The final CE delivers a sense of arrival.
Examples: Hunt for Life, Deep Ocean Exploration.

### Open arc
Generates periodic discovery CEs indefinitely. No conclusion. The "reward" is the history book filling with things humanity learned.
Examples: Solar Gravitational Lens, Understanding the Universe (outer ring science).

Some open arcs contain **named findings** — specific CEs that are always generated but at unpredictable points. The deep space object detection is a named finding within the Solar Gravitational Lens arc.

---

## KNOWLEDGE TRANSFER — THE CORE MECHANIC OF ARCS

The most important arc mechanic: **prior work in an analogous environment reduces uncertainty in the next**. This is how real science works and it gives the player's history of decisions a cumulative texture.

### How it works
When a node's prerequisite screen is shown, knowledge transfer links appear as dotted lines from prior nodes. Tooltip: *"Informed by [prior research]. [Specific effect] because of prior work in analogous environment."*

This is visible and legible. The player who did the prior work sees the payoff. The player who skipped it sees what they missed.

### Transfer types
Same as effects taxonomy in core GDD:
- Variance reduction (bio projections more accurate)
- Queue reduction (fewer Mercury components needed)
- Event mitigation (named event response costs reduced)
- Capability gate (certain conclusions only reachable with prior knowledge — see Hunt for Life)

### Known transfer links

| From | To | Effect | Reason |
|---|---|---|---|
| Deep Ocean Exploration | Hunt for Life — Enceladus/Europa | Positive conclusion only reachable | Hydrothermal vent biology = right map for sub-ice ocean life |
| Mars bio phases | Venus bio phases | Variance reduction | First living world data informs second |
| Venus atmosphere modelling | Jupiter aerostat mission | Queue reduction | Extreme atmosphere methodology transfers |
| Titan cryogenic operations | Uranus/Neptune research stations | Time reduction on setup | Same temperature regime, known engineering challenges |
| Earth CO₂ Drawdown | Venus CO₂ Removal (Phase 2) | Queue reduction | Earth drawdown team advises Venus operations |
| Soil Restoration Network | Mars bio interface | Variance reduction | Earth soil science informs pioneer organism modelling |

---

## ARC LIST

---

### HUNT FOR LIFE
**Type:** Closed
**Conclusion:** Either life confirmed, or confirmed absence (Great Silence). Both are valid, equally weighted conclusions. Neither is failure.

**Node membership:**
- Europa Clipper data (pre-game, inherited — organic chemistry confirmed, no biosignatures)
- Hunt for Life Probe Programme [T3, post-V1] — sends targeted probes to outer moon candidates
- Outer Ring Research Stations [T3, post-V1] — up-close study of candidate bodies

**Named candidates in arc order:**
1. Europa — probe data already exists at game start. Suggestive, not conclusive.
2. Enceladus — active geysers, confirmed water plumes. Strong candidate.
3. Titan subsurface ocean — beneath hydrocarbon lakes. Harder to reach.
4. Additional candidates at developer discretion (Ganymede ocean, etc.)

**Knowledge transfer dependency:**
Hadal Exploration Programme (Deep Ocean Exploration arc) must be complete before the arc can reach a positive conclusion at Enceladus or Europa. Without it, probes return inconclusive data. With it, the probe team knows what sub-ice hydrothermal life looks like and finds it.

This is a knowledge gate, not a difficulty gate. Framing: "We found life in Earth's deep ocean first. Without that, we were searching with the wrong map."

**Conclusion CEs:**
- *Life found:* one of the most significant CEs in the game. Tone: not triumph, not fear. Something closer to recognition. "We always suspected we weren't alone. Knowing it is different from suspecting it." Cascades into questions about contact, protection, the Witness vs. Settler axis.
- *Confirmed absence (so far):* "We have looked at the most promising places in our solar system. We found chemistry. We found complexity. We did not find life. The silence is not empty — it is data." Opens Fermi Silence philosophical CE chain if desired.

**CE volume:** 4–6 CEs across the full arc. Significant writing investment. Core to Helioscape's identity.

---

### DEEP OCEAN EXPLORATION
**Type:** Closed
**Conclusion:** Earth fully known. The last unmapped territory charted.

**Node membership:**
- Hadal Exploration Programme [T3, post-V1 — IDENTITY node, Naturalist primary with fork]

**Single-node arc** — the arc is activated by one research node, but the CE chain within it spans multiple discoveries across the 40yr research period and beyond.

**CE chain (within research period):**
1. First submersible reaches hadal zone. CE: the crew's first transmission from 11km depth.
2. Hydrothermal vent ecosystem discovered. CE: life that has never seen the sun.
3. Unexpected geological activity observed — the ocean floor is not static.
4. **Conclusion CE:** fork based on civilisation tag (see Addendum D in research-hub-gdd-addendum.md).

**Knowledge transfer output:**
Feeds Hunt for Life arc — enables positive conclusion at Enceladus/Europa.

**CE volume:** 3–4 CEs. Moderate investment. Worth it for the Hunt for Life dependency payoff.

---

### SOLAR GRAVITATIONAL LENS
**Type:** Open (never concludes)
**Output:** Periodic discovery CEs indefinitely. Named findings at specific story beats.

**Node membership:**
- Solar Gravitational Lens [T3, post-V1, CAPABILITY]

**What it does:** Uses the sun's gravitational field as a telescope at ~550 AU focal point. Resolution sufficient to characterise exoplanet atmospheres. In ongoing operation from completion onward.

**Named findings (always generated, timing variable):**
1. **First light** — lens achieves focus. CE about seeing this clearly for the first time.
2. **Exoplanet characterisation** — first habitable-zone world resolved in detail. Gates Seed Ship targeting. The Witness vs. Settler arc becomes active.
3. **Deep space object detection** — rogue body detected on long-period trajectory. Will pass within gravitational influence in several thousand years. CE tone: calm, factual, the register of routine astronomical observation that contains something extraordinary. "We have time. We have the tools. We built this." Becomes the narrative reason to use the Stellar Engine.

**Open-ended findings (at developer discretion, CE budget permitting):**
- Void structure between galaxies described in human terms for the first time.
- A signal that may or may not be natural. (Handle carefully — tone must not contradict Hunt for Life arc conclusions.)
- The sheer scale of what we can now see, and what that does to a person.

**Design note:** The lens was not built for the deep space threat. It found the threat while looking for seed ship targets. The discovery CE should reflect this — a routine observation report that contains, buried in the data, something unexpected. The narrator notices before the player does.

**CE volume:** 3 named + open-ended. Very low floor, no ceiling. Scales with available time at end of project.

---

### UNDERSTANDING THE UNIVERSE (OUTER RING SCIENCE)
**Type:** Open (never concludes)
**Output:** Discovery CEs from outer ring research stations. History book accumulation.

**Node membership:**
- Outer Ring Research Stations [T3, post-V1] — one per destination
- He-3 Aerostat Mining — Jupiter [T3, post-V1]
- Future outer ring nodes at developer discretion

**What this arc is:**
Humanity doing science on planets no one has visited before, up close, for the first time. Not looking for life (that's Hunt for Life). Not building infrastructure (that's Mercury/relay nodes). Just learning what these places are.

Each outer ring research station is studying something genuinely unique:
- Jupiter: gas giant dynamics, He-3 extraction, the Great Red Spot up close.
- Saturn: ring system mechanics, Titan's surface from orbit.
- Uranus: extreme axial tilt (rotates on its side — unique in the solar system).
- Neptune: supersonic wind systems, the most remote large planet.

**Knowledge transfer outputs:**
- Jupiter atmosphere operations → methodology for gas giant work generally.
- Titan cryogenic conditions → Uranus/Neptune station setup (same temperature regime).
- Outer ring stations collectively → better preparation for what seed ships will encounter around other stars.

**Conclusion:** None. The arc feeds the history book and the Seed Ship Programme's readiness. Some outer ring planets may never get individual CEs — that's fine. Humanity is there. That matters even if we don't write every moment of it.

**CE volume:** Low floor. 1–2 CEs per station if time allows. Zero minimum — the stations can exist without CEs and the knowledge transfer mechanic still works.

---

## UI — HOW ARCS SURFACE IN THE RESEARCH HUB

The Research Hub has two views:

### Node tree view (existing)
Full prerequisite graph. All nodes visible from game start. Locked = greyed with unlock condition shown. Active = progress bar. Complete = checkmark.

Knowledge transfer links shown as **dotted lines** between nodes, distinct from solid prerequisite lines. Tooltip explains the connection in plain language.

### Arc view (new panel or tab)
Lists all research arcs with:
- Arc name and type (closed/open)
- Nodes that belong to this arc (linked to node tree)
- Findings so far (completed CEs listed as entries)
- What the next finding requires (if known)
- Knowledge transfer outputs from this arc (what it feeds into)

The arc view is how the player understands *why* they're doing something, not just *what* it unlocks. A player who just completed Hadal Exploration can open the arc view and see: "This feeds Hunt for Life — Enceladus targeting. Without this data, probes may return inconclusive results."

**Implementation note:** Arc view is a read-only display layer. It does not add mechanics. It surfaces connections that already exist in the node graph in a way that tells a story. Build the node graph first; arc view is a UI pass afterward.

---

## DEEP OCEAN EXPLORATION — ARC CLASSIFICATION NOTE

The Hadal Exploration Programme node is simultaneously:
- An **IDENTITY** research node (Naturalist primary, fork CE on completion)
- The sole node in the **Deep Ocean Exploration arc** (closed arc)
- A **knowledge transfer source** feeding the Hunt for Life arc

This is not a conflict. A node can belong to multiple systems. The node list entry in research-hub-gdd.md covers its category and mechanics. This document covers its arc membership and transfer links. The arc view UI surfaces all of it.

---

## DESIGN NOTES FOR AI CODING TOOLS

- **Arc view is a UI layer, not a data layer.** Arc membership is metadata on nodes (array of arc IDs). The arc view reads that metadata and groups/displays nodes accordingly. No separate arc data store needed.
- **Knowledge transfer links** are also metadata on nodes: `transfersFrom: [nodeId, effect, reason]`. The node tree renders these as dotted lines. The arc view lists them in plain language.
- **Named findings** within open arcs are CE triggers attached to specific conditions (e.g. "lens operational for 50yr" or "first exoplanet characterised"). They are CE entries, not research nodes. They do not occupy research slots.
- **Hunt for Life positive conclusion gate:** implement as a flag `hadal_exploration_complete: boolean` checked at the point where Enceladus/Europa probe results are evaluated. If false, result is forced to `inconclusive` regardless of other conditions. If true, result evaluates normally and can return `life_found`.
- **Arc view CE log:** each CE that fires as part of an arc appends an entry to that arc's finding log. Display in arc view as a scrollable list with year and short title. Full CE text accessible from there.
