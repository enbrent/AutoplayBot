const Commando = require('discord.js-commando');

module.exports = class QueueCommand extends Commando.Command {
    constructor(client, player) {
        super(client, {
            name: 'queue',
            group: 'music',
            memberName: 'queue',
            description: 'List the queue',
            details: "List the songs to play",
            examples: ['queue'],
        })
        this.player = player;
    }

    async run(msg, args) {
        this.player.queue(msg, false);
    }
};