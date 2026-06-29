# HELIOSCAPE — Game Overview & Pitch

*Full game scope, excluding DLC. Version targeting v1 + post-v1 outer system content.*

---

## What Kind of Game Is This

Helioscape is a **peaceful, single-player, civilisation-scale strategy game** about transforming the solar system over roughly 2,000 to 3,000 in-game years. There is no combat. There are no enemies. There is no game over. The player is not a ruler or a general — they are the silent architect of humanity's multi-planet future, expressed through decisions that ripple out across centuries.

The closest genre label is "slow strategy with narrative weight." Comps: *Terraformers* (management scope), *Suzerain* (text-driven consequence), *Oxygen Not Included* (systemic interdependency). It is not a city builder in the traditional sense. It is not a 4X. It is not a Dyson Sphere Program clone.

The **core emotional arc** is contrast: the game opens with Earth, small and alone in the dark. It ends with the same camera angle — multiple living worlds, a faintly dimmed sun, ships in transit, a beam pointed toward another star. Whatever the player chose not to do is visible in its absence. No score. No grade. Just the view.

The tone sits at the intersection of Kurzgesagt optimism and the quiet weight of deep time — things that take three centuries to accomplish, narrated with calm pride when they finally arrive.

---

## The Gameplay Loop

Helioscape runs on **three interlocking layers**: decisions, waiting, and reading.

**Decisions** are the core action. The player is always choosing: which research tracks to run on Earth and the Moon, which buildings to queue on Mercury, whether to delay Dyson panel production for a terraforming component, when to commit to a biological phase they cannot reverse. Decisions have real consequences — not in the "you failed" sense, but in the "your civilisation is now different from someone else's" sense. The game tracks the Naturalist vs. Architect lean of every major decision. Not as a morality meter, but as an honest record.

**Waiting** is honest and structural. Terraforming phases take decades to centuries of in-game time. That is the point. But the game is designed so there is almost never *only* waiting.

**Reading** is more than a side activity. Culture events — CE in the design documents — are the emotional core of the game. A CE is a short vignette: text, a portrait illustration, a narrator voice that says something like "First Rain on Mars. At 14:23 local time we measured the first rain on mars for centuries. At 2.3 millimetres it's the start of something even greater: our next step into terraforming this once dusty planet." These fire constantly across the game timeline, accumulating into a history book the player can browse at any time. They give the waiting its meaning.

### The Gameplay Spine

The game's structural backbone is the **Kardashev scale** — four major milestones across a 1,000 to 1,500 year arc:

- **Kardashev Type 1** (~Year 80–120): Deuterium fusion online. The solar system is open.
- **First Era Complete** (~Year 400-1200): Two habitable worlds, first self-sustaining colony, Dyson swarm at 50%. This is the v1 narrative climax — the game continues beyond it, but this is the moment.
- **Kardashev Type 2** (~Year 1000,2000): Dyson sphere at 100%. Full stellar civilisation.
- **Type 3 Gesture** (~Year 2,000+): First interstellar seed ship launched.

Within that spine, the moment-to-moment loop looks like this:

**Early game** (Years 0–80): Mercury base builder. Earth tech tree. Moon research tracks. The player is juggling three active panels — Mercury queue management, Earth tech decisions, Moon research tracks — while watching two or three processes run in parallel. Dyson swarm starts at a trickle.

**Mid-game** (Years 80–1000): Mars and Venus terraforming in parallel, each with their own phase arc. The Ecosystem Composer opens — the player designs the biological composition for each world's living layer: which organisms, in what combination, with what boosters. Mercury's mass driver has transformed the resource economy. Culture events are dense. Spillover mechanics connect the planets — discoveries on Mars unlock Earth tech nodes, Venus chemistry research flows back to Earth ocean restoration. Everything is interdependent.

**Late game** (Years 1,000–1,500+): Jupiter and the outer system unlock via fusion drives. He-3 from Jupiter opens a new power tier. The Dyson swarm grows toward completion. Research arcs deepen — the Hunt for Life systematically probes Europa, Enceladus, Titan, and Mars subsurface. Earth's tech tree branches into its endgame nodes. The history book is long. The living worlds are visible in the orrery.

---

