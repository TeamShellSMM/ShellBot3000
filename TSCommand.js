const { Command } = require('discord-akairo');
class TSCommand extends Command {

    async tsexec(ts,message,args){

    }

    defaultMessage(obj){
        DEFAULTMESSAGES=Object.assign(DEFAULTMESSAGES,obj)
    }

    async canRun(ts,message){
        return true
    }

    async exec(message,args) {
        if(process.argv[2]==='--test' && typeof global.TESTREPLY === "function" ){
            message.reply=global.TESTREPLY
            message.channel.send=global.TESTREPLY
        }
        let ts;
        try {
            ts=get_ts(message.guild.id)
        } catch(error){
            message.reply(error)
            throw error;
        }
        
        if(!await this.canRun(ts,message)){
            console_error(ts.makeErrorObj(`can't run: ${message.content}`,message))
            return false;
        }
        

        try{
            args.command=ts.parse_command(message)
            await this.tsexec(ts,message,args)
        } catch(error){
            message.reply(ts.getUserErrorMsg(error,message))
        }
        
    }
}
module.exports = TSCommand;