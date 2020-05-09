const { Command } = require('discord-akairo');
const TS = require('./TS.js');
const DiscordLog = require('./DiscordLog');
class TSCommand extends Command {

    async tsexec(ts,message,args){

    }

    async canRun(ts,message){
        return true
    }

    async exec(message,args) {
        let ts;
        try {
            ts=TS.teams(message.guild.id)
        } catch(error){
            await message.reply(error)
            throw error;
        }
        
        if(!await this.canRun(ts,message)){
            DiscordLog.log(ts.makeErrorObj(`can't run: ${message.content}`,message),ts.client)
            return false;
        }

        try{
            args.command=ts.parse_command(message)
            await this.tsexec(ts,message,args)
        } catch(error){
            await message.reply(ts.getUserErrorMsg(error,message))
        }
        
        if(typeof ts.promisedCallback==="function") ts.promisedCallback(); 
    }
}
module.exports = TSCommand;