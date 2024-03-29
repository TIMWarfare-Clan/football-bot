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
const uu = require('unb-api');
const unb = new uu.Client(endec.decode(process.env.tok_unb));
var axios = require("axios").default;
const creator_id = '295941261141999617'; // change it to your id
const bookmaker_id = '6'; // 6 = Bwin

//global variables
//const currency_name = "credit (1 credit = 1 <:shadowsdesign:893222216966225960>)";
const currency_name = "<:shadowsdesign:1005783063390859294>";
const default_values = {
	money: 0,
	played: 0,
	won: 0
}
var id_channel = '964875578127810601';
const see_money_command = "`!money`";
var can_update = true;

const client = new Client({
	intents: ["GUILDS", "GUILD_MESSAGES"]
});
admin.initializeApp({
	credential: admin.credential.cert(firebase)
});
const db = admin.firestore();

async function ask_api(endpoint) {
	// api_documentation = https://www.api-football.com/documentation-v3
	options = {
		method: 'GET',
		url: 'https://v3.football.api-sports.io'+endpoint,
		headers: {
			'x-rapidapi-host': 'v3.football.api-sports.io',
			'x-rapidapi-key': endec.decode(process.env.es_api_key)
		}
	};
	//console.log(options);

	response = await axios.request(options);

	console.log(response.status+": "+response.statusText, "resquest:", response.request);
	if(response.status != 200) {
		console.log("data:", response.data);
		response = null;
	}

	return response;
}
/*
function nextweek(today){ //from https://stackoverflow.com/a/1025723/12206923
	nextweek = new Date(today.getFullYear(), today.getMonth(), today.getDate()+7);
	return nextweek;
}
*/
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
			if(bet.bet_value.includes(r)) {
				//TODO: not use firestore for guild id (that way other guilds can also be supported)
				const aumento = Math.floor(bet.bet_amount * bet.multiplier);
				await unb.editUserBalance(
					(await db.collection('config').doc('guild_unb').get()).data().timw, user_doc.id,
					{
						cash: aumento,
						bank: 0
					},
					`bet id:${bet.id_partita} vinta, aggiunti ${aumento} unb currency`
				)
				coll.doc(user_doc.id).update({
					won:   admin.firestore.FieldValue.increment(1)//,
					//money: admin.firestore.FieldValue.increment(aumento)
				});
				(await client.users.fetch(user_doc.id)).send(`Hai vinto la scommessa del <t:${Math.floor(new Date(bet.timestamp).getTime() / 1000)}> con valore ${bet.bet_value} sulla partita con ID \`${bet.id_partita}\`, ti sono stati aggiunti ${aumento} ${currency_name}.`);
			} else {
				coll.doc(user_doc.id).update({
					lost:  admin.firestore.FieldValue.increment(1)
				});
				(await client.users.fetch(user_doc.id)).send(`Hai perso la scommessa del <t:${Math.floor(new Date(bet.timestamp).getTime() / 1000)}> con valore ${bet.bet_value} della partita con ID \`${bet.id_partita}\`, non ti sono stati aggiunti credit. Riprova (o forse no, è meglio non giocare d'azzardo)`);
			}
		}
	}
}

async function to_delete() {
	console.log("delete");
	try{
		doc = await db.collection('messages').doc('to_delete');
		ids = (await doc.get()).data().array_ids;
		id_channel = (await db.collection('config').doc('channel').get()).data().id;
		console.log('delete_ids:'+ids)
		for(const t of ids) {
			msg_id = t.message_id;
			cc = (await client.channels.fetch(id_channel));
			a = (await cc.messages.fetch(msg_id)).delete().then(msg => {console.log(`Deleted match_message from ${msg.author.username} (id:${msg.author.id}) at ${new Date()}`)}).catch(console.error);
			doc.update({
				array_ids: admin.firestore.FieldValue.arrayRemove(t)
			})
		}
	}catch(e){console.log(e)}
	console.log("finito delete");
}

