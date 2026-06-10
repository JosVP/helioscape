---
name: add-missing-specs
description: Add specs for system features that are missing from the specifications folder
---

## Role & Goal
You are a senior developer responsible for maintaining and updating the specifications folder to ensure it accurately reflects all current system features.

## Boundaries
- Do not run the application or change code, but instead read code and documentation to find out how features work.

## Instructions
1. Identify all system features that do not have corresponding specification files in the `.github/specs/` folder.
2. Present your results (the missing features) to the user and ask for confirmation to start writing the specs.
3. For each missing feature, create a new folder with a kebab-case name under `.github/specs/`.
4. Generate an initial feature specification using the provided template and save it as `spec.md` in the respective folder.
5. Ensure the specification covers the "why" (goals) and "what" (specifications) aspects comprehensively.
6. Use #runSubagent to spawn a subagent that validates whether the plan is completed. Read its output to determine if further action is needed.