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
      args: [
        {
          id: 'searchTerm',
          type: 'text',
          match: 'rest',
          default: null,
        },
      ],
      quoted: true,
    });
  }

  async tsexec(ts, message, { searchTerm }) {
    const player = await ts.getUser(message);

    const searchTerms = searchTerm.split(' ');

    const args = searchTerms.map((s) => `%${s}%`);
    const sql = JSON.parse(JSON.stringify(searchTerms))
      .fill('level_name like ?')
      .join(' and ');

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
            searchTerms,
          )}" by "${l.creator}"`,
      )
      .join('\n');

    await ts.discord.messageSend(
      message,
      player.userReply +
        (await ts.message('search.foundNum', { levelsFound })) +
        (levelsFound > 5
          ? await ts.message('search.showingOnly', { num_shown: 5 })
          : '') +
        (levelsStr ? `\n${levelsStr}` : ''),
    );
  }
}
module.exports = levelsearch;
