const TSCommand = require('../TSCommand.js');
class tsdifficulty extends TSCommand {
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

    async tsexec(ts,message,args) {
      args.discord_id=message.author.id
      let msg=await ts.clear(args)
      await message.channel.send(msg)
    }
}
module.exports = tsdifficulty;