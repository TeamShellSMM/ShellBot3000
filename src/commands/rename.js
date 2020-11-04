const TSCommand = require('../TSCommand.js');

class TSRename extends TSCommand {
  constructor() {
    super('rename', {
      aliases: ['tsrename', 'rename'],
      channelRestriction: 'guild',
      args: [
        {
          id: 'level',
          description: 'levelCode',
          type: 'level',
          default: null,
        },
        {
          id: 'levelName',
          type: 'text',
          match: 'rest',
          default: null,
        },
      ],
      quoted: true,
    });
  }

  async tsexec(ts, message, { level, levelName }) {
    const player = await ts.getUser(message);

    if (!(level.creator === player.name || player.is_mod))
      ts.userError(await ts.message('rename.noPermission', level));
    if (level.level_name === levelName)
      ts.userError(await ts.message('rename.alreadyName', level));

    await ts.db.Levels.query()
      .patch({ level_name: levelName })
      .where({ code: level.code });

    const reply = await ts.message('rename.success', {
      new_level_name: levelName,
      ...level,
    });
    await ts.discord.messageSend(message, player.userReply + reply);
  }
}
module.exports = TSRename;
