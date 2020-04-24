const TSCommand = require('../TSCommand.js');
class tsinfo extends TSCommand {
    constructor() {
        super('tsinfo', {
           aliases: ['tsinfo','info','level'],
            args: [{
                    id: 'code',
                    type: 'string',
                    default: ''
                }],
           channelRestriction: 'guild'
        });
    }

    async tsexec(ts,message,args) {
      args.code=args.code.toUpperCase();
      await ts.gs.loadSheets(["Raw Levels"]);
      const player=await ts.get_user(message);
      var level=ts.getExistingLevel(args.code)

      var randomEmbed=ts.levelEmbed(level)

      await message.channel.send(player.user_reply)
      await message.channel.send(randomEmbed)
    }
}
module.exports = tsinfo;