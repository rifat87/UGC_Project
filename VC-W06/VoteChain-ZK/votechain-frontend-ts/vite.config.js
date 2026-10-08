import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
export default defineConfig(function (_a) {
    var mode = _a.mode;
    var env = loadEnv(mode, process.cwd(), "");
    var connectSources = ["'self'", env.VITE_API_BASE_URL, env.VITE_RPC_URL, "https://*.ethers.org", "https://*.ethers.io", "wss://*.ethers.io"]
        .filter(Boolean)
        .join(" ");
    return {
        worker: {
            format: "es",
        },
        plugins: [react()],
        resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
        server: {
            port: 5273,
            headers: { "Content-Security-Policy": "connect-src ".concat(connectSources) },
        },
    };
});