function determine_match_state(current_state) {
	not_started_states = [
		'NS',
		'TBD'
	];
	in_progress_states = [
		'1H',
		'HT',
		'2H',
		'ET',
		'P',
		'BT'
	];
	finished_states = [
		'FT',
		'AET',
		'PEN',
	];
	cancelled_states = [
		'INT',
		'CANC',
		'ABD'
	];
	postponed_states = [
		'SUSP',
		'PST'
	];

	     if(not_started_states.includes(current_state)) return 'not_started';
	else if(in_progress_states.includes(current_state)) return 'in_progress';
	else if(finished_states.   includes(current_state)) return 'finished';
	else if(cancelled_states.  includes(current_state)) return 'cancelled';
	else if(postponed_states.  includes(current_state)) return 'postponed';
}

client.once('ready', async () => {
	// backup whole db
	collections = await db.listCollections();
	file = "./bck_firestore";
	fs.writeFileSync(file,`//Backup Cloud Firestore ${new Date()}\n\n`);
	for (let collection of collections) {
		//console.log(`"${collection.id}" :`);
		fs.appendFileSync(file,`"${collection.id}" : {\n`);
		map = await collection.get();
		docs = map.docs;
		docs.map(doc => {
				fs.appendFileSync(file,`"${doc.id}"`)
				fs.appendFileSync(file," : ")
				fs.appendFileSync(file,JSON.stringify(doc.data(), null, '\t'))
				fs.appendFileSync(file,",\n");
			}
		)
		fs.appendFileSync(file,"\n},\n\n");
	}
	console.log("Firestore Backup finished");


	data_boot = new Date();
	id_channel = (await db.collection('config').doc('channel').get()).data().id;
	console.log(`Logged in as ${client.user.id} at ${data_boot}\n`+
		    `prefix: ${p}\n`+
		    `id_channel: ${id_channel}`
	);

	//b = await unb.editUserBalance((await db.collection('config').doc('guild_unb').get()).data().timw, '295941261141999617', { cash: -300, bank: 0 }, "yes");
	//b = await unb.setUserBalance((await db.collection('config').doc('guild_unb').get()).data().timw, '295941261141999617', { cash: 120, bank: 870 }, "yes");
	//console.log(b);
	//(await client.users.fetch('295941261141999617')).send(currency_name);

	scheduler.scheduleJob({second: 0, minute: 5, hour: 4}, async ()=>{
		to_delete();
		can_update = false;
		console.log("start sending matches");
		league_ids = (await db.collection('config').doc('leagues').get()).data().ids; //DONE: //TODO: use league ids and get last league id (should be league.current_season, use https://football.elenasport.io/v2/leagues/league_id?expand=current_season)
		array_ids = [];
		for(const league_id of league_ids) {
			console.log(league_id);
			//data_now  = new Date();
			//data_week = nextweek(data_now);
			//data_now  = data_now.getFullYear()  +"-"+ (data_now.getMonth()+1)  +"-"+ data_now.getDate();
			//data_week = data_week.getFullYear() +"-"+ (data_week.getMonth()+1) +"-"+ data_week.getDate();
			//console.log(data_now);
			//console.log(data_week);
			//tomorrow = new Date();
			//tomorrow.setDate(tomorrow.getDate()+1);

			today = new Date();
			today_yyyymmdd = today.toISOString().split('T')[0];
			console.log(today);

			axios_response = (await ask_api('/fixtures?league='+league_id+'&season='+today.getUTCFullYear()+'&from='+today_yyyymmdd+'&to='+today_yyyymmdd));
			if(axios_response == null) continue;

			//resp = await ask_api('/v2/fixtures?from=2022-09-03&to=2022-09-04');
			//resp = await ask_api('/v2/upcoming');
			//resp = require('./a.js').a();
			resp = axios_response.data.response;
			console.log(resp);

			cc = (await client.channels.fetch(id_channel));
			try{
				for(const match of resp) {

					// so I can switch api quickier
					match_date 	= match.fixture.date;
					match_timestamp = match.fixture.timestamp;
					match_id 	= match.fixture.id;
					league_name 	= match.league.name;
					home_id 	= match.teams.home.id;
					away_id 	= match.teams.away.id;
					home_name 	= match.teams.home.name;
					away_name 	= match.teams.away.name;

					img = await jimp.read('vs.jpg');
					try{
						img_home = await jimp.read(match.teams.home.logo);
					}catch(e){
						console.log('no_logo home');
						img_home = await jimp.read("./no_logo.png");
					}
					try{
						img_away = await jimp.read(match.teams.away.logo);
					}catch(e){
						console.log('no_logo away');
						img_away = await jimp.read("./no_logo.png");
					}
					await img.composite(img_home, 10, 105); //0, 360/2 - 150/2
					await img.composite(img_away, 480, 105);
					image_filename = home_id +"vs"+ away_id +".jpg";
					await img.writeAsync(image_filename);
					msg = {
						embeds: [
							{
								"title": league_name,
								"description": `Il **<t:${match_timestamp}>** giocheranno **${home_name} (in casa)** contro **${away_name} (in trasferta)**`,
								//"url": "", //TODO: add link to everything and to this
								"color": 9532993,
								"timestamp": new Date(),
								"image": {
									"url": "attachment://vs.jpg",
								},
								"fields": [
									{
										"name": "Per scommettere usa (il messaggio non verrà visto dagli altri utenti):",
										"value": "`/bet`, con `id` `"+match_id+"`"
									},
									{
										"name": "Per vedere il tuo bilancio attuale usa:",
										"value": see_money_command
									}
								]
							}
						],
						files: [
							{
								"attachment": image_filename,
								"name": "vs.jpg"
							}
						]
					}
					console.dir(msg,{depth:null});
					console.log(resp.length);
					//(await client.channels.fetch('481512731569160224')).send(msg);
					array_ids.push({
						partita_id: match_id,
						data_partita: new Date(match_date).toISOString(),
						message_id: (await cc.send(msg)).id
					});
					console.log(array_ids,array_ids.length);
				}
				db.collection('messages').doc('messages').set({array_ids: array_ids});
				console.log("finished sending matches' messages for "+league_id);
				can_update = true;
			}catch(e){console.log(e)}
		}
	});

	scheduler.scheduleJob("0 */1 * * *", async ()=>{
		if(can_update == false) {
			console.log("can't update matches, sending matches in progress");
			return;
		}
		console.log("start updating matches");
		ids = (await db.collection('messages').doc('messages').get()).data().array_ids;
		to_del = (await db.collection('messages').doc('to_delete').get()).data().array_ids;
		//var matches = [];
		//league_ids = (await db.collection('config').doc('leagues').get()).data().ids;
		//for(const league_id of league_ids) {
		//	a = (await ask_api('/v2/leagues/'+league_id+'?expand=current_season.upcoming')).data.data[0].expand.current_season[0].expand.upcoming;
		//	console.log(a);
		//	if(a != null) matches = matches.concat(a);
		//}
		for(const matchy of ids) {
			console.log(matchy);
			if(new Date(matchy.data_partita) >= new Date() || to_del.some(e => e.id == matchy.partita_id))
				continue; //if not yet started OR has already finished (is in to_delete array) skip
			await sleep(6000); //to avoid getting rate-limited (max 10/min)

			axios_response = (await ask_api('/fixtures?id='+matchy.partita_id));
			if(axios_response == null) continue;

			//match = matches.filter(e => e.id == matchy.partita_id)[0];
			//match = require('./a.js').a().data.data.filter(e => e.id == matchy.partita_id)[0];
			match = axios_response.data.response[0];
			console.log(match);

			// so I can switch api quickier
			match_timestamp = match.fixture.timestamp;
			match_id 	= match.fixture.id;
			league_name 	= match.league.name;
			home_sum 	= match.goals.home;
			away_sum 	= match.goals.away;
			home_name 	= match.teams.home.name;
			away_name 	= match.teams.away.name;
			status_short 	= match.fixture.status.short;

			console.log(
				match_timestamp,
				match_id,
				league_name,
				home_sum,
				away_sum,
				home_name,
				away_name,
				status_short
			)

			msg = {
				embeds: [
					{
						"title": league_name,
						"description": "",
						//"url": "", //TODO: add link to everything and to this
						"color": 0,
						"timestamp": new Date(),
						"image": {
							"url": "attachment://vs.jpg",
						},
						"fields": [
							{
								"name": "ID Partita:",
								"value": "`"+ match_id +"`"
							},
							{
								"name": "Per vedere il tuo bilancio attuale usa:",
								"value": see_money_command
							}
						]
					}
				],
			}
			if(determine_match_state(status_short) == 'not_started') continue; //shouldn't ever run, but just to be sure //NS = not started
			else if(determine_match_state(status_short) == 'in_progress') { //in progress
				msg.embeds[0].description = `La partita del **<t:${match_timestamp}>**, giocata da **${home_name} (in casa)** contro **${away_name} (in trasferta)**, è in corso.`
				msg.embeds[0].color = 9532993;
				msg.embeds[0].fields.splice(0, 0, {
					"name": "Punteggi:",
					"value": `*${home_name}*: ${home_sum}\n*${away_name}*: ${away_sum}`
				});
			}
			else if(determine_match_state(status_short) == 'finished') { //finished
				msg.embeds[0].description = `La partita del **<t:${match_timestamp}>**, giocata da **${home_name} (in casa)** contro **${away_name} (in trasferta)**, è finita.\nLe ricompense delle scommesse sono state accreditate ed è stata inviata una notifica nei messaggi privati a chi a scommesso.`;
				msg.embeds[0].color = 9532993;
				msg.embeds[0].fields.splice(0, 0,
					{
						"name": `__${home_name}__:`,
						"value": `**${home_sum}**`,
						"inline": true
					},
					{
						"name": `__${away_name}__:`,
						"value": `**${away_sum}**`,
						"inline": true
					}
				);
				update_money(match_id, home_sum, away_sum);
				ards = (await db.collection('messages').doc('messages').get()).data().array_ids;
				try {
					ar  = ards.filter(e => e.partita_id != match_id);
					art = ards.filter(e => e.partita_id == match_id);
					console.log("ar:",ar,"art:",art);
					db.collection('messages').doc('messages').set({array_ids: ar});
					db.collection('messages').doc('to_delete').update({
						array_ids: admin.firestore.FieldValue.arrayUnion(...art) //spread operator ES6
					});
				}catch(e){console.log(e)}
				console.log(`${match_id} removed from messages and added to to_delete`);
			}
			else if(determine_match_state(status_short) == 'cancelled') { //cancelled
				msg.embeds[0].description = `La partita del **<t:${match_timestamp}>**, giocata da **${home_name} (in casa)** contro **${away_name} (in trasferta)**, è stata annullata.`;
				msg.embeds[0].color = 9532993;
			}
			else if(determine_match_state(status_short) == 'postponed') { //postponed
				msg.embeds[0].description = `La partita del **<t:${match_timestamp}>**, giocata da **${home_name} (in casa)** contro **${away_name} (in trasferta)**, è stata rimandata.`;
				msg.embeds[0].color = 9532993;
			}
			console.log(msg);
			try {
				(await (await client.channels.fetch(id_channel)).messages.fetch(matchy.message_id)).edit(msg);
			}catch(e){console.log(e)}
		}
	});
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
	//console.log(interaction);
	if(interaction.commandName === 'bet') {
		eph = true;
		bb = {
			bet_value:	interaction.options.getString('value'),
			bet_amount:	interaction.options.getInteger('bet'),
			id_partita:	interaction.options.getString('id'),
			timestamp:	new Date().toISOString(),
			multiplier:	1.0
		}
		id = (await db.collection('messages').doc('messages').get()).data().array_ids.find(e => e.partita_id == bb.id_partita);
		console.log(id);
		if(id != undefined) {
			if(new Date(id.data_partita) >= new Date()) { //you can bet only if the match has not started yet
				usable_money = (await unb.getUserBalance(interaction.guild.id, interaction.user.id)).cash;
				console.log(usable_money);
				if(!((await db.collection('users').doc(interaction.user.id).get()).exists)){
					await db.collection('users').doc(interaction.user.id).set({
						bet_log: []//,
						//money: user_credits
					});
				}
				doc = await db.collection('users').doc(interaction.user.id);
				doc_data = (await doc.get()).data();
				//usable_money = doc_data.money;
				if(!doc_data.bet_log.some(e => e.id_partita == bb.id_partita)) {
					if(usable_money >= bb.bet_amount) {
						interaction.reply({
							content: `Bet registrata:\n`+
								 `Scommessa: ${bb.bet_value}\n`+
								 `${currency_name} scommessi: ${bb.bet_amount}\n`+
								 `ID partita: \`${bb.id_partita}\`\n`+
								 "\nQuesti dati sono giusti?\n"+
								 "Rispondi con `giusto` per confermare o con `annulla` per annullare entro 2 minuti.",
							ephemeral: eph
						});

						//from https://stackoverflow.com/a/70728365/12206923 and https://stackoverflow.com/a/68405712/12206923
						const SECONDS_TO_REPLY = 120;
						const MESSAGES_TO_COLLECT = 1;
						const filter = (m) => {
							return m.author.id == interaction.user.id && (m.content.toLowerCase() == 'giusto' || m.content.toLowerCase() == 'annulla')
						}
						const collector = interaction.channel.createMessageCollector({filter, time: SECONDS_TO_REPLY * 1000, max: MESSAGES_TO_COLLECT})
						collector.on('collect', async confirm_message => {
							if(confirm_message.content.toLowerCase() == 'giusto') {
								confirm_message.delete().then(msg => {console.log(`Deleted confirm_message 'giusto' from ${msg.author.username} (id:${msg.author.id}) at ${new Date()}`)}).catch(console.error);
								await doc.set({yes:0}, {merge: true}) //if you /bet more than once in a single time without using 'giusto' it will confirm three times, but it's fine cause the array gets overwritten each "Confermato"
								axios_response = (await ask_api('/odds?fixture='+ bb.id_partita +'&bookmaker='+ bookmaker_id));
								if(axios_response == null){
									//interaction.followUp({content: "Failed to get odds. STATUS CODE: "+ axios_response.status +"\n\nManda un messaggio a <@"+ creator_id +">.", ephemeral: eph});
									interaction.followUp({content: "Errore nella ricezione delle quote. STATUS CODE: "+ axios_response.status +"\n\nManda un messaggio a <@"+ creator_id +">.", ephemeral: eph});
								}

								var odd_id;
								switch(bb.bet_value) {
									case "1":
										odd_name = "Home";
										odd_id = 1;
										break;
									case "2":
										odd_name = "Away";
										odd_id = 1;
										break;
									case "X":
										odd_name = "Draw";
										odd_id = 1;
										break;
									case "1X":
										odd_name = "Home/Draw";
										odd_id = 12;
										break;
									case "X2":
										odd_name = "Draw/Away";
										odd_id = 12;
										break;
									case "12":
										odd_name = "Home/Away";
										odd_id = 12;
										break;
								}
								bb.multiplier = parseFloat(axios_response.data.response[0].bookmakers[0].bets.find(e => e.id == odd_id).values.find(e => e.value == odd_name).odd);

								doc.update({
									bet_log: admin.firestore.FieldValue.arrayUnion(bb),
									//money:   admin.firestore.FieldValue.increment(-bb.bet_amount),
									played:  admin.firestore.FieldValue.increment(1)
								});

								await unb.editUserBalance(interaction.guild.id, interaction.user.id, { cash: -bb.bet_amount, bank: 0 }, `bet id:${bb.id_partita}`)

								interaction.followUp({content: "Confermato", ephemeral: eph});
								console.log(bb.id_partita+" confirmed");
							}else if(confirm_message.content.toLowerCase() == 'annulla') {
								confirm_message.delete().then(msg => {console.log(`Deleted confirm_message 'annulla' from ${msg.author.username} (id:${msg.author.id}) at ${new Date()}`)}).catch(console.error);
								interaction.followUp({content: "Annullato", ephemeral: eph});
								console.log(bb.id_partita+" cancelled");
							}
						});
						collector.on('end', (collected, reason) => {
							console.log(bb.id_partita+" cancelled (reason:"+reason+"):");
							console.log(bb);
							if(reason == 'time')
								interaction.followUp({content: "Tempo scaduto", ephemeral: eph});
						});
					} else {
						interaction.reply({
							content:  `Non hai abbastanza ${currency_name}, ne hai solo ${usable_money}\n`,
							ephemeral: eph
						});
					}
				} else {
					interaction.reply({
						content:  `Hai già scommesso sulla partita con ID \`${bb.id_partita}\`\n`,
						ephemeral: eph
					});
				}
			} else {
				interaction.reply({
					content:  `Non puoi più scommettere sulla partita con ID \`${bb.id_partita}\` perché è già iniziata\n`,
					ephemeral: eph
				});
			}
		} else {
			interaction.reply({
				content:  `La partita con ID \`${bb.id_partita}\` non esiste o è già finita\n`,
				ephemeral: eph
			});
		}
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
