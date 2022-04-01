//bettimw
require('dotenv').config();
var p = '/'; //prefix

const endec = require(process.env.cm);
const {Client, RichEmbed, Intents} = require('discord.js');
var axios = require("axios").default;



const client = new Client({
	intents: ["GUILDS", "GUILD_MESSAGES"]
});

client.once('ready', async () => {
	data_boot = new Date();
	console.log(`Logged in as ${client.user.id} at ${data_boot}.\n`+
		    `prefix: ${p}`
	);
	endpoint = '/v2/seasons/4270/fixtures?idTeam1=862&idTeam2=865'
//	endpoint = '/v2/countries/45/leagues'
	var options = {
	  method: 'GET',
	  url: 'https://elenasport-io1.p.rapidapi.com'+endpoint,
	  headers: {
	    'X-RapidAPI-Host': 'elenasport-io1.p.rapidapi.com',
	    'X-RapidAPI-Key': endec.decode(process.env.es_api_key)
	  }
	};

	try{
		resp = await axios.request(options)
		console.log(resp.data);
	}catch(e){console.log(e)}

});

client.on('messageCreate', () => {
	console.log("ciao");
});

client.on('interactionCreate', async interaction => {
	if (!interaction.isCommand()) return;
	console.log(interaction);
	//interaction.commandName === 'ping'
	await interaction.reply(interaction.options.getString('value'));
});

tok = endec.decode(process.env.tok);
client.login(tok);
