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

// Fetch and utility functions remain unchanged
// (fetchChannelDetails, fetchMessages, formatMessages, replaceEmojis, sanitizeFileName, generateHTMLPage)