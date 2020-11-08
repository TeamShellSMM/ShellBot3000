const TSCommand = require('../TSCommand.js');

class TSModRemoveClear extends TSCommand {
  constructor() {
    super('modremoveclear', {
      aliases: ['modremoveclear'],
      args: [
        {
          id: 'member',
          description: 'memberName',
          type: 'teammember',
          default: null,
        },
        {
          id: 'level',
          description: 'levelCode',
          type: 'level',
          default: null,
        },
      ],
      channelRestriction: 'guild',
      quoted: true,
    });
  }

  async tsexec(ts, message, args) {
    const { member, level } = args;

    const author = await ts.db.Members.query()
      .where({ id: level.creator_id })
      .first();

    const play = await ts.db.Plays.query()
      .where({
        player: member.id,
        code: level.id,
        completed: 1,
      })
      .first();

    if (play) {
      await ts.clear({
        ...args,
        member: member,
        completed: 0,
        liked: 0,
      });

      await ts.discord.reply(
        message,
        await ts.message('success.modremoveclear', {
          memberName: member.name,
          levelName: level.level_name,
          authorName: author.name,
        }),
      );
    } else {
      await ts.discord.reply(
        message,
        await ts.message('modremoveclear.noClear', {
          memberName: member.name,
          levelName: level.level_name,
          authorName: author.name,
        }),
      );
    }
  }
}
module.exports = TSModRemoveClear;
