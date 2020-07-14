const TSCommand = require('../TSCommand.js');

class AmendCode extends TSCommand {
  constructor() {
    super('ammendcode', {
      aliases: ['ammendcode', 'amendcode'],
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
    return ts.modOnly(ts.discord.getAuthor(message));
  }

  async tsexec(ts, message, { oldCode, newCode }) {
    if (!oldCode) ts.userError(ts.message('reupload.noOldCode'));
    if (!newCode) ts.userError(ts.message('reupload.noNewCode'));

    if (!ts.validCode(oldCode)) {
      ts.userError(ts.message('reupload.invalidOldCode'));
    }
    if (!ts.validCode(newCode)) {
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

    let notify = false;
    const existingPendingChannel = ts.discord.channel(
      oldCode,
      ts.channels.levelDiscussionCategory,
    );
    if (existingPendingChannel) {
      await ts.labelPendingLevel(
        { ...existingLevel, code: newCode },
        oldCode,
      );
      notify = true;
    }

    const existingAuditChannels = ts.discord.channels(
      oldCode,
      ts.channels.levelAuditCategory,
    );
    for (const existingAuditChannel of existingAuditChannels) {
      const label = existingAuditChannel.name
        .toLowerCase()
        .replace(oldCode.toLowerCase(), '');

      await ts.labelAuditChannel(
        { ...existingLevel, code: newCode },
        oldCode,
        label,
      );
      notify = true;
    }

    if (notify) {
      await ts.discord.send(
        newCode,
        ts.message('ammendcode.notify', { oldCode, newCode }),
      );
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

module.exports = AmendCode;
