const Commando = require('discord.js-commando');

module.exports = class ResumeCommand extends Commando.Command {
    constructor(client, player) {
        super(client, {
            name: 'resume',
            group: 'test',
            memberName: 'resume',
            description: 'Resume the song',
            details: "Resume the song",
            examples: ['resume'],
        })
        this.player = player;
    }

    async run(msg, args) {
        this.player.resume(msg);
    }
};