const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
require('dotenv').config();
const { ADMIN, MOD, HELPER, BOT_DEV, MOD_LOG_CHANNEL } = process.env;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unlockdown')
        .setDescription('Removes timeout from all non-admin members affected by /lockdown'),

    async execute(interaction) {
        // Permission check
        if (!interaction.member.roles.cache.some(role => role.id === ADMIN)) {
            const embed = new EmbedBuilder()
                .setTitle('❌ Permission Denied')
                .setDescription('You do not have permission to use this command.')
                .setColor('#FF0000')
                .setTimestamp();

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        await interaction.deferReply();

        const guild = interaction.guild;
        const members = await guild.members.fetch();

        const unmuted = [];

        for (const member of members.values()) {
            const isAdmin = member.roles.cache.some(role => role.id === ADMIN) || member.roles.cache.some(role => role.id === MOD) || member.roles.cache.some(role => role.id === HELPER) || member.roles.cache.some(role => role.id === BOT_DEV);
            const isTimedOut = member.communicationDisabledUntilTimestamp > Date.now();

            if (!isAdmin && isTimedOut) {
                try {
                    await member.timeout(null); // Removes timeout
                    unmuted.push(member.user.tag);
                } catch (err) {
                    console.warn(`Failed to untimeout ${member.user.tag}:`, err.message);
                }
            }
        }

        const embed = new EmbedBuilder()
            .setTitle('🔓 Unlockdown Complete')
            .setDescription(`Removed timeout from ${unmuted.length} member(s).`)
            .setColor('#00FF99')
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });

        embed.setFooter({ 
            text: `Requested by ${interaction.user.tag}`,
            iconURL: interaction.user.displayAvatarURL({ dynamic: true })
        }).setTimestamp();

        await interaction.client.channels.cache.get(MOD_LOG_CHANNEL).send({ embeds: [embed] });
    }
};
