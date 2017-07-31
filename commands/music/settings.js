const Commando = require('discord.js-commando');

module.exports = class SettingsCommand extends Commando.Command {
    constructor(client, player) {
        super(client, {
            name: 'setting',
            group: 'music',
            memberName: 'setting',
            description: 'Modify settings of the player',
            details: 'Modify settings of the player',
            examples: ['settings autoplay true'],
            args: [
                {
                    key: 'setting',
                    label: 'a valid setting',
                    prompt: 'Put a valid setting. Use .settings to view ',
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
        // only admins can use this command
        return msg.member.hasPermission("ADMINISTRATOR");
    }

    async run(msg, args) {
        this.player.resume(msg);
    }
};