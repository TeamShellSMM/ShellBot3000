const TSCommand = require('../TSCommand.js');

class TSClear extends TSCommand {
    constructor() {
        super('tsclear', {
           aliases: ['tsclear','clear'],
            args: [{
                    id: 'code',
                    type: 'string',
                    default: ''
                },{
                    id: 'difficulty',
                    type: 'string',
                    default: ''
                },{
                    id: 'like',
                    type: 'string',
                    default: ''
                }],
           channelRestriction: 'guild'
        });
    }

    async tsexec(ts,message,args) {
        args.discord_id=message.author.id
        args.completed=1
        let msg=await ts.clear(args)
        await message.channel.send(msg)
    }
}
module.exports = TSClear;