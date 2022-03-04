require('dotenv').config();
/* should use:
import 'dotenv/config' // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
import express from 'express'
*/
const { SlashCommandBuilder } = require('@discordjs/builders');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { cId, gId, tok } = process.env;
const fs = require('node:fs');
console.log(cId,gId,tok);

const commands = [
	new SlashCommandBuilder().setName('bet').setDescription('Scommetti con '),
	new SlashCommandBuilder().setName('conto').setDescription('Replies with server info!'),
]
	.map(command => command.toJSON());

//const rest = new REST({ version: '9' }).setToken(token);

//rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands })
//	.then(() => console.log('Successfully registered application commands.'))
//	.catch(console.error);

const commands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

// Place your client and guild ids here
const clientId = '123456789012345678';
const guildId = '876543210987654321';

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	commands.push(command.data.toJSON());
}

const rest = new REST({ version: '9' }).setToken(token);

(async () => {
	try {
		console.log('Started refreshing application (/) commands.');

		await rest.put(
			Routes.applicationGuildCommands(clientId, guildId),
			{ body: commands },
		);

		console.log('Successfully reloaded application (/) commands.');
	} catch (error) {
		console.error(error);
	}
})();
