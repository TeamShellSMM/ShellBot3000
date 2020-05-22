'use strict';

const crypto = require('crypto');
const moment = require('moment');
const jwt = require('jsonwebtoken');
const stringSimilarity = require('string-similarity');
const Handlebars = require('handlebars');
const debug = require('debug')('shellbot3000:ts');
const knex = require('./db/knex');
const DEFAULTMESSAGES = require('./DefaultStrings.js');
const DiscordLog = require('./DiscordLog');
const UserError = require('./UserError');
const Teams = require('./models/Teams.js');
const Tokens = require('./models/Tokens');
const Plays = require('./models/Plays');
const PendingVotes = require('./models/PendingVotes');
const Members = require('./models/Members');
const Levels = require('./models/Levels');
const Points = require('./models/Points');
const {
  defaultChannels,
  defaultVariables,
  LEVEL_STATUS,
  PENDING_LEVELS,
  SHOWN_IN_LIST,
  REMOVED_LEVELS,
} = require('./constants');
const CONSTANTS = require('./constants');

Handlebars.registerHelper('plural', function (_num) {
  const num = Number(_num);
  return num > 1 || num === 0 ? 's' : '';
});

Handlebars.registerHelper('1dp', function (num) {
  if (typeof num === 'number') return num.toFixed(1);
  if (typeof num === 'string' && !Number.isNaN(Number(num)))
    return Number(num).toFixed(1);
  return num;
});

/**
 * This is the main object that encapsulates all the various MakerTeam processes for a guild. Any methods called from an instance will only be for that guild
 * @class
 * @param {string} guild_id - the discord guild_id this TS does
 * @param {AkairoClient} client
 *
 */
