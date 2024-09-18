import fetch from 'node-fetch';
import fs from 'fs';
import FormData from 'form-data';

// API Function
export default async function handler(req, res) {
  const { token, channelID, channelID2 } = req.query;

  if (!token || !channelID || !channelID2) {
    return res.status(400).json({ error: 'Missing required parameters.' });
  }

  try {
    // Fetch messages from channelID1
    const messages = await fetchMessages(token, channelID);

    if (!messages.length) {
      return res.status(404).json({ error: 'No messages found in the channel.' });
    }

    // Create .txt file with fetched messages
    const filePath = await createTextFile(messages);

    // Send the .txt file to channelID2
    await sendFileToChannel(token, channelID2, filePath);

    // Respond with success
    res.status(200).json({ success: 'Messages transferred successfully.' });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

// Function to fetch messages from a channel
async function fetchMessages(token, channelID) {
  const url = `https://discord.com/api/v10/channels/${channelID}/messages`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bot ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch messages');
  }

  const messages = await response.json();
  return messages.map(msg => `${msg.author.username}: ${msg.content}`).reverse();
}

// Function to create a .txt file from messages
function createTextFile(messages) {
  return new Promise((resolve, reject) => {
    const filePath = '/tmp/messages.txt'; // Save in Vercel's temporary storage

    fs.writeFile(filePath, messages.join('\n'), (err) => {
      if (err) {
        reject(err);
      } else {
        resolve(filePath);
      }
    });
  });
}

// Function to send the .txt file to another channel
async function sendFileToChannel(token, channelID2, filePath) {
  const url = `https://discord.com/api/v10/channels/${channelID2}/messages`;
  const form = new FormData();
  
  form.append('file', fs.createReadStream(filePath), {
    filename: 'messages.txt',
    contentType: 'text/plain'
  });

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bot ${token}`
    },
    body: form
  });

  if (!response.ok) {
    throw new Error('Failed to send file to channel');
  }
}