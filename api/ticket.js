const fetch = require('node-fetch');

module.exports = async (req, res) => {
    const { token, channelID, channelID2 } = req.query;

    if (!token || !channelID || !channelID2) {
        return res.status(400).json({ error: 'Missing required parameters: token, channelID, channelID2' });
    }

    try {
        // Fetch channel details to get the channel name
        const channelDetails = await fetchChannelDetails(token, channelID);
        const channelName = sanitizeFileName(channelDetails.name); // Sanitize the channel name for URLs

        const messages = await fetchMessages(token, channelID);
        const formattedMessages = formatMessages(messages);
        const htmlContent = generateHTMLPage(channelName, formattedMessages);

        // Generate the URL to access the HTML page
        const url = `https://${req.headers.host}/api/ticket?token=${token}&channelID=${channelID}`;

        // Send the URL to channelID2
        await sendMessageToChannel(token, channelID2, `Here are the logs for #${channelName}: ${url}`);

        // Return the generated HTML directly
        res.setHeader('Content-Type', 'text/html');
        return res.send(htmlContent);
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

// Function to send a message to a specific Discord channel
async function sendMessageToChannel(token, channelID, content) {
    const url = `https://discord.com/api/v10/channels/${channelID}/messages`;
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            Authorization: `Bot ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
    });

    if (!response.ok) {
        throw new Error(`Failed to send message to channel ${channelID}: ${response.statusText}`);
    }

    return await response.json();
}