## Aesthetic — What the Game Actually Looks Like

This is not a 3D game in the sense of "walk around on Mars." The player never takes a first-person step anywhere. The visual language is **mission control meets illustrated record**.

### The Orrery

The primary navigation layer. The solar system rendered as 3D spheres on a dark background, with a camera that zooms in from the full system view down to individual planets. Planet surfaces are driven by shader parameters — atmospheric thickness, temperature, ocean coverage, city lights — that interpolate in real time as terraforming progresses. The orrery is alive: ships travel as small dots along curved paths, their density increasing from one or two in the early game to dozens by the late game. The Dyson swarm grows visibly around Mercury. This is the widest lens, and it is where the emotional payoff lives — the before and after is readable at a glance.

### Planet Panels

Clicking a planet opens a **panel-driven interface**. Each planet has its own set of panels: terraforming status, resource counters, active processes, queued decisions. The aesthetic is retro-functional — monospaced typography, dark backgrounds, warm amber and orange accents, sharp corners. Mission control, not dashboard SaaS.

Text is primary. Stats are secondary. The UI communicates state through readable language first, numbers second.

**Mercury** is the exception: it has a 2D isometric base builder view. The player can scroll a medium-sized map (100×100 tile grid, isometric diamond orientation), place buildings on a square grid, assign miners to static waypoint paths, and manage a visible production queue. It is the most "game-like" screen in the project — deliberately tactile compared to the panel-driven style of everything else. Think of a small *Red Alert 1* map without unit combat.

### Vignettes and Culture Events

Inspectable planet locations — a city skyline, a coastline, a forest — are rendered as **layered 2D compositions**: 4 to 6 states per location, crossfaded at milestone triggers. Not full redraws. Palette and asset swaps driven by terraforming progress. The vignette of the Martian coast in Bio I looks different from Bio IV — dead ochre regolith to pale green coastal mat. These are seen through a fixed frame, not explored.

Culture event cards are portrait illustration (3:4 aspect) plus text — the same format throughout the game. The narrator writes in first-person plural: "we," not "scientists." Present tense, human not clinical, optimism from presence not from spin. The wrong register is *"Scientists noted first measurable pressure increase."* The right register is *"It's working. 0.008 atmospheres. Not enough to breathe. Not for three hundred more years. But it's there."*

### Sound

Parameter-driven audio per planet per terraforming state. The parameters are atmospheric pressure, wind intensity, precipitation, biology level, human presence. The same base recordings shaped differently per planet's physics. Mercury has no ambient sound — no atmosphere means no medium for sound. The silence is deliberate (or we add very faint hums to compensate for complete silence)

---

## Filling the Gaps — How the Game Keeps the Player Active

This is the central design challenge of any terraforming game, and Helioscape addresses it through layered parallel activity at all times.

### The Dead Zone Problem

A terraforming phase takes decades. The naive design leaves the player staring at a progress bar. Helioscape's answer is structural: **there should almost always be something actionable in a different panel**.

The game maintains at minimum 3–5 active threads at any given moment:

- Mercury queue decisions (always active once Phase 2 is reached)
- Earth tech tree research (gates open throughout the game via spillover mechanics)
- Moon research tracks (20–35 year each, multiple simultaneous)
- Bio phase engineering (Ecosystem Composer design work while the previous phase runs)
- CE history browsing (the history book is permanently accessible, reconstructs vignette states at any past timestamp)
- Multi-location vignette browsing (any inspectable location, any planet)
- Pending decisions in the notification queue

### Spillover Mechanics

This is the key structural solution. Mars and Venus terraforming progress **unlocks new things on Earth**, which in turn improves Mars and Venus outcomes. The planets are not independent sandboxes — they are interdependent chains. When Venus's carbonate sequestration phase completes, it unlocks Earth's CO₂ Drawdown research. When Mars's first ocean stabilises, it unlocks Moon Organism Library Tier 2. The player is constantly being pulled back to panels they thought were settled.

### The Ecosystem Composer

