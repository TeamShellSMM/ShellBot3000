const TSCommand = require('../TSCommand.js');

class atmebot extends TSCommand {
  constructor() {
    super('atmebot', {
      aliases: ['atmebot', 'atme', 'dontatmebot', 'dontatme'],
      channelRestriction: 'guild',
    });
  }

  async tsexec(ts, message, args) {
    const atmeCommands = ['atmebot', 'atme'];
    const command = ts.parse_command(message);
    const player = await ts.get_user(message);

    if (atmeCommands.indexOf(command.command) != -1) {
      var atmeVal = true;
      var alreadyError = ts.message('atme.already');
      var msg = ts.message('atme.willBe');
    } else {
      var atmeVal = null;
      var alreadyError = ts.message('atme.alreadyNot');
      var msg = ts.message('atme.willBeNot');
    }

    if (player.atme == atmeVal) ts.userError(alreadyError);

    await ts.db.Members.query()
      .patch({ atme: atmeVal })
      .where({ discord_id: message.author.id });

    await message.channel.send(player.user_reply + msg);
  }
}
module.exports = atmebot;
