const TSCommand = require('../TSCommand.js');

class MakerId extends TSCommand {
  constructor() {
    super('makerid', {
      aliases: ['makerid'],
      args: [
        {
          id: 'code',
          type: 'uppercase',
          default: null,
        },
        {
          id: 'name',
          type: 'string',
          default: null,
        },
      ],
      channelRestriction: 'guild',
    });
  }

  async tsexec(ts, message, { code, name }) {
    if (!code) ts.userError(ts.message('makerid.noCode'));
    if (!name) ts.userError(ts.message('makerid.noName'));

    const player = await ts.getUser(message);

    if (!ts.validCode(code)) {
      ts.userError(ts.message('error.invalidMakerCode', { code }));
    }

    const existingMember = await ts.db.Members.query()
      .where({ maker_id: code })
      .first();
    if (
      existingMember &&
      existingMember.discord_id !== player.discord_id
    ) {
      ts.userError(
        ts.message('makerid.existing', {
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
        ts.message('makerid.success', { code, name }),
    );
  }
}
module.exports = MakerId;