The biological phases (roughly Years 200–500 across both planets, 110 in-game years for Mars, 130 for Venus) introduce a **design-while-waiting pattern**. While Bio I is running, the player designs Bio II's organism composition — choosing from a palette of pioneer bacteria, chemolithotrophs, nitrogen-fixers, aquatic microbes, decomposers, early plants, insects, and more. Stability forecasts are shown before commit. Incompatible pairs flag warnings. The projection panel renders a pixel-art scene of what the biosphere should look like at phase end.

This is the game's most tactile creative system — assembling a living composition the way a terraformer would actually think about it — and it runs concurrent with other active threads.

### Culture Events and the History Book

CEs fire constantly. They are not interruptions — they queue, persist for XX seconds as a toast notification, and accumulate in the history book forever. The player can pause browsing and read at any pace. Every CE is timestamped and linked to the planet's vignette state at that moment — clicking a history entry reconstructs the world for that vignette as it was.

This means the game rewards the reader. A player who reads every CE experiences a different game than one who dismisses them. The content is there for engagement, not obligation.

### Fermi Silence and the Hunt for Life

Two optional but deeply engaging lateral systems. The Fermi Silence decision (at ~30% Dyson swarm, humanity becomes visible in infrared to nearby stars) branches into three civilisation-character choices with CE chains. The Hunt for Life arc is a systematic post-First Era probe program across Europa, Enceladus, Titan, and Mars subsurface — each body has a fixed, non-randomised outcome the player discovers through probe missions with realistic information lag. Players who crash Europa into Venus in their first playthrough will never know whether life was there. A second playthrough where they preserve it is a different emotional experience.

### The Moral Weight of Decisions

One of the least quantifiable but most effective engagement tools: **Helioscape's irreversible choices have real moral texture**. The Europa decision — whether to crash the moon into Venus for water and spin, knowing its biological status is formally unknown — fires in two parts. A warning 10–15 years before impact. Then the impact. The gap between them is where the player lives with the choice. These moments fill time not because there is a mechanic to perform but because the player is genuinely thinking.

---

## Playtime and Replay Value

### Estimated Playtime

Helioscape is honest about what it is: a slow game. Real-seconds per in-game year at base speed is approximately 2 seconds. First Era Complete (the narrative climax) arrives around Year 400–700 — roughly 13–23 minutes of real time at 1×, if nothing else happened. But things are constantly happening. The game is calibrated around player engagement during those years, not passive observation.

Rough estimates for an engaged first playthrough to First Era Complete:

- **Short sessions (casual reading, minimal optimization):** 5–10 hours
- **Medium sessions (most decisions engaged, some history reading):** 2–5 hours
- **Fast sessions (experienced player, speed available from v1.x):** 2–3 hours

Base game speed is fixed at 1× for the first playthrough — this is an authored experience, not a sandbox. Subsequent playthroughs unlock 4× speed, which dramatically shifts the experience toward strategic experimentation.

**Session length** is naturally short. The game is panel-driven and pause-friendly. A 20–40 minute session produces several meaningful decisions and multiple CEs. It does not demand long uninterrupted blocks. This is a feature for the likely audience, not a limitation.

### Replay Value

Replay in Helioscape comes from **divergence**, not procedural generation. The second playthrough is a fundamentally different game from the first:

**Path choices** with lasting consequences:
- Three Mars warming paths (orbital lasers, statite mirrors, polar nuclear detonations) produce different infrastructure that gets repurposed differently in bio phases
- Wild Venus vs. Europa Spin-up Venus produces different terrain, different colony types, different CE chains
- Naturalist vs. Architect branch on Earth's tech tree produces different colony benefits and different endgame

**Irreversibility** creates divergence you cannot see in a single run. Crashing Europa vs. preserving it. Decisions like these are permanently different between playthroughs.

**Hunt for Life** branches: a player who discovers Europa life in one run and then crashes it in a second gets a unique CE acknowledging this. The game has memory of what you've already found — not mechanically, but narratively.

**Naturalist/Architect ratio**: at First Era Complete, the game gives a descriptive summary — "your civilisation leaned Naturalist — 11 of 17 major decisions favoured natural processes." There is no right answer. A player who spent two runs maximising one direction and then wants to split the difference has a third run waiting.

Realistic replay projection: **2–3 meaningful playthroughs** before content exhaustion.

---

## Strengths

