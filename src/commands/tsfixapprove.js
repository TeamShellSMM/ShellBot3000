const TSCommand = require('../TSCommand.js');

class TSFixApprove extends TSCommand {
  constructor() {
    super('tsfixapprove', {
      aliases: [
        'tsfixapprove',
        'tsfixreject',
        'fixapprove',
        'fixreject',
      ],
      split: 'quoted',
      args: [
        {
          id: 'reason',
          type: 'string',
          default: null,
        },
      ],
      channelRestriction: 'guild',
    });
  }

  async tsexec(ts, message, { reason }) {
    /*
        Possible command syntax:
        !tsapprove code difficulty reason
        !tsreject code reason

        in channel
        !tsapprove difficulty reason
        !tsreject reason
      */
    const command = ts.parseCommand(message);
    let inReuploadChannel = false;
    let code = '';

    // Check if in level discussion channel
    if (
      ts.validCode(
        ts.discord.messageGetChannelName(message).toUpperCase(),
      )
    ) {
      inReuploadChannel = true;
      code = ts.discord.messageGetChannelName(message).toUpperCase();
    } else {
      // Check the code only if not in discussion channel
    }
    if (!inReuploadChannel) return false; // silently fail

    if (
      ts.discord.messageGetParent(message) !==
      ts.channels.pendingReuploadCategory
    )
      ts.userError(ts.message('fixApprove.notInChannel', { code }));

    if (!reason) ts.userError('fixApprove.noReason');

    let approving = false;

    if (
      command.command === 'tsfixapprove' ||
      command.command === 'fixapprove'
    ) {
      approving = true;
    }

    return ts.finishFixRequest(
      code,
      ts.discord.getAuthor(message),
      reason,
      approving,
    );
  }
}
module.exports = TSFixApprove;
