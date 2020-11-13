const debug = require('debug')('shellbot3000:ts');
const TSCommand = require('../TSCommand.js');

class AmendCode extends TSCommand {
  constructor() {
    super('amendcode', {
      aliases: ['ammendcode', 'amendcode'],
      args: [
        {
          id: 'existingLevel',
          description: 'oldCode',
          type: 'level',
          default: null,
        },
        {
          id: 'newCode',
          type: 'levelcode',
          default: null,
        },
      ],
      quoted: true,
    });
  }

  async tsexec(ts, message, { existingLevel, newCode }) {
    if (existingLevel.code === newCode) {
      ts.userError(await ts.message('reupload.sameCode'));
    }
    const newCodeCheck = await ts
      .getLevels()
      .where({ code: newCode })
      .first();
    if (newCodeCheck) {
      ts.userError(
        await ts.message('add.levelExisting', {
          level: newCodeCheck,
        }),
      );
    }

    await ts.db.Levels.query()
      .patch({ code: newCode })
      .where({ code: existingLevel.code });

    let notify = false;
    const existingPendingChannel = ts.discord.channel(
      existingLevel.code,
      ts.channels.levelDiscussionCategory,
    );
    if (existingPendingChannel) {
      await ts.labelPendingLevel(
        { ...existingLevel, code: newCode },
        existingLevel.code,
      );
      notify = true;
    }

    notify =
      notify ||
      (await ts.renameAuditChannels(existingLevel.code, newCode));

    debug('after notify', notify);

    await ts.discord.fetchGuild();

    debug('after fetch guild');

    if (notify) {
      debug('should send notify');
      await ts.discord.send(
        newCode,
        await ts.message('ammendcode.notify', {
          oldCode: existingLevel.code,
          newCode,
        }),
      );
    }

    await ts.updatePendingDiscussionChannel({ code: newCode });

    debug('should send success');

    await ts.discord.reply(
      message,
      await ts.message('ammendCode.success', {
        level: existingLevel,
        oldCode: existingLevel.code,
        newCode,
      }),
    );
  }
}

module.exports = AmendCode;
