const https = require('https');
const fs = require('fs');
const path = require('path');

const imagePath = "src/assets/images/regenerated_image_1783494444543.jpg";

function uploadToPixeldrain(filePath) {
  return new Promise((resolve, reject) => {
    const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
    const filename = path.basename(filePath);
    
    const options = {
      method: 'POST',
      hostname: 'pixeldrain.com',
      path: '/api/file',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (parsed.success && parsed.id) {
            const directUrl = `https://pixeldrain.com/api/file/${parsed.id}`;
            resolve(directUrl);
          } else {
            reject(new Error(`Upload failed: ${body}`));
          }
        } catch (err) {
          reject(new Error(`Failed to parse response: ${body}`));
        }
      });
    });

    req.on('error', (err) => reject(err));

    // Construct multipart form data
    req.write(`--${boundary}\r\n`);
    req.write(`Content-Disposition: form-data; name="file"; filename="${filename}"\r\n`);
    req.write('Content-Type: image/jpeg\r\n\r\n');
    
    const fileStream = fs.createReadStream(filePath);
    fileStream.on('data', (chunk) => req.write(chunk));
    fileStream.on('end', () => {
      req.write(`\r\n--${boundary}--\r\n`);
      req.end();
    });
  });
}

async function test() {
  try {
    console.log("Uploading to Pixeldrain...");
    const url = await uploadToPixeldrain(imagePath);
    console.log("Uploaded! URL:", url);
    
    console.log("Fetching URL to verify content type...");
    https.get(url, (res) => {
      console.log("Status Code:", res.statusCode);
      console.log("Content-Type:", res.headers['content-type']);
    });
  } catch (err) {
    console.error("Test failed:", err);
  }
}

test();
