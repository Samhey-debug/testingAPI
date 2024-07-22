const { Client, Intents } = require('discord.js');

// This function will handle joining the voice channel
async function joinVoiceChannel(token, channelId) {
  const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_VOICE_STATES] });

  return new Promise((resolve, reject) => {
    client.once('ready', async () => {
      try {
        const channel = await client.channels.fetch(channelId);
        if (channel && channel.isVoice()) {
          await channel.join();
          resolve(`Joined voice channel: ${channel.name}`);
        } else {
          reject('Channel is not a voice channel or not found');
        }
      } catch (error) {
        reject(`Error joining voice channel: ${error.message}`);
      } finally {
        client.destroy(); // Ensure the client is destroyed after operation
      }
    });

    client.login(token).catch(reject);
  });
}

module.exports = async (req, res) => {
  const { token, id: channelId } = req.query;

  if (!token || !channelId) {
    return res.status(400).json({ error: 'Token and channelId are required' });
  }

  try {
    const message = await joinVoiceChannel(token, channelId);
    return res.status(200).json({ message });
  } catch (error) {
    return res.status(500).json({ error });
  }
};
