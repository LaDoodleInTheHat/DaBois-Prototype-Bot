const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
require('dotenv').config();
const { MOD_LOG_CHANNEL } = process.env;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remindme')
        .setDescription('Set a reminder that will DM you after a specified time.')
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the reminder')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('hours')
                .setDescription('Time in hours after which you want to be reminded')
                .setRequired(false)
                .setMinValue(0))
        .addIntegerOption(option =>
            option.setName('minutes')
                .setDescription('Time in minutes after which you want to be reminded')
                .setRequired(false)
                .setMinValue(0)
                .setMaxValue(59))
        .addIntegerOption(option =>
            option.setName('seconds')
                .setDescription('Time in seconds after which you want to be reminded')
                .setRequired(false)
                .setMinValue(0)
                .setMaxValue(59)),
        
    async execute(interaction) {
        const totalDuration = interaction.options.getInteger('hours') * 3600 + interaction.options.getInteger('minutes') * 60 + interaction.options.getInteger('seconds');
        if (interaction.options.getInteger('hours') === null && interaction.options.getInteger('minutes') === null && interaction.options.getInteger('seconds') === null) {
            const embed = new EmbedBuilder()
                .setTitle('❌ Invalid Duration')
                .setDescription('You must specify at least one duration (hours, minutes, or seconds).')
                .setColor('#ff5555')
                .setTimestamp();
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const reason = interaction.options.getString('reason');
        const string = `**${interaction.options.getInteger('hours') || 0}h** **${interaction.options.getInteger('minutes') || 0}m** **${interaction.options.getInteger('seconds') || 0}s**`

        const confirmEmbed = new EmbedBuilder()
            .setTitle('⏰ Reminder Set')
            .setDescription(`I'll remind you in ${string} about: **${reason}**`)
            .setColor('#00BFFF')
            .setTimestamp();

        await interaction.reply({ embeds: [confirmEmbed], ephemeral: true });

        confirmEmbed.setFooter({ 
            text: `Requested by ${interaction.user.tag}`,
            iconURL: interaction.user.displayAvatarURL({ dynamic: true })
        }).setTimestamp();

        await interaction.client.channels.cache.get(MOD_LOG_CHANNEL).send({ embeds: [confirmEmbed] });

        // Schedule the reminder
        setTimeout(async () => {
            try {
                const embed = new EmbedBuilder()
                    .setTitle(`🔔 Reminder`)
                    .setDescription(`You asked to be reminded about: ${reason}, ${string} ago.`)
                    .setColor('#FFD700')
                    .setTimestamp()
                await interaction.user.send({ embeds: [embed] });

            } catch (err) {
                console.error('Failed to send DM:', err);
            }
        }, totalDuration * 1000); // convert minutes to milliseconds
    }
};
