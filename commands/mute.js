const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { logModeration } = require('../utils/database');
require('dotenv').config();
const { ADMIN, MOD, BOT_DEV, HELPER, MOD_LOG_CHANNEL } = process.env;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mute')
        .setDescription('Temporarily mute (timeout) a user for a specified duration.')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to mute')
                .setRequired(true)).addStringOption(option =>
                    option.setName('reason')
                        .setDescription('Reason for muting the user')
                        .setRequired(true))
        
        .addIntegerOption(option =>
            option.setName('hours')
                .setDescription('The duration in hours')
                .setMinValue(0)
                .setMaxValue(24)
                .setRequired(false))
        .addIntegerOption(option =>
            option.setName('minutes')
                .setDescription('The duration in minutes')
                .setMinValue(0)
                .setMaxValue(59)
                .setRequired(false))
        .addIntegerOption(option =>
            option.setName('seconds')
                .setDescription('The duration in seconds')
                .setMinValue(0)
                .setMaxValue(59)
                .setRequired(false)),        

    async execute(interaction) {
        // Permission check

        const targetUser = interaction.options.getUser('user');
        const totalDuration = interaction.options.getInteger('hours') * 3600 + interaction.options.getInteger('minutes') * 60 + interaction.options.getInteger('seconds');
        const reason = interaction.options.getString('reason');
        const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
        const hasPerms = interaction.member.roles.cache.some(role => role.id === ADMIN) || interaction.member.roles.cache.some(role => role.id === MOD) || interaction.member.roles.cache.some(role => role.id === HELPER) || interaction.member.roles.cache.some(role => role.id === BOT_DEV);
        const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
        const targetRoles = targetMember.roles.cache.map(role => role.id);

        if (interaction.options.getInteger('hours') === null && interaction.options.getInteger('minutes') === null && interaction.options.getInteger('seconds') === null) {
            const embed = new EmbedBuilder()
                .setTitle('❌ Invalid Duration')
                .setDescription('You must specify at least one duration (hours, minutes, or seconds).')
                .setColor('#ff5555')
                .setTimestamp();
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        if (interaction.member.roles.cache.some(role => role.id === HELPER)) {
            if (targetRoles.includes(MOD) || targetRoles.includes(ADMIN) || targetRoles.includes(BOT_DEV)) {
            const embed = new EmbedBuilder()
                .setTitle('❌ Insufficient Permissions')
                .setDescription('As a HELPER, you cannot mute MODs, ADMINs, or BOT-DEVs.')
                .setColor('#ff5555')
                .setTimestamp();
            return interaction.reply({ embeds: [embed], ephemeral: true });
            }
        }

        if (interaction.member.roles.cache.some(role => role.id === BOT_DEV)) {
            if (targetRoles.includes(MOD) || targetRoles.includes(ADMIN)) {
            const embed = new EmbedBuilder()
                .setTitle('❌ Insufficient Permissions')
                .setDescription('As a BOT-DEV, you cannot mute MODs or ADMINs.')
                .setColor('#ff5555')
                .setTimestamp();
            return interaction.reply({ embeds: [embed], ephemeral: true });
            }
        }

        if (interaction.member.roles.cache.some(role => role.id === MOD)) {
            if (targetRoles.includes(ADMIN)) {
            const embed = new EmbedBuilder()
                .setTitle('❌ Insufficient Permissions')
                .setDescription('As a MOD, you cannot mute ADMINs.')
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

        if (targetUser.id === interaction.user.id) {
            const embed = new EmbedBuilder()
                .setTitle('❌ Action Not Allowed')
                .setDescription('You cannot mute yourself.')
                .setColor('#ff5555')
                .setTimestamp();
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        if (!hasPerms) {
            const embed = new EmbedBuilder()
                .setTitle('❌ Insufficient Permissions')
                .setDescription('You do not have permission to mute this member.')
                .setColor('#ff5555')
                .setTimestamp();
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const msDuration = totalDuration * 1000;

        try {
            await member.timeout(msDuration, reason);
            const string = `**${interaction.options.getInteger('hours') || 0}h** **${interaction.options.getInteger('minutes') || 0}m** **${interaction.options.getInteger('seconds') || 0}s**`

            const caseId = logModeration(targetUser.id, {
                type: 'mute',
                reason: reason,
                duration: string,
                moderator: interaction.user.id,
                timestamp: new Date().toISOString()
            });

            const embed = new EmbedBuilder()
                .setTitle('🔇 User Muted')
                .addFields(
                    { name: 'User', value: `${targetUser.tag}`, inline: true },
                    { name: 'Duration', value: string, inline: true },
                    { name: 'Reason', value: reason }
                )
                .setThumbnail(targetUser.displayAvatarURL())
                .setColor('#808080')
                .setTimestamp()
                .setFooter({ text: `Case #${caseId} • Muted by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });

            await interaction.reply({ embeds: [embed] });
            await interaction.client.channels.cache.get(MOD_LOG_CHANNEL).send({ embeds: [embed] });

        } catch (err) {
            console.error('Mute error:', err);
            const embed = new EmbedBuilder()
                .setTitle('❌ Mute Failed')
                .setDescription('Failed to mute the user. Do I have the proper permissions?')
                .setDescription('Tip: Check the console for more details.')
                .setColor('#ff5555')
                .setTimestamp();
            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    }
};
