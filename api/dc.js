const fetch = require('node-fetch');

// Utility function to perform fetch requests with retries
const fetchWithRetry = async (url, options, maxRetries = 1) => {
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

// Main handler function for deleting channels and roles
module.exports = async (req, res) => {
    const { token, targetGuildId } = req.query;
    const errors = [];
    let output = '';

    try {
        // Fetch target channels and roles
        const [targetChannels, targetRoles] = await Promise.all([
            fetchWithRetry(`https://discord.com/api/v10/guilds/${targetGuildId}/channels`, { headers: { 'Authorization': `Bot ${token}` } }).then(r => r.json()),
            fetchWithRetry(`https://discord.com/api/v10/guilds/${targetGuildId}/roles`, { headers: { 'Authorization': `Bot ${token}` } }).then(r => r.json())
        ]);

        output += `Fetched ${targetChannels.length} channels and ${targetRoles.length} roles from target guild.\n`;

        // Delete all target channels
        await Promise.all(targetChannels.map(channel =>
            fetchWithRetry(`https://discord.com/api/v10/channels/${channel.id}`, { method: 'DELETE', headers: { 'Authorization': `Bot ${token}` } })
                .then(() => output += `Deleted channel: ${channel.name}\n`)
                .catch(() => output += `Failed to delete channel: ${channel.name}\n`)
        ));

        // Delete all target roles except @everyone
        await Promise.all(targetRoles.filter(role => role.name !== '@everyone').map(role =>
            fetchWithRetry(`https://discord.com/api/v10/guilds/${targetGuildId}/roles/${role.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bot ${token}` }
            }).then(() => output += `Deleted role: ${role.name}\n`)
              .catch(() => output += `Failed to delete role: ${role.name}\n`)
        ));

        output += 'Deletion of channels and roles completed.';
    } catch (error) {
        output += `Error: ${error.message}\n`;
        errors.push(error.message);
    }

    res.status(200).send({
        output: output,
        errors: errors
    });
};
