import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
const python = resolve(root, process.platform === 'win32' ? '.venv/Scripts/python.exe' : '.venv/bin/python');
const checks = [
  [python, ['-m', 'pytest', 'backend/tests', '-q']],
  [process.execPath, [resolve(root, 'frontend/node_modules/vitest/vitest.mjs'), 'run', '--root', 'frontend']],
];
for (const [command, args] of checks) {
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit', windowsHide: true });
  if (result.error || result.status !== 0) { console.error(result.error?.message ?? 'Kiểm thử chưa đạt.'); process.exit(result.status || 1); }
}
