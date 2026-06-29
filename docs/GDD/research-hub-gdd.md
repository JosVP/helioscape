# HELIOSCAPE — RESEARCH HUB & TECH TREE
## Sub-GDD v1.0
## ⚠️ Supersedes all previous research hub / tech tree design in main-gdd.md and earth-tech-tree-options.md.
## Feed this file to AI coding tools instead of those sections.

*Caveman-compressed. Precise. No phantom mechanics.*

---

## CORE SYSTEM

### Research slots
- **2 slots. Fixed. Forever.** No RP capacity. No slot growth over time.
- Each slot runs one research node simultaneously.
- Completing a node frees the slot immediately.
- Player chooses what goes in each slot at any time from the available node list.
- A slot left empty is a real opportunity cost. There is always something worth running.

### Research time
- Each node has a fixed completion time in game-years.
- Time is not affected by population, Dyson %, or any global modifier.
- **Exception:** certain late-game nodes (Architect branch) grant a flat time reduction on future nodes — a concrete, visible bonus, not a multiplier.
- Colony research contribution (post-V1 / future design consideration): when colonies reach sufficient population, they may be able to run specific assigned nodes in a separate colony slot. Not implemented in V1. Mark in UI as future-unlockable.

### Node tiers
Tiers control *when a node becomes available*, not how powerful it is.
- **T1 — Early:** available from Mercury launch onward. RP-equivalent of early game.
- **T2 — Mid:** unlocks after specific milestones (Fusion Ignition, colony population, phase completions).
- **T3 — Late/post-V1:** visible from game start but locked. Unlocks only after civilisation-scale achievements.

### Visibility
**Full tree visible from game start.** All nodes shown — locked nodes display name, tier, icon, and unlock condition. No silhouettes, no hidden names. Rationale: humanity already sees the technological horizon. Players plan ahead. Unlocked = clickable. Locked = greyed, shows what's needed.

### Phase efficiency nodes — special rules
A subset of nodes (marked PHASE RESEARCH below) follows a specific pattern:
- Unlocks when a terraforming phase *begins* — not before.
- Designed to complete *before* the next phase starts if started promptly.
- Effect is always concrete: fewer Mercury build queue items, reduced event response cost if a named event fires, or narrowed bio outcome variance.
- **Never blocking.** Terraforming phases proceed without them. They improve, not gate.
- UI surface: when a phase begins, a notification appears — "New research available: [node name]. Starting this now could help with [specific next thing]." Player decides whether the slot is worth it.

### Booster research — pattern
Terraforming boosters (SGG factories, vortex engines, polar albedo darkening, mirror arrays) are **always available** once physical prerequisites exist. No research gate. Optional research nodes improve booster *performance* once they're running — studied from live operational data. A player who skips the research still gets a functional booster.

### Effects taxonomy
Every node's effect maps to exactly one of:
1. **Capability** — unlocks an action, interface, or build option that didn't exist before.
2. **Queue reduction** — fewer Mercury build queue items needed for a specific outcome.
3. **Time reduction** — flat years off a specific action (build, retrofit, phase).
4. **Event mitigation** — reduces response cost or severity of a named event if it fires.
5. **Variance reduction** — bio outcome projections become more accurate (smaller range, same expected value).
6. **Research time reduction** — flat reduction on future research completions (Architect branch only, late game).
7. **Identity / CE** — tags civilisation, triggers CE chain. No numeric game effect. Honest about this.

No node gives abstract percentage buffs with no visible output. No RP bonuses. No supply queue items. No mechanics that don't exist in the game.

---

## RELAY STATIONS — CLARIFICATION

Relay stations are **Mercury build queue items**, not research nodes.

**Deep Space Power Relay Design** is a research node (T2) that *unlocks* the relay station build option on Mercury. Once researched, player can queue relay stations for any outer-system destination.

