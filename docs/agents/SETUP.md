# SETUP.md — Helioscape Project Setup

Complete these steps once before running any prompts.
Estimated time: 45–60 minutes.

---

## Prerequisites

### 1. Node.js

Download and install Node.js LTS from https://nodejs.org
Verify: `node --version` should show v20 or higher.

### 2. Angular CLI

```bash
npm install -g @angular/cli
ng version  # verify it shows Angular 19+
```

### 3. Rust (required for Tauri)

Tauri's desktop shell is written in Rust. You need Rust installed even if you
never write Rust yourself — Tauri compiles its own backend.

**Windows**: download and run `rustup-init.exe` from https://rustup.rs
**Mac/Linux**: run in terminal:
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

After installation, restart your terminal and verify:
```bash
rustc --version   # should show rustc 1.70+
cargo --version   # cargo is Rust's package manager
```

**Windows additional**: install the MSVC Build Tools.
When running `rustup-init.exe`, it will prompt you. Choose option 1 (automatic install).
If it doesn't, install "Build Tools for Visual Studio" from Microsoft's site —
only the C++ build tools are needed, not the full Visual Studio IDE.

### 4. Tauri system dependencies

**Mac**: install Xcode Command Line Tools:
```bash
xcode-select --install
```

**Linux**: install webkit2gtk (varies by distro):
```bash
# Ubuntu/Debian
sudo apt install libwebkit2gtk-4.1-dev build-essential curl wget \
  libssl-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev
```

**Windows**: no extra dependencies if MSVC Build Tools are installed.

---

## Create the Angular project

```bash
ng new helioscape \
  --standalone \
  --style=scss \
  --routing=true \
  --ssr=false

cd helioscape
```

When prompted:
- Standalone: **yes** (or pass `--standalone` flag)
- Stylesheet format: **SCSS**
- Server-side rendering: **No**

---

## Install dependencies

```bash
# Three.js for the orrery
npm install three
npm install --save-dev @types/three

# Tauri
npm install --save-dev @tauri-apps/cli@latest
npm install @tauri-apps/api@latest
npm install @tauri-apps/plugin-fs

# Optional but useful: RxJS is already included with Angular
# No extra install needed
```

```markdown
## Install Tauri plugins

Tauri 2 uses a plugin system for file I/O. Install the store plugin for save files:

```bash
npm install @tauri-apps/plugin-store
```

Then add the plugin to src-tauri/Cargo.toml (Tauri will create this file during init):
```toml
[dependencies]
tauri-plugin-store = "2"
```

And register it in src-tauri/src/main.rs:
```rust
fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::default().build())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

---

## Initialise Tauri

```bash
npx tauri init
```

You will be prompted for several values:

| Prompt | Answer |
|---|---|
| App name | Helioscape |
| Window title | Helioscape |
| Web assets location | `../dist/helioscape/browser` |
| Dev server URL | `http://localhost:4200` |
| Frontend dev command | `ng serve` |
| Frontend build command | `ng build` |

This creates the `src-tauri/` folder. You do not need to edit anything in it manually for now.

### Add Tauri scripts to package.json

```json
{
  "scripts": {
    "start": "ng serve",
    "build": "ng build",
    "tauri": "tauri",
    "tauri:dev": "tauri dev",
    "tauri:build": "tauri build"
  }
}
```

---

## Configure the Angular project

### Update tsconfig.json for strict mode

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictPropertyInitialization": true,
    "noImplicitReturns": true,
    "noUncheckedIndexedAccess": true
  }
}
```

### Create the folder structure

Run this from the project root to create all empty folders:

```bash
mkdir -p src/app/core/models
mkdir -p src/app/core/services
mkdir -p src/app/core/systems
mkdir -p src/app/features/title-screen/save-slot-panel
mkdir -p src/app/features/game-shell
mkdir -p src/app/features/orrery
mkdir -p src/app/features/hud/planets-panel
mkdir -p src/app/features/hud/kardashev-bar
mkdir -p src/app/features/hud/time-controls
mkdir -p src/app/features/planet-panel/tech-tree
mkdir -p src/app/features/planet-panel/research
mkdir -p src/app/features/planet-panel/bio-phase
mkdir -p src/app/features/planet-panel/vignette
mkdir -p src/app/features/mercury/mercury-grid
mkdir -p src/app/features/mercury/mercury-hud
mkdir -p src/app/features/mercury/building-selector
mkdir -p src/app/features/culture-events/culture-event-card
mkdir -p src/app/features/culture-events/culture-event-toast
mkdir -p src/app/features/pause-menu
mkdir -p src/app/features/settings
mkdir -p src/app/shared/components/progress-bar
mkdir -p src/app/shared/components/status-tag
mkdir -p src/app/shared/components/confirm-dialog
mkdir -p src/app/shared/pipes
mkdir -p src/app/shared/utils
mkdir -p src/styles
mkdir -p src/data
mkdir -p src/assets/fonts
mkdir -p src/assets/svg/buildings
mkdir -p src/assets/svg/vignettes
mkdir -p src/assets/svg/icons
```

### Create styles/tokens.scss

Create `src/styles/tokens.scss` with the full content from the
CSS design tokens section of ARCHITECTURE.md.

### Update src/styles.scss

```scss
@use 'styles/tokens';
@use 'styles/reset';
@use 'styles/typography';

