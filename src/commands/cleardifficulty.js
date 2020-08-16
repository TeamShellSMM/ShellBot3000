const TSCommand = require('../TSCommand.js');

class TSClearDifficulty extends TSCommand {
  constructor() {
    super('cleardifficulty', {
      aliases: ['cleardifficulty', 'cleardifficultyvote'],
      channelRestriction: 'guild',
    });
  }

  async tsexec(ts, message) {
    const { code } = ts.getCodeArgument(message);
    const level = await ts.getExistingLevel(code);

    await ts.db.Plays.query()
      .where({ code: level.id })
      .patch({ difficulty_vote: null });

    await ts.recalculateAfterUpdate({ code });

    await ts.discord.messageSend(
      message,
      await ts.message('clearDifficulty.success', level),
    );
  }
}
module.exports = TSClearDifficulty;
