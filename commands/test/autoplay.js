const Commando = require('discord.js-commando');

const YT_URL_VALIDATOR = `^(http(s)?:\/\/)?((w){3}.)?youtu(be|.be)?(\.com)?\/.+`;

module.exports = class AutoplayCommand extends Commando.Command {
    constructor(client, player) {
        super(client, {
            name: 'autoplay',
            group: 'test',
            memberName: 'autoplay',
            description: 'Autoplay music from YouTube starting with a YouTube URL',
            details: "Autoplay music from YouTube starting with a YouTube URL",
            examples: ['autoplay [url]', 'autoplay https://youtu.be/2UkAsDJdIA8'],
            args: [
                {
                    key: 'url',
                    label: 'YouTube URL',
                    prompt: 'Put a valid YouTube URL',
                    type: 'string',
                    validate: val => val.match(YT_URL_VALIDATOR)
                }
            ]
        })

        this.player = player;

    }

    async run(msg, args) {
        const url = args.url;
        this.player.play(msg, url, true);
    }
};