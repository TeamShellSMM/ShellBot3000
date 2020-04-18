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
        try{
          var ts=TS_LIST[message.guild.id]
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