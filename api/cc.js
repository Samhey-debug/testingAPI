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

// Function to create channels in batches
const createChannelsInBatches = async (channels, token, targetGuildId) => {
    const batchSize = 10; // Adjust batch size based on needs and rate limits
    let output = '';
    const errors = [];

    for (let i = 0; i < channels.length; i += batchSize) {
        const batch = channels.slice(i, i + batchSize);
        
        // Create an array of promises for the batch
        const promises = batch.map(channel => {
            const payload = {
                name: channel.name,
                type: channel.type,
                position: channel.position,
                parent_id: categoryMap[channel.parent_id] || null,
                topic: channel.topic || null,
                nsfw: channel.nsfw || false,
                bitrate: channel.bitrate || 64000,
                user_limit: channel.user_limit || 0,
                rate_limit_per_user: channel.rate_limit_per_user || 0,
                permission_overwrites: channel.permission_overwrites || []
            };

            return fetchWithRetry(`https://discord.com/api/v10/guilds/${targetGuildId}/channels`, {
                method: 'POST',
                headers: { 'Authorization': `Bot ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            }).then(() => {
                output += `Created channel: ${channel.name}\n`;
            }).catch(() => {
                output += `Failed to create channel: ${channel.name}\n`;
                errors.push(`Failed to create channel: ${channel.name}`);
            });
        });

        // Wait for all promises in the batch to complete
        await Promise.all(promises);
    }

    return { output, errors };
};

// Main handler function for creating channels in the target guild
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

        // Step 1: Create categories first and map their IDs
        const categoryMap = {};
        await Promise.all(sourceChannels.filter(c => c.type === 4).map(async (channel) => {
            try {
                const createdCategoryResponse = await fetchWithRetry(`https://discord.com/api/v10/guilds/${targetGuildId}/channels`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bot ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: channel.name,
                        type: channel.type,
                        position: channel.position,
                        permission_overwrites: channel.permission_overwrites
                    })
                });
                const createdCategory = await createdCategoryResponse.json();
                categoryMap[channel.id] = createdCategory.id;
                output += `Created category: ${createdCategory.name}\n`;
            } catch {
                output += `Failed to create category: ${channel.name}\n`;
                errors.push(`Failed to create category: ${channel.name}`);
            }
        }));

        // Step 2: Create channels in batches
        const { output: channelOutput, errors: channelErrors } = await createChannelsInBatches(sourceChannels.filter(c => c.type !== 4), token, targetGuildId);
        output += channelOutput;
        errors.push(...channelErrors);

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