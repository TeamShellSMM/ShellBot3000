const TSCommand = require('../TSCommand.js');

class playersRandom extends TSCommand {
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
                    default: '1',
                },{
                    id: 'maxDifficulty',
                    type: 'string',
                    default: ''
                }],
           channelRestriction: 'guild'
        });
    }

    async tsexec(ts,message,args) {
      args.discord_id=message.author.id
      let rand=await ts.randomLevel(args)

      let randomEmbed=ts.levelEmbed(rand.level).setAuthor(ts.message("random.embedTitlePlayers",{players:args.players}))
      await message.channel.send(rand.player.user_reply)
      await message.channel.send(randomEmbed)
    }
}
module.exports = playersRandom;