**Dependency chain:**
- Deep Space Power Relay Design req: Mercury mass driver operational (Phase 2). NOT behind Fusion Drives.
- Titan nitrogen extraction (Mars Phase 2 Choice A) requires a relay station queued and launched — this must be viable mid-game, before Fusion Drives are reached.
- Fusion Drives unlock *crewed* outer ring access and Hunt for Life probes. Relay stations serve both crewed and automated missions.

**Inner planets do not need relay stations.** Earth, Mars, Venus are within practical Dyson beaming range. Relay stations are for Saturn and beyond.

---

## NODE LIST

Format per node:
```
NODE NAME [CATEGORY] [TIER]
Time: X yr
Unlocks: [prerequisite]
Effect: [exact mechanical effect]
CE: [culture event trigger if any]
Note: [design notes]
```

Categories: CAPABILITY / EFFICIENCY / REACTIVE / IDENTITY

---

### MERCURY OPERATIONS

---

**Ore sorting optimisation** [EFFICIENCY] [T1]
Time: 15yr
Unlocks: first refinery operational 10yr
Effect: Rare metals yield per ore load +12%. Fewer mining cycles before component production can begin — visible as reduced mining queue time before builds start.
Note: Engineers learning from months of routine operations. Reactive framing: "We've been doing this long enough to do it better."

---

**Polar extraction protocols** [EFFICIENCY] [T1]
Time: 15yr
Unlocks: volatiles mining operational
Effect: Volatiles extraction rate +15%. Volatiles queue fills faster, reducing idle time before Dyson component production can begin.
Note: Mercury's permanently shadowed craters are extreme environments. Dedicated drilling patterns studied from operational experience.

---

**Mass driver dual-planet routing** [CAPABILITY] [T1]
Time: 20yr
Unlocks: second planetary destination active (both Mars and Venus receiving deliveries)
Effect: Enables simultaneous launch scheduling to both Mars and Venus from the same mass driver. Without this, queue serves one destination at a time.
Note: A software/logistics unlock, not new hardware. Must be available once both planets are active — this unlocks relatively early.

---

**Solar weather protocols** [REACTIVE] [T1]
Time: 12yr
Unlocks: 1st CME event resolves
Effect: Mercury infrastructure repair time after any CME -25%.
CE: Short CE from Mercury crew — "We weren't ready the first time. The protocols are written now."
Note: Only available after the player has experienced the problem. Framing communicates this explicitly.

---

**CME structural hardening** [REACTIVE] [T2]
Time: 20yr
Unlocks: 2nd or 3rd CME event resolves
Effect: Dyson panel CME damage reduced (exact % TBD balancing). Structural reinforcement patterns derived from observing repeated strike damage.
Note: Deliberately delayed past the first CME. The first event teaches that it happens. The second teaches how it damages. Research becomes available once the pattern is established.

---

**Overdrive systems** [CAPABILITY] [T2]
Time: 25yr
Unlocks: Dyson swarm 15% (Type 1 milestone approaching)
Effect: Unlocks per-building overdrive upgrade option in Mercury base. Without this research, overdrive does not appear as a build option regardless of Dyson output. Engineering theory precedes hardware.
Note: Pairs with Overdrive Tier 1 (25% swarm) and Tier 2 (50% swarm) unlock milestones per existing Mercury GDD. Research is the prerequisite; swarm milestone is the activation condition for each tier.

---

**Deep space power relay design** [CAPABILITY] [T2]
Time: 25yr
Unlocks: Mercury mass driver operational (Phase 2). NOT behind Fusion Drives.
Effect: Unlocks relay station as a Mercury build queue item. Relay stations can then be queued for any outer-system destination. Required before Titan nitrogen extraction can begin (Mars Phase 2 Choice A).
Note: Inner planets (Mars, Venus) do not need relay stations — Dyson beaming covers those distances. Relay stations are for Saturn range and beyond.

---

**Panel tier upgrade streamlining** [REACTIVE] [T2]
Time: 15yr
Unlocks: first panel tier upgrade (Retrofit Production Lines) complete
Effect: Each subsequent panel tier upgrade queues at reduced build time. Learned from having done the first retrofit.
Note: Only becomes available after the player has completed one retrofit. Pure reactive — you couldn't know how to streamline it until you'd done it once.

