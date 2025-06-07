const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
require('dotenv').config();
const { MOD_LOG_CHANNEL } = process.env;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('flip')
        .setDescription('Flips a coin'),

    async execute(interaction) {
        const result = Math.random() < 0.5 ? 'Heads' : 'Tails';

        const embed = new EmbedBuilder()
            .setTitle('🪙 Coin Flip')
            .setDescription(`The coin landed on **${result}**!`)
            .setColor('#FFD700')
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });

        embed.setFooter({ 
            text: `Requested by ${interaction.user.tag}`,
            iconURL: interaction.user.displayAvatarURL({ dynamic: true })
        }).setTimestamp();

        await interaction.client.channels.cache.get(MOD_LOG_CHANNEL).send({ embeds: [embed] });
    }
};
