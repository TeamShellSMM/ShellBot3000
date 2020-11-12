'use strict';

const { AkairoClient, Flag } = require('discord-akairo');
const debugError = require('debug')('shellbot3000:error');
const validUrl = require('valid-url');
const TS = require('./TS.js');
const TSCommandHandler = require('./TSCommandHandler.js');

class TSClient extends AkairoClient {
  constructor() {
    super(
      {
        ownerID: '284027418375618570', // or ['123992700587343872', '86890631690977280']
      },
      { fetchAllMembers: true },
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
      let memberName = memberNameArg;
      memberName = memberName.replace(/"/g, '');
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
        memberName = memberName.trim().replace(/"/g, '');
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
      discordStringsAllowed = false,
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

      if (!discordStringsAllowed && ts.isSpecialDiscordString(text)) {
        return this.handleError(
          ts,
          message,
          'error.specialDiscordString',
          argumentDefs,
        );
      }

      return text.trim().replace(/"/g, '');
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
        ts.teamVariables.whitelistedTagsOnly === 'true' ||
        whitelistedOnly
      ) {
        for (let tag of tags) {
          tag = tag.trim();
          const existingTag = await ts.db.Tags.query()
            .whereRaw('replace(lower(name), " ", "") = ?', [
              tag.trim().toLowerCase().replace(/ /g, ''),
            ])
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

    this.resolveType = async (
      type,
      message,
      phrase,
      argumentDefs,
    ) => {
      switch (type) {
        case 'level':
          return this.resolveLevel(message, phrase, argumentDefs);
        case 'level:pending':
          return this.resolveLevel(
            message,
            phrase,
            argumentDefs,
            'pending',
          );
        case 'level:approved':
          return this.resolveLevel(
            message,
            phrase,
            argumentDefs,
            'approved',
          );
        case 'level:any':
          return this.resolveLevel(
            message,
            phrase,
            argumentDefs,
            'any',
            true,
          );
        case 'levelcode':
          return this.resolveCode(message, phrase, argumentDefs);
        case 'makerid':
          return this.resolveCode(
            message,
            phrase,
            argumentDefs,
            'maker',
          );
        case 'gamestyle':
          return this.resolveGameStyle(message, phrase, argumentDefs);
        case 'text':
          return this.resolveText(message, phrase, argumentDefs, 256);
        case 'longtext':
          return this.resolveText(message, phrase, argumentDefs, 800);
        case 'longertext':
          return this.resolveText(
            message,
            phrase,
            argumentDefs,
            1500,
          );
        case 'longtext:emotes':
          return this.resolveText(
            message,
            phrase,
            argumentDefs,
            800,
            true,
            true,
          );
        case 'longertext:emotes':
          return this.resolveText(
            message,
            phrase,
            argumentDefs,
            1500,
            true,
            true,
          );
        case 'text:optional':
          return this.resolveText(
            message,
            phrase,
            argumentDefs,
            256,
            false,
          );
        case 'tags':
          return this.resolveTags(message, phrase, argumentDefs);
        case 'tags:whitelisted':
          return this.resolveTags(
            message,
            phrase,
            argumentDefs,
            true,
          );
        case 'videos':
          return this.resolveVideos(message, phrase, argumentDefs);
        case 'difficulty':
          return this.resolveDifficulty(
            message,
            phrase,
            argumentDefs,
          );
        case 'teammember':
          return this.resolveMember(message, phrase, argumentDefs);
        case 'teammembers':
          return this.resolveMembers(message, phrase, argumentDefs);
        case 'int':
          return this.resolveInt(message, phrase, argumentDefs);
        default:
          TS.promisedCallback();
          return Flag.cancel();
      }
    };

    this.commandHandler = new TSCommandHandler(this, {
      directory: './src/commands/',
      prefix: '!',
      blockClient: false,
      blockBots: false,
    });

    this.commandHandler.resolver.addType(
      'level:pending',
      (message, phrase, argumentDefs) => {
        return this.resolveType(
          'level:pending',
          message,
          phrase,
          argumentDefs,
        );
      },
    );
    this.commandHandler.resolver.addType(
      'level:approved',
      (message, phrase, argumentDefs) => {
        return this.resolveType(
          'level:approved',
          message,
          phrase,
          argumentDefs,
        );
      },
    );
    this.commandHandler.resolver.addType(
      'level:any',
      (message, phrase, argumentDefs) => {
        return this.resolveType(
          'level:any',
          message,
          phrase,
          argumentDefs,
        );
      },
    );
    this.commandHandler.resolver.addType(
      'level',
      (message, phrase, argumentDefs) => {
        return this.resolveType(
          'level',
          message,
          phrase,
          argumentDefs,
        );
      },
    );
    this.commandHandler.resolver.addType(
      'levelcode',
      (message, phrase, argumentDefs) => {
        return this.resolveType(
          'levelcode',
          message,
          phrase,
          argumentDefs,
        );
      },
    );
    this.commandHandler.resolver.addType(
      'makerid',
      (message, phrase, argumentDefs) => {
        return this.resolveType(
          'makerid',
          message,
          phrase,
          argumentDefs,
        );
      },
    );
    this.commandHandler.resolver.addType(
      'gamestyle',
      (message, phrase, argumentDefs) => {
        return this.resolveType(
          'gamestyle',
          message,
          phrase,
          argumentDefs,
        );
      },
    );
    this.commandHandler.resolver.addType(
      'text',
      (message, phrase, argumentDefs) => {
        return this.resolveType(
          'text',
          message,
          phrase,
          argumentDefs,
        );
      },
    );
    this.commandHandler.resolver.addType(
      'longtext',
      (message, phrase, argumentDefs) => {
        return this.resolveType(
          'longtext',
          message,
          phrase,
          argumentDefs,
        );
      },
    );
    this.commandHandler.resolver.addType(
      'longertext',
      (message, phrase, argumentDefs) => {
        return this.resolveType(
          'longertext',
          message,
          phrase,
          argumentDefs,
        );
      },
    );
    this.commandHandler.resolver.addType(
      'longtext:emotes',
      (message, phrase, argumentDefs) => {
        return this.resolveType(
          'longtext:emotes',
          message,
          phrase,
          argumentDefs,
        );
      },
    );
    this.commandHandler.resolver.addType(
      'longertext:emotes',
      (message, phrase, argumentDefs) => {
        return this.resolveType(
          'longertext:emotes',
          message,
          phrase,
          argumentDefs,
        );
      },
    );
    this.commandHandler.resolver.addType(
      'text:optional',
      (message, phrase, argumentDefs) => {
        return this.resolveType(
          'text:optional',
          message,
          phrase,
          argumentDefs,
        );
      },
    );
    this.commandHandler.resolver.addType(
      'tags',
      (message, phrase, argumentDefs) => {
        return this.resolveType(
          'tags',
          message,
          phrase,
          argumentDefs,
        );
      },
    );
    this.commandHandler.resolver.addType(
      'tags:whitelisted',
      (message, phrase, argumentDefs) => {
        return this.resolveType(
          'tags:whitelisted',
          message,
          phrase,
          argumentDefs,
        );
      },
    );
    this.commandHandler.resolver.addType(
      'videos',
      (message, phrase, argumentDefs) => {
        return this.resolveType(
          'videos',
          message,
          phrase,
          argumentDefs,
        );
      },
    );
    this.commandHandler.resolver.addType(
      'difficulty',
      (message, phrase, argumentDefs) => {
        return this.resolveType(
          'difficulty',
          message,
          phrase,
          argumentDefs,
        );
      },
    );
    this.commandHandler.resolver.addType(
      'teammember',
      (message, phrase, argumentDefs) => {
        return this.resolveType(
          'teammember',
          message,
          phrase,
          argumentDefs,
        );
      },
    );
    this.commandHandler.resolver.addType(
      'teammembers',
      (message, phrase, argumentDefs) => {
        return this.resolveType(
          'teammembers',
          message,
          phrase,
          argumentDefs,
        );
      },
    );
    this.commandHandler.resolver.addType(
      'int',
      (message, phrase, argumentDefs) => {
        return this.resolveType('int', message, phrase, argumentDefs);
      },
    );

    this.commandHandler.loadAll();
  }
}

module.exports = TSClient;
