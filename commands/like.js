const { Command } = require('discord-akairo');
const Plays = require('../models/Plays');

class tslike extends Command {
    constructor() {
        super('tslike', {
           aliases: ['tslike','like','tsunlike','unlike'],
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
          const likeCommands=["tslike","like"];
          const command=ts.parse_command(message)
          args.discord_id=message.author.id
          args.like=likeCommands.indexOf(command.command)!=-1?1:0
          let msg=await ts.clear(args)
          message.channel.send(msg)
        } catch(error){
            message.reply(ts.getUserErrorMsg(error))
        }
    }
}
module.exports = tslike;