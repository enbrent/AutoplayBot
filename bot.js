const Discord = require('discord.js');
const Commando = require('discord.js-commando');
const Youtube = require('youtube-api');


const fs = require('fs');
const path = require('path');
const readJson = require('r-json');

const OWNER_ID = '142443229764255744';
const TOKEN_ID = 'MzMxMDY4MDYzMjQ2MDU3NDgy.DDqLTg.LMtvgH9S4EAMPQe60Co5mIEUlx8';

Youtube.authenticate({
    type: 'key',
    key: 'AIzaSyDiRUxXFWiANrFqeMT7YqxXTdwa4KVmWeY'
});

const client = new Commando.Client({
    owner: OWNER_ID,
    commandPrefix: '!!'
});

client.on('ready', () => {
    console.log('I am ready');
});

const Player = require('./libs/player');
const player = new Player(client);
const AutoplayCommand = require('./commands/test/autoplay');
const SkipCommand = require('./commands/test/skip');

client.registry
    .registerGroups([
        ['test', 'Experimental commands']
    ])
    .registerDefaults()
    .registerCommand(new AutoplayCommand(client, player))
    .registerCommand(new SkipCommand(client, player));

client.login(TOKEN_ID);