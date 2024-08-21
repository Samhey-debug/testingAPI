const fetch = require('node-fetch');

module.exports = async (req, res) => {
  if (req.method === 'POST' && req.url === '/translate') {
    let body = '';

    req.on('data', chunk => {
      body += chunk.toString(); // Convert Buffer to string
    });

    req.on('end', async () => {
      try {
        const { text, targetLanguage } = JSON.parse(body);

        if (!text || !targetLanguage) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Text and targetLanguage are required.' }));
          return;
        }

        const response = await fetch('https://libretranslate.de/translate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            q: text,
            source: 'auto',
            target: targetLanguage,
            format: 'text'
          })
        });

        if (!response.ok) {
          throw new Error('Translation API request failed');
        }

        const data = await response.json();
        const translatedText = data.translatedText;

        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ translatedText }));
      } catch (error) {
        console.error(error);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Internal Server Error' }));
      }
    });
  } else {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Not Found' }));
  }
};