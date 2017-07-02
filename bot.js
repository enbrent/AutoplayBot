const Discord = require('discord.js');
const Commando = require('discord.js-commando');
const path = require('path');

const OWNER_ID = '142443229764255744';
const TOKEN_ID = 'MzMxMDY4MDYzMjQ2MDU3NDgy.DDqLTg.LMtvgH9S4EAMPQe60Co5mIEUlx8';
const MSG_IDENTIFIER = '.';

const client = new Commando.Client({
    owner: OWNER_ID,
    commandPrefix: '!!'
});

client.on('ready', () => {
    console.log('I am ready');
});

client.registry
    .registerGroups([
        ['test', 'Experimental commands']
    ])
    .registerDefaults()
    .registerCommandsIn(path.join(__dirname, 'commands'));

client.login(TOKEN_ID);