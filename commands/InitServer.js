const { Command } = require('discord-akairo');
let Teams = require('../models/Teams.js');

class InitServer extends Command {
    constructor() {
        super('initserver', {
            aliases: ['initserver'],
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

module.exports = InitServer;