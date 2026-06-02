# Helioscape — Game Design Document
**Version 0.3 — April 2026**
**Solo developer project. Living reference, not a final specification.**

---

## 1. Concept & Vision

### What Is This Game?

*Helioscape* is a peaceful, optimistic civilisation-scale strategy game about humanity's expansion from a single inhabited world into a multi-planet, eventually interstellar species. The player is not a president or a general — they are something closer to a quiet architect of humanity's long future. Decisions are made, consequences cascade, centuries pass.

There is no military. No conflict. No alien contact. No enemies.

The game is about **what we could build if we survived long enough to try**.

### Name

*Helioscape* — helio (sun) + scape (to shape, as in landscape). You are shaping the solar landscape. Distinct from existing Steam titles. Neutral between natural and artificial terraforming paths.

### Inspiration

Primary: Kurzgesagt YouTube channel — terraforming Venus and Mars, Dyson spheres, stellar engines, black hole energy. These videos make civilisation-scale ideas feel warm and accessible. The game lets players live those ideas.

Emotional register: **cosmic wonder + quiet optimism + the weight of deep time.**

### The Core Fantasy

The game opens with Earth alone — the pale blue dot. It ends with the player looking at a transformed solar system: multiple living worlds, a faintly dimmed star wrapped in energy collectors, the trail of a laser sail ship pointing toward another star. The contrast between those two images, 2,000–3,000 game-years apart, is the entire game summarised.

### What It Is Not

- Not a military strategy game
- Not a city builder in the traditional sense
- Not a survival game
- Not a Dyson Sphere Program clone (different core loop, no conflict, science-grounded narrative)
- Not a direct Kurzgesagt visual copy

### Closest Comparison Games

*Terraformers* (Mars colony builder, turn-based card game — different core loop, our game is more civilisation-scale and narrative), *Oxygen Not Included* (systems depth), *I Was a Teenage Exocolonist* (narrative + strategy), *Suzerain* (decision-weight, no action). These games prove the genre has a paying audience.

### Steam Genre Positioning

Crafty Buildy Simulation Strategy, narrative sub-genre. Primary tags: Strategy, Simulation, Space, Management, Sci-fi, Atmospheric, Relaxing, Story Rich.

---

## 2. Platform & Technology

| Item | Decision |
|---|---|
| Engine | Godot 4 |
| Language | GDScript |
| Target platforms | Steam PC (primary); mobile-compatible design |
| Mobile export | Android APK/AAB; iOS requires Mac + Apple Developer account |
| V1 scope | PC Steam release; mobile V2 |

Godot's node/signal system maps well to a frontend developer's mental model.

---

## 3. Narrator Voice & Tone

**This is the single most important writing principle and should be established before any culture events are written.**

The narrator has no name and no singular identity — it is the accumulated record of a civilisation. But the *voice* is human, present, and optimistic. Written from inside the experience, not observing it from outside.

**Principles:**
- Present tense when possible — this is happening, not happened
- First person plural ("we") for civilisation-scale events
- Exclamation is earned when the moment earns it
- Uncertainty is honest when it exists
- Optimism comes from being present in the moment, not from forcing a positive spin
- Never clinical or journalistic — this is a person talking, not a report being filed

**Wrong tone:** *"Scientists noted the first measurable pressure increase above baseline."*

**Right tone:** *"It's working. The atmospheric monitors just recorded the first measurable pressure increase. 0.008 atmospheres — less than 1% of Earth's. Not enough to breathe. Not for three hundred more years. But it's there. It wasn't there yesterday."*

**Examples of the right register:**

*Life found on Enceladus:* "Life! We found it! It's small — chemotrophic, utterly alien in its biochemistry — but it's alive, and it isn't from us. For the first time in history we know with certainty that we are not alone in this universe. We never were. We just didn't know where to look. Everything changes now. The search doesn't end here. It begins here."

*Ancient traces on Mars:* "Traces of life! The drill reached 4km depth today, and what it brought back was extraordinary: fossil chemistry — not alive anymore, but once it was. Three billion years ago, something lived here. We built our oceans on top of Mars's first inhabitants. We're not the first life on this planet. We're the second. We're its continuation. Our search for active life continues."

---

## 4. Power Hierarchy

Four sources, complementary not competing. Each serves a distinct role.

| Source | Role | Limitation |
|---|---|---|
| Mercury solar collectors | Local Mercury operations only | Surface-bound |
| Dyson swarm | Civilisation-wide energy grid — ambient, infinite scaling, zero fuel cost | Requires construction + maintenance |
| Deuterium fusion | High-intensity local applications | Less efficient; deuterium supply chain |
| Helium-3 fusion | Premium applications + transport drives — clean, no radioactive byproduct | He-3 supply chain required |

**Core principle:** Fusion powers specific intense applications. The Dyson swarm powers everything, always. A thousand fusion reactors = still Type 1. Only a completed Dyson sphere achieves Type 2.

**The bootstrap dependency:** Fusion ignition requires 15% Dyson swarm output minimum. You cannot skip the swarm to get fusion. The swarm remains foundational throughout the game.

**Reactor construction:** Mercury polar crater reactor = proof-of-concept. Earth, Mars, and Venus each build their own reactors from local materials — reactors are never transported whole between planets. Mercury's permanently shadowed polar craters provide ideal cold conditions for superconducting magnetic confinement.

**Deuterium → He-3 upgrade:** ~70% of existing reactor reused, 30% replaced. Full dismantlement not required. Both fuel types can run during transition.

**Fission as backstory:** Earth at game start (~Kardashev 0.73) already runs fission and renewables. Not a researchable tech. One early culture event acknowledges it: *"The last coal plant closed fourteen years ago. Earth runs on fission, renewables, and optimism. It isn't enough."*

**Dyson swarm and Earth's sunlight:** The swarm does NOT dim Earth's light. Earth receives ~0.000000045% of the Sun's total output — panels are distributed to deliberately avoid this tiny slice. The dimming visible from Mercury's surface is a local directional effect (panels passing between Mercury and the Sun), not global. Earth is protected by design. One culture event: *"The Interplanetary Energy Authority confirmed today that Dyson swarm distribution has been optimised to preserve Earth's full solar input. 'We are harvesting the Sun,' their statement read, 'not stealing it.'"*

**Star-lifting:** The technology to extract hydrogen, nitrogen, and trace elements directly from the Sun's corona using Dyson swarm magnetic field lines is real proposed science and would represent "elemental creation" rather than resource management — a genuine god-mode toggle that breaks all scarcity constraints. This is deliberately not in V1 or the base game. It belongs in a DLC arc alongside black hole energy harvesting as the foundation of a Type 3 civilisation. Including it in the base game would undermine the resource decisions that give the first two eras meaning. Consequence worth noting: without star-lifting, stripping Titan of nitrogen and crashing Europa into Venus are permanent, irreversible decisions for the game's timeline. Europa cannot be restored. Titan cannot be refilled. This is correct — these decisions should carry permanent weight.

---

## 5. Kardashev Milestones

Four milestone moments across the full game arc. Space-literate players recognise the framing; others feel the weight of the language.

| Milestone | Trigger | Approx. year | Culture event framing |
|---|---|---|---|
| **Type 1** | Deuterium fusion online on Earth (after Mercury proof-of-concept + Dyson 15%) | 80–120 | *"Earth wants for nothing. We look outward."* |
| **First Era Complete** | 2 habitable worlds + first self-sustaining colony + Dyson 50% | 400–700 | *"Humanity is no longer a single-world species."* |
| **Type 2** | Dyson sphere 100% complete | 800–1200 | *"We have tamed a star."* |
| **Type 3 Gesture** | First interstellar seed ship launched | 1000–1500+ | *"Humanity's first child has left home."* |

---

## 6. Game Start & Historical Context

**Game starts: 2033.**

