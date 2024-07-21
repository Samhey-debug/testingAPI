const fetch = require('node-fetch');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchWithRetry(url, options, maxRetries = 3) {
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
            await sleep(1500); // Wait 1.5 seconds before retrying
        }
    }
    console.warn(`Max retries reached for ${url}`);
    return null; // Return null to indicate failure
}

module.exports = async (req, res) => {
    const { token, sourceGuildId, targetGuildId } = req.query;
    let errors = [];
    let output = '';

    try {
        // Fetch source guild channels
        let response = await fetchWithRetry(`https://discord.com/api/v10/guilds/${sourceGuildId}/channels`, {
            headers: {
                'Authorization': `Bot ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response) throw new Error('Failed to fetch source guild channels');
        const sourceChannels = await response.json();
        output += `Fetched ${sourceChannels.length} channels from source guild.\n`;

        // Fetch target guild channels
        response = await fetchWithRetry(`https://discord.com/api/v10/guilds/${targetGuildId}/channels`, {
            headers: {
                'Authorization': `Bot ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response) throw new Error('Failed to fetch target guild channels');
        const targetChannels = await response.json();
        output += `Fetched ${targetChannels.length} channels from target guild.\n`;

        // Delete all channels in target guild
        for (let targetChannel of targetChannels) {
            await fetchWithRetry(`https://discord.com/api/v10/channels/${targetChannel.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bot ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            output += `Deleted channel: ${targetChannel.name}\n`;
        }

        // Create an additional channel at the top
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

        // Create categories first
        const categoryMap = {};
        for (let sourceChannel of sourceChannels) {
            if (sourceChannel.type === 4) { // Category
                let payload = {
                    name: sourceChannel.name,
                    type: sourceChannel.type,
                    position: sourceChannel.position,
                    permission_overwrites: sourceChannel.permission_overwrites
                };

                const createdCategoryResponse = await fetchWithRetry(`https://discord.com/api/v10/guilds/${targetGuildId}/channels`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bot ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                if (createdCategoryResponse) {
                    const createdCategory = await createdCategoryResponse.json();
                    categoryMap[sourceChannel.id] = createdCategory.id;
                    output += `Created category: ${createdCategory.name}\n`;
                } else {
                    output += `Failed to create category: ${sourceChannel.name}\n`;
                    errors.push(`Failed to create category: ${sourceChannel.name}`);
                }

                await sleep(1500); // 1.5-second cooldown
            }
        }

        // Create non-category channels
        for (let sourceChannel of sourceChannels) {
            if (sourceChannel.type !== 4) { // Non-category
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

                // Handle special channel types
                if (sourceChannel.type === 5) { // Forum channel
                    payload = {
                        ...payload,
                        type: 5,
                        available_tags: sourceChannel.available_tags || [],
                        default_sort_order: sourceChannel.default_sort_order || 0
                    };
                } else if (sourceChannel.type === 13) { // Stage channel
                    payload = {
                        ...payload,
                        type: 13,
                        bitrate: sourceChannel.bitrate || 64000,
                        user_limit: sourceChannel.user_limit || 0
                    };
                } else if (sourceChannel.type === 10) { // Announcement channel
                    payload = {
                        ...payload,
                        type: 10,
                        nsfw: sourceChannel.nsfw || false
                    };
                }

                const createdChannelResponse = await fetchWithRetry(`https://discord.com/api/v10/guilds/${targetGuildId}/channels`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bot ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                if (createdChannelResponse) {
                    const createdChannel = await createdChannelResponse.json();
                    output += `Created channel: ${createdChannel.name}\n`;
                } else {
                    output += `Failed to create channel: ${sourceChannel.name}\n`;
                    errors.push(`Failed to create channel: ${sourceChannel.name}`);
                }

                await sleep(1500); // 1.5-second cooldown
            }
        }

        // Fetch source guild roles
        response = await fetchWithRetry(`https://discord.com/api/v10/guilds/${sourceGuildId}/roles`, {
            headers: {
                'Authorization': `Bot ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response) throw new Error('Failed to fetch source guild roles');
        const sourceRoles = await response.json();
        output += `Fetched ${sourceRoles.length} roles from source guild.\n`;

        // Fetch target guild roles
        response = await fetchWithRetry(`https://discord.com/api/v10/guilds/${targetGuildId}/roles`, {
            headers: {
                'Authorization': `Bot ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response) throw new Error('Failed to fetch target guild roles');
        const targetRoles = await response.json();
        output += `Fetched ${targetRoles.length} roles from target guild.\n`;

        // Delete all roles in target guild except @everyone
        for (let targetRole of targetRoles) {
            if (targetRole.name !== '@everyone') {
                await fetchWithRetry(`https://discord.com/api/v10/guilds/${targetGuildId}/roles/${targetRole.id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bot ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                output += `Deleted role: ${targetRole.name}\n`;
            }
        }

        // Create roles in target guild
        for (let sourceRole of sourceRoles) {
            if (sourceRole.name !== '@everyone') {
                let payload = {
                    name: sourceRole.name,
                    color: sourceRole.color,
                    hoist: sourceRole.hoist,
                    position: sourceRole.position,
                    permissions: sourceRole.permissions,
                    managed: sourceRole.managed,
                    mentionable: sourceRole.mentionable
                  };

                const createdRoleResponse = await fetchWithRetry(`https://discord.com/api/v10/guilds/${targetGuildId}/roles`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bot ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                if (createdRoleResponse) {
                    const createdRole = await createdRoleResponse.json();
                    output += `Created role: ${createdRole.name}\n`;
                } else {
                    output += `Failed to create role: ${sourceRole.name}\n`;
                    errors.push(`Failed to create role: ${sourceRole.name}`);
                }

                await sleep(1500); // 1.5-second cooldown
            }
        }

        // Fetch source guild details
        response = await fetchWithRetry(`https://discord.com/api/v10/guilds/${sourceGuildId}`, {
            headers: {
                'Authorization': `Bot ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response) throw new Error('Failed to fetch source guild details');
        const sourceGuild = await response.json();
        output += `Fetched source guild details.\n`;

        // Update target guild details
        let updatePayload = {
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
                await fetchWithRetry(`https://discord.com/api/v10/webhooks/${webhook.id}/${webhook.token}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(webhookMessagePayload)
                });

                output += 'Webhook message sent.\n';
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
