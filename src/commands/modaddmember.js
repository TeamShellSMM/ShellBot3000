const TSCommand = require('../TSCommand.js');

class ModAddMember extends TSCommand {
  constructor() {
    super('tsmodaddmember', {
      aliases: ['tsmodaddmember', 'modaddmember'],
      args: [
        {
          id: 'name',
          type: 'string',
          default: null,
        },
      ],
      channelRestriction: 'guild',
    });
  }

  async canRun(ts, message) {
    return ts.modOnly(ts.discord.getAuthor(message));
  }

  async tsexec(ts, message) {
    const command = ts.parseCommand(message);

    let name;
    if (command.arguments.length > 0) {
      name = command.arguments.shift();
    } else {
      ts.userError(ts.message('modaddmember.missingParam'));
    }

    if (ts.isSpecialDiscordString(name))
      ts.userError(ts.message('error.specialDiscordString'));

    name = name.replace(/\\/g, '');

    const player = await ts.db.Members.query()
      .whereRaw('lower(name) = ?', [name.toLowerCase()])
      .first();
    if (player && player.is_banned) {
      ts.userError(ts.message('error.userBanned'));
    }
    if (player) {
      ts.userError(ts.message('register.nameTaken', { name: name }));
    }

    await ts.db.Members.query().insert({
      name: name,
      discord_name: name,
    });

    await ts.discord.reply(
      message,
      ts.message('modaddmember.success', { name: name }),
    );
  }
}
module.exports = ModAddMember;
