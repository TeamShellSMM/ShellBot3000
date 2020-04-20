const { Command } = require('discord-akairo');
const config = require('../config.json');

class ReloadCommand extends Command {
    constructor() {
        super('reload', {
            aliases: ['reload'],
        });
    }

    canRun(message){
        if(config.ownerID && config.ownerID.indexOf(message.author.id)!==-1){
            return true;
        }
        if(config.devs && config.devs.indexOf(message.author.id)!==-1){
            return true;
        }        
        return false;
    }

    async exec(message, args) {
        // `this` refers to the command object.
        if(!this.canRun(message)){
            return false;
        }

        await this.handler.reloadAll();
        return message.reply(`Reloaded commands`);
    }
}

module.exports = ReloadCommand;