const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
require('dotenv').config();
const { ADMIN, MOD_LOG_CHANNEL } = process.env;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('purge')
        .setDescription('Deletes messages before or after a given message ID')
        .addStringOption(option =>
            option.setName('after')
                .setDescription('Delete messages after this message ID')
        )
        .addStringOption(option =>
            option.setName('before')
                .setDescription('Delete messages before this message ID')
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    async execute(interaction) {
        const afterId = interaction.options.getString('after');
        const beforeId = interaction.options.getString('before');
        const hasPerms = interaction.member.roles.cache.some(role => role.id === ADMIN);

        if (!hasPerms) {
            const embed = new EmbedBuilder()
                .setTitle('❌ Permission Denied')
                .setDescription('You do not have permission to use this command.')
                .setColor('#FF0000')
                .setTimestamp();

            return interaction.reply({
                embeds: [embed],
                ephemeral: true
            });
        }

        if ((!afterId && !beforeId) || (afterId && beforeId)) {
            const embed = new EmbedBuilder()
                .setTitle('❌ Invalid Input')
                .setDescription('You must provide either `after` or `before` message ID, but not both.')
                .setColor('#FF0000')
                .setTimestamp();

            return interaction.reply({
                embeds: [embed],
                ephemeral: true
            });
        }

        await interaction.deferReply({ ephemeral: true });

        const channel = interaction.channel;

        try {
            const messages = await channel.messages.fetch({ limit: 100 });
            let toDelete;

            if (afterId) {
                toDelete = messages.filter(msg => msg.id > afterId);
            } else {
                toDelete = messages.filter(msg => msg.id < beforeId);
            }

            const deletable = toDelete.filter(msg => !msg.pinned && (Date.now() - msg.createdTimestamp) < 14 * 24 * 60 * 60 * 1000);

            await channel.bulkDelete(deletable, true);

            const embed = new EmbedBuilder()
                .setTitle('🧹 Purge Complete')
                .setDescription(`Deleted **${deletable.size}** messages ${afterId ? 'after' : 'before'} the given message.`)
                .setColor('#FF9900')
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
            embed.setFooter({ 
                text: `Requested by ${interaction.user.tag}`,
                iconURL: interaction.user.displayAvatarURL({ dynamic: true })
            });

            await interaction.client.channels.cache.get(MOD_LOG_CHANNEL).send({ embeds: [embed] });
            
        } catch (err) {
            console.error('Purge error:', err);
            const errorEmbed = new EmbedBuilder()
                .setTitle('❌ Purge Failed')
                .setDescription('Failed to purge messages. Are you sure the message ID is correct and the messages are not older than 14 days?')
                .setColor('#FF0000')
                .setTimestamp();

            await interaction.editReply({ embeds: [errorEmbed] });
        }
    }
};
