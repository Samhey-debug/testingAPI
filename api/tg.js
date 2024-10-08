import fetch from 'node-fetch';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Only POST requests allowed' });
    }

    const { user, bot, type } = req.body;

    if (!user || !bot || !type) {
        return res.status(400).json({ message: 'Missing data in request' });
    }

    try {
        // Fetch the user's information from Discord API
        const userResponse = await fetch(`https://discord.com/api/v10/users/${user}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bot ${process.env.DISCORD_BOT_TOKEN}`,
                'Content-Type': 'application/json',
            },
        });

        if (!userResponse.ok) {
            const errorResponse = await userResponse.json();
            return res.status(userResponse.status).json({ message: 'Failed to fetch user data from Discord', error: errorResponse });
        }

        const userData = await userResponse.json();
        const username = userData.username;

        // Construct the embed for the main message
        const embed = {
            title: `Thank you, ${username}!`,
            description: `${username} has just voted on [top.gg](https://top.gg/bot/1233001713242476678/vote)! Your support means a lot to us.`,
            color: 0x01AEC4, // Hex color value
            thumbnail: {
                url: 'https://i.imgur.com/nhTkhEn.gif'
            },
            footer: {
                text: 'Powered by Server Maker',
            },
            timestamp: new Date(),
        };

        const messageContent = {
            embeds: [embed],
            content: "", // Can be empty if only the embed is needed
        };

        // Send the embed message to the specified channel
        const discordEndpoint = `https://discord.com/api/v10/channels/${process.env.DISCORD_CHANNEL_ID}/messages`;

        const response = await fetch(discordEndpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bot ${process.env.DISCORD_BOT_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(messageContent),
        });

        if (!response.ok) {
            const errorResponse = await response.json();
            return res.status(response.status).json({ message: 'Failed to send message to Discord', error: errorResponse });
        }

        // Log the request details to a different channel
        const logChannelID = '1278454337500086312'; // Replace with your log channel ID
        const logEmbed = {
            title: 'Webhook Request Received',
            color: 0x01AEC4,
            fields: [
                { name: 'User ID', value: user, inline: true },
                { name: 'Bot ID', value: bot, inline: true },
                { name: 'Type', value: type, inline: true },
                { name: 'Request Body', value: `\`\`\`json\n${JSON.stringify(req.body, null, 2)}\n\`\`\``, inline: false }
            ],
            timestamp: new Date(),
        };

        const logMessageContent = {
            embeds: [logEmbed],
        };

        const logEndpoint = `https://discord.com/api/v10/channels/${logChannelID}/messages`;

        await fetch(logEndpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bot ${process.env.DISCORD_BOT_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(logMessageContent),
        });

        res.status(200).json({ message: 'Embed message and log sent successfully!' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}