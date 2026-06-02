# Helioscape Instruction Prompts

This folder now separates host-specific prompt packs:

- `cursor-prompts/`: the original Cursor-oriented prompt files.
- `cp-prompts/`: Copilot-friendly rewrites of the same prompt packs.

Use the files in `cp-prompts/` as task briefs for Copilot Chat. They are not automatically attached just because they exist in the repo, so when a prompt depends on supporting docs such as `ARCHITECTURE.md`, `bio-phase-management.md`, or `UI_GUIDE.md`, mention or attach those files in chat before asking Copilot to implement that section.

Suggested workflow:

1. Start from one prompt section only.
2. Mention any referenced supporting docs in the same chat.
3. Keep file-by-file scope when implementing Godot work, matching the project rules in `CLAUDE.md` and `AGENT_INSTRUCTIONS.md`.