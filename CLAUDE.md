@AGENTS.md

# Commits

Before every `git commit`, run `npm audit`. A commit must not be made while it reports any vulnerability — `.claude/hooks/npm-audit-gate.mjs` (PreToolUse hook in `.claude/settings.json`) enforces this by blocking the commit.

When the audit fails (or the hook blocks a commit):

1. Fix the issues — `npm audit fix` first; for anything left, upgrade the affected package (prefer non-breaking upgrades; never use `--force` without asking). Check release notes for anything that changes behaviour.
2. Re-run `npm audit` until it reports 0 vulnerabilities, then type-check, lint and `npm run build`.
3. Stop and ask the user to retest the affected areas of the site. Do not commit until they confirm.
4. Then commit again, mentioning the dependency changes in the commit message.
