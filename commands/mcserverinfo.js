const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
require('dotenv').config();
const { MOD_LOG_CHANNEL } = process.env;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mc_serverinfo')
        .setDescription('Displays information about the minecraft server'),

    async execute(interaction) {
        const guild = interaction.guild;

        const embed = new EmbedBuilder()
            .setTitle('MC Server Info')
            .setThumbnail(guild.iconURL({ dynamic: true }))
            .addFields(
                { name: 'Members', value: `${guild.memberCount}`, inline: false },
                { name: '🌐 Minecraft IP', value: '3.106.224.88', inline: false },
                { name: '📦 Modpack S6 (High-end)', value: '[Click to download](https://cdn.discordapp.com/attachments/1266640638464622714/1357835191514562742/Season_6_High_End.zip?ex=681bd611&is=681a8491&hm=14322262032857f670034d3fd3569d1a7bc04610e82f87a525ff0b52fc721f32&)', inline: false },
                { name: '📦 Modpack S6 (Lightweight)', value: '[Click to download](https://cdn.discordapp.com/attachments/1266640638464622714/1357835186552963113/Season_6_Lightweight.zip?ex=681bd60f&is=681a848f&hm=221c621399f6b5ac8196f054da6b6690245448238a8b19463a5fc54078182e5c&)', inline: false },
                { name: '📃 Modlist', value: '[Click to view]()'}
            )
            
            .setColor('#00BFFF')
            .setFooter({ text: guild.name, iconURL: guild.iconURL() })
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: false });
        
        embed.setFooter({ 
            text: `Requested by ${interaction.user.tag}`,
            iconURL: interaction.user.displayAvatarURL({ dynamic: true })
        }).setTimestamp();

        await interaction.client.channels.cache.get(MOD_LOG_CHANNEL).send({ embeds: [embed] });
    }
};
