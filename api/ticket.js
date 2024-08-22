const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

module.exports = async (req, res) => {
    const { token, channelID, channelID2 } = req.query;

    if (!token || !channelID || !channelID2) {
        return res.status(400).json({ error: 'Missing required parameters: token, channelID, channelID2' });
    }

    try {
        // Fetch channel details to get the channel name
        const channelDetails = await fetchChannelDetails(token, channelID);
        const channelName = sanitizeFileName(channelDetails.name); // Sanitize the channel name to make it safe for file names

        const messages = await fetchMessages(token, channelID);
        const formattedMessages = formatMessages(messages);
        const fileName = `${channelName}.txt`;
        const filePath = path.join('/tmp', fileName);

        fs.writeFileSync(filePath, formattedMessages);

        // Send the file to the second channel
        const uploadResult = await uploadFileToChannel(token, channelID2, filePath, fileName);

        // Clean up the file after sending
        fs.unlinkSync(filePath);

        return res.status(200).json({ message: `Messages sent to channel ${channelID2}`, uploadResult });
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

// Function to format messages into a clean text format with emoji handling
function formatMessages(messages) {
    return messages
        .map(
            msg => {
                const time = new Date(msg.timestamp).toLocaleString();
                const author = `${msg.author.username}#${msg.author.discriminator}`;
                const content = replaceEmojis(msg.content);

                return `[${time}] ${author}: ${content}`;
            }
        )
        .join('\n');
}

// Function to replace Discord emoji shortcodes and custom emojis with readable text
function replaceEmojis(content) {
    // Replace custom emojis in the format <emoji_name:emoji_id> with [emoji_name]
    content = content.replace(/<:\w+:(\d+)>/g, match => `[${match.split(':')[1]}]`);

    // Replace standard Discord shortcodes like :smile: with their Unicode equivalents
    // You can add more replacements as needed
    const emojiMap = {
        ":smile:": "😄",
        ":heart:": "❤️",
        ":thumbsup:": "👍",
        // Add more as needed
    };

    return content.replace(/:\w+:/g, match => emojiMap[match] || match);
}

// Function to sanitize the channel name for safe file naming
function sanitizeFileName(name) {
    return name.replace(/[^a-z0-9]/gi, '_').toLowerCase(); // Replace unsafe characters with underscores
}

// Function to upload the file to a specified Discord channel
async function uploadFileToChannel(token, channelID, filePath, fileName) {
    const url = `https://discord.com/api/v10/channels/${channelID}/messages`;
    const form = new FormData();
    form.append('file', fs.createReadStream(filePath), fileName);

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            Authorization: `Bot ${token}`,
        },
        body: form,
    });

    if (!response.ok) {
        throw new Error(`Failed to upload file: ${response.statusText}`);
    }

    return await response.json();
}