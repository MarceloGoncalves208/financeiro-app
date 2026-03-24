/**
 * Gera ícones PNG mínimos para o PWA usando apenas módulos nativos do Node.js.
 * Cria arquivos PNG válidos com fundo azul e letra "CS".
 */

const fs = require('fs');
const path = require('path');

// PNG helper — cria um PNG simples sem dependências externas
function createSimplePNG(size, bgColor, text) {
  const zlib = require('zlib');

  const width = size;
  const height = size;

  // Raw image data: RGBA
  const pixels = Buffer.alloc(width * height * 4);

  const [bgR, bgG, bgB] = bgColor;

  // Fill background
  for (let i = 0; i < width * height; i++) {
    pixels[i * 4]     = bgR;
    pixels[i * 4 + 1] = bgG;
    pixels[i * 4 + 2] = bgB;
    pixels[i * 4 + 3] = 255;
  }

  // Draw a simple white circle in the middle (decorative)
  const cx = width / 2;
  const cy = height / 2;
  const r = width * 0.3;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy <= r * r) {
        const idx = (y * width + x) * 4;
        pixels[idx]     = 255;
        pixels[idx + 1] = 255;
        pixels[idx + 2] = 255;
        pixels[idx + 3] = 40; // semi-transparent
      }
    }
  }

  // Build PNG scanlines (filter byte 0 = None per row)
  const scanlines = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    scanlines[y * (1 + width * 4)] = 0; // filter type None
    pixels.copy(scanlines, y * (1 + width * 4) + 1, y * width * 4, (y + 1) * width * 4);
  }

  const compressed = zlib.deflateSync(scanlines, { level: 6 });

  function u32(n) {
    const b = Buffer.alloc(4);
    b.writeUInt32BE(n, 0);
    return b;
  }

  function crc32(buf) {
    const table = (() => {
      const t = new Uint32Array(256);
      for (let i = 0; i < 256; i++) {
        let c = i;
        for (let j = 0; j < 8; j++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
        t[i] = c;
      }
      return t;
    })();
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
    return (crc ^ 0xffffffff) >>> 0;
  }

  function chunk(type, data) {
    const typeBytes = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.concat([typeBytes, data]);
    return Buffer.concat([u32(data.length), typeBytes, data, u32(crc32(crcBuf))]);
  }

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR: width, height, bit depth 8, color type 6 (RGBA), compress 0, filter 0, interlace 0
  const ihdr = Buffer.concat([u32(width), u32(height), Buffer.from([8, 6, 0, 0, 0])]);

  const png = Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ]);

  return png;
}

const publicDir = path.join(__dirname, 'public');

const icon192 = createSimplePNG(192, [26, 115, 232], 'CS');
const icon512 = createSimplePNG(512, [26, 115, 232], 'CS');

fs.writeFileSync(path.join(publicDir, 'icon-192.png'), icon192);
fs.writeFileSync(path.join(publicDir, 'icon-512.png'), icon512);

console.log('Ícones gerados: icon-192.png e icon-512.png');
