const Commando = require('discord.js-commando');

module.exports = class SetDJCommand extends Commando.Command {
    constructor(client, player) {
        super(client, {
            name: 'setdj',
            group: 'music',
            memberName: 'setdj',
            description: 'Sets the DJ role',
            details: "Sets the DJ role(s). This will only enable play/pause/resume/skip/stop commands to these roles.",
            examples: ['setdj Administrator', 'setdj Administrator DJ Moderator'],
            args: [
                {
                    key: 'roles',
                    label: 'roles that can be a DJ',
                    prompt: 'Put valid roles',
                    type: 'string',
                    wait: 5
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
        const roles = args.roles.split(' ');
        const guildRoles = msg.guild.roles.map(role => role.name);
        // verify that given roles are valid
        const isInputValid = roles.every(role => guildRoles.includes(role));
        if (!isInputValid) {
            return msg.reply("Please provide valid roles that exists on this server");
        }

        const guildId = msg.guild.id;
        this.player.djs[guildId] = roles;
        const suffix = roles.length > 1 ? 's' : '';
        return msg.channel.send(`:white_check_mark: DJ set to \`${roles}\` role${suffix}`);
    }
};