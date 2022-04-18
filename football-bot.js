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
const currency_name = "credit (1 credit = 1 <:shadowsdesign:893222216966225960>)";
const default_values = {
	money: 0,
	played: 0,
	won: 0
}
const id_channel = '964875578127810601';

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
function sleep(ms) { //from https://stackoverflow.com/a/41957152/12206923
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}
async function update_money(match_id, home_sum, away_sum) { //update money
	if	(home_sum > away_sum) 	r = "1";
	else if	(home_sum < away_sum) 	r = "2";
	else if	(home_sum == away_sum) 	r = "X";
	coll = await db.collection('users');
	docs = (await coll.get()).docs;
	for(user_doc of docs) {
		user_data = user_doc.data();
		b = user_data.bet_log.filter(e => e.id_partita == match_id);
		console.log(b);
		for(bet of b) {
			if(bet.bet_value.includes(r))
				coll.doc(user_doc.id).update({
					money: admin.firestore.FieldValue.increment(bet.bet_amount),
					won:   admin.firestore.FieldValue.increment(1)
				});
		}
	}
}

client.once('ready', async () => {
try{
	data_boot = new Date();
	console.log(`Logged in as ${client.user.id} at ${data_boot}.\n`+
		    `prefix: ${p}`
	);
	scheduler.scheduleJob({second: 0, minute: 0, hour: 6, dayOfWeek: 1}, async ()=>{
		console.log("start sending matches");
		data_now  = new Date();
		data_week = nextweek(data_now);
		data_now  = data_now.getFullYear()  +"-"+ data_now.getMonth()  +"-"+ data_now.getDate();
		data_week = data_week.getFullYear() +"-"+ data_week.getMonth() +"-"+ data_week.getDate();
		console.log(data_now);
		console.log(data_week);
		resp = await ask_elena('/v2/seasons/4270/fixtures?from='+data_now+'&to='+data_week);
		//resp = require('./a.js').a();
		console.log(resp.data);
		array_ids = [];

		cc = (await client.channels.fetch(id_channel));
		for(const match of resp.data.data) {
			img = await jimp.read('vs.jpg');
			img_home = await jimp.read("https://cdn.elenasport.io/badges/150x150/"+match.idHome);
			img_away = await jimp.read("https://cdn.elenasport.io/badges/150x150/"+match.idAway);
			await img.composite(img_home, 10, 105); //0, 360/2 - 150/2
			await img.composite(img_away, 480, 105);
			await img.writeAsync(match.idHome+"vs"+match.idAway+".jpg");
			msg = {
				embeds: [
					{
						"title": match.leagueName,
						"description": `Il **<t:${new Date(match.date).getTime() / 1000}>** giocheranno **${match.homeName} (in casa)** contro **${match.awayName} (in trasferta)**`,
						//"url": "https://elenasport-io1.p.rapidapi.com", //TODO: add link to everything and to this
						"color": 9532993,
						"timestamp": new Date(),
						"image": {
							"url": "attachment://vs.jpg",
						},
						"fields": [
							{
								"name": "Per scommettere usa (il messaggio non verrà visto dagli altri utenti):",
								"value": "`/bet`, con `id` `"+match.id+"`"
							},
							{
								"name": "Per vedere il tuo bilancio attuale usa:",
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
			console.log(resp.data.data.length);
			//(await client.channels.fetch('481512731569160224')).send(msg);
			array_ids.push({
				partita_id: match.id,
				data_partita: new Date(match.date).toISOString(),
				message_id: (await cc.send(msg)).id
			});
			console.log(array_ids,array_ids.length);
		}
		db.collection('messages').doc('messages').set({array_ids: array_ids});
		console.log("finished sending matches' messages");
	});

	scheduler.scheduleJob("*/20 * * * *", async ()=>{
		console.log("start updating matches");
		ids = (await db.collection('messages').doc('messages').get()).data().array_ids;
		for(const matchy of ids) {
			console.log(matchy);
			if(new Date(matchy.data_partita) >= new Date()) continue; //if not yet started skip
			await sleep(6000); //to void getting rate-limited (max 10/min)
			match = (await ask_elena('/v2/fixtures/'+matchy.partita_id)).data.data[0];
			//match = require('./a.js').a().data.data.filter(e => e.id == matchy.partita_id)[0];
			console.log(match);
			if(match.status == 'not started') continue; //shouldn't ever run, but just to be sure
			msg = {
				embeds: [
					{
						"title": match.leagueName,
						"description": "",
						//"url": "https://elenasport-io1.p.rapidapi.com", //TODO: add link to everything and to this
						"color": 0,
						"timestamp": new Date(),
						"image": {
							"url": "attachment://vs.jpg",
						},
						"fields": [
							{
								"name": "ID Partita:",
								"value": "`"+match.id+"`"
							},
							{
								"name": "Per vedere il tuo bilancio attuale usa:",
								"value": "`/money`"
							}
						]
					}
				],
			}
			home_sum = match.team_home_90min_goals + match.team_home_ET_goals + match.team_home_PEN_goals;
			away_sum = match.team_away_90min_goals + match.team_away_ET_goals + match.team_away_PEN_goals;
			if(match.status == 'in progress') {
				msg.embeds[0].description = `La partita del **<t:${new Date(match.date).getTime() / 1000}>**, giocata da **${match.homeName} (in casa)** contro **${match.awayName} (in trasferta)**, è in corso.\n **${home_sum}-${away_sum}**.`
				msg.embeds[0].color = 9532993;
				msg.embeds[0].fields.splice(0, 0, {
					"name": "Punteggi:",
					"value": `*${match.homeName}*: ${home_sum}\n*${match.awayName}*: ${away_sum}`
				});
			}
			else if(match.status == 'finished') {
				msg.embeds[0].description = `La partita del **<t:${new Date(match.date).getTime() / 1000}>**, giocata da **${match.homeName} (in casa)** contro **${match.awayName} (in trasferta)**, è finita.\nLe ricompense delle scommesse sono state accreditate ed è stata inviata una notifica nei messaggi privati a chi a scommesso.`;
				msg.embeds[0].color = 9532993;
				msg.embeds[0].fields.splice(0, 0,
					{
						"name": `__${match.homeName}__:`,
						"value": `**${home_sum}**`,
						"inline": true
					},
					{
						"name": `__${match.awayName}__:`,
						"value": `**${away_sum}**`,
						"inline": true
					}
				);
				update_money(match.id, home_sum, home_sum);
				ards = (await db.collection('messages').doc('messages').get()).data().array_ids;
				ar  = ards.filter(e => e.partita_id != match.id);
				art = ards.filter(e => e.partita_id == match.id);
				db.collection('messages').doc('messages').set({array_ids: ar});
				db.collection('messages').doc('to_delete').update({
					array_ids: admin.firestore.FieldValue.arrayUnion(...art) //spread operator ES6
				});
				console.log(`${match.id} removed from messages and added to to_delete`);
			}
			else if(match.status == 'cancelled') {
				msg.embeds[0].description = `La partita del **<t:${new Date(match.date).getTime() / 1000}>**, giocata da **${match.homeName} (in casa)** contro **${match.awayName} (in trasferta)**, è stata annullata.`;
				msg.embeds[0].color = 9532993;
			}
			else if(match.status == 'postponed') {
				msg.embeds[0].description = `La partita del **<t:${new Date(match.date).getTime() / 1000}>**, giocata da **${match.homeName} (in casa)** contro **${match.awayName} (in trasferta)**, è stata rimandata.`;
				msg.embeds[0].color = 9532993;
			}
			console.log(msg);
			(await (await client.channels.fetch(id_channel)).messages.fetch(matchy.message_id)).edit(msg);
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
				//doc.set(default_values, {merge: true})
				doc.update({
					bet_log: admin.firestore.FieldValue.arrayUnion(bb),
					money:   admin.firestore.FieldValue.increment(-bb.bet_amount),
					played:  admin.firestore.FieldValue.increment(1)
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
