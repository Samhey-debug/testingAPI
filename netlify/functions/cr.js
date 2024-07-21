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
        const sourceRoles = await fetchWithRetry(`https://discord.com/api/v10/guilds/${sourceGuildId}/roles`, { headers: { 'Authorization': `Bot ${token}` } }).then(r => r.json());
        
        const createRoles = sourceRoles.filter(role => role.name !== '@everyone').map(role =>
            fetchWithRetry(`https://discord.com/api/v10/guilds/${targetGuildId}/roles`, {
                method: 'POST',
                headers: { 'Authorization': `Bot ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: role.name,
                    color: role.color,
                    hoist: role.hoist,
                    position: role.position,
                    permissions: role.permissions,
                    managed: role.managed,
                    mentionable: role.mentionable
                })
            }).then(r => r.json())
              .then(createdRole => output += `Created role: ${createdRole.name}\n`)
              .catch(() => {
                  output += `Failed to create role: ${role.name}\n`;
                  errors.push(`Failed to create role: ${role.name}`);
              })
        );
        await Promise.all(createRoles);

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
