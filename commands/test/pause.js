const Commando = require('discord.js-commando');

module.exports = class PauseCommand extends Commando.Command {
    constructor(client, player) {
        super(client, {
            name: 'pause',
            group: 'test',
            memberName: 'pause',
            description: 'Pause the song',
            details: "Pause the song",
            examples: ['pause'],
        })
        this.player = player;
    }

    async run(msg, args) {
        this.player.pause(msg);
    }
};