const sharp = require('sharp');
const path = require('path');

const svgPath = path.join(__dirname, '../assets/images/icon.svg');
const sizes = [
  { file: 'icon.png', size: 1024 },
  { file: 'adaptive-icon.png', size: 1024 },
  { file: 'splash-icon.png', size: 200 },
  { file: 'favicon.png', size: 48 },
];

(async () => {
  for (const { file, size } of sizes) {
    const outPath = path.join(__dirname, '../assets/images', file);
    await sharp(svgPath)
      .resize(size, size)
      .png()
      .toFile(outPath);
    console.log(`✓ Generated ${file} (${size}x${size})`);
  }
})();
