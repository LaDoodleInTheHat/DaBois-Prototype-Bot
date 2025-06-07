const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { logModeration } = require('../utils/database');
require('dotenv').config();
const { ADMIN, MOD, BOT_DEV, HELPER, MOD_LOG_CHANNEL } = process.env;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unmute')
        .setDescription('Remove a mute (timeout) from a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to unmute')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for unmuting the user')
                .setRequired(true)),

    async execute(interaction) {
        const targetUser = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason');
        const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

        const hasPerms = interaction.member.roles.cache.some(role => role.id === ADMIN) || interaction.member.roles.cache.some(role => role.id === MOD) || interaction.member.roles.cache.some(role => role.id === HELPER) || interaction.member.roles.cache.some(role => role.id === BOT_DEV);

        const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
        const targetRoles = targetMember.roles.cache.map(role => role.id);
        
        if (interaction.member.roles.cache.some(role => role.id === HELPER)) {
            if (targetRoles.includes(MOD) || targetRoles.includes(ADMIN) || targetRoles.includes(BOT_DEV)) {
            const embed = new EmbedBuilder()
                .setTitle('❌ Insufficient Permissions')
                .setDescription('As a HELPER, you cannot unmute MODs, ADMINs, or BOT-DEVs.')
                .setColor('#ff5555')
                .setTimestamp();
            return interaction.reply({ embeds: [embed], ephemeral: true });
            }
        }

        if (interaction.member.roles.cache.some(role => role.id === BOT_DEV)) {
            if (targetRoles.includes(MOD) || targetRoles.includes(ADMIN)) {
            const embed = new EmbedBuilder()
                .setTitle('❌ Insufficient Permissions')
                .setDescription('As a BOT-DEV, you cannot unmute MODs or ADMINs.')
                .setColor('#ff5555')
                .setTimestamp();
            return interaction.reply({ embeds: [embed], ephemeral: true });
            }
        }

        if (interaction.member.roles.cache.some(role => role.id === MOD)) {
            if (targetRoles.includes(ADMIN)) {
            const embed = new EmbedBuilder()
                .setTitle('❌ Insufficient Permissions')
                .setDescription('As a MOD, you cannot unmute ADMINs.')
                .setColor('#ff5555')
                .setTimestamp();
            return interaction.reply({ embeds: [embed], ephemeral: true });
            }
        }

        if (!member) {
            const embed = new EmbedBuilder()
                .setTitle('❌ Member Not Found')
                .setDescription('Could not find that member in this server.')
                .setColor('#ff5555')
                .setTimestamp();
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        if (!member.communicationDisabledUntilTimestamp) {
            const embed = new EmbedBuilder()
                .setTitle('❌ Not Muted')
                .setDescription('This user is not currently muted.')
                .setColor('#ff5555')
                .setTimestamp();
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        if (targetUser.id === interaction.user.id) {
            const embed = new EmbedBuilder()
                .setTitle('❌ Action Not Allowed')
                .setDescription('You cannot unmute yourself.')
                .setColor('#ff5555')
                .setTimestamp();
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        if( !hasPerms) {
            const embed = new EmbedBuilder()
                .setTitle('❌ Cannot Unmute Member')
                .setDescription('You do not have permission to unmute this member.')
                .setColor('#ff5555')
                .setTimestamp();
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        try {
            await member.timeout(null, reason);

            const caseId = logModeration(targetUser.id, {
                type: 'unmute',
                reason: reason,
                moderator: interaction.user.id,
                timestamp: new Date().toISOString()
            });

            const embed = new EmbedBuilder()
                .setTitle('🔊 User Unmuted')
                .addFields(
                    { name: 'User', value: `${targetUser.tag}`, inline: true },
                    { name: 'Reason', value: reason }
                )
                .setThumbnail(targetUser.displayAvatarURL())
                .setColor('#00FF7F')
                .setTimestamp()
                .setFooter({ text: `Case #${caseId} • Unmuted by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });

            await interaction.reply({ embeds: [embed] });

        } catch (err) {
            console.error('Unmute error:', err);
            const embed = new EmbedBuilder()
                .setTitle('❌ Unmute Failed')
                .setDescription('Failed to unmute the user. Do I have the proper permissions?')
                .setColor('#ff5555')
                .setTimestamp();

            await interaction.reply({ embeds: [embed], ephemeral: true });
            await interaction.client.channels.cache.get(MOD_LOG_CHANNEL).send({ embeds: [embed] });
        }
    }
};
