import { createCanvas } from 'canvas';

export default function handler(req, res) {
  // Extract 'string' query parameter or use default 'CAPTCHA'
  const { string = 'CAPTCHA' } = req.query;

  // Create a canvas with specified dimensions
  const canvas = createCanvas(200, 70);
  const ctx = canvas.getContext('2d');

  // Set background color
  ctx.fillStyle = '#f0f0f0';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Set text properties
  ctx.font = '30px Arial';
  ctx.fillStyle = '#000';
  ctx.textAlign = 'center'; // Center align text
  ctx.textBaseline = 'middle'; // Middle align text
  ctx.fillText(string, canvas.width / 2, canvas.height / 2);

  // Add noise (lines) for CAPTCHA effect
  ctx.strokeStyle = '#888';
  ctx.lineWidth = 2;
  for (let i = 0; i < 5; i++) { // Increased noise lines for better CAPTCHA
    ctx.beginPath();
    ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
    ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
    ctx.stroke();
  }

  // Convert canvas to PNG buffer
  const buffer = canvas.toBuffer('image/png');

  // Set response headers and send image
  res.setHeader('Content-Type', 'image/png');
  res.status(200).send(buffer);
}