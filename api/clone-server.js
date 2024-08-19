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

        // Trigger the delete channels and roles API (dc)
        output += 'Starting deletion of channels and roles...\n';
        try {
            await fetch(`https://psixty1.vercel.app/api/dc?token=${token}&targetGuildId=${targetGuildId}`);
            output += 'Deletion of channels and roles completed.\n';
        } catch (error) {
            errors.push('Failed to delete channels and roles.');
            output += 'Failed to delete channels and roles.\n';
        }

        // Wait for 2 seconds before proceeding
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Determine the number of channels in the target guild
        const targetChannelsResponse = await fetch(`https://discord.com/api/v10/guilds/${targetGuildId}/channels`, {
            headers: { 'Authorization': `Bot ${token}` }
        });
        const targetChannels = await targetChannelsResponse.json();
        const channelCount = targetChannels.length;

        // Step 3: Trigger the create channels API (cc) or (cc-extended) based on the channel count
        if (channelCount <= 110) {
            output += 'Starting creation of channels...\n';
            try {
                await fetch(`https://psixty1.vercel.app/api/cc?token=${token}&sourceGuildId=${sourceGuildId}&targetGuildId=${targetGuildId}`);
                output += 'Creation of channels completed.\n';
            } catch (error) {
                errors.push('Failed to create channels.');
                output += 'Failed to create channels.\n';
            }
        } else {
            output += 'Starting creation of channels (first batch)...\n';
            try {
                await fetch(`https://psixty1.vercel.app/api/cc?token=${token}&sourceGuildId=${sourceGuildId}&targetGuildId=${targetGuildId}`);
                output += 'First batch of channels created.\n';

                // Wait for 2 seconds before proceeding to the next batch
                await new Promise(resolve => setTimeout(resolve, 2000));

                output += 'Starting creation of additional channels (second batch)...\n';
                try {
                    await fetch(`https://psixty1.vercel.app/api/cc-extended?token=${token}&sourceGuildId=${sourceGuildId}&targetGuildId=${targetGuildId}`);
                    output += 'Creation of additional channels completed.\n';
                } catch (error) {
                    errors.push('Failed to create additional channels.');
                    output += 'Failed to create additional channels.\n';
                }
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