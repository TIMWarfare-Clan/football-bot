const { SlashCommandBuilder } = require('@discordjs/builders');

exports.data = new SlashCommandBuilder() .setName('bet') .setDescription('Scommetti sulla partita') .addStringOption(option => option.setName('value') .setDescription('Usa 1, X, 2, 1X, X2 o 12') .setRequired(true));