This date is deliberately after the following real-world missions:
- **NASA Artemis program:** Artemis 4 landed at the lunar south pole in 2028. By 2033, the Artemis base is operational with a rotating crew of 4 on 28-day missions. Fission reactors power the base. Water ice extraction from shadowed craters is underway.
- **Europa Clipper (2030–2034)** and **ESA JUICE (2031–2032):** Both completed primary flyby objectives. Results: organic chemistry confirmed in Europa's plumes, pH and salinity data collected. **No definitive biosignatures detected** — flyby instruments are not designed for life detection, only reconnaissance. The question of life in Europa's ocean remains formally open.

The game's opening references this: *"The Europa Clipper mission returned inconclusive results on biological activity — organic chemistry confirmed, definitive biosignatures absent. The question remains open."* This preserves the player's Hunt for Life discovery moment for mid/late game.

The Moon base (Shackleton Crater, south pole) is inherited infrastructure at game start — not built by the player, but expanded and operated. The Mercury mission is humanity's next major off-world project.

---

## 7. Progression Arc

The game spans ~2,000–3,000 in-game years. Multiple systems always run simultaneously.

### Phase 0 — Pre-game (implied backstory)

Earth at ~Kardashev 0.73. Fission, renewables, Artemis base operational. Mercury mission approved.

*Opening culture event:* "For the first time in history, humanity has agreed on something: we need more than one world. The Mercury Expedition launches at dawn. Nobody alive will see it return."

### Phase 1 — The Mercury Foothold (Years 0–80)
*Parallel: Earth Type 1 research + Moon base active*

Mercury base phases:
- **Year 0–5:** Landing. Prefab construction kit arrives via rocket. Specialised assembly robots deploy: landing pad, power cell, mining facility. Miners begin fixed sprite-path routes to ore deposits.
- **Year 5–20:** Refinery, fabricator, solar array expansion. Energy is the binding constraint.
- **Year 20–40:** Mass driver researched and deployed. Dyson panel production begins. Queue system active.
- **Year 40–80:** Exponential scaling. More collectors → more energy → more panels.
- **Phase IV (mid-game):** Polar fusion reactor. Permanently shadowed crater, superconducting confinement, deuterium shipped from Earth initially. He-3 upgrade later.
- **Late game:** Stellar engine construction yard — same mass driver infrastructure, civilisation-scale output.
- **Late game:** Mercury: Machine World vs Garden World — The late-game optional choice that defines Mercury's final identity. Two paths, both valid, reflecting the Terraformer/Builder divide at its most distilled.
*Machine World (Builder path)*: Mercury remains a sterile, optimised industrial planet. Mass drivers fire continuously. Automation maximised. No biosphere, no inhabitants, no maintenance beyond industrial upkeep. Yields a permanent production bonus and is the correct choice for players who want maximum civilisation efficiency. There is no shame in this — Mercury as pure instrument is its own kind of achievement.
*Garden World (Terraformer path / "Type 2 Flex")*: Terraform Mercury using Venus nitrogen surplus and whatever volatiles remain. Dyson swarm panels used as solar shade to regulate temperature. Mirror arrays create an artificial day/night cycle. L1 magnetic shield retains a synthesised atmosphere. The result is deliberately engineered — Mercury's 176-Earth-day solar day means any cycle imposed is entirely artificial. Gardens grow under chosen skies. Cities built knowing every day was designed rather than inherited. Not another Earth — something stranger and more honest about what it is: a world that exists because humanity decided it should. Note: Mercury terraformed is a concession between the two camps — it is nature, but engineered by humans. The Terraformer gets a living world; the Builder gets to admit that engineering can produce beauty. Neither camp gets a pure victory. *Achievement: "The Forge Blooms."*
Neither path is presented as superior. The post-terraforming culture events differ completely.

**Mercury visual:** Base sits on a polar crater rim. The Sun hovers permanently on the horizon (never rises or sets). Everything is side-lit with permanent horizontal shadows. One side of the scene: lit terrain, solar collectors, industrial structures. Other side: the pitch-black crater floor where the fusion reactor glows. The Sun dims progressively as Dyson swarm grows — not globally (Earth protected) but locally visible from Mercury's surface as panels transit across its sky.

**Mercury ore types (3):**
- Common ore (iron, silicon, aluminium) — abundant everywhere, used for all standard construction
- Rare metals (titanium, chromium) — specific crater deposits, required for advanced components
- Polar volatiles (trace water ice, carbon compounds) — used for life support components

Player assigns mining drone capacity between the three via simple slider. Creates mild but genuine allocation decisions.

**Keeping Mercury relevant:** Solar flares on predictable ~11-year cycle with visible solar maximum forecasts. 2–3 coronal mass ejections per game, visible 10–20 years in advance. Shaft collapses, mechanical failures as minor maintenance events.

### Phase 2 — First Light on Other Worlds (Years 60–200)
*Deuterium fusion era begins*

Venus work starts before Mars — needs more time. Path C (Europa redirect) decision window closes at Year 100. Mars atmospheric work begins. Fusion impacts: Mercury output +30–40%, Venus cooling +15–20%, Mars warming more uniform via ground-level heating stations.

### Phase 3 — The Expanding Grid (Years 150–400)
*Dyson swarm: 15% → 40% | He-3 era begins*

Dyson beamed energy reaches Venus and Mars via orbital relay satellites. Jupiter accessible via fusion drives → aerostat helium-3 refineries. He-3 upgrade rolled out across all reactors (~4× efficiency, no radioactive byproduct).

### Phase 4 — First Era Approaching (Years 300–600)
*Dyson swarm: 40% → 50%*

Biology phases running on Mars and/or Venus. Dome colonisation active. First self-sustaining colony being established.

**FIRST ERA COMPLETE** when all three pillars achieved simultaneously:
1. Mars and Venus both reach basic habitability
2. Dyson swarm at 50%
3. First self-sustaining colony established (anywhere off-Earth)

*"Humanity is no longer a single-world species."*

The game does not end. The second era begins.

### Phase 5 — Second Era (Years 600+)

Dyson sphere completes → **TYPE 2.** Post-game: stellar engine, seed ships, Hunt for Life, outer solar system research, optional Mercury redemption.

**The Architect of the System**
The Type 2 completion fires a specific culture event that names the transition explicitly: the civilisation has moved from "survive and expand" to something else entirely. The Dyson sphere is not just a power source — it is a precision instrument. The stellar engine is not just propulsion — it is conducting the movement of a star. Mercury is not just a factory — it is a choice. The player is no longer managing resources. They are making aesthetic and philosophical decisions about what kind of civilisation they have built. This framing should be acknowledged at Type 2 and carry through everything that follows.
*Type 2 culture event*: "The last panel locked into place at 03:14 this morning. The sphere is complete. We have enclosed a star. Not to own it — to listen to it, to harvest what it offers freely, to use its abundance rather than exhaust our own. Someone on the engineering team sent a message that simply said: what now? The answer, for the first time in human history, is: whatever we want."

---

## 8. Moon Base

### Overview

The Moon base (Shackleton Crater) is **inherited infrastructure** at game start — already built by the Artemis program. The player does not build it; they expand and operate it. This gives the early game a third active location alongside Earth's research campus and Mercury's factory layer.

The Moon base is a **research outpost and proving ground** — not a factory. Its role is to do what Earth cannot: test low-gravity biology, stress-test life support systems, run long-duration radiation studies, and extract small quantities of helium-3 from regolith. It does not have an isometric factory view. Its interface is simpler — a habitat cross-section with assignable crew research tracks and occasional event decisions.

### Research Tracks (each takes ~20–40 game-years)

