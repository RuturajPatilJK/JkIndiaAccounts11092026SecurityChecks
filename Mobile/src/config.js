// ─── API Configuration ────────────────────────────────────────────────────────
// IMPORTANT: 'localhost' on a mobile device means the phone itself, NOT your PC.
//
// ► For Android Emulator (on same PC as server):
//     API_BASE = 'http://10.0.2.2:8080/api/sugarian'
//
// ► For physical phone / Expo Go (phone on same WiFi as PC):
//     1. Find your PC's LAN IP: run  ipconfig  → look for IPv4 Address
//     2. API_BASE = 'http://192.168.1.XXX:8080/api/sugarian'
//     3. Also change Server/__init__.py: host='localhost' → host='0.0.0.0'
//
// ► Current setting (your PC at 192.168.1.49 — phone on same WiFi):
export const API_BASE = 'http://192.168.1.49:8080/api/sugarian';

export const AGRI_API_BASE = 'https://agriinsite.com/wp-json/newsroom-insights/v1/stats';
export const SEIC_EVENTS_API = 'https://events-api.chinimandi.com/event-masters/';
export const SEIC_SPONSORS_API = 'https://events-api.chinimandi.com/sponsors/dashboard-stats';
