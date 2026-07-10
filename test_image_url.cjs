const https = require('https');

const url = 'https://tmpfiles.org/wrw3Ycfpakbq/media__1783674107951.jpg';

https.get(url, (res) => {
  console.log('Status Code:', res.statusCode);
  console.log('Headers:', JSON.stringify(res.headers, null, 2));
  
  let body = '';
  res.on('data', (chunk) => {
    body += chunk.toString('utf-8');
  });
  res.on('end', () => {
    console.log('Body length:', body.length);
    console.log('Body preview:', body.substring(0, 500));
  });
}).on('error', (err) => {
  console.error('Error fetching image URL:', err);
});
