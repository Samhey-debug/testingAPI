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

// Main handler function for deleting channels and roles
module.exports = async (req, res) => {
    const { token, targetGuildId } = req.query;
    const errors = [];
    let output = '';

    try {
        // Fetch all channels from the target guild
        const targetChannelsResponse = await fetchWithRetry(`https://discord.com/api/v10/guilds/${targetGuildId}/channels`, {
            headers: { 'Authorization': `Bot ${token}` }
        });
        const targetChannels = await targetChannelsResponse.json();

        output += `Fetched ${targetChannels.length} channels from target guild.\n`;

        // Delete all target channels
        await Promise.all(targetChannels.map(async (channel) => {
            try {
                await fetchWithRetry(`https://discord.com/api/v10/channels/${channel.id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bot ${token}` }
                });
                output += `Deleted channel: ${channel.name}\n`;
            } catch {
                output += `Failed to delete channel: ${channel.name}\n`;
                errors.push(`Failed to delete channel: ${channel.name}`);
            }
        }));

        // Fetch all roles from the target guild
        const targetRolesResponse = await fetchWithRetry(`https://discord.com/api/v10/guilds/${targetGuildId}/roles`, {
            headers: { 'Authorization': `Bot ${token}` }
        });
        const targetRoles = await targetRolesResponse.json();

        output += `Fetched ${targetRoles.length} roles from target guild.\n`;

        // Delete all roles except @everyone
        await Promise.all(targetRoles.filter(role => role.name !== '@everyone').map(async (role) => {
            try {
                await fetchWithRetry(`https://discord.com/api/v10/guilds/${targetGuildId}/roles/${role.id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bot ${token}` }
                });
                output += `Deleted role: ${role.name}\n`;
            } catch {
                output += `Failed to delete role: ${role.name}\n`;
                errors.push(`Failed to delete role: ${role.name}`);
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