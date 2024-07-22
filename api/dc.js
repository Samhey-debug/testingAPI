const fetch = require('node-fetch');

const fetchWithRetry = async (url, options, maxRetries = 3) => {
    for (let retries = 0; retries <= maxRetries; retries++) {
        try {
            const response = await fetch(url, options);
            if (response.ok) return response;
            throw new Error(`HTTP error ${response.status}`);
        } catch (error) {
            if (retries === maxRetries) throw new Error(`Failed to fetch ${url}: ${error.message}`);
        }
    }
};

module.exports.handler = async (event) => {
    const { token, targetGuildId } = event.queryStringParameters || {};
    if (!token || !targetGuildId) {
        return { statusCode: 400, body: JSON.stringify({ output: 'Missing required query parameters.', errors: ['Missing parameters.'] }) };
    }

    const fetchOptions = { headers: { 'Authorization': `Bot ${token}` } };
    const deleteOptions = { method: 'DELETE', headers: { 'Authorization': `Bot ${token}` } };

    try {
        const [channels, roles] = await Promise.all([
            fetchWithRetry(`https://discord.com/api/v10/guilds/${targetGuildId}/channels`, fetchOptions).then(r => r.json()),
            fetchWithRetry(`https://discord.com/api/v10/guilds/${targetGuildId}/roles`, fetchOptions).then(r => r.json())
        ]);

        const deleteTasks = [
            ...channels.map(c => fetchWithRetry(`https://discord.com/api/v10/channels/${c.id}`, deleteOptions).then(() => `Deleted channel: ${c.name}`).catch(() => `Failed to delete channel: ${c.name}`)),
            ...roles.filter(r => r.name !== '@everyone').map(r => fetchWithRetry(`https://discord.com/api/v10/guilds/${targetGuildId}/roles/${r.id}`, deleteOptions).then(() => `Deleted role: ${r.name}`).catch(() => `Failed to delete role: ${r.name}`))
        ];

        const results = await Promise.all(deleteTasks);
        return { statusCode: 200, body: JSON.stringify({ output: results.join('\n'), errors: [] }) };

    } catch (err) {
        return { statusCode: 500, body: JSON.stringify({ output: 'An error occurred.', errors: [err.message] }) };
    }
};