- **Low-gravity medicine** → Mars colonists arrive healthier, adapt faster
- **Closed-loop life support** → cheaper life support infrastructure on Mars/Venus
- **Regolith construction** → faster initial colony construction, lower import costs
- **Radiation resilience** → reduced early Mars surface attrition
- **Isolation psychology** → colony morale events less severe in early Mars phase
- **Early He-3 extraction** → small fusion fuel source before Jupiter missions; bridges deuterium era

These bonuses are the Moon base's strategic value. They make later Mars/Venus phases meaningfully easier if the player invested in the Moon base early.

### Culture Events (intimate, crew-scale)

Moon base culture events are the most intimate in the game — small crew, everyone knows each other, every milestone is personal. Examples:
- First birthday celebrated off-Earth
- First person who refuses to return to Earth when their rotation ends
- A crew member developing claustrophobia two years into a three-year posting
- The base's 10th year: *"Somewhere in the tradition of new arrivals being made to stand in the airlock and look at Earth until they feel it — nobody remembers who started it, but nobody has ever skipped it."*

### Organism Library (biology bridge)

The Moon base xenobiology lab develops and stress-tests pioneer organism candidates in controlled conditions before planetary deployment. The player curates organism combinations here during the long terraforming wait (Years 100–280). This feeds directly into the Biological Seeding phase on Mars and Venus — by the time the planets are ready, the player has been thinking about ecosystem composition for a century. The Moon base preparation matters strategically: players who invested get more organism options and better stability projections.

### Visual

Two inspectable locations: the base surface (modest modular structures, the Sun always low on the horizon, Earth visible) and a habitat interior cross-section view for crew assignment.

---

## 9. Earth

### Overview

Earth is the civilisation's brain. It has a management view — not a factory, not an isometric base. The player returns here to manage research, initiate missions, and activate Earth restoration tech as it becomes available.

### Earth Management View

- **Research campus:** Assign scientists to research tracks. More scientists = faster unlock. Research points generated by population, which grows slowly over time.
- **Launch facilities:** Crewed missions originate here. First humans to Mars requires building a launch complex, assembling crew, loading supplies — a deliberate production project.
- **Mission control:** Deploying orbital structures requires Earth coordination. Active missions list with status.
- **Public support meter:** Civilisation enthusiasm (not politics). Big milestones boost it; long idle periods reduce it. Lower support = slower research.

### Type 1 Research Track

1. Advanced renewables integration → global energy grid
2. Deuterium extraction (from seawater — effectively unlimited)
3. Fusion ignition theory
4. Fusion reactor — deuterium (requires: ignition theory + Dyson 15%)

**Type 1 fires** when Earth's own fusion reactors come online (built on Earth, informed by Mercury proof-of-concept).

### Governance Evolution Branch

Not a mechanic — a series of passive culture events and minor passive bonuses. Early game: international space treaty enables shared Mercury mission. Mid game: first planetary resource-sharing agreement. Late game: Earth governance increasingly unified around the solar system project. Each step slightly improves research coordination. Never mandatory, always flavourful.

### Earth Tech Tree — Spillover Unlocks

Terraforming research on other planets generates applicable technology for Earth. When the source research completes, a **spillover notification** appears on Earth: *"Carbonate catalyst technology from Venus operations is applicable to Earth's ocean acidification. Deploy?"* The player goes to Earth's view, sees it in the tech tree as a pending unlock, clicks to initiate. A research timer runs. A culture event fires on completion. Earth's vignette updates at the next threshold.

**This gives Earth active agency throughout the game** rather than passive progression.

### Earth Restoration Tech Tree

Gated by resource thresholds and prerequisite space research, not by money. Options unlock when relevant surplus capacity exists.

**Early game (Years 0–150):**
- *Ocean macro-plastic cleanup* — industrial-scale collection machines, manufacturable once Mercury provides surplus components. The large plastic patches are actually easier to collect than microplastics.
- *Microplastic filtration* — harder problem, requires advanced material science from asteroid processing. Separate, later node.
- *Atmospheric CO₂ drawdown* — the same carbonate catalyst technology developed for Venus, applied to Earth's cooperative atmosphere. Faster and cheaper on Earth. Culture event: *"The irony is not lost on anyone: the technology we developed to fix Venus is fixing Earth."*
- *Soil restoration network* — nitrogen-fixing bacteria engineered for Mars soil preparation, applied to Earth's depleted agricultural land. Eliminates synthetic fertilisers, restores fertility.

**Mid game (Years 150–400):**
- *Rewilding at scale* — de-extinction tools from Mars/Venus ecosystem seeding applied to Earth. Brings back keystone species. Generates Knowledge resource from studying recovered ecosystems (applicable to other planet seeding).
- *River restoration* — dams decommissioned as fusion replaces hydroelectric. Rivers return to natural courses. Salmon return to rivers that haven't had them in a century.
- *Smog elimination* — once fusion eliminates combustion at scale, urban air quality becomes a historical problem. Fires passively when fusion grid reaches critical coverage. *"Beijing reported its first AQI reading below 10 today. Meteorologists had to recalibrate their instruments."*
- *Retrograde mining* — with near-unlimited fusion energy, plasma-based recycling achieves essentially perfect material recovery from any waste stream. Landfills become mines. Junkyards become refineries. Generates a small minerals bonus. *"The last landfill was excavated this year. The steel inside dated to the 2030s."* **Key philosophical note:** Terraformers want to use recycled Earth materials for new construction — they are heritage, legacy, continuity. Builders prefer fresh asteroid resources — cleaner, no history. This tension plays out as a minor Terraformer/Builder echo throughout the resource economy.
- *Ocean acidification reversal* — from Venus carbonate work. Two events: the intervention, then decades later the natural recovery completing without further action.
- *Desert greening* — large-scale desalination powered by fusion, combined with drought-resistant plants from Mars soil research. Not direct ice delivery from space (velocity on impact would be catastrophic) but water infrastructure. Glacier restoration via directed small ice delivery to high-altitude reservoirs is feasible and gets its own node.
- *Coral reef reconstruction* — using synthetic biology from planetary seeding, engineered coral variants more resilient to temperature variation. Mid-game completion: the Great Barrier Reef more diverse than it was in 2000.

**Late game (Years 400+):**
- *Full species recovery program* — de-extinction. Woolly mammoths restoring steppe grasslands, passenger pigeons, marine megafauna. Each species recovery is its own culture event.
- *Permafrost stabilisation* — active cooling of permafrost regions using heat-pump technology from Venus vortex engines. Prevents catastrophic methane release as temperatures stabilise.
- *Light pollution reduction* — once combustion and most surface lighting becomes fusion-efficient, the night sky over cities becomes visible. *"For the first time since the 19th century, the Milky Way is visible from downtown São Paulo."*
- *Population distribution* — as Mars, Venus, and orbital habitats become habitable, Earth's population decreases voluntarily. Forests expand into former suburbs. Rivers run cleaner. Happens passively as colonisation milestones are reached.

### Earth Vignette Arc (5 states, multiple inspectable locations)

Each location evolves independently based on which tech tree nodes are completed.

**Inspectable locations:**
- City skyline (smog → clean air → greener integrated skyline → quieter, forests visible at edges)
- Coastline/ocean (brown degraded → coral beginning → rich reef → extraordinary diversity)
- Forest/farmland (depleted → restored → rewilded with returning species)
- Night sky (light pollution → stars → Milky Way visible from city)

**State progression:**
1. **Game start, 2033:** Recognisably our world. Smog halos. Brown coastlines. Contrails. Beautiful but strained.
2. **Post-Type 1, ~Year 100:** Sky cleaner. First ocean cleanup ships visible. Fusion plants replacing old grid.
3. **Mid-game spillover active, ~Year 300:** Noticeably greener. Coral recovery visible. Rivers running clear.
4. **Late game, ~Year 600:** Genuinely lush. Rewilding working. Cities integrating with nature. Night sky visible.
5. **Post-game:** Earth restored. Population declining voluntarily. Forests expanding. The planet from orbit is a deeper blue-green. The pale blue dot, returned to itself.

