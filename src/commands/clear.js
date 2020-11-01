const TSCommand = require('../TSCommand.js');

class TSClear extends TSCommand {
  constructor() {
    super('tsclear', {
      aliases: ['tsclear', 'clear'],
      args: [
        {
          id: 'level',
          type: 'level',
          default: null,
        },
        {
          id: 'optionString',
          type: 'text:optional',
          match: 'rest',
          default: null,
        },
      ],
      quoted: true,
      channelRestriction: 'guild',
    });
  }

  async tsexec(ts, message, args) {
    args.difficulty = null;
    args.liked = null;

    let optionString = args.optionString;
    if(optionString !== undefined && optionString !== null){
      optionString = optionString + "";
      optionString = optionString.toLowerCase();
      let options = optionString.split(" ");

      if(options.length > 1){
        if (options[0] === '') args.difficulty = null;
        if (options[0] == null) args.difficulty = null;
        if (options[0]) {
          args.difficulty = parseFloat(options[0]);
        }
        if ((
          args.difficulty !== 0 &&
          args.difficulty &&
          !ts.valid_difficulty(args.difficulty) || isNaN(args.difficulty))
        ) {
          ts.userError(await ts.message('clear.invalidDifficulty'));
        }

        if(options[1] === 'like'){
          args.liked = 1;
        } else if (options[1] === 'unlike'){
          args.liked = 0;
        } else {
          args.liked = ts.commandPassedBoolean(options[1]);
        }
      } else if (options.length > 0){
        if(options[0] === 'like'){
          args.liked = 1;
        } else if (options[0] === 'unlike'){
          args.liked = 0;
        } else {
          if (options[0] === '') args.difficulty = null;
          if (options[0] == null) args.difficulty = null;
          if (options[0]) {
            args.difficulty = parseFloat(options[0]);
          }
          if (
            (args.difficulty !== 0 &&
              args.difficulty &&
            !ts.valid_difficulty(args.difficulty) || isNaN(args.difficulty))
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
