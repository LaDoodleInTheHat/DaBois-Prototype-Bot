require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');

const { DISCORD_TOKEN, CLIENT_ID, GUILD_ID } = process.env;

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

console.log(`\n🔄 Mapping ${commandFiles.length} commands...\n`);
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    if (command && command.data && typeof command.data.toJSON === 'function') {
        commands.push(command.data.toJSON());
    } else {
        console.warn(`⚠️ Skipping invalid command file for mapping: ${file}`);
    }
}
console.log('\n✅ Commands mapped!');

const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

(async () => {
    try {
        console.log(`\n🔄 Registering ${commands.length} slash commands...\n`);

        await rest.put(
            Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
            { body: commands }
        );

        console.log('✅ Slash commands registered!');
    } catch (error) {
        console.error('❌ Error registering commands:', error);
    }
})();
