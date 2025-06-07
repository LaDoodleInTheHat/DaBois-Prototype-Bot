const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
require('dotenv').config();
const { ADMIN, MOD, BOT_DEV, HELPER, MOD_LOG_CHANNEL } = process.env;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lockdown')
        .setDescription('Locks down the server by timing out all non-admin members.')
        .addStringOption(option => option.setName('reason')
            .setDescription('Reason for the lockdown')
            .setRequired(true))
        .addIntegerOption(option => option.setName('hours')
            .setDescription('Duration in hours')
            .setMinValue(0)
            .setRequired(false))
        .addIntegerOption(option => option.setName('minutes')
            .setDescription('Duration in minutes')
            .setMinValue(0)
            .setMaxValue(59)
            .setRequired(false))
        .addIntegerOption(option => option.setName('seconds')
            .setDescription('Duration in seconds')
            .setMinValue(0)
            .setMaxValue(59)
            .setRequired(false)),   

    async execute(interaction) {
        const guild = interaction.guild;
        const member = interaction.member;
        const hasPerms = member.roles.cache.some(role => role.id === ADMIN) || member.roles.cache.some(role => role.id === MOD) || member.roles.cache.some(role => role.id === HELPER) || member.roles.cache.some(role => role.id === BOT_DEV);
        const adminRole = guild.roles.cache.find(role => role.id === ADMIN);
        // Permission check
        if (!adminRole) {
            const embed = new EmbedBuilder()
                .setTitle('❌ Insufficient Permissions')
                .setDescription('You do not have permission to use this command.')
                .setColor('#ff5555')
                .setTimestamp();
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        if (interaction.options.getInteger('hours') === null && interaction.options.getInteger('minutes') === null && interaction.options.getInteger('seconds') === null) {
            const embed = new EmbedBuilder()
                .setTitle('❌ Invalid Duration')
                .setDescription('You must specify at least one duration (hours, minutes, or seconds).')
                .setColor('#ff5555')
                .setTimestamp();

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const members = await guild.members.fetch();
        const totalDuration = interaction.options.getInteger('hours') * 3600 + interaction.options.getInteger('minutes') * 60 + interaction.options.getInteger('seconds');
        const timeoutMs =  totalDuration * 1000;
        let affected = 0;

        for (const [id, m] of members) {
            if (
                m.user.bot ||
                hasPerms
            ) continue;

            if (m.communicationDisabledUntilTimestamp && m.communicationDisabledUntilTimestamp > Date.now()) continue;

            try {
                await m.timeout(timeoutMs, 'Server lockdown');
                affected++;
            } catch (err) {
                console.warn(`⚠️ Could not timeout ${m.user.tag}:`, err.message);
            }
        }

        const embed = new EmbedBuilder()
            .setTitle('🔒 Server Lockdown Activated')
            .setDescription(`Applied ${interaction.options.getInteger('hours')}h ${interaction.options.getInteger('minutes')}m ${interaction.options.getInteger('seconds')}s timeout to **${affected}** members.`)
            .addFields([{ name: 'Reason', value: interaction.options.getString('reason'), inline: true }])
            .setColor('#ff0000')
            .setTimestamp()
            .setFooter({ text: `Initiated by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });

        await interaction.reply({ embeds: [embed] });

        await interaction.guild.channels.cache.get(MOD_LOG_CHANNEL).send({embeds: [embed] })
    }
};
