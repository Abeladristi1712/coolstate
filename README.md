# CoolEstate AI — Singapore UI prototype

Next.js App Router + TypeScript, Tailwind, a shadcn-style Button primitive, MapLibre GL JS, Turf.js, Recharts and Zustand. The parent workspace's `AGENTS.md` applies.

## Run locally

Requires a compatible Node.js version (validated using Node 24).

```powershell
cd C:\Users\User\Downloads\hackaton\coolestate-ai
npm.cmd install
npm.cmd run dev
```

Open the Local URL printed by Next.js, normally http://127.0.0.1:3000. Windows commands use `npm.cmd` to avoid PowerShell script execution policy restrictions.

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
```

## Available

- **Explore Singapore:** the dashboard starts with the full Singapore viewing extent on an OpenFreeMap/OpenStreetMap street map. Choose a neighbourhood or zoom in, then click a building footprint to open its rotatable 3D massing preview. A current-view building table supports keyboard selection. Internet is required; source attribution remains visible. Display heights are unverified provider values or explicitly labeled assumptions. Tile footprints may be clipped/generalized. This is not a photorealistic render or survey model.
- **Preserved sample workspace:** use the “Sample estate” toggle for the original illustrative viewer. Live-map selections do not overwrite the DEMO editor, scenarios or exported project. Predev/prebuild/prestart prepare the local worker required by MapLibre 6 automatically.

- Seven navigable pages and responsive sidebar.
- Singapore-only location presets: Tampines, Jurong West, Bishan and Kallang.
- Offline-capable synthetic estate geometry with MapLibre 2D/3D viewing, zoom, layer visibility, selection and table alternative, separate from the live OSM explorer.
- Sample building height editing; edits to the baseline create a scenario first.
- Turf geometry summaries and Recharts plan-area composition, all marked DEMO.
- Design principle cards that save strategy notes, without changing geometry or claiming environmental benefits.
- Scenario metric comparison, manual local browser saving, validated project JSON restoration, GeoJSON/CSV downloads, and browser print/PDF report.

## Scope and limitations

This is a UI prototype with bounded interactive features, not a scientific simulation application. In sample mode, the same synthetic estate template is positioned at each Singapore preset; it does not depict those actual estates. The live Singapore explorer uses imported map footprints with coverage/quality limits. Source GIS/weather files in the parent folder are not bundled or uploaded. WebGL is required for the interactive maps; the sample Data tab remains available if it fails. The live building list requires the map tiles to have loaded.

UTCI, MRT, local wind and solar/shade simulation are unavailable. Images in scenario/report cards are generic illustrations, not scenario renders. Terra Draw, real GIS imports, weather parsing, authentication, advanced simulation and hosting remain future phases. No API keys are required.

For this small prototype, manual localStorage snapshots hold only bounded demo project data, using schema validation. This is an explicit temporary simplification of the proposed IndexedDB repository; robust GIS persistence, migrations and multiple saved projects are not yet implemented. Save/export before replacing the active workspace or clearing browser data. Restore accepts a CoolEstate backup, not arbitrary GeoJSON.

See the parent `docs/PROGRESS.md` for verification results and next steps.
