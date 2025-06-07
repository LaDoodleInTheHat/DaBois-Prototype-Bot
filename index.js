const fs = require('fs');
const path = require('path');
const { Client, Collection, GatewayIntentBits, EmbedBuilder} = require('discord.js');
const { setupDailyBirthdayCron } = require('./utils/birthdayAnnouncer');
const { loadDatabase, saveDatabase, logModeration } = require('./utils/database');
require('dotenv').config();
const { BREAD_ROLE } = process.env;

require('dotenv').config();

const { DISCORD_TOKEN, ANNOUNCEMENT_CHANNEL, MOD_LOG_CHANNEL } = process.env;

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildMembers,
    ]
});

client.commands = new Collection();

// Load commands from /commands
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));


console.log(`\n🔄 Loading ${commandFiles.length} commands...\n`);
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    
    if (!command || !command.data || !command.data.name) {
        console.warn(`⚠️ Skipping command in file for setting: ${file} .`);
        continue;
    }
    client.commands.set(command.data.name, command);
}

console.log('\n✅ Commands loaded!');

// When bot is ready
client.once('ready', () => {
    console.log(`\n✅ Logged in as ${client.user.tag}`);
    setupDailyBirthdayCron(client);
    client.user.setPresence({
        activities: [{ name: 'with slash commands' }],
        status: 0,
    });
});

// Handle slash commands
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        const embed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('❌ Error')
            .setDescription('❌ There was an error executing that command!\nAn error occurred while executing the command. Please try again later.');
            await interaction.reply({ embeds: [embed], ephemeral: true });
    }
});

client.on('presenceUpdate', async (oldPresence, newPresence) => {
    if (!newPresence || !newPresence.userId) return;

    const userId = newPresence.userId;
    const db = loadDatabase();

    const newStatus = newPresence.status;
    const oldStatus = oldPresence ? oldPresence.status : null;
    if (oldStatus === newStatus) return;

    if (!db[userId]?.pendingBirthday) return;

    const guild = client.guilds.cache.first(); // or use interaction.guild.id if needed
    const channel = guild.channels.cache.get(ANNOUNCEMENT_CHANNEL);
    const member = await guild.members.fetch(userId).catch(() => null);

    if (!channel || !member) return;
    
    if (db[userId]?.pendingBirthday && ['online', 'idle', 'dnd'].includes(newStatus)) {
        const guild = newPresence.guild;
        const channel = guild.channels.cache.get(ANNOUNCEMENT_CHANNEL);
        const member = await guild.members.fetch(userId).catch(() => null);
        if (!channel || !member) return;

        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('🎉 Birthday Announcement!')
            .setDescription(`Happy Birthday <@${userId}>!\n\nWe hope you have a fantastic day! 🎂\n\n@everyone, please wish <@${userId}> a very happy birthday!`)
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
            .setTimestamp()
            .setFooter({
                text: 'Happy Birthday from the server!',
                iconURL: member.user.displayAvatarURL({ dynamic: true }),
            });

        await channel.send({ content: '@everyone', embeds: [embed] });
        db[userId].pendingBirthday = false;
        saveDatabase(db);
        console.log(`🎉 Birthday announcement sent to ${member.user.username}`);
    }
});

client.on('messageCreate', async message => {
    if (message.author.bot) return
    if (message.member && message.member.roles.cache.has(BREAD_ROLE)) {
        if (!message.content.toLowerCase().includes('bread')) {
            try {
                const caseId = logModeration(message.author.id, {
                    type: 'mute',
                    reason : 'Did not include "bread" in the message',
                    duration: '1 minute',
                    moderator: 'Da Bois bot',
                    timestamp: new Date().toISOString()
                });

                const embed = new EmbedBuilder()
                    .setTitle('🔇 User Muted')
                    .addFields(
                        { name: 'User', value: `${message.author}`, inline: true },
                        { name: 'Duration', value: '1 minute', inline: true },
                        { name: 'Reason', value: `Didn't put "bread" in the sentence` }
                    )
                    .setThumbnail(message.author.displayAvatarURL())
                    .setColor('#bb8a23')
                    .setTimestamp()
                    .setFooter({ text: `Case #${caseId} • Muted by Da Bois bot`, iconURL: client.user.displayAvatarURL() });
                
                await message.member.timeout(10 * 1000, 'Did not include "bread" in the message');
                await message.reply({ embeds: [embed] });

                await message.client.channels.cache.get(MOD_LOG_CHANNEL).send({ embeds: [embed] });

            } catch (error) {
                console.error('❌ Failed to timeout user:', error);
                await message.reply('An error occurred while trying to timeout the user.');
            }
        }
    }

});


// shutdown (same as before)
const shutdown = async () => {
    console.log('\n🛑 Shutting down...');
    try {
        await client.destroy();
        console.log('👋 Client destroyed. Process exiting...');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error during shutdown:', err);
        process.exit(1);
    }
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

client.login(DISCORD_TOKEN).catch(err => {
    console.error('❌ Login failed:', err);
    process.exit(1);
});
