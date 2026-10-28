/**
 * Claude Code PreToolUse hook: block `git commit` while `npm audit` fails.
 *
 * Reads the hook payload on stdin. For any Bash command containing
 * `git commit`, runs `npm audit` in the project root; on failure, exits 2 so
 * Claude Code blocks the command and feeds the audit summary back to Claude
 * (see the "Commits" rule in CLAUDE.md for what Claude must do next).
 */

import { execSync } from 'node:child_process';

let raw = '';
for await (const chunk of process.stdin) raw += chunk;

let command = '';
try {
  command = JSON.parse(raw)?.tool_input?.command ?? '';
} catch {
  process.exit(0); // Not a payload we understand — don't get in the way.
}

if (!/\bgit\s+(?:-[^\s]+\s+)*commit\b/.test(command)) process.exit(0);

try {
  execSync('npm audit', { cwd: process.env.CLAUDE_PROJECT_DIR || process.cwd(), stdio: 'pipe', encoding: 'utf8' });
  process.exit(0);
} catch (err) {
  const output = `${err.stdout ?? ''}${err.stderr ?? ''}`.trim().split('\n').slice(-40).join('\n');
  process.stderr.write(
    `Commit blocked: \`npm audit\` reported vulnerabilities.\n\n${output}\n\n` +
      'Fix them (npm audit fix, or upgrade the affected packages), rebuild, ask the user to retest, then commit again.\n',
  );
  process.exit(2);
}
