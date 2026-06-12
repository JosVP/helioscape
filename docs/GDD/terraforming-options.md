# HELIOSCAPE — TERRAFORMING PHASES, OPTIONS & EVENTS
## Sub-GDD v5. DEFINITIVE VERSION.
## ⚠️ Supersedes all previous versions (v1–v4) and the Pluto appendix file.
## Feed only this file to AI coding tools. All prior versions are obsolete.

*Caveman-compressed. Per-planet. Per-phase. Science-grounded.*

---

## DESIGN RULES

**Infrastructure always addable. Physical acts are not.**
Paths = first choice, not a cage. Any infrastructure option can be layered onto any previous choice. Only physical irreversibles are locked (see Irreversibles section). Everything else — mirrors, shields, factories, boosts — always available.

**Events sit on top of phases.** Events interrupt, complicate, or assist a phase. They do not replace phase choices. Each phase has a pool of 2–3 possible events. Whether any event fires is RNG. Which event fires (if one does) is also RNG from the pool. This creates unpredictability that differs per playthrough — a quiet phase feels like a small relief; an interrupted one creates tension.

**Event trigger probability: ~65–70% chance of one event per phase.** Never more than one event per phase. Events fire only within the first 60–65% of a phase to avoid late-phase awkwardness.

**Event impact = percentage-based, not fixed years.**
- Handled well (fast response): ~10–15% phase extension or minor component cost
- Partially handled (slower response): ~20–30% extension or moderate cost
- Ignored / time expired: ~40–60% extension or significant damage
- No reversals of completed progress. Delays and damage only.

**Dialog timer rule.** Time does not pause during event dialogs. Response window shown as countdown bar on dialog. "Handled well" option greys out first, then "partially handled", leaving "ignored" as auto-default if timer expires. Setback always applies going forward from event trigger — never retroactively.

**Event mix: ~70% negative, ~30% positive or neutral-choice.** Planets feel alive, not just hostile.

---

## ENERGY & MANUFACTURING REALITY

Dyson panel production begins at Mercury Year ~20. At Year 20: effectively 0% Dyson. Rough trajectory:

| Game Year | Dyson % | Practical implication |
|---|---|---|
| 20 | ~0% | Production just starting |
| 40–60 | 0.01–0.5% | Early trickle |
| 80–120 | 1–5% | Scaling phase |
| 150+ | 5–20% | Industrial capacity |

Power is never the early bottleneck. **Mercury manufacturing throughput is always the constraint.** Dyson energy becomes the enabler for mid-game processes: atmospheric processors, vortex engines, electrochemical platforms, long-range power beaming to Titan.

---

## DYSON PANEL SHADE — VENUS

To shade Venus, panels repositioned from Mercury orbit (0.39 AU) to Sun-Venus L1 (~0.72 AU). At 0.72 AU panels receive ~30% of Mercury-orbit solar flux — still generate and transmit at reduced yield. Repositioning = ~70% output loss per diverted panel. No new hardware; real ongoing Dyson output cost. Slider mechanic in HUD: player sets % allocation, cooling curve and Dyson output update in real time. Fully reversible at any time.

---

## JOVIAN MOON DECISIONS — OVERVIEW

Three Galilean moons available as major strategic resources. Titan is NOT moved — too massive, resource profile doesn't justify inner-system transit. Titan stays at Saturn; nitrogen extracted there in place via automated factories.

**Moon assignment (one per planet maximum):**
- **Europa** → Venus crash only (spin-up + water, moon destroyed)
- **Ganymede or Callisto** → Mars orbit (player chooses; captured, permanent sky moon, water extracted gradually)
- **Remaining Ganymede/Callisto** → Venus orbit (only if Wild Venus chosen — no Europa crash; captured, sky moon, water extracted)
- Mutual exclusion: Europa to Venus = cannot go to Mars. Ganymede to Mars = Callisto available for Venus or untouched.

**Transit timing — critical mechanic:**
Redirecting a Jovian moon takes 20–40 years from commit to arrival (gravity assist to escape Jupiter + interplanetary transit + orbital capture). **Commit decision must be made during the previous phase** so the moon is in transit while that phase runs, arriving ready for water phase.

- Mars moon redirect: commit during Phase 2 (Nitrogen) or Phase 3 (Magnetic Protection)
- Venus moon redirect: commit during Phase 2 (CO₂ Removal)
- Late commit: moon arrives mid-water phase. Asteroid belt redirects fill gap automatically. No hard failure, slightly slower start.
- No commit: asteroid belt water delivery only.

**Moon comparison:**

| Moon | Diameter | Ice content | Radiation env. | Hunt for Life | Sky character |
|---|---|---|---|---|---|
| Europa | 3,122 km | ~2× Earth's oceans | High (inside belts) | High | Brilliant white, cracked ice |
| Ganymede | 5,268 km | ~55× Earth's oceans | High (inside belts) | Moderate | Bright, light/dark patches, own magnetosphere |
| Callisto | 4,820 km | ~40× Earth's oceans | Low (outside belts) | Low | Dark, ancient, heavily cratered |

All three have far more water than either Mars or Venus needs. Even 2–5% of any one moon's ice shell is sufficient for full ocean coverage.

**Water delivery mechanics — how ice gets from moon to planet:**

*Europa → Venus crash:* No extraction. Water delivered via impact. Uncontrolled global distribution. Moon destroyed.

