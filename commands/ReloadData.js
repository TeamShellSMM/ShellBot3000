const { Command } = require('discord-akairo');

class ReloadData extends Command {
    constructor() {
        super('refresh', {
            aliases: ['refresh'],
            ownerOnly: true,
            category: 'owner'
        });
    }

    async exec(message, args) {
        var ts=TS_LIST[message.guild.id]
        await ts.load()
        return message.reply(`Reloaded data!`);
    }
}

module.exports = ReloadData;