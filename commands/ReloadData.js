const TSCommand = require('../TSCommand.js');
const config = require('../config.json');

class ReloadData extends TSCommand {
    constructor() {
        super('refresh', {
            aliases: ['refresh'],
            channelRestriction: 'guild'
        });
    }

    async canRun(ts,message){
        if(config.ownerID && config.ownerID.indexOf(message.author.id)!==-1){
            return true;
        }
        if(config.devs && config.devs.indexOf(message.author.id)!==-1){
            return true;
        }
        
        if(ts.is_mod({discord_id:message.author.id})){
            return true
        }
        
        return false;
    }
    

    async tsexec(ts,message, args){

        await ts.load()
        return message.reply(`Reloaded data!`);
    }
}

module.exports = ReloadData;