const fetch = require('node-fetch');

// Utility function to perform fetch requests with retries
const fetchWithRetry = async (url, options, maxRetries = 3) => {
    for (let retries = 0; retries < maxRetries; retries++) {
        try {
            const response = await fetch(url, options);
            if (response.ok) return response;
            throw new Error(`HTTP error ${response.status}`);
        } catch (error) {
            if (retries === maxRetries - 1) throw new Error(`Failed to fetch ${url}`);
        }
    }
};

// Main handler function for creating channels beyond the 110th channel
module.exports = async (req, res) => {
    const { token, sourceGuildId, targetGuildId } = req.query;
    const errors = [];
    let output = '';

    try {
        // Fetch channels from the source guild
        const sourceChannelsResponse = await fetchWithRetry(`https://discord.com/api/v10/guilds/${sourceGuildId}/channels`, {
            headers: { 'Authorization': `Bot ${token}` }
        });
        const sourceChannels = await sourceChannelsResponse.json();

        output += `Fetched ${sourceChannels.length} channels from source guild.\n`;

        // Filter out the channels beyond the 110th
        const channelsToCreate = sourceChannels.slice(110);

        output += `Preparing to create ${channelsToCreate.length} additional channels in target guild.\n`;

        // Create channels in the target guild
        await Promise.all(channelsToCreate.map(async (channel) => {
            try {
                const payload = {
                    name: channel.name,
                    type: channel.type,
                    position: channel.position,
                    parent_id: channel.parent_id || null,
                    topic: channel.topic || null,
                    nsfw: channel.nsfw || false,
                    bitrate: channel.bitrate || 64000,
                    user_limit: channel.user_limit || 0,
                    rate_limit_per_user: channel.rate_limit_per_user || 0,
                    permission_overwrites: channel.permission_overwrites || []
                };

                await fetchWithRetry(`https://discord.com/api/v10/guilds/${targetGuildId}/channels`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bot ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                output += `Created additional channel: ${channel.name}\n`;
            } catch {
                output += `Failed to create additional channel: ${channel.name}\n`;
                errors.push(`Failed to create additional channel: ${channel.name}`);
            }
        }));

        // Respond with the output and any errors encountered
        res.status(200).send({
            message: output,
            errors: errors
        });

    } catch (error) {
        // Catch and log any unexpected errors
        res.status(500).send({ error: `Unexpected error occurred: ${error.message}` });
    }
};