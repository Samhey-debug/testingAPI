const fetch = require('node-fetch');

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const fetchWithRetry = async (url, options, maxRetries = 3) => {
    let retries = 0;
    while (retries < maxRetries) {
        try {
            const response = await fetch(url, options);
            if (response.ok) return response;
            throw new Error(`HTTP error ${response.status}`);
        } catch (error) {
            console.error(`Attempt ${retries + 1} failed: ${error.message}`);
            retries++;
            await sleep(1000);
        }
    }
    console.warn(`Max retries reached for ${url}`);
    return null;
};

module.exports = async (req, res) => {
    const { token, sourceGuildId, targetGuildId } = req.query;
    let output = '', errors = [];
    
    try {
        const fetchData = async (endpoint) =>
            fetchWithRetry(`https://discord.com/api/v10${endpoint}`, {
                headers: { 'Authorization': `Bot ${token}`, 'Content-Type': 'application/json' }
            }).then(res => res.json());

        const [sourceChannels, targetChannels, sourceRoles, targetRoles] = await Promise.all([
            fetchData(`/guilds/${sourceGuildId}/channels`),
            fetchData(`/guilds/${targetGuildId}/channels`),
            fetchData(`/guilds/${sourceGuildId}/roles`),
            fetchData(`/guilds/${targetGuildId}/roles`)
        ]);

        output += `Fetched ${sourceChannels.length} source and ${targetChannels.length} target channels.\n`;
        output += `Fetched ${sourceRoles.length} source and ${targetRoles.length} target roles.\n`;

        // Delete target channels and roles
        await Promise.all([
            ...targetChannels.map(channel =>
                fetchWithRetry(`https://discord.com/api/v10/channels/${channel.id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bot ${token}` }
                }).then(() => output += `Deleted channel: ${channel.name}\n`)
            ),
            ...targetRoles.filter(role => role.name !== '@everyone').map(role =>
                fetchWithRetry(`https://discord.com/api/v10/guilds/${targetGuildId}/roles/${role.id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bot ${token}` }
                }).then(() => output += `Deleted role: ${role.name}\n`)
            )
        ]);

        // Create additional channel
        const additionalChannel = await fetchWithRetry(`https://discord.com/api/v10/guilds/${targetGuildId}/channels`, {
            method: 'POST',
            headers: { 'Authorization': `Bot ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: "Copied with Nebula Services", type: 0, position: 0 })
        }).then(res => res.json());
        
        let additionalChannelId;
        if (additionalChannel) {
            additionalChannelId = additionalChannel.id;
            output += `Created additional channel: ${additionalChannel.name}\n`;
        } else {
            output += 'Failed to create additional channel.\n';
            errors.push('Failed to create additional channel.');
        }

        const categoryMap = {};
        const createChannel = async (channel) => {
            const payload = { ...channel, parent_id: categoryMap[channel.parent_id] || null };
            if (channel.type === 4) { // Category
                const createdCategory = await fetchWithRetry(`https://discord.com/api/v10/guilds/${targetGuildId}/channels`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bot ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                }).then(res => res.json());
                if (createdCategory) {
                    categoryMap[channel.id] = createdCategory.id;
                    output += `Created category: ${createdCategory.name}\n`;
                }
            } else { // Other channels
                const createdChannel = await fetchWithRetry(`https://discord.com/api/v10/guilds/${targetGuildId}/channels`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bot ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                }).then(res => res.json());
                if (createdChannel) output += `Created channel: ${createdChannel.name}\n`;
            }
        };

        await Promise.all(sourceChannels.map(createChannel));

        // Create roles
        await Promise.all(sourceRoles.filter(role => role.name !== '@everyone').map(role =>
            fetchWithRetry(`https://discord.com/api/v10/guilds/${targetGuildId}/roles`, {
                method: 'POST',
                headers: { 'Authorization': `Bot ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(role)
            }).then(res => res.json())
            .then(createdRole => output += `Created role: ${createdRole.name}\n`)
            .catch(() => {
                output += `Failed to create role: ${role.name}\n`;
                errors.push(`Failed to create role: ${role.name}`);
            })
        ));

        // Update target guild details
        const sourceGuild = await fetchWithRetry(`/guilds/${sourceGuildId}`, {
            headers: { 'Authorization': `Bot ${token}` }
        }).then(res => res.json());

        const updatePayload = {
            name: sourceGuild.name,
            icon: sourceGuild.icon ? `https://cdn.discordapp.com/icons/${sourceGuild.id}/${sourceGuild.icon}.png` : null,
            verification_level: sourceGuild.verification_level,
            default_message_notifications: sourceGuild.default_message_notifications,
            explicit_content_filter: sourceGuild.explicit_content_filter
        };

        const updatedGuild = await fetchWithRetry(`https://discord.com/api/v10/guilds/${targetGuildId}`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bot ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(updatePayload)
        });

        if (updatedGuild) {
            output += 'Updated target guild details.\n';
        } else {
            output += 'Failed to update target guild details.\n';
            errors.push('Failed to update target guild details.');
        }

        // Create webhook in the additional channel
        if (additionalChannelId) {
            const webhookPayload = {
                name: 'Powered by Nebula Services',
                avatar: 'https://i.imgur.com/ArKqDKr.png',
                channel_id: additionalChannelId
            };

            const webhook = await fetchWithRetry(`https://discord.com/api/v10/channels/${additionalChannelId}/webhooks`, {
                method: 'POST',
                headers: { 'Authorization': `Bot ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(webhookPayload)
            }).then(res => res.json());

            if (webhook) {
                const webhookMessagePayload = {
                    embeds: [
                        { title: 'Thank You for Using Nebula Services', description: 'This channel was created to inform you of the cloning process. Feel free to delete it.', color: 0xAB00FF },
                        { title: 'Errors Encountered', description: errors.length ? errors.join('\n') : 'No errors encountered.', color: 0xAB00FF }
                    ]
                };

                const sendMessage = await fetchWithRetry(`https://discord.com/api/v10/webhooks/${webhook.id}/${webhook.token}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(webhookMessagePayload)
                });

                output += sendMessage ? 'Webhook message sent.\n' : 'Failed to send webhook message.\n';
            } else {
                output += 'Failed to create webhook.\n';
                errors.push('Failed to create webhook.');
            }
        }

        output += 'Server cloning completed.';
        res.status(200).json({ output, errors });
    } catch (error) {
        output += `Error: ${error.message}\n`;
        errors.push(error.message);
        res.status(500).json({ output, errors });
    }
};