class TS {
  constructor(guildId, DiscordWrapper) {
    if (!guildId) {
      throw new Error(`No guild_id was passed to TS()`);
    }

    this.DiscordWrapper = DiscordWrapper;
    TS.DiscordWrapper = DiscordWrapper;
    this.discord = new DiscordWrapper(guildId);
    this.CONSTANTS = CONSTANTS;
    this.defaultVariables = defaultVariables;
    this.LEVEL_STATUS = LEVEL_STATUS;
    this.PENDING_LEVELS = PENDING_LEVELS;
    this.SHOWN_IN_LIST = SHOWN_IN_LIST;
    this.REMOVED_LEVELS = REMOVED_LEVELS;

    this.guild_id = guildId;
    this.guildId = guildId;

    this.devs = process.env.DEVS.split(',');
    this.page_url = process.env.PAGE_URL;
    this.getSettings = async (type, map = false) => {
      const rows = await knex('team_settings')
        .where({ guild_id: this.team.id })
        .where({ type });
      if (map) return rows;

      const ret = {};
      rows.forEach((r) => {
        ret[r.name] = r.value;
      });
      return ret;
    };

    /**
     * Important function that loads all the necessary data on runtime.
     */
    const ts = this;
    this.load = async function () {
      debug(`ts.load started for ${this.guild_id}`);
      const guild = ts.getGuild(this.guild_id);
      await guild.fetchMembers(); // just load up all members
      const Team = Teams(this.guild_id);
      this.team = await Team.query().select().first();
      this.db = {
        Teams: Team,
        Tokens,
        Plays: Plays(this.team.id),
        PendingVotes: PendingVotes(this.team.id),
        Members: Members(this.team.id),
        Levels: Levels(this.team.id),
        Points: Points(this.team.id),
      };

      this.url_slug = this.team.url_slug;
      this.config = JSON.parse(this.team.config) || {};
      let updateConfig = false;
      if (this.config.key) {
        this.secureKey = this.config.key;
      } else {
        this.secureKey = this.generateToken(512);
        this.config.key = this.secureKey;
        updateConfig = true;
      }
      if (!this.config.feedback_salt) {
        this.config.feedback_salt = this.generateToken(512);
        updateConfig = true;
      }
      if (updateConfig) {
        await this.db.Teams.query().patch({
          config: JSON.stringify(this.config),
        }); // generate secure key if doesn't exist
      }
      this.guild_id = guildId;
      this.knex = knex;

      const dbToMap = {
        settings: 'teamVariables',
        channels: 'channels',
        strings: 'customStrings',
      };

      this.teamVariables = {};
      this.channels = {};
      this.customStrings = {
        levelInfo: '@@LEVELPLACEHOLDER@@',
        teamurl: `${ts.page_url}/${this.url_slug}`,
        BotName: 'ShellBot3000',
      };

      const data = await knex('team_settings')
        .where({
          guild_id: this.team.id,
        })
        .whereIn('type', ['settings', 'channels', 'customStrings']);

      data.forEach((d) => {
        this[dbToMap[d.type]][d.name] = d.value;
      });

      this.emotes = {
        think: this.teamVariables.userErrorEmote,
        PigChamp: this.teamVariables.pogEmote,
        buzzyS: this.teamVariables.criticalErrorEmote,
        bam: this.teamVariables.updateEmote,
        love: this.teamVariables.loveEmote,
        GG: this.teamVariables.GGEmote,
      };

      this.validDifficulty = [];
      const maxDifficulty =
        Math.round(
          parseFloat(this.teamVariables.maxDifficulty) * 10,
        ) || 100;
      for (let i = 0; i <= maxDifficulty; i += 1) {
        this.validDifficulty.push(i / 10);
      }

      const allLevels = await this.getLevels();
      let allTags = allLevels.map((l) => l.tags);
      if (allTags.length !== 0) {
        allTags = allTags.reduce((total, t) => `${total},${t}`);
      }
      await knex.transaction(async (trx) => {
        await this.addTags(allTags, trx);
      });

      this.messages = {};
      TS.defaultMessages = {};
      Object.entries(DEFAULTMESSAGES).forEach((v) => {
        TS.defaultMessages[v[0]] = this.makeTemplate(v[1]);
        this.messages[v[0]] = this.makeTemplate(v[1]);
      });

      (await this.getSettings('messages', true)).forEach((v) => {
        this.messages[v[0]] = this.makeTemplate(v[1] || '');
      });

      this.embedStyle = {
        [ts.LEVEL_STATUS.REJECTED]: {
          color: this.teamVariables.rejectColor || '#dc3545',
          title: 'judge.levelRejected',
          image: this.teamVariables.rejectedEmote,
          noLink: true,
        },
        [ts.LEVEL_STATUS.APPROVED]: {
          color: this.teamVariables.approveColor || '#01A19F',
          title: 'judge.approved',
          image: this.teamVariables.approvedEmote,
        },
        [ts.LEVEL_STATUS.NEED_FIX]: {
          color: this.teamVariables.needFixColor || '#D68100',
          title: 'approval.fixPlayerInstructions',
          image: this.teamVariables.needFixEmote,
        },
        judgement: {
          color: this.teamVariables.judgementColor || null,
          title: 'approval.judgementBegin',
          image: ts.teamVariables.judgementEmote,
        },
        remove: {
          color: this.teamVariables.removeColor || '#dc3545',
          title: 'remove.removedBy',
          image: ts.teamVariables.removeEmote,
          noLink: true,
        },
        rerate: {
          color: '#17a2b8',
          title: 'difficulty.updated',
          image: ts.teamVariables.rerateEmote,
        },
        random: {
          color: '#17a2b8',
          title: 'random.embedTitle',
          image: ts.teamVariables.randomEmote,
        },
        randoms: {
          title: 'random.embedTitlePlayers',
          image: ts.teamVariables.randomEmote,
        },
        undo: {
          color: '#17a2b8',
          title: 'undoRemoveLevel.title',
          image: ts.teamVariables.undoEmote || ts.emotes.bam,
        },
      };
      // should verify that the discord roles id exist in server
      this.ranks = await knex('ranks')
        .where({ guild_id: this.team.id })
        .orderBy('min_points', 'desc');
      this.rank_ids = this.ranks.map((r) => r.discord_role);
      await this.saveSheetToDb();
      await this.recalculateAfterUpdate();
      this.pointMap = {};
      const rawPoints = await ts.db.Points.query().select();
      for (let i = 0; i < rawPoints.length; i += 1) {
        this.pointMap[rawPoints[i].difficulty] = rawPoints[i].score;
      }
      await DiscordLog.log(
        `Data loaded for ${this.teamVariables.TeamName}`,
      );
      debug(`ts.load has ended for ${this.guild_id}`);
    };
    this.getPoints = function (difficulty) {
      return this.pointMap[parseFloat(difficulty)];
    };
    this.getLevels = () => {
      return knex('levels')
        .select(
          knex.raw(
            `levels.*, members.id creator_id,members.name creator`,
          ),
        )
        .join('members', { 'levels.creator': 'members.id' })
        .where('levels.guild_id', this.team.id);
    };
    this.getPlays = () => {
      return knex('plays')
        .select(
          knex.raw(`
        ROW_NUMBER() OVER ( ORDER BY plays.id ) as no,
        plays.*,
        members.id player_id,
        members.name player,
        levels.id level_id,
        levels.code code,
        levels.difficulty,
        levels.level_name,
        levels.videos,
        levels.tags,
        creator_table.name creator_name,
        creator_table.id creator_id`),
        )
        .join('members', { 'plays.player': 'members.id' })
        .join('levels', { 'plays.code': 'levels.id' })
        .join('members as creator_table', {
          'creator_table.id': 'levels.creator',
        })
        .whereIn('levels.status', ts.SHOWN_IN_LIST)
        .where('plays.guild_id', this.team.id);
    };
    this.getPendingVotes = () => {
      return knex('pending_votes')
        .select(
          knex.raw(
            `pending_votes.*, members.id player_id,members.name player,levels.id level_id,levels.code code`,
          ),
        )
        .join('members', { 'pending_votes.player': 'members.id' })
        .join('levels', { 'pending_votes.code': 'levels.id' })
        .where('pending_votes.guild_id', this.team.id);
    };
    /**
     * This checks if a string contains a special discord string.
     */
    this.isSpecialDiscordString = (str) => {
      return /<(@[!&]?|#|a?:[a-zA-Z0-9_]{2,}:)[0-9]{16,20}>/.test(
        str,
      );
    };

    this.teamAdmin = (discord_id) => {
      if (!discord_id) return false;
      const guild = this.discord.guild();
      const discordUser = guild.members.get(discord_id);
      return (
        (Array.isArray(this.devs) &&
          this.devs.includes(discord_id)) ||
        guild.owner.user.id === discord_id ||
        (discordUser && discordUser.hasPermission('ADMINISTRATOR'))
      );
    };

    this.modOnly = async (discordId) => {
      if (!discordId) return false;
      if (this.devs && this.devs.indexOf(discordId) !== -1) {
        return true;
      }
      const guild = await this.discord.guild();
      if (guild.owner.user.id === discordId) {
        // owner can do anything
        return true;
      }
      if (ts.teamVariables.discordAdminCanMod === 'yes') {
        // if yes, any discord mods can do team administrative stuff but won't officially appear in the "Mod" list
        const discordUser = guild.members.get(discordId);
        if (
          discordUser &&
          discordUser.hasPermission('ADMINISTRATOR')
        ) {
          return true;
        }
      }
      // specified, listed mods can do anything
      const member = await ts.db.Members.query()
        .where({ discord_id: discordId })
        .first();
      if (member && member.is_mod) {
        return true;
      }
      return false;
    };

    /**
     * Will sync spreadsheet and discord information to the database. To be called on startup or via a command by mods
     */
    this.saveSheetToDb = async function () {
      await ts.knex.transaction(async (trx) => {
        const guild = ts.getGuild();
        let mods = [guild.owner.user.id];
        if (this.teamVariables.ModName) {
          mods = guild.members
            .filter((m) =>
              m.roles.some(
                (role) => role.name === this.teamVariables.ModName,
              ),
            )
            .map((m) => m.user.id);
        }
        await ts.db.Members.query(trx)
          .patch({ is_mod: null })
          .whereNotIn('discord_id', mods)
          .where({ is_mod: 1 });
        await ts.db.Members.query(trx)
          .patch({ is_mod: 1 })
          .whereIn('discord_id', mods)
          .where({ is_mod: null });
      });
    };

    /**
     * Method to add a level to MakerTeams
     */
    this.addLevel = async ({
      code,
      level_name: levelName,
      discord_id,
    }) => {
      if (!code) ts.userError(ts.message('error.noCode'));
      if (!ts.validCode(code))
        ts.userError(ts.message('error.invalidCode'));
      if (!levelName) ts.userError(ts.message('add.noName'));
      if (ts.isSpecialDiscordString(levelName))
        ts.userError(ts.message('error.specialDiscordString'));
      const player = await ts.getUser(discord_id);
      const existingLevel = await ts
        .getLevels()
        .where({ code })
        .first();
      if (existingLevel)
        ts.userError(
          ts.message('add.levelExisting', { level: existingLevel }),
        );
      if (!player.earned_points.canUpload) {
        ts.userError(
          ts.message('points.cantUpload', {
            points_needed: player.earned_points.pointsNeeded,
          }),
        );
      }
      await ts.db.Levels.query().insert({
        code,
        level_name: levelName,
        creator: player.id,
        difficulty: 0,
        tags:
          ts.teamVariables.allowSMM1 === 'true' && ts.is_smm1(code)
            ? 'SMM1'
            : '',
        status: 0,
      });
      await ts.recalculateAfterUpdate({ name: player.name });
      return {
        reply: ts.message('add.success', {
          level_name: levelName,
          code,
        }),
        player,
      };
    };

    /**
     * function to generate a message based on the template string type. automatically assigns default and team variables apart from provided arguments
     * @param {string} type the message type defined in DefaultStrings which could be overwritten by custom messages
     * @param {object} args the values to be passed to Handlebar. overrides any default values
     * @returns {string} final message string
     */
    this.message = function (type, args) {
      if (this.messages[type]) {
        return this.messages[type](args);
      }
      throw new Error(
        `"${type}" message string was not found in ts.message`,
      );
    };
    /**
     * Generates a login link to be DM-ed to the user to login to the website
     * @returns {string} login link
     */
    this.generateLoginLink = function (otp) {
      return `${ts.page_url + ts.url_slug}/login/${otp}`;
    };
    /**
     * A helper function to generate the tokens. Will be mocked in tests
     * @param {number} [length] Length of the token. default is 8
     */
    this.generateToken = (length = 8) => {
      return crypto.randomBytes(length).toString('hex').toUpperCase();
    };

    this.generateUniqueToken = async (length = 8) => {
      let token = this.generateToken(length);
      let existing = await this.db.Tokens.query()
        .where({ token })
        .first(); // need to add check for only within expiry time (30 minutes)
      while (existing != null) {
        token = this.generateToken(length);
        // eslint-disable-next-line no-await-in-loop
        existing = await this.db.Tokens.query()
          .where({ token })
          .first();
      }
      return token;
    };

    /**
     * Generates a one time password for the user to login to the site
     * @param {string} discord_id - Discord id
     * @return {string} - A random unique token
     */
    this.generateOtp = async function (discord_id) {
      const newOtp = await this.generateUniqueToken();
      await ts.db.Tokens.query().insert({
        discord_id: discord_id,
        token: newOtp,
      });
      return newOtp;
    };
    /**
     * This will login the user to the site. The OTP token row will be generated by a new token that identifies the user
     */
    this.login = async function (discord_id, rowId) {
      const bearer = await this.generateUniqueToken(16);
      await ts.db.Tokens.query().findById(rowId).patch({
        token: bearer,
        authenticated: 1,
      });
      this.discord.dm(discord_id, ts.message('website.loggedin'));
      return bearer;
    };
    /**
     * A function that checks if a token is valid and returns the discord_id
     * @param {string} token  Token to be passed by the user via the Web endpoint
     * @returns {string}  Discord id of the user
     * @throws {UserError} - When the token is expired
     * @throws {UserError} - When the token is not found in the database
     */
    this.checkBearerToken = async function (token) {
      if (!token) ts.userError('website.noToken');
      const existingToken = await ts.db.Tokens.query()
        .where('token', '=', token)
        .first();
      if (existingToken) {
        const tokenExpireAt = moment(existingToken.created_at)
          .add(30, 'days')
          .valueOf();
        const now = moment().valueOf();
        if (tokenExpireAt < now) ts.userError('website.tokenError');
      } else {
        ts.userError('website.authError');
      }
      return existingToken.discord_id;
    };
    /**
     * Checks if the code is an SMM1 code. Should be true only when ts.teamVariables.allowSMM1=='yes'
     * @param {string} code Level code
     * @returns {boolean} is SMM1 code
     */
    this.is_smm1 = function (code) {
      if (!code) return false;
      return /^[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}$/.test(
        code.toUpperCase(),
      );
    };
    /**
     * Checks if the code is an SMM2 code
     * @param {string} code Level code
     * @returns {boolean} is SMM1 code
     */
    this.is_smm2 = function (code) {
      if (!code) return false;
      return /^[1234567890QWERTYUPASDFGHJKLXCVBNM]{3}-[1234567890QWERTYUPASDFGHJKLXCVBNM]{3}-[1234567890QWERTYUPASDFGHJKLXCVBNM]{3}$/.test(
        code.toUpperCase(),
      );
    };
    /**
     * Checks if the passed code is a valid code or not. Takes into account of ts.teamVariables.allowSMM1
     @ @param {string} code Level code
     * @returns {boolean}
     */
    this.validCode = function (code) {
      if (code == null) return false;
      return (
        this.is_smm2(code) ||
        (this.teamVariables.allowSMM1 === 'true' &&
          this.is_smm1(code))
      );
    };
    /**
     * Helper function to get the direct Discord emote image url to be used for discord embeds
     */
    this.getEmoteUrl = function (emote) {
      if (!emote) return '';
      const id = emote.split(':')[2].slice(0, -1);
      return `https://cdn.discordapp.com/emojis/${id}?v=100`;
    };
    /**
     * Function to check if the user supplied difficulty is a valid difficulty. to be refactored
     * @param diff the user supplied difficulty
     * @return {boolean}
     */
    this.valid_difficulty = function (diff) {
      for (let i = 0; i < this.validDifficulty.length; i += 1) {
        if (this.validDifficulty[i] === Number(diff)) return true;
      }
      return false;
    };
    /**
     * Helper function to convert a long text and embeds them as fields to a DiscordEmbed
     */
    this.embedAddLongField = function (
      embed,
      body,
      pHeader = '\u200b',
    ) {
      let header = pHeader;
      const bodyArr = body ? body.split('.') : [];
      const bodyStr = [''];
      for (let k = 0, l = 0; k < bodyArr.length; k += 1) {
        if (bodyArr[k]) {
          if (bodyStr[l].length + bodyArr[k].length + 1 > 980) {
            l += 1;
            bodyStr[l] = '';
          }
          bodyStr[l] += `${bodyArr[k]}.`;
        }
      }
      for (let k = 0; k < bodyStr.length; k += 1) {
        embed.addField(header, bodyStr[k]);
        header = '\u200b';
      }
    };
    /**
     * Helper function to coerce/validate passed parameter from user is the boolean format used
     */
    this.commandPassedBoolean = (value) => {
      if (value === '') return null;
      if (['1', 1, true].includes(value)) return 1;
      if (['0', 0, false].includes(value)) return 0;
      if (value != null)
        DiscordLog.error(
          `"${value}" was passed to this.commandPassedBoolean.`,
        );
      return null;
    };
    /**
     * @typedef {Object.<string,string,boolean,boolean,number,boolean>} TsClearParam
     * @property {string} discord_id   - Discord id of user
     * @property {string} code         - Level code
     * @property {boolean} completed   - When 1, a clear will be saved. When 0 then a clear will be removed. Null will not updated the clear information
     * @property {boolean} liked       - When 1, a like will be saved. When 0 then a like will be removed. Null will not updated the like information
     * @property {number} difficulty   - When a valid difficulty is passed, a difficulty will be saved. When 0, the difficulty vote will be removed. Null will not update the difficulty infomration
     * @property {boolean} strOnly     - When 1, a formated user identification string will not be passed. Used for the web
     */
    /**
     * @description This function submits a clear based on the passed arguments and will do the checks.
     * @param {...TsClearParam} args Arguments to be supplied from either !clear or the website
     * @return {string} A response string to be sent to the user.
     */
    this.clear = async (args = {}) => {
      let { code, completed, liked, difficulty } = args;
      const { discord_id, strOnly, player_atme: playerAtMe } = args;

      if (!discord_id) ts.userError(ts.message('error.noDiscordId'));
      if (difficulty === 'like') {
        difficulty = null;
        liked = 1;
      }
      if (difficulty === 'unlike') {
        difficulty = null;
        liked = 0;
      }

      if (liked === 'like') {
        liked = 1;
      }
      if (liked === 'unlike') {
        liked = 0;
      }
      liked = ts.commandPassedBoolean(liked);
      completed = ts.commandPassedBoolean(completed);
      if (difficulty === '') difficulty = null;
      if (difficulty == null) difficulty = null;
      if (completed == null && liked == null && difficulty == null) {
        ts.userError(ts.message('clear.noArgs'));
      }
      if (code == null) {
        ts.userError(ts.message('error.noCode'));
      }
      code = code.toUpperCase();
      if (difficulty && Number.isNaN(Number(difficulty))) {
        ts.userError(ts.message('clear.invalidDifficulty'));
      }
      if (difficulty) {
        difficulty = parseFloat(difficulty);
      }
      if (
        difficulty !== 0 &&
        difficulty &&
        !ts.valid_difficulty(difficulty)
      ) {
        ts.userError(ts.message('clear.invalidDifficulty'));
      }
      const player = await ts.getUser(discord_id);
      const level = await ts.getExistingLevel(code);
      if (level.creator_id === player.id)
        ts.userError(ts.message('clear.ownLevel'));
      const existingPlay = await ts.db.Plays.query()
        .where('code', '=', level.id)
        .where('player', '=', player.id)
        .first();
      const creator = await ts.db.Members.query()
        .where({ id: level.creator_id })
        .first(); // oddface/taika is only non registered member with a level

      const creatorStr =
        creator && creator.atme && creator.discord_id && !strOnly
          ? `<@${creator.discord_id}>`
          : creator.name;
      const msg = [];
      const updated = {};
      if (existingPlay) {
        const updatedRow = {};
        if (
          [1, 0].includes(completed) &&
          existingPlay.completed !== completed
        ) {
          // update completed
          updatedRow.completed = completed ? 1 : 0;
          updated.completed = true;
        }
        if ([1, 0].includes(liked) && existingPlay.liked !== liked) {
          // like updated
          updatedRow.liked = liked;
          updated.liked = true;
        }
        if (
          (difficulty === 0 &&
            existingPlay.difficulty_vote != null) ||
          (difficulty && existingPlay.difficulty_vote !== difficulty)
        ) {
          // difficulty update
          updatedRow.difficulty_vote =
            difficulty === 0 ? null : difficulty; // 0 difficulty will remove your vote
          updated.difficulty = true;
        }
        if (updatedRow)
          await ts.db.Plays.query()
            .findById(existingPlay.id)
            .patch(updatedRow);
      } else {
        await ts.db.Plays.query().insert({
          code: level.id,
          player: player.id,
          completed: completed || 0,
          liked: liked || 0,
          is_shellder: player.is_mod || 0,
          difficulty_vote: difficulty === 0 ? null : difficulty,
        });
        if (completed != null) updated.completed = true;
        if (liked != null) updated.liked = true;
        if (difficulty != null) updated.difficulty = true;
        await ts.recalculateAfterUpdate({ name: player.name });
      }
      if ([0, 1].includes(completed)) {
        if (updated.completed) {
          if (completed) {
            msg.push(ts.message('clear.addClear', { level }));
            if (level.status === ts.LEVEL_STATUS.APPROVED) {
              msg.push(
                ts.message('clear.earnedPoints', {
                  earned_points: ts.getPoints(level.difficulty),
                }),
              );
            } else {
              msg.push(ts.message('clear.pendingLevel'));
            }
          } else {
            msg.push(ts.message('clear.removedClear', { level }));
          }
        } else {
          msg.push(
            ts.message(
              completed
                ? 'clear.alreadyCleared'
                : 'clear.alreadyUncleared',
            ),
          );
        }
      }
      if (updated.difficulty) {
        msg.push(
          difficulty === 0
            ? ts.message('clear.removeDifficulty', { level })
            : ts.message('clear.addDifficulty', {
                level: level,
                difficulty_vote: difficulty,
              }),
        );
      } else if (difficulty || difficulty === 0) {
        msg.push(
          difficulty === 0
            ? ts.message('clear.alreadyDifficulty', { level })
            : ts.message('clear.alreadyNoDifficulty', {
                level: level,
                difficulty_vote: difficulty,
              }),
        );
      }
      if ([0, 1].includes(liked)) {
        if (updated.liked) {
          msg.push(
            ts.message(liked ? 'clear.addLike' : 'clear.removeLike', {
              level,
            }),
          );
        } else {
          msg.push(
            ts.message(
              liked ? 'clear.alreadyLiked' : 'clear.alreadyUnliked',
              { level },
            ),
          );
        }
      }
      const userReply = playerAtMe
        ? player.userReply_atme
        : player.userReply;
      return (
        (strOnly ? '' : userReply) +
        ts.processClearMessage({ msg, creatorStr, level })
      );
    };
    /**
     * Processes the array of messages made by clear and replace repeating items with pronouns
     *
     * @param {Object} args - An object.
     * @param {string[]} args.msg - Array of strings provided by ts.clear
     * @param {string} args.creatorStr - A string which is either the creator name or discord at
     * @param {Object} args.level - A level object, with creator being a name instead of id
     * @return {string} Returns the formatted string
     */
    this.processClearMessage = function (args) {
      const { msg, creatorStr, level } = args;
      const levelPlaceholder = this.customStrings.levelInfo;
      let levelStr = ts.message('clear.levelInfo', {
        level,
        creator: creatorStr,
      });
      const singleHave = ts.message('clear.singleHave');
      const manyHave = ts.message('clear.manyHave');
      const levelPronoun = ts.message('clear.levelPronoun');
      for (let i = 0; i < msg.length; i += 1) {
        if (msg[i]) {
          msg[i] = msg[i].replace(levelPlaceholder, levelStr);
          if (i > 1) msg[i] = msg[i].replace(singleHave, manyHave);
          levelStr = levelPronoun;
        }
      }
      return `\n${msg.join('\n')}`;
    };
    /**
     * Gets an existing and does checks if they exist or not, also offering possible levels if the code was a mistake
     *
     *  @return {string} returns a level object
     *  @throws {ts.UserError} Will throw a UserError if level code is not found. Will provide a possible level suggestion
     *  @throws {ts.UserError} Will throw a UserError if level code is not pending or approved, noting either it's need fixing or removed
     */
    this.getExistingLevel = async function (
      code,
      includeRemoved = false,
    ) {
      if (!code) {
        ts.userError(ts.message('error.noCode'));
      }
      const level = await ts.getLevels().where({ code }).first();
      if (!level) {
        // level doesn't exist
        const notDeletedLevels = {};
        const allLevels = {};
        const rawLevels = await ts.getLevels().select();
        rawLevels.forEach((l) => {
          if (
            l &&
            (l.status === ts.LEVEL_STATUS.PENDING ||
              l.status === ts.LEVEL_STATUS.APPROVED)
          ) {
            notDeletedLevels[
              l.code
            ] = `${l.code} - "${l.level_name}" by ${l.creator}`;
          }
          allLevels[
            l.code
          ] = `${l.code} - "${l.level_name}" by ${l.creator}`;
        });
        let listUsed = includeRemoved ? allLevels : notDeletedLevels;
        listUsed = Object.keys(listUsed);
        let matchStr = '';
        if (listUsed.length > 0) {
          const match = stringSimilarity.findBestMatch(
            code,
            listUsed,
          );
          if (match.bestMatch && match.bestMatch.rating >= 0.6) {
            matchStr = ts.message('level.didYouMean', {
              level_info: allLevels[match.bestMatch.target],
            });
          }
        }
        ts.userError(
          ts.message('error.levelNotFound', { code }) + matchStr,
        );
      }
      if (
        !includeRemoved &&
        ts.REMOVED_LEVELS.includes(level.status)
      ) {
        // level is removed. not pending/accepted
        ts.userError(ts.message('error.levelIsRemoved', { level }));
      }
      return level;
    };
    /**
     * Get the team variables stored in the database
     */
    this.get_variable = function (varName) {
      return this.teamVariables[varName];
    };
    /**
     * Calculates the points needed to upload a level. 0 points needed means the user can upload a level
     *
     * @returns {Number} Will return the points needed rounded to the nearest 1 decimal point
     */
    this.pointsNeededForLevel = function (args) {
      const {
        points,
        levelsUploaded,
        freeLevels = 0,
        min,
        next,
      } = args;
      const nextLevel = levelsUploaded + 1 - (freeLevels || 0);
      const nextPoints =
        (nextLevel === 1 ? min : min) + (nextLevel - 1) * next;
      const pointsDifference =
        Math.round((nextPoints - parseFloat(points)) * 10) / 10;
      return Math.max(pointsDifference, 0);
    };
    this.UserError = UserError;

    /**
     * Helper function to throw the user error
     */
    this.userError = function (errorStr, args) {
      throw new UserError(
        this.messages[errorStr]
          ? this.messages[errorStr](args)
          : errorStr,
      );
    };

    /**
     * Makes a custom object to pass to DiscordLog
     */
    this.makeErrorObj = function (obj, message) {
      return {
        error: obj.stack ? obj.stack : obj,
        url_slug: this.team.url_slug,
        content: this.discord.getContent(message),
        user: this.discord.getUsername(message),
        channel: `<#${this.discord.messageGetChannel(message)}>`,
      };
    };

    /**
     * To be used to parse a thrown exception and check if it's a user error in discord. User error can be passed to the user. any other error, we will throw a non descript error message to the user and log the actual error
     */
    this.getUserErrorMsg = function (obj, message) {
      if (obj instanceof UserError) {
        return obj.msg + ts.message('error.afterUserDiscord');
      }
      DiscordLog.error(ts.makeErrorObj(obj, message));
      return ts.message('error.unknownError');
    };
    /**
     * To be used to parse a thrown exception and check if it's a user error in the JSON endpoint. User error can be passed to the user. any other error, we will throw a non descript error message to the user and log the actual error
     */
    this.getWebUserErrorMsg = function (obj) {
      if (obj instanceof UserError) {
        return {
          status: 'error',
          message: obj.msg + ts.message('error.afterUserWeb'),
        };
      }
      DiscordLog.error({
        error: obj.stack ? obj.stack : obj,
        url_slug: this.url_slug,
      });
      return {
        status: 'error',
        message: ts.message('error.unknownError'),
      };
    };
    /**
     * Helper function to get a random integer for ts.random
     */
    this.getRandomInt = (pMin, pMax) => {
      const min = Math.ceil(pMin);
      const max = Math.floor(pMax);
      return Math.floor(Math.random() * (max - min)) + min; // The maximum is exclusive and the minimum is inclusive
    };
    /**
     * Gets a random level based on plays of the player/passed players and difficulty
     */
    this.randomLevel = async function (args) {
      const { discord_id, players } = args;
      let { minDifficulty, maxDifficulty } = args;
      if (minDifficulty && !ts.valid_difficulty(minDifficulty)) {
        ts.userError(
          maxDifficulty
            ? ts.message('random.noMinDifficulty')
            : ts.message('random.noDifficulty'),
        );
      }
      if (maxDifficulty) {
        if (!ts.valid_difficulty(maxDifficulty))
          ts.userError(ts.message('random.noMaxDifficulty'));
      } else if (minDifficulty) {
        maxDifficulty = minDifficulty;
      }
      if (parseFloat(minDifficulty) > parseFloat(maxDifficulty)) {
        const temp = maxDifficulty;
        maxDifficulty = minDifficulty;
        minDifficulty = temp;
      }
      const min = parseFloat(minDifficulty) || 1;
      const max = parseFloat(maxDifficulty) || min;
      let playerIds;
      const player =
        discord_id != null ? await ts.getUser(discord_id) : null;
      if (players) {
        const playerNames = players.split(',');
        const rawPlayers = await ts.db.Members.query().whereIn(
          'name',
          playerNames,
        );
        if (rawPlayers.length === 0)
          ts.userError(ts.message('random.noPlayersGiven'));
        playerIds = [];
        const dbPlayerNames = rawPlayers.map((n) => n.name);
        if (rawPlayers.length !== playerNames.length) {
          this.userError('random.playerNotFound', {
            player: playerNames.find(
              (n) => !dbPlayerNames.includes(n),
            ),
          });
        }

        playerIds = rawPlayers.map((p) => p.id);
      } else if (player) {
        playerIds = [player.id];
      }
      const playsSQL1 = playerIds
        ? `
    left join plays on levels.id=plays.code
    and plays.player in (:players:)
    and completed=1`
        : '';
      const playsSQL2 = playerIds
        ? `and creator not in (:players:)`
        : '';
      const playsSQL3 = playerIds ? `and plays.id is null` : '';
      const par = {
        team_id: ts.team.id,
        min,
        max,
        players: playerIds,
      };
      const [filteredLevels] = await knex.raw(
        `
    SELECT levels.*,members.name creator from
    levels
    inner join members on levels.creator=members.id
    ${playsSQL1}
    where status=1
    ${playsSQL2}
    and levels.guild_id=:team_id
    and ( levels.not_default is null or levels.not_default!=1 )
    and levels.difficulty between :min and :max
    ${playsSQL3}
    group by levels.id
    order by likes;`,
        par,
      );
      if (filteredLevels.length === 0) {
        ts.userError(
          ts.message('random.outOfLevels', {
            range: min === max ? min : `${min}-${max}`,
          }),
        );
      }
      const borderLine = Math.floor(filteredLevels.length * 0.6);
      let randNum;
      if (Math.random() < 0.2) {
        randNum = ts.getRandomInt(0, borderLine);
      } else {
        randNum = ts.getRandomInt(borderLine, filteredLevels.length);
      }
      const level = filteredLevels[randNum];
      return {
        player: player,
        level: level,
      };
    };

    /**
     * A function that will get the user object based on the discord_id/message passed. Will do the necessary authentication checks and throw the necessary UserErrors
     */
    this.getUser = async function (message) {
      const discord_id = ts.discord.getAuthor(message) || message;
      if (!discord_id) {
        this.userError('error.noDiscordId');
      }
      const player = await this.db.Members.query()
        .where({ discord_id })
        .first();
      if (!player) this.userError('error.notRegistered');
      if (player.is_banned) this.userError('error.userBanned');
      player.created_at = player.created_at.toString();
      player.earned_points = await this.calculatePoints(player.name);
      player.rank = this.getRank(player.earned_points.clearPoints);
      player.rank.pips = player.rank.pips || '';
      player.atme_str = player.atme
        ? `<@${player.discord_id}>`
        : player.name;
      player.userReply = `<@${player.discord_id}>${player.rank.pips} `;
      player.userReply_atme = `${
        player.atme_str + player.rank.pips
      } `;

      return player;
    };
    /**
     * This extends the levelEmbed and add all the pending votes associated with this level. to be used in the level discussion channels
     */
    this.makeVoteEmbed = async function (level, reuploadComment) {
      const approveVotes = await ts
        .getPendingVotes()
        .where('levels.id', level.id)
        .where({ type: 'approve' });
      const fixVotes = await ts
        .getPendingVotes()
        .where('levels.id', level.id)
        .where({ type: 'fix' });
      const rejectVotes = await ts
        .getPendingVotes()
        .where('levels.id', level.id)
        .where({ type: 'reject' });
      const voteEmbed = ts.levelEmbed(
        level,
        this.embedStyle.judgement,
      );
      if (
        level.status === ts.LEVEL_STATUS.PENDING_APPROVED_REUPLOAD
      ) {
        voteEmbed
          .setAuthor(ts.message('pending.pendingTitle'))
          .setDescription(
            ts.message('pending.alreadyApprovedBefore'),
          );
      } else if (
        level.status === ts.LEVEL_STATUS.PENDING_NOT_FIXED_REUPLOAD
      ) {
        voteEmbed
          .setAuthor(ts.message('pending.refuseTitle'))
          .setDescription(ts.message('pending.refuseDescription'));
      } else if (
        level.status === ts.LEVEL_STATUS.PENDING_FIXED_REUPLOAD
      ) {
        voteEmbed
          .setAuthor(ts.message('pending.reuploadedTitle'))
          .setDescription(
            ts.message('pending.fixReuploadDescription'),
          );
      }
      if (reuploadComment) {
        voteEmbed.addField(
          `Creator (${level.creator_name}) reupload comment:`,
          `\`\`\`\n${reuploadComment}\n\`\`\``,
        );
      }
      let postString = ts.message('approval.approvalVotes');
      if (approveVotes === undefined || approveVotes.length === 0) {
        postString += ts.message('approval.noVotes');
      } else {
        for (let i = 0; i < approveVotes.length; i += 1) {
          const curShellder = await ts.db.Members.query()
            .where({ name: approveVotes[i].player })
            .first();
          postString += `<@${curShellder.discord_id}> - Difficulty: ${approveVotes[i].difficulty_vote}, Reason: ${approveVotes[i].reason}\n`;
        }
      }
      postString += ts.message('approval.fixVotes');
      if (fixVotes === undefined || fixVotes.length === 0) {
        postString += '> None\n';
      } else {
        for (let i = 0; i < fixVotes.length; i += 1) {
          const curShellder = await ts.db.Members.query()
            .where({ name: fixVotes[i].player })
            .first();
          postString += `<@${curShellder.discord_id}> - Difficulty: ${fixVotes[i].difficulty_vote}, Requested fixes: ${fixVotes[i].reason}\n`;
        }
      }
      postString += ts.message('approval.rejectVotes');
      if (rejectVotes === undefined || rejectVotes.length === 0) {
        postString += 'None\n';
      } else {
        for (let i = 0; i < rejectVotes.length; i += 1) {
          const curShellder = await ts.db.Members.query()
            .where({ name: rejectVotes[i].player })
            .first();
          postString += `<@${curShellder.discord_id}> - Reason: ${rejectVotes[i].reason}\n`;
        }
      }
      ts.embedAddLongField(voteEmbed, postString);
      return voteEmbed;
    };
    /**
     * This method is called and will process an approval vote. The method will generate the necessary discord channels if needed
     */
    this.approve = async function (args) {
      // Check if vote already exists
      const shellder = await ts.getUser(args.discord_id);
      const level = await ts.getExistingLevel(args.code, true);
      const vote = await ts
        .getPendingVotes()
        .where('levels.id', level.id)
        .where('player', shellder.id)
        .first();
      if (!vote) {
        // We only check reason if we have no vote yet
        if (!args.reason) {
          ts.userError(ts.message('approval.changeReason'));
        }
      }
      // Check if level is approved, if it's approved only allow rejection
      if (
        level.status === ts.LEVEL_STATUS.APPROVED &&
        args.type === 'approve'
      ) {
        ts.userError(ts.message('approval.levelAlreadyApproved'));
      } else if (!PENDING_LEVELS.includes(level.status)) {
        ts.userError(ts.message('approval.levelNotPending'));
      }
      let replyMsg = 'approval.voteAdded';
      if (!vote) {
        await ts.db.PendingVotes.query().insert({
          code: level.id,
          player: shellder.id,
          type: args.type,
          difficulty_vote:
            args.type === 'approve' || args.type === 'fix'
              ? args.difficulty
              : null,
          reason: args.reason,
        });
      } else {
        replyMsg = 'approval.voteChanged';
        await ts.db.PendingVotes.query().findById(vote.id).patch({
          type: args.type,
          reason: args.reason,
          difficulty_vote: args.difficulty,
        });
      }
      const voteEmbed = await ts.makeVoteEmbed(level);
      await ts.discussionChannel(
        level.code,
        ts.channels.levelDiscussionCategory,
      );
      await this.discord.updatePinned(level.code, voteEmbed);
      return ts.message(replyMsg, {
        channel_id: this.discord.channel(level.code).id,
      });
    };
    /**
     * Helper function to create a discussion channel in the right parent. If there is already a channel, we will move the channel to the right one
     * @param {string} channelName channel name to find
     * @param {Snowflake} parentID id of the parent category
     * @param {string} [oldChannelName] if given, the function will try to find the old name first and will be renamed to channel_name if found
     * @param {LevelRow} level
     * @return {Channel} returns a Discord Channel or either the created or found channel
     */
    this.discussionChannel = async (
      channelName,
      parentID,
      oldChannelName,
    ) => {
      if (!channelName) throw new TypeError('undefined channel_name');
      if (!parentID) throw new TypeError('undefined parentID');
      let created = false;
      let discussionChannel = ts.discord.channel(channelName);
      if (oldChannelName) {
        const oldChannel = ts.discord.channel(oldChannelName);
        if (oldChannel) {
          if (!discussionChannel) {
            await this.discord.renameChannel(
              oldChannelName,
              channelName,
            );
            discussionChannel = oldChannel;
          } else {
            await oldChannel.delete('duplicate channel');
            DiscordLog.error(
              'Duplicate channel found for `old_channel_name` reupload to `channel_name`. deleting `old_channel_name`',
            );
          }
        }
      }
      if (!discussionChannel) {
        await ts.discord.createChannel(channelName, {
          parent: parentID,
        });
        created = true;
      }

      await ts.discord.setChannelParent(channelName, parentID);
      return { channel: channelName, created };
    };
    /**
     * @description This function will initiate any passed discord member object. Will set is_member=1 in the database and assign the member role. An initiation message will also be sent to the initiation channel
     */
    this.initiate = async (author) => {
      if (author.is_member === 1) return false;
      await ts.db.Members.query()
        .patch({ is_member: 1 })
        .where({ discord_id: author.discord_id });
      if (author.discord_id) {
        if (this.discord.member(author.discord_id)) {
          await this.discord.addRole(
            author.discord_id,
            ts.teamVariables.memberRoleId,
          );
          await this.discord.send(
            ts.channels.initiateChannel,
            ts.message('initiation.message', {
              discord_id: author.discord_id,
            }),
          );
        } else {
          DiscordLog.error(
            ts.message('initiation.userNotInDiscord', {
              name: author.name,
            }),
          ); // not a breaking error.
        }
      }
      return true;
    };
    /**
     * Helper function to embed comments to a level embed
     */
    this.embedComments = (embed, comments) => {
      for (let i = 0; i < comments.length; i += 1) {
        let msgString = '';
        if (comments[i].type === 'fix') {
          msgString = 'judge.votedFix';
        } else if (comments[i].type === 'approve') {
          msgString = 'judge.votedApprove';
        } else {
          msgString = 'judge.votedReject';
        }
        const embedHeader = ts.message(msgString, { ...comments[i] });
        ts.embedAddLongField(embed, comments[i].reason, embedHeader);
      }
    };
    /**
     *
     */
    /**
     * @description This will process vote counts and get the respective votes needed and returns the result as a status update
     * @return {LevelStatus} returns the status update if any
     * @throws {UserError} if there is a tie
     * @throws {UserError} if there is not enough votes
     */
    this.processVotes = (args) => {
      const {
        approvalVotesCount = 0,
        fixVotesCount = 0,
        rejectVotesCount = 0,
        isFix = false,
      } = args;
      let { approvalVotesNeeded = 0, fixVotesNeeded = 0 } = args;
      const fixAndApproveVoteCount =
        fixVotesCount + approvalVotesCount;
      const VotesNeeded = parseInt(ts.teamVariables.VotesNeeded, 10);
      approvalVotesNeeded =
        approvalVotesNeeded ||
        parseInt(ts.teamVariables.ApprovalVotesNeeded, 10) ||
        VotesNeeded ||
        1;
      const rejectVotesNeeded =
        parseInt(ts.teamVariables.RejectVotesNeeded, 10) ||
        VotesNeeded ||
        1;
      fixVotesNeeded =
        fixVotesNeeded ||
        parseInt(ts.teamVariables.FixVotesNeeded, 10) ||
        approvalVotesNeeded ||
        VotesNeeded ||
        1;
      const approvalRatio = approvalVotesCount / approvalVotesNeeded;
      const rejectionRatio = rejectVotesCount / rejectVotesNeeded;
      const fixRatio = fixVotesCount / fixVotesNeeded;
      const fixApproveRatio = fixAndApproveVoteCount / fixVotesNeeded;
      const approvalFixRatio =
        fixAndApproveVoteCount / approvalVotesNeeded;
      let statusUpdate;
      if (
        (!isFix &&
          approvalRatio >= 1 &&
          approvalRatio > rejectionRatio &&
          approvalRatio >= fixRatio) ||
        (isFix &&
          approvalFixRatio >= 1 &&
          approvalFixRatio > rejectionRatio)
      ) {
        statusUpdate = ts.LEVEL_STATUS.APPROVED;
      } else if (
        rejectionRatio >= 1 &&
        rejectionRatio > approvalRatio &&
        rejectionRatio > fixApproveRatio
      ) {
        statusUpdate = ts.LEVEL_STATUS.REJECTED;
      } else if (
        !isFix && // never reassign fix vote
        fixApproveRatio >= 1 &&
        fixApproveRatio !== rejectionRatio &&
        (approvalRatio < 1 ||
          (approvalRatio >= 1 && approvalRatio !== fixRatio))
      ) {
        statusUpdate = ts.LEVEL_STATUS.NEED_FIX;
      } else if (
        rejectVotesCount !== 0 &&
        (fixApproveRatio === rejectionRatio ||
          approvalRatio === rejectionRatio)
      ) {
        ts.userError(ts.message('approval.comboBreaker'));
      } else {
        ts.userError(ts.message('approval.numVotesNeeded'));
      }
      return statusUpdate;
    };
    /**
     * @description Processes the votes to see if it's all approval and fixes and see if the variance in difficulty is within the specified tolerance
     * @param {object} args
     * @param {object} args.AgreeingVotesNeeded
     * @param {object} args.AgreeingMaxDifference
     * @param {object} args.approvalVotes
     * @param {object} args.fixVotes
     * @param {object} args.rejectVotes
     * @return {boolean}
     */
    this.checkForAgreement = ({
      AgreeingVotesNeeded,
      AgreeingMaxDifference,
      approvalVotes = [],
      fixVotes = [],
      rejectVotes = [],
    }) => {
      if (!(AgreeingVotesNeeded && AgreeingMaxDifference))
        return false;
      if (
        approvalVotes.length + fixVotes.length <
        AgreeingVotesNeeded
      )
        return false;
      if (rejectVotes.length > 0) return false;
      let min = 99;
      let max = -1;
      [...approvalVotes, ...fixVotes].forEach((v) => {
        min = Math.min(min, v.difficulty_vote);
        max = Math.max(max, v.difficulty_vote);
      });
      return max - min <= AgreeingMaxDifference;
    };
    this.judge = async function (code, fromFix = false) {
      const level = await ts.getExistingLevel(code, fromFix);
      const author = await ts.db.Members.query()
        .where({ name: level.creator })
        .first();
      if (!PENDING_LEVELS.includes(level.status)) {
        ts.userError(ts.message('approval.levelNotPending'));
      }
      // Get all current votes for this level
      const approvalVotes = await ts
        .getPendingVotes()
        .where('levels.id', level.id)
        .where('type', 'approve');
      const fixVotes = await ts
        .getPendingVotes()
        .where('levels.id', level.id)
        .where('type', 'fix');
      const rejectVotes = await ts
        .getPendingVotes()
        .where('levels.id', level.id)
        .where('type', 'reject');

      const AgreeingVotesNeeded =
        ts.teamVariables.AgreeingVotesNeeded || 0;
      const AgreeingMaxDifference =
        ts.teamVariables.AgreeingMaxDifference || 0;
      const inAgreement = ts.checkForAgreement({
        AgreeingVotesNeeded,
        AgreeingMaxDifference,
        approvalVotes,
        fixVotes,
        rejectVotes,
      });
      const statusUpdate = this.processVotes({
        approvalVotesNeeded: inAgreement ? AgreeingVotesNeeded : null,
        fixVotesNeeded: inAgreement ? AgreeingVotesNeeded : null,
        approvalVotesCount: approvalVotes.length,
        rejectVotesCount: rejectVotes.length,
        fixVotesCount: fixVotes.length,
        isFix: fromFix,
      });
      let difficulty;
      if (statusUpdate === ts.LEVEL_STATUS.APPROVED) {
        ts.initiate(author);
        const difficultyArr = [...approvalVotes, ...fixVotes];
        let diffCounter = 0;
        let diffSum = 0;
        for (let i = 0; i < difficultyArr.length; i += 1) {
          const diff = parseFloat(difficultyArr[i].difficulty_vote);
          if (!Number.isNaN(diff)) {
            diffCounter += 1;
            diffSum += diff;
          }
        }
        difficulty = Math.round((diffSum / diffCounter) * 2) / 2;
      }

      await ts.db.Levels.query()
        .patch({ status: statusUpdate, difficulty })
        .where({ code });
      await ts.recalculateAfterUpdate({ code });
      const mention = this.message('general.heyListen', {
        discord_id: author.discord_id,
      });
      const judgeEmbed = this.levelEmbed(
        level,
        this.embedStyle[statusUpdate],
        { difficulty },
      );
      if (statusUpdate === this.LEVEL_STATUS.NEED_FIX)
        judgeEmbed.setDescription(
          ts.message('approval.fixInstructionsCreator'),
        );
      this.embedComments(judgeEmbed, [
        ...approvalVotes,
        ...fixVotes,
        ...rejectVotes,
      ]);
      await this.discord.send(
        ts.channels.levelChangeNotification,
        mention,
      );
      await this.discord.send(
        ts.channels.levelChangeNotification,
        judgeEmbed,
      );

      await ts.deleteDiscussionChannel(
        level.code,
        ts.message('approval.channelDeleted'),
      );
    };
    this.rejectLevelWithReason = async function (
      code,
      shellder,
      message,
    ) {
      const level = await ts.getLevels().where({ code }).first();
      if (
        level.status !== ts.LEVEL_STATUS.PENDING_FIXED_REUPLOAD &&
        level.status !== ts.LEVEL_STATUS.PENDING_NOT_FIXED_REUPLOAD
      )
        ts.userError(
          ts.message('fixApprove.rejectNotNeedFix', { code }),
        );
      const allVotes = await ts
        .getPendingVotes()
        .where({ 'levels.id': level.id })
        .orderBy('type');
      await ts.db.Levels.query()
        .patch({
          status: ts.LEVEL_STATUS.REJECTED,
          old_status: level.status,
        })
        .where({ code });
      const author = await ts.db.Members.query()
        .where({ id: level.creator_id })
        .first();
      const mention = ts.message('general.heyListen', {
        discord_id: author.discord_id,
      });
      const embed = ts
        .levelEmbed(level, this.embedStyle[ts.LEVEL_STATUS.REJECTED])
        .setAuthor(ts.message('approval.rejectAfterRefuse'));
      embed.setDescription(
        `Rejected by <@${shellder.id}>: \`\`\`\n${message}\n\`\`\``,
      );
      this.embedComments(embed, allVotes);
      await this.discord.send(
        ts.channels.levelChangeNotification,
        mention,
      );
      await this.discord.send(
        ts.channels.levelChangeNotification,
        embed,
      );
      // Remove Discussion Channel
      await ts.deleteDiscussionChannel(
        code,
        ts.message('approval.channelDeleted'),
      );
    };
    this.finishFixRequest = async function (
      code,
      discordId,
      reason,
      approve = true,
    ) {
      const level = await ts.getExistingLevel(code, true);
      const author = await ts.db.Members.query()
        .where({ name: level.creator })
        .first();
      if (!PENDING_LEVELS.includes(level.status)) {
        ts.userError(ts.message('approval.levelNotPending'));
      }

      // We have 3 different options here
      // Level got fix approved and was reuploaded
      // Level got fix approved and was NOT reuploaded
      // Level was already approved before
      let difficulty;
      if (approve) {
        if (
          level.status === ts.LEVEL_STATUS.PENDING_FIXED_REUPLOAD ||
          level.status === ts.LEVEL_STATUS.PENDING_NOT_FIXED_REUPLOAD
        ) {
          // If it was in a fix request before we get the difficulty from the pending votes
          const approvalVotes = await ts
            .getPendingVotes()
            .where('levels.id', level.id)
            .where('type', 'approve');
          const fixVotes = await ts
            .getPendingVotes()
            .where('levels.id', level.id)
            .where('type', 'fix');

          const difficultyArr = [...approvalVotes, ...fixVotes];
          let diffCounter = 0;
          let diffSum = 0;
          for (let i = 0; i < difficultyArr.length; i += 1) {
            const diff = parseFloat(difficultyArr[i].difficulty_vote);
            if (!Number.isNaN(diff)) {
              diffCounter += 1;
              diffSum += diff;
            }
          }
          difficulty = Math.round((diffSum / diffCounter) * 2) / 2;
        } else if (
          level.status === ts.LEVEL_STATUS.PENDING_APPROVED_REUPLOAD
        ) {
          // If the level was approved before we get the difficulty from the approved level (gotta get the latest one though)
          const oldLevel = await ts
            .getLevels()
            .where({ new_code: code })
            .orderBy('id', 'desc')
            .first();
          if (oldLevel) {
            difficulty = oldLevel.difficulty;
          } else {
            ts.userError(ts.message('approval.oldLevelNotFound'));
          }
        } else {
          ts.userError(ts.message('approval.inWrongFixStatus'));
        }

        ts.initiate(author);
      }

      let embedTitle;
      if (approve) {
        if (level.status === ts.LEVEL_STATUS.PENDING_FIXED_REUPLOAD) {
          embedTitle = 'approval.approveAfterFix';
        } else if (
          level.status === ts.LEVEL_STATUS.PENDING_NOT_FIXED_REUPLOAD
        ) {
          embedTitle = 'approval.approveAfterRefuse';
        } else if (
          level.status === ts.LEVEL_STATUS.PENDING_APPROVED_REUPLOAD
        ) {
          embedTitle = 'approval.approveAfterReupload';
        }
      } else if (
        level.status === ts.LEVEL_STATUS.PENDING_FIXED_REUPLOAD
      ) {
        embedTitle = 'approval.rejectAfterFix';
      } else if (
        level.status === ts.LEVEL_STATUS.PENDING_NOT_FIXED_REUPLOAD
      ) {
        embedTitle = 'approval.rejectAfterRefuse';
      } else if (
        level.status === ts.LEVEL_STATUS.PENDING_APPROVED_REUPLOAD
      ) {
        embedTitle = 'approval.rejectAfterReupload';
      }

      if (!embedTitle) {
        ts.userError(ts.message('approval.inWrongFixStatus'));
      }

      // Status update and difficulty gets set
      await ts.db.Levels.query()
        .patch({
          status: approve
            ? ts.LEVEL_STATUS.APPROVED
            : ts.LEVEL_STATUS.REJECTED,
          difficulty,
        })
        .where({ code });
      await ts.recalculateAfterUpdate({ code });
      const mention = this.message('general.heyListen', {
        discord_id: author.discord_id,
      });

      // We generate the level embed and change it up
      const embedStyle = this.embedStyle[
        approve ? ts.LEVEL_STATUS.APPROVED : ts.LEVEL_STATUS.REJECTED
      ];
      embedStyle.title = embedTitle;

      const finishFixRequestEmbed = this.levelEmbed(
        level,
        embedStyle,
        { difficulty },
      );
      finishFixRequestEmbed.addField(
        '\u200b',
        `**Reason** :\`\`\`${reason}\`\`\`-<@${discordId}>`,
      );

      await this.discord.send(
        ts.channels.levelChangeNotification,
        mention,
      );
      await this.discord.send(
        ts.channels.levelChangeNotification,
        finishFixRequestEmbed,
      );
      // Remove Discussion Channel
      await ts.deleteDiscussionChannel(
        level.code,
        ts.message('approval.channelDeleted'),
      );
    };
    this.deleteDiscussionChannel = async function (code, reason) {
      if (!code)
        throw new Error(
          'No code given to this.deleteDiscussionChannel',
        );
      if (this.validCode(code.toUpperCase())) {
        const levelChannel = this.discord.channel(code);
        if (levelChannel) {
          await levelChannel.delete(reason);
        }
      }
    };
    this.putFeedback = async function (ip, discordId, salt, content) {
      const hash = crypto.createHmac('sha512', salt);
      hash.update(`${ip} - ${discordId}`);
      const value = hash.digest('hex');
      await this.discord.send(
        ts.channels.feedbackChannel,
        `**[${value.slice(0, 8)}]**\n> ${content.replace(
          /\n/g,
          '\n> ',
        )}`,
      );
    };

    this.levelEmbed = function (pLevel, args = {}, titleArgs) {
      const level = pLevel;
      const { color, title, noLink } = args;
      let { image } = args;
      let vidStr = [];
      level.videos.split(',').forEach((vid) => {
        if (vid) vidStr.push(`[ 🎬 ](${vid})`);
      });
      vidStr = vidStr.join(',');
      let tagStr = [];
      level.tags = level.tags ? level.tags : '';
      level.tags.split(',').forEach((tag) => {
        if (tag)
          tagStr.push(
            `[${tag}](${ts.page_url}${
              ts.url_slug
            }/levels/${encodeURIComponent(tag)})`,
          );
      });
      tagStr = tagStr.join(',');
      let embed = this.discord
        .embed()
        .setColor(color || '#007bff')
        .setTitle(`${level.level_name} (${level.code})`)
        .setDescription(
          `made by ${
            noLink
              ? level.creator
              : `[${level.creator}](${ts.page_url}${
                  ts.url_slug
                }/maker/${encodeURIComponent(level.creator)})`
          }\n${
            ts.is_smm1(level.code)
              ? `Links: [Bookmark Page](https://supermariomakerbookmark.nintendo.net/courses/${level.code})\n`
              : ''
          }Difficulty: ${level.difficulty}, Clears: ${
            level.clears
          }, Likes: ${level.likes}\n${
            tagStr ? `Tags: ${tagStr}\n` : ''
          }${vidStr ? `Clear Video: ${vidStr}` : ''}`,
        );
      if (title) {
        embed.setAuthor(ts.message(title, titleArgs));
      }
      if (image) {
        image = this.getEmoteUrl(image);
        embed.setThumbnail(image);
      }
      if (!noLink) {
        embed.setURL(
          `${ts.page_url + ts.url_slug}/level/${level.code}`,
        );
      }
      embed = embed.setTimestamp();
      return embed;
    };
    this.reuploadLevel = async function (message) {
      const player = await ts.db.Members.query()
        .where({ discord_id: ts.discord.getAuthor(message) })
        .first();
      if (!player) ts.userError(ts.message('error.notRegistered'));
      const command = ts.parseCommand(message);
      let oldCode = command.arguments.shift();
      if (oldCode) {
        oldCode = oldCode.toUpperCase();
      } else {
        ts.userError(ts.message('reupload.noOldCode'));
      }
      if (!ts.validCode(oldCode)) {
        ts.userError(ts.message('reupload.invalidOldCode'));
      }
      let newCode = command.arguments.shift();
      if (newCode) {
        newCode = newCode.toUpperCase();
      } else {
        ts.userError(ts.message('reupload.noNewCode'));
      }
      if (!ts.validCode(newCode))
        ts.userError(ts.message('reupload.invalidNewCode'));
      const reason = command.arguments.join(' ');
      if (oldCode === newCode)
        ts.userError(ts.message('reupload.sameCode'));
      if (!reason) ts.userError(ts.message('reupload.giveReason'));
      const earnedPoints = await ts.calculatePoints(player.name);
      const rank = ts.getRank(earnedPoints.clearPoints);
      const userReply = `<@${ts.discord.getAuthor(message)}>${
        rank.pips ? rank.pips : ''
      } `;
      const level = await ts
        .getLevels()
        .where({ code: oldCode })
        .first();
      if (!level)
        ts.userError(
          ts.message('error.levelNotFound', { code: oldCode }),
        );
      let newLevel = await ts
        .getLevels()
        .where({ code: newCode })
        .first();
      const oldApproved =
        level.status === ts.LEVEL_STATUS.USER_REMOVED
          ? level.old_status
          : level.status;
      // level.status==ts.LEVEL_STATUS.APPROVED || level.status==ts.LEVEL_STATUS.PENDING
      if (newLevel && level.creator !== newLevel.creator)
        ts.userError(ts.message('reupload.differentCreator'));
      if (
        newLevel &&
        newLevel.status !== ts.LEVEL_STATUS.PENDING &&
        newLevel.status !== ts.LEVEL_STATUS.APPROVED &&
        newLevel.status !== ts.LEVEL_STATUS.NEED_FIX
      )
        ts.userError(ts.message('reupload.wrongApprovedStatus'));
      // Reupload means you're going to replace the old one so need to do that for upload check
      const creatorPoints = await ts.calculatePoints(
        level.creator,
        ts.SHOWN_IN_LIST.includes(level.status),
      );
      if (level.new_code)
        ts.userError(
          ts.message('reupload.haveReuploaded', {
            code: level.new_code,
          }),
        );
      if (
        !newLevel &&
        !(
          ts.SHOWN_IN_LIST.includes(level.status) ||
          (!ts.SHOWN_IN_LIST.includes(level.status) &&
            creatorPoints.canUpload)
        )
      ) {
        ts.userError(ts.message('reupload.notEnoughPoints'));
      }
      if (!(level.creator_id === player.id || player.is_mod)) {
        ts.userError(ts.message('reupload.noPermission', level));
      }
      await ts.db.Levels.query()
        .patch({
          status:
            level.status === ts.LEVEL_STATUS.APPROVED
              ? ts.LEVEL_STATUS.REUPLOADED
              : ts.LEVEL_STATUS.REMOVED,
          old_status: level.status,
          new_code: newCode,
        })
        .where({
          code: oldCode,
        });
      await ts.db.Levels.query()
        .patch({ new_code: newCode })
        .where({ new_code: oldCode });
      if (!newLevel) {
        // if no new level was found create a new level copying over the old data
        await ts.db.Levels.query().insert({
          code: newCode,
          level_name: level.level_name,
          creator: level.creator_id,
          difficulty: false,
          status: 0,
          tags: level.tags,
        });
        newLevel = await ts
          .getLevels()
          .where({ code: newCode })
          .first();
      }
      await ts.db.PendingVotes.query()
        .patch({ code: newLevel.id })
        .where({ code: level.id });
      let newStatus = 0;
      if (oldApproved === ts.LEVEL_STATUS.NEED_FIX) {
        newStatus = ts.LEVEL_STATUS.PENDING_FIXED_REUPLOAD; // should make another one
      } else if (oldApproved === ts.LEVEL_STATUS.APPROVED) {
        newStatus = ts.LEVEL_STATUS.PENDING_APPROVED_REUPLOAD;
      }
      if (newStatus) {
        await ts.db.Levels.query()
          .patch({ status: newStatus }) // new level doesn't need old_status
          .where({ code: newCode });
        newLevel.status = newStatus;
      }
      const author = await ts.db.Members.query()
        .where({ id: newLevel.creator_id })
        .first();
      if (
        newStatus !== 0 ||
        (newStatus === 0 && ts.findChannel({ name: level.code }))
      ) {
        // TODO:FIX HERE
        //
        const { channel } = await ts.discussionChannel(
          newCode,
          newStatus === ts.LEVEL_STATUS.PENDING
            ? ts.channels.levelDiscussionCategory
            : ts.channels.pendingReuploadCategory,
          level.code,
        );
        const voteEmbed = await ts.makeVoteEmbed(
          newLevel,
          reason || '',
        );

        await ts.discord.send(
          newCode,
          ts.message('reupload.reuploadNotify', {
            oldCode,
            newCode,
          }),
        );

        await ts.discord.send(
          newCode,
          `Reupload Request for <@${author.discord_id}>'s level with message: ${reason}`,
        );

        const fixVotes = await knex('members')
          .select('members.discord_id')
          .join('pending_votes', {
            'members.id': 'pending_votes.player',
          })
          .where('code', newLevel.id)
          .where('type', 'fix');

        if (fixVotes && fixVotes.length > 0) {
          const modPings = fixVotes.map((v) => `<@${v.discord_id}>`);
          await this.discord.send(
            newCode,
            `${modPings.join(
              `, `,
            )} please check if your fixes were made.`,
          );
        }

        await ts.discord.updatePinned(channel, voteEmbed);
      }
      let reply = ts.message('reupload.success', { level, newCode });
      if (!newLevel) {
        reply += ts.message('reupload.renamingInstructions');
      }
      if (newStatus !== ts.LEVEL_STATUS.PENDING)
        reply += ts.message('reupload.inReuploadQueue');
      await ts.recalculateAfterUpdate();
      return userReply + reply;
    };
  }

  /**
   * Helper function to get the Discord Guild object
   * @returns {Guild}
   */
  getGuild() {
    return this.discord.guild();
  }

  /**
   * Function that recalculates and updates the stored calculated information in the database. To be called everytime relevant data is added/updated/deleted.
   * Relevant updates: level difficulty update, level removal, clear add/updates/delete, point/score update, likes, difficulty vote, votes
   */
  async recalculateAfterUpdate() {
    debug(`recalculate update for  ${this.teamVariables.TeamName}`);
    return knex.raw(
      `UPDATE levels
      inner join (SELECT *
    ,if(clears=0,0,round(((likes*2+clears)*score*likes/clears),1)) maker_points
    ,if(clears=0,0,round(likes/clears*100,1)) clear_like_ratio
    ,concat(vote,',',votetotal) votestr
    FROM
    (SELECT
    ROW_NUMBER() OVER ( ORDER BY id ) as no
      ,levels.id
      ,points.score
      ,sum(plays.completed) clears
      ,sum(plays.liked) likes
      ,round(avg(plays.difficulty_vote),1) vote
      ,count(plays.difficulty_vote) votetotal
      ,pending.approves
      ,pending.rejects
      ,pending.want_fixes
    FROM
      levels
      INNER JOIN teams on
        levels.guild_id=teams.id
      LEFT JOIN plays ON
        levels.guild_id=plays.guild_id
        AND levels.id=plays.code
        AND levels.creator!=plays.player
    LEFT JOIN members ON
        levels.guild_id=members.guild_id
        AND levels.creator=members.id
      LEFT JOIN points ON
        levels.guild_id=points.guild_id
        AND levels.difficulty=points.difficulty
      LEFT JOIN (
        select code,sum(CASE WHEN pending_votes.type='approve' THEN 1 ELSE 0 END) approves
      ,sum(CASE WHEN pending_votes.type='reject' THEN 1 ELSE 0 END) rejects
      ,sum(CASE WHEN pending_votes.type='fix' THEN 1 ELSE 0 END) want_fixes from pending_votes group by pending_votes.code) pending on
      levels.id=pending.code
    WHERE
      levels.status IN (:SHOWN_IN_LIST:)
      AND teams.id=:guild_id
    GROUP BY levels.id) a) b on
    levels.id=b.id
    set
      levels.row_num=b.no,
      levels.clears=COALESCE(b.clears,0),
      levels.likes=COALESCE(b.likes,0),
      levels.average_votes=COALESCE(b.vote,0),
      levels.num_votes=COALESCE(b.votetotal,0),
      levels.maker_points=COALESCE(b.maker_points,0),
      levels.approves=COALESCE(b.approves,0),
      levels.rejects=COALESCE(b.rejects,0),
      levels.want_fixes=COALESCE(b.want_fixes,0),
      levels.clear_like_ratio=COALESCE(b.clear_like_ratio,0);

      UPDATE members LEFT JOIN (
        SELECT
          plays.guild_id,
          plays.player,
          sum(points.score) total_score,
          count(distinct plays.id) total_cleared from plays
        INNER JOIN levels ON
          levels.id=plays.code
          AND levels.guild_id=plays.guild_id
        INNER JOIN points ON
          levels.difficulty=points.difficulty
          AND points.guild_id=levels.guild_id
        WHERE
          levels.status=1
          AND plays.completed=1
          AND levels.guild_id=:guild_id
        GROUP BY plays.player,plays.guild_id
      ) clear_stats ON
            members.guild_id=clear_stats.guild_id
            AND members.id=clear_stats.player
      LEFT JOIN (
        SELECT
          levels.guild_id,
          COUNT(levels.id) calculated_levels_created,
          SUM(levels.maker_points) maker_points,
          SUM(levels.is_free_submission) free_submissions,
          SUM(points.score) own_score,
          levels.creator
        FROM levels
        INNER JOIN points ON
          points.difficulty=levels.difficulty
          AND points.guild_id=levels.guild_id
        WHERE
          levels.guild_id=:guild_id and
          levels.status in (:SHOWN_IN_LIST:)
        GROUP BY creator,levels.guild_id
      ) own_levels ON
          members.guild_id=own_levels.guild_id
          AND members.id=own_levels.creator
      SET
        members.clear_score_sum=COALESCE(total_score,0)+if(:include_own_score,COALESCE(own_levels.own_score,0),0),
        members.levels_cleared=COALESCE(total_cleared,0),
        members.levels_created=COALESCE(calculated_levels_created,0),
        members.own_score=COALESCE(own_levels.own_score,0),
        members.free_submissions=COALESCE(own_levels.free_submissions,0),
        members.maker_points=COALESCE(own_levels.maker_points,0)
      WHERE members.guild_id=:guild_id;
  `,
      {
        guild_id: this.team.id,
        SHOWN_IN_LIST: knex.raw(SHOWN_IN_LIST),
        include_own_score:
          this.teamVariables.includeOwnPoints === 'true' || false,
      },
    );
  }

  /**
   * Parses a message from discord and converts it to an array of words
   * @param {object} message
   * @returns {object} returns command
   */
  parseCommand(message) {
    let rawCommand = message.content.trim();
    rawCommand = rawCommand.split(' ');
    const sbCommand = rawCommand.shift().toLowerCase().substring(1); // remove first character
    if (!sbCommand) rawCommand.shift().toLowerCase();
    let filtered = [];
    filtered = rawCommand.filter((s) => s);
    return {
      command: sbCommand,
      arguments: filtered,
      argumentString: filtered.join(' '),
    };
  }

  /**
   * Get the specified rank for a user by comparing achived score and the list or ranks from database
   * @return {Object} The rank row from database
   */
  getRank(points) {
    const ret = this.ranks.find(
      (r) => parseFloat(points) >= parseFloat(r.min_points),
    );
    return ret;
  }

  /**
   * Helper function to find channels
   * @param {string} obj.name Channel name
   * @param {Snowflake} obj.parentID Category ID
   * @returns {boolean} channel found or not
   */
  findChannel({ name, parentID }) {
    const guild = this.getGuild();
    const channel = guild.channels.find(
      (c) =>
        (!parentID || (parentID && c.parentID === parentID)) &&
        c.name === name.toLowerCase(),
    );
    return channel;
  }

  /**
   * Function to convert a tag to lowercase, and stripped of all special characters for comparison
   * @param {string} str tag to be tranformed
   * @returns {string}
   */
  transformTag(str) {
    return str.toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  /**
   * Add tags to database if doesn't exist
   * @param {string|string[]} tags Can pass a comma seperated string or an array of strings
   * @param {knex} [trx] a transaction object
   * @returns {string[]}  returns an array of tags
   */
  async addTags(pTags, trx = knex) {
    let tags = pTags;
    if (!Array.isArray(tags) && typeof tags === 'string')
      tags = tags.split(/[,\n]/);
    if (!Array.isArray(tags))
      throw TypeError('not a string or array of strings');

    let existingTags = await trx('tags').where({
      guild_id: this.team.id,
    });
    const that = this;
    existingTags = existingTags.map((t) => {
      return { value: t.name, compare: that.transformTag(t.name) };
    });
    const newTags = [];
    for (let i = 0; i < tags.length; i += 1) {
      if (tags[i]) {
        const sameTag = existingTags.find(
          (t) => this.transformTag(tags[i]) === t.compare,
        );
        if (sameTag) {
          tags[i] = sameTag.value;
        } else {
          tags[i] = tags[i].trim();
          existingTags.push({
            value: tags[i],
            compare: this.transformTag(tags[i]),
          });
          newTags.push({
            name: tags[i],
            guild_id: this.team.id,
          });
        }
      }
    }
    if (newTags.length !== 0) {
      await trx('tags').insert(newTags);
    }

    return tags;
  }

  /**
   * Helper function to help secure data being send for updating/editing
   * @param {RowPacket[]} data Rows of data probably from the database. expects to contain an id and a guild_id
   * @returns {RowPacket[]} returns the same data but with signed values to verify id
   */
  secureData(data) {
    return data.map((d) => {
      d.SECURE_TOKEN = jwt.sign(
        {
          id: d.id,
        },
        this.config.key,
      );
      return d;
    });
  }

  /**
   * Helper function to help verified secure data being recieved. Checks for id
   * @param {RowPacket[]} data Rows of data recieved from user. each row should contain SECURE_TOKEN created in secureData
   * @returns {RowPacket[]} returns the same data but removes SECURE_TOKEN after verifying it.
   * @throws {UserError} returns an error if the id in the row does not match the one in SECURE_TOKEN
   */
  verifyData(data) {
    return data.map((d) => {
      if (d.id) {
        if (!d.SECURE_TOKEN) {
          this.userError('error.wrongTokens');
        }
        try {
          const decoded = jwt.verify(d.SECURE_TOKEN, this.config.key);
          if (decoded.id !== d.id) {
            this.userError(this.message('error.wrongTokens'));
          }
        } catch (error) {
          this.userError(this.message('error.wrongTokens'));
        }
      } else {
        delete d.id;
        delete d.guild_id;
      }
      delete d.SECURE_TOKEN;
      return d;
    });
  }

  /**
   * internal function that encapsulates Handlebars which automatically passes all the user set variables and defaults to the strings
   */
  makeTemplate(template) {
    const handlebar = Handlebars.compile(template);
    const that = this;
    return function (pArgs) {
      const args = pArgs || {};
      const obj = {
        ...that.emotes,
        ...that.customStrings,
        ...that.teamVariables,
        ...args,
      };
      return handlebar(obj);
    };
  }

  async getTags() {
    return knex('tags').where({ guild_id: this.team.id });
  }

  /**
   * This will gather the necessary data to generate the points achived by the player
   */
  async calculatePoints(name, ifRemoveCheck) {
    const member = await this.db.Members.query()
      .where({ name })
      .first();
    const min = parseFloat(this.get_variable('Minimum Point') || 0);
    const next = parseFloat(this.get_variable('New Level') || 0);
    const pointsNeeded = this.pointsNeededForLevel({
      points: member.clear_score_sum,
      levelsUploaded: Math.max(
        0,
        member.levels_created - (ifRemoveCheck ? 1 : 0),
      ),
      freeLevels: member.free_submissions,
      min,
      next,
    });
    return {
      clearPoints: member.clear_score_sum,
      levelsMade: member.levels_created,
      freeSubmissions: member.free_submissions,
      pointsNeeded: pointsNeeded,
      canUpload: pointsNeeded < 0.05,
    };
  }

  /**
   * call to add a TS into the list.
   */
  static async add(guildId, client, gs) {
    TS.TS_LIST[guildId] = new TS(guildId, client, gs);
    await TS.TS_LIST[guildId].load();
    return TS.TS_LIST[guildId];
  }

  /**
   * Get a TS object from a url_slug
   */
  static teamFromUrl(urlSlug) {
    for (const i in TS.TS_LIST) {
      const team = TS.TS_LIST[i];
      if (team.config && team.url_slug === urlSlug) {
        return team;
      }
    }
    return false;
  }

  /**
   * default makerteam messages for use above the team layer
   */
  static message(type, args) {
    if (TS.defaultMessages[type]) {
      return TS.defaultMessages[type](args);
    }
    throw new Error(
      `"${type}" message string was not found in ts.message`,
    );
  }

  /**
   * Get a team
   * @param {Snowflake} guildId
   */
  static teams(guildId) {
    if (TS.TS_LIST[guildId]) {
      return TS.TS_LIST[guildId];
    }
    throw new Error(
      `This team, with guild id ${guildId} has not yet setup it's config, buzzyS`,
    );
  }
}
TS.defaultChannels = defaultChannels;
TS.TS_LIST = {};
TS.UserError = UserError;
TS.promisedCallback = () => {
  // do nothing
};
module.exports = TS;
