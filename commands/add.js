const TSCommand = require('../TSCommand.js');

class tsadd extends TSCommand {
    constructor() {
        super('tsadd', {
           aliases: ['tsadd','add'],
           channelRestriction: 'guild'
        });
    }


    async tsexec(ts,message) {
      let command=ts.parse_command(message);
      let code=command.arguments.shift()
      if(code) code=code.toUpperCase()
      const level_name=command.arguments.join(" ")
      const { reply, player } = await ts.addLevel({ code,level_name,discord_id:message.author.id})
      await message.channel.send(player.user_reply+reply)
    }
}
module.exports = tsadd;