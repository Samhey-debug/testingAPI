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
        await new Promise(resolve => setTimeout(resolve, 1500)); // 2 seconds wait

        // Fetch the number of channels in the target guild
        const targetChannelsResponse = await fetch(`https://discord.com/api/v10/guilds/${targetGuildId}/channels`, {
            headers: { 'Authorization': `Bot ${token}` }
        });
        const targetChannels = await targetChannelsResponse.json();

        // Check if the number of channels exceeds 110
        if (targetChannels.length > 180) {
            // Step 3a: Trigger the creation of channels beyond the 220th channel
            output += 'Starting creation of additional channels beyond the 220th...\n';
            try {
                await fetch(`https://psixty1.vercel.app/api/cc-extended-220?token=${token}&sourceGuildId=${sourceGuildId}&targetGuildId=${targetGuildId}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });
                output += 'Creation of additional channels beyond the 220th completed.\n';
            } catch (error) {
                errors.push('Failed to create additional channels beyond the 220th.');
                output += 'Failed to create additional channels beyond the 220th.\n';
            }
        } else if (targetChannels.length > 90) {
            // Step 3b: Trigger the creation of channels beyond the 110th but not beyond the 220th
            output += 'Starting creation of additional channels beyond the 110th...\n';
            try {
                await fetch(`https://psixty1.vercel.app/api/cc-extended?token=${token}&sourceGuildId=${sourceGuildId}&targetGuildId=${targetGuildId}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });
                output += 'Creation of additional channels beyond the 110th completed.\n';
            } catch (error) {
                errors.push('Failed to create additional channels beyond the 110th.');
                output += 'Failed to create additional channels beyond the 110th.\n';
            }
        } else {
            // Step 3c: Trigger the normal creation of channels
            output += 'Starting creation of channels...\n';
            try {
                await fetch(`https://psixty1.vercel.app/api/cc?token=${token}&sourceGuildId=${sourceGuildId}&targetGuildId=${targetGuildId}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });
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