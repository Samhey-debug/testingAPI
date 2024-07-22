const { Client, Intents } = require('discord.js');
const { joinVoiceChannel, entersState, VoiceConnectionStatus } = require('@discordjs/voice');

async function joinVoiceChannelFunction(token, channelId) {
  const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_VOICE_STATES] });

  return new Promise((resolve, reject) => {
    client.once('ready', async () => {
      try {
        const channel = await client.channels.fetch(channelId);

        if (channel && channel.isVoice()) {
          console.log(`Attempting to join voice channel: ${channel.name}`);
          
          const connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            adapterCreator: channel.guild.voiceAdapterCreator,
          });

          try {
            await entersState(connection, VoiceConnectionStatus.Ready, 30_000);
            console.log(`Successfully joined voice channel: ${channel.name}`);
            resolve(`Joined voice channel: ${channel.name}`);
          } catch (error) {
            connection.destroy();
            console.error(`Failed to join voice channel within 30 seconds: ${error.message}`);
            reject(`Failed to join voice channel within 30 seconds: ${error.message}`);
          }
        } else {
          console.error('Channel is not a voice channel or not found');
          reject('Channel is not a voice channel or not found');
        }
      } catch (error) {
        console.error(`Error fetching channel or joining voice channel: ${error.message}`);
        reject(`Error joining voice channel: ${error.message}`);
      } finally {
        client.destroy(); // Ensure the client is destroyed after operation
      }
    });

    client.login(token).catch(error => {
      console.error(`Error logging in: ${error.message}`);
      reject(`Error logging in: ${error.message}`);
    });
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
    console.error('Error in joinVoiceChannelFunction:', error);
    return res.status(500).json({ error });
  }
};