---

### EARTH — SHARED

---

**Advanced renewables integration** [CAPABILITY] [T1]
Time: 20yr
Unlocks: Mercury launched
Effect: Gates Deuterium Extraction. Earth needs reliable civilian energy baseline before ocean-scale chemistry is viable. First rung of the fusion ladder.

---

**Deuterium extraction** [CAPABILITY] [T1]
Time: 20yr
Unlocks: Advanced Renewables done
Effect: Gates Fusion Ignition Theory. No fuel, no fusion programme. The bottleneck is infrastructure, not resource — Earth's oceans have millennia of deuterium.

---

**Fusion ignition theory** [CAPABILITY] [T2]
Time: 30yr
Unlocks: Deuterium Extraction done
Effect: Unlocks — Overdrive Systems research, mid-tier panel production (Retrofit Production Lines becomes available), Fusion Drives research programme. Major CE chain on completion.
Note: The game's most consequential single research node. Everything downstream accelerates. 30yr reflects genuine civilisational significance. Worth a full slot.

---

**Dome habitat technology** [CAPABILITY] [T1]
Time: 20yr
Unlocks: Mercury launched
Effect: Unlocks colonist launch action in Mars panel. Without this, no "send colonists" option exists regardless of Mars terraforming progress.
Note: Parallel to Fusion ladder — both compete for slots early. Players who rush Fusion delay colonists, and vice versa. Intentional tension.

---

**Automated food systems** [CAPABILITY] [T2]
Time: 20yr
Unlocks: Advanced Renewables done OR Arcology Framework done
Effect: Fork on completion. Player chooses: Rewild freed land (Naturalist tag, unlocks Rewilding cascade) OR Develop freed land (Architect tag, unlocks Arcology Framework cascade). Tags civilisation. Both downstream branches unlock further research.
CE: Fork choice triggers CE about what humanity decides to do with land freed from agriculture.

---

**Fusion drives** [CAPABILITY] [T3]
Time: 35yr
Unlocks: Fusion Ignition done + Dyson 20%
Effect: Unlocks outer ring planet access. Jupiter, Saturn, Uranus, Neptune vicinity become reachable for crewed missions and Hunt for Life probes. Removes launch windows for colonist ships (existing GDD note preserved). Enables He-3 aerostat mining at Jupiter (unlocks Hardened panel tier per Mercury GDD).
Note: Relay stations are NOT behind this node. Fusion Drives = crewed outer ring access. Relay stations = automated beamed power at range. These are separate capabilities on separate timelines.

---

### EARTH — NATURALIST BRANCH

Naturalist branch unlocks after Automated Food Systems fork (Rewild choice).

---

**Ocean macro-plastic cleanup** [IDENTITY] [T1]
Time: 15yr
Unlocks: Mercury Phase 1 complete
Effect: Naturalist tag. Earth vignette (coastline state) advances.
CE: First cleanup fleet departs. Tone: beginning, not triumph.
Note: Pure identity and CE. No numeric effect. Honest about this.

---

**Atmospheric CO₂ drawdown** [REACTIVE] [T2]
Time: 25yr
Unlocks: venus_carbonate spillover fires + 2 naturalist nodes done
Effect: Earth vignette (sky state) advances. Spillover bonus: if Venus Phase 2 (CO₂ Removal) is active simultaneously, Earth's drawdown research team advises Venus operations — reduces Mercury build queue items needed for Venus Phase 2 slightly.
Note: The spillover bonus only applies if both are running concurrently. Cross-planet knowledge transfer feels earned when it fires.

---

**Soil restoration network** [REACTIVE] [T2]
Time: 25yr
Unlocks: mars_soil spillover fires + 2 naturalist nodes done
Effect: Mars bio phase outcome variance narrows slightly — Earth's restored soil science directly informs pioneer organism stability modelling. Visible in bio composition interface as tighter projection range.
Note: Direct pathway: Earth heals → Mars bio modelling improves. Concrete, legible.

