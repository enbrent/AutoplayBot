const Commando = require('discord.js-commando');

module.exports = class SkipCommand extends Commando.Command {
    constructor(client, player) {
        super(client, {
            name: 'skip',
            group: 'test',
            memberName: 'skip',
            description: 'Skip to next song',
            details: "Skip to next song",
            examples: ['skip'],
        })
        this.player = player;
    }

    async run(msg, args) {
        // TODO: separate skip on autoplay (skip just 1 song) vs skip on normal play (skip with index)
        this.player.skip(msg);
    }
};