---

## 10. Individual Planet Systems

### Venus — Terraforming Paths

**Path A — Wild Venus** *(slow rotation accepted, atmospheric terraforming only)*
Total: ~400–600 years (no fusion) / ~300–450 years (with full fusion)
End state: Climate bands. Terminator zone densely settled — permanent golden hour, ~6.5 km/h drift. Dayside: hot desert/jungle. Nightside: cold tundra. Two city typologies: **settled terminator cities** (wide enough that the habitable band drifts through them over weeks — the "nice quarter" rotates) and **moving cities on rail loops** (technically feasible post-Dyson, follows the terminator forever — *"Novo Lisboa has been travelling west for 200 years. It has never seen sunset."*).

**Path B — Managed Venus** *(slow rotation + orbital mirror array for artificial day/night)*
Total: ~450–650 years / ~340–500 years
End state: Most Earth-like climate without spin-up. Ongoing mirror maintenance permanent. Dyson swarm panels clustering over Venus do dual duty: shade + energy regulation. Panels clustered over Venus not generating energy elsewhere — a resource tension.

**Path C — Spun Venus** *(Europa impact, early game commitment)*
Decision window: before Year 100 or option closes permanently.
Total: ~700–1,000 years / ~560–800 years
End state: Most Earth-like Venus possible. Genuine seasons, self-sustaining climate, no permanent infrastructure needed. Europa delivers water + angular momentum simultaneously.

**The Europa Moral Weight (see Section 17):** Path C players will never know whether they destroyed life on Europa. This is permanent and intentional.

**Venus sky cities:** Early colonisation (~Year 100–200 before surface is habitable) uses floating cloud cities at 50km altitude — where current Venus conditions are already near Earth-like in pressure and temperature. Breathable air is naturally buoyant in Venus's thick CO₂ atmosphere at that altitude. As terraforming thins the atmosphere, sky cities lose buoyancy. Decision point (player-initiated):

1. **Controlled descent** — once surface temperatures are survivable, the sky city lands. First surface city built from a structure never designed to touch ground. Culture events about the engineers who figured out how to land something never meant to land.
2. **Structural conversion** — redesigned in-flight during descent, converted from floating habitat to conventional structure. More expensive, preserves more.
3. **Preservation as heritage** — maintained with active lift systems as cultural monuments, kept aloft artificially forever. The first human structures on Venus, flying as a reminder of what early colonists endured. Expensive, symbolic, beloved by Terraformers.

*Culture event:* "They had been Venusians for two generations before any of them stood on Venus."

### Mars — Terraforming Paths

**Path A — Greenhouse Mars** *(PFC factories + L1 magnetic umbrella)*
Total: ~400–600 years / ~280–420 years
End state: Most naturally alive Mars. Self-sustaining given umbrella maintenance. Wild, unpredictable ecosystems. L1 umbrella is a permanent single-point-of-failure.

**Path B — Mirror Mars** *(orbital statite array + L1 magnetic umbrella)*
Total: ~250–400 years / ~190–300 years
End state: Fastest habitable Mars. Cities exist before biosphere is stable. Urban, engineered, civilisation and terraforming developing simultaneously.

**Path C — Nuclear Mars** *(polar detonations, no magnetic solution)*
Total: ~200–300 years / ~170–255 years
End state: Fastest path. Atmosphere erodes slowly over geological time. Colonists build knowing it won't last forever. The most philosophically interesting culture events. Can retrofit umbrella later but culture has already formed around impermanence. Achievement: *"We Build Anyway."*

**Transition: Artificial → Natural (optional, late)**
Decommissioning mirror infrastructure. A generation of climate instability — "the wild years." Some species don't survive. Achievement: *"Mars No Longer Needs Us."*

### Pre-Terraforming Dome Colonisation

Dome tech is a research node on Earth's tech tree, available relatively early. Once researched, "Send First Humans to Mars" becomes a player-initiated milestone: build launch complex, assemble crew, commit. Culture event at launch. Culture event at arrival. The first dome on Mars gets its own vignette.

**Why colonise before terraforming completes:** Scientists want to be on the frontier, not watching from telescopes. People want to start over. Entrepreneurs see a world with no incumbent industries. A retired teacher. A family who couldn't afford a house on Earth.

**Dome phase activities:** Small dome colonies generate research points, create culture events (first marriages, birthdays, generational milestones), and give the player a colonisation investment to watch grow during the long terraforming wait.

**The dome teardown sequence:** When atmospheric conditions cross breathable threshold, the player initiates decommissioning as a deliberate act. Each dome coming down is a small culture event. The last dome is a major one.

*Culture event:* "The airlock of Dome 3 opened for the first time without suits required. The scientists stood there for a while before anyone went outside. Not from fear — just because they wanted to remember the moment before it became ordinary."

**Venus dome colonisation:** Later and harder than Mars. Early Venus colonisation = sky cities at 50km altitude (see above). Descending to the surface for the first time after terraforming completes is an extraordinary cultural moment.

### Post-Terraforming Planet Activities

Terraforming completion is not an ending — it is a transition. The game's relationship with those planets changes character.

**What continues:**
- Dome teardown sequence (if not already done)
- First open-air city founding — single player action, culture event
- Ecosystem micro-events every ~50 game-years — a food chain imbalance, an unexpected species, a new predator
- Population milestone culture events (first million Martians, first Mars-born generation who never saw a dome)
- **Planetary exploration culture events** (every 50–100 game-years post-terraforming): first deep-ocean dive, first hydrothermal vent ecosystem discovered, first large fauna sighting in the deep ocean, underground drilling for ancient life

**Red Season (Mars):** *"The first autumn on a settled Mars arrived quietly. Scientists had predicted the colours — the imported maples and aspens performing exactly as their genetics instructed, indifferent to the alien sky. What nobody predicted was what the settlers called it. Red Season. For two centuries, red had meant dust and thin air. Now it meant something else — a planet briefly wearing the colour of what it used to be. The first Red Season festival lasted three days. It has not stopped since."*

### Who Lives on Mars and Venus

**Early dome phase:** Mostly scientists, engineers, mission specialists. Dispatches read like research station memos — focused, professional, slightly isolated.

**Mid colonisation:** The first people who go permanently: a retired teacher who always wanted to see it; a family who couldn't afford a house on Earth; an entrepreneur seeing a world with no incumbent industries; a religious community seeking a fresh start. Culture events here are the most human in the game.

**Established colony:** Mars and Venus develop their own class structures, economies, local culture. The scientists are still there but no longer the dominant culture. A Martian who has never been to Earth finds Earth's gravity crushing when she visits. A Venusian businessman resents Earth's control over Dyson swarm energy distribution.

### Genetic Drift (culture events, not mechanics)

1,000–2,000 years is not enough for speciation but enough for significant measurable divergence. Mars at 0.38g: lower bone density, taller on average (less gravitational compression), weaker cardiovascular systems. Returning to Earth gravity after several generations requires medical support.

*Culture event (Year ~400):* "The census counted 34,000 permanent Martian residents this year. Among them, 847 children born on Mars. The oldest have never been to Earth. They describe Earth photographs as looking 'too blue.'"

Animals and ecosystem species evolve faster (shorter generation times). A Mars-specific beetle variant processing Martian soil compounds differently from its Earth ancestor by Year 1,000. The organisms you introduced are becoming something new.

### Multiple Inspectable Locations Per Planet

Each planet has 2–4 inspectable locations accessible from the inspect view. Location selector: a small icon row at the bottom of the left panel.

**Earth:** City skyline, Coastline/ocean, Forest/farmland, Night sky (each evolves via Earth restoration tech tree)

**Moon:** Base surface (modest modules, Earth visible, Sun low on horizon), Habitat interior cross-section (crew assignment)

