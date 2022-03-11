//bettimw
require('dotenv').config();
var p = '/'; //prefix

const endec = require(process.env.cm);
const {Client, RichEmbed, Intents} = require('discord.js');

const client = new Client({
	intents: ["GUILDS", "GUILD_MESSAGES"]
});

client.once('ready', () => {
	data_boot = new Date();
	console.log(`Logged in as ${client.user.id} at ${data_boot}.\n`+
		    `prefix: ${p}\n`
	);
});

client.on('messageCreate', () => {
	console.log("ciao");
});

client.on('interactionCreate', async interaction => {
	if (!interaction.isCommand()) return;
	console.log(interaction);
	await interaction.reply(interaction.options.getString('value'));
});

tok = endec.decode(process.env.tok);
client.login(tok);
