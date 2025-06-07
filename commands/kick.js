const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { logModeration } = require('../utils/database');
require('dotenv').config();
const { MOD, ADMIN, MOD_LOG_CHANNEL } = process.env;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kick a user from the server')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to kick')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the kick')
                .setRequired(true)),

    async execute(interaction) {
        const moderator = interaction.member;
        const targetUser = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason');

        const hasPerms = moderator.roles.cache.some(role => role.id === ADMIN) || moderator.roles.cache.some(role => role.id === MOD);

        // Check for moderator role
        if (!hasPerms) {
            const embed = new EmbedBuilder()
                .setTitle('Permission Denied')
                .setColor('#ff0000')
                .setDescription('❌ You do not have permission to use this command.')
                .setTimestamp();

            return interaction.reply({
                embeds: [embed],
                ephemeral: true
            });
        }

        // Prevent self-kick
        if (targetUser.id === interaction.user.id) {
            const embed = new EmbedBuilder()
                .setTitle('Action Denied')
                .setColor('#ff0000')
                .setDescription('❌ You cannot kick yourself.')
                .setTimestamp();

            return interaction.reply({
                embeds: [embed],
                ephemeral: true
            });
        }

        if ( hasPerms && targetUser.id === ADMIN) {
            const embed = new EmbedBuilder()
                .setTitle('Action Denied')
                .setColor('#ff0000')
                .setDescription('❌ You cannot kick this user. They have higher permissions.')
                .setTimestamp();

            return interaction.reply({
                embeds: [embed],
                ephemeral: true
            });
        }

        const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

        if (!member) {
            const embed = new EmbedBuilder()
                .setTitle('User Not Found')
                .setColor('#ff0000')
                .setDescription('❌ That user is not in this server.')
                .setTimestamp();

            return interaction.reply({
                embeds: [embed],
                ephemeral: true
            });
        }

        try {
            await member.kick(reason);

            const caseId = logModeration(targetUser.id, {
                type: 'kick',
                reason: reason,
                moderator: interaction.user.id,
                timestamp: new Date().toISOString()
            });

            const embed = new EmbedBuilder()
                .setTitle('User Kicked')
                .setColor('#ff9900')
                .setThumbnail(targetUser.displayAvatarURL())
                .addFields(
                    { name: 'User', value: `${targetUser.tag}`, inline: true },
                    { name: 'Reason', value: reason, inline: true }
                )
                .setFooter({ text: `Case #${caseId} • Kicked by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
            await interaction.client.channels.cache.get(MOD_LOG_CHANNEL).send({ embeds: [embed] });
            
        } catch (error) {
            console.error('Kick error:', error);
            const embed = new EmbedBuilder()
                .setTitle('Kick Failed')
                .setColor('#ff0000')
                .setDescription('❌ Failed to kick the user.')
                .setTimestamp();

            return interaction.reply({
                embeds: [embed],
                ephemeral: true
            });
        }
    }
};