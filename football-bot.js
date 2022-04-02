//bettimw
require('dotenv').config();
var p = '/'; //prefix

const endec = require(process.env.cm);
const {Client, RichEmbed, Intents} = require('discord.js');
var axios = require("axios").default;



const client = new Client({
	intents: ["GUILDS", "GUILD_MESSAGES"]
});

async function ask_elena(endpoint) {
	options = {
		method: 'GET',
		url: 'https://elenasport-io1.p.rapidapi.com'+endpoint,
		headers: {
			'X-RapidAPI-Host': 'elenasport-io1.p.rapidapi.com',
			'X-RapidAPI-Key': endec.decode(process.env.es_api_key)
		}
	};

	return await axios.request(options)
}

client.once('ready', async () => {
try{
	data_boot = new Date();
	console.log(`Logged in as ${client.user.id} at ${data_boot}.\n`+
		    `prefix: ${p}`
	);
	//aa//resp = await ask_elena('/v2/seasons/4270/fixtures?idTeam1=862&idTeam2=865');
	//console.log(resp.data);

	//aa//a = (await ask_elena('/v2/teams/'+resp.data.data[0].idHome))
	//aa//b = (await ask_elena('/v2/teams/'+resp.data.data[0].idAway))
	resp = { "data": {
	  "data": [
	    {
	      "id": 216852,
	      "idCountry": 45,
	      "countryName": "Italy",
	      "idLeague": 318,
	      "leagueName": "Serie A",
	      "idSeason": 4270,
	      "seasonName": "Serie A - 2021/2022",
	      "idHome": 865,
	      "homeName": "Atalanta",
	      "idAway": 862,
	      "awayName": "Bologna",
	      "idStage": 4184,
	      "idVenue": null,
	      "venueName": null,
	      "date": "2021-08-28 16:30:00",
	      "status": "finished",
	      "round": 2,
	      "attendance": null,
	      "team_home_90min_goals": 0,
	      "team_away_90min_goals": 0,
	      "team_home_ET_goals": 0,
	      "team_away_ET_goals": 0,
	      "team_home_PEN_goals": 0,
	      "team_away_PEN_goals": 0,
	      "team_home_1stHalf_goals": 0,
	      "team_away_1stHalf_goals": 0,
	      "team_home_2ndHalf_goals": 0,
	      "team_away_2ndHalf_goals": 0,
	      "elapsed": 0,
	      "elapsedPlus": 0,
	      "eventsHash": "015ea6874d4e1d4760d5871fb64d6947ac7f1ed7",
	      "lineupsHash": "6d64f65880b5e4735caa77b08a78219530d05d77",
	      "statsHash": "16a34a180ef76f3374a501caa2b7d2fee6114b64",
	      "referees": [
		{
		  "type": "referee",
		  "idReferee": 11861,
		  "refereeName": "D. Orsato"
		},
		{
		  "type": "assitant referee",
		  "idReferee": 15953,
		  "refereeName": "V. Vecchi"
		},
		{
		  "type": "assitant referee",
		  "idReferee": 12506,
		  "refereeName": "D. Margani"
		},
		{
		  "type": "assitant referee",
		  "idReferee": 131408,
		  "refereeName": "A. Santoro"
		}
	      ]
	    },
	    {
	      "id": 217132,
	      "idCountry": 45,
	      "countryName": "Italy",
	      "idLeague": 318,
	      "leagueName": "Serie A",
	      "idSeason": 4270,
	      "seasonName": "Serie A - 2021/2022",
	      "idHome": 862,
	      "homeName": "Bologna",
	      "idAway": 865,
	      "awayName": "Atalanta",
	      "idStage": 4184,
	      "idVenue": null,
	      "venueName": null,
	      "date": "2022-03-20 19:45:00",
	      "status": "finished",
	      "round": 30,
	      "attendance": null,
	      "team_home_90min_goals": 0,
	      "team_away_90min_goals": 1,
	      "team_home_ET_goals": 0,
	      "team_away_ET_goals": 0,
	      "team_home_PEN_goals": 0,
	      "team_away_PEN_goals": 0,
	      "team_home_1stHalf_goals": 0,
	      "team_away_1stHalf_goals": 0,
	      "team_home_2ndHalf_goals": 0,
	      "team_away_2ndHalf_goals": 1,
	      "elapsed": 0,
	      "elapsedPlus": 0,
	      "eventsHash": "da74a69c70cae017c350f1a4c427b46cd622a3a8",
	      "lineupsHash": "cdc8cd82b532560f0e7e8b2b0b2032541241fd97",
	      "statsHash": "dcb78af26f996bb0aa5209d4492ef9d7ff047966",
	      "referees": null
	    }
	  ],
	  "pagination": {
	    "page": 1,
	    "itemsPerPage": 25,
	    "hasNextPage": false,
	    "hasPrevPage": false
	  }
	}
}
	a = { "data": {
  "data": [
    {
      "id": 865,
      "name": "Atalanta",
      "fullName": "Atalanta Bergamasca Calcio",
      "country": "Italy",
      "founded": "1907",
      "officialPage": "http://www.atalanta.it",
      "phone": "+39 (035) 418 6222",
      "email": "info@atalanta.it",
      "address": "Corso Europa 46, Zingonia24040Ciserano",
      "badgeURL": "https://cdn.elenasport.io/badges/150x150/865"
    }
  ]
}}
b = { "data": {
  "data": [
    {
      "id": 862,
      "name": "Bologna",
      "fullName": "Bologna FC 1909",
      "country": "Italy",
      "founded": "1909",
      "officialPage": "http://www.bolognafc.it",
      "phone": "+39 (051) 611 1111",
      "email": "comunicazione@bolognafc.it",
      "address": "Via Casteldebole 1040132Bologna",
      "badgeURL": "https://cdn.elenasport.io/badges/150x150/862"
    }
  ]
}}
	console.log("a:",a.data.data[0].badgeURL)
	console.log("b:",b.data.data[0].badgeURL)
	msg = {
		embeds: [
			{
				"title": resp.data.data[0].leagueName,
				"description": `Il **<t:${new Date(resp.data.data[0].date).getTime() / 1000}>** giocheranno **${resp.data.data[0].homeName} (in casa)** contro **${resp.data.data[0].awayName} (in trasferta)**`,
				"url": "https://elenasport-io1.p.rapidapi.com",
				"color": 9532993,
				"timestamp": new Date(),
				"image": {
					"url": a.data.data[0].badgeURL,
				},
				"fields": [
					{
						"name": "per scommettere usa (il messaggio non verrà visto dagli altri utenti):",
						"value": "`/bet`, con `id`:`"+resp.data.data[0].id+"`"
					},
					{
						"name": "per vedere il tuo bilancio attuale usa:",
						"value": "`/money`"
					}
				]
			},
			{
				"url": "https://elenasport-io1.p.rapidapi.com",
				"image": {
					"url": b.data.data[0].badgeURL,
				},
			}
		]
	}
	console.log(msg);

	//(await client.channels.fetch('958777715610247209')).send("ciao");
	(await client.channels.fetch('481512731569160224')).send(msg);
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

//https://support.discord.com/hc/en-us/community/posts/1500000729481/comments/1500000693961
//https://support.discord.com/hc/en-us/community/posts/1500000729481/comments/1500000688302