---

**Ocean acidification reversal** [REACTIVE] [T2]
Time: 20yr
Unlocks: venus_carbonate spillover + CO₂ Drawdown done
Effect: Earth vignette (ocean state) advances.
CE: Marine biologists report first pH recovery readings. Tone: quiet relief, not celebration.
Note: Pure identity/CE. No numeric effect. Naturalist arc milestone.

---

**Rewilding at scale** [REACTIVE] [T2]
Time: 25yr
Unlocks: mars_coastal spillover + Soil Restoration done
Effect: Unlocks additional organism categories in bio composition interface — terrestrial pioneer classes that Earth's own recovery has demonstrated. More options available when seeding Mars or Venus.
CE: "The First Wolf." Earth vignette (forest/farmland state) advances.
Note: Direct capability unlock for bio interface. Earth healing is the prerequisite for what we can do on Mars. Not abstract.

---

**Advanced circular economy** [IDENTITY] [T3]
Time: 30yr
Unlocks: Rewilding done + Fusion Ignition done
Effect: Naturalist capstone. Earth vignette (industrial zones state) final state.
CE: "The Last Quarry." Final virgin extraction site on Earth closed. Narrator reflects on what it feels like when the last wound closes.
Note: No numeric bonus. Pure civilisational character. The Naturalist arc ends here narratively.

---

### EARTH — ARCHITECT BRANCH

Architect branch unlocks after Automated Food Systems fork (Develop choice).

---

**Vertical megacity initiative** [IDENTITY] [T1]
Time: 20yr
Unlocks: Mercury launched (available from early game regardless of Automated Food Systems; fork only determines whether downstream opens)
Effect: Architect tag. Small flat research time reduction on future nodes — larger concentrated researcher population works faster. Earth vignette (city skyline state) advances.
CE: First city hits 50M within existing boundary.
Note: The research time reduction is small and flat (e.g. -3yr on subsequent nodes), not a multiplier. Legible and concrete.

---

**Arcology framework** [EFFICIENCY] [T2]
Time: 25yr
Unlocks: Vertical Megacity done
Effect: dense_living tag unlocked. Venus sky city build time reduced. Mars dome colonist capacity per dome increased. Earth-derived self-contained habitat knowledge transfers directly to off-world design.

---

**Subsurface city expansion** [EFFICIENCY] [T2]
Time: 25yr
Unlocks: Arcology Framework done
Effect: Mars dome radiation shielding improved — underground construction knowledge transfers. Fewer Mercury shielding components needed per dome build.
CE: First people who chose to live below ground. Tone: not dystopian, genuinely their preference.

---

**Planetary resource grid** [EFFICIENCY] [T2]
Time: 20yr
Unlocks: Arcology Framework done
Effect: Small flat research time reduction on future nodes — optimised civilisation frees researcher capacity. Stacks with Vertical Megacity reduction.
CE: Grid prevents first famine before it starts. Visible in history book, not as gameplay event.
Note: Two Architect nodes now grant research time reductions. This is the Architect branch's mechanical identity — Earth as optimised system makes research faster, not more capable.

---

**Neural-digital integration** [IDENTITY] [T3]
Time: 35yr
Unlocks: Planetary Resource Grid done + Fusion Ignition done
Effect: Significant flat research time reduction — extended researcher lifespans mean longer active careers. Architect branch's strongest research time bonus.
CE: Major philosophical CE chain. Naturalist communities push back. Identity-tension CE where the civilisation confronts what this means.
Note: The Naturalist pushback CE fires regardless of the player's branch — this development affects everyone.

---

**Planetary coordination network** [IDENTITY] [T3]
Time: 30yr
Unlocks: Neural-Digital done
Effect: Architect capstone. Earth vignette (city skyline) final state.
CE: "The Question of Purpose" — what do humans do on a planet that no longer needs their decisions? CE chain explores the range of responses: those who find purpose in the colonies, those who turn inward, those who feel displaced. No right answer given.
Note: No mechanical bonus. Explicitly none. This is the Architect civilisational endpoint — Earth as designed system. The CE is the reward.

