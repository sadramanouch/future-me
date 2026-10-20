# Release readiness — 2026-10-19

This is an experimental source release, not a hosted product launch.

## Verified locally

- Node 22: locked dependency installation, TypeScript check and Expo web export.
- Two backend smoke tests: missing JWT secret is rejected; a temporary local
  server answers health, rejects unauthenticated access and returns 503 for
  unconfigured billing. The tests make no AI or Stripe calls.
- Removed the original live API default, Stripe publishable key, Expo update
  project and App Store submission target from the release configuration.
- Fixed a stray JSX closing expression that prevented TypeScript compilation.

## Dependency work remains

After compatible `npm audit fix` updates, npm reported 72 advisory entries in
the app dependency tree (2 critical, 42 high, 27 moderate, 1 low), and 9 in the
server tree (1 critical, 7 high, 1 moderate). The server runtime-only tree has
6 entries (1 critical, 4 high, 1 moderate). These are dependency-tree counts,
not counts of independently exploitable app defects. Results change over time.

Major upgrades are still needed for the inherited Expo/React Native/voice and
embedding stacks. Do not use `npm audit fix --force` without reviewing the
proposed breaking changes and testing native builds. See ROADMAP.md.

## Not verified

No iOS/Android device or store build, live AI response, paid subscription,
production deployment, privacy compliance or clinical effectiveness is certified.
The original payment gate remains. A free synthetic self-hosting flow, secure
token storage, user-isolation tests and export/deletion controls are priorities.

A source-only release can help contributors address these gaps; it is not a
recommendation to deploy the current app with real personal records.
