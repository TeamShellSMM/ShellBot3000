const TSCommand = require('../TSCommand.js');

class tsrandom extends TSCommand {
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

    async tsexec(ts,message,args) {
        args.discord_id=message.author.id
        let rand=await ts.randomLevel(args)
        let randomEmbed=ts.levelEmbed(rand.level).setAuthor("ShellBot rolled a d97 and found this level for you")
        await message.channel.send(rand.player.user_reply)
        await message.channel.send(randomEmbed)
    }
}
module.exports = tsrandom;