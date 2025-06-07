const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
require('dotenv').config();
const { MOD_LOG_CHANNEL } = process.env;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('serverinfo')
        .setDescription('Get information about the server'),

    async execute(interaction) {
        const guild = interaction.guild;
        const owner = await guild.fetchOwner();

        const textChannels = guild.channels.cache.filter(c => c.type === 0).size;
        const voiceChannels = guild.channels.cache.filter(c => c.type === 2).size;
        const categories = guild.channels.cache.filter(c => c.type === 4).size;

        const embed = new EmbedBuilder()
            .setTitle('📊 Server Information')
            .setThumbnail(guild.iconURL({ dynamic: true }))
            .setColor('#00BFFF')
            .addFields(
                { name: 'Server Name', value: guild.name, inline: true },
                { name: '🌐 Server ID', value: guild.id, inline: true },
                { name: '👑 Owner', value: `<@${owner.id}>`, inline: true },
                { name: '📅 Created On', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:D>`, inline: true },
                { name: 'Members', value: `${guild.memberCount}`, inline: true },
                { name: '💬 Text Channels', value: `${textChannels}`, inline: true },
                { name: '🔊 Voice Channels', value: `${voiceChannels}`, inline: true },
                { name: '📂 Categories', value: `${categories}`, inline: true },
                { name: '🏷️ Roles', value: `${guild.roles.cache.size}`, inline: true },
                { name: '🚀 Boosts', value: `${guild.premiumSubscriptionCount} (Tier ${guild.premiumTier})`, inline: true }
            )
            .setFooter({ text: 'Server Info', iconURL: guild.iconURL({ dynamic: true }) })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });

        embed.setFooter({ 
            text: `Requested by ${interaction.user.tag}`,
            iconURL: interaction.user.displayAvatarURL({ dynamic: true })
        }).setTimestamp();

        await interaction.client.channels.cache.get(MOD_LOG_CHANNEL).send({ embeds: [embed] });
    }
};