---

### MOON RESEARCH OUTPOST

Moon = tab inside Earth view. Tracks run from Earth panel.

---

**Closed-loop life support** [CAPABILITY] [T1]
Time: 20yr
Unlocks: Mercury Phase 0 operational
Effect: Required (alongside Dome Habitat Technology) before first Mars dome launch is authorised. Moon outpost proves the model before Mars colonists depend on it.
Note: Co-required with Dome Habitat Technology. Both must complete before colonists ship. Splitting them means two slots are usefully occupied by genuinely different work.

---

**Regolith construction** [EFFICIENCY] [T1]
Time: 20yr
Unlocks: Mercury Phase 0 operational
Effect: Mars dome build time reduced. In-situ material use = fewer component shipments from Mercury. Visible: Mercury dome build queue items reduced before construction begins.

---

**Organism library tier 1** [CAPABILITY] [T1]
Time: 25yr
Unlocks: Mercury Phase 0 operational
Effect: Bio composition interface expands: pioneer bacteria and nitrogen-fixer categories become selectable beyond base default list. Moon outpost's controlled biology experiments are the source data.
Note: The bio composition *interface* is always present once bio phases unlock. This node expands *what's available inside it*, not whether it exists.

---

**Organism library tier 2** [CAPABILITY] [T2]
Time: 30yr
Unlocks: Organism Library Tier 1 done + mars_ocean spillover fires
Effect: Further expands bio interface: decomposers, early plant classes, insect palette selectable. Outcome variance narrows — projections become more reliable. Requires Mars to have standing water before Moon biology can be calibrated for aquatic-adjacent systems.

---

### MARS — PHASE RESEARCH

These nodes follow the PHASE RESEARCH pattern described in Core System above. All optional. Never blocking. Notification fires when phase begins.

---

**Atmospheric dynamics modelling** [EFFICIENCY] [T1] — PHASE RESEARCH
Time: 20yr
Unlocks: Mars Phase 1 (Warming) begins
Effect: Mars Phase 2 (Nitrogen) — reduces Mercury atmospheric processor components needed. Fewer queue items, same outcome. Studied from live Phase 1 atmospheric data.
Notification: "Mars Phase 1 has begun. Research available: Atmospheric Dynamics Modelling. Completing this before Phase 2 will reduce the component load for nitrogen infrastructure."

---

**Super greenhouse optimisation** [EFFICIENCY] [T1] — PHASE RESEARCH
Time: 15yr
Unlocks: SGG factories active on Mars (either variant)
Effect: SGG factory output +20%. Only relevant if player deployed SGG factories. If no factories built, this node competes against nothing useful — slot better spent elsewhere. Player can see this in the unlock condition.
Note: Choice-reactive. Only appears if the player made the relevant choice.

---

**Magnetic field optimisation** [EFFICIENCY] [T2] — PHASE RESEARCH
Time: 20yr
Unlocks: Mars Phase 2 (Nitrogen) begins
Effect: Magnetic shield Phase 3 build time reduced. If L1 shield chosen (Choice A): station-keeping correction events reduced in frequency. Studied from Phase 2's test deployment data.
Notification: fires at Phase 2 start.

---

**Ocean chemistry preparation** [EFFICIENCY] [T2] — PHASE RESEARCH
Time: 20yr
Unlocks: Mars Phase 3 complete
Effect: If Ocean Chemistry Surprise event fires in Phase 4, response options cost fewer Mercury components and recovery is faster. Player informed upfront.
Notification: "We're approaching water delivery. There is a known risk: early oceans on Mars will dissolve surface minerals aggressively, creating saline, slightly acidic conditions. Researching Ocean Chemistry Preparation now will reduce the cost of response if this occurs."
Note: Event mitigation only works if the event fires. Player decides whether the insurance is worth the slot.

---

