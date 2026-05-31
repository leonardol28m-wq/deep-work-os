/**
 * Deep Work OS — Icon Generator
 * Generates PNG icons using node-canvas (if available)
 * Falls back to placeholder PNGs otherwise
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ICONS_DIR = join(__dirname, '../public/icons');
mkdirSync(ICONS_DIR, { recursive: true });

// Minimal valid 1x1 purple-tinted PNG placeholder
const PLACEHOLDER_PNG = Buffer.from(
  '89504e470d0a1a0a0000000d49484452000000010000000108020000009001' +
  '2e00000000c4944415478016360f8cfc0000000200017334b820000000049454e44ae426082',
  'hex'
);

const sizes = [16, 32, 48, 128];

try {
  const { createCanvas } = await import('canvas');
  for (const size of sizes) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, size, size);
    grad.addColorStop(0, '#1A0A2E');
    grad.addColorStop(1, '#0A0A1F');
    const r = size * 0.2;
    ctx.beginPath();
    ctx.moveTo(r, 0); ctx.lineTo(size-r, 0); ctx.quadraticCurveTo(size, 0, size, r);
    ctx.lineTo(size, size-r); ctx.quadraticCurveTo(size, size, size-r, size);
    ctx.lineTo(r, size); ctx.quadraticCurveTo(0, size, 0, size-r);
    ctx.lineTo(0, r); ctx.quadraticCurveTo(0, 0, r, 0);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();
    const cx = size/2, cy = size/2;
    const outerR = size * 0.36;
    const arcGrad = ctx.createLinearGradient(cx-outerR, cy-outerR, cx+outerR, cy+outerR);
    arcGrad.addColorStop(0, '#A78BFA'); arcGrad.addColorStop(1, '#7C3AED');
    ctx.beginPath(); ctx.arc(cx, cy, outerR, 0, Math.PI*2);
    ctx.strokeStyle = arcGrad; ctx.lineWidth = size * 0.06; ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, size*0.14, 0, Math.PI*2);
    ctx.fillStyle = '#7C3AED'; ctx.fill();
    writeFileSync(join(ICONS_DIR, `icon${size}.png`), canvas.toBuffer('image/png'));
    console.log(`✅ Generated icon${size}.png (canvas)`);
  }
} catch {
  for (const size of sizes) {
    writeFileSync(join(ICONS_DIR, `icon${size}.png`), PLACEHOLDER_PNG);
    console.log(`✅ Created placeholder icon${size}.png`);
  }
}

console.log('✅ Icons ready in public/icons/');
