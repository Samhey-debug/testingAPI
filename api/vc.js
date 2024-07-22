const { Client, Intents } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, entersState, VoiceConnectionStatus } = require('@discordjs/voice');
const ytdl = require('ytdl-core');

async function joinVoiceChannelFunction(token, channelId, url) {
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

          // Create an audio player
          const player = createAudioPlayer();

          // Subscribe the connection to the audio player (will play audio from now on)
          connection.subscribe(player);

          connection.on(VoiceConnectionStatus.Disconnected, () => {
            console.log('Disconnected from the voice channel, attempting to reconnect...');
            entersState(connection, VoiceConnectionStatus.Connecting, 5_000).catch(() => {
              console.log('Failed to reconnect, destroying the connection.');
              connection.destroy();
            });
          });

          try {
            await entersState(connection, VoiceConnectionStatus.Ready, 30_000);
            console.log(`Successfully joined voice channel: ${channel.name}`);

            if (url) {
              // Stream the audio from YouTube
              const stream = ytdl(url, { filter: 'audioonly' });
              const resource = createAudioResource(stream);

              player.play(resource);

              player.on(AudioPlayerStatus.Playing, () => {
                console.log('The audio player has started playing!');
              });

              player.on(AudioPlayerStatus.Idle, () => {
                console.log('The audio player is idle!');
                connection.destroy();
                client.destroy();
                resolve('Finished playing and left the voice channel.');
              });

              player.on('error', error => {
                console.error(`Error: ${error.message} with resource ${error.resource.metadata.title}`);
              });
            } else {
              console.log('No URL provided, joining without playing music.');
              resolve(`Joined voice channel: ${channel.name}`);
            }
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
      }
    });

    client.login(token).catch(error => {
      console.error(`Error logging in: ${error.message}`);
      reject(`Error logging in: ${error.message}`);
    });
  });
}

module.exports = async (req, res) => {
  const { token, id: channelId, url } = req.query;

  if (!token || !channelId) {
    return res.status(400).json({ error: 'Token and channelId are required' });
  }

  try {
    const message = await joinVoiceChannelFunction(token, channelId, url);
    return res.status(200).json({ message });
  } catch (error) {
    console.error('Error in joinVoiceChannelFunction:', error);
    return res.status(500).json({ error });
  }
};
