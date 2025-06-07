const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
require('dotenv').config();
const { MOD_LOG_CHANNEL, ADMIN, MOD, BOT_DEV, HELPER } = process.env;

const { getModLogs } = require('../utils/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('userinfo')
        .setDescription('Displays information about a user.')
        .addUserOption(option => 
            option.setName('target')
                .setDescription('The user to get information about')
                .setRequired(true)),
                
    async execute(interaction) {
        const user = interaction.options.getUser('target') || interaction.user;
        const member = interaction.guild.members.cache.get(user.id);
        const hasPerms = interaction.member.roles.cache.some(role => role.id === ADMIN) || interaction.member.roles.cache.some(role => role.id === MOD) || interaction.member.roles.cache.some(role => role.id === HELPER) || interaction.member.roles.cache.some(role => role.id === BOT_DEV);
        if (!hasPerms) {
            const errorEmbed = new EmbedBuilder()
                .setTitle('❌ Insufficient Permissions')
                .setDescription('You do not have permission to use this command.')
                .setColor(0xff5555)
                .setTimestamp();
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setColor(0x0099ff)
            .setTitle(`${user.username}'s Information`)
            .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 512 }))
            .addFields([
            { name: 'Username', value: `${user.tag}`, inline: true },
            { name: 'ID', value: `${user.id}`, inline: true },
            { name: 'Account Created', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:F>`, inline: false },
            { name: 'Joined Server', value: member ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>` : 'N/A', inline: false },
            { name: 'Roles', value: member ? member.roles.cache.map(role => role.name).join(', ') || 'No roles' : 'N/A', inline: false },
            { name: 'Status', value: member && member.presence && member.presence.status ? member.presence.status.charAt(0).toUpperCase() + member.presence.status.slice(1) : 'Offline', inline: false },
            { name: 'Activity', value: member && member.presence && member.presence.activities && member.presence.activities.length > 0 ? member.presence.activities[0].name : 'N/A', inline: true },
            { name: 'Bot', value: user.bot ? 'Yes' : 'No', inline: false },
            { name: 'Cases', value: `${getModLogs(user.id)?.length || 0} cases found`, inline: false }
            ])
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });

        embed.setFooter({ 
            text: `Requested by ${interaction.user.tag}`,
            iconURL: interaction.user.displayAvatarURL({ dynamic: true })
        }).setTimestamp();

        await interaction.client.channels.cache.get(MOD_LOG_CHANNEL).send({ embeds: [embed] });
    },

};