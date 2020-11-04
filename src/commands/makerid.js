const TSCommand = require('../TSCommand.js');

class MakerId extends TSCommand {
  constructor() {
    super('makerid', {
      aliases: ['makerid'],
      args: [
        {
          id: 'code',
          description: 'makerId',
          type: 'makerid',
          default: null,
        },
        {
          id: 'name',
          description: 'makerName',
          type: 'text',
          match: 'rest',
          default: null,
        },
      ],
      channelRestriction: 'guild',
    });
  }

  async tsexec(ts, message, { code, name }) {
    const player = await ts.getUser(message);

    const existingMember = await ts.db.Members.query()
      .where({ maker_id: code })
      .first();
    if (
      existingMember &&
      existingMember.discord_id !== player.discord_id
    ) {
      ts.userError(
        await ts.message('makerid.existing', {
          code,
          name: existingMember.name,
        }),
      );
    }

    await ts.db.Members.query()
      .patch({ maker_id: code, maker_name: name })
      .where({ discord_id: ts.discord.getAuthor(message) });

    await ts.discord.messageSend(
      message,
      player.userReply +
        (await ts.message('makerid.success', { code, name })),
    );
  }
}
module.exports = MakerId;
