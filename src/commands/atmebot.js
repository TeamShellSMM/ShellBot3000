const TSCommand = require('../TSCommand.js');

class atmebot extends TSCommand {
  constructor() {
    super('atmebot', {
      aliases: ['atmebot', 'atme', 'dontatmebot', 'dontatme'],
      channelRestriction: 'guild',
    });
  }

  async tsexec(ts, message) {
    const atmeCommands = ['atmebot', 'atme'];
    const command = ts.parse_command(message);
    const player = await ts.getUser(message);
    let atmeVal;
    let alreadyError;
    let msg;

    if (atmeCommands.indexOf(command.command) !== -1) {
      atmeVal = 1;
      alreadyError = ts.message('atme.already');
      msg = ts.message('atme.willBe');
    } else {
      atmeVal = null;
      alreadyError = ts.message('atme.alreadyNot');
      msg = ts.message('atme.willBeNot');
    }

    if (player.atme === atmeVal) ts.userError(alreadyError);

    await ts.db.Members.query()
      .patch({ atme: atmeVal })
      .where({ discord_id: message.author.id });

    await message.channel.send(player.user_reply + msg);
  }
}
module.exports = atmebot;
