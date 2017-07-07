const Commando = require('discord.js-commando');

module.exports = class NowCommand extends Commando.Command {
    constructor(client, player) {
        super(client, {
            name: 'now',
            group: 'test',
            memberName: 'now',
            description: 'Gets the current and upcoming songs',
            details: "Gets the current and upcoming song to play during autoplay mode",
            examples: ['now'],
        })
        this.player = player;
    }

    async run(msg, args) {
        this.player.queue(msg, true);
    }
};