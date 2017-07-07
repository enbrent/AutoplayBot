const Commando = require('discord.js-commando');

module.exports = class SkipCommand extends Commando.Command {
    constructor(client, player) {
        super(client, {
            name: 'stop',
            group: 'test',
            memberName: 'stop',
            description: 'Stop autoplay mode',
            details: "Stop autoplay mode",
            examples: ['stop'],
        })
        this.player = player;
    }

    async run(msg, args) {
        // TODO: fix permissions
        this.player.leave(msg);
    }
};