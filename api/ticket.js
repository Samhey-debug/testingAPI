const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
    const { token, channelID, channelID2 } = req.query;

    if (!token || !channelID || !channelID2) {
        return res.status(400).json({ error: 'Missing required parameters: token, channelID, channelID2' });
    }

    try {
        const messages = await fetchMessages(token, channelID);
        const formattedMessages = formatMessages(messages);
        const fileName = `${channelID}.txt`;
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

// Function to format messages into a clean text format
function formatMessages(messages) {
    return messages
        .map(
            msg =>
                `[${new Date(msg.timestamp).toLocaleString()}] ${msg.author.username}#${msg.author.discriminator}: ${msg.content}`
        )
        .join('\n');
}

// Function to upload the file to a specified Discord channel
async function uploadFileToChannel(token, channelID, filePath, fileName) {
    const url = `https://discord.com/api/v10/channels/${channelID}/messages`;
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath), fileName);

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            Authorization: `Bot ${token}`,
        },
        body: formData,
    });

    if (!response.ok) {
        throw new Error(`Failed to upload file: ${response.statusText}`);
    }

    return await response.json();
}