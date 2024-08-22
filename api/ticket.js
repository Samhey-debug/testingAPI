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
        const channelDetails = await fetchChannelDetails(token, channelID);
        const channelName = sanitizeFileName(channelDetails.name);

        const messages = await fetchMessages(token, channelID);
        const formattedMessages = formatMessages(messages);
        const fileName = `${channelName}.txt`;
        const filePath = path.join('/tmp', fileName);

        fs.writeFileSync(filePath, formattedMessages);

        await new Promise(resolve => setTimeout(resolve, 700));

        const uploadResult = await uploadFileToChannel(token, channelID2, filePath, fileName);

        fs.unlinkSync(filePath);

        return res.status(200).json({ message: `Messages sent to channel ${channelID2}`, uploadResult });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'An error occurred', details: error.message });
    }
};

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

    return allMessages.reverse();
}

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

function replaceEmojis(content) {
    content = content.replace(/<:\w+:(\d+)>/g, match => `[${match.split(':')[1]}]`);

    const emojiMap = {
        ":smile:": "😄",
        ":heart:": "❤️",
        ":thumbsup:": "👍",
    };

    return content.replace(/:\w+:/g, match => emojiMap[match] || match);
}

function sanitizeFileName(name) {
    return name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
}

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