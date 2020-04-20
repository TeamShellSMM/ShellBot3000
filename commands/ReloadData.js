const TSCommand = require('../TSCommand.js');

class ReloadData extends TSCommand {
    constructor() {
        super('refresh', {
            aliases: ['refresh'],
            ownerOnly: true,
            category: 'owner'
        });
    }

    async tsexec(ts,message, args){
        await ts.load()
        return message.reply(`Reloaded data!`);
    }
}

module.exports = ReloadData;