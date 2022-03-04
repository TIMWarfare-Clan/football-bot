require('dotenv').config();
var p = '/'; //prefix

const endec = require(process.env.cm);
const {Client, RichEmbed, Intents} = require('discord.js');

const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

client.once('ready', () => {
	data_boot = new Date();
	console.log(`Logged in as ${client.user.id} at ${data_boot}.\n`+
		    `prefix: ${p}\n`
	);
});

tok = endec.decode(process.env.tok);
client.login(tok);
