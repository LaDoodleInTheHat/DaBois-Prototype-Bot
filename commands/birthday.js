const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { setBirthday, getBirthday } = require('../utils/database');
require('dotenv').config();
const { MOD_LOG_CHANNEL } = process.env;
const {  } = require('../utils/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('birthday')
        .setDescription('Set or view birthdays')
        .addSubcommand(sub =>
            sub.setName('set')
                .setDescription('Set your birthday')
                .addStringOption(opt =>
                    opt.setName('date')
                        .setDescription('Your birthday (format: MM-DD)')
                        .setRequired(true)
                ))
        .addSubcommand(sub =>
            sub.setName('view')
                .setDescription('View someone\'s birthday')
                .addUserOption(opt =>
                    opt.setName('user')
                        .setDescription('User to check')
                        .setRequired(true)
                )),

    async execute(interaction) {
        const sub = interaction.options.getSubcommand();



        if (sub === 'set') {
            const date = interaction.options.getString('date');
            const dateRegex = /^(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/;

            if (!dateRegex.test(date)) {
                const errorEmbed = new EmbedBuilder()
                    .setTitle('❌ Invalid Date Format')
                    .setDescription('Please use the format **MM-DD** (e.g., 05-12).')
                    .setColor('#FF0000')
                    .setTimestamp();

                return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }

            setBirthday(interaction.user.id, date);

            const embed = new EmbedBuilder()
                .setTitle('🎂 Birthday Set')
                .setDescription(`Your birthday has been saved as **${date}**.`)
                .setColor('#FFA500')
                .setTimestamp();

            await interaction.reply({ embeds: [embed], ephemeral: true });

            embed.setFooter({ 
                text: `Requested by ${interaction.user.tag}`,
                iconURL: interaction.user.displayAvatarURL({ dynamic: true })
            }).setTimestamp();

            await interaction.client.channels.cache.get(MOD_LOG_CHANNEL).send({ embeds: [embed] });
        }

        if (sub === 'view') {
            const user = interaction.options.getUser('user');
            const birthday = getBirthday(user.id);

            const embed = new EmbedBuilder()
                .setTitle(`🎉 ${user.username}'s Birthday`)
                .setColor('#00BFFF')
                .setTimestamp();

            if (birthday) {
                embed.setDescription(`${user} has their birthday set as **${birthday}**.`);
            } else {
                embed.setDescription(`${user} has not registered their birthday.`);
            }

            await interaction.reply({ embeds: [embed], ephemeral: true });

            embed.setFooter({ 
                text: `Requested by ${interaction.user.tag}`,
                iconURL: interaction.user.displayAvatarURL({ dynamic: true })
            }).setTimestamp();

            await interaction.client.channels.cache.get(MOD_LOG_CHANNEL).send({ embeds: [embed] });
        }
    }
};
