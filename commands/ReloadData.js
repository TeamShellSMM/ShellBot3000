const { Command } = require('discord-akairo');

class ReloadData extends Command {
    constructor() {
        super('refresh', {
            aliases: ['refresh'],
            ownerOnly: true,
            category: 'owner'
        });
    }

    async exec(message, args) {
        // `this` refers to the command object.
        await ts.load()
        return message.reply(`Reloaded data!`);
    }
}

module.exports = ReloadData;