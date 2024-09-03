import { createCanvas } from 'canvas';

export default function handler(req, res) {
  // Extract the 'string' query parameter
  const { string = 'CAPTCHA' } = req.query;

  // Create a canvas
  const canvas = createCanvas(200, 70);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#f0f0f0';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Text settings
  ctx.font = '30px Arial';
  ctx.fillStyle = '#000';
  ctx.fillText(string, 50, 50);

  // Add noise (lines)
  ctx.strokeStyle = '#888';
  ctx.lineWidth = 2;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
    ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
    ctx.stroke();
  }

  // Convert canvas to image buffer
  const buffer = canvas.toBuffer('image/png');

  // Set response headers and send image
  res.setHeader('Content-Type', 'image/png');
  res.status(200).send(buffer);
}