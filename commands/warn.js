const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { logModeration, getModLogs } = require('../utils/database');
require('dotenv').config();
const { ADMIN, MOD, BOT_DEV, HELPER, MOD_LOG_CHANNEL } = process.env;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Warn a user for inappropriate behavior')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to warn')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for warning')
                .setRequired(true)),

    async execute(interaction) {
        const hasPerms = interaction.member.roles.cache.some(role => role.id === ADMIN) || interaction.member.roles.cache.some(role => role.id === MOD) || interaction.member.roles.cache.some(role => role.id === HELPER) || interaction.member.roles.cache.some(role => role.id === BOT_DEV);
        
        const targetUser = interaction.options.getUser('user');
        const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

        if (!targetMember) {
            const embed = new EmbedBuilder()
            .setTitle('❌ Member Not Found')
            .setDescription('Could not find that member in the server.')
            .setColor('#FF0000')
            .setTimestamp();
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const targetRoles = targetMember.roles.cache.map(role => role.id);

        const insufficientPermissionsEmbed = new EmbedBuilder()
            .setTitle('❌ Insufficient Permissions')
            .setColor('#ff5555')
            .setTimestamp();

        if (interaction.member.roles.cache.some(role => role.id === HELPER)) {
            if (targetRoles.includes(MOD) || targetRoles.includes(ADMIN) || targetRoles.includes(BOT_DEV)) {
            insufficientPermissionsEmbed.setDescription('As a HELPER, you cannot warn MODs, ADMINs, or BOT-DEVs.');
            return interaction.reply({ embeds: [insufficientPermissionsEmbed], ephemeral: true });
            }
        }

        if (interaction.member.roles.cache.some(role => role.id === BOT_DEV)) {
            if (targetRoles.includes(MOD) || targetRoles.includes(ADMIN)) {
            insufficientPermissionsEmbed.setDescription('As a BOT-DEV, you cannot warn MODs or ADMINs.');
            return interaction.reply({ embeds: [insufficientPermissionsEmbed], ephemeral: true });
            }
        }

        if (interaction.member.roles.cache.some(role => role.id === MOD)) {
            if (targetRoles.includes(ADMIN)) {
            insufficientPermissionsEmbed.setDescription('As a MOD, you cannot warn ADMINs.');
            return interaction.reply({ embeds: [insufficientPermissionsEmbed], ephemeral: true });
            }
        }

        if (!hasPerms) {
            const noPermsEmbed = new EmbedBuilder()
            .setTitle('❌ Insufficient Permissions')
            .setDescription('You do not have permission to use this command.')
            .setColor('#FF0000')
            .setTimestamp();

            return interaction.reply({ embeds: [noPermsEmbed], ephemeral: true });
        }

        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason');
        const member = await interaction.guild.members.fetch(user.id).catch(() => null);

        if (!member) {
            const noMemberEmbed = new EmbedBuilder()
            .setTitle('❌ Member Not Found')
            .setDescription('Could not find that member in the server.')
            .setColor('#FF0000')
            .setTimestamp();

            return interaction.reply({ embeds: [noMemberEmbed], ephemeral: true });
        }

        if (user.id === interaction.user.id) {
            const selfWarnEmbed = new EmbedBuilder()
            .setTitle('❌ Invalid Action')
            .setDescription('You cannot warn yourself.')
            .setColor('#FF0000')
            .setTimestamp();

            return interaction.reply({ embeds: [selfWarnEmbed], ephemeral: true });
        }
        // Log the warning
        const caseId = logModeration(user.id, {
            type: 'warn',
            reason,
            moderator: interaction.user.id,
            timestamp: new Date().toISOString()
        });

        // Count previous warnings
        const logs = getModLogs(user.id);
        const warnCount = logs.filter(log => log.type === 'warn').length;
        const warnCheck = warnCount % 3 === 0; // Check if it's a multiple of 3

        const embed = new EmbedBuilder()
            .setTitle('⚠️ User Warned')
            .setThumbnail(user.displayAvatarURL())
            .addFields(
                { name: 'User', value: `${user.tag}`, inline: true },
                { name: 'Reason', value: reason, inline: true },
                { name: 'Total Warnings', value: `${warnCount}`, inline: false }
            )
            .setColor('#FFA500')
            .setTimestamp()
            .setFooter({ text: `Case #${caseId} • Warned by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });

        await interaction.reply({ embeds: [embed] });

        await interaction.guild.channels.cache.get(MOD_LOG_CHANNEL).send({ embeds: [embed] });

        // Auto-mute after 3 warnings
        
        if (warnCheck) {
            const autoMuteDurationMs = 60 * 60 * 1000; // 1 hour
            const muteReason = 'Reached 3 warnings — automatic mute';
            
            try {
                await member.timeout(autoMuteDurationMs, muteReason);

                logModeration(user.id, {
                    type: 'mute',
                    reason: muteReason,
                    durationMinutes: 60,
                    moderator: 'auto',
                    timestamp: new Date().toISOString()
                });

                const muteEmbed = new EmbedBuilder()
                    .setTitle('🔇 Auto-Muted')
                    .setDescription(`${user.tag} has been automatically muted for 1 hour after 3 warnings.`)
                    .setColor('#808080')
                    .setTimestamp();

                await interaction.followUp({ embeds: [muteEmbed], ephemeral: false });
                await interaction.guild.channels.cache.get(MOD_LOG_CHANNEL).send({ embeds: [muteEmbed] });

                
            } catch (err) {
                console.error('Auto-mute failed:', err);
                const autoMuteFailEmbed = new EmbedBuilder()
                    .setTitle('⚠️ Auto-Mute Failed')
                    .setDescription('Failed to auto-mute the user after 3 warnings.')
                    .setColor('#FF0000')
                    .setTimestamp();

                await interaction.followUp({ embeds: [autoMuteFailEmbed], ephemeral: true });
            }
        }
    }
};
