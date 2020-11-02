const TSCommand = require('../TSCommand.js');

class TSApprove extends TSCommand {
  constructor() {
    super('tsapprove', {
      aliases: [
        'tsapprove',
        'tsapprove+c',
        'tsapprove+cl',
        'tsapprove+lc',
        'tsfix',
        'tsfix+c',
        'tsfix+cl',
        'tsfix+lc',
        'approve',
        'approve+c',
        'approve+cl',
        'approve+lc',
        'fix',
        'fix+c',
        'fix+cl',
        'fix+lc',
      ],
      args: [
        {
          id: 'level',
          type: 'level:pending',
          default: null,
        },
        {
          id: 'difficulty',
          type: 'difficulty',
          default: null,
        },
        {
          id: 'reason',
          type: 'longertext',
          match: 'rest',
          default: null,
        },
      ],
      quoted: true,
      channelRestriction: 'guild',
    });
  }

  async tsexec(ts, message, args2) {
    const args = args2;
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

    if (args.command.command.indexOf('fix') !== -1) {
      args.type = 'fix';
    } else {
      args.type = 'approve';
    }

    args.discord_id = ts.discord.getAuthor(message);
    const replyMessage = await ts.approve(args);
    await ts.discord.reply(message, replyMessage);
    const user = await ts.getUser(message);

    // clear
    if (clearCommands.indexOf(args.command.command) !== -1) {
      args.completed = 1;
      if (likeCommands.indexOf(args.command.command) !== -1) {
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
