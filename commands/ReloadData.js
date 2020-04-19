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
        try {
            var ts=get_ts(message.guild.id)
        } catch(error){
            message.reply(error)
            throw error;
        }
        
        await ts.load()
        return message.reply(`Reloaded data!`);
    }
}

module.exports = ReloadData;