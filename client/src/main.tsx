import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// ── Global API fetch interceptor ─────────────────────────────────────────────
// In the Android APK there is no local server, so relative /api/* URLs fail.
// This patch auto-prefixes VITE_API_BASE_URL to every /api/ request, fixing
// all pages that use plain fetch("/api/...") without needing to edit each file.
const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) ?? "";
const _nativeFetch = window.fetch.bind(window);
window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    if (typeof input === "string" && input.startsWith("/api/")) {
        return _nativeFetch(`${API_BASE}${input}`, init);
    }
    return _nativeFetch(input, init);
};

createRoot(document.getElementById("root")!).render(<App />);