*, *::before, *::after {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: var(--color-bg-base);
  color: var(--color-text-primary);
  font-family: var(--font-mono);
  font-size: var(--text-md);
  overflow: hidden;  // game fills viewport, no scroll
}
```

### Create src/styles/reset.scss

```scss
html, body { height: 100%; margin: 0; padding: 0; }
button { cursor: pointer; border: none; background: none; }
ul, ol { list-style: none; margin: 0; padding: 0; }
img, svg { display: block; }
```

### Update angular.json to include global styles

In `angular.json`, under `projects.helioscape.architect.build.options.styles`:
```json
"styles": [
  "src/styles.scss"
]
```

### Update angular.json to serve data folder

In `angular.json`, under `projects.helioscape.architect.build.options.assets`:
```json
"assets": [
  "src/assets",
  { "glob": "**/*", "input": "src/data", "output": "data" }
]
```

This makes JSON files available at `/data/planets.json` etc. at runtime.

---

## Add fonts

Place your chosen fonts in `src/assets/fonts/`.

Recommended free fonts for Helioscape:
- **Mono**: `JetBrains Mono` or `IBM Plex Mono` (Google Fonts, free)
- **Body**: `Inter` or `IBM Plex Sans` (Google Fonts, free)

Download the `.woff2` files and update `src/styles/typography.scss`:

```scss
@font-face {
  font-family: 'JetBrains Mono';
  src: url('/assets/fonts/JetBrainsMono-Regular.woff2') format('woff2');
  font-weight: 400;
}

// Add bold variant if needed
```

Then update `tokens.scss`:
```scss
--font-mono: 'JetBrains Mono', 'Courier New', monospace;
--font-body: 'Inter', system-ui, sans-serif;
```

---

## Add data files

Copy all JSON data files into `src/data/`:

```
src/data/
├── planets.json
├── tech-tree.json
├── research-tracks.json
├── culture-events.json
├── kardashev-milestones.json
├── resources.json
├── mercury-buildings.json
├── organisms.json
├── bio-phases.json
└── boosters.json
```

These files are generated by the data prompts in PROMPTS.md.
Do the data prompts first, then copy the output here.

---

## VSCode setup

Install these extensions:

- **Angular Language Service** (`angular.ng-template`) — template intellisense
- **GitHub Copilot** — already installed
- **ESLint** (`dbaeumer.vscode-eslint`) — linting
- **SCSS IntelliSense** (`mrmlnc.vscode-scss`) — SCSS autocomplete
- **Error Lens** (`usernamehere.errorlens`) — inline error display

### Add .vscode/settings.json

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

---

## Verify the setup

### Run in browser (no Tauri needed for development)

```bash
ng serve
```

Open http://localhost:4200. You should see the default Angular app.
You will develop entirely in the browser — only run Tauri for final testing.

### Run with Tauri (desktop app — optional during development)

```bash
npm run tauri:dev
```

First run takes several minutes — Rust compiles the Tauri backend.
Subsequent runs are faster (only recompiles if Rust files changed).

---

## About Rust and the Tauri backend

You will not write any Rust code. The `src-tauri/` folder is managed by Tauri.
The only file you might edit is `src-tauri/tauri.conf.json` if you need to
change app permissions (e.g. allowing file system access to new paths).

Tauri generates `src-tauri/src/main.rs` automatically. Leave it alone.

The Rust compilation step happens once per `tauri:dev` cold start and once per
`tauri:build`. It is slow (2–5 minutes first time) but subsequent runs are fast
due to Rust's incremental compilation.

---

## Development workflow

| Task | Command |
|---|---|
| Start dev server (browser) | `ng serve` |
| Start Tauri dev app | `npm run tauri:dev` |
| Build for web | `ng build` |
| Build desktop app | `npm run tauri:build` |
| Generate component | `ng g c features/my-feature/my-component --standalone` |
| Generate service | `ng g s core/services/my-service` |

**During development**: use `ng serve` and browser dev tools.
Only switch to `tauri:dev` when testing file system features (save/load).

---

## Git setup

Create `.gitignore` in the project root:

```
# Dependencies
node_modules/
.pnp
.pnp.js

# Build output
dist/
tmp/

# Tauri build output
src-tauri/target/

# Environment
.env
.env.local

# Editor
.vscode/extensions.json
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?
.DS_Store
Thumbs.db
```

Note: `src-tauri/target/` is the Rust build cache — gigabytes in size, never commit it.
The `src-tauri/` folder itself (excluding `target/`) should be committed.

```bash
git init
git add .
git commit -m "Initial Helioscape project setup"
```

# Angular ESLint (replaces TSLint, the Angular team maintains this)
ng add @angular-eslint/schematics

# Prettier
npm install --save-dev prettier eslint-config-prettier

# Create .prettierrc
echo '{
  "singleQuote": true,
  "semi": true,
  "tabWidth": 2,
  "printWidth": 100,
  "trailingComma": "es5"
}' > .prettierrc
