---
Task ID: 2
Agent: Main Agent
Task: Fix application not loading - Z logo only showing

Work Log:
- Diagnosed that the dev server was crashing during client-side webpack compilation
- Root cause: `better-sqlite3` native module dependencies (`fs`, `net`, `tls`, `child_process`, `crypto`) were leaking into the client-side bundle
- Fixed `next.config.ts` by adding `webpack.resolve.fallback` to stub out Node.js built-in modules for client-side builds
- Updated `layout.tsx` metadata: title changed from "Z.ai Code Scaffold" to "CNPJ BI - Inteligência de Prospecção Empresarial", description and keywords updated, favicon changed from external Z.ai URL to local `/logo.svg`
- Created custom SVG favicon (`public/logo.svg`) with green checkmark branding
- Verified dev server starts, compiles, and serves the full page correctly
- All API endpoints verified working (register, login, segmentation, empresas, favorites, block)

Stage Summary:
- The "Z logo" was the favicon from `https://z-cdn.chatglm.cn/z-ai/static/logo.svg` in the old metadata
- The app was not loading because native modules caused webpack client-side compilation to crash the server
- Fixed by adding webpack fallback stubs for Node.js built-in modules in non-server builds
- Application now renders with correct CNPJ BI branding
