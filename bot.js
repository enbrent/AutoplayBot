const Discord = require('discord.js');
const Commando = require('discord.js-commando');
const Youtube = require('youtube-api');

const fs = require('fs');
const path = require('path');
const readJson = require('r-json');

const OWNER_ID = '142443229764255744';
const TOKEN_ID = 'MzQxNjI3MDUxNjEyMzA3NDU4.DGD01Q.wFEZvPVYK12fTTmt23ibTtnIiVE';

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
    client.user.setGame("with kir ♥");
});

const Player = require('./libs/Player');
const player = new Player(client);
const SkipCommand = require('./commands/music/skip');
const StopCommand = require('./commands/music/stop');
const PauseCommand = require('./commands/music/pause');
const ResumeCommand = require('./commands/music/resume');
const SetDJCommand = require('./commands/music/setdj');
const PlayCommand = require('./commands/music/play');
const QueueCommand = require('./commands/music/queue');

client.registry
    .registerGroups([
        ['test', 'Experimental commands'],
        ['music', 'Music commands']
    ])
    .registerDefaults()
    .registerCommand(new SkipCommand(client, player))
    .registerCommand(new StopCommand(client, player))
    .registerCommand(new PauseCommand(client, player))
    .registerCommand(new ResumeCommand(client, player))
    .registerCommand(new SetDJCommand(client, player))
    .registerCommand(new PlayCommand(client, player))
    .registerCommand(new QueueCommand(client, player));

client.login(TOKEN_ID);