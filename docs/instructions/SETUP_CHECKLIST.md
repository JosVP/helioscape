# Helioscape — Project Setup Checklist


## 3. Set up the Godot project

- [x] Open Godot → New Project → point to the `helioscape/` folder
- [x] Register the core autoloads in `project.godot` in this order:
  - `DataManager` → `src/autoloads/DataManager.gd`
  - `GameState` → `src/autoloads/GameState.gd`
  - `EventBus` → `src/autoloads/EventBus.gd`
  - `TimeManager` → `src/autoloads/TimeManager.gd`
  - `SaveManager` → `src/autoloads/SaveManager.gd`
- [x] Create the folder structure from `docs/ARCHITECTURE.md`

---

## 5. Optional: set up the Godot MCP server

```bash
# Test that it works
npx -y @satelliteoflove/godot-mcp
```

Configure the server in whichever MCP-capable client you actually use. This checklist no longer assumes Cursor specifically.

---

## 6. Set up gdUnit4 (test framework)

- [x] In Godot → AssetLib → search "gdUnit4" → install
- [x] Create `tests/` folder in project root
- [x] Add to `.gitignore`: `addons/gdUnit4/.tmp/`

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

On Windows, creating the hook file is enough for local Git usage in most setups; the executable bit mainly matters on Unix-like environments.

---

## 9. First Copilot session — scaffold the architecture

Once everything above is done, ask Copilot to scaffold the architecture stubs directly in this repo. The folder structure and stub files can be created without using a separate Cursor workflow.

> "Read docs/ARCHITECTURE.md. Propose how to scaffold the full folder structure and create empty stub files for every autoload, system, and shader listed. Do not write any implementation yet — stubs only with class_name, extends, and a comment describing the file's responsibility."

Review the plan, approve, then let it execute.
Commit: `chore: scaffold project structure`