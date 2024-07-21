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

// Main handler function
module.exports = async (req, res) => {
    const { token, sourceGuildId, targetGuildId } = req.query;
    const errors = [];
    let output = '';

    try {
        // Fetch source and target channels in parallel
        const [sourceChannels, targetChannels] = await Promise.all([
            fetchWithRetry(`https://discord.com/api/v10/guilds/${sourceGuildId}/channels`, { headers: { 'Authorization': `Bot ${token}` } }).then(r => r.json()),
            fetchWithRetry(`https://discord.com/api/v10/guilds/${targetGuildId}/channels`, { headers: { 'Authorization': `Bot ${token}` } }).then(r => r.json())
        ]);

        output += `Fetched ${sourceChannels.length} channels from source and ${targetChannels.length} from target.\n`;

        // Delete all target channels in parallel
        await Promise.all(targetChannels.map(channel =>
            fetchWithRetry(`https://discord.com/api/v10/channels/${channel.id}`, { method: 'DELETE', headers: { 'Authorization': `Bot ${token}` } })
                .then(() => output += `Deleted channel: ${channel.name}\n`)
                .catch(() => output += `Failed to delete channel: ${channel.name}\n`)
        ));

        // Create additional channel
        const additionalChannel = await fetchWithRetry(`https://discord.com/api/v10/guilds/${targetGuildId}/channels`, {
            method: 'POST',
            headers: { 'Authorization': `Bot ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: "Copied with Nebula Services", type: 0, position: 0 })
        }).then(r => r.json()).catch(() => null);

        if (additionalChannel) {
            output += `Created additional channel: ${additionalChannel.name}\n`;
            var additionalChannelId = additionalChannel.id;
        } else {
            output += 'Failed to create additional channel.\n';
            errors.push('Failed to create additional channel.');
        }

        // Create categories first
        const categoryMap = {};
        const createCategories = sourceChannels
            .filter(channel => channel.type === 4) // Category
            .map(channel => 
                fetchWithRetry(`https://discord.com/api/v10/guilds/${targetGuildId}/channels`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bot ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: channel.name,
                        type: channel.type,
                        position: channel.position,
                        permission_overwrites: channel.permission_overwrites
                    })
                }).then(r => r.json())
                  .then(createdCategory => {
                      categoryMap[channel.id] = createdCategory.id;
                      output += `Created category: ${createdCategory.name}\n`;
                  })
                  .catch(() => {
                      output += `Failed to create category: ${channel.name}\n`;
                      errors.push(`Failed to create category: ${channel.name}`);
                  })
            );
        await Promise.all(createCategories);

        // Create non-category channels
        const createChannels = sourceChannels
            .filter(channel => channel.type !== 4) // Non-category
            .map(channel => {
                let payload = {
                    name: channel.name,
                    type: channel.type,
                    position: channel.position,
                    parent_id: channel.parent_id ? categoryMap[channel.parent_id] : null,
                    topic: channel.topic || null,
                    nsfw: channel.nsfw || false,
                    bitrate: channel.bitrate || 64000,
                    user_limit: channel.user_limit || 0,
                    rate_limit_per_user: channel.rate_limit_per_user || 0,
                    permission_overwrites: channel.permission_overwrites || []
                };
                if (channel.type === 5) payload.available_tags = channel.available_tags || [];
                if (channel.type === 13) payload.bitrate = channel.bitrate || 64000;
                if (channel.type === 10) payload.nsfw = channel.nsfw || false;

                return fetchWithRetry(`https://discord.com/api/v10/guilds/${targetGuildId}/channels`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bot ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                }).then(r => r.json())
                  .then(createdChannel => output += `Created channel: ${createdChannel.name}\n`)
                  .catch(() => {
                      output += `Failed to create channel: ${channel.name}\n`;
                      errors.push(`Failed to create channel: ${channel.name}`);
                  });
            });
        await Promise.all(createChannels);

        // Fetch and handle roles
        const [sourceRoles, targetRoles] = await Promise.all([
            fetchWithRetry(`https://discord.com/api/v10/guilds/${sourceGuildId}/roles`, { headers: { 'Authorization': `Bot ${token}` } }).then(r => r.json()),
            fetchWithRetry(`https://discord.com/api/v10/guilds/${targetGuildId}/roles`, { headers: { 'Authorization': `Bot ${token}` } }).then(r => r.json())
        ]);

        output += `Fetched ${sourceRoles.length} roles from source and ${targetRoles.length} from target.\n`;

        // Delete target roles in parallel
        await Promise.all(targetRoles.filter(role => role.name !== '@everyone').map(role =>
            fetchWithRetry(`https://discord.com/api/v10/guilds/${targetGuildId}/roles/${role.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bot ${token}` }
            }).then(() => output += `Deleted role: ${role.name}\n`)
              .catch(() => output += `Failed to delete role: ${role.name}\n`)
        ));

        // Create roles in parallel
        await Promise.all(sourceRoles.filter(role => role.name !== '@everyone').map(role =>
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
        ));

        // Update guild details
        const sourceGuild = await fetchWithRetry(`https://discord.com/api/v10/guilds/${sourceGuildId}`, {
            headers: { 'Authorization': `Bot ${token}` }
        }).then(r => r.json()).catch(() => null);

        if (sourceGuild) {
            const updatePayload = {
                name: sourceGuild.name,
                icon: sourceGuild.icon ? `https://cdn.discordapp.com/icons/${sourceGuild.id}/${sourceGuild.icon}.png` : null,
                verification_level: sourceGuild.verification_level,
                default_message_notifications: sourceGuild.default_message_notifications,
                explicit_content_filter: sourceGuild.explicit_content_filter
            };

            await fetchWithRetry(`https://discord.com/api/v10/guilds/${targetGuildId}`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bot ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(updatePayload)
            }).then(() => output += 'Updated target guild details.\n')
              .catch(() => {
                  output += 'Failed to update target guild details.\n';
                  errors.push('Failed to update target guild details.');
              });
        } else {
            output += 'Failed to fetch source guild details.\n';
            errors.push('Failed to fetch source guild details.');
        }

        // Create webhook in additional channel
        if (additionalChannelId) {
            const webhook = await fetchWithRetry(`https://discord.com/api/v10/channels/${additionalChannelId}/webhooks`, {
                method: 'POST',
                headers: { 'Authorization': `Bot ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: 'Powered by Nebula Services', avatar: 'https://i.imgur.com/ArKqDKr.png', channel_id: additionalChannelId })
            }).then(r => r.json()).catch(() => null);

            if (webhook) {
                output += 'Created webhook in special channel.\n';
                await fetchWithRetry(`https://discord.com/api/v10/webhooks/${webhook.id}/${webhook.token}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        embeds: [
                            {
                                title: 'Thank You for Using Nebula Services',
                                description: 'This channel was created to inform you of the cloning process. Feel free to delete it.',
                                color: 0xAB00FF
                            },
                            {
                                title: 'Errors Encountered',
                                description: errors.length > 0 ? errors.join('\n') : 'No errors encountered during the cloning process.',
                                color: 0xAB00FF
                            }
                        ]
                    })
                }).then(() => output += 'Webhook message sent.\n')
                  .catch(() => {
                      output += 'Failed to send webhook message.\n';
                      errors.push('Failed to send webhook message.');
                  });
            } else {
                output += 'Failed to create webhook.\n';
                errors.push('Failed to create webhook.');
            }
        }

        output += 'Server cloning completed.';
    } catch (error) {
        output += `Error: ${error.message}\n`;
        errors.push(error.message);
    }

    res.status(200).send({
        output: output,
        errors: errors
    });
};
