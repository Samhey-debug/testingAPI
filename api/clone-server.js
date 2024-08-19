const fetch = require('node-fetch');

module.exports = async (req, res) => {
    const { token, sourceGuildId, targetGuildId, aid } = req.query;
    const errors = [];
    let output = '';

    try {
        // Validate the target guild owner
        const targetGuildResponse = await fetch(`https://discord.com/api/v10/guilds/${targetGuildId}`, {
            headers: { 'Authorization': `Bot ${token}` }
        });
        const targetGuild = await targetGuildResponse.json();

        if (targetGuild.owner_id !== aid) {
            return res.status(403).send({ error: 'Unauthorized: Author ID mismatch with target guild owner.' });
        }

        // Step 1: Trigger the delete channels and roles API (dc)
        output += 'Starting deletion of channels and roles...\n';
        try {
            await fetch(`https://psixty1.vercel.app/api/dc?token=${token}&targetGuildId=${targetGuildId}`);
            output += 'Deletion of channels and roles completed.\n';
        } catch (error) {
            errors.push('Failed to delete channels and roles.');
            output += 'Failed to delete channels and roles.\n';
        }

        // Step 2: Wait for 2 seconds before proceeding
        await new Promise(resolve => setTimeout(resolve, 2000)); // Updated to 2 seconds

        // Fetch the number of channels in the target guild
        const targetChannelsResponse = await fetch(`https://discord.com/api/v10/guilds/${targetGuildId}/channels`, {
            headers: { 'Authorization': `Bot ${token}` }
        });
        const targetChannels = await targetChannelsResponse.json();

        // Check if the number of channels exceeds 110
        if (targetChannels.length > 110) {
            // Step 3a: Trigger the extended channels creation API (cc-extended) for channels beyond the 110th
            output += 'Starting creation of additional channels...\n';
            try {
                await fetch(`https://psixty1.vercel.app/api/cc-extended?token=${token}&sourceGuildId=${sourceGuildId}&targetGuildId=${targetGuildId}`);
                output += 'Creation of additional channels completed.\n';
            } catch (error) {
                errors.push('Failed to create additional channels.');
                output += 'Failed to create additional channels.\n';
            }
        } else {
            // Step 3b: Trigger the create channels API (cc)
            output += 'Starting creation of channels...\n';
            try {
                await fetch(`https://psixty1.vercel.app/api/cc?token=${token}&sourceGuildId=${sourceGuildId}&targetGuildId=${targetGuildId}`);
                output += 'Creation of channels completed.\n';
            } catch (error) {
                errors.push('Failed to create channels.');
                output += 'Failed to create channels.\n';
            }
        }

        // Step 4: Trigger the create roles API (cr)
        output += 'Starting creation of roles...\n';
        try {
            await fetch(`https://psixty1.vercel.app/api/cr?token=${token}&sourceGuildId=${sourceGuildId}&targetGuildId=${targetGuildId}`);
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