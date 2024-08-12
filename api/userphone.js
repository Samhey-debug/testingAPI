export default async (req, res) => {
  const { token, message, channelIDs, username, currentChannelID } = req.query;

  if (!token || !message || !channelIDs || !username || !currentChannelID) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  // Split channelIDs by '-' and filter out empty strings
  let channels = channelIDs.split('-').filter(id => id.trim() !== '');

  // Limit to 100 channels
  if (channels.length > 100) {
    channels = channels.slice(0, 100);
  }

  // Remove the current channel ID from the list if provided
  if (currentChannelID) {
    channels = channels.filter(id => id !== currentChannelID);
  }

  try {
    for (const channelId of channels) {
      // Send HTTP request to Discord API to post the message
      await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bot ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: `${username}: ${message}` })
      });
    }

    res.status(200).json({ success: 'Messages sent!' });
  } catch (error) {
    console.error('Error sending messages:', error);
    res.status(500).json({ error: 'Failed to send messages' });
  }
};
