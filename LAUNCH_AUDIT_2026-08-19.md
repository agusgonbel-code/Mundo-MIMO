# Mundo Mimo — Launch Readiness Audit

**Audit date:** 2026-08-19  
**Candidate:** v70 RC3  
**Scope:** child-facing web/PWA product, 24 guided games, free-play music, 3 age bands, privacy, audio, parental gate, offline shell, store-readiness risks.

## Executive verdict

**Web/PWA candidate:** CONDITIONAL GO for controlled device testing.  
**Apple App Store / Google Play commercial submission:** **NO-GO yet**.

The candidate has received major launch-hardening work, but a responsible store submission still requires: (1) a native/app-like packaged build tested on actual target devices rather than a thin WebView wrapper, (2) a complete first-party human narration pack or an explicitly accepted reduced-audio scope, (3) final legal/support contact information, (4) exact license review/attribution for every third-party media file, and (5) a recorded PASS from the full automated and physical-device QA gates.

---

## Automated test matrix

The repository now contains a Playwright launch suite covering:

- 24 guided games × 3 age bands × 6 rounds = **432 guided rounds**.
- Music free-play × 3 age bands × 6 rounds = **18 additional rounds**.
- **450 total round completions / 75 complete sessions**.
- Daily-path progression.
- Parent-gate rejection/acceptance.
- Trace and drawing interaction requirements.
- Presence of at least one valid answer in every normal round.
- Runtime JavaScript/console errors.
- Horizontal overflow on iPhone emulation and a 320×568 small-phone viewport.
- Privacy page availability.
- No `speechSynthesis` in production learning engine.
- No third-party HTTP URLs in the runtime audio bank.
- Same-origin audio files present and non-empty.

`qa/latest-result.txt` is designed to be written automatically by GitHub Actions with PASS/FAIL evidence. **Until that file reports PASS, automated QA is not considered signed off.**

---

# Apple-style review

## 1.3 Kids Category — parental gates and distractions

**Status: PASS in current child-facing design.**

- No ads.
- No child-facing purchases.
- No chat or social network.
- Adult area is protected by an arithmetic parental gate.
- Privacy link is placed inside the protected adult area.

**Residual action:** any future subscriptions, external links, account management, support web links or purchases must remain behind the adult gate.

## 5.1.4 Kids / privacy

**Status: PASS for current prototype data model; legal sign-off still required for commercial launch.**

- The child flow does not request name, email, phone, location, camera, microphone or contacts.
- Age band and learning progress are stored locally.
- No advertising identifiers are intentionally used.
- A child-focused `privacy.html` now exists.
- Runtime audio has been moved from third-party Wikimedia requests to same-origin assets bundled at deploy time.

**Blocker:** privacy policy must include the final legal/controller and support contact before store submission.

## 2.1 App Completeness

**Status: CONDITIONAL / NOT YET STORE-PASS.**

Fixed:
- impossible classification rounds guarded;
- tracing cannot be completed without real pointer movement;
- drawing cannot be completed without drawing;
- ambiguous dog/cat paw round accepts both pedagogically valid answers;
- runtime image and promise errors are surfaced;
- iPhone audio context is persistent/unlocked on touch;
- app icon and PWA metadata exist;
- privacy page exists.

**Blocker:** Apple expects a final build tested on device. The current QA suite is browser-based and the physical iPhone/iPad final-binary pass has not yet been recorded.

## 4.2 Minimum Functionality / app-like experience

**Status: RISK for a store wrapper.**

The current product is a rich PWA with custom games and persistent progress, but a commercial iOS submission must not be a low-value wrapper around a website. A native or genuinely app-like packaged build must demonstrate lasting functionality, correct platform behavior and complete offline assets.

---

# Google Play Families-style review

## Target audience and content

**Status: ACTION REQUIRED IN PLAY CONSOLE.**

Mundo Mimo is explicitly designed for ages 0–6. Play Console audience selections, Data Safety answers and IARC content-rating answers must accurately match the final binary. Do not select broader audiences merely to increase distribution.

## Families content/functionality

**Status: CHILD CONTENT PASS; PACKAGING RISK.**

- Current content is educational and age-oriented.
- No gambling, violence, adult content, chat or ads.
- The Android submission must not merely be a WebView of the public website. The store binary must provide a real app-like experience.

## Child data practices

**Status: PASS BY DESIGN, pending binary inspection.**

- No location required.
- No advertising ID needed.
- No child account needed.
- No camera/microphone permission needed.
- No third-party runtime audio network calls after the RC fixes.

**Release rule:** do not add analytics, advertising, attribution or authentication SDKs before a Families-policy review of those exact SDKs.

---

# Product / game-design audit

## Continuity

**Status: PASS for current engine.**

