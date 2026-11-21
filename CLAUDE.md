@AGENTS.md

# Commits

Before every `git commit`, run `npm audit`. A commit must not be made while it reports any vulnerability — `.claude/hooks/npm-audit-gate.mjs` (PreToolUse hook in `.claude/settings.json`) enforces this by blocking the commit.

When the audit fails (or the hook blocks a commit):

1. Fix the issues — `npm audit fix` first; for anything left, upgrade the affected package (prefer non-breaking upgrades; never use `--force` without asking). Check release notes for anything that changes behaviour.
2. Re-run `npm audit` until it reports 0 vulnerabilities, then type-check, lint and `npm run build`.
3. Stop and ask the user to retest the affected areas of the site. Do not commit until they confirm.
4. Then commit again, mentioning the dependency changes in the commit message.

# Deployment — staging first, always

Never merge or push to `main` (production) without the user's explicit approval.

1. Commit work on the feature branch.
2. Deploy it to the `staging` branch (merge the feature branch into `staging` and push). Netlify builds a branch deploy for it.
3. Tell the user it's ready to test on staging, with what to check.
4. Only after the user approves, merge to `main` (via the pull request). Approval for one change does not cover the next.

# What's On events

Events have dates. Never add an event without a date. Past events are hidden automatically. When editing events, also remove any that are past from the data file.

- Data file: `content/whats-on.ts` (weekly timetable + one-off events). Don't hard-code events in page markup.
- `/activities` renders on every request (`connection()`) and filters by Europe/London time, so no rebuild is needed for events to hide.
- After editing, run `npm run check:whats-on`.