**Mercury:** Base surface (industrial, Sun permanently on horizon), Polar crater interior (fusion reactor glowing in permanent darkness — purely aesthetic, no decisions, but the contrast between sunlit surface and dark crater glow is memorable)

**Mars:** Surface/landscape, Coastal/ocean zone (evolves from barren mineral water → plankton clouds → seagrass → fish), Underground/deep (unlocks post-terraforming for ancient life research)

**Venus:** Atmospheric/sky city view (early colonisation phase), Surface (once habitable), Ocean (as Mars)

The underwater/ocean view is a completely different aesthetic register — darker, more mysterious. The progression from empty mineral water to teeming life is perhaps more visually dramatic than the surface equivalent.

### Sub-Planet Bodies

Bodies the player harvests but does not directly visit. They exist as resource nodes in decision cards.

- **Europa** — water ice for Mars/Venus, OR spin-up impactor for Venus (mutually exclusive; deep moral weight — see Section 17)
- **Titan** — nitrogen source for Mars or Venus; stripping locks Titan terraforming permanently
- **Ceres** — asteroid belt logistics hub; late-game supplement to Mercury's material supply

Relevant stats surface inline in decision cards: *"Titan: nitrogen reserves 340 units. Note: stripping Titan locks future terraforming."*

---

## 11. Biological Phase Management

### Overview

The biological phase is the longest single wait in the game. Rather than a monolithic timer, it is broken into **sequential committed sub-steps**, each with a short engineering window before commitment. Once committed, a step runs. It cannot be reversed — you can't go back if you're unhappy with the balance you committed to.

While engineering the next sub-step, time passes for the current step. The player is always actively engaged during what was previously dead time.

### Mars Biological Sub-Steps

1. **Ocean seeding** (~30 years): Introduce cyanobacteria and chemotrophs to the new Martian seas. While this runs, engineer the next package.
2. **Soil preparation** (~25 years): Bacteria and fungi begin breaking down regolith into proto-soil. Nitrogen-fixers start atmosphere enrichment.
3. **Coastal pioneer species** (~20 years): First macroscopic plant life in coastal zones. Oxygen production becomes measurable.
4. **Inland spread** (~35 years): Plant life moves inland. First insects deployed. Ecosystem begins self-propagating.
5. **Stability check** (player decision): Review biosphere health, make final species balance adjustments, declare self-sustaining.

Cascading consequences from earlier choices: if you seeded too many nitrogen-fixers in Step 2, an oxygen imbalance appears in Step 3 as a micro-event requiring adjustment in Step 4. Small consequences, not punishing — but the choices mattered.

### Ecosystem Composition Interface

When a sub-step's engineering window opens, the player sees a **palette of organism categories** (8–12 for V1): pioneer bacteria, nitrogen-fixers, decomposers, early plants, insects, small fauna, synthetic organisms. Each has requirements (minimum temperature, atmospheric composition) and outputs (oxygen production, soil enrichment, food chain support).

The player drags combinations into a "projected ecosystem" view. The game shows a stability forecast — green/amber/red. Commit. Outcome differs slightly from projection (life surprises you). That's the point.

### Moon Base as Organism Library

The Moon base xenobiology lab (research track) develops and stress-tests organism candidates before planetary deployment. Players who invested here have more options and better projection accuracy during the planetary composition phase. The Moon base preparation matters.

### Preparation Sub-Phase (planetary domes)

20–30 game-years before atmospheric conditions are ready for open seeding, **pioneer domes** become available on the planet surface. Small enclosed biomes where the player runs live trials of organism combinations. Results inform the full seeding decision. Culture events here: researchers living inside their own experiments, watching the first rain fall inside a sealed dome.

---

## 12. Resource Economy

| Resource | Source | Primary use | Bottleneck phase |
|---|---|---|---|
| Energy | Dyson swarm + local fusion | Powers all processes | Early-mid game |
| Minerals | Mercury mining (3 ore types) | Components, structures, panels | Early game |
| Deuterium | Earth oceans (shipped) | Fusion fuel — early era | Early-mid game |
| Helium-3 | Jupiter/Saturn (shipped) | Fusion fuel — premium era | Mid game |
| Volatiles | Europa, Titan | Terraforming inputs | Mid game |
| Research Points | Population (Earth, colonies) | Tech unlocks | Late game |
| Knowledge | Outer solar system stations + Hunt for Life | Post-game unlocks | Post-game |

**Cross-planet flows:**
- Venus CO₂ export → Mars rocket fuel
- Titan nitrogen → Mars atmosphere (locks Titan)
- Europa ice → Venus OR Mars water (mutually exclusive)
- Jupiter/Saturn He-3 → fusion upgrade across all reactors
- Mercury components → all orbital structures everywhere
- Restored Earth ecosystems → better organism candidates for seeding other planets
- Less stressed Earth → more Research Points (population not consumed by survival)

**Heritage materials tension:** Post-Dyson sphere, asteroid belt mining provides essentially unlimited raw materials. Builders prefer fresh asteroid resources. Terraformers prefer recycled Earth legacy materials — the steel in the first Martian dome carrying history, the copper in Dyson panels coming from 2020s electrical cable. This tension surfaces occasionally as a resource allocation choice.

**Entropy:** Everything degrades. Dyson panels accumulate micrometeorite damage. Processors fail. Orbital structures drift. Builder-to-maintainer ratio becomes a genuine late-game strategic tension.
**Maintenance scope**: Entropy and degradation apply to active industrial and orbital infrastructure — Dyson panels, processors, relay satellites, atmospheric systems. They do NOT apply to terraformed planets as passive withering. A terraformed Mars does not "un-terraform" if neglected. The biosphere is self-sustaining by definition once established. What degrades is the infrastructure the player built to support operations — a distinction worth preserving to avoid the game feeling punishing in its later stages. The maintenance tension is about capacity allocation at Mercury, not about planets dying.

---

## 13. Time & Pacing

**Time scale:** 1 game-year per 2 seconds at 1×. (Revised from earlier 3 seconds — 2 seconds felt more engaging in POC testing.)

**Speed controls:** 1× always available. 5× available after game start. 20× unlocked after first playthrough completion only — it is a challenge mode tool, not a standard option.

**Visual decoupling:** Planet orbits run at a pleasant constant visual pace regardless of game speed — decoupled from game time. The time counter communicates speed; the visuals communicate place.

**Dead zone prevention:** The game should rarely have a moment where the player has nothing to do. Tools: Moon base research tracks, Earth tech tree activation, Mercury queue management, biological sub-step engineering, culture event queue reading, multi-location vignette browsing, history book browsing.

**Culture events:** Do NOT pause the game. They queue. A notification badge shows count. Player reads at their own pace.

**Decisions:** May pause the game (configurable — POC will test whether free-running feels better).

**Playtime estimate:** 2.5–4.5 hours per first playthrough at 1–5× pace. Extended by optional post-game content.

---

## 14. Transport Progression

| Era | Speed | Unlocks |
|---|---|---|
| 1 — Chemical rockets | 6–9 months Earth→Mars; 26-month windows | Game start |
| 2 — Skyhooks + Cyclers | Regular passenger service; gravity pre-adaptation | Mid early game |
| 3 — Ion/Laser sail | 2–3 months Mars; outer solar system accessible | After Dyson 20%+ |
| 4 — Fusion drives | Days anywhere; interstellar at ~10% c | After He-3 fusion |

---

## 15. UI Design Principles

**Core philosophy:** Inform without interrupting. Respect player agency. Let the player prioritise.

### Planet Selection

Two complementary modes:
1. **Orbital path click:** Wide hit area (~30px either side). Planet lights up with persistent label regardless of orbital position. Works on touch — no hover required.
2. **Planet panel (primary navigation):** Side panel, all planets as tiles. Tile shows current visual state (terraforming progress reflected in sphere colour) plus one-line status. On mobile: dropdown from top of screen. All planets inspectable from game start — no locked tiles.

