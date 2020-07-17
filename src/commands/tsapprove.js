const TSCommand = require('../TSCommand.js');

class TSApprove extends TSCommand {
  constructor() {
    super('tsapprove', {
      aliases: [
        'tsapprove',
        'tsreject',
        'tsapprove+c',
        'tsapprove+cl',
        'tsapprove+lc',
        'tsfix',
        'tsfix+c',
        'tsfix+cl',
        'tsfix+lc',
        'approve',
        'reject',
        'approve+c',
        'approve+cl',
        'approve+lc',
        'fix',
        'fix+c',
        'fix+cl',
        'fix+lc',
      ],
      split: 'quoted',
      args: [
        {
          id: 'code',
          type: 'string',
          default: null,
        },
        {
          id: 'difficulty',
          type: 'string',
          default: null,
        },
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
    const clearCommands = [
      'tsapprove+c',
      'tsapprove+cl',
      'tsapprove+lc',
      'tsfix+c',
      'tsfix+cl',
      'tsfix+lc',
      'approve+c',
      'approve+cl',
      'approve+lc',
      'fix+c',
      'fix+cl',
      'fix+lc',
    ];
    const likeCommands = [
      'tsapprove+cl',
      'tsapprove+lc',
      'tsfix+cl',
      'tsfix+lc',
      'approve+cl',
      'approve+lc',
      'fix+cl',
      'fix+lc',
    ];

    const {
      code,
      command,
      inCodeDiscussionChannel,
    } = ts.getCodeArgument(message);
    const args = { code };

    if (
      !(
        (
          ts.discord.messageGetChannel(message) ===
            ts.channels.modChannel || // only in shellder-bot channel
          ts.discord.messageGetChannel(message) ===
            ts.channels.pendingShellbot || // or in pending-shellbot channel
          ts.discord.messageGetParent(message) ===
            ts.channels.levelDiscussionCategory // only allow this command in the level discussion category, NOT pending re-uploads
        )
      )
    )
      return false; // silently fail

    if (command.command.indexOf('reject') === -1) {
      // Difficulty doesn't exist in reject, so it get replaced by reason
      args.difficulty = command.next();
    } else {
      args.difficulty = null;
    }

    args.reason = command.rest();

    // Then Check the other args
    if (
      command.command.indexOf('approve') !== -1 ||
      command.command.indexOf('fix') !== -1 ||
      clearCommands.indexOf(command.command) !== -1
    ) {
      // We only check difficulty in tsapprove mode
      if (!ts.valid_difficulty(args.difficulty)) {
        ts.userError('approval.invalidDifficulty');
      }
    }

    if (command.command.indexOf('reject') !== -1) {
      args.type = 'reject';
    } else if (command.command.indexOf('fix') !== -1) {
      args.type = 'fix';
    } else {
      args.type = 'approve';
    }

    args.discord_id = ts.discord.getAuthor(message);
    const replyMessage = await ts.approve(args);
    await ts.discord.reply(message, replyMessage);
    const user = await ts.getUser(message);

    // clear
    if (clearCommands.indexOf(command.command) !== -1) {
      args.completed = 1;
      if (likeCommands.indexOf(command.command) !== -1) {
        args.liked = 1;
      }
      args.playerDontAtMe = !user.atme;
      const clearMessage = await ts.clear(args);
      await ts.discord.send(ts.channels.commandFeed, clearMessage);
    }
    return true;
  }
}
module.exports = TSApprove;
