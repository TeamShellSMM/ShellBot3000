const { Command } = require('discord-akairo');
const Plays = require('../models/Plays');

class TSRemoveclear extends Command {
    constructor() {
        super('tsremoveclear', {
           aliases: ['tsremoveclear',"removeclear"],
            args: [{
                    id: 'code',
                    type: 'string',
                    default: ''
                }],
           channelRestriction: 'guild'
        });
    }

    async exec(message,args) {
        try {
            var ts=get_ts(message.guild.id)
          } catch(error){
            message.reply(error)
            throw error;
          }
          
        try{
          args.completed=0
          args.discord_id=message.author.id
          let msg=await ts.clear(args)
          message.channel.send(msg)
        } catch(error){
            message.reply(ts.getUserErrorMsg(error))
        }
    }
}
module.exports = TSRemoveclear;