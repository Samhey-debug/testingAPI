const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
    const { token, channelID } = req.query;

    if (!token || !channelID) {
        return res.status(400).json({ error: 'Missing required parameters: token, channelID' });
    }

    try {
        // Fetch channel details to get the channel name
        const channelDetails = await fetchChannelDetails(token, channelID);
        const channelName = sanitizeFileName(channelDetails.name); // Sanitize the channel name to make it safe for URLs

        const messages = await fetchMessages(token, channelID);
        const formattedMessages = formatMessages(messages);
        const htmlContent = generateHTMLPage(channelName, formattedMessages);

        // Save the HTML file in the 'public/logs' directory for static serving
        const filePath = path.join(__dirname, '..', 'public', 'logs', `${channelName}.html`);
        fs.writeFileSync(filePath, htmlContent);

        // Return the HTML file link for viewing
        return res.status(200).json({
            message: `View the messages at: https://${req.headers.host}/logs/${channelName}.html`,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'An error occurred', details: error.message });
    }
};

// Function to fetch channel details (including name)
async function fetchChannelDetails(token, channelID) {
    const url = `https://discord.com/api/v10/channels/${channelID}`;
    const response = await fetch(url, {
        headers: {
            Authorization: `Bot ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch channel details: ${response.statusText}`);
    }

    return await response.json();
}

// Function to fetch all messages from a channel
async function fetchMessages(token, channelID) {
    let allMessages = [];
    let lastMessageID;

    while (true) {
        const url = `https://discord.com/api/v10/channels/${channelID}/messages?limit=100${lastMessageID ? `&before=${lastMessageID}` : ''}`;
        const response = await fetch(url, {
            headers: {
                Authorization: `Bot ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch messages: ${response.statusText}`);
        }

        const messages = await response.json();
        allMessages = allMessages.concat(messages);

        if (messages.length < 100) break;
        lastMessageID = messages[messages.length - 1].id;
    }

    return allMessages.reverse(); // To get messages in chronological order
}

// Function to format messages into HTML with emoji handling
function formatMessages(messages) {
    return messages
        .map(
            msg => `
            <div class="message">
                <span class="timestamp">[${new Date(msg.timestamp).toLocaleString()}]</span>
                <span class="author">${msg.author.username}#${msg.author.discriminator}:</span>
                <span class="content">${replaceEmojis(msg.content)}</span>
            </div>`
        )
        .join('');
}

// Function to replace Discord emoji shortcodes and custom emojis with readable text
function replaceEmojis(content) {
    // Replace custom emojis in the format <emoji_name:emoji_id> with [emoji_name]
    content = content.replace(/<:\w+:(\d+)>/g, match => `[${match.split(':')[1]}]`);

    // Replace standard Discord shortcodes like :smile: with their Unicode equivalents
    const emojiMap = {
        ":smile:": "😄",
        ":heart:": "❤️",
        ":thumbsup:": "👍",
        // Add more as needed
    };

    return content.replace(/:\w+:/g, match => emojiMap[match] || match);
}

// Function to sanitize the channel name for safe file naming and URLs
function sanitizeFileName(name) {
    return name.replace(/[^a-z0-9]/gi, '_').toLowerCase(); // Replace unsafe characters with underscores
}

// Function to generate the HTML page
function generateHTMLPage(channelName, messages) {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${channelName} - Message Log</title>
        <style>
            body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; }
            .message { margin-bottom: 10px; }
            .timestamp { color: #888; font-size: 0.9em; }
            .author { font-weight: bold; }
            .content { white-space: pre-wrap; }
        </style>
    </head>
    <body>
        <h1>Channel: ${channelName}</h1>
        <div class="messages">
            ${messages}
        </div>
    </body>
    </html>`;
}