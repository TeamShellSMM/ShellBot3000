const TSCommand = require('../TSCommand.js');

class ReloadData extends TSCommand {
  constructor() {
    super('refresh', {
      aliases: ['refresh'],
      channelRestriction: 'guild',
    });
  }

  async canRun(ts, message) {
    return ts.modOnly(message.author.id);
  }

  async tsexec(ts, message) {
    await ts.load();
    await ts.discord.reply(message, `Reloaded data!`);
  }
}

module.exports = ReloadData;
