// Draws the app icons (a dark dish with a few glowing motes) with no dependencies. node scripts/make-icons.mjs
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';
const crcT = new Uint32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc = b => { let c = ~0; for (const x of b) c = crcT[(c ^ x) & 255] ^ (c >>> 8); return ~c >>> 0; };
const chunk = (t, d) => { const o = Buffer.alloc(12 + d.length); o.writeUInt32BE(d.length, 0); o.write(t, 4); d.copy(o, 8); o.writeUInt32BE(crc(o.subarray(4, 8 + d.length)), 8 + d.length); return o; };
function png(size) {
  const px = Buffer.alloc(size * size * 4), s = size / 512;
  const motes = [[200, 230, 64, [120, 230, 150]], [330, 200, 48, [255, 150, 90]], [300, 340, 58, [110, 170, 255]], [180, 350, 34, [230, 120, 220]], [370, 320, 26, [240, 230, 110]]];
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    let r = 11, g = 15, b = 20;
    const dx = x / s - 256, dy = y / s - 256, d = Math.hypot(dx, dy);
    if (d < 230) { r = 20; g = 28; b = 38; }
    if (d > 222 && d < 234) { r = 60; g = 82; b = 106; }
    for (const [mx, my, mr, c] of motes) {
      const dd = Math.hypot(x / s - mx, y / s - my);
      if (dd < mr) { const k = 0.65 + 0.35 * (1 - dd / mr); r = c[0] * k; g = c[1] * k; b = c[2] * k; }
      else if (dd < mr * 1.9) { const k = Math.pow(1 - (dd - mr) / (mr * 0.9), 2) * 0.35; r += c[0] * k; g += c[1] * k; b += c[2] * k; }
    }
    const i = (y * size + x) * 4; px[i] = Math.min(255, r); px[i + 1] = Math.min(255, g); px[i + 2] = Math.min(255, b); px[i + 3] = 255;
  }
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) { raw[y * (size * 4 + 1)] = 0; px.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4); }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
writeFileSync(new URL('../icon-192.png', import.meta.url), png(192));
writeFileSync(new URL('../icon-512.png', import.meta.url), png(512));
console.log('icons written');
