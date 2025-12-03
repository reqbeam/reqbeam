# ReqBeam – Thunder Client–style HTTP Client for VS Code

ReqBeam is a VS Code extension that provides an in-editor HTTP client similar to Thunder Client. It uses **sqlite3 (async via `sqlite`)**, **TypeScript**, **React** for the webview UI, and **esbuild** for bundling.

## Features

- **Request Builder**
  - HTTP method dropdown (GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS)
  - URL input
  - Headers table with enable/disable, add/remove
  - Raw/JSON body editor
  - `{{variable}}` substitution from the active environment
- **Response Viewer**
  - Status, duration, response size
  - Tabs: **Body** (pretty JSON if possible), **Headers**, **Raw**
- **Collections**
  - SQLite-backed collections table
  - Saved requests under collections
  - TreeView in the Explorer (`ReqBeam Collections`)
- **Environments**
  - SQLite-backed environments with JSON variable map
  - Active environment persisted via `globalState`
  - TreeView (`ReqBeam Environments`) with:
    - Add / Rename / Delete via commands & context menu
    - Click to set active environment
- **History**
  - SQLite-backed request history
  - TreeView (`ReqBeam History`) with recent entries
  - Click history items to load method + URL into the Request Builder

## Tech Stack

- **VS Code API** (1.106.x, Electron 37.x compatible)
- **TypeScript** for all extension and webview code
- **React 18** + `react-dom` for webview UI
- **sqlite3** (with async `open()` from `sqlite`) for storage
- **esbuild** for bundling extension (`src/extension`) and webview (`src/webview`)

## Project Structure

- `src/extension`
  - `activate.ts` – extension activation, service wiring, TreeViews
  - `commands.ts` – command registration and webview message handling
  - `db.ts` – sqlite3 initialization and schema
  - `requestRunner.ts` – HTTP/HTTPS request execution engine
  - `collectionService.ts` – collections & saved requests + TreeDataProvider
  - `environmentService.ts` – environments + active environment + TreeDataProvider
  - `historyService.ts` – request history + TreeDataProvider
- `src/webview`
  - `index.tsx` – webview entry, VS Code API wiring
  - `App.tsx` – main React app, message bridge to extension
  - `components/RequestBuilder.tsx`
  - `components/ResponseViewer.tsx`
  - `components/HeaderEditor.tsx`
  - `components/BodyEditor.tsx`
  - `components/Tabs.tsx`
  - `components/CollectionSidebar.tsx`
- `src/types/models.ts` – shared types (requests, environments, history, etc.)
- `src/utils/variableResolver.ts` – environment variable substitution helpers
- `src/utils/formatter.ts` – JSON and size formatting helpers

## Database

ReqBeam stores data in a SQLite database created under VS Code’s global storage:

- Path: `<context.globalStorageUri.fsPath>/reqbeam.db`

Tables:

- `collections (id, name)`
- `requests (id, collectionId, name, method, url, headers TEXT, body TEXT)`
- `environments (id, name, variables TEXT)`
- `history (id, method, url, status, duration, createdAt TEXT)`

`headers` and `variables` are JSON-encoded strings.

## Commands

Available via Command Palette:

- `ReqBeam: New Request` – open webview and clear builder
- `ReqBeam: Send Request` – send current request from builder
- `ReqBeam: Show Collections` – open webview and push collections
- `ReqBeam: Show Environments` – open webview and push environments
- `ReqBeam: Show History` – open webview and push history
- `ReqBeam: Add Environment` – prompt and create environment
- `ReqBeam: Rename Environment` – prompt and rename selected environment
- `ReqBeam: Delete Environment` – delete selected environment

TreeViews in Explorer:

- `ReqBeam Collections`
- `ReqBeam Environments`
- `ReqBeam History`

## Building

Install dependencies:

```bash
npm install
```

Build extension and webview bundles:

```bash
npm run build
```

Or watch during development:

```bash
npm run watch
```

## Running & Debugging in VS Code

1. Open this folder in VS Code.
2. Run `npm run build` at least once.
3. Use the standard “Extension” launch configuration (create one via **Run and Debug → Add Configuration → Extension** if needed).
4. Start debugging – a new Extension Development Host window will open.
5. In the dev host, use the Command Palette to run `ReqBeam: New Request` and open the UI.

## Notes

- The extension targets VS Code **1.106.x** and uses only Node core networking (`http` / `https`) to avoid extra native dependencies.
- All code is written in TypeScript; the compiled bundles are produced by **esbuild** into the `dist` folder. 


