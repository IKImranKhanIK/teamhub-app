// Generates public/icon-192.png and public/icon-512.png
// Dark background (#0d0d0d) with "TH" text in accent yellow (#f5c518)
const { createCanvas } = require('@napi-rs/canvas');
const fs = require('fs');
const path = require('path');

function generateIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#0d0d0d';
  ctx.fillRect(0, 0, size, size);

  // Rounded rectangle clip (16% corner radius)
  const radius = size * 0.16;
  ctx.beginPath();
  ctx.moveTo(radius, 0);
  ctx.lineTo(size - radius, 0);
  ctx.arcTo(size, 0, size, radius, radius);
  ctx.lineTo(size, size - radius);
  ctx.arcTo(size, size, size - radius, size, radius);
  ctx.lineTo(radius, size);
  ctx.arcTo(0, size, 0, size - radius, radius);
  ctx.lineTo(0, radius);
  ctx.arcTo(0, 0, radius, 0, radius);
  ctx.closePath();
  ctx.fillStyle = '#1a1f2e';
  ctx.fill();

  // "TH" text
  const fontSize = Math.round(size * 0.38);
  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.fillStyle = '#f5c518';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('TH', size / 2, size / 2);

  return canvas.toBuffer('image/png');
}

const outDir = path.join(__dirname, '..', 'public');

fs.writeFileSync(path.join(outDir, 'icon-192.png'), generateIcon(192));
console.log('✓ icon-192.png');

fs.writeFileSync(path.join(outDir, 'icon-512.png'), generateIcon(512));
console.log('✓ icon-512.png');
