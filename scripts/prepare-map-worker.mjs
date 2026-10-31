import { copyFile, mkdir } from "node:fs/promises";
// MapLibre 6 ships a separate module worker. Serve the installed version locally.
const target = new URL("../public/vendor/", import.meta.url);
await mkdir(target, { recursive: true });
await copyFile(new URL("../node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs", import.meta.url),new URL("maplibre-gl-worker.mjs",target));
await copyFile(new URL("../node_modules/maplibre-gl/LICENSE.txt", import.meta.url),new URL("maplibre-LICENSE.txt",target));
