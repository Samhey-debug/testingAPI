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

        // Discord embed object with username only
        const embed = {
            title: `Thank you, ${username}`,
            description: `${username} has just voted on top.gg! Thank you!`,
            color: 0x01AEC4, // Hex color value
            thumbnail: {
                url: `https://cdn.discordapp.com/avatars/${bot}/${bot}.png`
            },
            footer: {
                text: 'Powered by top.gg',
            }
        };

        const messageContent = {
            embeds: [embed],
            content: "", // Can be empty if only the embed is needed
        };

        // Send the embed message using Discord API
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

        res.status(200).json({ message: 'Embed message sent successfully to Discord!' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}