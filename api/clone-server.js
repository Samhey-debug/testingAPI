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

// Main handler function for cloning a server
module.exports = async (req, res) => {
    const { token, sourceGuildId, targetGuildId, aid } = req.query;
    const errors = [];
    let output = '';

    try {
        // Validate the target guild owner
        const targetGuildResponse = await fetchWithRetry(`https://discord.com/api/v10/guilds/${targetGuildId}`, {
            headers: { 'Authorization': `Bot ${token}` }
        });
        const targetGuild = await targetGuildResponse.json();

        if (targetGuild.owner_id !== aid) {
            return res.status(403).send({ error: 'Unauthorized: Author ID mismatch with target guild owner.' });
        }

        // Trigger the delete channels and roles API (dc)
        output += 'Starting deletion of channels and roles...\n';
        try {
            await fetchWithRetry(`https://psixty1.vercel.app/api/dc?token=${token}&targetGuildId=${targetGuildId}`);
            output += 'Deletion of channels and roles completed.\n';
        } catch (error) {
            errors.push('Failed to delete channels and roles.');
            output += 'Failed to delete channels and roles.\n';
        }

        // Wait for 2 seconds before proceeding
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Trigger the create channels API (cc)
        output += 'Starting creation of channels...\n';
        try {
            await fetchWithRetry(`https://psixty1.vercel.app/api/cc?token=${token}&sourceGuildId=${sourceGuildId}&targetGuildId=${targetGuildId}`);
            output += 'Creation of channels completed.\n';
        } catch (error) {
            errors.push('Failed to create channels.');
            output += 'Failed to create channels.\n';
        }

        // Trigger the create roles API (cr)
        output += 'Starting creation of roles...\n';
        try {
            await fetchWithRetry(`https://psixty1.vercel.app/api/cr?token=${token}&sourceGuildId=${sourceGuildId}&targetGuildId=${targetGuildId}`);
            output += 'Creation of roles completed.\n';
        } catch (error) {
            errors.push('Failed to create roles.');
            output += 'Failed to create roles.\n';
        }

        // Respond with the output and errors
        res.status(200).send({ message: output, errors });

    } catch (error) {
        // Catch and log any unexpected errors
        res.status(500).send({ error: `Unexpected error occurred: ${error.message}` });
    }
}; 