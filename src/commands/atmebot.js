const TSCommand = require('../TSCommand.js');

class atmebot extends TSCommand {
  constructor() {
    super('atme', {
      aliases: ['atmebot', 'atme', 'dontatmebot', 'dontatme'],
      channelRestriction: 'guild',
    });
  }

  async tsexec(ts, message, { command }) {
    const atmeCommands = ['atmebot', 'atme'];
    const player = await ts.getUser(message);
    let atmeVal;
    let alreadyError;
    let msg;

    if (atmeCommands.indexOf(command.command) !== -1) {
      atmeVal = 1;
      alreadyError = await ts.message('atme.already');
      msg = await ts.message('atme.willBe');
    } else {
      atmeVal = null;
      alreadyError = await ts.message('atme.alreadyNot');
      msg = await ts.message('atme.willBeNot');
    }

    if (player.atme === atmeVal) ts.userError(alreadyError);

    await ts.db.Members.query()
      .patch({ atme: atmeVal })
      .where({ discord_id: ts.discord.getAuthor(message) });

    await ts.discord.messageSend(message, player.userReply + msg);
  }
}
module.exports = atmebot;
