const TSCommand = require('../TSCommand.js');
const config = require('../config.json');

class ReloadData extends TSCommand {
    constructor() {
        super('refresh', {
            aliases: ['refresh'],
            channelRestriction: 'guild'
        });
    }

    canRun(ts,message){
        if(config.ownerID && config.ownerID.indexOf(message.author.id)!==-1){
            return true;
        }
        if(config.devs && config.devs.indexOf(message.author.id)!==-1){
            return true;
        }
        const player=ts.gs.select("Raw Members",{"discord_id":message.author.id,"shelder":"1"},true)
        if(player.length>0){
            return true
        }
        
        return false;
    }
    

    async tsexec(ts,message, args){
        
        if(!this.canRun(ts,message)){
            return false;
        }

        await ts.load()
        return message.reply(`Reloaded data!`);
    }
}

module.exports = ReloadData;