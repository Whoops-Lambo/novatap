# NovaTap

A mobile idle clicker built with Capacitor for iPhone. Tap the nova for stardust, purchase passive collectors, increase tap strength, claim milestones, and explore new sectors. Energy recharges in eight hours; offline income is capped at eight hours. Progress is saved locally on the device. Removing the app removes progress.

## Develop

Requires Node.js 22 or newer.

```sh
npm ci --cache /workspace/.npm-cache
npm test
npm run dev
```

`npm run build` builds the web game. `npm run ios:sync` builds and copies it to the native iOS project. No backend or API keys are required.

## Build an iPhone installer for Sideloadly

An IPA must be compiled on a Mac with Xcode; Windows and Linux cannot compile the iOS SDK. This repository includes the native Xcode project, but does not include a compiled IPA.

1. On a Mac, install Xcode and its iOS SDK, Node.js 22+ and CocoaPods (`brew install cocoapods`), and run `npm ci` in this folder.
2. Run `npm run ios:sync`, then `npx cap open ios`.
3. In Xcode, select the App target, choose a unique bundle identifier and your Apple development team under Signing & Capabilities. Select a connected iPhone or a generic iOS device, not a simulator.
4. Build with Product → Build. Locate the device `App.app` in Xcode's Products folder (Show in Finder). Do not use the simulator build.
5. Create a folder named `Payload`, copy `App.app` inside it, ZIP `Payload`, and rename the ZIP to `NovaTap.ipa`. Alternatively, export an IPA from Xcode Organizer if your Apple team supports the available export method.
6. Move `NovaTap.ipa` to your PC. Open Sideloadly, connect and trust your iPhone, select the IPA, and follow Sideloadly's Apple ID signing process. Enter credentials only in the trusted signing application. Enable Developer Mode on the iPhone if prompted, and trust the signing profile in iOS Settings as required.

Free Apple signing commonly expires after seven days and requires re-signing. Sideloadly handles signing, but cannot turn this source project into an IPA; the Mac build is required first.

## Validation

`npm test` checks tap economics, collector purchasing, eight-hour offline caps, energy regeneration, clock rollback, and save recovery. Browser integration tests in `tests/browser.mjs` exercise purchases, reload/offline earnings, milestone claims, and a mobile viewport.

## Build from your PC using GitHub Actions

You can use GitHub's macOS runner instead of owning a Mac. After these project files are committed and pushed to your repository, open GitHub → Actions → **Build iPhone IPA** → Run workflow. When it succeeds, download **NovaTap-iPhone-IPA** from the run's Artifacts section and extract `NovaTap.ipa`. Open that file in Sideloadly on your PC to sign and install it. GitHub Actions availability and usage limits depend on your account/repository settings.

This workflow builds for a real iPhone without a signing identity. Sideloadly supplies the signing step. The workflow and native build have not been executed in this Linux environment; an IPA is only available after a successful macOS run. The equivalent local Mac command is `bash scripts/build-ipa.sh`.

## What's new in 1.1

- Three scout expeditions: 30 minutes (25 stardust entry, 150 reward), two hours (150 entry, 1,200 reward), and four hours (400 entry, 3,000 reward). One scout can fly at a time. Their return timers persist when the app closes; claim rewards in Journey.
- The Collect screen shows the scout's return countdown and the next collector milestone. Milestones advance from a first drone to a lunar outpost and a solar harvester, then repeat upgrades. Forecasts use current passive income and account for the eight-hour offline cap.
- Every new sector adds 15% of base passive income, including offline production. Progress from version 1.0 migrates automatically.
- Larger mobile touch targets, safe-area padding for iPhone home indicators, and reduced-motion support.
- The Mac IPA script stages each build in a fresh folder and validates the device platform, executable, and bundled game assets before reporting success.

Validation in this revision: ten game logic tests, mobile browser purchase/offline/milestone/expedition checks, production web build, and web asset sync to the iOS project. Native compilation, the GitHub macOS job, and installation on a physical iPhone remain unverified in this Linux environment.

## Energy upgrades

Open **Upgrades → Bigger energy reserve**, or use **Upgrade energy capacity** below the energy bar. Each purchase increases the maximum by 100 and adds 100 usable energy immediately. Prices start at 200 stardust and increase by 60% per level (rounded to the nearest stardust). A full reserve regenerates in eight hours at every capacity; the energy bar and countdown reflect the current level. Capacity upgrades persist across restarts and migrate existing saves without resetting progress.
