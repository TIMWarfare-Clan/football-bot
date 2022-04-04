const { SlashCommandBuilder } = require('@discordjs/builders');

exports.data = new SlashCommandBuilder()
	.setName('money')
	.setDescription('Visualizza i tuoi soldi')
