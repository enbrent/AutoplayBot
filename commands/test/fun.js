const Commando = require('discord.js-commando');

module.exports = class FunCommand extends Commando.Command {
    constructor(client) {
        super(client, {
            name: 'fun',
            group: 'test',
            memberName: 'fun',
            description: 'Fun command for testing.',
            details: "This is the best command ever.",
            examples: ['fun', 'fun whatsup'],
            args: [
                {
                    key: 'random',
                    label: 'random',
                    prompt: 'You can put anything here',
                    type: 'string',
                    default: '' // optional
                }
            ]
        })
    }

    async run(msg, args) {
        const random = args.random;
        console.log(random);
        if (!random) {
            return msg.reply('whatup, give me some args mate');
        }
        return msg.reply(`whatup, ${random}`);

    }
};