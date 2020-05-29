const TSCommand = require('../TSCommand.js');

function highlight(levelName, needle) {
  let ret = levelName.replace(/_/g, '\\_');
  needle.forEach((n) => {
    ret = ret.replace(new RegExp(`(${n})`, 'gi'), '***$1***');
  });
  ret = ret.replace(/\*\*\*\*\*\*/g, '');
  return ret;
}

class levelsearch extends TSCommand {
  constructor() {
    super('levelsearch', {
      aliases: ['levelsearch', 'search'],
      channelRestriction: 'guild',
    });
  }

  async tsexec(ts, message, { command }) {
    const player = await ts.getUser(message);
    if (command.arguments.length === 0)
      ts.userError('error.noSearch');

    const sql = new Array(command.arguments.length)
      .fill('level_name like ?')
      .join(' and ');
    const args = command.arguments.map((s) => `%${s}%`);

    const levels = await ts
      .getLevels()
      .whereIn('levels.status', ts.SHOWN_IN_LIST)
      .whereRaw(sql, args);
    const levelsFound = levels.length;
    const levelsStr = levels
      .slice(0, 5)
      .map(
        (l) =>
          `• \`${l.code}\` - "${highlight(
            l.level_name,
            command.arguments,
          )}" by "${l.creator}"`,
      )
      .join('\n');

    await ts.discord.messageSend(
      message,
      player.userReply +
        ts.message('search.foundNum', { levelsFound }) +
        (levelsFound > 5
          ? ts.message('search.showingOnly', { num_shown: 5 })
          : '') +
        (levelsStr ? `\n${levelsStr}` : ''),
    );
  }
}
module.exports = levelsearch;
