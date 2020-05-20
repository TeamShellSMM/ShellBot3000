const TSCommand = require('../TSCommand.js');

class tsadd extends TSCommand {
  constructor() {
    super('tsadd', {
      aliases: ['tsadd', 'add'],
      channelRestriction: 'guild',
    });
  }

  async tsexec(ts, message) {
    const command = ts.parseCommand(message);
    let code = command.arguments.shift();
    if (code) code = code.toUpperCase();
    const levelName = command.arguments.join(' ');
    const { reply, player } = await ts.addLevel({
      code,
      level_name: levelName,
      discord_id: message.author.id,
    });
    await message.channel.send(player.userReply + reply);
  }
}
module.exports = tsadd;
