const fetch = require('node-fetch');

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

        // Directly return the generated HTML content as the response
        res.setHeader('Content-Type', 'text/html');
        return res.status(200).send(htmlContent);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'An error occurred', details: error.message });
    }
};

// Fetch and utility functions remain unchanged (fetchChannelDetails, fetchMessages, formatMessages, sanitizeFileName, generateHTMLPage)