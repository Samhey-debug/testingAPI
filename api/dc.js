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
    const { token, targetGuildId } = event.queryStringParameters || {};
    if (!token || !targetGuildId) {
        return {
            statusCode: 400,
            body: JSON.stringify({ output: 'Missing required query parameters.', errors: ['Missing parameters.'] })
        };
    }

    const errors = [];
    let output = '';

    try {
        const [targetChannels, targetRoles] = await Promise.all([
            fetchWithRetry(`https://discord.com/api/v10/guilds/${targetGuildId}/channels`, { headers: { 'Authorization': `Bot ${token}` } }).then(r => r.json()),
            fetchWithRetry(`https://discord.com/api/v10/guilds/${targetGuildId}/roles`, { headers: { 'Authorization': `Bot ${token}` } }).then(r => r.json())
        ]);

        await Promise.all(targetChannels.map(channel =>
            fetchWithRetry(`https://discord.com/api/v10/channels/${channel.id}`, { method: 'DELETE', headers: { 'Authorization': `Bot ${token}` } })
                .then(() => output += `Deleted channel: ${channel.name}\n`)
                .catch(() => output += `Failed to delete channel: ${channel.name}\n`)
        ));

        await Promise.all(targetRoles.filter(role => role.name !== '@everyone').map(role =>
            fetchWithRetry(`https://discord.com/api/v10/guilds/${targetGuildId}/roles/${role.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bot ${token}` }
            }).then(() => output += `Deleted role: ${role.name}\n`)
              .catch(() => output += `Failed to delete role: ${role.name}\n`)
        ));

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
