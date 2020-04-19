const { Command } = require('discord-akairo');
const Plays = require('../models/Plays');
class tsdifficulty extends Command {
    constructor() {
        super('tsdifficulty', {
           aliases: ['tsdifficulty','difficulty'],
            args: [{
                    id: 'code',
                    type: 'string',
                    default: ''
                },{
                    id: 'difficulty',
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
          let msg=await ts.clear(args)
          message.channel.send(msg)

        } catch(error){
            message.reply(ts.getUserErrorMsg(error))
        }
    }
}
module.exports = tsdifficulty;