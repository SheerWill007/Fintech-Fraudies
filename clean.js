const fs = require('fs');
const path = require('path');

const dir = process.cwd();
const files = fs.readdirSync(dir);

for (const file of files) {
  if (file !== '.git' && file !== 'clean.js' && file !== 'task.md' && file !== 'implementation_plan.md') {
    fs.rmSync(path.join(dir, file), { recursive: true, force: true });
  }
}
console.log('Cleaned up');
