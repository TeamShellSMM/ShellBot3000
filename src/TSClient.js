'use strict';

const {
  AkairoClient,
  CommandHandler,
  Flag,
} = require('discord-akairo');
const debugError = require('debug')('shellbot3000:error');
const validUrl = require('valid-url');
const TS = require('./TS.js');

class TSClient extends AkairoClient {
  constructor() {
    super(
      {
        ownerID: '284027418375618570', // or ['123992700587343872', '86890631690977280']
      },
      {},
    );

    this.handleError = async (
      ts,
      message,
      name,
      argumentDefs,
      args = {},
    ) => {
      const error = ts.createUserError(await ts.message(name, args));
      debugError(error);

      let argString = '';
      for (const argumentDef of argumentDefs.all) {
        if (argumentDef.id === argumentDefs.active.id) {
          argString += ` __<${argumentDef.name}>__`;
        } else {
          argString += ` <${argumentDef.name}>`;
        }
      }

      await ts.discord.sendChannel(
        message.channel,
        `>>> **!${argumentDefs.active.command.id}${argString}**\n` +
          `<@${message.author.id}>, ${await ts.getUserErrorMsg(
            error,
            message,
          )}`,
      );

      if (TS.promisedCallback instanceof Function) {
        TS.promisedCallback();
      }
      return Flag.cancel();
    };

    this.resolveLevel = async (
      message,
      codeArg,
      argumentDefs,
      levelStatus = 'all',
      includeRemoved = false,
    ) => {
      let code = codeArg;
      const ts = TS.teams(TS.DiscordWrapper.messageGetGuild(message));

      if (!code) {
        return this.handleError(
          ts,
          message,
          'error.noCode',
          argumentDefs,
        );
      }

      code = code.toUpperCase();

      if (!ts.validCode(code)) {
        return this.handleError(
          ts,
          message,
          'error.invalidCode',
          argumentDefs,
        );
      }

      try {
        const level = await ts.getExistingLevel(code, true);

        if (
          !includeRemoved &&
          ts.REMOVED_LEVELS.includes(level.status)
        ) {
          return this.handleError(
            ts,
            message,
            'removeLevel.alreadyRemoved',
            argumentDefs,
            level,
          );
        }

        if (
          levelStatus === 'pending' &&
          level.status !== ts.LEVEL_STATUS.PENDING
        ) {
          return this.handleError(
            ts,
            message,
            'approval.levelNotPending',
            argumentDefs,
          );
        }
        if (
          levelStatus === 'approved' &&
          level.status !== ts.LEVEL_STATUS.APPROVED
        ) {
          return this.handleError(
            ts,
            message,
            'error.levelNotApproved',
            argumentDefs,
          );
        }
        return level;
      } catch (error) {
        debugError(error);
        await TS.DiscordWrapper.reply(
          message,
          await ts.getUserErrorMsg(error, message),
        );
        TS.promisedCallback();
        return Flag.cancel();
      }
    };

    this.resolveMember = async (
      message,
      memberNameArg,
      argumentDefs,
    ) => {
      const memberName = memberNameArg;
      const ts = TS.teams(TS.DiscordWrapper.messageGetGuild(message));

      if (!memberName) {
        return this.handleError(
          ts,
          message,
          'error.missingMemberName',
          argumentDefs,
        );
      }

      let member = await ts.db.Members.query()
        .whereRaw('lower(name) = ?', [memberName.toLowerCase()])
        .first();

      if (!member) {
        return this.handleError(
          ts,
          message,
          'error.memberNotFound',
          argumentDefs,
          {
            name: memberName,
          },
        );
      }

      member = await ts.decorateMember(member);

      return member;
    };

    this.resolveMembers = async (
      message,
      memberNamesArg,
      argumentDefs,
    ) => {
      let memberNames = memberNamesArg;
      const ts = TS.teams(TS.DiscordWrapper.messageGetGuild(message));

      memberNames = memberNames.split(/[,\n]/);
      const members = [];

      for (let memberName of memberNames) {
        memberName = memberName.trim();
        if (!memberName) {
          return this.handleError(
            ts,
            message,
            'error.missingMemberNames',
            argumentDefs,
          );
        }

        let member = await ts.db.Members.query()
          .whereRaw('lower(name) = ?', [memberName.toLowerCase()])
          .first();

        if (!member) {
          return this.handleError(
            ts,
            message,
            'error.memberNotFound',
            argumentDefs,
            {
              name: memberName,
            },
          );
        }

        member = await ts.decorateMember(member);
        members.push(member);
      }
      return members;
    };

    this.resolveCode = async (
      message,
      codeArg,
      argumentDefs,
      type = 'level',
    ) => {
      let code = codeArg;
      const ts = TS.teams(TS.DiscordWrapper.messageGetGuild(message));

      if (!code) {
        const errName =
          type === 'level' ? 'error.noCode' : 'makerid.noCode';
        return this.handleError(ts, message, errName, argumentDefs);
      }

      code = code.toUpperCase();

      if (!ts.validCode(code)) {
        const errName =
          type === 'level'
            ? 'error.invalidCode'
            : 'error.invalidMakerCode';
        return this.handleError(ts, message, errName, argumentDefs, {
          code,
        });
      }

      return code;
    };

    this.resolveGameStyle = async (
      message,
      gameStyleArg,
      argumentDefs,
    ) => {
      let gameStyle = gameStyleArg;
      const ts = TS.teams(TS.DiscordWrapper.messageGetGuild(message));

      if (!gameStyle) {
        return this.handleError(
          ts,
          message,
          'add.missingGameStyle',
          argumentDefs,
        );
      }

      gameStyle = gameStyle.toUpperCase();

      if (ts.GAME_STYLES.indexOf(gameStyle) === -1) {
        return this.handleError(
          ts,
          message,
          'error.wrongGameStyle',
          argumentDefs,
        );
      }

      return gameStyle;
    };

    this.resolveText = async (
      message,
      textArg,
      argumentDefs,
      maximumChars,
      required = true,
    ) => {
      let text = textArg;
      const ts = TS.teams(TS.DiscordWrapper.messageGetGuild(message));

      if (!text) {
        if (required) {
          return this.handleError(
            ts,
            message,
            'error.missingParameter',
            argumentDefs,
          );
        }
        text = '';
      }

      if (text.length > maximumChars) {
        return this.handleError(
          ts,
          message,
          'error.textTooLong',
          argumentDefs,
          {
            maximumChars,
          },
        );
      }

      if (ts.isSpecialDiscordString(text)) {
        return this.handleError(
          ts,
          message,
          'error.specialDiscordString',
          argumentDefs,
        );
      }

      return text.trim();
    };

    this.resolveTags = async (
      message,
      tagsArg,
      argumentDefs,
      whitelistedOnly = false,
    ) => {
      let tags = tagsArg;
      const ts = TS.teams(TS.DiscordWrapper.messageGetGuild(message));

      if (!tags) {
        return this.handleError(
          ts,
          message,
          'tags.noTags',
          argumentDefs,
        );
      }
      tags = tags.split(/[,\n]/);

      if (
        (ts.teamVariables.whitelistedTagsOnly === 'true' ||
          whitelistedOnly) &&
        !(await ts.modOnly(message.author.id))
      ) {
        for (const tag of tags) {
          const existingTag = await ts.db.Tags.query()
            .where('name', tag)
            .first();
          if (!existingTag) {
            return this.handleError(
              ts,
              message,
              'tags.whitelistedOnly',
              argumentDefs,
              { tag: tag },
            );
          }
        }
      }

      return tags;
    };

    this.resolveVideos = async (message, videosArg, argumentDefs) => {
      let videos = videosArg;
      const ts = TS.teams(TS.DiscordWrapper.messageGetGuild(message));

      if (!videos) {
        return this.handleError(
          ts,
          message,
          'error.noVideos',
          argumentDefs,
        );
      }
      videos = videos.split(/[, \n]/);

      const filteredUrl = [];
      const notUrls = [];
      const notAllowedUrls = [];
      videos.forEach((url) => {
        if (url) {
          if (validUrl.isWebUri(url)) {
            const videoType = ts.getVideoType(url);
            if (videoType) {
              filteredUrl.push({
                url: url,
                type: videoType,
              });
            } else {
              notAllowedUrls.push(url);
            }
          } else {
            notUrls.push(url);
          }
        }
      });

      if (notUrls.length) {
        return this.handleError(
          ts,
          message,
          'error.notUrls',
          argumentDefs,
          {
            urls: notUrls.join('\n'),
          },
        );
      }

      if (notAllowedUrls.length) {
        return this.handleError(
          ts,
          message,
          'addVids.notAllowed',
          argumentDefs,
          {
            videos: notAllowedUrls.join('\n'),
          },
        );
      }

      return filteredUrl;
    };

    this.resolveDifficulty = async (
      message,
      difficultyArg,
      argumentDefs,
    ) => {
      let difficulty = difficultyArg;
      const ts = TS.teams(TS.DiscordWrapper.messageGetGuild(message));

      if (difficulty === '') difficulty = null;
      if (difficulty == null) difficulty = null;
      if (difficulty) {
        difficulty = parseFloat(difficulty);
      }
      if (
        (difficulty !== 0 &&
          difficulty &&
          !ts.valid_difficulty(difficulty)) ||
        Number.isNaN(difficulty)
      ) {
        return this.handleError(
          ts,
          message,
          'approval.invalidDifficulty',
          argumentDefs,
        );
      }

      return difficulty;
    };

    this.resolveInt = async (message, numArg, argumentDefs) => {
      let num = numArg;
      const ts = TS.teams(TS.DiscordWrapper.messageGetGuild(message));

      if (num === '') num = null;
      if (num == null) num = null;
      if (num) {
        num = parseInt(num, 10);
      }
      if (Number.isNaN(num) || num <= 0) {
        return this.handleError(
          ts,
          message,
          'error.invalidInt',
          argumentDefs,
        );
      }

      return num;
    };

    this.commandHandler = new CommandHandler(this, {
      directory: './src/commands/',
      prefix: '!',
      blockClient: false,
      blockBots: false,
    });

    this.commandHandler.resolver.addType(
      'level:pending',
      (message, phrase, argumentDefs) => {
        return this.resolveLevel(
          message,
          phrase,
          argumentDefs,
          'pending',
        );
      },
    );
    this.commandHandler.resolver.addType(
      'level:approved',
      (message, phrase, argumentDefs) => {
        return this.resolveLevel(
          message,
          phrase,
          argumentDefs,
          'approved',
        );
      },
    );
    this.commandHandler.resolver.addType(
      'level:any',
      (message, phrase, argumentDefs) => {
        return this.resolveLevel(
          message,
          phrase,
          argumentDefs,
          'all',
          true,
        );
      },
    );
    this.commandHandler.resolver.addType(
      'level',
      (message, phrase, argumentDefs) => {
        return this.resolveLevel(message, phrase, argumentDefs);
      },
    );
    this.commandHandler.resolver.addType(
      'levelcode',
      (message, phrase, argumentDefs) => {
        return this.resolveCode(message, phrase, argumentDefs);
      },
    );
    this.commandHandler.resolver.addType(
      'makerid',
      (message, phrase, argumentDefs) => {
        return this.resolveCode(
          message,
          phrase,
          argumentDefs,
          'maker',
        );
      },
    );
    this.commandHandler.resolver.addType(
      'gamestyle',
      (message, phrase, argumentDefs) => {
        return this.resolveGameStyle(message, phrase, argumentDefs);
      },
    );
    this.commandHandler.resolver.addType(
      'text',
      (message, phrase, argumentDefs) => {
        return this.resolveText(message, phrase, argumentDefs, 256);
      },
    );
    this.commandHandler.resolver.addType(
      'longtext',
      (message, phrase, argumentDefs) => {
        return this.resolveText(message, phrase, argumentDefs, 800);
      },
    );
    this.commandHandler.resolver.addType(
      'longertext',
      (message, phrase, argumentDefs) => {
        return this.resolveText(message, phrase, argumentDefs, 1500);
      },
    );
    this.commandHandler.resolver.addType(
      'text:optional',
      (message, phrase, argumentDefs) => {
        return this.resolveText(
          message,
          phrase,
          argumentDefs,
          256,
          false,
        );
      },
    );
    this.commandHandler.resolver.addType(
      'tags',
      (message, phrase, argumentDefs) => {
        return this.resolveTags(message, phrase, argumentDefs);
      },
    );
    this.commandHandler.resolver.addType(
      'tags:whitelisted',
      (message, phrase, argumentDefs) => {
        return this.resolveTags(message, phrase, argumentDefs, true);
      },
    );
    this.commandHandler.resolver.addType(
      'videos',
      (message, phrase, argumentDefs) => {
        return this.resolveVideos(message, phrase, argumentDefs);
      },
    );
    this.commandHandler.resolver.addType(
      'difficulty',
      (message, phrase, argumentDefs) => {
        return this.resolveDifficulty(message, phrase, argumentDefs);
      },
    );
    this.commandHandler.resolver.addType(
      'teammember',
      (message, phrase, argumentDefs) => {
        return this.resolveMember(message, phrase, argumentDefs);
      },
    );
    this.commandHandler.resolver.addType(
      'teammembers',
      (message, phrase, argumentDefs) => {
        return this.resolveMembers(message, phrase, argumentDefs);
      },
    );
    this.commandHandler.resolver.addType(
      'int',
      (message, phrase, argumentDefs) => {
        return this.resolveInt(message, phrase, argumentDefs);
      },
    );

    this.commandHandler.loadAll();
  }
}

module.exports = TSClient;
