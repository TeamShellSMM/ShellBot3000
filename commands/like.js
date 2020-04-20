const TSCommand = require('../TSCommand.js');

class tslike extends TSCommand {
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

    async tsexec(ts,message,args) {
      const likeCommands=["tslike","like"];
      const command=ts.parse_command(message)
      args.discord_id=message.author.id
      args.like=likeCommands.indexOf(command.command)!=-1?1:0
      let msg=await ts.clear(args)
      message.channel.send(msg)
    }
}
module.exports = tslike;