**Planet panel body status language:** Inactive bodies (beyond current reach) show: *"Humanity hasn't reached this far — yet."*

### Notification System

Three tiers:
- **Pause-and-present:** Major decisions, irreversible choices. Game pauses.
- **Ping-and-queue:** Routine updates, culture events, milestone achievements. Number badge in HUD. Player decides when to read.
- **Ambient:** Background state changes visible in planet visuals. No notification fired.

**Global notification badge:** A bell/envelope icon in the HUD shows the total number of queued notifications across all planets. Clicking opens a notification queue. Never auto-interrupts except for pause-and-present decisions.

**Mercury minibar:** Inside Mercury's isometric view, a persistent minibar shows active alerts from other planets. Player chooses when to respond. Never forcibly ejected.

**Culture events do not pause the game.** They queue patiently. The player reads them when they choose.

### History Book

Every culture event that fires is appended to a persistent history book with its timestamp, planet context, and the vignette state active at the time. Accessible any time from the HUD. Clicking any entry shows the full card and reconstructs the vignette at that terraforming stage.

Visual design: older entries slightly faded, earlier vignettes visibly less advanced. Time should feel present in the UI itself.

### Decision Card Context

Each decision card surfaces relevant cross-planet state inline. No navigation required to evaluate options. Example: *"Note: Europa ice also requested by Venus operations — committing here delays Venus water delivery by ~15 years."*

### Research / Tech Tree (Earth)

Partial visibility system:
- Unlocked: fully visible and coloured
- One level ahead: visible but muted — name and one-line description readable
- Two levels ahead: silhouette only — shape visible, content hidden
- Beyond: nothing

"Future projections" text per option describes tendency of that path, not a guarantee.

**Communications Branch example**
A dedicated branch on Earth's research campus. Not about terraforming capability — about humanity's relationship with the cosmos and its own expanding civilisation.
Nodes:
- Deep space radio arrays → better probe telemetry, earlier data returns from outer system missions
- Signal interpretation algorithms → unlocks Hunt for Life listening capability; generates Knowledge resource
- Quantum cryptography → secure interstellar colony communications; does NOT enable faster-than-light communication (quantum entanglement cannot transmit information faster than light — it enables verified authenticity at light-speed, not instant contact). Makes colony correspondence more trustworthy, not faster.
- Interstellar beacon design → unlocks the Fermi Silence broadcast option
- Advanced listening arrays → accelerates Hunt for Life, improves seed ship targeting via biosignature detection

The "accelerates listening research" benefit from the Fermi Silence broadcast choice refers to this branch — choosing to broadcast focuses civilisation attention on building better listening infrastructure as a byproduct.

### Living Planet Visuals

Solar system view: planet sphere colours, atmosphere thickness, cloud cover, surface colour, nightside city lights — all driven by shader parameters updated as terraforming progress variables change. City lights fade in as colony population crosses thresholds.

During an active terraforming phase, stats **interpolate in real time** toward the next step's values as progress advances. The player can watch the atmosphere tick upward while a phase is running.

### Dyson Swarm Progress

Displayed as **energy output in watts** (a growing number), not a percentage. Milestone culture events at 10% / 25% / 50% / 100%. Consumption ratio shown only when energy is a meaningful constraint.

---

## 16. Philosophical Tension — Terraformers vs Builders

Running throughout as a narrative spine, without conflict.

**The Terraformers:** Transform planets to fit humanity. Patient, biological, wild outcomes. Centuries of waiting for something genuinely alive. Want to reuse Earth's legacy materials for new construction — heritage, continuity, respect for history.

**The Builders:** Construct habitats to fit people. O'Neill cylinders, Stanford tori, orbital rings. Faster, scalable, immune to planetary catastrophe. Millions living in space before Mars is habitable. Prefer fresh asteroid resources — cleaner, no inherited inefficiency.

Neither is wrong. Player choices express which philosophy their civilisation leans toward.

**Key tension expressions throughout the game:**
- Natural vs artificial Mars/Venus paths
- Dome colonisation timing (wait for perfection vs move now)
- Venice sky city fate (land / convert / preserve as heritage)
- Europa decision (use for Venus spin-up vs preserve for science)
- Heritage materials vs fresh asteroid resources
- Earth restoration pace (let nature recover slowly vs engineer aggressively)
- Recycled Earth materials (heritage) vs new asteroid mining (efficiency)

---

## 17. The Europa Decision — Life for Life

This is the game's most morally complex moment. It cannot be trivialised.

**The setup:** Europa redirect for Path C Venus (spin-up) must be decided before Year 100. At that point, the Europa Clipper data (backstory) showed organic chemistry but no definitive biosignatures. The question is open.

**The Terraformer/Builder framing:**
- Builders: *"We have no evidence of life on Europa. We have evidence of better Venus. The calculation is clear."*
- Terraformers: *"The absence of evidence is not evidence of absence. We have destroyed nothing we know of. That is not the same as having destroyed nothing."*

**The permanent unknowing:** Players who crash Europa will never know in that playthrough whether life existed there. This is intentional and permanent. The uncertainty is the moral weight.

**Second playthrough awareness:** If the player did NOT crash Europa in a previous run and discovers life there, the game detects this via achievement state. In subsequent playthroughs where the player chooses to crash Europa, a specific culture event fires acknowledging what they now know they might be giving up. Achievement: *"What Was Lost."*

**What is found where (fixed, not randomised — consistent experience for all players):**

- **Europa (if not crashed):** Active life discovered via mid-game Hunt for Life mission. Chemotrophic, alien biochemistry, definitively alive. The game's largest revelation.
- **Enceladus:** Active life discovered. Similar chemotrophic life at hydrothermal vents. Discovered independently of Europa if the player reaches it.
- **Mars subsurface (post-terraforming drilling):** Ancient fossil traces only. Life existed 3 billion years ago. Not alive now. *"We're not the first life on this planet. We're the second."*
- **Titan, others:** No active life found. Generates Knowledge bonus and philosophical culture events about the silence.

**If Europa was crashed into Venus**: Europa's ocean no longer exists. The Hunt for Life mission to Europa is permanently unavailable in that playthrough. The player will never know definitively whether life existed there. This is intentional. The only way to know is to play again and not crash it.
**If Europa was used for water delivery (disrupting but not destroying the ocean)**: The Hunt for Life mission is available but with reduced discovery probability — the delivery disrupted the hydrothermal equilibrium. Discovery is still possible, just less likely. A smaller consequence than crashing, but a consequence.
**Life for life:** If Europa was crashed AND the player later discovers (through Enceladus or second-playthrough Europa knowledge) that life existed, the culture event reads: *"We gave up micro-life on Europa for a better life for humans on Venus. The question of whether that was the right choice will be debated for as long as humanity exists. Nobody has a satisfying answer."*



---

## 18. Hunt for Life Arc

A third post-first-era research arc alongside "Understanding the Universe" and "Building Outward."

### Overview

Systematic search of every body in the solar system for existing or past biology. Enabled by the advanced probe and drilling technology developed through the game.

### Phase 1 — Remote Sensing (early post-first-era)

Deploy improved telescope arrays and orbital probes to candidate bodies. Returns data suggesting which targets warrant deeper investigation.

**Candidate bodies:** Enceladus (highest probability — confirmed hydrothermal vents), Europa (if not crashed — second highest), Titan (complex organic chemistry, extremely cold), Mars subsurface (even after terraforming, ancient life may persist deep underground), Venus subsurface (long shot).

### Phase 2 — Deep Investigation (mid post-game)

Dedicated research bases with drilling capability, submersibles for ocean worlds, atmospheric samplers. Each mission takes years to deploy. Information lag applies — commission Enceladus mission, 3–4 years later first data returns.

