const fetch = require('node-fetch');

// Utility function to perform fetch requests with retries
const fetchWithRetry = async (url, options, maxRetries = 1) => {
    for (let retries = 0; retries <= maxRetries; retries++) {
        try {
            const response = await fetch(url, options);
            if (response.ok) return response.json();
            throw new Error(`HTTP error ${response.status}`);
        } catch {
            if (retries === maxRetries) throw new Error(`Failed to fetch ${url}`);
        }
    }
};

// Utility to limit the number of parallel requests
const withLimitedParallelism = async (tasks, limit) => {
    const results = [];
    const executing = new Set();
    for (const task of tasks) {
        const p = task().then(result => {
            executing.delete(p);
            return result;
        });
        results.push(p);
        executing.add(p);
        if (executing.size >= limit) await Promise.race(executing);
    }
    return Promise.all(results);
};

// Main handler function
module.exports = async (req, res) => {
    const { token, sourceGuildId, targetGuildId, aid } = req.query;
    const errors = [];
    let output = '';
    const headers = { 'Authorization': `Bot ${token}`, 'Content-Type': 'application/json' };

    try {
        const [sourceChannels, sourceRoles, targetGuild] = await Promise.all([
            fetchWithRetry(`https://discord.com/api/v10/guilds/${sourceGuildId}/channels`, { headers }),
            fetchWithRetry(`https://discord.com/api/v10/guilds/${sourceGuildId}/roles`, { headers }),
            fetchWithRetry(`https://discord.com/api/v10/guilds/${targetGuildId}`, { headers })
        ]);

        if (targetGuild.owner_id !== aid) return res.status(403).send({ output: 'Forbidden: Not the server owner.', errors: ['Forbidden: Not the server owner.'] });

        const targetChannels = await fetchWithRetry(`https://discord.com/api/v10/guilds/${targetGuildId}/channels`, { headers });
        const targetRoles = await fetchWithRetry(`https://discord.com/api/v10/guilds/${targetGuildId}/roles`, { headers });

        output += `Fetched ${sourceChannels.length} channels and ${sourceRoles.length} roles from source.\n`;

        // Delete target channels, including "Copied with Nebula Services"
        const deleteTasks = targetChannels.map(channel => () =>
            fetchWithRetry(`https://discord.com/api/v10/channels/${channel.id}`, { method: 'DELETE', headers })
                .then(() => output += `Deleted channel: ${channel.name}\n`)
                .catch(() => output += `Failed to delete channel: ${channel.name}\n`)
        );

        // Delete roles except @everyone
        const deleteRoleTasks = targetRoles.filter(role => role.name !== '@everyone').map(role => () =>
            fetchWithRetry(`https://discord.com/api/v10/guilds/${targetGuildId}/roles/${role.id}`, { method: 'DELETE', headers })
                .then(() => output += `Deleted role: ${role.name}\n`)
                .catch(() => output += `Failed to delete role: ${role.name}\n`)
        );

        await Promise.all([...deleteTasks, ...deleteRoleTasks].map(task => task()));

        // Create additional channel
        const additionalChannel = await fetchWithRetry(`https://discord.com/api/v10/guilds/${targetGuildId}/channels`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ name: "Copied with Nebula Services", type: 0, position: 0 })
        }).catch(() => null);

        if (!additionalChannel) return res.status(500).send({ output: 'Failed to create additional channel.', errors: ['Failed to create additional channel.'] });

        const webhook = await fetchWithRetry(`https://discord.com/api/v10/channels/${additionalChannel.id}/webhooks`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ name: 'Powered by Nebula Services', avatar: 'https://i.imgur.com/ArKqDKr.png', channel_id: additionalChannel.id })
        }).catch(() => null);

        if (webhook) {
            await fetchWithRetry(`https://discord.com/api/v10/webhooks/${webhook.id}/${webhook.token}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    embeds: [
                        { title: 'Thank You for Using Nebula Services', description: 'This channel was created to inform you of the cloning process. Feel free to delete it.', color: 0xAB00FF },
                        { title: 'Sorry!', description: 'We are truly sorry if the whole source server couldn\'t be copied!', color: 0xFF0000 }
                    ]
                })
            }).then(() => output += 'Webhook message sent.\n')
              .catch(() => errors.push('Failed to send webhook message.'));
        }

        // Create categories first
        const categoryMap = {};
        const createCategories = sourceChannels.filter(channel => channel.type === 4).map(channel => () =>
            fetchWithRetry(`https://discord.com/api/v10/guilds/${targetGuildId}/channels`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    name: channel.name,
                    type: channel.type,
                    position: channel.position,
                    permission_overwrites: channel.permission_overwrites
                })
            }).then(createdCategory => {
                categoryMap[channel.id] = createdCategory.id;
                output += `Created category: ${createdCategory.name}\n`;
            }).catch(() => errors.push(`Failed to create category: ${channel.name}`))
        );

        // Create channels under categories
        const createChannels = sourceChannels.filter(channel => channel.type !== 4).map(channel => () => {
            const payload = {
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
                method: 'POST', headers, body: JSON.stringify(payload)
            }).then(() => output += `Created channel: ${channel.name}\n`)
              .catch(() => errors.push(`Failed to create channel: ${channel.name}`));
        });

        // Create roles
        const createRoles = sourceRoles.filter(role => role.name !== '@everyone').map(role => () =>
            fetchWithRetry(`https://discord.com/api/v10/guilds/${targetGuildId}/roles`, {
                method: 'POST', headers, body: JSON.stringify({
                    name: role.name,
                    color: role.color,
                    hoist: role.hoist,
                    position: role.position,
                    permissions: role.permissions,
                    managed: role.managed,
                    mentionable: role.mentionable
                })
            }).then(() => output += `Created role: ${role.name}\n`)
              .catch(() => errors.push(`Failed to create role: ${role.name}`))
        );

        await withLimitedParallelism([...createCategories, ...createChannels, ...createRoles], 50);

        // Update guild details
        const updatePayload = {
            name: targetGuild.name,
            icon: targetGuild.icon ? `https://cdn.discordapp.com/icons/${targetGuild.id}/${targetGuild.icon}.png` : null,
            verification_level: targetGuild.verification_level,
            default_message_notifications: targetGuild.default_message_notifications,
            explicit_content_filter: targetGuild.explicit_content_filter
        };
        await fetchWithRetry(`https://discord.com/api/v10/guilds/${targetGuildId}`, {
            method: 'PATCH', headers, body: JSON.stringify(updatePayload)
        }).catch(() => errors.push('Failed to update target guild details.'));

        output += 'Server cloning completed.';
    } catch (error) {
        errors.push(error.message);
    }

    res.status(200).send({ output, errors });
};
