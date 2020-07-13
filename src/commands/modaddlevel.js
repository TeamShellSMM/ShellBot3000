const TSCommand = require('../TSCommand.js');

class TSModAddLevel extends TSCommand {
  constructor() {
    super('tsmodaddlevel', {
      aliases: ['tsmodaddlevel', 'modaddlevel'],
      channelRestriction: 'guild',
    });
  }

  async canRun(ts, message) {
    return ts.modOnly(ts.discord.getAuthor(message));
  }

  async tsexec(ts, message) {
    const command = ts.parseCommand(message);
    const memberName = command.arguments.shift();
    let code = command.arguments.shift();
    if (code) code = code.toUpperCase();

    let member = await ts.db.Members.query()
      .whereRaw('lower(name) = ?', [memberName.toLowerCase()])
      .first();

    if (!member) {
      ts.userError(
        ts.message('modaddlevel.memberNotFound', {
          name: memberName,
        }),
      );
    }

    member = await ts.decorateMember(member);

    const levelName = command.arguments.join(' ');
    const { reply } = await ts.addLevel({
      code,
      level_name: levelName,
      member: member,
    });
    await ts.discord.messageSend(message, reply);
  }
}
module.exports = TSModAddLevel;
