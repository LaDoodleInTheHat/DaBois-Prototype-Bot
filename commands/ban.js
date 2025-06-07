const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const { logModeration } = require('../utils/database');
require('dotenv').config();
const { ADMIN, MOD_LOG_CHANNEL } = process.env

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Permanently ban a user from the server')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to ban')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('The reason for the ban')
                .setRequired(true)),

    async execute(interaction) {
        const targetUser = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason');

        const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
        const hasPerms = interaction.member.roles.cache.some(role => role.id === ADMIN);
        if (!member) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle('❌ Member Not Found')
                        .setDescription('That user is not in the server.')
                        .setColor('#ff5555')
                        .setTimestamp()
                ],
                ephemeral: true
            });
        }

        if (targetUser.id === interaction.user.id) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle('❌ Action Not Allowed')
                        .setDescription('You cannot ban yourself.')
                        .setColor('#ff5555')
                        .setTimestamp()
                ],
                ephemeral: true
            });
        }

        if (!hasPerms) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle('❌ Cannot Ban Member')   
                        .setDescription('You cannot ban this member. You need higher permissions.')
                        .setColor('#ff5555')
                        .setTimestamp()
                ],
                ephemeral: true
            });
        }        

        try {
            await member.ban({ reason });

            const caseId = logModeration(targetUser.id, {
                type: 'ban',
                reason: reason,
                moderator: interaction.user.id,
                timestamp: new Date().toISOString()
            });

            const embed = new EmbedBuilder()
                .setTitle('User Banned')
                .addFields(
                    { name: 'User', value: `${targetUser.tag}`, inline: true },
                    { name: 'Reason', value: reason }
                )
                .setThumbnail(targetUser.displayAvatarURL())
                .setColor('#ff4444')
                .setTimestamp()
                .setFooter({ text: `Case #${caseId} • Banned by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });

            await interaction.reply({ embeds: [embed] });
            await interaction.client.channels.cache.get(MOD_LOG_CHANNEL).send({ embeds: [embed] });

        } catch (err) {
            console.error('Ban error:', err);
            await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle('❌ Ban Failed')
                        .setDescription('Failed to ban the user. Do I have the proper permissions?')
                        .setColor('#ff5555')
                        .setTimestamp()
                ],
                ephemeral: true
            });
        }
    }
};
