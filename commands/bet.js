const { SlashCommandBuilder } = require('@discordjs/builders');
const currency_name = "<:shadowsdesign:1005783063390859294>";

exports.data = new SlashCommandBuilder()
	.setName('bet')
	.setDescription('Scommetti sulla partita')
	.addStringOption(
		option => option
			.setName('value')
			.setDescription('Usa 1, X, 2, 1X, X2 o 12')
			.setRequired(true)
			.addChoices(
				{ name: '1 (vince la squadra in casa)',  	value: '1' },
				{ name: 'X (finisce in pareggio)',  		value: 'X' },
				{ name: '2 (vince la squadra in trasferta)',  	value: '2' },
				{ name: '1X (squadra in casa o pareggio)', 	value: '1X' },
				{ name: 'X2 (squadra in trasferta o pareggio)',	value: 'X2' },
				{ name: '12 (squadra in casa o in trasferta)', 	value: '12' }
			)
	).addIntegerOption(
		option => option
			.setName('bet')
			.setDescription('Quanti shadows stai scommettendo')
			.setRequired(true)
	).addStringOption(
		option => option
			.setName('id')
			.setDescription('`id` della partita (vedi il messaggio della partita)')
			.setRequired(true))