**Europa tension:** If player used Europa for water delivery (disrupted its ocean), does this reduce discovery probability? Yes — a small but real mechanical consequence of an early game decision rippling into late-game science.

### Phase 3 — Outcomes (fixed per playthrough, determined by player history)

Three possible outcomes per candidate:

**Nothing found:** Knowledge resource bonus. *"We searched the ocean of Enceladus for three years. We found chemistry that should support life. We found the conditions for life. We did not find life. Scientists are divided on whether this means we didn't look long enough. We're sending another mission."*

**Ancient traces found (Mars subsurface):** *"Traces of life! The drill reached 4km depth today, revealing fossil chemistry — not alive anymore, but once it was. Three billion years ago, something lived here. We built our oceans on top of Mars's first inhabitants. We're not the first life on this planet. We're the second. We're its continuation. Our search for active life continues."*

**Active life found (Europa/Enceladus):** *"Life! We found it! It's small — chemotrophic, utterly alien in its biochemistry — but it's alive, and it isn't from us. For the first time in history we know with certainty that we are not alone in this universe. We never were. We just didn't know where to look. Everything changes now. The search doesn't end here. It begins here."*

### Post-Terraforming Planetary Exploration

Colonists explore their own worlds. Deep ocean is the last unknown frontier even to the people who created it. Periodic discovery events:
- Year 50 post-terraforming: First deep-ocean dive — mostly barren below 200m, but unusual mineral formations
- Year 150: First hydrothermal vent ecosystem — engineered bacteria adapted to vent conditions, looking nothing like their ancestors
- Year 300: First large fauna sighting in the deep — something in the food chain grew larger than projected. Evolution surprises everyone.

---

## 19. Culture Events

### Types

**Milestone events** — triggered by specific achievements. Celebrate, mark, acknowledge.

**Mid-phase events** — fire during a running process at specific progress percentages (e.g., 55%, 88%), not just at completion. These are the idle-time fillers. First rain on Mars fires at ~35% of the water delivery phase, not at completion.

**Overview effect vignettes** — brief first-person perspectives from individual humans, triggered by major decisions. Not moral judgments — the decision was probably right. Just the human cost of right decisions made visible.

**Philosophical split events** — moments where the Terraformer/Builder tension surfaces through specific people.

**Earth reaction events** — culture events fired when Earth restoration tech completes.

**Post-terraforming discovery events** — planetary exploration findings, years after completion.

**Hunt for Life events** — the biggest emotional beats in the late game.

### Portrait Vignette Format

Culture event cards have a left portrait vignette (3:4 aspect ratio) with location-specific art, and text on the right. The vignette shows where this event is happening.

### Achievements as Poignant Records

Not completionist hunting — honest records of what this particular civilisation accomplished. Different paths generate different achievements. None is superior to others.

### Selected Culture Event References

*(These establish tone — not final wording)*

- *First humans on Mars:* "They landed at 14:23 local time. Seven people. The first humans on another planet since Armstrong. They stood outside the lander for eleven minutes before anyone spoke. The first words were not recorded. Someone's microphone was off."

- *First Mars dome teardown:* "The airlock of Dome 3 opened for the first time without suits required. The scientists stood there for a while before anyone went outside. Not from fear — just because they wanted to remember the moment before it became ordinary."

- *Red Season (Mars):* "The first autumn on a settled Mars arrived quietly. Scientists had predicted the colours. What nobody predicted was what the settlers called it. Red Season. For two centuries, red had meant dust and thin air. Now it meant something else entirely."

- *Recycled materials:* "The copper in panel array 7,841 was traced back to electrical cable laid in São Paulo in 2024. The engineer who found the records said: I want to meet whoever installed it. They probably didn't know they were building a Dyson sphere."

- *Milky Way visible again:* "For the first time since the 19th century, the Milky Way is visible from downtown São Paulo. People stood on their rooftops for hours. Some of them had never seen it before."

- *Venusian descent:* "They had been Venusians for two generations before any of them stood on Venus."

---

## 20. Fermi Silence

At ~30% Dyson swarm completion, the Sun has become anomalous in infrared wavelengths. Humanity is detectable within ~150 light years.

No signals received. The silence is the mechanic.

Three choices: **Broadcast** (optimistic, accelerates listening research), **Go quiet** (slows some research, scientists argue), **Continue as normal** (debate becomes cultural undercurrent). Nothing ever answers. Choice shapes civilisation character and culture event chains.

If the player found life through the Hunt for Life arc, the Fermi silence event gains additional weight — we know life exists in this solar system. The question of what's out there is no longer theoretical.

---

## 21. Interstellar Endgame

### Information Lag

Probe to Alpha Centauri: 22 years. Return signal: 4.2 years. Instructions: 4.2 years. Total loop: ~30 years per exchange. Distant colonies are functionally autonomous. A colony that left Sol 80 years ago is not quite the civilisation you sent. When you hear from them, they may not agree with your suggestions.

### Ships

- **Scout probes** — fast, cheap, informational. Data returns years later. Informs which systems to prioritise.
- **Seed ships** — automated Von Neumann probes. Bootstrap industry from local asteroids. Prepare system for eventual human arrival.
- **Generation/sleeper ships** — actual humans. Most expensive, most culturally significant. Culture events around departure are among the most powerful in the game.

### Laser Sail Array

Dyson sphere output focused through Mercury-built lens array. Accelerates sail ships to 10–20% light speed. Same infrastructure as Shkadov thruster construction — one system, multiple purposes.

## 21b. The Statite Resort — End-Game Prestige Project

A statite is a structure that uses solar radiation pressure rather than orbital mechanics to maintain a fixed position in space — a real proposed concept. Positioned 2–4 million km from the Sun, radiation pressure from the star's output balances the gravitational pull, holding the station in place without propulsion.
At this distance, the Sun subtends approximately 25–45° of sky — an overwhelming, roiling presence of plasma and corona loops, prominences visible to the naked eye. Nothing else in the solar system offers this view. Nothing else in the solar system requires this level of engineering to make survivable.
**Why it belongs in the game**: The statite resort is the end-game flex that proves the civilisation has moved entirely beyond survival concerns. It is absurd and audacious and exactly what a Type 2 civilisation might do. It is the Architect of the System moment made physical.
**Engineering requirements**: Radiation and heat at this distance are extraordinary. Layered electromagnetic shielding, active cooling, and by the game's timeline — medical technology sufficient to correct any residual radiation exposure (*"a quick med-bay visit to scrub DNA errors, or a specialised anti-radiation pill before the trip"* — hand-waved but plausibly within the game's civilisation level). This should feel like a genuinely difficult construction achievement, not merely an expensive one.
**Variable gravity design**: The station uses centrifugal rotation for artificial gravity. Independent pod arms of different lengths offer genuinely different gravity zones — lunar low-G for human-powered flight, Mars standard, Earth standard. The Sun remains visually fixed as the rotation axis points toward it.
**Vignette**: One of the game's most striking visual moments. The Sun filling nearly half the sky, corona loops drifting slowly, the station's filtered aperture providing the only safe view. Not a culture event — a location you can inspect, a place you can look at. The player built this. It exists because they made it exist.
**Unlock condition**: Post-Type 2 only. Requires stellar engine research to be underway (the engineering knowledge transfers). Sits alongside Mercury Garden World and the stellar engine as the three late post-game prestige projects.

---

## 22. Quiet Failure — No Game Over

Poor decisions diminish the game, they do not end it. Venus may remain too hot. Mars may be technically habitable but biologically barren. The Dyson swarm may stall at 40%.

At First Era Complete (or at game end): a solar system overview with a quiet honest assessment of what was built. A flourishing run shows three living worlds, complete swarm, seed ships en route. A diminished run shows marginal progress, a civilisation that survived but never quite reached.

