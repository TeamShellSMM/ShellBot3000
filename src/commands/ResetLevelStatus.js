const TSCommand = require('../TSCommand.js');

class ResetLevelStatus extends TSCommand {
  constructor() {
    super('resetstatus', {
      aliases: ['resetstatus'],
      args: [
        {
          id: 'code',
          type: 'uppercase',
          default: null,
        },
      ],
    });
  }

  async tsexec(ts, message, { code }) {
    if (!code) ts.userError(await ts.message('error.noCode'));

    const level = await ts.getExistingLevel(code, true);
    if (level.status === ts.LEVEL_STATUS.PENDING)
      ts.userError(await ts.message('resetStatus.alreadyPending'));

    await ts.db.Levels.query()
      .patch({
        status: ts.LEVEL_STATUS.PENDING,
        old_status: level.status,
        new_code: null,
      })
      .where({ code });
    await ts.discord.reply(
      message,
      await ts.message('resetStatus.successful', level),
    );
  }
}

module.exports = ResetLevelStatus;
