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

  async tsexec(ts, message) {
    /*
        Possible command syntax:
        !tsapprove code difficulty reason
        !tsreject code reason

        in channel
        !tsapprove difficulty reason
        !tsreject reason
      */

    const {
      code,
      command,
      inCodeDiscussionChannel,
    } = ts.getCodeArgument(message);
    const reason = command.rest();

    if (!inCodeDiscussionChannel) return false; // silently fail

    if (
      ts.discord.messageGetParent(message) !==
      ts.channels.pendingReuploadCategory
    )
      ts.userError(ts.message('fixApprove.notInChannel', { code }));

    if (!reason) ts.userError('fixApprove.noReason');
    ts.reasonLengthCheck(reason, 800);

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
