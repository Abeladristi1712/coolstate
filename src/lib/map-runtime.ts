"use client";
import { setWorkerUrl } from "maplibre-gl";
export function configureMapWorker() { setWorkerUrl("/vendor/maplibre-gl-worker.mjs"); }
