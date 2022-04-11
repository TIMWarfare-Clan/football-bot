//bettimw
require('dotenv').config();
var p = '/'; //prefix

//custom modules
const endec = require(process.env.cm);
fn = endec.decode(process.env.fc);

//modules
const {Client, RichEmbed, Intents} = require('discord.js');
const jimp = require('jimp');
const fs = require('fs');
const admin = require('firebase-admin');
const firebase = require(fn);
var axios = require("axios").default;

//global variables
const currency_name = "Pippo";

const client = new Client({
	intents: ["GUILDS", "GUILD_MESSAGES"]
});
admin.initializeApp({
	credential: admin.credential.cert(firebase)
});
const db = admin.firestore();

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

	resp = { "data": { "data": [ { "id": 216852, "idCountry": 45, "countryName": "Italy", "idLeague": 318, "leagueName": "Serie A", "idSeason": 4270, "seasonName": "Serie A - 2021/2022", "idHome": 865, "homeName": "Atalanta", "idAway": 862, "awayName": "Bologna", "idStage": 4184, "idVenue": null, "venueName": null, "date": "2021-08-28 16:30:00", "status": "finished", "round": 2, "attendance": null, "team_home_90min_goals": 0, "team_away_90min_goals": 0, "team_home_ET_goals": 0, "team_away_ET_goals": 0, "team_home_PEN_goals": 0, "team_away_PEN_goals": 0, "team_home_1stHalf_goals": 0, "team_away_1stHalf_goals": 0, "team_home_2ndHalf_goals": 0, "team_away_2ndHalf_goals": 0, "elapsed": 0, "elapsedPlus": 0, "eventsHash": "015ea6874d4e1d4760d5871fb64d6947ac7f1ed7", "lineupsHash": "6d64f65880b5e4735caa77b08a78219530d05d77", "statsHash": "16a34a180ef76f3374a501caa2b7d2fee6114b64", "referees": [ { "type": "referee", "idReferee": 11861, "refereeName": "D. Orsato" }, { "type": "assitant referee", "idReferee": 15953, "refereeName": "V. Vecchi" }, { "type": "assitant referee", "idReferee": 12506, "refereeName": "D. Margani" }, { "type": "assitant referee", "idReferee": 131408, "refereeName": "A. Santoro" } ] }, { "id": 217132, "idCountry": 45, "countryName": "Italy", "idLeague": 318, "leagueName": "Serie A", "idSeason": 4270, "seasonName": "Serie A - 2021/2022", "idHome": 862, "homeName": "Bologna", "idAway": 865, "awayName": "Atalanta", "idStage": 4184, "idVenue": null, "venueName": null, "date": "2022-03-20 19:45:00", "status": "finished", "round": 30, "attendance": null, "team_home_90min_goals": 0, "team_away_90min_goals": 1, "team_home_ET_goals": 0, "team_away_ET_goals": 0, "team_home_PEN_goals": 0, "team_away_PEN_goals": 0, "team_home_1stHalf_goals": 0, "team_away_1stHalf_goals": 0, "team_home_2ndHalf_goals": 0, "team_away_2ndHalf_goals": 1, "elapsed": 0, "elapsedPlus": 0, "eventsHash": "da74a69c70cae017c350f1a4c427b46cd622a3a8", "lineupsHash": "cdc8cd82b532560f0e7e8b2b0b2032541241fd97", "statsHash": "dcb78af26f996bb0aa5209d4492ef9d7ff047966", "referees": null } ], "pagination": { "page": 1, "itemsPerPage": 25, "hasNextPage": false, "hasPrevPage": false } } }
	match = resp.data.data[0];
	img = await jimp.read('vs.jpg');
	img_home = await jimp.read("https://cdn.elenasport.io/badges/150x150/"+match.idHome);
	img_away = await jimp.read("https://cdn.elenasport.io/badges/150x150/"+match.idAway);
	img.composite(img_home, 10, 105); //0, 360/2 - 150/2
	img.composite(img_away, 480, 105);
	img.write(match.idHome+"vs"+match.idAway+".jpg");
	msg = {
		embeds: [
			{
				"title": match.leagueName,
				"description": `Il **<t:${new Date(resp.data.data[0].date).getTime() / 1000}>** giocheranno **${resp.data.data[0].homeName} (in casa)** contro **${resp.data.data[0].awayName} (in trasferta)**`,
				"url": "https://elenasport-io1.p.rapidapi.com",
				"color": 9532993,
				"timestamp": new Date(),
				"image": {
					"url": "attachment://vs.jpg",
				},
				"fields": [
					{
						"name": "per scommettere usa (il messaggio non verrà visto dagli altri utenti):",
						"value": "`/bet`, con `id`:`"+match.id+"`"
					},
					{
						"name": "per vedere il tuo bilancio attuale usa:",
						"value": "`/money`"
					}
				]
			}/*,
			{
				"url": "https://elenasport-io1.p.rapidapi.com",
				"image": {
					"url": "https://cdn.elenasport.io/badges/150x150/"+match.idAway,
					"height": 50,
					"width": 50
				},
			}*/
		],
		files: [
			{
				"attachment": match.idHome+"vs"+match.idAway+".jpg",
				"name": "vs.jpg"
			}
		]
	}
	console.log(msg);

	//(await client.channels.fetch('958777715610247209')).send("ciao");
	//(await client.channels.fetch('481512731569160224')).send(msg);
}catch(e){console.log(e)}
});

