import { writeFileSync } from 'fs';
import { join } from 'path';

export default function handler(req, res) {
  // Ensure the /logs directory exists
  const logsDir = join(process.cwd(), 'logs');

  // Create a unique filename
  const timestamp = Date.now();
  const logFilename = `log-${timestamp}.html`;
  const logFilePath = join(logsDir, logFilename);

  // Define the content of the new page
  const logContent = `
    <html>
      <head>
        <title>Log Page - ${timestamp}</title>
      </head>
      <body>
        <h1>Log Page Created at ${new Date().toISOString()}</h1>
        <p>This is a sample log entry.</p>
      </body>
    </html>
  `;

  // Write the content to the file
  writeFileSync(logFilePath, logContent);

  // Return the URL of the created log page
  const logUrl = `${req.headers.host}/logs/${logFilename}`;
  res.status(200).json({ url: `https://${logUrl}` });
}