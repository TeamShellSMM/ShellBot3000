const TSCommand = require('../TSCommand.js');

class TSRename extends TSCommand {
  constructor() {
    super('tsrename', {
      aliases: ['tsrename', 'rename'],
      channelRestriction: 'guild',
    });
  }

  async tsexec(ts, message) {
    const command = ts.parse_command(message);
    let code = command.arguments.shift();
    const levelName = command.arguments.join(' ');
    if (!code) {
      ts.userError(ts.message('error.noCode'));
    } else {
      code = code.toUpperCase();
    }
    if (!levelName) ts.userError(ts.message('rename.noNewName'));
    if (ts.isSpecialDiscordString(levelName))
      ts.userError(ts.message('error.specialDiscordString'));
    const player = await ts.getUser(message);
    const level = await ts.getExistingLevel(code);

    if (!(level.creator === player.name || player.is_mod))
      ts.userError(ts.message('rename.noPermission', level));
    if (level.level_name === levelName)
      ts.userError(ts.message('rename.alreadyName', level));

    await ts.db.Levels.query()
      .patch({ level_name: levelName })
      .where({ code });

    const reply = ts.message('rename.success', {
      new_level_name: levelName,
      ...level,
    });
    await message.channel.send(player.user_reply + reply);
  }
}
module.exports = TSRename;
