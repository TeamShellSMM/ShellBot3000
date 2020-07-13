const TSCommand = require('../TSCommand.js');

class TSModSetDiscordId extends TSCommand {
  constructor() {
    super('tsmodsetdiscordid', {
      aliases: ['tsmodsetdiscordid', 'modsetdiscordid'],
      args: [
        {
          id: 'name',
          type: 'string',
          default: null,
        },
        {
          id: 'discordId',
          type: 'string',
          default: null,
        },
      ],
      channelRestriction: 'guild',
    });
  }

  async canRun(ts, message) {
    return ts.modOnly(ts.discord.getAuthor(message));
  }

  async tsexec(ts, message) {
    const command = ts.parseCommand(message);

    let name;
    if (command.arguments.length >= 1) {
      name = command.arguments.shift();
    } else {
      ts.userError(ts.message('modsetdiscordid.missingName'));
    }

    let discordId;
    if (command.arguments.length >= 1) {
      discordId = command.arguments.shift();
    } else {
      ts.userError(ts.message('modsetdiscordid.missingId'));
    }

    const player = await ts.db.Members.query()
      .whereRaw('lower(name) = ?', [name.toLowerCase()])
      .first();

    if (!player) {
      ts.userError(
        ts.message('modsetdiscordid.memberNotFound', { name: name }),
      );
    }

    const discordIdMember = await ts.db.Members.query()
      .where({
        discord_id: discordId,
      })
      .first();

    if (discordIdMember) {
      ts.userError(ts.message('modsetdiscordid.duplicateId'));
    }

    await ts.db.Members.query().where('id', player.id).update({
      discord_id: discordId,
    });

    await ts.discord.reply(
      message,
      ts.message('modsetdiscordid.success', { name: name }),
    );
  }
}
module.exports = TSModSetDiscordId;
