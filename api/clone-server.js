const fetch = require('node-fetch');

const fetchWithRetry = async (url, options, maxRetries = 3) => {
    for (let retries = 0; retries < maxRetries; retries++) {
        try {
            const response = await fetch(url, options);
            if (response.ok) return response;
            throw new Error(`HTTP error ${response.status}`);
        } catch (error) {
            if (retries === maxRetries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, 1500)); // 1-second delay
        }
    }
};

module.exports = async (req, res) => {
    const { token, sourceGuildId, targetGuildId } = req.query;
    let output = '';
    let errors = [];

    try {
        // Fetch channels from source and target guilds
        const [sourceChannels, targetChannels] = await Promise.all([
            fetchWithRetry(`https://discord.com/api/v10/guilds/${sourceGuildId}/channels`, {
                headers: { 'Authorization': `Bot ${token}` }
            }).then(response => response.json()),
            fetchWithRetry(`https://discord.com/api/v10/guilds/${targetGuildId}/channels`, {
                headers: { 'Authorization': `Bot ${token}` }
            }).then(response => response.json())
        ]);

        output += `Fetched ${sourceChannels.length} source and ${targetChannels.length} target channels.\n`;

        // Phase 1: Delete all target channels
        await Promise.all(targetChannels.map(channel =>
            fetchWithRetry(`https://discord.com/api/v10/channels/${channel.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bot ${token}` }
            }).then(() => output += `Deleted channel: ${channel.name}\n`)
            .catch(error => errors.push(`Failed to delete channel ${channel.name}: ${error.message}`))
        ));

        // Phase 2: Create categories and roles
        const categories = sourceChannels.filter(c => c.type === 4);
        const roles = (await fetchWithRetry(`https://discord.com/api/v10/guilds/${sourceGuildId}/roles`, {
            headers: { 'Authorization': `Bot ${token}` }
        }).then(response => response.json())).filter(role => role.name !== '@everyone');

        const categoryMap = {};
        await Promise.all([
            ...categories.map(category =>
                fetchWithRetry(`https://discord.com/api/v10/guilds/${targetGuildId}/channels`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bot ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify(category)
                }).then(response => response.json().then(createdCategory => {
                    categoryMap[category.id] = createdCategory.id;
                    output += `Created category: ${createdCategory.name}\n`;
                }))
                .catch(error => errors.push(`Failed to create category: ${error.message}`))
            ),
            ...roles.map(role =>
                fetchWithRetry(`https://discord.com/api/v10/guilds/${targetGuildId}/roles`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bot ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify(role)
                }).then(response => response.json().then(createdRole => {
                    output += `Created role: ${createdRole.name}\n`;
                }))
                .catch(error => errors.push(`Failed to create role: ${error.message}`))
            )
        ]);

        // Phase 3: Create channels
        const channels = sourceChannels.filter(c => c.type !== 4).map(c => ({
            ...c,
            parent_id: categoryMap[c.parent_id] || null
        }));

        await Promise.all(channels.map(channel =>
            fetchWithRetry(`https://discord.com/api/v10/guilds/${targetGuildId}/channels`, {
                method: 'POST',
                headers: { 'Authorization': `Bot ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(channel)
            }).then(response => response.json().then(createdChannel => {
                output += `Created channel: ${createdChannel.name}\n`;
            }))
            .catch(error => errors.push(`Failed to create channel: ${error.message}`))
        ));

        // Update guild details
        const sourceGuild = await fetchWithRetry(`https://discord.com/api/v10/guilds/${sourceGuildId}`, {
            headers: { 'Authorization': `Bot ${token}` }
        }).then(response => response.json());

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
        .catch(error => {
            output += 'Failed to update target guild details.\n';
            errors.push('Failed to update target guild details.');
        });

        res.status(200).json({ output, errors });
    } catch (error) {
        output += `Error: ${error.message}\n`;
        errors.push(error.message);
        res.status(500).json({ output, errors });
    }
};
