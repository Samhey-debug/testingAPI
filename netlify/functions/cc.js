const fetch = require('node-fetch');
const fetchWithRetry = async (url, options, maxRetries = 3) => {
    for (let retries = 0; retries <= maxRetries; retries++) {
        try {
            const response = await fetch(url, options);
            if (response.ok) return response;
            throw new Error(`HTTP error ${response.status}`);
        } catch {
            if (retries === maxRetries) throw new Error(`Failed to fetch ${url}`);
        }
    }
};

module.exports.handler = async (event) => {
    const { token, sourceGuildId, targetGuildId } = event.queryStringParameters || {};
    if (!token || !sourceGuildId || !targetGuildId) {
        return {
            statusCode: 400,
            body: JSON.stringify({ output: 'Missing required query parameters.', errors: ['Missing parameters.'] })
        };
    }

    const errors = [];
    let output = '';

    try {
        const sourceChannels = await fetchWithRetry(`https://discord.com/api/v10/guilds/${sourceGuildId}/channels`, { headers: { 'Authorization': `Bot ${token}` } }).then(r => r.json());
        
        const createCategories = sourceChannels.filter(channel => channel.type === 4).map(channel =>
            fetchWithRetry(`https://discord.com/api/v10/guilds/${targetGuildId}/channels`, {
                method: 'POST',
                headers: { 'Authorization': `Bot ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: channel.name,
                    type: channel.type,
                    position: channel.position,
                    permission_overwrites: channel.permission_overwrites
                })
            }).then(r => r.json())
              .then(createdCategory => output += `Created category: ${createdCategory.name}\n`)
              .catch(() => {
                  output += `Failed to create category: ${channel.name}\n`;
                  errors.push(`Failed to create category: ${channel.name}`);
              })
        );
        await Promise.all(createCategories);

        const createChannels = sourceChannels.filter(channel => channel.type !== 4).map(channel => {
            let payload = {
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

            return fetchWithRetry(`https://discord.com/api/v10/guilds/${targetGuildId}/channels`, {
                method: 'POST',
                headers: { 'Authorization': `Bot ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            }).then(r => r.json())
              .then(createdChannel => output += `Created channel: ${createdChannel.name}\n`)
              .catch(() => {
                  output += `Failed to create channel: ${channel.name}\n`;
                  errors.push(`Failed to create channel: ${channel.name}`);
              });
        });
        await Promise.all(createChannels);

        return {
            statusCode: 200,
            body: JSON.stringify({ output, errors })
        };
    } catch (err) {
        return {
            statusCode: 500,
            body: JSON.stringify({ output: 'An error occurred.', errors: [err.message] })
        };
    }
};
