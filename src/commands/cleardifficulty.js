const TSCommand = require('../TSCommand.js');

class TSClearDifficulty extends TSCommand {
  constructor() {
    super('cleardifficulty', {
      aliases: ['cleardifficulty', 'cleardifficultyvote'],
      channelRestriction: 'guild',
      args: [
        {
          id: 'level',
          description: 'levelCode',
          type: 'level',
          default: null,
        },
      ],
      quoted: true,
    });
  }

  async tsexec(ts, message, { level }) {
    await ts.db.Plays.query()
      .where({ code: level.id })
      .patch({ difficulty_vote: null });

    await ts.recalculateAfterUpdate({ code: level.code });

    await ts.discord.messageSend(
      message,
      await ts.message('clearDifficulty.success', level),
    );
  }
}
module.exports = TSClearDifficulty;