**Ecosystem succession planning** [EFFICIENCY] [T2] — PHASE RESEARCH
Time: 25yr
Unlocks: Mars Phase 4 (Water) begins
Effect: Bio phase outcome variance narrows — projections become more accurate (smaller range, same expected value centre). Models are better because we studied the oceans as they formed. Complements Organism Library Tier 2.
Note: Framing is competence, not damage reduction. "Our models are more accurate" not "fewer bad things happen."

---

**Cross-planet nitrogen logistics** [REACTIVE] [T2]
Time: 15yr
Unlocks: Mars Phase 2 Choice B active (Venus nitrogen export) + Atmospheric CO₂ Drawdown done
Effect: Reduces Mercury components needed for Mars nitrogen import pipeline. Shared routing knowledge between Venus export and Mars import operations.
Note: Only unlocks if the player chose Venus nitrogen for Mars Phase 2. Choice-reactive. Does not appear otherwise.

---

### VENUS — PHASE RESEARCH

Same pattern as Mars. All optional. Never blocking.

---

**Extreme atmosphere modelling** [EFFICIENCY] [T1] — PHASE RESEARCH
Time: 20yr
Unlocks: Venus Phase 1 (Cooling) begins
Effect: Reduces Mercury components needed for shade mirror positioning corrections during Phase 1. Venus's hostile environment is the best dataset humanity has ever had — studied in real time.
Notification: fires at Phase 1 start.

---

**Vortex engine network theory** [EFFICIENCY] [T1] — PHASE RESEARCH
Time: 15yr
Unlocks: Vortex engines active on Venus
Effect: Vortex engines need fewer Mercury maintenance components over their operational lifespan. Configuration improvements from studying the live network. Only relevant if player deployed vortex engines.

---

**CO₂ sequestration chemistry** [EFFICIENCY] [T2] — PHASE RESEARCH
Time: 20yr
Unlocks: Venus Phase 1 complete
Effect: Phase 2 (CO₂ Removal) — fewer Mercury processing components needed. Choice A (carbonate catalyst): reaction rate improves. Choice B (tank export): compression efficiency improves. Both paths benefit; the mechanism differs.
Notification: fires at Phase 2 start.

---

**Sky city buoyancy engineering** [EFFICIENCY] [T2] — PHASE RESEARCH
Time: 20yr
Unlocks: first Venus sky city established
Effect: Future sky city build time reduced. Increases CO₂ removal threshold before descent warning fires — more margin before the buoyancy decision becomes urgent. Does not remove or delay the decision itself.

---

**Venus ocean chemistry preparation** [EFFICIENCY] [T2] — PHASE RESEARCH
Time: 25yr
Unlocks: Venus Phase 3 complete
Effect: If Ocean Chemistry Anomaly fires in Venus Phase 4, response costs reduced. Venus's version is chemically harsher than Mars — research is harder and takes longer.
Notification: "We're approaching Venus water delivery. Venus's geological history makes early ocean chemistry significantly more aggressive than Mars. Ocean Chemistry Preparation research is available. This will reduce response costs if the anomaly occurs."

---

**Terminator climatology** [REACTIVE] [T2]
Time: 20yr
Unlocks: Wild Venus path chosen + rail city operational
Effect: Terminator Storm Surge event impact reduced. Rail city operations more stable over time. Knowledge built by colonists who actually live in the terminator zone.
Note: Wild Venus exclusive. Does not appear on Europa impact path.

---

### CROSS-PLANET / CIVILISATIONAL

---

**Interplanetary data network** [CAPABILITY] [T2]
Time: 25yr
Unlocks: Mars colony 5,000+ population
Effect: Colony research contribution becomes active. Mars colonists formally contribute to research — reduces time-to-complete on ongoing nodes by a small flat amount. Scales when Venus colonies also established.
CE: First scientific paper co-authored by Earth and Mars researchers.
Note: This is the concrete form of "large colony contributes to research." Not abstract RP. Visible as flat time reduction on active nodes.

---