*Captured moon (Mars):* Mass driver on moon surface (Ganymede/Callisto surface gravity = 13–15% of Earth's — cheap to launch). Ice blocks mined and launched at Mars. Ablates during atmospheric entry or impacts surface directly at chosen locations. Moon stays permanently.

*Captured moon (Venus):* Same mass driver approach. Venus has substantial nitrogen atmosphere by this phase (~3 bar post-CO₂ removal) — incoming ice ablates completely before surface, delivering atmospheric water vapour that eventually rains down. No surface impacts needed. Moon stays permanently.

*Ganymede vs Callisto:* Callisto sits outside Jupiter's radiation belts — significantly safer to operate equipment, lower maintenance. Ganymede has its own magnetosphere — EM complexity, interesting interaction with Mars's magnetic protection. Callisto is the cleaner engineering choice; Ganymede the more dramatic.

---

## MARS — TERRAFORMING PHASES

---

### PHASE 1 — WARMING / ATMOSPHERIC THICKENING

*Goal: raise pressure from ~0.006 atm toward ~0.5–1 atm. Liberate O₂, CO₂, water from rock and ice. Raise mean surface temp above 0°C. Resulting atmosphere will be ~100% O₂ — flammable, unbreathable. Phase 2 corrects this.*

**CHOICE A — Orbital Laser Arrays**
Solar-pumped arrays built at Mercury, mass-driver deployed to Mars orbit. Thermolysis melts surface rock above ~4000°C. ~750 kg O₂ + CO₂ per m³ melted. Polar ice vaporises into steam clouds. Lava fields, ash-snow, lightning. Most dramatic visual arc. Arrays reusable for Titan nitrogen extraction after phase ends.

- Base timeline: 60–80yr
- Colonists: underground or orbital habitats only. Surface uninhabitable during operation.

**CHOICE B — Statite Mirror Array**
Orbital reflectors concentrate sunlight on surface. Gentler heat, no thermolysis. Greenhouse cascade and polar sublimation. Surface survives intact. Early dome settlements feasible.

- Base timeline: 90–120yr
- Mirrors repositionable later: shade, day/night targeting, specific geology focus.

**CHOICE C — Polar Nuclear Detonations**
High-altitude thermonuclear detonations above poles. Fast atmospheric shock trigger. Even total polar liberation only raises pressure to ~15 mbar — far below target. Detonations start the cascade; full thickening still needs decades.

- Base timeline: detonation campaign 5–10yr + cascade 40–55yr = ~45–65yr total
- Thermonuclear (fusion) weapons: much lower fallout than fission
- Long-lived isotopes (Cs-137 ~30yr half-life, Sr-90 ~29yr): ~100–150yr to safe levels at poles
- Global contamination: low-level; dome colonisation viable elsewhere within 5–10yr post-detonation
- Polar surface: inaccessible ~100–150yr. Clean polar water unavailable until then.
- CE chain: fallout monitoring, pole exclusion zone, fossil site and clean polar water events delayed ~150yr but high payoff

---

**BOOSTS — Phase 1**

*Super Greenhouse Gas Factories (SGGF)*
Manufacture CF₄, SF₆ on Mars surface. 10,000–23,000× warming power vs CO₂. Most energy-efficient warming method in scientific literature. Dyson-powered; Mercury surface components. 10–20yr acceleration on reaching target temperature. Compatible with all paths. Reversible: factories shut down, gases dissipate over centuries.

*Polar Albedo Darkening*
Spread dark particulate (carbon black) on polar ice. Lowers reflectivity, accelerates sublimation. Low Mercury cost. 5–10yr acceleration on warming start. Only useful with A or B — irrelevant for C.

---

**EVENT POOL — Phase 1**

*[A] Beam Degradation Feedback (negative)*
The atmosphere the lasers are creating increasingly scatters their own beams. Mid-phase: penetration efficiency drops ~30%. Options: increase array power draw (Dyson cost, no delay) / accept reduced efficiency (10–15% extension) / begin soil-prep rotation early (different Mercury component type). Self-defeating feedback — a natural consequence of the path's own success.

*[B] Global Dust Storm (negative)*
Mars dust storms can cover the entire planet for months to years (real: 2018 event lasted 8 months). Increases surface albedo, directly counteracting mirror warming. Options: wait it out (moderate delay, storms can recur each Martian year) / SGGF thermal compensation (Mercury queue) / expand mirror array (Dyson + component cost). Storms can recur on this path.

*[C] Volcanic Sulphur Cascade (negative, echoes forward)*
Seismic activity from detonations reactivates major volcanic features. SO₂ released into forming atmosphere mixes with water vapour → sulphuric acid compounds. Doesn't harm Phase 1, but creates a chemistry complication: Phase 2 atmosphere needs SO₂ scrubbing before breathable. Adds minor conditional component cost to Phase 2 regardless of nitrogen choice.

*[A/B/C] CME Strike (negative)*
If magnetic protection not yet active: major CME damages orbital infrastructure (arrays or mirrors). 15–30% output loss; replacement queue from Mercury required. Also strips 5–10% of any atmosphere already built. Primary mechanical incentive to prioritise magnetic protection. If protection is active: deflected cleanly.

*[A/B/C] Subsurface Volatile Pocket (positive)*
Seismic or drilling data reveals large subsurface CO₂/water reservoir. Option: trigger early release (5–10% phase acceleration, but planned colony location at that site becomes geologically unstable — must shift) or leave sealed (no benefit, no risk). Player chooses.

---

### PHASE 2 — NITROGEN IMPORT

*Goal: dilute ~100% O₂ atmosphere with N₂ toward 21% O₂ / 79% N₂.*

**CHOICE A — Titan Nitrogen Strip** *(irreversible)*
Titan stays at Saturn — it is NOT moved. Automated factories launched from Mercury as unmanned component packages (~7–10yr transit). Factories + mass driver on Titan compress and launch nitrogen tanks toward Mars (~3–4yr transit per package). Pipeline takes time to establish; once running it is continuous. Powered by Dyson long-range beaming (viable at ~5%+) or local solar collectors on Titan.

If Phase 1 Choice A (laser arrays) used: arrays can be redeployed to power Titan factories, shortening Phase 2 timeline by ~10–20yr.

- Base timeline: 30–50yr once pipeline running (add ~10yr for factory transit/setup)
- Irreversible: Titan atmosphere permanently removed. Titan terraforming locked forever.

**CHOICE B — Venus Nitrogen Export** *(cross-planet dependency)*
Venus's atmosphere after CO₂ removal is mostly nitrogen at ~3× Earth's atmospheric pressure — far more than Venus needs for an Earth-like atmosphere. Venus exports this surplus via mass driver to Mars. Both planets benefit: Mars gets needed nitrogen, Venus solves its excess nitrogen problem simultaneously.

Requires: Venus must be in or past its Phase 2 (CO₂ Removal) to have exportable surplus. Strategic incentive to synchronise both planetary timelines. The Kurzgesagt Mars transcript references this directly: "it would be much more convenient to have nitrogen left over from terraforming Venus on the side."

- Base timeline: 40–70yr depending on Venus phase progress and mass driver capacity
- Titan preserved. Cross-planet narrative interdependence.

**CHOICE C — Regolith Extraction**
Mars regolith contains nitrogen compounds. Surface atmospheric processors extract and release N₂ gradually. Fully independent — no other planet or moon involved.

- Base timeline: 80–120yr
- Dyson-powered processors + Mercury component queue
- Titan and Venus unaffected

---

**MOON REDIRECT WINDOW — Phase 2**
Recommend committing to Jovian moon redirect during this phase. Moon will be in transit ~20–40yr while Phase 2 runs, arriving ready for Phase 4.

---

**BOOST — Phase 2**

*Accelerated Processor Array*
Additional surface processors. Choice C only. Mercury component cost. Linear throughput increase.

---

**EVENT POOL — Phase 2**

*[A] Titan Seasonal Storm (negative)*
Titan's hydrocarbon weather is tied to Saturn's ~29yr year. Mid-phase: major storm season reduces factory output ~40%. Options: reinforce factories (Mercury components, small delay) / reroute to secondary extraction zones on Titan (moderate delay, no cost) / ride it out (longer delay). Predictable in-universe — player was warned this season was coming. Unavoidable, only mitigable.

*[B] Venus Supply Disruption (negative)*
Venus's mass driver capacity gets temporarily redirected for a Venus-side logistics event. Nitrogen supply to Mars slows or halts for a period. Options: bridge with temporary Titan extraction supplement (small Mercury launch, fills gap) / wait for Venus capacity to restore (moderate delay). Cross-planet dependency creates a new event class: problems on one planet affecting the other.

*[C] Processor Sinkhole (negative)*
Large-scale subsurface extraction creates voids in the regolith. A network of processors in one region subsides. Infrastructure damaged; extraction rate drops. Options: relocate processor network to new site (Mercury components + moderate delay) / reinforce current site (higher Mercury cost, faster recovery). Scratch the version from v2 that mentioned this happening beneath colonies — processors are in uninhabited extraction zones.

*[A/B/C] Nitrogen Sink Discovery (positive)*
Unexpected mineral formations in Mars's upper crust are absorbing newly released nitrogen. A natural sink is partially neutralising Phase 2 progress. Could be bad — or options: study it (small research bonus, minor delay) / disrupt the formations to release nitrogen (small acceleration) / leave it (minor ongoing reduction in effective N₂ accumulation rate). First instance of Mars's geology actively interacting with the terraforming process.

---

### PHASE 3 — MAGNETIC PROTECTION

*Addable at any phase. Earlier = better. Each 50yr unshielded after atmospheric completion: ~2–5% atmospheric loss to solar wind. Not catastrophic short-term; accumulates. Narrator acknowledges delay if player waits.*

**CHOICE A — L1 Electromagnetic Shield**
Superconducting ring at Sun-Mars L1. Deflects solar wind upstream. Full planet coverage. No Mars surface construction. Continuous Dyson power draw — no fusion threshold required. L1 is an unstable Lagrange point (23-day station-keeping cycle); requires ongoing minor correction.

- Build timeline: ~20–25yr

**CHOICE B — Equatorial Charged Particle Ring**
Superconducting loop in Mars equatorial orbit. Toroidal magnetosphere. More robust. No L1 drift. Larger Mercury investment. Same Dyson power requirement. Generates low-level EM interference with early surface electronics during initial operation — surface infrastructure shielding upgrade required (minor Mercury cost, one-time).

- Build timeline: ~30–35yr

---

**EVENT POOL — Phase 3**

*[A] L1 Station Drift (negative)*
An unusually strong solar wind period pushes the shield off L1 position. Protection lapses temporarily. Atmosphere strips a small percentage. Options: emergency correction burn (Mercury fuel cost, brief gap accepted) / deploy backup positioning thrusters (higher Mercury cost, gap minimised). Confirms why monitoring is required.

*[B] Magnetic Resonance Anomaly (negative)*
As the equatorial ring energises, unexpected resonance frequencies interact with Mars's subsurface ferrous deposits. Minor surface vibrations damage fragile early measurement equipment in one region. Options: recalibrate ring frequency (small delay in full protection) / reinforce affected surface equipment (Mercury components). One-time event; ring is stable after recalibration.

*[A/B] CME During Construction Gap (negative)*
If protection not yet active and a major CME strikes: atmosphere strips 5–15%. The most impactful negative consequence in the game for deferring this phase. Hard incentive to prioritise protection. If protection is active and a CME event is rolled: deflected cleanly — becomes a positive CE (narrator: "the shield held").

*[A/B] Deep Core Reading (positive)*
Magnetic field deployment reveals previously undetected data about Mars's deep interior. Partially molten regions identified. Potential future geothermal drilling sites flagged. Small research bonus; geothermal drilling becomes available as an Always Available infrastructure option. No cost, no delay.

---

### PHASE 4 — WATER DELIVERY

*Moon should already be in Mars orbit from commit made in Phase 2.*

**CHOICE A — Captured Jovian Moon (Ganymede or Callisto)**
If committed during Phase 2 window, moon is in Mars orbit when this phase begins. Mass driver on moon surface mines ice and launches packages at Mars. Ice ablates in atmosphere or impacts at chosen surface locations. Gradual, controlled, directional. Moon stays permanently after phase ends.

*Slider mechanic:* player sets extraction rate. Higher rate = faster oceans, more Dyson draw. Projected ocean coverage shown as a range (composition varies across moon surface). Outcome varies within range. Player can adjust rate throughout phase. Moon barely shrinks in size; surface appearance changes dramatically: excavation scars, two-tone texture.

- Base timeline: 40–80yr depending on extraction rate and target coverage

*Moon in Mars sky at ~400,000 km:*

| Moon | Angular size vs Moon | Brightness vs Moon | Tidal effect vs Earth-Moon |
|---|---|---|---|
| Ganymede | ~1.5× | ~2× | ~1.4× |
| Callisto | ~1.4× | Dimmer | ~1.4× |

Orbit initially elliptical — varies between closest approach (maximum tides, larger disc) and farthest point. Circularisation infrastructure available as Always Available upgrade. Orbital period ~10–12 Earth days.

**CHOICE B — Asteroid Belt Ice Redirects** *(always available, no commit window)*
Multiple C-type asteroids (~10% water by mass). No life implications. Controllable rate.

*Slider mechanic:* set number of redirected asteroids. Projected water coverage shown as range (e.g. "35–65% surface coverage"). Actual outcome varies — composition differs between bodies. Below expected: queue additional redirects (new range, overshoot risk). Overshoot: higher sea levels, some planned coastal sites flooded — not catastrophic, reshapes available land. Each redirect = small Mercury launch package.

- Base timeline: 60–100yr for full coverage
- Can run in parallel with Choice A to supplement delivery rate

---

**EVENT POOL — Phase 4**

*[A] Moon Trajectory Correction (negative)*
Mid-transit or during early orbital operations: gravitational interaction creates a trajectory deviation or orbital resonance issue. Correction burn required. Mercury fuel cost. Small delay if handled. Ignored: significant orbital deviation, large correction later, moderate delay.

*[A] Unexpected Excavation Instability (negative)*
Ice extraction opens a large sub-surface void in the moon that causes a regional collapse. Extraction rate from that region drops until equipment is repositioned. Options: reroute extraction operations to new moon region (Mercury component cost, small delay) / accept reduced extraction rate (phase extends 15–20%).

*[B] Composition Mismatch (negative)*
Several redirected asteroids turn out to be M-type misclassifications (metal-rich, minimal water). Delivery below projection — pushes toward low end of estimated range. Options: queue additional redirects (new roll, overshoot risk) / accept lower ocean coverage (bio phase begins with less water, restricted starting conditions).

*[A/B] Ocean Chemistry Surprise (negative)*
Early accumulated water dissolves surface minerals from Mars's altered lava plains more aggressively than modelled. Initial oceans are more saline and slightly acidic. Bio phase starting conditions impacted — fewer pioneer organisms can tolerate early ocean chemistry. Options: deploy mineral buffering compounds (Mercury components, normalises chemistry, bio phase starts normally) / accept restricted pioneer palette (bio phase begins with fewer organism options, eventually recovers). Scientifically: early planetary oceans are typically more mineral-rich than mature ones.

*[A/B] Inland Sea Discovery (positive)*
Water accumulates in a previously uncharted low terrain basin, forming an unexpected large inland sea ahead of schedule in a geologically interesting area. CE: early colonists discover the unplanned sea. Narrative debate about settlement plans. Small bonus: inland sea location becomes premium settlement site.

---

## VENUS — TERRAFORMING PHASES

---

### PHASE 1 — COOLING

*Goal: reduce surface from 460°C to below ~30°C (CO₂ liquefaction point at high pressure). No other phase can begin until sub-100°C. Must block incoming solar energy.*

**CHOICE A — Dedicated Shade Mirror**
Segmented foil mirror structure deployed to Sun-Venus L1. Built at Mercury, mass-driver launched. No Dyson output cost. Segments modular — can be modulated later for day/night illumination (see Always Available). Major upfront Mercury component investment.

- Build + deploy: 10–15yr (Mercury throughput limited)
- Cooling to CO₂ rain: ~60–80yr post-deployment

**CHOICE B — Dyson Panel Redeployment**
Redirect fraction of Dyson panels from Mercury orbit to Sun-Venus L1. ~30% output per panel at 0.72 AU. No new hardware; real Dyson output cost. HUD shows output drop + cooling curve. Reversible at any time.

- Available from: Year ~20+
- Cooling to CO₂ rain: ~70–90yr
- Ongoing cost — not a one-time decision

*A and B combinable. Mirror handles base shade; panels accelerate. Additive.*

---

**BOOST — Phase 1**

*Vortex Engines*
Atmospheric circulation generators deployed at ~50km altitude. Redistribute trapped surface heat upward, accelerating radiative cooling. Do NOT remove CO₂ — cooling only. Dyson-powered continuous operation. 10–20yr acceleration. Significant Mercury component cost. Can carry into Phase 2 if built here.

---

**EVENT POOL — Phase 1**

*[A] Sulphuric Acid Corrosion (negative)*
Venus's concentrated acid clouds become more reactive as upper atmosphere cools. Acid damages shade mirror positioning satellite network — multiple segments drift off-axis, reducing effective shade coverage. Options: replacement positioning drones from Mercury (component cost, small delay) / accept reduced coverage efficiency (moderate delay) / supplement with Dyson panel shade while mirror is repaired (temporary output cost, maintains timeline).

*[B] Uneven Cooling Hot Spots (negative)*
Panel array gaps leave patches of full solar flux reaching Venus. Massive convective columns form — super-rotation wind amplification. Damages lower-orbit infrastructure if electrochemical platforms deployed early. Hot spots slow cooling unevenly. Options: add shade mirror segments to fill gaps (partial Choice A cost, reduces delay significantly) / accept chaotic early CO₂ rain in patches (extends Phase 2, asymmetric pressure changes) / recluster panels for better uniformity (partial efficiency loss, better coverage).

Colonist note: if sky cities are established during Phase 1, cities in hot spot regions experience elevated cooling costs and comfort penalties until phase completes.

*[A/B] Volcanic Outgassing Surge (negative)*
Deep Venus volcanoes, partially destabilised by surface temperature changes, release a surge of CO₂ and SO₂. Counteracts cooling progress in affected atmospheric columns. Options: accelerate shade coverage in those regions (Dyson or Mercury cost) / deploy vortex engines early to push the outgassed material upward (Mercury cost, boots Phase 1 and Phase 2 simultaneously) / accept local setback (moderate phase extension in affected areas).

*[A/B] Unexpected Thermal Stratification (positive)*
A stable cool layer forms at ~65km altitude significantly ahead of schedule. Sky city construction window opens early — first habitable Venus altitude confirmed earlier than projected. No cost. CE trigger: first sky city feasibility confirmed. Early colonisation bonus.

*[A/B] Cooling Cascade Acceleration (positive)*
A feedback loop in upper atmosphere chemistry creates faster-than-modelled radiative cooling. Phase accelerates by 10–15% with no player action required. CE: atmospheric scientists publish revised timeline projections. Colonist mood event.

---

### PHASE 2 — CO₂ REMOVAL

*Goal: remove or sequester liquid/solid CO₂ formed after cooling. ~465 million billion tons total. Target ~0.1–0.3 atm residual. Remaining atmosphere after removal: mostly nitrogen at ~3× Earth's atmospheric pressure. This surplus nitrogen is exportable to Mars (feeds Mars Phase 2 Choice B). Venus does NOT need to import nitrogen.*

**CHOICE A — Carbonate Catalyst Seeding** *(Naturalist)*
Ca/Mg compounds mined on Mercury, mass-driver launched to Venus. React with CO₂ forming stable solid carbonates. CO₂ permanently locked in rock. Carbonates can be exported to Mars (rocket fuel / construction material).

- Base timeline: ~70–80yr (chemistry-limited)
- Byproduct: carbonate export UI flag triggers Mars-side CE and small Mars production bonus
- CO₂ permanently locked — no re-release risk

**CHOICE B — CO₂ Tank Depot Export** *(Architect)*
Surface mass drivers compress liquid CO₂ into sealed pressurised tanks. Tanks launched to Venus L2 depot orbit. Fleet of tanks accumulates — not a gas cloud. A physical constellation of storage containers, trackable in UI as a resource.

Stored CO₂ is routable: to Mars (atmospheric supplement / propellant), held for future use, or eventually used as rocket fuel. Excess nitrogen removed via the same mass driver method — route to Mars or storage.

- Base timeline: ~55–70yr (Dyson-accelerated compression)

*After either choice:* remaining Venus atmosphere is mostly nitrogen at ~3 bar. Venus exports nitrogen surplus during or after this phase.

---

**MOON REDIRECT WINDOW — Phase 2**
Venus moon redirect (Ganymede or Callisto, if Wild Venus chosen) should be committed during this phase. Moon arrives in time for Phase 4.

---

**BOOSTS — Phase 2**

*Electrochemical Atmosphere Processing*
Unmanned platforms at ~50km altitude. Dyson-powered electrolysis: CO₂ → C + O₂. Carbon precipitates as solid material; O₂ stays in atmosphere, seeding early oxygen content ahead of bio phase. Requires Dyson ~15%+. Mercury platform components + Dyson draw.

*Vortex Engines (continued or new)*
If built in Phase 1, continue. Can be built fresh here. Redistributes heat, accelerates pressure-drop cascade.

---

**EVENT POOL — Phase 2**

*[A] Exothermic Reaction Hot Zones (negative)*
Ca/Mg + CO₂ reactions concentrate in certain geological zones, creating localised surface heat that counteracts cooling progress in those areas. Options: divert seeding away from hot zones (asymmetric removal, different coastline topology later) / targeted Dyson shade boost to hot zones (output cost) / vortex engines to those regions (Mercury cost, targeted fix). Hot zone locations become mineral-rich settlement sites later.

*[B] Tank Seal Failure Cascade (negative)*
A batch of CO₂ tanks in depot orbit suffers seal failures under sustained thermal stress. Batch lost — CO₂ vents locally, briefly re-entering Venus upper atmosphere. Options: replace failed batch (Mercury components, small delay) / reroute operations to unaffected depot sectors (maintains rate, partial gap in storage).

*[A/B] Unexpected Subsurface CO₂ Reservoir (negative)*
A large subsurface pocket of CO₂ — trapped during Venus's geological history — ruptures during surface operations. A significant quantity of CO₂ re-enters the atmosphere in one region, locally reversing removal progress. Options: targeted seeding/export to address the pocket (Mercury cost, moderate delay) / isolate and seal the area for later controlled release (no delay, site flagged for future operation) / accept setback (notable phase extension in affected region).

*[A/B] Geological Survey Bonus (positive)*
Automated surface probes working during CO₂ removal discover unusually rich mineral deposits exposed by the receding atmospheric pressure. New resource cache identified on Venus surface. Small permanent bonus to Venus-based manufacturing in later phases. No cost or delay.

*[A/B] Early Nitrogen Separation (positive)*
Atmospheric chemistry separates nitrogen from remaining CO₂ compounds faster than modelled in one high-altitude layer. Nitrogen export to Mars can begin slightly earlier than projected. If Mars Phase 2 Choice B is active: bonus acceleration to Mars nitrogen import rate. Cross-planet positive event.

---

### PHASE 3 — ROTATION / SPIN DECISION

*Must commit BEFORE water delivery phase. Once oceans form, no spin-up option is viable — impactors through ocean water cause catastrophic global tsunamis. Decision window: Phase 2 start through Phase 4 start.*

*If Choice B (Europa): commit during Phase 2 or early Phase 3. Transit 20–40yr. Europa arrives as spin phase settles.*

**CHOICE A — Wild Venus (No spin-up)**
Accept ~243-day slow rotation. Terminator zone habitation. Moving rail cities or stationary terminator infrastructure. Sunny side: hot but manageable with shade management. Dark side: frozen. Terminator band: the liveable strip. Day/night orbital mirrors always addable later.

- No infrastructure cost for this phase
- CEs: Cities of the Terminator, Two-Year Rail Journey, The Light at the Edge

**CHOICE B — Europa Impact** *(irreversible)*
Europa redirected from Jupiter via gravity assist. Commit during Phase 2 or early Phase 3 — transit 20–40yr. Arrives during Phase 3.

- Result: Venus day improves from ~243-day retrograde to roughly 15–40 Earth day equivalent. Not Earth-like, but dramatic improvement. Terminator still exists but moves faster.
- Spin direction: prograde impact geometry gives forward rotation. Forwards vs. backwards spin: mostly aesthetic — Coriolis reverses, sun rises from different direction. No major gameplay impact.
- Water: Europa delivers enormous volume. Phase 4 water delivery bundled — no separate water phase needed for Europa path.
- Must commit before Year 100 (geometry window closes permanently).
- Irreversible: redirect commit. Ice shell removal exposes subsurface ocean. Hunt for Life consequence — player may never learn what was there. Ambiguity is intentional.
- Moon destroyed — no Europa sky moon for Venus. No mutual use with Mars water path.

---

**EVENT POOL — Phase 3**

*[A] Terminator Storm Surge (negative)*
Atmospheric pressure gradient between hemisphere extremes creates a violent storm front at the terminator band. Temperature differential larger than modelled. Rail city infrastructure (if already established) takes damage. Options: reinforce rail structures (Mercury components) / temporarily reduce colony footprint (lower colonist capacity, no cost) / accept damage (ongoing maintenance cost for that city). Unique to Wild Venus path — the terminator is always a contested environment.

*[A] Microclimate Discovery (positive)*
Atmospheric monitoring finds an unusually stable microclimate in a specific terminator band region — temperature variance lower than average, wind patterns more consistent. Ideal early settlement location. CE: colonists establish first permanent terminator city ahead of schedule. No cost.

*[B] Europa Transit Perturbation (negative)*
Mid-transit: gravitational interactions with asteroid belt or other Jovian moons create a trajectory deviation requiring correction. Mercury fuel cost. Small delay if handled promptly. Ignored: larger deviation, significant correction cost, moderate delay. Does not threaten the mission — only adds friction.

*[A/B] Atmospheric Stabilisation Ahead of Schedule (positive)*
Venus's atmosphere, now mostly nitrogen with trace compounds, reaches a stable equilibrium state earlier than projected. Phase transition is cleaner; certain Phase 4 preparation steps can begin earlier. Small bonus to Phase 4 starting conditions regardless of which path was chosen.

---

### PHASE 4 — WATER DELIVERY

*Choice B (Europa impact) players: water delivery bundled with Phase 3. This phase applies only to Choice A (Wild Venus) players.*

**CHOICE A — Captured Jovian Moon (Ganymede or Callisto)**
If committed during Phase 2 window, moon is in Venus orbit when this phase begins. Mass driver on moon mines ice and launches packages toward Venus. Venus's nitrogen atmosphere (~3 bar by this phase) causes complete ablation before surface — ice becomes atmospheric water vapour naturally. No surface impacts needed. Gradual, controlled. Moon stays permanently.

*Slider mechanic:* extraction rate set by player. Projected ocean coverage shown as range. Actual outcome varies with composition. Player adjusts rate throughout phase.

- Base timeline: 40–80yr depending on rate

*Moon in Venus sky at ~400,000 km:*

| Moon | Angular size vs our Moon | Notes |
|---|---|---|
| Ganymede | ~1.5× | Bright, distinct surface markings |
| Callisto | ~1.4× | Dim, dark, ancient texture |

Venus has never had a natural moon. Any captured moon is historically unprecedented. Significant cultural CE chain.

Orbit initially elliptical. Circularisation available as Always Available upgrade.

**CHOICE B — Asteroid Belt Ice Redirects** *(always available)*
Same slider mechanic as Mars Phase 4. C-type asteroids, controlled RNG on water coverage. No life implications. Can supplement moon delivery or replace it entirely.

- Base timeline: 70–110yr

---

**EVENT POOL — Phase 4**

*[A] Moon Trajectory Correction (negative)*
Same as Mars Phase 4 equivalent. Correction burn required. Mercury fuel cost. Small delay if handled.

*[B] Composition Mismatch (negative)*
Same as Mars Phase 4 equivalent. Some asteroids below projected water content, pushing outcome toward low end of range.

*[A/B] Venus Ocean Chemistry Anomaly (negative)*
Early Venus oceans dissolve surface minerals aggressively — Venus rock is rich in compounds that create acidic, mineral-saturated initial oceans. More extreme than Mars equivalent (Venus's geological history is different). Bio phase starting conditions impacted. Options: deploy mineral buffering compounds (Mercury components, normalises chemistry) / accept restricted pioneer organism palette for bio phase (eventually recovers, but slower bio phase start) / wait for natural buffering (phase extends ~20%). Scientifically: early planetary oceans are typically more chemically aggressive than mature ones.

*[A/B] Continental Formation Surprise (positive)*
Water accumulation reveals a previously submerged continental shelf structure that forms a natural archipelago ahead of schedule. First Venus island chain above water. CE: colonists name the first island. High cultural weight. Premium settlement site identified.

*[A] Extraction Depth Discovery (positive)*
Deep ice mining on the captured moon reveals a subsurface layer of unusually pure water ice — higher yield than the surface composition projected. Extraction rate exceeds the high end of the projected range. Player gets more water than expected. Minor risk of overshoot on ocean coverage; player can throttle back extraction rate.

---

## EUROPA — VENUS IMPACT DETAILS

*Applies only if Venus Phase 3 Choice B taken.*

Europa diameter: 3,122 km (~46% of Mars diameter, ~90% of Earth's Moon).
Europa albedo: 0.67 — 5.5× more reflective than our Moon but Mars receives 43% of Earth's solar flux; net brightness from Venus at similar distances is ~2.4× our Moon.
Water content: ~2× Earth's total ocean volume.

Impact delivers: angular momentum (partial Venus spin-up, ~15–40 Earth day equivalent) + enormous water volume distributed globally. Some water lost to space during impact; majority retained and rains out over subsequent decades. Moon destroyed. No Europa sky moon for Venus. Hunt for Life consequence unresolved in-game. Ambiguity intentional — player may never know what was in the ocean. Confirmed or denied only by community discovery or second playthrough.

---

## CAPTURED MOON — MARS DETAILS (Ganymede or Callisto)

Europa is NOT an option for Mars capture — it is the Venus crash option exclusively.

**At ~400,000 km Mars orbit:**
- Ganymede: angular size ~0.74° (~1.5× our Moon). Moderately bright. Own magnetosphere — minor EM interaction with Mars's magnetic protection infrastructure.
- Callisto: angular size ~0.69° (~1.4× our Moon). Dimmer, darker. Operationally simpler.
- Tidal effect both: ~1.4× Earth-Moon tides. Manageable. Coastal settlements viable with elevated construction. Strong tidal events = recurring CE material.
- Brightness both: ~2× our Moon from Mars. Noticeable but not disruptive to sleep or circadian rhythms at this distance. Full-Europa-equivalent events (~8× Moon brightness) are avoided at 400,000 km.
- Orbit: initially elliptical. Closest approach = stronger tides, larger disc. Circularisation available.

**Harvesting:**
Ice shell mining (~15–25 km depth on ~2,500 km radius body) = ~1% radius removed. Size visually unchanged. Surface appearance transforms: excavation zones, two-tone texture of dark exposed rock + remaining ice patches.

**Cultural events (both moons):**
- *First light:* colonists see new moon. Large, scarred, clearly artificial-looking. Bittersweet. CE tone: quiet arrival, not triumph.
- *Children who don't remember:* second-generation CE. Younger colonists grew up with this moon — it is simply their moon. Cultural movement to rename it.
- *Tidal shore:* first coastal settlement observes strong tidal patterns. Scientific and poetic. CE.
- *What was in the ocean* (Ganymede only): if Ganymede's Hunt for Life scan was incomplete before redirect committed, late CE surfaces the unresolved question. No answer given.

---

## ALWAYS AVAILABLE OPTIONS

*Not tied to a specific phase. Available once prerequisites met. Implement as separate UI category — "Ongoing Infrastructure."*

**Venus — Day/Night Orbital Mirror Array**
After CO₂ removal (Phase 2) complete: deploy orbital illumination mirrors providing controlled day/night lighting to Venus surface. Creates functional day/night cycle without relying on rotation.

- Prerequisite: Phase 2 complete
- Mercury component cost: significant separate production
- Eliminates terminator zone dependence. Opens full Venus surface.
- Shade mirror interaction: if Phase 1 Choice A (dedicated shade mirror) was built, its segments can be modulated on a rotation — partially contributing to day/night illumination. Reduces new mirror requirement. Player discovers as engineering option.

**Venus — Dyson Shade Adjustment**
Adjust % of Dyson panels at Venus L1 at any time. Slider. Instantly reversible. No Mercury cost. Decisions logged in history book.

**Mars — Magnetic Protection**
Addable at any phase. See Phase 3 Mars. Delay cost: gradual atmospheric loss (~2–5% per 50yr unshielded post-atmospheric completion).

**Mars — Super Greenhouse Gas Factories**
Addable during or after Phase 1. See Phase 1 boost.

**Mars — Moon Orbit Circularisation**
After captured Jovian moon established in Mars orbit: thruster package or mass driver system on moon gradually circularises orbit over years. Smooths tidal variation and brightness cycling. Reduces close-approach event frequency. Optional. Mercury components.

**Mars — Phobos Decision**
Mars has two tiny natural moons: Phobos (22 km) and Deimos (13 km). Phobos is slowly spiralling inward — will impact Mars in ~50 million years. Available after Mars Phase 1 complete:
- *Do nothing:* continues natural. Late-game CE when geologists recalculate updated impact date.
- *Push to stable orbit:* small Mercury fuel cost. Preserved. CE: "We saved our smallest moon." Naturalist resonance.
- *Mine entirely:* tiny Mercury production bonus. Gone permanently. No CE chain.

Deimos: stable and small enough to be inconsequential. Remains as is.

**Both — Laser Array Redeployment (Mars Phase 1A → Titan)**
After Mars Phase 1 Choice A complete: queue Titan deployment package via Mercury mass driver. Redirects existing Mars orbital laser arrays to Saturn orbit. Powers Titan nitrogen extraction faster. Requires Dyson ~15–20% for long-range beaming. No new Mercury construction — routing decision only. Reduces Mars Phase 2 Choice A timeline by ~10–20yr.

**Both — Geothermal Drilling Network**
Unlocked by Deep Core Reading event (Mars Phase 3 positive event). Deep boreholes release residual geothermal heat + subsurface volatiles. Slow continuous contribution to atmospheric building (~5–10% of total atmospheric pressure goal over centuries). Secondary benefit: reveals subsurface geology. Fossil discovery mechanic connection.

---

## CROSS-PLANET RESOURCE FLOWS

| Resource | From | To | Triggered by |
|---|---|---|---|
| Nitrogen surplus | Venus Phase 2 (either choice) | Mars Phase 2 Choice B | Venus in CO₂ removal; player synchronises |
| Carbonate byproduct | Venus Phase 2A | Mars rocket fuel / construction | Choice A commit → player routes |
| Stored CO₂ tanks | Venus Phase 2B depot | Mars atmospheric supplement / propellant | Player routes from depot UI |
| Titan nitrogen | Titan in-place strip | Mars Phase 2 Choice A | Choice A commitment |
| Europa water + spin | Europa crash | Venus Phase 3B + Phase 4 (bundled) | Phase 3B commit |
| Ganymede/Callisto water | Captured moon orbit | Mars Phase 4A or Venus Phase 4A | Phase 2 commit window |
| Laser arrays | Mars Phase 1A | Titan nitrogen extraction speed | After Phase 1A complete |
| Electrochemical O₂ | Venus Phase 2 boost | Early Venus atmospheric O₂ seeding | Boost active during Phase 2 |
| Carbonate hot zone minerals | Venus Phase 2A event | Venus late-phase settlement bonus | Hot zone event resolves |

---

## IRREVERSIBLES

| Action | Locked | Consequence |
|---|---|---|
| Europa crash commit — Venus | Yes | Moon destroyed. Hunt for Life unresolvable. Spin-up + water delivered. |
| Ganymede redirect commit — Mars | Yes | Moon in transit. Cannot recall. Arrives guaranteed. |
| Callisto redirect commit — Venus | Yes | Same. |
| Titan nitrogen strip | Yes | Titan atmosphere permanently removed. Titan terraforming locked forever. |
| Mars polar detonations | Yes | 100–150yr polar lockout. Fallout CE chain. |
| CO₂ carbonate seeding (ongoing) | Soft | Carbonates stable; cannot recover CO₂. Rate can be slowed or stopped. |
| Phobos mined | Yes | Gone permanently. |

---

## PATH LOCKING

No warming path, CO₂ method, spin choice, or moon choice locks out later infrastructure. Wild Venus player can add orbital mirrors. Nuclear Mars player can add magnetic shielding. Mirror array Mars player can add laser infrastructure for Titan redeployment. Physical acts are final. Infrastructure is not.

---

## PER ASPERA NOTE

Mars in ~140 Earth years in Per Aspera (~75 Mars years; the "100 Mars years" figure is likely slower difficulty — 1 Mars year = 1.88 Earth years). Methods scientifically valid: PFC super greenhouse gases, orbital magnetic shield, large-scale atmospheric processors. Speed assumes massive on-planet industrial scale; bootstrapping problem handwaved. Validates Helioscape's 60–90yr Mars atmospheric phase timelines as defensible. Helioscape's advantage: grounds why that industrial scale exists (Dyson swarm + Mercury factory planet) rather than assuming it.

---

## PLUTO DECISION
### Post-V1 content. Optional. Outer ring. Requires Fusion Drive.

**Overview**

Pluto was the ninth planet for 76 years. Demoted to dwarf planet in 2006. Largely forgotten in the outer solar system. New Horizons (2015) revealed it is genuinely beautiful: nitrogen ice plains, water ice mountains, and Tombaugh Regio — a vast heart-shaped region of lighter ice on its surface. Beloved again, then set aside again.

This decision asks the player: does Pluto belong where it is, or does it belong with us?

No resource justification exists. This is purely a civilisational statement.

**Pluto & Charon — Facts**

| | Pluto | Charon |
|---|---|---|
| Diameter | 2,377 km | 1,212 km |
| Composition | ~70% rock, 30% ice (nitrogen, methane, water ice) | ~55% rock, 45% water ice |
| Notable feature | Tombaugh Regio (heart-shaped nitrogen ice plain) | Mordor Macula (dark reddish north pole), deep canyons |
| Relationship | Mutually tidally locked with Charon | Always faces Pluto |

Pluto and Charon orbit a shared barycentre between them in empty space — a binary dwarf planet system. They rotate and orbit in sync every ~6.4 Earth days. Moving one means moving both.

**The Choice**

*NATURALIST — Leave Pluto*
Pluto stays in the outer solar system. The solar system as it is. Some things should not be moved. Observatory CE chain: scientists study Pluto from afar, name its features, write about what it meant to the people who grew up calling it a planet.

CE tone: *"We decided some things are more beautiful from a distance."*

*ARCHITECT — Move Pluto to Venus*
Pluto and Charon redirected via gravity assist from 39 AU toward Venus. Arrive as a binary pair — two bodies orbiting each other as they orbit Venus. Venus, the planet no one wanted, receives the moon no one counted.

CE tone: *"Welcome back, Pluto."*

**Engineering**

Distance: ~39 AU. Ten times further than Jupiter. No resource value justifies the energy cost. Dyson-era project only — requires mature Fusion Drive and high Dyson capacity. Total timeline from commit to Venus arrival: 50–100yr. No Mercury production queue item — drawn from general Dyson output reserve.

**Arrival at Venus**

When Pluto and Charon settle into Venus orbit (~400,000 km), Tombaugh Regio faces Venus at arrival by narrative convention. From Venus's surface: Pluto appears as ~0.34° disc (slightly smaller than our Moon from Earth). Surface markings visible. Heart shape distinguishable as lighter region. Charon visible alongside as a separate body. Over each ~6.4-day period, Charon swings from one side of Pluto to the other — two objects visibly orbiting each other.

Venus has never had a natural moon in its history. This is unprecedented.

**Heart Day — The Holiday**

Pluto's ~6.4-day rotation means Tombaugh Regio cycles into view facing Venus regularly throughout the year. Culturally, only the annual anniversary of Pluto's arrival is observed as Heart Day — the specific date on Venus's orbital calendar when Pluto arrived. The holiday lasts 6 days (one full Pluto rotation, from heart-facing-Venus to heart-rotating-away). The other times the heart cycles into view throughout the year are ordinary days — Venusians may glance up, but they are not celebrated.

Heart Day comes once per Venus year (224.7 Earth days). 6-day duration. Observed planet-wide. Quiet, reflective, celebratory in a low-key way. People look up. The debate about whether moving Pluto was right resurfaces every Heart Day and is never resolved. That is intentional.

**CE Chain — Architect Path**

- *CE 1 — Arrival: "Welcome back, Pluto."* Quiet narrator. A scientist's log or a child asking why the new moon has a heart, and someone trying to explain what Pluto used to be. Bittersweet, warm. No triumph. Just arrival.
- *CE 2 — First Heart Day.* The heart faces Venus for the first time as a cultural event. Colonists who weren't alive when Pluto arrived see it together.
- *CE 3 — The Old Debate (recurring, every ~10 Venus years).* Culture event revisiting whether moving Pluto was right. Naturalist and Architect perspectives. No resolution. No player choice required.
- *CE 4 — Charon's Canyons.* First surface mapping of Charon. Canyon network larger and deeper than expected. Charon becomes a permanent research destination.
- *CE 5 — A Venusian Name (~50yr after arrival).* Cultural movement proposes Venusian names for Pluto and Charon. Names given by the culture, not chosen by player. Venus has absorbed Pluto into its own identity. Pluto is no longer the solar system's forgotten body.

**CE Chain — Naturalist Path**

- *CE 1 — The Observatory.* After Venus terraforming complete: a Venusian observatory points outward. Tombaugh Regio visible as a faint marking with advanced optics.
- *CE 2 — The Choice We Made.* A philosopher's reflection on leaving Pluto where it was. Not regret — consideration. A legacy of restraint.

**Notes**

- No resource value. Do not add one retroactively.
- Heart Day is Venus-specific. Mars has no equivalent. This is one of the things that makes Venus culturally distinct from Mars — its own calendar, its own sky, its own story.
- Naturalist tag: respecting what exists. Architect tag: reshaping what exists. Neither is superior. Both are sincere.

*"The planet no one wanted, and the moon no one counted."*

---

*Science basis: Kurzgesagt Mars + Venus transcripts. Zubrin "The Case for Mars." Fogg "Terraforming: Engineering Planetary Environments." NASA Jim Green L1 magnetosphere proposal (2017). NASA Europa/Ganymede/Callisto fact sheets. NASA New Horizons Pluto mission data. Nature Astronomy 2018 CO₂ inventory study. Per Aspera (Tlön Industries / Raw Fury). Bio phases handled in separate sub-GDD.*
