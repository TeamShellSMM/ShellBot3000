const { Command } = require('discord-akairo');
const Plays = require('../models/Plays');

class TSClear extends Command {
    constructor() {
        super('tsclear', {
           aliases: ['tsclear','clear'],
            args: [{
                    id: 'code',
                    type: 'string',
                    default: ''
                },{
                    id: 'difficulty',
                    type: 'string',
                    default: ''
                },{
                    id: 'like',
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
          args.discord_id=message.author.id
          args.completed=1
          let msg=await ts.clear(args)
          message.channel.send(msg)
        } catch(error){
            message.reply(ts.getUserErrorMsg(error))
        }
    }
}
module.exports = TSClear;