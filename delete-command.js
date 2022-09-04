require('dotenv').config();
const endec = require(process.env.cm);
/* should use:
import 'dotenv/config' // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
import express from 'express'
*/
const { SlashCommandBuilder } = require('@discordjs/builders');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { cId, gId, tok } = process.env;
const fs = require('node:fs');
t = endec.decode(tok);
console.log(cId,gId,t);


const commands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

// Place your client and guild ids here

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	console.log(require(`./commands/${file}`));
	commands.push(command.data.toJSON());
}

const rest = new REST({ version: '9' }).setToken(t);

// for guild-based commands
//rest.delete(Routes.applicationGuildCommand(cId, gId, 'commandId'))
//	.then(() => console.log('Successfully deleted guild command'))
//	.catch(console.error);

// for global commands
rest.delete(Routes.applicationCommand(cId, '1015997360976973924')) //command id, see https://discordjs.guide/creating-your-bot/deleting-commands.html#deleting-specific-commands
	.then(() => console.log('Successfully deleted application command'))
	.catch(console.error);
