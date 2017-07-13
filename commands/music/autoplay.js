const Commando = require('discord.js-commando');

const YT_URL_VALIDATOR = /^(http(s)?:\/\/)?((w){3}.)?youtu(be|.be)?(\.com)?\/.+/;
const URL_VALIDATOR = /^(?:(?:ht|f)tp(?:s?)\:\/\/|~\/|\/)?(?:\w+:\w+@)?((?:(?:[-\w\d{1-3}]+\.)+(?:com|org|net|gov|mil|biz|info|mobi|name|aero|jobs|edu|co\.uk|ac\.uk|it|fr|tv|museum|asia|local|travel|[a-z]{2}))|((\b25[0-5]\b|\b[2][0-4][0-9]\b|\b[0-1]?[0-9]?[0-9]\b)(\.(\b25[0-5]\b|\b[2][0-4][0-9]\b|\b[0-1]?[0-9]?[0-9]\b)){3}))(?::[\d]{1,5})?(?:(?:(?:\/(?:[-\w~!$+|.,=]|%[a-f\d]{2})+)+|\/)+|\?|#)?(?:(?:\?(?:[-\w~!$+|.,*:]|%[a-f\d{2}])+=?(?:[-\w~!$+|.,*:=]|%[a-f\d]{2})*)(?:&(?:[-\w~!$+|.,*:]|%[a-f\d{2}])+=?(?:[-\w~!$+|.,*:=]|%[a-f\d]{2})*)*)*(?:#(?:[-\w~!$ |\/.,*:;=]|%[a-f\d]{2})*)?$/;

module.exports = class AutoplayCommand extends Commando.Command {
    constructor(client, player) {
        super(client, {
            name: 'autoplay',
            group: 'music',
            memberName: 'autoplay',
            description: 'Autoplay music from search keywords or url',
            details: "Play music continously using keywords or a YouTube URL. Uses YouTube related videos to automatically queue a next song",
            examples: ['autoplay [url]', 'autoplay https://youtu.be/2UkAsDJdIA8', 'autoplay [keywords]', 'autoplay one ok rock'],
            aliases: ['ap'],
            args: [
                {
                    key: 'url',
                    label: 'search keywords or YouTube URL',
                    prompt: 'Put keywords or a valid YouTube URL',
                    type: 'string',
                    wait: 5,
                    // check if URL, then if valid YouTube URL, else just use it as a keyword
                    validate: val => URL_VALIDATOR.test(val) ? YT_URL_VALIDATOR.test(val) : true
                }
            ]
        })
        this.player = player;
    }

    hasPermission(msg) {
        return this.player.isDJ(msg.member, msg.guild.id);
    }

    async run(msg, args) {
        const url = args.url;
        return this.player.play(msg, url, true);
    }
};