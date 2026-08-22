# Mundo Mimo — TestFlight-style QA + simulated 100-user review
Fecha: 22/08/2026

## Scope
Repository-level TestFlight-style audit plus a structured simulation of 100 user journeys. This is not a claim that 100 real people used a signed TestFlight build. Final audio, touch latency, safe areas, VoiceOver, suspension and child/parent usability require the signed binary on real iPhone/iPad hardware.

## Critical findings
### P0-1 — Broken iPhone-emulation QA infrastructure
The launch matrix used an iPhone 13 Playwright profile (WebKit) while CI installed Chromium only. Result: 79/79 tests failed before exercising the product.

Resolution: QA workflow now installs WebKit and uses Node 22.

### P0-2 — Native Expo product did not match validated product
`App.js` contained only three working mini-games and placeholders for others, while the validated web product v70 contains the 24-game experience. Building the Expo path for TestFlight would therefore ship a materially incomplete product.

Resolution: App Store packaging now uses Capacitor and the validated local v70 web product (`www/`) rather than treating the incomplete Expo prototype as the release source. Added reproducible mobile build, iOS configuration, privacy manifest and native simulator CI.

### P1 — No explicit progress reset
The privacy audit required an adult reset control but the product only described future availability.

Resolution: the protected parent area now receives a `Reiniciar progreso` control with confirmation and local-only deletion.

### P1 — Support/privacy release completeness
The privacy page contained pre-launch placeholder wording.

Resolution: privacy text has been updated, a support page has been added, and the mobile package includes privacy/support/credits.

## Simulated 100-user feedback
Aggregate simulated personas included children in all three age bands, parents, small-screen users, users with audio muted/unlocked late, users repeatedly entering/leaving games and users returning after interrupted sessions.

Most important themes:
- Parents need immediate confidence that there are no ads, chat or child purchases.
- Children benefit from short sessions and strong visual next-actions.
- Repeated instructions and consistent narration matter more than adding decorative screens.
- Parents expect progress reset and privacy controls to be easy to find after passing the gate.
- Inconsistent narration voices reduce perceived production quality.
- The native binary must contain the same game depth as the product shown in QA and screenshots.

## Changes applied in this QA cycle
- Fixed WebKit installation in launch QA.
- Added 10x repeated critical iPhone journeys plus the full launch matrix.
- Added protected progress reset.
- Added `support.html` and updated `privacy.html`.
- Added `PrivacyInfo.xcprivacy`.
- Added Capacitor 8 iOS packaging for v70.
- Added reproducible `build:mobile`, `ios:add`, `ios:prepare` and `ios:privacy` scripts.
- Added native iOS Simulator CI checking bundle identity, bundled product, support/privacy and privacy manifest.

## Remaining release gates
1. Full CI and repeated stress gate must be green on the current commit.
2. Signed TestFlight build must be tested on one small iPhone, one current large iPhone and one iPad.
3. Narration/media rights must be accepted for commercial release or replaced with first-party/CC0 assets.
4. Store metadata, screenshots, Kids Category answers and final App Privacy responses must match the binary.

## Release verdict
Current repository: RELEASE CANDIDATE AFTER CI, NOT YET PHYSICALLY SIGNED OFF.
The previous P0 mismatch between the Expo prototype and the validated 24-game product has been removed from the intended iOS release path.
