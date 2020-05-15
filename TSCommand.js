const { Command } = require('discord-akairo');
const TS = require('./TS.js');
const DiscordLog = require('./DiscordLog');
class TSCommand extends Command {

    async tsexec(ts,message,args){

    }

    /**
     * Overide this to do checks if a command runs or not
     * @param {TS} ts 
     * @param {object} message 
     * @returns {boolean}
     */
    async canRun(ts,message){
        return true
    }

    async exec(message,args) {
        let ts;
        try {
            ts=TS.teams(message.guild.id)
            if(!await this.canRun(ts,message)){
                DiscordLog.log(ts.makeErrorObj(`can't run: ${message.content}`,message),ts.client)
                return false;
            }
            args.command=ts.parse_command(message)
            await this.tsexec(ts,message,args)
        } catch(error){
            if(ts){
                await message.reply(ts.getUserErrorMsg(error,message))
            } else {
                await message.reply(error)
                DiscordLog.log(error,this.client)
            }
            
            
            //throw error;
        } finally{
            if(typeof TS.promisedCallback==="function") TS.promisedCallback(); 
        }
        
    }
}
module.exports = TSCommand;