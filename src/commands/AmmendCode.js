const TSCommand = require('../TSCommand.js');

class AmmendCode extends TSCommand {
  constructor() {
    super('ammendcode', {
      aliases: ['ammendcode'],
      args: [
        {
          id: 'oldCode',
          type: 'uppercase',
          default: null,
        },
        {
          id: 'newCode',
          type: 'uppercase',
          default: null,
        },
      ],
    });
  }

  async canRun(ts, message) {
    return ts.modOnly(message.author.id);
  }

  async tsexec(ts, message, { oldCode, newCode }) {
    if (!oldCode) ts.userError(ts.message('reupload.noOldCode'));
    if (!newCode) ts.userError(ts.message('reupload.noNewCode'));

    if (!ts.valid_code(oldCode)) {
      ts.userError(ts.message('reupload.invalidOldCode'));
    }
    if (!ts.valid_code(newCode)) {
      ts.userError(ts.message('reupload.invalidNewCode'));
    }
    if (oldCode === newCode) {
      ts.userError(ts.message('reupload.sameCode'));
    }

    const existingLevel = await ts.getExistingLevel(oldCode, true);
    const newCodeCheck = await ts
      .getLevels()
      .where({ code: newCode })
      .first();
    if (newCodeCheck) {
      ts.userError(
        ts.message('add.levelExisting', { level: newCodeCheck }),
      );
    }

    await ts.db.Levels.query()
      .patch({ code: newCode })
      .where({ code: oldCode });

    const guild = ts.getGuild();
    const existingChannel = guild.channels.find(
      (channel) =>
        channel.name === oldCode.toLowerCase() &&
        channel.parentID === ts.channels.levelDiscussionCategory,
    );
    if (existingChannel) {
      await ts.discord.renameChannel(oldCode, newCode);
    }

    await ts.discord.reply(
      message,
      ts.message('ammendCode.success', {
        level: existingLevel,
        oldCode,
        newCode,
      }),
    );
  }
}

module.exports = AmmendCode;
