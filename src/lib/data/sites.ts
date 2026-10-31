import type { Site } from "../../domain/types.ts";
export const SITES: Site[] = [
  { id: "tampines", name: "Tampines", district: "East Region", center: [103.945, 1.353], description: "A neighbourhood of homes, green pockets and everyday connections.", accent: "#8ca68b" },
  { id: "jurong", name: "Jurong West", district: "West Region", center: [103.7046, 1.3487], description: "Explore the potential of Singapore’s western residential heartland.", accent: "#799c9b" },
  { id: "bishan", name: "Bishan", district: "Central Region", center: [103.849, 1.3505], description: "Discover opportunities for a greener, more walkable estate.", accent: "#9eaa80" },
  { id: "kallang", name: "Kallang", district: "Central Region", center: [103.868, 1.319], description: "Reimagine outdoor comfort in a connected urban neighbourhood.", accent: "#8d9da6" },
];
export const SINGAPORE_BOUNDS: [[number, number], [number, number]] = [[103.59, 1.20], [104.09, 1.48]];
export function getSite(id: string): Site { return SITES.find(site => site.id === id) ?? SITES[0]; }
