const { SlashCommandBuilder } = require('@discordjs/builders');

exports.data = new SlashCommandBuilder()
	.setName('bet')
	.setDescription('Scommetti sulla partita')
	.addStringOption(
		option => option
			.setName('value')
			.setDescription('Usa 1, X, 2, 1X, X2 o 12')
			.setRequired(true)
			.addChoice('1',  '1')
			.addChoice('X',  'x')
			.addChoice('2',  '2')
			.addChoice('1X', '1X')
			.addChoice('X2', 'X2')
			.addChoice('12', '12'))
	.addIntegerOption(
		option => option
			.setName('bet')
			.setDescription('Quanto stai scommettendo')
			.setRequired(true))
	.addStringOption(
		option => option
			.setName('id')
			.setDescription('`id` della partita (vedi il messaggio della partita)')
			.setRequired(true))
