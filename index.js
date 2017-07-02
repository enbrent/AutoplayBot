import Discord from 'discord.js';

const TOKEN_ID = 'MzMxMDY4MDYzMjQ2MDU3NDgy.DDqLTg.LMtvgH9S4EAMPQe60Co5mIEUlx8';
const MSG_IDENTIFIER = '.';

const client = new Discord.Client();


client.on('ready', () => {
    console.log('I am ready');
});

client.on('message', message => {
    let content = message.content.trim();
    console.log(content);
    if(content.startsWith(MSG_IDENTIFIER)) {
        content = content.substring(1);
        if(content === 'hi') {
            message.channel.send('whatup');
        }
    }
});

client.login(TOKEN_ID);