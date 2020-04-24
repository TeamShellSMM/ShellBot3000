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
        let player=await ts.db.Members.query()
            .where({discord_id:message.author.id})
            .where({is_mod:1})
            .first()
        if(player){
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