const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'assets', 'images', 'excercises');

for (let i = 56; i <= 120; i++) {
  const sourceId = ((i - 1) % 55) + 1;
  const sourcePath = path.join(dir, sourceId + '.jpeg');
  const destPath = path.join(dir, i + '.jpeg');
  if (!fs.existsSync(destPath)) {
    fs.copyFileSync(sourcePath, destPath);
  }
}

console.log('Todas las imágenes del 56 al 120 creadas correctamente.');
