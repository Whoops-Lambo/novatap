# Cloud development setup

The current Linux environment has Node.js 24, npm 11, and Chromium at `/usr/bin/chromium`.

Use the existing `/workspace/novatap` checkout. Tasks are already isolated; do not create a Git worktree unless requested.

```sh
cd /workspace/novatap
npm ci --cache /workspace/.npm-cache --no-audit --no-fund
npm test
npm run build
npx cap sync ios
npm run dev
```

With the dev server running, `node tests/browser.mjs` validates representative mobile gameplay and saves screenshots. The game requires no secrets, backend services, or external font/CDN access. npm packages are fetched from registry.npmjs.org. Runtime processes need to be restarted in future tasks.

The reusable environment configuration draft could not be read or saved by the platform tools in this onboarding session. These instructions are retained here; configuration persistence and publication have not been confirmed.

Native iOS compilation and signing are not available on Linux. The repository includes a macOS GitHub Actions build workflow and a Mac build script, both pending actual native-build validation. See README.md.
