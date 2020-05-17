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
    const level_name = command.arguments.join(' ');
    if (!code) {
      ts.userError(ts.message('error.noCode'));
    } else {
      code = code.toUpperCase();
    }
    if (!level_name) ts.userError(ts.message('rename.noNewName'));
    if (ts.isSpecialDiscordString(level_name))
      ts.userError(ts.message('error.specialDiscordString'));
    const player = await ts.get_user(message);
    const level = await ts.getExistingLevel(code);

    if (!(level.creator == player.name || player.is_mod))
      ts.userError(ts.message('rename.noPermission', level));
    if (level.level_name == level_name)
      ts.userError(ts.message('rename.alreadyName', level));

    await ts.db.Levels.query().patch({ level_name }).where({ code });

    const reply = ts.message('rename.success', {
      new_level_name: level_name,
      ...level,
    });
    await message.channel.send(player.user_reply + reply);
  }
}
module.exports = TSRename;
