import type { Metadata } from "next";
import "maplibre-gl/dist/maplibre-gl.css";
import "./globals.css";
import "@/components/map/explorer.css";
import { AppShell } from "@/components/shell/app-shell";
export const metadata: Metadata = {title:"CoolEstate AI · Singapore urban comfort",description:"A Singapore-focused workspace for exploring cooler, greener housing estates. UI prototype with clearly labeled illustrative geometry."};
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="en"><body><AppShell>{children}</AppShell></body></html>;}
