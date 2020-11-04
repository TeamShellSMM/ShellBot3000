const TSCommand = require('../TSCommand.js');

class ResetLevelStatus extends TSCommand {
  constructor() {
    super('resetstatus', {
      aliases: ['resetstatus'],
      args: [
        {
          id: 'level',
          description: 'levelCode',
          type: 'level:any',
          default: null,
        },
      ],
      quoted: true,
    });
  }

  async tsexec(ts, message, { level }) {
    if (level.status === ts.LEVEL_STATUS.PENDING)
      ts.userError(await ts.message('resetStatus.alreadyPending'));

    await ts.db.Levels.query()
      .patch({
        status: ts.LEVEL_STATUS.PENDING,
        old_status: level.status,
        new_code: null,
      })
      .where({ code: level.code });
    await ts.discord.reply(
      message,
      await ts.message('resetStatus.successful', level),
    );
  }
}

module.exports = ResetLevelStatus;
