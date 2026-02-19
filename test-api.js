
import https from 'https';

const options = {
  method: 'GET',
  hostname: 'youtube-media-downloader.p.rapidapi.com',
  port: null,
  path: '/v2/search?query=jNQXAC9IVRw',
  headers: {
    'x-rapidapi-key': '528ae111eamsh81c96b58f6837bfp19ddc2jsne0f74137919c',
    'x-rapidapi-host': 'youtube-media-downloader.p.rapidapi.com'
  }
};

const req = https.request(options, function (res) {
  const chunks = [];

  res.on('data', function (chunk) {
    chunks.push(chunk);
  });

  res.on('end', function () {
    const body = Buffer.concat(chunks);
    console.log(body.toString());
  });
});

req.end();
