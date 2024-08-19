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

// Main handler function for creating roles
module.exports = async (req, res) => {
    const { token, sourceGuildId, targetGuildId } = req.query;
    const errors = [];
    let output = '';

    try {
        // Fetch roles from the source guild
        const sourceRolesResponse = await fetchWithRetry(`https://discord.com/api/v10/guilds/${sourceGuildId}/roles`, {
            headers: { 'Authorization': `Bot ${token}` }
        });
        const sourceRoles = await sourceRolesResponse.json();

        output += `Fetched ${sourceRoles.length} roles from source guild.\n`;

        // Create roles in the target guild
        await Promise.all(sourceRoles.filter(role => role.name !== '@everyone').map(async (role) => {
            try {
                await fetchWithRetry(`https://discord.com/api/v10/guilds/${targetGuildId}/roles`, {
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
                });
                output += `Created role: ${role.name}\n`;
            } catch {
                output += `Failed to create role: ${role.name}\n`;
                errors.push(`Failed to create role: ${role.name}`);
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