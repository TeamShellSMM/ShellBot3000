const TSCommand = require('../TSCommand.js');

class tslike extends TSCommand {
  constructor() {
    super('tslike', {
      aliases: ['tslike', 'like', 'tsunlike', 'unlike'],
      args: [
        {
          id: 'code',
          type: 'uppercase',
          default: null,
        },
      ],
      channelRestriction: 'guild',
    });
  }

  async tsexec(ts, message, args) {
    const likeCommands = ['tslike', 'like'];
    const command = ts.parseCommand(message);
    const clearArgs = {
      ...args,
      discord_id: message.author.id,
      liked: likeCommands.includes(command.command) ? 1 : 0,
    };
    const msg = await ts.clear(clearArgs);
    await message.channel.send(msg);
  }
}
module.exports = tslike;
