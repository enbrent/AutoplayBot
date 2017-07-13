const Commando = require('discord.js-commando');

module.exports = class SkipCommand extends Commando.Command {
    constructor(client, player) {
        super(client, {
            name: 'stop',
            group: 'music',
            memberName: 'stop',
            description: 'Stop music',
            details: "Stop music",
            examples: ['stop'],
        })
        this.player = player;
    }

    hasPermission(msg) {
        return this.player.isDJ(msg.member, msg.guild.id);
    }

    async run(msg, args) {

        this.player.leave(msg);
    }
};