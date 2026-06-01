# Helioscape — Project Setup Checklist

## 1. Install tools

- [ ] **Godot 4** — download from godotengine.org (standard build, not .NET)
- [ ] **Cursor** — cursor.com, select Claude Sonnet as default model in Settings → Models
- [ ] **Node.js** — required for the Godot MCP server (nodejs.org, LTS version)
- [ ] **Git** — git-scm.com (if not already installed)
- [ ] **gdtoolkit** — GDScript linter + formatter: `pip install gdtoolkit`
- [ ] **SourceTree** — sourcetreeapp.com, or use VS Code's git panel if you prefer staying in one place

---

## 2. Create the repo

```bash
git init helioscape
cd helioscape
```

Create `.gitignore`:
```
.godot/
*.import
*.uid
export_presets.cfg
```

Create `.claudeignore` (prevents Claude from loading binary/cache files into context):
```
.godot/
assets/textures/
assets/audio/
*.import
*.uid
*.tres
*.res
```

---

## 3. Set up the Godot project

- [ ] Open Godot → New Project → point to the `helioscape/` folder
- [ ] Project → Project Settings → Autoload → add in this order:
  - `DataManager` → `src/autoloads/DataManager.gd`
  - `GameState` → `src/autoloads/GameState.gd`
  - `EventBus` → `src/autoloads/EventBus.gd`
  - `TimeManager` → `src/autoloads/TimeManager.gd`
  - `SaveManager` → `src/autoloads/SaveManager.gd`
- [ ] Create the folder structure from `docs/ARCHITECTURE.md` manually or ask Cursor to scaffold it

---

## 4. Set up Cursor

- [ ] Open the `helioscape/` folder in Cursor
- [ ] Copy `.cursorrules` into the project root (the short version from `docs/`)
- [ ] Settings → Features → enable **Auto-accept** (use SourceTree to review/revert diffs)
- [ ] Settings → Models → set Claude Sonnet as default
- [ ] Familiarise yourself with **Composer** (Cmd+I / Ctrl+I) — this is the agent mode for multi-file tasks

---

## 5. Set up the Godot MCP server

```bash
# Test that it works — Cursor will auto-start it via config
npx -y @satelliteoflove/godot-mcp
```

Create `.cursor/mcp.json` in the project root:
```json
{
  "mcpServers": {
    "godot": {
      "command": "npx",
      "args": ["-y", "@satelliteoflove/godot-mcp"]
    }
  }
}
```

In Cursor Settings → MCP → verify the godot server shows as connected.

---

## 6. Set up gdUnit4 (test framework)

- [ ] In Godot → AssetLib → search "gdUnit4" → install
- [ ] Create `tests/` folder in project root
- [ ] Add to `.gitignore`: `addons/gdUnit4/.tmp/`

---

## 7. Set up pre-commit hooks

Create `.git/hooks/pre-commit`:
```bash
#!/bin/sh
# Format and lint all changed GDScript files
CHANGED=$(git diff --cached --name-only --diff-filter=ACM | grep '\.gd$')
if [ -n "$CHANGED" ]; then
  gdformat $CHANGED
  gdlint $CHANGED
  if [ $? -ne 0 ]; then
    echo "GDScript lint failed. Fix errors before committing."
    exit 1
  fi
  git add $CHANGED
fi
```

```bash
chmod +x .git/hooks/pre-commit
```

---

## 8. Copy docs into the project

```
helioscape/
└── docs/
    ├── ARCHITECTURE.md        ← from this chat
    ├── SESSION_LOG.md         ← create empty, Claude appends to this
    ├── gdd-main.md            ← your main GDD
    └── gdd-economy-logistics.md
```

---

## 9. First Cursor session — scaffold the architecture

Once everything above is done, open Composer in Cursor and paste:

> "Read docs/ARCHITECTURE.md. Use Plan mode first: propose how to scaffold the full folder structure and create empty stub files for every autoload, system, and shader listed. Do not write any implementation yet — stubs only with class_name, extends, and a comment describing the file's responsibility."

Review the plan, approve, then let it execute.
Commit: `chore: scaffold project structure`

---

## 10. Commit discipline (ongoing)

- Claude proposes → you review in SourceTree → you commit
- One logical change per commit
- Format: `feat(ResearchSystem): implement track completion`
- Run `git push` yourself, never ask Claude to push
