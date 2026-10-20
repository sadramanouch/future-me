# Future Me

An experimental React Native/Expo app for guided self-reflection: build a
future-self persona, have AI-assisted conversations, and revisit memories and
reflections. Historical code and package names still use “Future You”.

**Contributors and co-maintainers wanted.** The founder is opening the code so
the community can develop it further. See [ROADMAP.md](ROADMAP.md) for small
tasks and [CONTRIBUTING.md](CONTRIBUTING.md) for the contribution process.

## Current state

The repository contains the mobile/web UI and an Express/SQLite backend in
`server/`: onboarding, authentication, stored profiles, conversations, memory
retrieval, reflections, notifications and a subscription scaffold.

This is a prototype, not a prediction of a person's future or a clinical service.
Use synthetic profiles while developing. Profiles, journal text, images and
authentication tokens require a privacy/security review before real-user hosting.
AsyncStorage is not an encrypted secret store. See the roadmap for the open work.

## Local setup

Use Node.js 22. Install the locked dependencies:

```sh
npm ci
npm ci --prefix server
```

In one terminal, from the repository root:

```sh
cd server
JWT_SECRET=$(node -e "process.stdout.write(require('crypto').randomBytes(32).toString('hex'))") PORT=3005 npm start
```

The server binds to `127.0.0.1` by default and creates a local SQLite file.
Keep that database private. A missing signing secret stops startup. Payment
endpoints return an explicit unavailable response until Stripe is configured.
Health: http://127.0.0.1:3005/api/health.

In another terminal, from the repository root:

```sh
EXPO_PUBLIC_API_URL=http://127.0.0.1:3005/api npm run web
```

For a physical device, use your own computer's reachable LAN address and bind
the server with `HOST=0.0.0.0` only on a trusted development network. Native
speech recognition needs an Expo development build; do not assume Expo Go
supports the voice module. Web, Android and iOS need separate verification.

## Optional services and cost

- AI requests use the server-side `CLAUDE_API_KEY`. No key is bundled and no AI
  calls are made by the smoke tests. Using your own key can incur charges.
- The inherited payment gate is still present. Full end-to-end onboarding and
  chat without billing is a roadmap item; do not pay the founder's old service
  to develop the app. Stripe keys, price IDs and webhooks must belong to your
  own test environment if you work on billing.
- Embeddings use `Xenova/all-MiniLM-L6-v2`, downloaded on first use under its
  own model license. No model weights are included in the repository.
- The photo effect currently uses image filters; it is not a validated
  age-progression model.

See `server/.env.example` and root `.env.example` for configuration names.
`EXPO_PUBLIC_*` values are shipped to clients: never put private keys there.
The source defaults to localhost and excludes the founder's Expo update project
and App Store submission target. Configure your own identifiers before building.

## Checks

```sh
npm run typecheck
npm run test:server
```

Dependency advisories remain in the inherited Expo/React Native/voice and
embedding stacks after compatible updates. The next major milestone is a
supported SDK/dependency migration with device tests. Do not treat this source
release as ready for public hosting. No native store build or live payment/AI
integration is certified by the local checks.

## Contribute

Start with [the offline development flow](https://github.com/sadramanouch/future-me/issues/2),
[dependency migration](https://github.com/sadramanouch/future-me/issues/1), or
[privacy and user-isolation tests](https://github.com/sadramanouch/future-me/issues/3).

Start with the reproducible local setup, synthetic onboarding fixtures, a
development path without the payment gate, accessible forms, or privacy tests.
Larger priorities are the SDK upgrade, secure token storage and deletion/export
controls. Open a focused proposal before changing the persona or memory model.

See [security reporting](SECURITY.md), [community conduct](CODE_OF_CONDUCT.md)
and [the MIT license](LICENSE). Third-party packages and model weights retain
their own terms; do not commit personal data or service credentials.

Read [our community charter](GOVERNANCE.md): fork freely, propose focused PRs,
keep attribution, and earn stewardship through reviewed contributions.
