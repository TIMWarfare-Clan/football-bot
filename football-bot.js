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
const scheduler = require('node-schedule');
var axios = require("axios").default;

//global variables
const currency_name = "Pippo";
const default_values = {
	money: 0,
	played: 0,
	won: 0
}

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
function nextweek(today){ //from https://stackoverflow.com/a/1025723/12206923
	nextweek = new Date(today.getFullYear(), today.getMonth(), today.getDate()+7);
	return nextweek;
}

client.once('ready', async () => {
try{
	data_boot = new Date();
	console.log(`Logged in as ${client.user.id} at ${data_boot}.\n`+
		    `prefix: ${p}`
	);
	scheduler.scheduleJob({second: 0, minute: 0, hour: 6, dayOfWeek: 1}, async ()=>{
		data_now  = new Date();
		data_week = nextweek(data_now);
		data_now  = data_now.getFullYear()  +"-"+ data_now.getMonth()  +"-"+ data_now.getDate();
		data_week = data_week.getFullYear() +"-"+ data_week.getMonth() +"-"+ data_week.getDate();
		console.log(data_now);
		console.log(data_week);
		resp = await ask_elena('/v2/seasons/4270/fixtures?from='+data_now+'&to='+data_week);
		//resp = require('./a.js').a();
		console.log(resp.data);

		for(const partita of resp.data.data) {
			match = partita;
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
						"description": `Il **<t:${new Date(partita.date).getTime() / 1000}>** giocheranno **${partita.homeName} (in casa)** contro **${partita.awayName} (in trasferta)**`,
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
					}
				],
				files: [
					{
						"attachment": match.idHome+"vs"+match.idAway+".jpg",
						"name": "vs.jpg"
					}
				]
			}
			console.log(msg);
			//(await client.channels.fetch('481512731569160224')).send(msg);
			(await client.channels.fetch('963346629258272828')).send(msg);
		}
	});
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
		eph = true;
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
				 "\nQuesti dati sono giusti?\n"+
				 "Rispondi con `giusto` per confermare o con `annulla` per annullare entro 2 minuti.",
			ephemeral: eph
		});

		//from https://stackoverflow.com/a/70728365/12206923 and https://stackoverflow.com/a/68405712/12206923
		const SECONDS_TO_REPLY = 120;
		const MESSAGES_TO_COLLECT = 1;
		const filter = (m) => {
			return m.author.id == interaction.user.id && (m.content == 'giusto' || m.content == 'annulla')
		}
		const collector = interaction.channel.createMessageCollector({filter, time: SECONDS_TO_REPLY * 1000, max: MESSAGES_TO_COLLECT})
		collector.on('collect', async confirm_message => {
			if(confirm_message.content == 'giusto') {
				confirm_message.delete().then(msg => {console.log(`Deleted confirm_message from ${msg.author.username} (id:${msg.author.id}) at ${new Date()}`)}).catch(console.error);
				doc = await db.collection('users').doc(interaction.user.id);
				doc.set(default_values, {merge: true})
				doc.update({
					bet_log: admin.firestore.FieldValue.arrayUnion(bb)
				});
				interaction.followUp({content: "Confermato", ephemeral: eph});
				console.log(bb.id_partita+" confirmed");
			}else if(confirm_message.content == 'annulla') {
				interaction.followUp({content: "Annullato", ephemeral: eph});
				console.log(bb.id_partita+" canceled");
			}
		});
		collector.on('end', (collected, reason) => {
			console.log(bb.id_partita+" cancelled (reason:"+reason+"):");
			console.log(bb);
			if(reason == 'time')
				interaction.followUp({content: "Tempo scaduto", ephemeral: eph});
		});
	}
	if(interaction.commandName === 'money') {
		d = (await db.collection('users').doc(interaction.user.id).get()).data();
		if(d != undefined) {
			rep = d.money;
			interaction.reply(`${rep} ${currency_name}`);
		}else
			interaction.reply(`Non hai ancora ${currency_name}.`);
	}
});

tok = endec.decode(process.env.tok);
client.login(tok);

//https://support.discord.com/hc/en-us/community/posts/1500000729481/comments/1500000693961
//https://support.discord.com/hc/en-us/community/posts/1500000729481/comments/1500000688302
