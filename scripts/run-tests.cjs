const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
function collect(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? collect(file) : entry.name.endsWith('.test.cjs') ? [file] : [];
  });
}
const directories = ['src', ...(process.argv.includes('--app') ? [] : ['supabase/tests'])];
const files = directories.flatMap((directory) => collect(path.join(root, directory))).sort();
const result = spawnSync(process.execPath, ['--test', ...files], { cwd: root, stdio: 'inherit' });
if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}
process.exit(result.status ?? 1);
