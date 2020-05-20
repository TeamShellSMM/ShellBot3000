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
    if (ts.valid_code(message.channel.name.toUpperCase())) {
      inReuploadChannel = true;
      code = message.channel.name.toUpperCase();
    } else {
      // Check the code only if not in discussion channel
    }
    if (!inReuploadChannel) return false; // silently fail

    if (
      message.channel.parentID !== ts.channels.pendingReuploadCategory
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

    await ts.finishFixRequest(
      code,
      message.author,
      reason,
      approving,
    );
  }
}
module.exports = TSFixApprove;