**The niche is genuinely unoccupied.** Peaceful + scientifically grounded + civilisation-scale is a combination no current competitor hits simultaneously. *Terraformers* is closest but more conventional in its systems. *Dyson Sphere Program* is combat-adjacent, factory-first. *Surviving Mars* is survival-first. Helioscape's specific register — the tone, the science fidelity, the philosophical weight — has no direct competitor.

**The emotional core is durable.** The contrast between opening Earth and closing solar system is a simple, powerful structure. It works the first time and still works on the second playthrough because the specific choices that led there are different.

**The content density is appropriate for the format.** A solo dev game that offers XX hours on a first playthrough and 2–3 meaningful runs is a good value proposition for the target audience. No false promises of infinite procedural replay are needed.

**The science is the feature.** The geological timescales, the real organisms, the actual atmospheric chemistry of Venus and Mars — this is not window dressing. Players who care about this will care deeply. Youtubers covering it will have something to fact-check and find correct.

**The pacing is honest.** The game does not pretend waiting doesn't exist — it designs around it. The layered parallel activity model is genuine, not a disguise.

---

## Weaknesses and Risks

**The audience ceiling is real.** Slow, text-heavy, no combat, no fail state — this filters out a significant portion of the strategy game market. The ceiling exists. The question is whether the floor (the audience that genuinely wants this) is large enough. Evidence suggests it is — Kurzgesagt's terraforming and Dyson sphere videos pull hundreds of millions of views. The converted audience is substantial; the conversion rate from casual viewer to game buyer is the unknown.

**First-playthrough pacing is the hardest problem.** Year 0–80 (the early game before Mars and Venus unlock) is the highest dropout risk. The player has Earth tech, Moon research, and Mercury base-building, but the full scope of the game is not yet visible. The game needs to communicate its arc early and hook the player's imagination before the most interesting decisions arrive. Devlog and screenshot strategy will matter here.

**The game is hard to show in a trailer.** There is no action. There is no combat. A screenshot of a panel UI is not inherently exciting. Marketing must sell the feeling — the scale, the wonder, the accumulated weight of centuries — without gameplay footage that reads as exciting in a 30-second window. This is solvable but it requires a specific approach: timelapse orrery visuals, CE text as copy, before/after planet comparisons.

**Mercury is a design surface risk.** The isometric base builder is the most complex system to implement and the most divergent from the rest of the game's aesthetic. If it reads as a grafted-on mode rather than an integrated experience, it weakens the game's coherence. It needs to feel like a natural zoom-in on the solar system, not a mode switch into a different game.

**No tension after First Era Complete if Venus and Mars are done.** The late game (Type 2, Type 3 Gesture) is the weakest-designed phase in the current GDD. The outer system content needs to deliver equivalent emotional weight — new discoveries, new moral decisions, new irreversible choices — or the game risks feeling like it already peaked. Hunt for Life and the interstellar arc are designed to carry this, but they need to land.



---

## Target Audience

**Primary:** Strategy game players who have finished *Surviving Mars* or *Stellaris* and want something quieter. Science enthusiasts who watched the Kurzgesagt videos and thought "I want to make the decisions in this." People who play city builders for the satisfaction of watching systems grow rather than the crisis management. Age range approximately 25–45, skewing toward the kind of player who reads patch notes and watches documentary-style YouTube.

**Secondary:** Narrative game players who want more systems than visual novels offer. Idle game enthusiasts who want the growth loops to mean something. People who bounced off Dwarf Fortress because the interface, not the concept, was the barrier.

**Not for:** Players who need feedback loops shorter than 20 minutes. Competitive multiplayer players. Anyone for whom "no combat" is a dealbreaker. Players who want to fail and retry on difficulty settings.

---

## The Closing Image

The game opens with Earth from space. Small. Blue. Alone. The closing image is the same camera position — multiple living worlds with atmospheric signatures, a faintly dimmed sun, ships moving between them, possibly a faint beam toward another star. Whatever the player did not do is visible in its absence. The asymmetry between those two images is the game's entire argument.

It is a quiet game about an enormous thing. That is its pitch and its promise.

---

*Scope: full game, including post-v1 outer system content. Excluding DLC (Solar Gravitational Lens mechanic, interstellar colonisation, biochemical compatibility arc, second star system).*
