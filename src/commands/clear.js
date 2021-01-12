const TSCommand = require('../TSCommand.js');

class TSClear extends TSCommand {
  constructor() {
    super('clear', {
      aliases: ['tsclear', 'clear'],
      args: [
        {
          id: 'level',
          description: 'levelCode',
          type: 'level',
          default: null,
        },
        {
          id: 'optionString',
          description:
            'difficultyVote | difficultyVote like/unlike | like/unlike',
          type: 'text:optional',
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

    args.difficulty = null;
    args.liked = null;

    let { optionString } = args;
    if (optionString !== undefined && optionString !== null) {
      optionString += '';
      optionString = optionString.toLowerCase();
      const options = optionString.split(' ');

      if (options.length > 1) {
        if (options[0] === '') args.difficulty = null;
        if (options[0] == null) args.difficulty = null;
        if (options[0]) {
          if (options[0].toString().length > 4) {
            ts.userError(await ts.message('clear.invalidDifficulty'));
          }
          args.difficulty = parseFloat(options[0]);
        }
        if (
          (args.difficulty !== 0 &&
            args.difficulty &&
            !ts.valid_difficulty(args.difficulty)) ||
          Number.isNaN(args.difficulty)
        ) {
          ts.userError(await ts.message('clear.invalidDifficulty'));
        }

        if (options[1] === 'like') {
          args.liked = 1;
        } else if (options[1] === 'unlike') {
          args.liked = 0;
        } else {
          args.liked = ts.commandPassedBoolean(options[1]);
        }
      } else if (options.length > 0) {
        if (options[0] === 'like') {
          args.liked = 1;
        } else if (options[0] === 'unlike') {
          args.liked = 0;
        } else {
          if (options[0] === '') args.difficulty = null;
          if (options[0] == null) args.difficulty = null;
          if (options[0]) {
            if (options[0].toString().length > 4) {
              ts.userError(
                await ts.message('clear.invalidDifficulty'),
              );
            }
            args.difficulty = parseFloat(options[0]);
          }
          if (
            (args.difficulty !== 0 &&
              args.difficulty &&
              !ts.valid_difficulty(args.difficulty)) ||
            Number.isNaN(args.difficulty)
          ) {
            ts.userError(await ts.message('clear.invalidDifficulty'));
          }
        }
      }
    }

    const msg = await ts.clear({
      ...args,
      discord_id: ts.discord.getAuthor(message),
      completed: 1,
    });
    await ts.discord.messageSend(message, msg);
  }
}
module.exports = TSClear;
