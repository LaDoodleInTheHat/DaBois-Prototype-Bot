const { SlashCommandBuilder } = require('discord.js');
const { runBirthdayCheck } = require('../utils/birthdayAnnouncer');
const { EmbedBuilder } = require('discord.js');
require('dotenv').config();
const { MOD_LOG_CHANNEL, ADMIN, MOD, BOT_DEV, HELPER } = process.env;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('birthdaycheck')
        .setDescription('Manually run the birthday checker'),

    async execute(interaction) {
        const hasPerms = interaction.member.roles.cache.some(role => role.id === ADMIN) || interaction.member.roles.cache.some(role => role.id === MOD) || interaction.member.roles.cache.some(role => role.id === BOT_DEV) || interaction.member.roles.cache.some(role => role.id === HELPER);

        if (!hasPerms) {
            const embed = new EmbedBuilder()
                .setTitle('❌ Permission Denied')
                .setDescription('You do not have permission to use this command.')
                .setColor('#ff5555')
                .setTimestamp();

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        await runBirthdayCheck(interaction.client);
        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('Birthday Check')
            .setDescription('✅ Birthday check ran successfully.');

        await interaction.reply({ embeds: [embed], ephemeral: true });

        embed.setFooter({ 
            text: `Requested by ${interaction.user.tag}`,
            iconURL: interaction.user.displayAvatarURL({ dynamic: true })
        }).setTimestamp();

        await interaction.client.channels.cache.get(MOD_LOG_CHANNEL).send({ embeds: [embed] });
    }
};