client.on('messageCreate', async (message) => {
	console.log("ciao");
	/*
	if(message.content == 's') { //code to retrieve the bet from the match id
		d = (await db.collection('users').doc(message.author.id).get()).data();
		b = d.bet_log.filter(e => e.id_partita == 5);
		console.log(b);
	}
	*/
});

client.on('interactionCreate', async interaction => {
	if (!interaction.isCommand()) return;
	console.log(interaction);
	if(interaction.commandName === 'bet') {
		bb = {
			"bet_value": interaction.options.getString('value'),
			"bet_amount": interaction.options.getInteger('bet'),
			"id_partita": interaction.options.getString('id'),
			"timestamp": new Date().toISOString()
		}
		interaction.reply({
			content: `Bet registrata:\n`+
				 `Scommessa: ${bb.value}\n`+
				 `${currency_name} scommessi: ${bb.bet_amount}\n`+
				 `ID partita: ${bb.id_partita}\n`+
				 `\nQuesti dati sono giusti? Rispondi`,
			ephemeral: true
		});

		//from https://stackoverflow.com/a/70728365/12206923 and https://stackoverflow.com/a/68405712/12206923
		const SECONDS_TO_REPLY = 120;
		const MESSAGES_TO_COLLECT = 100;
		const filter = (m) => m.author.id == interaction.user.id
		const collector = interaction.channel.createMessageCollector({filter, time: SECONDS_TO_REPLY * 1000, max: MESSAGES_TO_COLLECT})
		collector.on('collect', confirm_message => {
			if(confirm_message.author.id == interaction.user.id && confirm_message.content == 'giusto') {
				confirm_message.delete().then(msg => {console.log(`Deleted confirm_message from ${msg.author.username} (id:${msg.author.id}) at ${new Date()}`)}).catch(console.error);
				db.collection('users').doc(interaction.user.id).update({
					bet_log: admin.firestore.FieldValue.arrayUnion(bb)
				});
				interaction.followUp({content: "Confermato", ephemeral: true});
			}
		});
		collector.on('end', (collected, reason) => {
				// only send a message when the "end" event fires because of timeout
				console.log("bet cancelled (reason:"+reason+"):");
				console.log(bb);
		});
	}
	if(interaction.commandName === 'money') {
		d = (await db.collection('users').doc(interaction.user.id).get()).data();
		if(d != undefined) {
			rep = d.money;
			await interaction.reply(""+rep);
		}else
			await interaction.reply("Non hai ancora soldi.");
	}
});

tok = endec.decode(process.env.tok);
client.login(tok);

//https://support.discord.com/hc/en-us/community/posts/1500000729481/comments/1500000693961
//https://support.discord.com/hc/en-us/community/posts/1500000729481/comments/1500000688302
