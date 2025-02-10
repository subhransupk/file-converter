const https = require('https');
const fs = require('fs');
const path = require('path');

const files = [
  {
    url: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js',
    output: 'public/ffmpeg-core.js'
  },
  {
    url: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.wasm',
    output: 'public/ffmpeg-core.wasm'
  }
];

function downloadFile(url, output) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(output);
    https.get(url, response => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`Downloaded: ${output}`);
        resolve();
      });
    }).on('error', err => {
      fs.unlink(output, () => {
        reject(err);
      });
    });
  });
}

async function downloadAll() {
  try {
    for (const file of files) {
      await downloadFile(file.url, file.output);
    }
    console.log('All files downloaded successfully!');
  } catch (error) {
    console.error('Error downloading files:', error);
    process.exit(1);
  }
}

downloadAll(); 