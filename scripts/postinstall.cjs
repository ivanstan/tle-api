const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const heavensDir = path.join(__dirname, '..', 'node_modules', 'tle.js');
const distDir = path.join(heavensDir, 'dist');

if (!fs.existsSync(heavensDir)) {
  console.log('heavens.js (tle.js) not found in node_modules, skipping build.');
  process.exit(0);
}

if (fs.existsSync(distDir)) {
  console.log('heavens.js already built, skipping.');
  process.exit(0);
}

console.log('Building heavens.js (tle.js)...');
try {
  execSync('npm install', { cwd: heavensDir, stdio: 'inherit' });
  execSync('npm run build', { cwd: heavensDir, stdio: 'inherit' });
  console.log('heavens.js built successfully.');
} catch (err) {
  console.error('Failed to build heavens.js:', err.message);
  process.exit(1);
}
