const { Command } = require('discord-akairo');
const Plays = require('../models/Plays');

class playersRandom extends Command {
    constructor() {
        super('playersRandom', {
           aliases: ['playersRandom'],
           split: 'quoted',
            args: [{
                    id: 'players',
                    type: 'string',
                    default: ''
                    },{
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
        
        args.discord_id=message.author.id
        let rand=await ts.randomLevel(args)

        let randomEmbed=ts.levelEmbed(rand.level).setAuthor("ShellBot rolled a d97 and found this level for "+args.players)
        await message.channel.send(rand.player.user_reply)
        await message.channel.send(randomEmbed)

      } catch (error) {
        message.reply(ts.getUserErrorMsg(error))
      }
    }
}
module.exports = playersRandom;