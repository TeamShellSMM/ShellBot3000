const TSCommand = require('../TSCommand.js');

class SetWorld extends TSCommand {
  constructor() {
    super('setworld', {
      aliases: ['setworld'],
      args: [
        {
          id: 'worldCount',
          type: 'int',
          default: null,
        },
        {
          id: 'levelCount',
          type: 'int',
          default: null,
        },
        {
          id: 'worldName',
          type: 'text',
          match: 'rest',
          default: null,
        },
      ],
      quoted: true,
      channelRestriction: 'guild',
    });
  }

  async tsexec(ts, message, {worldCount, levelCount, worldName}) {
    const player = await ts.getUser(message);

    if (!player.maker_id || !player.maker_name) {
      ts.userError(await ts.message('setworld.noMakerId'));
    }

    await ts.db.Members.query()
      .patch({
        world_world_count: worldCount,
        world_level_count: levelCount,
        world_description: worldName,
      })
      .where({ discord_id: ts.discord.getAuthor(message) });

    ts.discord.messageSend(
      message,
      player.userReply + (await ts.message('setworld.success')),
    );
  }
}
module.exports = SetWorld;
