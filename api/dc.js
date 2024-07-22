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
    if (!token || !targetGuildId) return { statusCode: 400, body: JSON.stringify({ output: 'Missing required query parameters.', errors: ['Missing parameters.'] }) };

    const fetchOptions = { headers: { 'Authorization': `Bot ${token}` } };
    const fetchJson = url => fetchWithRetry(url, fetchOptions).then(r => r.json());
    const delOptions = id => ({ method: 'DELETE', headers: { 'Authorization': `Bot ${token}` } });

    try {
        const [channels, roles] = await Promise.all([
            fetchJson(`https://discord.com/api/v10/guilds/${targetGuildId}/channels`),
            fetchJson(`https://discord.com/api/v10/guilds/${targetGuildId}/roles`)
        ]);

        const results = await Promise.all([
            ...channels.map(c => fetchWithRetry(`https://discord.com/api/v10/channels/${c.id}`, delOptions()).then(() => `Deleted channel: ${c.name}\n`).catch(() => `Failed to delete channel: ${c.name}\n`)),
            ...roles.filter(r => r.name !== '@everyone').map(r => fetchWithRetry(`https://discord.com/api/v10/guilds/${targetGuildId}/roles/${r.id}`, delOptions()).then(() => `Deleted role: ${r.name}\n`).catch(() => `Failed to delete role: ${r.name}\n`))
        ]);

        return { statusCode: 200, body: JSON.stringify({ output: results.join(''), errors: [] }) };
    } catch (err) {
        return { statusCode: 500, body: JSON.stringify({ output: 'An error occurred.', errors: [err.message] }) };
    }
};
