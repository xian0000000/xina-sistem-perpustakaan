"use client";

import { Hotspot } from "./Hotspot";
import type { Hotspot as HotspotType, PanelId, Role } from "@/lib/types";

const HOTSPOTS: HotspotType[] = [
    { id: "auth",        label: "Masuk / Daftar", icon: "🚪", svgIcon: "door",      x: 20, y: 85, color: "#c084fc", requiresAuth: false, requiresAdmin: false },
    { id: "bookshelf",   label: "Koleksi Buku",   icon: "📚", svgIcon: "bookshelf", x: 10, y: 45, color: "#fb923c", requiresAuth: false, requiresAdmin: false },
    { id: "book-detail", label: "Cari Buku",      icon: "🔍", svgIcon: "search",    x: 30, y: 60, color: "#34d399", requiresAuth: false, requiresAdmin: false },
    { id: "booking",     label: "Booking Buku",   icon: "📋", svgIcon: "calendar",  x: 50, y: 58, color: "#38bdf8", requiresAuth: true,  requiresAdmin: false },
    { id: "reading",     label: "Baca Buku",      icon: "📖", svgIcon: "book",      x: 50, y: 86, color: "#fbbf24", requiresAuth: true,  requiresAdmin: false },
    { id: "admin",       label: "Panel Admin",    icon: "⚙️", svgIcon: "admin",     x: 80, y: 75, color: "#f472b6", requiresAuth: true,  requiresAdmin: true  },
];

interface LibrarySceneProps {
    role: Role;
    activeId: PanelId | null;
    onHotspotClick: (id: PanelId) => void;
}

function isLocked(hotspot: HotspotType, role: Role): boolean {
    if (hotspot.requiresAdmin && role !== "admin" && role !== "librarian") return true;
    if (hotspot.requiresAuth && !role) return true;
    return false;
}

export function LibraryScene({ role, activeId, onHotspotClick }: LibrarySceneProps) {
    const visibleHotspots = HOTSPOTS.filter(h => !(h.id === "auth" && role));
    return (
        <div
            className="relative w-full rounded-sm overflow-hidden border border-stone-800/60"
            style={{ aspectRatio: "16/10", boxShadow: "0 0 80px rgba(120, 60, 10, 0.15)" }}
        >
            <img src="/perpus.jpeg" alt="Perpustakaan" className="absolute inset-0 w-full h-full object-cover select-none" draggable={false} />
            <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 50%, transparent 35%, rgba(8,6,4,0.5) 100%)" }} />
            {visibleHotspots.map((h) => (
                <Hotspot key={h.id} hotspot={h} isActive={activeId === h.id} isLocked={isLocked(h, role)} onClick={() => onHotspotClick(h.id)} />
            ))}
        </div>
    );
}
