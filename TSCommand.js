const { Command } = require('discord-akairo');
class TSCommand extends Command {

    async tsexec(ts,message,args){

    }

    defaultMessage(obj){
        DEFAULTMESSAGES=Object.assign(DEFAULTMESSAGES,obj)
    }

    async exec(message,args) {
        try {
            var ts=get_ts(message.guild.id)
        } catch(error){
            message.reply(error)
            throw error;
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