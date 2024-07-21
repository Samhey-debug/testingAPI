const fetch = require('node-fetch');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchWithRetry = async (url, options, maxRetries = 3) => {
    let retries = 0;
    let response;
    while (retries < maxRetries) {
        try {
            response = await fetch(url, options);
            if (response.ok) return response;
            throw new Error(`HTTP error ${response.status}`);
        } catch (error) {
            console.error(`Attempt ${retries + 1} failed: ${error.message}`);
            retries++;
            await sleep(1);
        }
    }
    console.warn(`Max retries reached for ${url}`);
    return null;
};

module.exports = async (req, res) => {
    const { token, sourceGuildId, targetGuildId } = req.query;
    let output = '';
    let errors = [];
    
    try {
        // Fetch source and target guild channels
        const fetchChannels = (guildId) =>
            fetchWithRetry(`https://discord.com/api/v10/guilds/${guildId}/channels`, {
                headers: {
                    'Authorization': `Bot ${token}`,
                    'Content-Type': 'application/json'
                }
            });

        const [sourceChannelsResponse, targetChannelsResponse] = await Promise.all([
            fetchChannels(sourceGuildId),
            fetchChannels(targetGuildId)
        ]);

        if (!sourceChannelsResponse || !targetChannelsResponse) throw new Error('Failed to fetch guild channels');

        const sourceChannels = await sourceChannelsResponse.json();
        const targetChannels = await targetChannelsResponse.json();
        output += `Fetched ${sourceChannels.length} channels from source guild and ${targetChannels.length} channels from target guild.\n`;

        // Fetch source and target guild roles
        const fetchRoles = (guildId) =>
            fetchWithRetry(`https://discord.com/api/v10/guilds/${guildId}/roles`, {
                headers: {
                    'Authorization': `Bot ${token}`,
                    'Content-Type': 'application/json'
                }
            });

        const [sourceRolesResponse, targetRolesResponse] = await Promise.all([
            fetchRoles(sourceGuildId),
            fetchRoles(targetGuildId)
        ]);

        if (!sourceRolesResponse || !targetRolesResponse) throw new Error('Failed to fetch guild roles');

        const sourceRoles = await sourceRolesResponse.json();
        const targetRoles = await targetRolesResponse.json();
        output += `Fetched ${sourceRoles.length} roles from source guild and ${targetRoles.length} roles from target guild.\n`;

        // Delete all channels and roles in target guild in parallel
        const deletePromises = [
            ...targetChannels.map(channel =>
                fetchWithRetry(`https://discord.com/api/v10/channels/${channel.id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bot ${token}`,
                        'Content-Type': 'application/json'
                    }
                }).then(() => output += `Deleted channel: ${channel.name}\n`)
            ),
            ...targetRoles.filter(role => role.name !== '@everyone').map(role =>
                fetchWithRetry(`https://discord.com/api/v10/guilds/${targetGuildId}/roles/${role.id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bot ${token}`,
                        'Content-Type': 'application/json'
                    }
                }).then(() => output += `Deleted role: ${role.name}\n`)
            )
        ];

        await Promise.all(deletePromises);

        // Create additional channel at the top
        const additionalPayload = {
            name: "Copied with Nebula Services",
            type: 0,
            position: 0
        };

        const additionalChannelResponse = await fetchWithRetry(`https://discord.com/api/v10/guilds/${targetGuildId}/channels`, {
            method: 'POST',
            headers: {
                'Authorization': `Bot ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(additionalPayload)
        });

        let additionalChannelId;
        if (additionalChannelResponse) {
            const additionalChannel = await additionalChannelResponse.json();
            additionalChannelId = additionalChannel.id;
            output += `Created additional channel: ${additionalChannel.name}\n`;
        } else {
            output += 'Failed to create additional channel.\n';
            errors.push('Failed to create additional channel.');
        }

        // Create channels and roles in parallel
        const createPromises = [];

        // Map for category creation
        const categoryMap = {};

        // Create categories and other channels in parallel
        sourceChannels.forEach((sourceChannel) => {
            let payload = {
                name: sourceChannel.name,
                type: sourceChannel.type,
                position: sourceChannel.position,
                parent_id: sourceChannel.parent_id ? categoryMap[sourceChannel.parent_id] : null,
                topic: sourceChannel.topic || null,
                nsfw: sourceChannel.nsfw || false,
                bitrate: sourceChannel.bitrate || 64000,
                user_limit: sourceChannel.user_limit || 0,
                rate_limit_per_user: sourceChannel.rate_limit_per_user || 0,
                permission_overwrites: sourceChannel.permission_overwrites || []
            };

            if (sourceChannel.type === 4) { // Category
                createPromises.push(
                    fetchWithRetry(`https://discord.com/api/v10/guilds/${targetGuildId}/channels`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bot ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(payload)
                    }).then((response) => response && response.json().then((createdCategory) => {
                        categoryMap[sourceChannel.id] = createdCategory.id;
                        output += `Created category: ${createdCategory.name}\n`;
                    }))
                );
            } else {
                if (sourceChannel.type === 5) { // Forum channel
                    payload = {
                        ...payload,
                        available_tags: sourceChannel.available_tags || [],
                        default_sort_order: sourceChannel.default_sort_order || 0
                    };
                } else if (sourceChannel.type === 13) { // Stage channel
                    payload = {
                        ...payload,
                        bitrate: sourceChannel.bitrate || 64000,
                        user_limit: sourceChannel.user_limit || 0
                    };
                } else if (sourceChannel.type === 10) { // Announcement channel
                    payload = {
                        ...payload,
                        nsfw: sourceChannel.nsfw || false
                    };
                }

                createPromises.push(
                    fetchWithRetry(`https://discord.com/api/v10/guilds/${targetGuildId}/channels`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bot ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(payload)
                    }).then((response) => response && response.json().then((createdChannel) => {
                        output += `Created channel: ${createdChannel.name}\n`;
                    }))
                );
            }
        });

        // Create roles in parallel
        createPromises.push(...sourceRoles.map((sourceRole) => {
            if (sourceRole.name !== '@everyone') {
                const payload = {
                    name: sourceRole.name,
                    color: sourceRole.color,
                    hoist: sourceRole.hoist,
                    position: sourceRole.position,
                    permissions: sourceRole.permissions,
                    managed: sourceRole.managed,
                    mentionable: sourceRole.mentionable
                };

                return fetchWithRetry(`https://discord.com/api/v10/guilds/${targetGuildId}/roles`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bot ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                }).then((response) => {
                    if (response) {
                        output += `Created role: ${sourceRole.name}\n`;
                    } else {
                        output += `Failed to create role: ${sourceRole.name}\n`;
                        errors.push(`Failed to create role: ${sourceRole.name}`);
                    }
                });
            }
        }));

        await Promise.all(createPromises);

        // Fetch source guild details
        const sourceGuildResponse = await fetchWithRetry(`https://discord.com/api/v10/guilds/${sourceGuildId}`, {
            headers: {
                'Authorization': `Bot ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!sourceGuildResponse) throw new Error('Failed to fetch source guild details');
        const sourceGuild = await sourceGuildResponse.json();
        output += `Fetched source guild details.\n`;

        // Update target guild details
        const updatePayload = {
            name: sourceGuild.name,
            icon: sourceGuild.icon ? `https://cdn.discordapp.com/icons/${sourceGuild.id}/${sourceGuild.icon}.png` : null,
            verification_level: sourceGuild.verification_level,
            default_message_notifications: sourceGuild.default_message_notifications,
            explicit_content_filter: sourceGuild.explicit_content_filter,
            system_channel_id: null
        };

        const updateGuildResponse = await fetchWithRetry(`https://discord.com/api/v10/guilds/${targetGuildId}`, {
    method: 'PATCH',
    headers: {
        'Authorization': `Bot ${token}`,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(updatePayload)
});

if (updateGuildResponse) {
    output += 'Updated target guild details.\n';
} else {
    output += 'Failed to update target guild details.\n';
    errors.push('Failed to update target guild details.');
}

// Create a webhook in the special channel
if (additionalChannelId) {
    const webhookPayload = {
        name: 'Powered by Nebula Services',
        avatar: 'https://i.imgur.com/ArKqDKr.png',
        channel_id: additionalChannelId
    };

    const createWebhookResponse = await fetchWithRetry(`https://discord.com/api/v10/channels/${additionalChannelId}/webhooks`, {
        method: 'POST',
        headers: {
            'Authorization': `Bot ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(webhookPayload)
    });

    if (createWebhookResponse) {
        const webhook = await createWebhookResponse.json();
        output += `Created webhook in special channel.\n`;

        // Prepare the embeds
        const webhookMessagePayload = {
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
        };

        // Send a message via the webhook
        const sendWebhookResponse = await fetchWithRetry(`https://discord.com/api/v10/webhooks/${webhook.id}/${webhook.token}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(webhookMessagePayload)
        });

        if (sendWebhookResponse) {
            output += 'Webhook message sent.\n';
        } else {
            output += 'Failed to send webhook message.\n';
            errors.push('Failed to send webhook message.');
        }
    } else {
        output += 'Failed to create webhook.\n';
        errors.push('Failed to create webhook.');
    }
}

output += 'Server cloning completed.';

res.status(200).json({ output, errors });
