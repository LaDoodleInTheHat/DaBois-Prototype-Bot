const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getModLogs } = require('../utils/database');
require('dotenv').config();
const { ADMIN, MOD, BOT_DEV, HELPER, MOD_LOG_CHANNEL } = process.env;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('modlogs')
        .setDescription('View a user\'s moderation history')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to view moderation history for')
                .setRequired(true)),

    async execute(interaction) {
        const hasPerms = interaction.member.roles.cache.some(role => role.id === ADMIN) || interaction.member.roles.cache.some(role => role.id === MOD) || interaction.member.roles.cache.some(role => role.id === HELPER) || interaction.member.roles.cache.some(role => role.id === BOT_DEV);
        if(!hasPerms) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle('❌ Cannot View Moderation Logs')
                        .setDescription('You do not have permission to view moderation logs.')
                        .setColor('#ff5555')
                        .setTimestamp()
                ],
                ephemeral: true
            });
        }

        const user = interaction.options.getUser('user');
        const logs = getModLogs(user.id);

        const embed = new EmbedBuilder()
            .setTitle(`📄 Moderation Logs for ${user.tag}`)
            .setColor('#3498db')
            .setTimestamp()
            .setThumbnail(user.displayAvatarURL());

        if (!logs || logs.length === 0) {
            embed.setDescription('This user has no moderation history.');
        } else {
            for (let i = 0; i < logs.length && i < 15; i++) {
                const log = logs[i];
                embed.addFields({ name: '\u200B', value: '\u200B' }); // Add a blank space before each case
                embed.addFields({
                    name: `🧾 Case #${log.caseId} — ${log.type.toUpperCase()}`,
                    value: `**Reason:** ${log.reason}\n**Moderator:** <@${log.moderator}>\n**Date:** <t:${Math.floor(new Date(log.timestamp).getTime() / 1000)}:f>${log.durationMinutes ? `\n**Duration:** ${log.durationMinutes} min` : ''}`,
                    inline: false
                });
            }

            if (logs.length > 15) {
                embed.setFooter({ text: `Showing latest 15 of ${logs.length} cases.` });
            }
        }

        await interaction.reply({ embeds: [embed], ephemeral: true });

        await interaction.client.channels.cache.get(MOD_LOG_CHANNEL).send({ embeds: [embed] })
    }
};
