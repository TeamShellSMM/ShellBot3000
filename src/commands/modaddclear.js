const TSCommand = require('../TSCommand.js');

class TSModAddClear extends TSCommand {
  constructor() {
    super('tsmodaddclear', {
      aliases: ['tsmodaddclear', 'modaddclear'],
      args: [
        {
          id: 'memberName',
          type: 'string',
          default: null,
        },
        {
          id: 'code',
          type: 'uppercase',
          default: null,
        },
        {
          id: 'difficulty',
          type: 'string',
          default: null,
        },
        {
          id: 'liked',
          type: 'string',
          default: null,
        },
      ],
      channelRestriction: 'guild',
    });
  }

  async tsexec(ts, message, args) {
    let member = await ts.db.Members.query()
      .whereRaw('lower(name) = ?', [args.memberName.toLowerCase()])
      .first();

    if (!member) {
      ts.userError(
        ts.message('modaddlevel.memberNotFound', {
          name: args.memberName,
        }),
      );
    }

    member = await ts.decorateMember(member);

    const msg = await ts.clear({
      ...args,
      member: member,
      completed: 1,
    });
    await ts.discord.messageSend(message, msg);
  }
}
module.exports = TSModAddClear;