No failure screen. Just an honest account.

---

## 23. Art Direction

### Style

**Pixel art filter over 3D.** The solar system rendered in Godot as a 3D scene with a pixel art post-processing filter. This creates a distinctive visual identity — no other space strategy game uses this combination.

**Stepped animation:** Animations are stepped at 6–8fps rather than 60fps smooth. Each frame held for 2–3 ticks (especially at extreme positions — the moment a grass blade reaches full extension, the moment a cloud catches the light). This makes the pixel art feel hand-drawn rather than computationally generated. Variable frame hold: extreme positions held longer, movement through the middle quicker.

**Colour philosophy:** Bold committed palettes per planet. Warm and vibrant. The pixel filter should pixelate the geometry, not flatten the colour.

### Toolchain

| Task | Tool |
|---|---|
| Vector illustration | Affinity Designer (one-time purchase, SVG export) |
| Import to Godot | Native SVG support |
| Pixel art filter | Godot post-processing shader on 3D viewport |
| Vignette animation | Skeleton2D + Polygon2D for organic sway; AnimationPlayer for scroll/tween; PathFollow2D for vehicles |
| Stepped animation | Constant interpolation in AnimationPlayer, manual keyframe timing |

### Vignettes

Layered 2D compositions: sky gradient / atmospheric effect / far background / midground / foreground / UI overlay. **Progression via palette and asset swap, not full redraws.** 4–6 discrete states per planet location, crossfaded over 10–20 seconds at milestone triggers.

Discontinued equipment (vortex engines, early rigs) accepted as absent in later vignette states — treated narratively via culture events, not visually simulated.

### UI Aesthetic

Retro-functional. Monospaced typography. Dark backgrounds with warm amber/orange accents. Mission control, not corporate dashboard. Minimum font size: 14px base, all other sizes in em.

### Sound Design

**Ambient audio per planet per terraforming state**, implemented via a parameter-driven audio bus system rather than unique recordings per state. Parameters: atmospheric pressure (0 = silence, 90 = dense Venus), wind intensity (0–1), precipitation (0–1), biology level (0–1), human presence (0–1).

Processing on the bus (AudioEffectLowPassFilter, AudioEffectHighShelfFilter, AudioEffectReverb) shapes the same base recordings to match each planet's physics. The system is designed for procedural DLC planets — audio parameters derived from planet generation data automatically.

**Planet sound character:**
- Early Mars: thin whistling wind, occasional dust impact. NASA Mars recordings available for authentic reference.
- Late Mars: deeper wind as atmosphere densifies, rain, eventually insect sounds and forest ambience
- Early Venus: deep pressurised roar, almost underwater in quality. Vortex engines: deep industrial cycling hum
- Late Venus: heavy atmospheric pressure, dense humid quality, heavier rain
- Mercury base: NO ambient sound (no atmosphere). Structural/mechanical only — mass driver electromagnetic thump felt through structure, air recycling hum, thermal expansion groans. Silence used deliberately and powerfully.
- Earth: city ambience, lab equipment, weather — the only vignette that sounds like home

**NASA audio resources:** Mars wind recordings from Perseverance rover publicly available. Huygens Titan descent audio publicly available. Use these for authentic reference where possible.

**Sound design tools:** Freesound.org (CC licensed), BBC Sound Effects Library (free for non-commercial), ElevenLabs Sound Effects (AI generation for gaps), NASA Audio Collection.

---

## 24. Scope — V1 Definition

V1 is a complete, shippable game.

**V1 includes:**
- Earth (management view, Type 1 research track, Earth restoration tech tree with spillover unlocks, multiple inspectable locations)
- Moon base (Artemis-inherited, research tracks, organism library, culture events)
- Mercury (isometric factory/base layer, 3 ore types, polar fusion reactor)
- Venus (all 3 terraforming paths, sky cities, dome colonisation, post-terraforming activities)
- Mars (all 3 terraforming paths, dome colonisation, post-terraforming activities, Red Season)
- Biological phase sub-steps and ecosystem composition interface
- Dyson swarm to 50% as First Era Complete condition
- Fusion progression: deuterium → helium-3 (with Jupiter operations)
- Transport progression through Era 4
- Kardashev milestones: Type 1, First Era Complete
- ~50 culture events, well-written in the established voice
- Vignettes for all V1 planets across key states, multiple locations per planet
- Terraformer vs Builder philosophical tension
- Fermi silence event
- Notification system with history book
- Quiet failure / no game over
- Scoring dimensions at First Era Complete
- Save card as PNG for culture events
- Basic challenge modes
- Europa decision and moral weight

**Post-V1 / DLC candidates:**
- Outer solar system destinations (Jupiter, Saturn, Titan, Callisto, Ceres as playable)
- Hunt for Life arc (Enceladus active life, Europa active life if not crashed, Mars ancient traces, others)
- Dyson sphere completion → Type 2 milestone
- Stellar engine construction (Shkadov + Caplan)
- Interstellar seed ships + information lag mechanics
- Mercury redemption arc
- Black hole energy harvesting research
- Procedurally generated star systems (uses procedural audio and vignette parameter systems already built)
- Full mobile release
- Twitter/X direct share integration

---

## 25. Commercial Strategy

### Pricing

**€12.99** at launch. Modest and confident. The comparison class is narrative strategy games. If reception is strong, post-game DLC extends the experience at a separate price point. Launching modestly and over-delivering is better than launching ambitiously and disappointing.

### Key Differentiator

**"A peaceful civilisation-scale terraforming game grounded in real science."**

No direct competitor is simultaneously peaceful, scientifically grounded, and civilisation-scale. Players who bounced off Dyson Sphere Program (too technical/complex), Terraformers (too gamey/card-based), or other space games (conflict-focused) are natural audiences.

### Release Strategy

1. Build to showable state: art direction established, one planet working, research UI functional
2. Begin public devlog — Reddit (r/gamedev, r/indiegaming), Twitter/X, TikTok/Reels. Show real progress from day one.
3. **Devlog voice option:** Open entries with a short in-universe text (a culture event card, a mission log fragment) before transitioning to actual development content. Demonstrates the game's voice before the game ships.
4. Steam page live ~12 months before launch (wishlist accumulation critical)
5. Steam Next Fest participation
6. Outreach to mid-size YouTube channels (10k–500k subs) in space/science/strategy
7. Kickstarter — only after 12+ months of devlog with demonstrated audience. Digital rewards only. Goal sized to demonstrated audience capacity.

### Shareable Assets

Culture event cards are the game's most shareable content. **Save card as PNG** button on each event exports a clean chrome-free image. Steam screenshot (F12) throughout. Twitter/X direct share post-launch if demand exists.

---

## 26. The Opening and Closing Image

**Opening:** Earth from space. Small. Blue. Alone. A quiet line of text before the interface appears.

**Closing:** The same camera perspective — but the solar system as the player left it. Multiple living worlds. A faintly dimmed Sun. Warm atmospheric signatures on Mars and Venus. Habitat rings near Jupiter. A faint beam pointing toward a distant star. The Milky Way visible from Earth's nightside. Whatever the player chose not to do is also visible in its absence.

No score. No grade. Just the view.

Everything between those two images — the resource management, the factory layers, the research decisions, the culture events, the moments of wondering whether you made the right call — exists in service of that contrast.

---

*Document maintained by Jos — last updated April 2026.*
*Version 0.3 supersedes v0.2 (helioscape-gdd.md) and the companion helioscape-progression.md.*
*This is a design reference, not a contract. Everything is subject to change as development reveals what actually works.*
*For a new chat session: paste this document as context and add the briefing:*
I'm developing Helioscape solo. I have an extensive GDD (attached). You are a critical game design consultant — not a cheerleader. Push back on weak ideas, flag scope risks, expand on good ideas with science and design depth. Be direct.