Guided games run six-round sessions; correct answers automatically advance; the final round completes a session; the child can continue with another adventure. Daily progress advances only after the full designated session.

## Game correctness

**Fixes made during audit:**

- `sort`: random sampling could produce zero valid answers. Runtime guard now guarantees a pedagogically valid target if the generated set is impossible.
- `tracks`: dog and cat shared the same paw symbol while only one was previously marked correct. Both are now accepted for the shared-paw prompt.
- `trace`: completion button now remains disabled until meaningful pointer travel is recorded.
- `paint`: completion button remains disabled until meaningful drawing is recorded.
- `memory`: automated QA verifies pairs occur exactly twice and completes every board.
- normal choice games: automated QA requires at least one `data-ok=true` answer in every generated round.

## Depth / competitive quality

**Status: NOT BEST-IN-CLASS YET.**

The game engine is materially stronger than earlier builds, but the product still lacks the production depth of a mature commercial kids studio: larger level pools, richer scene-based interactions, Olympics-style character activities, bespoke animation sets, more object/animal art, adaptive difficulty based on performance, and substantially more content per learning domain.

This is not automatically a store-policy rejection, but it is a quality/retention risk and should be treated as a P1 launch-quality issue.

---

# UX / responsive audit

**Status: CONDITIONAL PASS.**

- Responsive breakpoints collapse the game stage and choice grid on narrow screens.
- Characters use contained boxes rather than unconstrained absolute positioning in game scenes.
- A 320×568 overflow test is part of automated QA.
- Runtime image failures are logged.

**Required before commercial release:** physical-device pass on at least one small iPhone, one current large iPhone and one iPad in portrait, including safe-area behavior, drawing, audio unlock and install/update from the home screen.

---

# Audio audit

## Runtime/privacy

**Status: PASS after audit fix.**

- No `speechSynthesis` in the production learning engine.
- Animal/voice assets are served from same-origin paths at runtime.
- GitHub Pages workflow downloads licensed source files during build.
- Audio feedback uses a persistent Web Audio context to reduce iOS startup delay.

## Voice quality

**Status: P0/P1 PRODUCT BLOCKER for a premium launch claim.**

Only a limited set of human words is available. Many written instructions do not yet have a matching human narration. The temporary voice bank also mixes public pronunciation speakers.

**Commercial-quality requirement:** record a complete first-party Spanish voice pack with one directed voice identity (or a deliberately defined small cast) covering all prompts, instructions, successes, hints, character lines and stories. This must replace the mixed temporary clips before claiming a fully professional narrated product.

---

# Media rights audit

**Status: LEGAL REVIEW REQUIRED.**

`AUDIO_LICENSES.md` records current provenance. Some temporary animal recordings use public-domain/CC licenses; some current Commons files use attribution/share-alike licenses. Exact attribution and share-alike implications must be reviewed before commercial distribution. The safest production path is first-party or CC0/public-domain audio with retained provenance records.

---

# Security / privacy audit

**Status: PASS FOR CURRENT FEATURE SET, pending formal legal review.**

No child accounts, ads, chat, geolocation, camera, microphone, contacts or behavioral tracking are required by the current application. Progress is local. Parent-only settings use a gate.

Before native store submission, inspect the final binary and dependency tree to verify that packaging tools have not introduced analytics, crash-reporting identifiers or other SDK transmissions that are absent from the PWA code.

---

# Store operations checklist

## P0 — must be closed before store submission

1. Full automated QA evidence = PASS (`qa/latest-result.txt`).
2. Physical-device final-build test on iPhone/iPad; Android devices if submitting to Play.
3. Native/app-like packaging validated — not a thin WebView submission.
4. Final privacy/support/legal contact published.
5. Exact third-party audio/media license sign-off or replacement with first-party/CC0 assets.
6. Store metadata, screenshots, age rating, Kids/Family declarations, Data Safety/Privacy Nutrition details complete and truthful.

## P1 — strongly recommended before public launch

1. Complete consistent human narration pack.
2. More reactive character animations/poses.
3. Olympics-style flagship game mode with several genuinely different events.
4. Larger content pool and adaptive difficulty.
5. Explicit parent control to reset local progress and audio settings.

---

# Release sign-off

**Engineering:** conditional pass.  
**Child safety/privacy design:** conditional pass.  
**Game correctness:** pass after fixes, subject to automated matrix PASS.  
**UX mobile:** conditional pass, physical device test required.  
**Audio runtime:** pass.  
**Audio production quality:** not approved for premium final launch.  
**Legal/media:** pending sign-off.  
**Apple/Google store submission:** **NO-GO until all P0 items above are closed.**

A store reviewer cannot be guaranteed to approve any app. This audit is an internal readiness assessment designed to remove known rejection risks and product defects before submission.