**Planetary biology cross-reference** [REACTIVE] [T3]
Time: 30yr
Unlocks: Mars Bio II underway + Venus Phase 2 complete
Effect: Venus bio phase outcome variance narrows when Mars bio phases are already running. Living data from one terraformed world informs predictions for the other.
CE: "Our ecologists on Mars have sent us something applicable here." Short CE, high meaning.

---

### POST-V1 — VISIBLE AND NAMED, LOCKED

Full tree is visible from game start. These nodes show name, tier, and unlock condition but are locked until prerequisites met. Designed for V1 visibility; implementation post-V1.

---

**Hunt for life probe programme** [CAPABILITY] [T3]
Time: 35yr
Unlocks: Fusion Drives done
Effect: Targeted probes to outer planet moons. Gates the Hunt for Life discovery arc for outer ring bodies (Europa Clipper was pre-game; this covers Enceladus, Titan ocean, etc.).

---

**Outer ring research stations** [CAPABILITY] [T3]
Time: 40yr
Unlocks: Hunt for Life Probe Programme done + relay station at destination built
Effect: Permanent crewed outposts at outer ring locations. Each generates research contribution. Multiple stations stack. Unlock relay station build queue item on Mercury per destination.

---

**He-3 aerostat mining — Jupiter** [CAPABILITY] [T3]
Time: 30yr
Unlocks: Fusion Drives done + relay station at Jupiter built
Effect: He-3 fuel supply from Jupiter atmosphere. Enables Hardened panel tier production on Mercury (per existing Mercury GDD). Reduces long-range transit costs for outer ring operations.

---

**Solar gravitational lens** [CAPABILITY] [T3]
Time: 45yr
Unlocks: Fusion Drives done + outer ring station established
Effect: Uses sun's gravitational field as telescope lens at ~550 AU focal point. Identifies and characterises exoplanet targets. Gates Seed Ship programme — no confirmed target, no mission.

---

**Seed ship programme** [CAPABILITY] [T3]
Time: 50yr
Unlocks: Solar Gravitational Lens done + confirmed exoplanet target
Effect: Interstellar colony vessels. The endpoint of the Witness vs. Settler arc. Type 3 Gesture milestone (existing GDD). First launch = game's civilisational endpoint.

---

**Stellar engine** [CAPABILITY] [T3]
Time: 60yr
Unlocks: Seed Ships done + Dyson swarm 80%+
Effect: Civilisation-scale megastructure. Moves entire solar system. The most ambitious research node in the game. Mercury's mass driver infrastructure repurposed at civilisational scale.
Note: Requires same Mercury mass driver infrastructure — narrative continuity from game start to game end.

---

## DESIGN NOTES FOR AI CODING TOOLS

- **Colony research slot:** Future design consideration. When colonies reach sufficient population (~50,000+), a third "colony slot" may unlock that runs only specific nodes assigned to that colony. Not a global slot. Requires separate UI. Not in V1. Mark the slot area in Research Hub UI as future-expandable.
- **Phase research notifications:** When a phase begins, a specific notification fires linking directly to the relevant phase research node. Player dismisses and goes to Research Hub. Do not auto-start research — player chooses.
- **Tree visibility:** All nodes always visible. Locked nodes: show name, tier badge, unlock condition, greyed icon. Unlocked nodes: full card, clickable. Active nodes: show progress bar. Completed nodes: checkmark state.
- **Relay stations:** These are Mercury build queue items, not research nodes. Deep Space Power Relay Design (research node) unlocks the build option. One relay station per outer-system destination. Each costs Mercury rare metals + build time. Titan requires one before Phase 2 Choice A (nitrogen extraction) begins.
- **Research time reductions (Architect branch):** Applied as flat year reductions to time-to-complete on all active and future nodes. Stack additively. Keep values small (e.g. -3yr, -5yr, -8yr) to avoid trivialising T3 research in late game. Exact values require balancing pass.
- **"RP" references in old code:** Old system used RP capacity. New system uses 2 fixed slots + time. Any existing RP capacity code should be replaced with the slot system. RP no longer exists as a concept.
