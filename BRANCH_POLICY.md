# Branch Policy

This repository uses four long-lived branches:

| Branch        | Purpose |
|---------------|---------|
| **master**    | Canonical release branch. Production-ready code. Tag releases here. |
| **Dev**       | Active development. Feature branches merge here first. |
| **UAT**       | User Acceptance Testing. Code promoted from Dev for QA and sign-off. |
| **Production**| Deployment target for production. Promoted from UAT after approval. |

## Recommended flow

1. **Develop** on `Dev` (or feature branches merging into `Dev`).
2. **Promote** `Dev` → `UAT` when ready for testing.
3. **Release** `UAT` → `Production` after UAT sign-off.
4. **Sync** `Production` → `master` and tag the release (e.g. `v1.0.0`).

## Commit message conventions

- `feat: description` — New feature
- `fix: description` — Bug fix
- `docs: description` — Documentation only
- `chore: description` — Build, tooling, or non-functional change
- `refactor: description` — Code change that neither fixes a bug nor adds a feature

Keep the subject line short; add a body when needed for context.
