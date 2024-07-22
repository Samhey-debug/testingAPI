const { Client, GatewayIntentBits } = require('discord.js');

module.exports = async (req, res) => {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { token, status } = req.query;

    if (!token || !status) {
        return res.status(400).json({ error: 'Missing token or status parameter' });
    }

    const client = new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.MessageContent,
        ],
    });

    client.once('ready', () => {
        console.log(`Logged in as ${client.user.tag}!`);
        client.user.setPresence({
            activities: [{ name: status, type: 4 }],
            status: 'online',
        });
        console.log('Custom status set!');
    });

    try {
        await client.login(token);
        res.status(200).json({ message: 'Status updated successfully' });
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ error: 'Failed to login with provided token' });
    }
};
