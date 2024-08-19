const fetch = require('node-fetch');

// Utility function to perform fetch requests with retries
const fetchWithRetry = async (url, options, maxRetries = 3) => {
    for (let retries = 0; retries < maxRetries; retries++) {
        try {
            const response = await fetch(url, options);
            if (response.ok) return response;
            throw new Error(`HTTP error ${response.status}`);
        } catch (error) {
            if (retries === maxRetries - 1) throw new Error(`Failed to fetch ${url}: ${error.message}`);
        }
    }
};

// Function to determine if a guild is a community server
const isCommunityServer = (guild) => {
    return guild.features.includes('COMMUNITY');
};

// Main handler function for creating channels beyond the 220th channel
module.exports = async (req, res) => {
    const { token, sourceGuildId, targetGuildId } = req.query;
    const errors = [];
    let output = '';

    try {
        // Fetch target guild details to determine its type
        const targetGuildResponse = await fetchWithRetry(`https://discord.com/api/v10/guilds/${targetGuildId}`, {
            headers: { 'Authorization': `Bot ${token}` }
        });
        const targetGuild = await targetGuildResponse.json();

        // Check if the target server is a community server
        const isCommunity = isCommunityServer(targetGuild);

        // Fetch channels from the source guild
        const sourceChannelsResponse = await fetchWithRetry(`https://discord.com/api/v10/guilds/${sourceGuildId}/channels`, {
            headers: { 'Authorization': `Bot ${token}` }
        });
        const sourceChannels = await sourceChannelsResponse.json();

        output += `Fetched ${sourceChannels.length} channels from source guild.\n`;

        // Filter out the channels beyond the 220th
        const channelsToCreate = sourceChannels.slice(220);

        output += `Preparing to create ${channelsToCreate.length} additional channels in target guild.\n`;

        // Create channels in batches
        const batchSize = 10; // Number of concurrent requests
        for (let i = 0; i < channelsToCreate.length; i += batchSize) {
            const batch = channelsToCreate.slice(i, i + batchSize);
            await Promise.all(batch.map(async (channel) => {
                try {
                    // Adjust channel type based on the target guild's type
                    const payload = {
                        name: channel.name,
                        type: channel.type === 4 ? 4 : (isCommunity && channel.type === 5 ? 5 : channel.type),
                        position: channel.position,
                        parent_id: channel.parent_id || null,
                        topic: channel.topic || null,
                        nsfw: channel.nsfw || false,
                        bitrate: channel.bitrate || 64000,
                        user_limit: channel.user_limit || 0,
                        rate_limit_per_user: channel.rate_limit_per_user || 0,
                        permission_overwrites: channel.permission_overwrites || []
                    };

                    console.log(`Creating channel: ${channel.name} with payload:`, payload);

                    const createChannelResponse = await fetchWithRetry(`https://discord.com/api/v10/guilds/${targetGuildId}/channels`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bot ${token}`, 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });

                    if (createChannelResponse.ok) {
                        output += `Created additional channel: ${channel.name}\n`;
                    } else {
                        const errorText = await createChannelResponse.text();
                        output += `Failed to create additional channel: ${channel.name}. Status: ${createChannelResponse.status}, Response: ${errorText}\n`;
                        errors.push(`Failed to create additional channel: ${channel.name}. Status: ${createChannelResponse.status}, Response: ${errorText}`);
                    }
                } catch (error) {
                    output += `Failed to create additional channel: ${channel.name}. Error: ${error.message}\n`;
                    errors.push(`Failed to create additional channel: ${channel.name}. Error: ${error.message}`);
                }
            }));
        }

        // Respond with the output and errors
        res.status(200).send({
            message: output,
            errors: errors
        });

    } catch (error) {
        // Catch and log any unexpected errors
        res.status(500).send({ error: `Unexpected error occurred: ${error.message}` });
    }
};