# Contributor roadmap

The goal is a self-hostable, privacy-conscious reflection app. Work is currently
a prototype; these tasks are proposals, not commitments to deliver dates.

| Priority | Task | Acceptance criterion |
| --- | --- | --- |
| First contribution | Verify clean setup | Run README steps on a fresh machine with synthetic data and report platform/runtime versions. |
| First contribution | Add an offline development flow | Exercise onboarding and chat screens without paid AI, Stripe or the founder's backend; label synthetic responses. |
| Release blocker | Upgrade Expo/React Native/voice | Use a supported SDK; triage remaining advisories; pass typecheck, web export and native device smoke tests. |
| Release blocker | Upgrade server embedding dependencies | Replace or update vulnerable transitive packages; preserve embedding retrieval with fixed synthetic fixtures. |
| Release blocker | Protect authentication and personal data | Use suitable secure token storage, document retention, add export/deletion controls and verify user isolation. |
| High | Harden the persona and memory pipeline | Test inaccurate memories, prompt injection, sensitive inputs and unavailable AI; avoid claims of predicted outcomes. |
| High | Separate billing from community self-hosting | Define a reviewed deployment policy and tests; never silently bypass hosted production billing. |
| Later | Accessibility and native verification | Check screen readers, reduced motion, voice permission refusal and image-picker failure on iOS/Android. |

Do not publish real journal data, selfies or credentials in reproduction cases.
An assigned task should have one owner, a small PR and explicit verification.
