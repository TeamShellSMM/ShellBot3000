const { Command } = require('discord-akairo');
const Plays = require('../models/Plays');

class tsrandom extends Command {
    constructor() {
        super('tsrandom', {
           aliases: ['tsrandom','random'],
            args: [{
                    id: 'minDifficulty',
                    type: 'string',
                    default: ''
                },{
                    id: 'maxDifficulty',
                    type: 'string',
                    default: ''
                }],
           channelRestriction: 'guild'
        });
    }

    async exec(message,args) {
      try {
         if(args.minDifficulty && !ts.valid_difficulty(args.minDifficulty)){
          ts.userError(args.maxDifficulty? "You didn't specify a valid minimum difficulty" : "You didn't specify a valid difficulty")
        }


        if(args.maxDifficulty){
          if(!ts.valid_difficulty(args.maxDifficulty))
            ts.userError("You didn't specify a valid maxDifficulty")
        } else {
          if(args.minDifficulty){
            args.maxDifficulty=args.minDifficulty
          }
        }

        if(args.minDifficulty>args.maxDifficulty){
          let temp=args.maxDifficulty
          args.maxDifficulty=args.minDifficulty
          args.minDifficulty=temp
        }

        args.discord_id=message.author.id

        var rand=await ts.randomLevel(args)

        //console.time("Making embed and send")
        var randomEmbed=ts.levelEmbed(rand.level).setAuthor("ShellBot rolled a d97 and found this level for you")
        await message.channel.send(rand.player.user_reply)
        await message.channel.send(randomEmbed)
        //console.timeEnd("Making embed and send")
      } catch (error) {
        message.reply(ts.getUserErrorMsg(error))
      }
    }
}
module.exports = tsrandom;