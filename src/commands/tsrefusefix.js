const TSCommand = require('../TSCommand.js');

class TSRefuseFix extends TSCommand {
  constructor() {
    super('tsrefusefix', {
      aliases: ['tsrefusefix', 'refusefix'],
      channelRestriction: 'guild',
    });
  }

  async tsexec(ts, message) {
    const command = ts.parse_command(message);
    let code = command.arguments.shift();
    if (code) code = code.toUpperCase();

    if (!ts.valid_code(code))
      ts.userError('You did not provide a valid code for the level');

    const reason = command.arguments.join(' ');

    if (!reason) {
      ts.userError(
        'Please provide a little message to the mods for context at the end of the command!',
      );
    }

    const player = await ts.get_user(message);
    const level = await ts.getLevels().where({ code }).first();
    const author = await ts.db.Members.query()
      .where({ name: level.creator })
      .first();

    if (level.status === ts.LEVEL_STATUS.PENDING_NOT_FIXED_REUPLOAD)
      ts.userError('You already sent this reupload request back!');

    if (level.status !== ts.LEVEL_STATUS.NEED_FIX)
      ts.userError('This level is not currently in a fix request!');

    // only creator can use this command
    if (!(level.creator == player.name))
      ts.userError(
        'You can only use this command on one of your own levels that currently has an open fix request.',
      );

    // generate judgement embed
    let overviewMessage;
    let discussionChannel;

    const guild = ts.getGuild();

    await ts.db.Levels.query()
      .where({ code })
      .patch({ status: ts.LEVEL_STATUS.PENDING_NOT_FIXED_REUPLOAD });
    level.status = ts.LEVEL_STATUS.PENDING_NOT_FIXED_REUPLOAD;
    // TODO: put author comment in pending_votes
    discussionChannel = ts.findChannel({
      name: level.code.toLowerCase(),
      parendID: ts.channels.pendingReuploadCategory,
    }); // not sure should specify guild/server

    // Create new channel and set parent to category
    /* istanbul ignore next */
    if (
      guild.channels.get(ts.channels.pendingReuploadCategory).children
        .size === 50
    ) {
      ts.userError(
        "Can't handle the request right now because there are already 50 open reupload requests (this should really never happen)!",
      );
    }
    discussionChannel = await guild.createChannel(code, {
      type: 'text',
      parent: guild.channels.get(ts.channels.pendingReuploadCategory),
    });
    // Post empty overview post
    await discussionChannel.send(
      `Reupload Request for <@${author.discord_id}>'s level with message: ${reason}`,
    );
    const voteEmbed = await ts.makeVoteEmbed(level, reason);
    overviewMessage = await discussionChannel.send(voteEmbed);
    overviewMessage = await overviewMessage.pin();

    const replyMessage =
      "Your level was put in the reupload queue, we'll get back to you in a bit!";

    await message.reply(replyMessage);
  }
}
module.exports = TSRefuseFix;
