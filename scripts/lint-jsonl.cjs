const fs = require('fs');
const path = require('path');

function collectJsonl(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return collectJsonl(fullPath);
    }
    return entry.name.endsWith('.jsonl') ? [fullPath] : [];
  });
}

let hasError = false;
for (const file of collectJsonl(process.cwd())) {
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/).filter(Boolean);
  lines.forEach((line, idx) => {
    try {
      JSON.parse(line);
    } catch (err) {
      console.error(`${file}:${idx + 1} ${err.message}`);
      hasError = true;
    }
  });
}
if (hasError) {
  process.exit(1);
}
