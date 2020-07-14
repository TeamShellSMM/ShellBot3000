const TSCommand = require('../TSCommand.js');

class TSRefuseFix extends TSCommand {
  constructor() {
    super('tsrefusefix', {
      aliases: ['tsrefusefix', 'refusefix'],
      channelRestriction: 'guild',
    });
  }

  async tsexec(ts, message) {
    const command = ts.parseCommand(message);
    let code = command.arguments.shift();
    if (code) code = code.toUpperCase();

    if (!ts.validCode(code))
      ts.userError('You did not provide a valid code for the level');

    const reason = command.arguments.join(' ');

    if (!reason) {
      ts.userError(
        'Please provide a little message to the mods for context at the end of the command!',
      );
    }
    ts.reasonLengthCheck(reason, 800);

    const player = await ts.getUser(message);
    const level = await ts.getLevels().where({ code }).first();
    const author = await ts.db.Members.query()
      .where({ name: level.creator })
      .first();

    if (level.status === ts.LEVEL_STATUS.PENDING_NOT_FIXED_REUPLOAD)
      ts.userError('You already sent this reupload request back!');

    if (level.status !== ts.LEVEL_STATUS.NEED_FIX)
      ts.userError('This level is not currently in a fix request!');

    // only creator can use this command
    if (!(level.creator === player.name))
      ts.userError(
        'You can only use this command on one of your own levels that currently has an open fix request.',
      );

    await ts.db.Levels.query()
      .where({ code })
      .patch({ status: ts.LEVEL_STATUS.PENDING_NOT_FIXED_REUPLOAD });
    level.status = ts.LEVEL_STATUS.PENDING_NOT_FIXED_REUPLOAD;


    await ts.auditDiscussionChannel(
      code,
      null,
      ts.CHANNEL_LABELS.AUDIT_FIX_REQUEST,
    );

    await ts.discord.send(
      code,
      `Reupload Request for <@${author.discord_id}>'s level with message: ${reason}`,
    );

    await ts.fixModPing(code);

    const voteEmbed = await ts.makeVoteEmbed(level, reason);
    await ts.discord.updatePinned(code, voteEmbed);

    return ts.discord.reply(
      message,
      "Your level was put in the reupload queue, we'll get back to you in a bit!",
    );
  }
}
module.exports = TSRefuseFix;
