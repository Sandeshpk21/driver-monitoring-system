const fs = require('fs');
const path = require('path');

// Simple SVG to create placeholder images
const createSVG = (width, height, text, bgColor = '#3B82F6') => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" fill="${bgColor}"/>
  <circle cx="${width/2}" cy="${height/2 - 20}" r="${Math.min(width, height) * 0.2}" fill="white" opacity="0.9"/>
  <text x="${width/2}" y="${height/2}" font-family="Arial, sans-serif" font-size="${Math.min(width, height) * 0.08}" fill="white" text-anchor="middle" dominant-baseline="middle">
    ${text}
  </text>
  <text x="${width/2}" y="${height/2 + 40}" font-family="Arial, sans-serif" font-size="${Math.min(width, height) * 0.05}" fill="white" text-anchor="middle" dominant-baseline="middle">
    Driver Monitor
  </text>
</svg>`;
};

// Create PNG using a simple bitmap approach
const createSimplePNG = (width, height, filename) => {
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8);  // bit depth
  ihdr.writeUInt8(2, 9);  // color type (RGB)
  ihdr.writeUInt8(0, 10); // compression
  ihdr.writeUInt8(0, 11); // filter
  ihdr.writeUInt8(0, 12); // interlace

  // Create a simple blue square with white center
  const imageData = [];
  for (let y = 0; y < height; y++) {
    imageData.push(0); // filter byte
    for (let x = 0; x < width; x++) {
      const distFromCenter = Math.sqrt(Math.pow(x - width/2, 2) + Math.pow(y - height/2, 2));
      const inCircle = distFromCenter < Math.min(width, height) * 0.3;

      if (inCircle) {
        // White center
        imageData.push(255, 255, 255);
      } else {
        // Blue background
        imageData.push(59, 130, 246);
      }
    }
  }

  const zlib = require('zlib');
  const compressed = zlib.deflateSync(Buffer.from(imageData));

  // Helper to create chunk
  const createChunk = (type, data) => {
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length);

    const typeBuffer = Buffer.from(type);
    const chunk = Buffer.concat([typeBuffer, data]);

    // Simple CRC (not perfect but works for basic PNGs)
    const crc = Buffer.alloc(4);
    let crcValue = 0xffffffff;
    for (let i = 0; i < chunk.length; i++) {
      crcValue = (crcValue >>> 8) ^ ((crcValue ^ chunk[i]) & 0xff) * 0xedb88320;
    }
    crc.writeUInt32BE(~crcValue >>> 0);

    return Buffer.concat([length, chunk, crc]);
  };

  // Combine all chunks
  const ihdrChunk = createChunk('IHDR', ihdr);
  const idatChunk = createChunk('IDAT', compressed);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  const png = Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);

  fs.writeFileSync(path.join(__dirname, 'assets', filename), png);
  console.log(`Created ${filename}`);
};

// Alternative: Use Expo's default icon as base
const useExpoDefault = () => {
  const defaultIcon = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <rect width="1024" height="1024" fill="#3B82F6"/>
  <circle cx="512" cy="400" r="180" fill="white" opacity="0.9"/>
  <path d="M 350 600 L 350 700 Q 350 750 400 750 L 624 750 Q 674 750 674 700 L 674 600"
        stroke="white" stroke-width="40" fill="none" stroke-linecap="round"/>
  <text x="512" y="850" font-family="Arial" font-size="80" fill="white" text-anchor="middle">
    DRIVER MONITOR
  </text>
</svg>`;

  // Save SVG files
  fs.writeFileSync(path.join(__dirname, 'assets', 'icon.svg'), defaultIcon);
  fs.writeFileSync(path.join(__dirname, 'assets', 'adaptive-icon.svg'), defaultIcon);

  // Create splash with different aspect ratio
  const splash = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1284" height="2778" viewBox="0 0 1284 2778" xmlns="http://www.w3.org/2000/svg">
  <rect width="1284" height="2778" fill="#3B82F6"/>
  <circle cx="642" cy="1200" r="200" fill="white" opacity="0.9"/>
  <text x="642" y="1500" font-family="Arial" font-size="100" fill="white" text-anchor="middle">
    DRIVER
  </text>
  <text x="642" y="1620" font-family="Arial" font-size="100" fill="white" text-anchor="middle">
    MONITOR
  </text>
</svg>`;

  fs.writeFileSync(path.join(__dirname, 'assets', 'splash.svg'), splash);

  console.log('Created SVG assets. Use an online converter to convert to PNG if needed.');
  console.log('Recommended: https://cloudconvert.com/svg-to-png');
};

// Try to create simple PNGs, fallback to SVG
try {
  // For now, just create SVG files which Expo can handle
  useExpoDefault();

  console.log('\n✅ Assets created successfully!');
  console.log('\nNote: Basic SVG files created. For production, replace with proper PNG images.');
  console.log('Expo prebuild might still work with these placeholder assets.');
} catch (error) {
  console.error('Error creating assets:', error);
  console.log('\nTrying to download default Expo icon...');

  // Download a default icon from Expo
  const https = require('https');
  const iconUrl = 'https://raw.githubusercontent.com/expo/expo/main/templates/expo-template-blank/assets/icon.png';

  const download = (url, dest) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`Downloaded ${dest}`);
      });
    });
  };

  download(iconUrl, path.join(__dirname, 'assets', 'icon.png'));
  download(iconUrl, path.join(__dirname, 'assets', 'adaptive-icon.png'));
  download(iconUrl, path.join(__dirname, 'assets', 'splash.png'));
  download(iconUrl, path.join(__dirname, 'assets', 'favicon.png'));
}