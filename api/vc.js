const { Client, Intents } = require('discord.js');
const { joinVoiceChannel } = require('@discordjs/voice');

async function joinVoiceChannelFunction(token, channelId) {
  const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_VOICE_STATES] });

  return new Promise((resolve, reject) => {
    client.once('ready', async () => {
      try {
        const channel = await client.channels.fetch(channelId);

        if (channel && channel.isVoice()) {
          joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            adapterCreator: channel.guild.voiceAdapterCreator,
          });

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
    const message = await joinVoiceChannelFunction(token, channelId);
    return res.status(200).json({ message });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error });
  }
};
