'use strict';

const { AkairoClient, CommandHandler, Flag } = require('discord-akairo');
const debug = require('debug')('shellbot3000:discord');
const debugError = require('debug')('shellbot3000:error');
const knex = require('./db/knex');
const TS = require('./TS.js');
const DiscordLog = require('./DiscordLog');
const WebApi = require('./WebApi');
const DiscordWrapper = require('./DiscordWrapper');
const validUrl = require('valid-url');

class TSClient extends AkairoClient {
  constructor() {
    super({
        ownerID: '284027418375618570', // or ['123992700587343872', '86890631690977280']
    }, {});

    this.handleError = async (ts, message, name, args = {}) => {
      let error = ts.createUserError(await ts.message(name, args));
      debugError(error);
      await TS.DiscordWrapper.reply(
        message,
        await ts.getUserErrorMsg(error, message),
      );
      if(TS.promisedCallback instanceof Function){
        TS.promisedCallback();
      }
      return Flag.cancel();
    }

    this.resolveLevel = async (message, code, levelStatus = "all", includeRemoved = false) => {
      let ts = TS.teams(TS.DiscordWrapper.messageGetGuild(message));

      if(!code){
        return this.handleError(ts, message, 'error.noCode');
      }

      code = code.toUpperCase();

      if(!ts.validCode(code)){
        return this.handleError(ts, message, 'error.invalidCode');
      }

      try{
        let level = await ts.getExistingLevel(code, true);

        if(!includeRemoved && ts.REMOVED_LEVELS.includes(level.status)) {
          return this.handleError(ts, message, 'removeLevel.alreadyRemoved', level);
        }

        if(levelStatus === "pending" && level.status !== ts.LEVEL_STATUS.PENDING){
          return this.handleError(ts, message, 'approval.levelNotPending');
        } else if (levelStatus === "approved" && level.status !== ts.LEVEL_STATUS.APPROVED) {
          return this.handleError(ts, message, 'error.levelNotApproved');
        }
        return level;
      } catch (error){
        debugError(error);
        await TS.DiscordWrapper.reply(
          message,
          await ts.getUserErrorMsg(error, message),
        );
        TS.promisedCallback();
        return Flag.cancel();
      }
    }

    this.resolveMember = async (message, memberName) => {
      let ts = TS.teams(TS.DiscordWrapper.messageGetGuild(message));

      if (!memberName) {
        return this.handleError(ts, message, 'error.missingMemberName');
      }

      let member = await ts.db.Members.query()
      .whereRaw('lower(name) = ?', [memberName.toLowerCase()])
      .first();

      if (!member) {
        return this.handleError(ts, message, 'error.memberNotFound', {
          name: memberName,
        });
      }

      member = await ts.decorateMember(member);

      return member;
    }

    this.resolveMembers = async (message, memberNames) => {
      let ts = TS.teams(TS.DiscordWrapper.messageGetGuild(message));

      memberNames = memberNames.split(/[,\n]/);
      let members = [];

      for(let memberName of memberNames){
        memberName = memberName.trim();
        if (!memberName) {
          return this.handleError(ts, message, 'error.missingMemberNames');
        }

        let member = await ts.db.Members.query()
        .whereRaw('lower(name) = ?', [memberName.toLowerCase()])
        .first();

        if (!member) {
          return this.handleError(ts, message, 'error.memberNotFound', {
            name: memberName,
          });
        }

        member = await ts.decorateMember(member);
        members.push(member);
      }
      return members;
    }

    this.resolveCode = async (message, code, type = 'level') => {
      let ts = TS.teams(TS.DiscordWrapper.messageGetGuild(message));

      if(!code){
        let errName = type === 'level' ? 'error.noCode' : 'makerid.noCode';
        return this.handleError(ts, message, errName);
      }

      code = code.toUpperCase();

      if(!ts.validCode(code)){
        let errName = type === 'level' ? 'error.invalidCode' : 'error.invalidMakerCode';
        return this.handleError(ts, message, errName, { code });
      }

      return code;
    }

    this.resolveGameStyle = async (message, gameStyle) => {
      let ts = TS.teams(TS.DiscordWrapper.messageGetGuild(message));

      if (!gameStyle) {
        return this.handleError(ts, message, 'add.missingGameStyle');
      }

      gameStyle = gameStyle.toUpperCase();

      if(ts.GAME_STYLES.indexOf(gameStyle) === -1){
        return this.handleError(ts, message, 'error.wrongGameStyle');
      }

      return gameStyle;
    }

    this.resolveText = async (message, text, maximumChars, required = true) => {
      let ts = TS.teams(TS.DiscordWrapper.messageGetGuild(message));

      if(!text){
        if(required){
          return this.handleError(ts, message, 'error.missingParameter');
        } else {
          text = "";
        }
      }

      if(text.length > maximumChars){
        return this.handleError(ts, message, 'error.textTooLong', {maximumChars});
      }

      if (ts.isSpecialDiscordString(text)){
        return this.handleError(ts, message, 'error.specialDiscordString');
      }

      return text.trim();
    }

    this.resolveTags = async (message, tags, whitelistedOnly = false) => {
      let ts = TS.teams(TS.DiscordWrapper.messageGetGuild(message));

      if (!tags) {
        return this.handleError(ts, message, 'tags.noTags');
      }
      tags = tags.split(/[,\n]/);

      if(ts.teamVariables.whitelistedTagsOnly === 'true' || whitelistedOnly){
        for(let tag of tags){
          let existingTag = ts.db.Tags.query().where('name', tag).first();
          if(!existingTag){
            return this.handleError(ts, message, 'tags.whitelistedOnly', { tag: tag });
          }
        }
      }

      return tags;
    }

    this.resolveVideos = async (message, videos) => {
      let ts = TS.teams(TS.DiscordWrapper.messageGetGuild(message));

      if (!videos) {
        return this.handleError(ts, message, 'error.noVideos');
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

      if (notUrls.length){
        return this.handleError(ts, message, 'error.notUrls', {urls: notUrls.join('\n',)});
      }

      if (notAllowedUrls.length) {
        return this.handleError(ts, message, 'addVids.notAllowed', {
          videos: notAllowedUrls.join('\n'),
        });
      }

      return filteredUrl;
    }

    this.resolveDifficulty = async (message, difficulty) => {
      let ts = TS.teams(TS.DiscordWrapper.messageGetGuild(message));

      if (difficulty === '') difficulty = null;
      if (difficulty == null) difficulty = null;
      if (difficulty) {
        difficulty = parseFloat(difficulty);
      }
      if ((
        difficulty !== 0 &&
        difficulty &&
        !ts.valid_difficulty(difficulty) || isNaN(difficulty))
      ) {
        return this.handleError(ts, message, 'approval.invalidDifficulty');
      }

      return difficulty;
    }

    this.resolveInt = async (message, num) => {
      let ts = TS.teams(TS.DiscordWrapper.messageGetGuild(message));

      if (num === '') num = null;
      if (num == null) num = null;
      if (num) {
        num = parseInt(num);
      }
      if (isNaN(num) || num <= 0) {
        return this.handleError(ts, message, 'error.invalidInt');
      }

      return num;
    }


    this.commandHandler = new CommandHandler(this, {
      directory: './src/commands/',
      prefix: '!',
      blockClient: false,
      blockBots: false
    });

    this.commandHandler.resolver.addType('level:pending', (message, phrase) => {
      return this.resolveLevel(message, phrase, "pending");
    });
    this.commandHandler.resolver.addType('level:approved', (message, phrase) => {
      return this.resolveLevel(message, phrase, "approved");
    });
    this.commandHandler.resolver.addType('level:any', (message, phrase) => {
      return this.resolveLevel(message, phrase, "all", true);
    });
    this.commandHandler.resolver.addType('level', (message, phrase) => {
      return this.resolveLevel(message, phrase);
    });
    this.commandHandler.resolver.addType('levelcode', (message, phrase) => {
      return this.resolveCode(message, phrase);
    });
    this.commandHandler.resolver.addType('makerid', (message, phrase) => {
      return this.resolveCode(message, phrase, 'maker');
    });
    this.commandHandler.resolver.addType('gamestyle', (message, phrase) => {
      return this.resolveGameStyle(message, phrase);
    });
    this.commandHandler.resolver.addType('text', (message, phrase) => {
      return this.resolveText(message, phrase, 256);
    });
    this.commandHandler.resolver.addType('longtext', (message, phrase) => {
      return this.resolveText(message, phrase, 800);
    });
    this.commandHandler.resolver.addType('longertext', (message, phrase) => {
      return this.resolveText(message, phrase, 1500);
    });
    this.commandHandler.resolver.addType('text:optional', (message, phrase) => {
      return this.resolveText(message, phrase, 256, false);
    });
    this.commandHandler.resolver.addType('tags', (message, phrase) => {
      return this.resolveTags(message, phrase);
    });
    this.commandHandler.resolver.addType('tags:whitelisted', (message, phrase) => {
      return this.resolveTags(message, phrase, true);
    });
    this.commandHandler.resolver.addType('videos', (message, phrase) => {
      return this.resolveVideos(message, phrase);
    });
    this.commandHandler.resolver.addType('difficulty', (message, phrase) => {
      return this.resolveDifficulty(message, phrase);
    });
    this.commandHandler.resolver.addType('teammember', (message, phrase) => {
      return this.resolveMember(message, phrase);
    });
    this.commandHandler.resolver.addType('teammembers', (message, phrase) => {
      return this.resolveMembers(message, phrase);
    });
    this.commandHandler.resolver.addType('int', (message, phrase) => {
      return this.resolveInt(message, phrase);
    });

    this.commandHandler.loadAll();
  }
}

module.exports = TSClient;