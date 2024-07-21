const fetch = require('node-fetch');

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const fetchWithRetry = async (url, options, maxRetries = 3) => {
    let retries = 0;
    while (retries < maxRetries) {
        try {
            const response = await fetch(url, options);
            if (response.ok) return response;
            console.error(`HTTP error ${response.status} for URL ${url}`);
            throw new Error(`HTTP error ${response.status}`);
        } catch (error) {
            console.error(`Attempt ${retries + 1} failed for URL ${url}: ${error.message}`);
            retries++;
            await sleep(1000);
        }
    }
    console.warn(`Max retries reached for URL ${url}`);
    return null;
};

module.exports = async (req, res) => {
    const { token, sourceGuildId, targetGuildId } = req.query;
    let output = '', errors = [];

    try {
        const fetchData = async (endpoint) => {
            const response = await fetchWithRetry(endpoint, {
                headers: { 'Authorization': `Bot ${token}`, 'Content-Type': 'application/json' }
            });
            return response ? response.json() : null;
        };

        const [sourceChannels, targetChannels, sourceRoles, targetRoles] = await Promise.all([
            fetchData(`https://discord.com/api/v10/guilds/${sourceGuildId}/channels`),
            fetchData(`https://discord.com/api/v10/guilds/${targetGuildId}/channels`),
            fetchData(`https://discord.com/api/v10/guilds/${sourceGuildId}/roles`),
            fetchData(`https://discord.com/api/v10/guilds/${targetGuildId}/roles`)
        ]);

        if (!sourceChannels || !targetChannels || !sourceRoles || !targetRoles) {
            throw new Error('Failed to fetch guild data');
        }

        output += `Fetched ${sourceChannels.length} source and ${targetChannels.length} target channels.\n`;
        output += `Fetched ${sourceRoles.length} source and ${targetRoles.length} target roles.\n`;

        await Promise.all([
            ...targetChannels.map(channel =>
                fetchWithRetry(`https://discord.com/api/v10/channels/${channel.id}`, { method: 'DELETE', headers: { 'Authorization': `Bot ${token}` } })
                    .then(() => output += `Deleted channel: ${channel.name}\n`)
            ),
            ...targetRoles.filter(role => role.name !== '@everyone').map(role =>
                fetchWithRetry(`https://discord.com/api/v10/guilds/${targetGuildId}/roles/${role.id}`, { method: 'DELETE', headers: { 'Authorization': `Bot ${token}` } })
                    .then(() => output += `Deleted role: ${role.name}\n`)
            )
        ]);

        const additionalChannelResponse = await fetchWithRetry(`https://discord.com/api/v10/guilds/${targetGuildId}/channels`, {
            method: 'POST',
            headers: { 'Authorization': `Bot ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: "Copied with Nebula Services", type: 0, position: 0 })
        });

        const additionalChannel = additionalChannelResponse ? await additionalChannelResponse.json() : null;
        const additionalChannelId = additionalChannel ? additionalChannel.id : null;
        output += additionalChannelId ? `Created additional channel: ${additionalChannel.name}\n` : 'Failed to create additional channel.\n';

        const categoryMap = {};
        const createPromises = sourceChannels.map(sourceChannel => {
            const payload = {
                ...sourceChannel,
                parent_id: categoryMap[sourceChannel.parent_id] || null,
                topic: sourceChannel.topic || null,
                nsfw: sourceChannel.nsfw || false
            };

            if (sourceChannel.type === 4) { // Category
                return fetchWithRetry(`https://discord.com/api/v10/guilds/${targetGuildId}/channels`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bot ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                }).then(response => response.json())
                    .then(createdCategory => {
                        categoryMap[sourceChannel.id] = createdCategory.id;
                        output += `Created category: ${createdCategory.name}\n`;
                    });
            } else {
                return fetchWithRetry(`https://discord.com/api/v10/guilds/${targetGuildId}/channels`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bot ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                }).then(response => response.json())
                    .then(createdChannel => {
                        output += `Created channel: ${createdChannel.name}\n`;
                    });
            }
        });

        createPromises.push(...sourceRoles.filter(role => role.name !== '@everyone').map(role =>
            fetchWithRetry(`https://discord.com/api/v10/guilds/${targetGuildId}/roles`, {
                method: 'POST',
                headers: { 'Authorization': `Bot ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(role)
            }).then(response => response.json())
                .then(createdRole => {
                    output += `Created role: ${createdRole.name}\n`;
                }).catch(() => {
                    output += `Failed to create role: ${role.name}\n`;
                    errors.push(`Failed to create role: ${role.name}`);
                })
        ));

        await Promise.all(createPromises);

        const sourceGuild = await fetchData(`https://discord.com/api/v10/guilds/${sourceGuildId}`);
        if (!sourceGuild) throw new Error('Failed to fetch source guild details');

        const updatePayload = {
            name: sourceGuild.name,
            icon: sourceGuild.icon ? `https://cdn.discordapp.com/icons/${sourceGuild.id}/${sourceGuild.icon}.png` : null,
            verification_level: sourceGuild.verification_level,
            default_message_notifications: sourceGuild.default_message_notifications,
            explicit_content_filter: sourceGuild.explicit_content_filter
        };

        const updateGuildResponse = await fetchWithRetry(`https://discord.com/api/v10/guilds/${targetGuildId}`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bot ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(updatePayload)
        });

        output += updateGuildResponse ? 'Updated target guild details.\n' : 'Failed to update target guild details.\n';
        if (!updateGuildResponse) errors.push('Failed to update target guild details.');

        if (additionalChannelId) {
            const webhookPayload = { name: 'Powered by Nebula Services', avatar: 'https://i.imgur.com/ArKqDKr.png', channel_id: additionalChannelId };
            const createWebhookResponse = await fetchWithRetry(`https://discord.com/api/v10/channels/${additionalChannelId}/webhooks`, {
                method: 'POST',
                headers: { 'Authorization': `Bot ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(webhookPayload)
            });

            if (createWebhookResponse) {
                const webhook = await createWebhookResponse.json();
                output += 'Created webhook in special channel.\n';

                const webhookMessagePayload = {
                    embeds: [
                        { title: 'Thank You for Using Nebula Services', description: 'This channel was created to inform you of the cloning process. Feel free to delete it.', color: 0xAB00FF },
                        { title: 'Errors Encountered', description: errors.length ? errors.join('\n') : 'No errors encountered.', color: 0xAB00FF }
                    ]
                };

                const sendWebhookResponse = await fetchWithRetry(`https://discord.com/api/v10/webhooks/${webhook.id}/${webhook.token}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(webhookMessagePayload)
                });

                output += sendWebhookResponse ? 'Webhook message sent.\n' : 'Failed to send webhook message.\n';
                if (!sendWebhookResponse) errors.push('Failed to send webhook message.');
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
