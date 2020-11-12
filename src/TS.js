'use strict';

const { Translate } = require('@google-cloud/translate').v2;
const crypto = require('crypto');
const moment = require('moment');
const jwt = require('jsonwebtoken');
const stringSimilarity = require('string-similarity');
const Handlebars = require('handlebars');
const debug = require('debug')('shellbot3000:ts');
const cron = require('node-cron');
// const validUrl = require('valid-url');
const knex = require('./db/knex');
const DiscordLog = require('./DiscordLog');
const UserError = require('./UserError');
const Teams = require('./models/Teams.js');
const Tokens = require('./models/Tokens');
const Plays = require('./models/Plays');
const PendingVotes = require('./models/PendingVotes');
const Members = require('./models/Members');
const Levels = require('./models/Levels');
const Points = require('./models/Points');
const Races = require('./models/Races');
const RaceEntrants = require('./models/RaceEntrants');
const Tags = require('./models/Tags');
const Videos = require('./models/Videos');
const {
  defaultChannels,
  defaultVariables,
  defaultCommandPermissions,
  LEVEL_STATUS,
  PENDING_LEVELS,
  SHOWN_IN_LIST,
  REMOVED_LEVELS,
  CHANNEL_LABELS,
  GAME_STYLES,
  ALLOWED_VIDEO_TYPES,
  EMOJIS,
} = require('./constants');
const CONSTANTS = require('./constants');

Handlebars.registerHelper('plural', function (_num) {
  const num = Number(_num);
  return num !== 1 ? 's' : '';
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
    this.cloudTranslationService = new Translate({
      projectId: 673279391932,
      keyFilename: '/home/liaf/makerteams-keyfile.json',
    });
    this.CONSTANTS = CONSTANTS;
    this.defaultVariables = defaultVariables;
    this.LEVEL_STATUS = LEVEL_STATUS;
    this.PENDING_LEVELS = PENDING_LEVELS;
    // this.SHOWN_IN_LIST = SHOWN_IN_LIST;
    this.REMOVED_LEVELS = REMOVED_LEVELS;
    this.CHANNEL_LABELS = CHANNEL_LABELS;
    this.GAME_STYLES = GAME_STYLES;
    this.ALLOWED_VIDEO_TYPES = ALLOWED_VIDEO_TYPES;
    this.EMOJIS = EMOJIS;

    this.commandLanguage = 'en';

    this.guild_id = guildId;
    this.guildId = guildId;

    this.firstLoad = true;

    this.devs = process.env.DEVS.split(',');
    this.page_url = process.env.PAGE_URL;
    this.getSettings = async (type, dontMap = false) => {
      const rows = await knex('team_settings')
        .where({ guild_id: this.team.id })
        .where({ type });
      if (dontMap) return rows;

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
      await guild.members.fetch(); // just load up all members ##not needed anymore in 8.1
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
        Races: Races(this.team.id),
        RaceEntrants: RaceEntrants(this.team.id),
        Tags: Tags(this.team.id),
        Videos: Videos(this.team.id),
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
      for (let i = 0; i < defaultVariables.length; i += 1) {
        this.teamVariables[defaultVariables[i]] =
          defaultVariables[i].default;
      }
      this.channels = {};
      this.customStrings = {
        levelInfo: '@@LEVELPLACEHOLDER@@',
        BotName: 'ShellBot3000',
        TeamURI: `${ts.page_url}${this.url_slug}`,
      };

      const data = await knex('team_settings')
        .where({
          guild_id: this.team.id,
        })
        .whereIn('type', ['settings', 'channels', 'customStrings']);

      data.forEach((d) => {
        this[dbToMap[d.type]][d.name] = d.value;
      });

      const suggestedChannels = [
        'RegistrationChannel',
        'LevelSubmissionChannel',
        'LevelClearChannel',
        'MiscChannel',
      ];
      suggestedChannels.forEach((c) => {
        if (this.teamVariables[c]) {
          const foundChannel = this.discord.channel(
            this.teamVariables[c],
          );
          if (foundChannel) {
            this.teamVariables[c] = `<#${foundChannel.id}>`;
          } else {
            this.teamVariables[c] = `#${this.teamVariables[c]}`;
          }
        }
      }, this);

      this.emotes = {
        think: this.teamVariables.userErrorEmote,
        PigChamp: this.teamVariables.pogEmote,
        buzzyS: this.teamVariables.criticalErrorEmote,
        bam: this.teamVariables.updateEmote,
        love: this.teamVariables.loveEmote,
        GG: this.teamVariables.GGEmote,
      };

      if (this.teamVariables.hidePendingLevels === 'true') {
        this.SHOWN_IN_LIST = Object.freeze([LEVEL_STATUS.APPROVED]);
      } else {
        this.SHOWN_IN_LIST = SHOWN_IN_LIST;
      }

      const validDifficulty = [];
      const maxDifficulty =
        Math.round(
          parseFloat(this.teamVariables.maxDifficulty) * 10,
        ) || 100;
      for (let i = 0; i <= maxDifficulty; i += 1) {
        validDifficulty.push(i / 10);
      }
      this.validDifficulty = validDifficulty;

      const allLevels = await this.knex('levels')
        .where({ guild_id: this.team.id })
        .whereIn('status', this.SHOWN_IN_LIST);
      let allTags = allLevels.map((l) => l.tags);
      if (allTags.length !== 0) {
        allTags = allTags.reduce((total, t) => `${total},${t}`);
      }
      await knex.transaction(async (trx) => {
        await this.addTags(allTags, trx);
      });

      const existingLevelTags = await this.knex('level_tags')
        .select()
        .where({ guild_id: this.team.id });

      if (existingLevelTags.length === 0) {
        const existingTags = await this.knex('tags').where({
          guild_id: this.team.id,
        });
        const tagMap = {};
        existingTags.forEach((r) => {
          tagMap[this.transformTag(r.name)] = r.id;
        }, this);
        const levelTags = [];
        allLevels.forEach((l) => {
          if (l.tags) {
            const tags = l.tags.split(',');
            tags.forEach((t) => {
              const ret = {
                level_id: l.id,
                tag_id: tagMap[this.transformTag(t)] || -1,
                guild_id: this.team.id,
              };
              levelTags.push(ret);
            }, this);
          }
        }, this);
        await this.knex.transaction(async (trx) => {
          await trx('level_tags').insert(levelTags);
        });
      }
      await this.checkTagsForRemoval();
      this.messages = {};
      TS.defaultMessages = {};

      const defaultStrings = await this.knex(
        'default_strings',
      ).select();

      Object.entries(defaultStrings).forEach((v) => {
        const defaultString = v[1];
        const messageKey =
          defaultString.language === 'en'
            ? defaultString.name
            : `${defaultString.language}.${defaultString.name}`;
        TS.defaultMessages[messageKey] = this.makeTemplate(
          defaultString.message,
        );
        this.messages[messageKey] = this.makeTemplate(
          defaultString.message,
        );
      });

      (await this.getSettings('messages', true)).forEach((v) => {
        this.messages[v[0]] = this.makeTemplate(v[1] || '');
      });

      this.embedStyle = Object.freeze({
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
        [ts.LEVEL_STATUS.USER_REMOVED]: {
          color: this.teamVariables.needFixColor || '#D68100',
          title: 'remove.removedBy',
          image: ts.teamVariables.removeEmote,
          noLink: true,
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
      });

      // should verify that the discord roles id exist in server
      this.ranks = await knex('ranks')
        .where({ guild_id: this.team.id })
        .orderBy('min_points', 'desc');
      this.rank_ids = this.ranks.map((r) => r.discord_role);
      await this.saveSheetToDb();
      await this.recalculateAfterUpdate();
      this.pointMap = {};
      const rawPoints = await ts.db.Points.query().select();
      if (rawPoints.length > 0) {
        for (let i = 0; i < rawPoints.length; i += 1) {
          this.pointMap[rawPoints[i].difficulty] = rawPoints[i].score;
        }
      } else {
        await ts.db.Points.transaction(async (trx) => {
          for (let i = 0; i < this.validDifficulty.length; i += 1) {
            await ts.db.Points.query(trx).insert({
              difficulty: ts.validDifficulty[i],
              score: ts.validDifficulty[i],
            });
          }
        });
      }

      if (
        process.env.NODE_ENV !== 'testing' &&
        process.env.NODE_ENV !== 'test' &&
        this.firstLoad
      ) {
        this.firstLoad = false;
        console.log(
          'Starting race cron schedule for ',
          this.teamVariables.TeamName,
        );
        cron.schedule('* * * * *', async () => {
          const nowDate = new Date();
          // Going through all upcoming races
          const upcomingRaces = await ts.db.Races.query()
            .where('start_date', '<=', nowDate)
            .where('status', '=', 'upcoming');

          for (const race of upcomingRaces) {
            const raceEntrants = await ts.db.RaceEntrants.query().where(
              {
                race_id: race.id,
              },
            );

            let raceDeleted = false;
            if (raceEntrants.length === 0) {
              if (ts.channels.raceChannel) {
                await ts.discord.send(
                  ts.channels.raceChannel,
                  await ts.message('race.noParticipants', {
                    name: race.name,
                  }),
                );
              }

              await ts.db.Races.query().where('id', race.id).del();

              raceDeleted = true;
            }

            if (!raceDeleted) {
              const mentionsArr = [];
              const memberIds = [];
              for (const raceEntrant of raceEntrants) {
                const member = await ts.db.Members.query()
                  .where({
                    id: raceEntrant.member_id,
                  })
                  .first();

                memberIds.push(member.id);

                mentionsArr.push(`<@${member.discord_id}>`);
              }

              race.status = 'active';
              // race.level = findlevel
              if (race.level_type === 'random') {
                const bindings = {
                  guild_id: ts.team.id,
                  member_ids: memberIds,
                  diff_from: race.level_filter_diff_from,
                  diff_to: race.level_filter_diff_to,
                };

                let sql = `select
                distinct levels.id as level_id, maker_points as lcd_score
                  from
                    levels
                    left join level_tags on levels.id = level_tags.level_id
                  where
                    levels.guild_id = :guild_id
                    and difficulty >= :diff_from
                    and difficulty <= :diff_to
                    and levels.creator not in (:member_ids)`;

                if (
                  race.level_filter_submission_time_type === 'month'
                ) {
                  sql += ` and levels.created_at > DATE_SUB(NOW(), interval 30 day) `;
                } else if (
                  race.level_filter_submission_time_type === 'week'
                ) {
                  sql += ` and levels.created_at > DATE_SUB(NOW(), interval 7 day) `;
                }

                if (race.level_status_type === 'approved') {
                  sql += ` and status = 1 `;
                } else if (race.level_status_type === 'pending') {
                  sql += ` and status in (0, 3, 4, 5, -10) `;
                } else if (race.level_status_type === 'all') {
                  sql += ` and status in (1, 0, 3, 4, 5, -10) `;
                }

                if (race.level_filter_tag_id) {
                  sql += ` and level_tags.tag_id = :tag_id `;
                  bindings.tag_id = race.level_filter_tag_id;
                }

                const [json] = await knex.raw(sql, bindings);

                if (json.length > 0) {
                  if (
                    race.level_status_type === 'approved' &&
                    race.weighting_type === 'weighted_lcd'
                  ) {
                    const weightedJson = [];
                    for (const row of json) {
                      let lcdScore = 5;
                      if (row.lcd_score > 5) {
                        lcdScore = row.lcd_score;
                      }

                      for (let i = 0; i < lcdScore; i += 1) {
                        weightedJson.push(row.level_id);
                      }
                    }
                    const rand = Math.floor(
                      Math.random() * weightedJson.length,
                    );
                    race.level_id = weightedJson[rand];
                    race.level_filter_failed = false;
                  } else {
                    const rand = Math.floor(
                      Math.random() * json.length,
                    );
                    race.level_id = json[rand].level_id;
                    race.level_filter_failed = false;
                  }
                } else {
                  race.level_filter_failed = true;
                  race.status = 'upcoming';
                  race.start_date = new Date(
                    race.start_date.getTime() + 5 * 60000,
                  );
                  race.end_date = new Date(
                    race.end_date.getTime() + 5 * 60000,
                  );
                }
              } else if (
                race.level_type === 'random-uncleared' &&
                memberIds.length > 0
              ) {
                const bindings = {
                  guild_id: ts.team.id,
                  member_ids: memberIds,
                  diff_from: race.level_filter_diff_from,
                  diff_to: race.level_filter_diff_to,
                };

                let sql = `select
                distinct levels.id as level_id, maker_points as lcd_score
                  from
                    levels
                    left join level_tags on levels.id = level_tags.level_id
                  where
                    levels.guild_id = :guild_id
                    and difficulty >= :diff_from
                    and difficulty <= :diff_to
                    and levels.creator not in (:member_ids)`;

                if (
                  race.level_filter_submission_time_type === 'month'
                ) {
                  sql += ` and levels.created_at > DATE_SUB(NOW(), interval 30 day) `;
                } else if (
                  race.level_filter_submission_time_type === 'week'
                ) {
                  sql += ` and levels.created_at > DATE_SUB(NOW(), interval 7 day) `;
                }

                if (race.level_status_type === 'approved') {
                  sql += ` and status = 1 `;
                } else if (race.level_status_type === 'pending') {
                  sql += ` and status in (0, 3, 4, 5, -10) `;
                } else if (race.level_status_type === 'all') {
                  sql += ` and status in (1, 0, 3, 4, 5, -10) `;
                }

                if (race.level_filter_tag_id) {
                  sql += ` and level_tags.tag_id = :tag_id `;
                  bindings.tag_id = race.level_filter_tag_id;
                }

                sql += ` and (SELECT COUNT(*) FROM plays where plays.code = levels.id and plays.completed = 1 and plays.player in (:member_ids)) = 0;`;

                const [json] = await knex.raw(sql, bindings);

                if (json.length > 0) {
                  if (
                    race.level_status_type === 'approved' &&
                    race.weighting_type === 'weighted_lcd'
                  ) {
                    const weightedJson = [];
                    for (const row of json) {
                      let lcdScore = 5;
                      if (row.lcd_score > 5) {
                        lcdScore = row.lcd_score;
                      }

                      for (let i = 0; i < lcdScore; i += 1) {
                        weightedJson.push(row.level_id);
                      }
                    }
                    const rand = Math.floor(
                      Math.random() * weightedJson.length,
                    );
                    race.level_id = weightedJson[rand];
                    race.level_filter_failed = false;
                  } else {
                    const rand = Math.floor(
                      Math.random() * json.length,
                    );
                    race.level_id = json[rand].level_id;
                    race.level_filter_failed = false;
                  }
                } else {
                  race.level_filter_failed = true;
                  race.status = 'upcoming';
                  race.start_date = new Date(
                    race.start_date.getTime() + 5 * 60000,
                  );
                  race.end_date = new Date(
                    race.end_date.getTime() + 5 * 60000,
                  );
                }
              }

              if (
                ts.channels.raceChannel &&
                !race.level_filter_failed
              ) {
                const level = await ts
                  .getLevels()
                  .where({ 'levels.id': race.level_id })
                  .first();

                await ts.discord.send(
                  ts.channels.raceChannel,
                  await ts.message('race.raceStarted', {
                    name: race.name,
                    mentions: mentionsArr.join(', '),
                  }),
                );
                await ts.discord.send(
                  ts.channels.raceChannel,
                  await ts.levelEmbed(level),
                );
              } else if (
                ts.channels.raceChannel &&
                race.level_filter_failed
              ) {
                await ts.discord.send(
                  ts.channels.raceChannel,
                  await ts.message('race.raceFailed', {
                    name: race.name,
                    mentions: mentionsArr.join(', '),
                  }),
                );
              }

              await ts.db.Races.query()
                .where('id', race.id)
                .update(race);
            }
          }

          // Going through all active races
          const activeRaces = await ts.db.Races.query()
            .where('end_date', '<=', nowDate)
            .where('status', '=', 'active');

          for (const race of activeRaces) {
            await ts.endRace(race);
          }
        });
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
            `levels.*, members.id creator_id,members.name creator,COALESCE(group_concat(tags.name),'') tags`,
          ),
        )
        .join('members', { 'levels.creator': 'members.id' })
        .leftJoin('level_tags', {
          'levels.id': 'level_tags.level_id',
        })
        .leftJoin('tags', {
          'level_tags.tag_id': 'tags.id',
        })
        .where('levels.guild_id', this.team.id)
        .groupBy('levels.id');
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
        (SELECT GROUP_CONCAT(videos.url) from videos where videos.level_id = levels.id and videos.play_id = plays.id) as videos,
        points.score,
        levels.level_name,
        levels.tags,
        creator_table.name creator_name,
        creator_table.id creator_id`),
        )
        .join('members', { 'plays.player': 'members.id' })
        .join('levels', { 'plays.code': 'levels.id' })
        .join('members as creator_table', {
          'creator_table.id': 'levels.creator',
        })
        .leftJoin('points', function () {
          this.on('points.difficulty', 'levels.difficulty').on(
            'points.guild_id',
            'levels.guild_id',
          );
        })
        .whereIn('levels.status', this.SHOWN_IN_LIST)
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

    /**
     * This checks if a video url is from an allowed website
     */
    this.getVideoType = (url) => {
      let vidType = null;
      for (const allowedType of Object.keys(
        this.ALLOWED_VIDEO_TYPES,
      )) {
        if (url.indexOf(allowedType) !== -1) {
          vidType = this.ALLOWED_VIDEO_TYPES[allowedType];
          break;
        }
      }

      return vidType;
    };

    this.addVideos = async (args) => {
      const { command, level, newVids, player, submitter } = args;
      const addCommands = [
        'tsaddvids',
        'addvids',
        'tsaddvid',
        'addvid',
        'addmyvids',
        'addmyvid',
        'modaddplayvids',
        'modaddplayvid',
      ];

      const playCommands = [
        'addmyvids',
        'addmyvid',
        'removemyvids',
        'removemyvid',
        'modaddplayvids',
        'modaddplayvid',
        'modremoveplayvids',
        'modremoveplayvid',
      ];

      const existingPlay = await ts.db.Plays.query()
        .where('code', '=', level.id)
        .where('player', '=', player.id)
        .first();

      let isPlaysCommand =
        playCommands.indexOf(command.command) !== -1;

      if (
        isPlaysCommand &&
        (!existingPlay || !existingPlay.completed)
      ) {
        if (level.creator === player.name) {
          isPlaysCommand = false;
        } else {
          ts.userError(
            `${await ts.message('addVids.noClear', {
              code: level.code,
            })}`,
          );
        }
      }

      let reply;

      const updateJson = [];
      const insertJson = [];
      const removeJson = [];

      if (addCommands.indexOf(command.command) !== -1) {
        // adding
        let oldVids = [];
        let unassignedVids = [];
        let assignedVids = [];
        let allVids = [];
        if (!isPlaysCommand) {
          oldVids = await ts.db.Videos.query().where({
            level_id: level.id,
          });
          allVids = oldVids;
        } else {
          oldVids = await ts.db.Videos.query()
            .where({ level_id: level.id })
            .where({ play_id: existingPlay.id });
          unassignedVids = await ts.db.Videos.query()
            .where({ level_id: level.id })
            .whereNull('play_id');
          assignedVids = await ts.db.Videos.query()
            .where({ level_id: level.id })
            .whereNotNull('play_id')
            .where('play_id', '<>', existingPlay.id);
          allVids = await ts.db.Videos.query().where({
            level_id: level.id,
          });
        }

        const oldVidUrls = oldVids.map((x) => x.url.trim());
        const assignedVidUrls = assignedVids.map((x) => x.url.trim());
        const allVidUrls = allVids.map((x) => x.url.trim());

        for (const video of newVids) {
          video.url = video.url.trim();

          if (allVidUrls.indexOf(video.url) !== -1) {
            if (isPlaysCommand) {
              if (assignedVidUrls.indexOf(video.url) !== -1) {
                ts.userError(
                  await ts.message('addVids.alreadyUsed', {
                    video: video.url,
                  }),
                );
              }

              for (const unassignedVid of unassignedVids) {
                if (unassignedVid.url === video.url) {
                  updateJson.push({
                    id: unassignedVid.id,
                    level_id: level.id,
                    play_id: existingPlay.id,
                    submitter_id: submitter.id,
                    type: video.type,
                    url: video.url,
                  });
                  oldVidUrls.push(video.url.trim());
                  break;
                }
              }
            }
          } else {
            insertJson.push({
              level_id: level.id,
              play_id: isPlaysCommand ? existingPlay.id : null,
              submitter_id: submitter.id,
              type: video.type,
              url: video.url,
            });

            oldVidUrls.push(video.url.trim());
          }

          // Check if url exists already on the level
          // If playscommand
          // Check if url already assigned to another player -> error

          // Check if url already used as a level vid but no play -> update to add this play
          // Else do nothing and inform the user that nothing was done
          // Else add the url and inform the user
        }

        if (insertJson.length === 0 && updateJson.length === 0) {
          ts.userError(
            `No new clear video added for "${level.level_name}" by ${
              level.creator
            }\n${await ts.message('addVids.currentVideos', {
              videos_str: oldVidUrls.join('\n'),
            })}`,
          );
        }
        reply =
          (await ts.message('addVids.haveNew', level)) +
          (!isPlaysCommand
            ? await ts.message('addVids.currentVideos', {
                videos_str: oldVidUrls.join('\n'),
              })
            : await ts.message('addVids.currentPlayVideos', {
                videos_str: oldVidUrls.join('\n'),
              }));
      } else {
        // removing
        if (
          !(level.creator === player.name || player.is_mod === 1) &&
          !isPlaysCommand
        ) {
          ts.userError('addVids.noPermission', level);
        }

        let oldVids = [];
        if (!isPlaysCommand) {
          oldVids = await ts.db.Videos.query().where({
            level_id: level.id,
          });
        } else {
          oldVids = await ts.db.Videos.query()
            .where({ level_id: level.id })
            .where({ play_id: existingPlay.id });
        }

        const oldVidUrls = oldVids.map((x) => x.url.trim());

        for (const video of newVids) {
          video.url = video.url.trim();

          for (const oldVid of oldVids) {
            if (oldVid.url === video.url) {
              removeJson.push({
                id: oldVid.id,
              });
              oldVidUrls.splice(oldVidUrls.indexOf(video.url), 1);
              break;
            }
          }
        }

        if (removeJson.length === 0) {
          ts.userError(
            (await ts.message('addVids.noRemoved', level)) +
              (await ts.message('addVids.currentVideos', {
                videos_str: oldVidUrls.join('\n'),
              })),
          );
        }
        reply =
          (await ts.message('addVids.haveRemoved', level)) +
          (await ts.message('addVids.currentVideos', {
            videos_str: oldVidUrls.join('\n'),
          }));
      }

      if (insertJson.length > 0) {
        for (const row of insertJson) {
          await ts.db.Videos.query().insert(row);
        }
      }

      if (updateJson.length > 0) {
        for (const row of updateJson) {
          await ts.db.Videos.query().where('id', row.id).update(row);
        }
      }

      if (removeJson.length > 0) {
        for (const row of removeJson) {
          await ts.db.Videos.query().where('id', row.id).del();
        }
      }

      return submitter.userReply + reply;
    };

    this.addCollaborators = async (args) => {
      return this.changeCollaborators(args);
    };

    this.removeCollaborators = async (args) => {
      return this.changeCollaborators(args, false);
    };

    this.changeCollaborators = async (args, adding = true) => {
      const { level, newMembers, submitter } = args;

      if (
        !(await ts.modOnly(submitter.discord_id)) &&
        level.creator_id !== submitter.id
      ) {
        ts.userError(
          `${await ts.message('collaborators.notAllowed')}`,
        );
      }

      let reply;

      const existingCollaborators = await ts
        .knex('collaborators')
        .where({ level_id: level.id, guild_id: this.team.id })
        .whereIn(
          'member_id',
          newMembers.map((x) => x.id),
        );

      const existingCollaboratorIds = existingCollaborators.map(
        (x) => x.member_id,
      );

      if (adding) {
        const insertJson = [];

        for (const newMember of newMembers) {
          if (
            existingCollaboratorIds.indexOf(newMember.id) === -1 &&
            newMember.id !== level.creator_id
          ) {
            // Create new one
            insertJson.push({
              level_id: level.id,
              member_id: newMember.id,
              guild_id: this.team.id,
            });
          }
        }

        if (insertJson.length > 0) {
          await ts.knex('collaborators').insert(insertJson);
          reply = `${await ts.message('addcollaborators.success')}\n`;
        } else {
          reply = `${await ts.message('collaborators.noChange')}\n`;
        }
      } else {
        const deleteJsonArr = [];

        for (const newMember of newMembers) {
          if (existingCollaboratorIds.indexOf(newMember.id) !== -1) {
            // Delete that one
            deleteJsonArr.push({
              level_id: level.id,
              member_id: newMember.id,
              guild_id: this.team.id,
            });
          }
        }
        if (deleteJsonArr.length > 0) {
          const queryBuilder = ts.knex('collaborators');
          let first = true;
          for (const deleteJson of deleteJsonArr) {
            if (first) {
              queryBuilder.where(deleteJson);
              first = false;
            } else {
              queryBuilder.orWhere(deleteJson);
            }
          }
          await queryBuilder.del();
          reply = `${await ts.message(
            'removecollaborators.success',
          )}\n`;
        } else {
          reply = `${await ts.message('collaborators.noChange')}\n`;
        }
      }

      let currentCollaborators = await ts
        .knex('collaborators')
        .select('members.name as name')
        .leftJoin(
          'members',
          'collaborators.member_id',
          '=',
          'members.id',
        )
        .where({
          'collaborators.level_id': level.id,
          'collaborators.guild_id': this.team.id,
        });

      if (currentCollaborators && currentCollaborators.length > 0) {
        currentCollaborators = currentCollaborators.map(
          (x) => x.name,
        );
      } else {
        currentCollaborators = [];
      }

      const collabStr = currentCollaborators.join('\n');

      reply += `${await ts.message('collaborators.list', {
        levelName: level.level_name,
        levelCode: level.code,
        collaborators: collabStr || '-',
      })}`;

      return submitter.userReply + reply;
    };

    this.teamAdmin = (discord_id) => {
      if (!discord_id) return false;
      const guild = this.discord.guild();
      const discordUser = guild.members.cache.get(discord_id);
      return (
        (Array.isArray(this.devs) &&
          this.devs.includes(discord_id)) ||
        guild.owner.user.id === discord_id ||
        (discordUser && discordUser.hasPermission('ADMINISTRATOR')) ||
        (this.teamVariables.ManagerName &&
          this.discord.hasRole(
            discord_id,
            this.teamVariables.ManagerName,
          ))
      );
    };

    this.inAllowedChannel = (message, defaultPermission) => {
      if (defaultPermission.allowedChannels.length === 0) {
        return true;
      }

      let allowed = false;
      for (const channelPermission of defaultPermission.allowedChannels) {
        if (
          channelPermission.type === 'text' &&
          message.channel.id ===
            this.channels[channelPermission.settingChannelName]
        ) {
          allowed = true;
        } else if (
          channelPermission.type === 'category' &&
          this.discord.messageGetParent(message) ===
            ts.channels[channelPermission.settingChannelName]
        ) {
          allowed = true;
        }
      }
      return allowed;
    };

    this.raceCreator = async (discord_id) => {
      if (!discord_id) return false;
      const player = await ts.getUser(discord_id);

      return (
        ts.teamVariables.MinimumPointsUnofficialRace &&
        player.clear_score_sum >=
          ts.teamVariables.MinimumPointsUnofficialRace
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
      if (ts.teamVariables.discordAdminCanMod === 'true') {
        // if yes, any discord mods can do team administrative stuff but won't officially appear in the "Mod" list
        const discordUser = guild.members.cache.get(discordId);
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
        let mods = [guild.ownerID];
        if (this.teamVariables.ModName) {
          mods = ts.discord.getMembersWithRole(
            this.teamVariables.ModName,
          );
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
      gameStyle,
      level_name: levelName,
      discord_id,
      member,
    }) => {
      const player = member || (await ts.getUser(discord_id));
      const existingLevel = await ts
        .getLevels()
        .where({ code })
        .first();
      if (existingLevel)
        ts.userError(
          await ts.message('add.levelExisting', {
            level: existingLevel,
          }),
        );
      if (!player.earned_points.canUpload) {
        ts.userError(
          await ts.message('points.cantUpload', {
            points_needed: player.earned_points.pointsNeeded,
          }),
        );
      }
      await ts.db.Levels.query().insert({
        code,
        level_name: levelName,
        creator: player.id,
        difficulty: 0,
        status: 0,
      });

      const initialTags = [gameStyle];

      if (ts.teamVariables.allowSMM1 === 'true') {
        if (ts.is_smm1(code)) {
          initialTags.push('SMM1');
        } else if (ts.is_smm2(code)) {
          initialTags.push('SMM2');
        }
      }

      if (initialTags.length > 0) {
        const level = await ts.db.Levels.query()
          .where({ code: code })
          .first();

        const newTags = await ts.addTags(
          initialTags,
          ts.knex,
          player.discord_id,
          true,
        );
        const oldTags = await ts
          .knex('level_tags')
          .where({ level_id: level.id });

        const tagsToBeAdded = await ts
          .knex('tags')
          .where({ guild_id: ts.team.id })
          .whereIn('name', newTags)
          .whereNotIn(
            'id',
            oldTags.map((t) => t.tag_id),
          );

        const lockedTags = tagsToBeAdded.filter((t) => t.add_lock);
        if (
          lockedTags.length > 0 &&
          !(await ts.modOnly(player.discord_id))
        ) {
          ts.userError('tags.cantAdd', {
            tag: lockedTags.map((t) => t.name).join(','),
          });
        }

        if (tagsToBeAdded.length !== 0) {
          const rows = tagsToBeAdded.map((x) => {
            return {
              guild_id: ts.team.id,
              level_id: level.id,
              tag_id: x.id,
              user_id: player.id,
            };
          });

          await ts.knex.transaction((trx) => {
            return trx('level_tags').insert(rows);
          });
        }
      }

      await ts.recalculateAfterUpdate({ name: player.name });
      return {
        reply: await ts.message('add.success', {
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
    this.message = async function (type, args) {
      if (this.messages[type]) {
        if (this.commandLanguage === 'en') {
          return this.messages[type](args);
        }
        // Check if message for that language exists
        if (this.messages[`${this.commandLanguage}.${type}`]) {
          return this.messages[`${this.commandLanguage}.${type}`](
            args,
          );
        }
        // Try translating it and adding it to the messages
        try {
          const [
            translation,
          ] = await this.cloudTranslationService.translate(
            `[Translated by Google Translate]${this.messages[type](
              args,
            )}`,
            this.commandLanguage,
          );

          const enTranslation = await this.knex('default_strings')
            .where({
              name: `${type}`,
              language: 'en',
            })
            .first();

          await this.knex('default_strings').insert({
            name: `${type}`,
            message: translation,
            language: this.commandLanguage,
            version: enTranslation.version,
            auto_translated: 1,
          });

          TS.addMessage(
            `${this.commandLanguage}.${type}`,
            translation,
          );

          return translation;
        } catch (ex) {
          if (
            ex.errors &&
            ex.errors.length > 0 &&
            ex.errors[0].message === 'Invalid Value'
          ) {
            return 'Invalid Language, try using the short language code for your desired language (en, de, fr, ko, ja, ...).';
          }
          console.log(ex);
          return 'something went wrong buzzyS';
        }
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
      this.discord.dm(
        discord_id,
        await ts.message('website.loggedin'),
      );
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

    this.canRunCommand = async (
      message,
      commandDB,
      withReply = false,
    ) => {
      if (commandDB) {
        const commandPermission = await ts
          .knex('command_permissions')
          .where({
            guild_id: ts.team.id,
            command_id: commandDB.id,
          })
          .first();

        let hasRolePermissions = false;
        let hasChannelPermissions = false;

        if (commandPermission) {
          if (commandPermission.disabled) {
            return false;
          }

          if (commandPermission.roles) {
            hasRolePermissions = true;
            if (
              !ts.discord.hasRoleList(
                message.author.id,
                commandPermission.roles.split(','),
              )
            ) {
              if (withReply) {
                await TS.DiscordWrapper.reply(
                  message,
                  "You don't have one of the required roles to use this command. Try using `!help commands` to see a list of all commands available to you **in this channel.**",
                );
              }
              return false;
            }
          }

          if (
            commandPermission.text_channels ||
            commandPermission.channel_categories
          ) {
            hasChannelPermissions = true;

            let inAllowedChannel = false;
            if (commandPermission.text_channels) {
              const channelNames = commandPermission.text_channels.split(
                ',',
              );
              for (const channelName of channelNames) {
                if (
                  message.channel.name.toLowerCase() ===
                  channelName.toLowerCase()
                ) {
                  inAllowedChannel = true;
                }
              }
            }
            if (commandPermission.channel_categories) {
              const categoryNames = commandPermission.channel_categories.split(
                ',',
              );
              for (const categoryName of categoryNames) {
                if (
                  message.channel.parent &&
                  message.channel.parent.name.toLowerCase() ===
                    categoryName.toLowerCase()
                ) {
                  inAllowedChannel = true;
                }
              }
            }

            if (!inAllowedChannel) {
              if (withReply) {
                await TS.DiscordWrapper.reply(
                  message,
                  "You can't use this command here. Try using `!help commands` to see a list of all commands available to you **in this channel.**",
                );
              }
              return false;
            }
          }
        }

        // Default behavior if no command permission is set
        const defaultPermission =
          defaultCommandPermissions[commandDB.name];

        if (
          !hasRolePermissions &&
          !(
            defaultPermission.allowedRoles === 'all' ||
            (defaultPermission.allowedRoles === 'mods' &&
              (await ts.modOnly(message.author.id))) ||
            (defaultPermission.allowedRoles === 'admins' &&
              (await ts.teamAdmin(message.author.id)))
          )
        ) {
          if (withReply) {
            await TS.DiscordWrapper.reply(
              message,
              "You don't have one of the required roles to use this command. Try using `!help commands` to see a list of all commands available to you **in this channel.**",
            );
          }
          return false;
        }

        if (
          !hasChannelPermissions &&
          !ts.inAllowedChannel(message, defaultPermission)
        ) {
          if (withReply) {
            await TS.DiscordWrapper.reply(
              message,
              "You can't use this command here. Try using `!help commands` to see a list of all commands available to you **in this channel.**",
            );
          }
          return false;
        }
        return true;
      }
      if (ts.teamAdmin(message.author.id)) {
        return true;
      }
      return false;
    };

    /**
     * Checks if the code is an SMM1 code. Should be true only when ts.teamVariables.allowSMM1=='true'
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
      const processedCode = this.getUnlabledName(code);
      return (
        this.is_smm2(processedCode) ||
        (this.teamVariables.allowSMM1 === 'true' &&
          this.is_smm1(processedCode))
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
      if (!body) return false;
      let header = pHeader;
      const bodyArr = body.split('.');
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
      return true;
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
     * @property {Level} level         - Level
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
      let { level, completed, difficulty, liked, code } = args;
      const { discord_id, strOnly, playerDontAtMe, member } = args;

      if (!level) {
        if (code) {
          code = code.toUpperCase();
        }
        level = await this.getExistingLevel(code);
      } else {
        code = level.code;
      }

      if (!discord_id && !member)
        ts.userError(await ts.message('error.noDiscordId'));

      if (typeof difficulty === 'string')
        difficulty = difficulty.toLowerCase();
      if (typeof liked === 'string') liked = liked.toLowerCase();

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
        ts.userError(await ts.message('clear.noArgs'));
      }
      if (code == null) {
        ts.userError(await ts.message('error.noCode'));
      }
      if (difficulty && Number.isNaN(Number(difficulty))) {
        ts.userError(await ts.message('clear.invalidDifficulty'));
      }
      if (difficulty) {
        difficulty = parseFloat(difficulty);
      }
      if (
        difficulty !== 0 &&
        difficulty &&
        !ts.valid_difficulty(difficulty)
      ) {
        ts.userError(await ts.message('clear.invalidDifficulty'));
      }
      const player = member || (await ts.getUser(discord_id));
      if (level.creator_id === player.id)
        ts.userError(await ts.message('clear.ownLevel'));
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
      }
      if ([0, 1].includes(completed)) {
        if (updated.completed) {
          if (completed) {
            // If the level requires verified clears we create an audit channel
            const requiresVerifiedClears = await ts.levelRequiresVerifiedClears(
              level,
            );
            if (requiresVerifiedClears) {
              await ts.auditDiscussionChannel(
                level.code,
                null,
                ts.CHANNEL_LABELS.AUDIT_VERIFY_CLEARS,
                {
                  requester: player.discord_id,
                },
              );

              const voteEmbed = await ts.makeVoteEmbed(level);
              await ts.discord.updatePinned(
                `${ts.CHANNEL_LABELS.AUDIT_VERIFY_CLEARS}${code}`,
                voteEmbed,
              );

              await ts.discord.send(
                `${ts.CHANNEL_LABELS.AUDIT_VERIFY_CLEARS}${code}`,
                `Clear by <@${player.discord_id}> requires verification, please check if their clear is valid.`,
              );
            }

            msg.push(await ts.message('clear.addClear', { level }));
            if (level.status === ts.LEVEL_STATUS.APPROVED) {
              msg.push(
                await ts.message('clear.earnedPoints', {
                  earned_points: ts.getPoints(level.difficulty),
                }),
              );
            } else {
              msg.push(await ts.message('clear.pendingLevel'));
            }
          } else {
            msg.push(
              await ts.message('clear.removedClear', { level }),
            );
          }
        } else {
          msg.push(
            await ts.message(
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
            ? await ts.message('clear.removeDifficulty', { level })
            : await ts.message('clear.addDifficulty', {
                level: level,
                difficulty_vote: difficulty,
              }),
        );
      } else if (difficulty || difficulty === 0) {
        msg.push(
          difficulty === 0
            ? await ts.message('clear.alreadyDifficulty', { level })
            : await ts.message('clear.alreadyNoDifficulty', {
                level: level,
                difficulty_vote: difficulty,
              }),
        );
      }
      if ([0, 1].includes(liked)) {
        if (updated.liked) {
          msg.push(
            await ts.message(
              liked ? 'clear.addLike' : 'clear.removeLike',
              {
                level,
              },
            ),
          );
        } else {
          msg.push(
            await ts.message(
              liked ? 'clear.alreadyLiked' : 'clear.alreadyUnliked',
              { level },
            ),
          );
        }
      }
      await ts.recalculateAfterUpdate({ name: player.name });
      if (!member) {
        const updatedPlayer = await ts.getUser(discord_id);
        const userReply = playerDontAtMe
          ? updatedPlayer.userReply_dontatme
          : updatedPlayer.userReply;
        return (
          (strOnly ? '' : userReply) +
          (await ts.processClearMessage({ msg, creatorStr, level }))
        );
      }
      return `Play updated for: ${
        member.name
      }${await ts.processClearMessage({ msg, creatorStr, level })}`;
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
    this.processClearMessage = async function (args) {
      const { msg, creatorStr, level } = args;
      const levelPlaceholder = this.customStrings.levelInfo;
      let levelStr = await ts.message('clear.levelInfo', {
        level,
        creator: creatorStr,
      });
      const singleHave = await ts.message('clear.singleHave');
      const manyHave = await ts.message('clear.manyHave');
      const levelPronoun = await ts.message('clear.levelPronoun');
      for (let i = 0; i < msg.length; i += 1) {
        msg[i] = msg[i].replace(levelPlaceholder, levelStr);
        if (i > 1) msg[i] = msg[i].replace(singleHave, manyHave);
        levelStr = levelPronoun;
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
        ts.userError(await ts.message('error.noCode'));
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
            matchStr = await ts.message('general.didYouMean', {
              info: allLevels[match.bestMatch.target],
            });
          }
        }
        ts.userError(
          (await ts.message('error.levelNotFound', { code })) +
            matchStr,
        );
      }
      if (
        !includeRemoved &&
        ts.REMOVED_LEVELS.includes(level.status)
      ) {
        // level is removed. not pending/accepted
        ts.userError(
          await ts.message('error.levelIsRemoved', { level }),
        );
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
     * Helper function to create a user error
     */
    this.createUserError = function (errorStr, args) {
      return new UserError(
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
    this.getUserErrorMsg = async function (obj, message) {
      if (obj instanceof UserError) {
        return obj.msg + (await ts.message('error.afterUserDiscord'));
      }
      DiscordLog.error(ts.makeErrorObj(obj, message));
      return ts.message('error.unknownError');
    };
    /**
     * To be used to parse a thrown exception and check if it's a user error in the JSON endpoint. User error can be passed to the user. any other error, we will throw a non descript error message to the user and log the actual error
     */
    this.getWebUserErrorMsg = async function (obj) {
      if (obj instanceof UserError) {
        return {
          status: 'error',
          message: obj.msg + (await ts.message('error.afterUserWeb')),
        };
      }
      DiscordLog.error({
        error: obj.stack ? obj.stack : obj,
        url_slug: this.url_slug,
      });
      return {
        status: 'error',
        message: await ts.message('error.unknownError'),
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
      debug(args);
      const {
        discord_id,
        players,
        tags,
        randomAll,
        randomPending,
      } = args;
      let { minDifficulty, maxDifficulty } = args;

      if (!maxDifficulty && minDifficulty) {
        maxDifficulty = minDifficulty;
      }
      if (minDifficulty > maxDifficulty) {
        const temp = maxDifficulty;
        maxDifficulty = minDifficulty;
        minDifficulty = temp;
      }

      let tagSql =
        'AND (tags.is_seperate!=1 or tags.is_seperate is null)';
      const tagIds = [];
      if (tags) {
        for (const tagName of tags) {
          const tag = await this.findTag(tagName);
          tagIds.push(tag.id);
        }
        if (tags.length > 0) {
          tagSql = 'AND tags.id in (:tagIds:)';
        }
      }

      let playerIds;
      const player =
        discord_id != null ? await ts.getUser(discord_id) : null;
      if (players) {
        if (players.length === 0)
          ts.userError(await ts.message('random.noPlayersGiven'));
        playerIds = [];
        // const dbPlayerNames = players.map((n) => n.name);

        playerIds = players.map((p) => p.id);
      } else if (player) {
        playerIds = [player.id];
      }

      if (!minDifficulty) {
        if (playerIds) {
          const [result] = await ts.knex.raw(
            `select max(difficulty) maxDiff
          from plays
          inner join levels on plays.code=levels.id
          where plays.player in (:players:) and plays.completed=1
          `,
            { players: playerIds },
          );
          maxDifficulty = result[0].maxDiff;
        }

        if (!maxDifficulty) {
          minDifficulty = 0.5;
          maxDifficulty = this.teamVariables.maxDifficulty || 10;
        }
      }

      const min = parseFloat(minDifficulty) || 0.5;
      const max = parseFloat(maxDifficulty) || min;

      const levelStatusSql = randomPending
        ? 'where status = 0'
        : 'where status = 1';
      const difficultySql = randomPending
        ? ''
        : 'and levels.difficulty between :min and :max';

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
        tagIds,
        players: playerIds,
        tagCount: tagIds.length === 0 ? 1 : tagIds.length,
      };
      const [filteredLevels] = await knex.raw(
        `
    SELECT levels.*, members.id creator_id,
    members.name creator,
    COALESCE(group_concat(tags.name),'') tags, count(*) as tag_count from
    levels
    inner join members on levels.creator=members.id
    left join level_tags on levels.id=level_tags.level_id
    left join tags on tags.id=level_tags.tag_id
    ${playsSQL1}
    ${levelStatusSql}
    ${playsSQL2}
    and levels.guild_id=:team_id
    and ( levels.not_default is null or levels.not_default!=1 )
    ${difficultySql}
    ${playsSQL3}
    ${tagSql}
    group by levels.id
    ${tags ? 'having tag_count = :tagCount' : ''}
    order by likes;`,
        par,
      );
      if (filteredLevels.length === 0) {
        ts.userError(
          (await ts.message('random.outOfLevels', {
            range: min === max ? min : `${min}-${max}`,
          })) +
            (tags && tags.length > 0
              ? await ts.message('random.outOfLevelsTags', {
                  tags: tags.join(','),
                })
              : ''),
        );
      }
      let randNum;
      if (randomAll) {
        randNum = ts.getRandomInt(0, filteredLevels.length);
      } else {
        const borderLine = Math.floor(filteredLevels.length * 0.6);

        if (Math.random() < 0.2) {
          randNum = ts.getRandomInt(0, borderLine);
        } else {
          randNum = ts.getRandomInt(
            borderLine,
            filteredLevels.length,
          );
        }
      }
      const level = filteredLevels[randNum];
      const dbLevel = await this.getExistingLevel(level.code);
      return {
        player: player,
        level: dbLevel,
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
      let player = await this.db.Members.query()
        .where({ discord_id })
        .first();
      if (!player) this.userError('error.notRegistered');
      if (player.is_banned) this.userError('error.userBanned');

      player = await this.decorateMember(player);

      return player;
    };

    /**
     * A function that will decorate a member object with rank and other properties
     */
    this.decorateMember = async function (pPlayer) {
      const player = {};
      Object.assign(player, pPlayer);

      player.created_at = player.created_at.toString();
      player.earned_points = await this.calculatePoints(player.name);
      player.rank = this.getRank(
        player.earned_points.clearPoints,
      ) || {
        min_points: 0,
        rank: '-',
        pipes: '',
        discord_role: '',
      };

      if (player.discord_id) {
        if (
          player.rank.discord_role &&
          !this.discord.hasRole(
            player.discord_id,
            player.rank.discord_role,
          )
        ) {
          await ts.discord.removeRoles(
            player.discord_id,
            ts.rank_ids,
          );
          await ts.discord.addRole(
            player.discord_id,
            player.rank.discord_role,
          );
        }
      }

      player.rank.pips = player.rank.pips || '';
      if (player.discord_id) {
        player.atme_str = player.atme
          ? `<@${player.discord_id}>`
          : player.name;
        player.userReply = `<@${player.discord_id}>${player.rank.pips} `;
      } else {
        player.atme_str = player.name;
        player.userReply = `${player.name} ${player.rank.pips} `;
      }
      player.userReply_dontatme = `${
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
      const voteEmbed = await ts.levelEmbed(
        level,
        this.embedStyle.judgement,
      );
      if (
        level.status === ts.LEVEL_STATUS.PENDING_APPROVED_REUPLOAD
      ) {
        voteEmbed
          .setAuthor(await ts.message('pending.pendingTitle'))
          .setDescription(
            await ts.message('pending.alreadyApprovedBefore'),
          );
      } else if (
        level.status === ts.LEVEL_STATUS.PENDING_NOT_FIXED_REUPLOAD
      ) {
        voteEmbed
          .setAuthor(await ts.message('pending.refuseTitle'))
          .setDescription(
            await ts.message('pending.refuseDescription'),
          );
      } else if (
        level.status === ts.LEVEL_STATUS.PENDING_FIXED_REUPLOAD
      ) {
        voteEmbed
          .setAuthor(await ts.message('pending.reuploadedTitle'))
          .setDescription(
            await ts.message('pending.fixReuploadDescription'),
          );
      }
      if (reuploadComment) {
        voteEmbed.addField(
          `Creator (${level.creator}) reupload comment:`,
          `\`\`\`\n${reuploadComment}\n\`\`\``,
        );
      }
      let postString = await ts.message('approval.approvalVotes');
      if (approveVotes === undefined || approveVotes.length === 0) {
        postString += await ts.message('approval.noVotes');
      } else {
        for (let i = 0; i < approveVotes.length; i += 1) {
          const curShellder = await ts.db.Members.query()
            .where({ name: approveVotes[i].player })
            .first();
          postString += `<@${curShellder.discord_id}> - Difficulty: ${approveVotes[i].difficulty_vote}, Reason: ${approveVotes[i].reason}\n`;
        }
      }
      postString += await ts.message('approval.fixVotes');
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
      postString += await ts.message('approval.rejectVotes');
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
      const { discord_id, reason, type, difficulty, code } = args;
      let { level } = args;

      if (!level) {
        level = await this.getExistingLevel(code);
      }

      // Check if vote already exists
      const shellder = await ts.getUser(discord_id);
      const vote = await ts
        .getPendingVotes()
        .where('levels.id', level.id)
        .where('player', shellder.id)
        .first();
      if (!vote) {
        // We only check reason if we have no vote yet
        if (!reason) {
          ts.userError(await ts.message('approval.changeReason'));
        } else {
          ts.reasonLengthCheck(reason);
        }
      }
      // Check if level is approved, if it's approved only allow rejection
      if (
        level.status === ts.LEVEL_STATUS.APPROVED &&
        type === 'approve'
      ) {
        ts.userError(
          await ts.message('approval.levelAlreadyApproved'),
        );
      } else if (!PENDING_LEVELS.includes(level.status)) {
        ts.userError(await ts.message('approval.levelNotPending'));
      }
      let replyMsg = 'approval.voteAdded';
      if (!vote) {
        await ts.db.PendingVotes.query().insert({
          code: level.id,
          player: shellder.id,
          type: type,
          difficulty_vote:
            type === 'approve' || type === 'fix' ? difficulty : null,
          reason: reason,
        });
      } else {
        replyMsg = 'approval.voteChanged';
        await ts.db.PendingVotes.query().findById(vote.id).patch({
          type: type,
          reason: reason,
          difficulty_vote: difficulty,
        });
      }
      const voteEmbed = await ts.makeVoteEmbed(level);
      await ts.pendingDiscussionChannel(level.code);
      await this.discord.updatePinned(level.code, voteEmbed);
      return ts.message(replyMsg, {
        channel_id: this.discord.channel(level.code).id,
      });
    };
    /**
     * Helper function to create a discussion channel in the right parent. If there is already a channel, we will move the channel to the right one
     * @param {string} channelName channel name to find
     * @param {string} [oldChannelName] if given, the function will try to find the old name first and will be renamed to channel_name if found
     * @param {LevelRow} level
     * @return {Channel} returns a Discord Channel or either the created or found channel
     */
    this.pendingDiscussionChannel = async (
      channelName,
      oldChannelName,
    ) => {
      if (!channelName) throw new TypeError('undefined channel_name');
      let created = false;
      let discussionChannel = ts.discord.channel(channelName);
      const level = await this.getLevels()
        .where({ code: channelName.toUpperCase() })
        .first();
      let labeled = false;
      if (oldChannelName) {
        const oldChannel = ts.discord.channel(oldChannelName);
        if (oldChannel) {
          if (!discussionChannel) {
            await this.labelPendingLevel(level, oldChannelName);
            discussionChannel = oldChannel;
            labeled = true;
          } else {
            await ts.discord.removeChannel(
              oldChannelName,
              'duplicate channel',
            );
            DiscordLog.error(
              'Duplicate channel found for `old_channel_name` reupload to `channel_name`. deleting `old_channel_name`',
            );
          }
        }
      }
      if (!discussionChannel) {
        await ts.discord.createChannel(
          `${await this.makePendingLabel(level)}${channelName}`,
          {
            parent: ts.channels.levelDiscussionCategory,
          },
        );
        created = true;
        labeled = true;
      }

      if (!labeled) await this.labelPendingLevel(level);
      await ts.discord.setChannelParent(
        channelName,
        ts.channels.levelDiscussionCategory,
      );
      return { channel: channelName, created };
    };

    /**
     * Helper function to create a discussion channel in the right parent. If there is already a channel, we will move the channel to the right one
     * @param {string} channelName channel name to find
     * @param {string} [oldChannelName] if given, the function will try to find the old name first and will be renamed to channel_name if found
     * @return {Channel} returns a Discord Channel or either the created or found channel
     */
    this.auditDiscussionChannel = async (
      channelName,
      oldChannelName,
      label,
      auditMetadata,
    ) => {
      if (!channelName) throw new TypeError('undefined channel_name');
      let created = false;
      let discussionChannel = ts.discord.channel(
        `${label}${channelName}`,
      );
      const level = await this.getLevels()
        .where({ code: channelName.toUpperCase() })
        .first();
      if (oldChannelName) {
        const oldChannel = ts.discord.channel(
          `${label}${oldChannelName}`,
        );
        if (oldChannel) {
          if (!discussionChannel) {
            await this.renameAuditChannel(
              oldChannelName,
              level.code,
              label,
            );
            discussionChannel = oldChannel;
          } else {
            await ts.discord.removeChannel(
              oldChannelName,
              'duplicate channel',
            );
            DiscordLog.error(
              'Duplicate channel found for `old_channel_name` reupload to `channel_name`. deleting `old_channel_name`',
            );
          }
        }
      }

      if (!discussionChannel) {
        await ts.discord.createChannel(`${label}${channelName}`, {
          parent: ts.channels.levelAuditCategory,
        });

        await ts.discord.setTopic(
          `${label}${channelName}`,
          JSON.stringify(auditMetadata),
        );

        created = true;
      }

      // Not needed
      /* await ts.discord.setChannelParent(
        `${label}${channelName}`,
        ts.channels.levelAuditCategory,
      ); */

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
          if (ts.channels.initiateChannel) {
            await this.discord.send(
              ts.channels.initiateChannel,
              await ts.message('initiation.message', {
                discord_id: author.discord_id,
              }),
            );
          }
        } else {
          DiscordLog.error(
            await ts.message('initiation.userNotInDiscord', {
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
    this.embedComments = async (embed, comments) => {
      for (let i = 0; i < comments.length; i += 1) {
        let msgString = '';
        if (comments[i].type === 'fix') {
          msgString = 'judge.votedFix';
        } else if (comments[i].type === 'approve') {
          msgString = 'judge.votedApprove';
        } else {
          msgString = 'judge.votedReject';
        }
        const embedHeader = await ts.message(msgString, {
          ...comments[i],
        });
        ts.embedAddLongField(embed, comments[i].reason, embedHeader);
      }
    };

    this.checkUserError = async (callback) => {
      try {
        await callback();
      } catch (error) {
        if (error instanceof UserError) {
          return error.message;
        }
        throw error;
      }
      return false;
    };

    /**
     * Checks if a level is a vote away to being judgegable.
     */
    this.oneVoteAway = async (args) => {
      if (!args) return false;

      const plusOneVotes = [
        {
          ...args,
          approvalVotesCount: args.approvalVotesCount
            ? (args.approvalVotesCount || 0) + 1
            : 0,
        },
        {
          ...args,
          rejectVotesCount: args.rejectVotesCount
            ? (args.rejectVotesCount || 0) + 1
            : 0,
        },
        {
          ...args,
          fixVotesCount: args.fixVotesCount
            ? (args.fixVotesCount || 0) + 1
            : 0,
        },
      ];

      for (const o of plusOneVotes) {
        if (
          !(await this.checkUserError(async () =>
            this.processVotes(o),
          ))
        )
          return this.processVotes(o);
      }

      return 'none';
    };
    /**
     * @description This will process vote counts and get the respective votes needed and returns the result as a status update
     * @return {LevelStatus} returns the status update if any
     * @throws {UserError} if there is a tie
     * @throws {UserError} if there is not enough votes
     */
    this.processVotes = async (args) => {
      const {
        approvalVotesCount = 0,
        fixVotesCount = 0,
        rejectVotesCount = 0,
        isFix = false,
      } = args;
      let {
        approvalVotesNeeded = 0,
        fixVotesNeeded = 0,
        rejectVotesNeeded = 0,
      } = args;
      const fixAndApproveVoteCount =
        fixVotesCount > 0 ? fixVotesCount + approvalVotesCount : 0;
      const VotesNeeded = parseInt(ts.teamVariables.VotesNeeded, 10);
      approvalVotesNeeded =
        approvalVotesNeeded ||
        parseInt(ts.teamVariables.ApprovalVotesNeeded, 10) ||
        VotesNeeded ||
        1;
      rejectVotesNeeded =
        rejectVotesNeeded ||
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
      debug({
        arguments: {
          ...args,
        },
        votesNeeded: {
          approvalVotesNeeded,
          rejectVotesNeeded,
          fixVotesNeeded,
        },
        calculations: {
          approvalRatio,
          rejectionRatio,
          fixRatio,
          fixApproveRatio,
          approvalFixRatio,
        },
      });
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
        ts.userError(await ts.message('approval.comboBreaker'));
      } else {
        ts.userError(await ts.message('approval.numVotesNeeded'));
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
    this.checkForAgreement = (arg = {}) => {
      const {
        AgreeingVotesNeeded,
        AgreeingMaxDifference,
        approvalVotes = [],
        fixVotes = [],
        rejectVotes = [],
      } = arg;
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

    this.processStatusUpdate = async (
      level,
      fromFix,
      noAgree,
      forceJudge,
    ) => {
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
        parseInt(ts.teamVariables.AgreeingVotesNeeded, 10) || 0;
      const AgreeingMaxDifference =
        parseInt(ts.teamVariables.AgreeingMaxDifference, 10) || 0;
      const inAgreement = noAgree
        ? false
        : ts.checkForAgreement({
            AgreeingVotesNeeded,
            AgreeingMaxDifference,
            approvalVotes,
            fixVotes,
            rejectVotes,
          });

      const approvalVotesNeeded = inAgreement
        ? AgreeingVotesNeeded
        : null;
      const fixVotesNeeded = inAgreement ? AgreeingVotesNeeded : null;
      return {
        approvalVotes,
        fixVotes,
        rejectVotes,
        voteArgs: {
          approvalVotesNeeded: forceJudge ? 1 : approvalVotesNeeded,
          fixVotesNeeded: forceJudge ? 1 : fixVotesNeeded,
          rejectVotesNeeded: forceJudge ? 1 : 0,
          approvalVotesCount: approvalVotes.length,
          rejectVotesCount: rejectVotes.length,
          fixVotesCount: fixVotes.length,
          isFix: fromFix,
        },
      };
    };

    this.judge = async function (code, fromFix = false, forceJudge) {
      const level = await ts.getExistingLevel(code, fromFix);
      const author = await ts.db.Members.query()
        .where({ id: level.creator_id })
        .first();
      if (!PENDING_LEVELS.includes(level.status)) {
        ts.userError(await ts.message('approval.levelNotPending'));
      }

      const {
        approvalVotes,
        fixVotes,
        rejectVotes,
        voteArgs,
      } = await this.processStatusUpdate(
        level,
        fromFix,
        false,
        forceJudge,
      );
      const statusUpdate = await this.processVotes(voteArgs);
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

      if (ts.SHOWN_IN_LIST.indexOf(statusUpdate) === -1) {
        await ts.checkTagsForRemoval();
      }

      const mention = await this.message('general.heyListen', {
        discord_id: author.discord_id,
      });
      const judgeEmbed = await this.levelEmbed(
        level,
        this.embedStyle[statusUpdate],
        { difficulty },
      );
      if (statusUpdate === this.LEVEL_STATUS.NEED_FIX)
        judgeEmbed.setDescription(
          await ts.message('approval.fixInstructionsCreator'),
        );
      await this.embedComments(judgeEmbed, [
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
        await ts.message('approval.channelDeleted'),
      );
    };

    this.makePendingLabel = async (level) => {
      const labels = [];
      const creator = await this.db.Members.query()
        .where({
          id: level.creator_id,
        })
        .first();
      if (creator && !creator.is_member)
        labels.push(this.CHANNEL_LABELS.PENDING_CREATOR_UNINITIATED);
      const { voteArgs } = await this.processStatusUpdate(
        level,
        false,
        true,
      );
      const oneVote = await this.oneVoteAway(voteArgs);
      const voteLabel = {
        [LEVEL_STATUS.APPROVED]: this.CHANNEL_LABELS
          .PENDING_ALMOST_APPROVE,
        [LEVEL_STATUS.REJECTED]: this.CHANNEL_LABELS
          .PENDING_ALMOST_REJECT,
        [LEVEL_STATUS.NEED_FIX]: this.CHANNEL_LABELS
          .PENDING_ALMOST_FIX,
        none: '',
      };
      labels.push(voteLabel[oneVote]);
      return labels.join('');
    };

    this.labelPendingLevel = async (level, renameFrom) => {
      if (!level) return false;
      const labels = await this.makePendingLabel(level);
      return this.discord.renameChannel(
        renameFrom || level.code,
        `${labels}${level.code}`,
      );
    };

    this.renameAuditChannel = async (oldCode, newCode, label) => {
      return this.discord.renameChannel(
        `${label}${oldCode}`,
        `${label}${newCode}`,
      );
    };

    this.finishAuditRequest = async function (
      code,
      discordId,
      reason,
      approve,
      label,
      pDifficulty = null,
    ) {
      const level = await ts.getExistingLevel(code, true);
      const author = await ts.db.Members.query()
        .where({ id: level.creator_id })
        .first();
      const player = await ts.db.Members.query()
        .where({ discord_id: discordId })
        .first();

      const topic = await ts.discord.getTopic(
        `${label}${level.code}`,
      );
      let requester_discord_id = author.discord_id;
      if (topic) {
        requester_discord_id = JSON.parse(topic).requester;
      }

      // Check level status and stuff for each audit type
      if (
        !PENDING_LEVELS.includes(level.status) &&
        label === ts.CHANNEL_LABELS.AUDIT_FIX_REQUEST
      ) {
        ts.userError(await ts.message('approval.levelNotPending'));
      }

      let difficulty = null;
      const oldDifficulty = level.difficulty;
      let newStatus = null;
      if (approve) {
        if (label === ts.CHANNEL_LABELS.AUDIT_FIX_REQUEST) {
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

          newStatus = ts.LEVEL_STATUS.APPROVED;
        } else if (
          label === ts.CHANNEL_LABELS.AUDIT_APPROVED_REUPLOAD
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
            ts.userError(
              await ts.message('approval.oldLevelNotFound'),
            );
          }

          newStatus = ts.LEVEL_STATUS.APPROVED;
        } else if (
          label === ts.CHANNEL_LABELS.AUDIT_DELETION_REQUEST
        ) {
          // If we're in a deletion request, we'll delete the level.
          await ts.removeLevel(level, player, reason);
          newStatus = ts.LEVEL_STATUS.USER_REMOVED;
        } else if (label === ts.CHANNEL_LABELS.AUDIT_RERATE_REQUEST) {
          // If we're in a rerate request we'll rerate the difficulty of the level with the param
          difficulty = pDifficulty;
        } else if (label === ts.CHANNEL_LABELS.AUDIT_VERIFY_CLEARS) {
          // If we're in a clear verification request we'll do nothing here, just the channel gets deleted
        } else {
          ts.userError(await ts.message('approval.noLabel'));
        }
      } else if (label === ts.CHANNEL_LABELS.AUDIT_FIX_REQUEST) {
        // If it was in a fix request before we flat out reject it
        newStatus = ts.LEVEL_STATUS.REJECTED;
      } else if (
        label === ts.CHANNEL_LABELS.AUDIT_APPROVED_REUPLOAD
      ) {
        // If the level was approved before we flat out reject it
        newStatus = ts.LEVEL_STATUS.REJECTED;
      } else if (label === ts.CHANNEL_LABELS.AUDIT_DELETION_REQUEST) {
        // If we're in a deletion request we do nothing
      } else if (label === ts.CHANNEL_LABELS.AUDIT_RERATE_REQUEST) {
        // If we're in a rerate request we do nothing
      } else if (label === ts.CHANNEL_LABELS.AUDIT_VERIFY_CLEARS) {
        // If we're in a clear verification request we'll undo the clear
        await ts.clear({
          code: level.code,
          completed: 0,
          liked: 0,
          discord_id: requester_discord_id,
        });
      } else {
        ts.userError(await ts.message('approval.noLabel'));
      }

      let embedTitle;
      if (approve) {
        if (label === ts.CHANNEL_LABELS.AUDIT_FIX_REQUEST) {
          if (
            level.status === ts.LEVEL_STATUS.PENDING_FIXED_REUPLOAD
          ) {
            embedTitle = 'approval.approveAfterFix';
          } else if (
            level.status ===
            ts.LEVEL_STATUS.PENDING_NOT_FIXED_REUPLOAD
          ) {
            embedTitle = 'approval.approveAfterRefuse';
          } else {
            ts.userError(
              await ts.message('approval.inWrongFixStatus'),
            );
          }
        } else if (
          label === ts.CHANNEL_LABELS.AUDIT_APPROVED_REUPLOAD
        ) {
          embedTitle = 'approval.approveAfterReupload';
        } else if (
          label === ts.CHANNEL_LABELS.AUDIT_DELETION_REQUEST
        ) {
          embedTitle = 'approval.approveDeletion';
        } else if (label === ts.CHANNEL_LABELS.AUDIT_RERATE_REQUEST) {
          embedTitle = 'approval.approveRerate';
        } else if (label === ts.CHANNEL_LABELS.AUDIT_VERIFY_CLEARS) {
          embedTitle = 'approval.approveVerifyClear';
        } else {
          ts.userError(await ts.message('approval.noLabel'));
        }
      } else if (label === ts.CHANNEL_LABELS.AUDIT_FIX_REQUEST) {
        if (level.status === ts.LEVEL_STATUS.PENDING_FIXED_REUPLOAD) {
          embedTitle = 'approval.rejectAfterFix';
        } else if (
          level.status === ts.LEVEL_STATUS.PENDING_NOT_FIXED_REUPLOAD
        ) {
          embedTitle = 'approval.rejectAfterRefuse';
        } else {
          ts.userError(await ts.message('approval.inWrongFixStatus'));
        }
      } else if (
        label === ts.CHANNEL_LABELS.AUDIT_APPROVED_REUPLOAD
      ) {
        embedTitle = 'approval.rejectAfterReupload';
      } else if (label === ts.CHANNEL_LABELS.AUDIT_DELETION_REQUEST) {
        embedTitle = 'approval.rejectDeletion';
      } else if (label === ts.CHANNEL_LABELS.AUDIT_RERATE_REQUEST) {
        embedTitle = 'approval.rejectRerate';
      } else if (label === ts.CHANNEL_LABELS.AUDIT_VERIFY_CLEARS) {
        embedTitle = 'approval.rejectVerifyClear';
      } else {
        ts.userError(await ts.message('approval.noLabel'));
      }

      // Status update and difficulty gets set

      const levelUpdate = {};
      if (newStatus) {
        levelUpdate.status = newStatus;
        level.status = newStatus;
      }
      if (difficulty) {
        levelUpdate.difficulty = difficulty;
        level.difficulty = difficulty;
      }

      if (newStatus !== ts.LEVEL_STATUS.USER_REMOVED) {
        await ts.db.Levels.query().patch(levelUpdate).where({ code });
        await ts.recalculateAfterUpdate({ code });
      }

      if (newStatus === ts.LEVEL_STATUS.REJECTED) {
        await ts.checkTagsForRemoval();
      }
      if (newStatus === ts.LEVEL_STATUS.APPROVED) {
        ts.initiate(author);
      }

      const mention = await this.message('general.heyListen', {
        discord_id: requester_discord_id,
      });

      const authorMention = await this.message('general.heyListen', {
        discord_id: author.discord_id,
      });

      // We generate the level embed and change it up
      const embedStyle = this.embedStyle[
        approve ? ts.LEVEL_STATUS.APPROVED : ts.LEVEL_STATUS.REJECTED
      ];

      const finishAuditRequestEmbed = await this.levelEmbed(
        level,
        {
          ...embedStyle,
          title: embedTitle,
        },
        { difficulty, oldDifficulty },
      );
      finishAuditRequestEmbed.addField(
        '\u200b',
        `**Reason** :\`\`\`${reason}\`\`\`-<@${discordId}>`,
      );

      await this.discord.send(
        ts.channels.levelChangeNotification,
        mention,
      );
      if (
        author.discord_id !== requester_discord_id &&
        approve &&
        label !== ts.CHANNEL_LABELS.AUDIT_VERIFY_CLEARS
      ) {
        await this.discord.send(
          ts.channels.levelChangeNotification,
          authorMention,
        );
      }
      await this.discord.send(
        ts.channels.levelChangeNotification,
        finishAuditRequestEmbed,
      );
      // Remove Discussion Channel
      await ts.deleteAuditChannels(
        `${label}${level.code}`,
        await ts.message('approval.channelDeleted'),
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
    this.deleteAuditChannels = async function (
      code,
      reason,
      label = null,
    ) {
      const existingAuditChannels = ts.discord.channels(
        label ? `${label}${code}` : code,
        ts.channels.levelAuditCategory,
      );
      for (const existingAuditChannelArr of existingAuditChannels) {
        const existingAuditChannel = existingAuditChannelArr[1];
        try {
          await existingAuditChannel.delete(reason);
        } catch (ex) {
          debug(ex);
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

    this.levelEmbed = async function (pLevel, args = {}, titleArgs) {
      const level = pLevel;

      const currentCollaborators = await ts
        .knex('collaborators')
        .select('members.name as name')
        .leftJoin(
          'members',
          'collaborators.member_id',
          '=',
          'members.id',
        )
        .where({
          'collaborators.level_id': level.id,
          'collaborators.guild_id': this.team.id,
        });

      const { color, title, noLink } = args;
      let { image } = args;

      let vidStr = [];
      const videos = await ts.db.Videos.query().where({
        level_id: level.id,
      });

      for (const video of videos) {
        vidStr.push(`[ 🎬 ](${video.url})`);
      }
      vidStr = vidStr.join(',');
      let tagStr = [];
      level.tags = level.tags ? level.tags : '';
      level.tags.split(',').forEach((tag) => {
        if (tag)
          tagStr.push(
            `[${tag}](${ts.page_url}${
              ts.url_slug
            }/levels/tags/${encodeURIComponent(tag)})`,
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
                }/maker/${encodeURIComponent(level.creator)})${
                  currentCollaborators.length > 0
                    ? ` [(+${currentCollaborators.length}${this.EMOJIS.COLLAB})](${ts.page_url}${ts.url_slug}/level/${level.code})`
                    : ''
                }`
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
        embed.setAuthor(await ts.message(title, titleArgs));
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

    this.raceEmbed = async function (pRace, args = {}, titleArgs) {
      const race = pRace;
      const { color, title, noLink } = args;
      let { image } = args;

      const startDateMoment = moment(
        race.start_date,
        'YYYY-MM-DD HH:mm:ss',
      );
      const endDateMoment = moment(
        race.end_date,
        'YYYY-MM-DD HH:mm:ss',
      );

      const duration = moment.duration(
        endDateMoment.diff(startDateMoment),
      );
      const lengthMinutes = duration.as('minutes');

      const raceCreator = await ts.db.Members.query()
        .where({ id: race.creator_id })
        .first();

      const vars = [];

      let levelType = 'MISSING LEVEL TYPE';
      if (race.level_type === 'random-uncleared') {
        levelType = 'Random Uncleared';
      } else if (race.level_type === 'random') {
        levelType = 'Random Cleared & Uncleared';
      } else if (race.level_type === 'specific') {
        levelType = 'Specific Level';
      }

      vars.push(levelType);

      if (race.level_type !== 'specific') {
        let levelStatusType = 'MISSING LEVEL STATUS TYPE';
        if (race.level_status_type === 'approved') {
          levelStatusType = 'Approved';
        } else if (race.level_status_type === 'pending') {
          levelStatusType = 'Pending';
        } else if (race.level_status_type === 'all') {
          levelStatusType = 'Approved/Pending';
        }

        vars.push(levelStatusType);

        if (race.level_status_type === 'approved') {
          let weightingType = 'MISSING WEIGHTING TYPE';
          if (race.weighting_type === 'unweighted') {
            weightingType = 'Unweighted';
          } else if (race.weighting_type === 'weighted_lcd') {
            weightingType = 'Weighted (LCD)';
          }
          vars.push(weightingType);

          if (race.level_filter_diff_from) {
            let diffString = race.level_filter_diff_from;
            if (
              race.level_filter_diff_from < race.level_filter_diff_to
            ) {
              diffString += ` - ${race.level_filter_diff_to}`;
            }

            vars.push(`Diff: ${diffString}`);
          }
        }

        let submissionFilter = '';
        if (race.level_filter_submission_time_type === 'month') {
          submissionFilter = 'submitted in the last 30 days';
        } else if (
          race.level_filter_submission_time_type === 'week'
        ) {
          submissionFilter = 'submitted in the last 7 days';
        }

        if (submissionFilter) {
          vars.push(submissionFilter);
        }
      }

      if (race.level_filter_tag_id) {
        const raceTag = await ts.db.Tags.query()
          .where({ id: race.level_filter_tag_id })
          .first();

        vars.push(`Tags: ${raceTag.name}`);
      }

      let varString = vars.join(', ');

      if (race.clear_score_from && race.clear_score_to) {
        varString += `\nNeeded Clear Score to enter: ${race.clear_score_from} - ${race.clear_score_to} points`;
      } else if (race.clear_score_from) {
        varString += `\nMinimum Clear Score needed to enter: ${race.clear_score_from} points`;
      } else if (race.clear_score_to) {
        varString += `\nMaximum Clear Score allowed: ${race.clear_score_to} points`;
      }

      if (race.status !== 'upcoming' && race.level_id) {
        const raceLevel = await ts.db.Levels.query()
          .where({ id: race.level_id })
          .first();

        const raceLevelCreator = await ts.db.Members.query()
          .where({ id: raceLevel.creator })
          .first();

        varString += `\nSelected Level: ${raceLevel.level_name} (${raceLevel.code}) by ${raceLevelCreator.name}`;
      }

      let embed = this.discord
        .embed()
        .setColor(color || '#cccc00')
        .setTitle(
          `${race.name} by ${raceCreator.name}\n${race.race_type} Race (${lengthMinutes} minutes)`,
        )
        .setDescription(varString);

      const raceEntrants = await ts.db.RaceEntrants.query()
        .where({
          race_id: race.id,
        })
        .orderBy('rank', 'ASC');

      for (const entrant of raceEntrants) {
        const entrantMember = await ts.db.Members.query()
          .where({ id: entrant.member_id })
          .first();

        const finishDateMoment = moment(
          entrant.finished_date,
          'YYYY-MM-DD HH:mm:ss',
        );

        const entrantDuration = moment.duration(
          finishDateMoment.diff(startDateMoment),
        );
        const entrantFinishedSeconds = Math.floor(
          entrantDuration.as('seconds') % 60,
        );
        const entrantFinishedMinutes = Math.floor(
          entrantDuration.as('seconds') / 60,
        );

        embed.addField(
          entrant.rank
            ? `#${entrant.rank} (finished after ${entrantFinishedMinutes} minutes, ${entrantFinishedSeconds} seconds)`
            : 'Unfinished',
          entrantMember.name,
        );
      }

      if (title) {
        embed.setAuthor(await ts.message(title, titleArgs));
      }
      if (image) {
        image = this.getEmoteUrl(image);
        embed.setThumbnail(image);
      }
      if (!noLink) {
        embed.setURL(
          `${ts.page_url + ts.url_slug}/${
            race.unofficial ? 'races/unofficial' : 'race'
          }`,
        );
      }
      embed = embed.setTimestamp(race.start_date);
      return embed;
    };

    this.removeLevel = async function (level, player, reason) {
      await ts.db.Levels.query()
        .patch({
          status: ts.LEVEL_STATUS.USER_REMOVED,
          old_status: level.status,
        })
        .where({ code: level.code });
      await ts.recalculateAfterUpdate({ code: level.code });

      await ts.checkTagsForRemoval();

      await ts.deleteDiscussionChannel(level.code, '!tsremove');
      await ts.deleteAuditChannels(level.code, '!remove'); // Delete all open audit requests on deletion

      // Send updates to to #shellbot-level-update
      const removeEmbed = await ts.levelEmbed(
        level,
        ts.embedStyle.remove,
        {
          name: player.name,
        },
      );
      removeEmbed.addField(
        '\u200b',
        `**Reason for removal** :\`\`\`${reason}\`\`\`-<@${player.discord_id}>`,
      );

      const creator = await ts.db.Members.query()
        .where({ id: level.creator_id })
        .first();
      const mention = `**<@${creator.discord_id}>, we got some news for you: **`;
      await ts.discord.send(
        ts.channels.levelChangeNotification,
        mention,
      );
      await ts.discord.send(
        ts.channels.levelChangeNotification,
        removeEmbed,
      );
    };

    this.reuploadLevel = async function (message, args) {
      let { newCode } = args;
      const { oldLevel, reason } = args;
      const player = await ts.db.Members.query()
        .where({ discord_id: ts.discord.getAuthor(message) })
        .first();
      if (!player)
        ts.userError(await ts.message('error.notRegistered'));
      if (newCode) {
        newCode = newCode.toUpperCase();
      } else {
        ts.userError(await ts.message('reupload.noNewCode'));
      }
      if (!ts.validCode(newCode))
        ts.userError(await ts.message('reupload.invalidNewCode'));
      if (oldLevel.code === newCode)
        ts.userError(await ts.message('reupload.sameCode'));
      if (!reason)
        ts.userError(await ts.message('reupload.giveReason'));
      this.reasonLengthCheck(reason, 800);
      const earnedPoints = await ts.calculatePoints(player.name);
      const rank = ts.getRank(earnedPoints.clearPoints);
      const userReply = `<@${ts.discord.getAuthor(message)}>${
        rank.pips ? rank.pips : ''
      } `;
      if (!oldLevel)
        ts.userError(
          await ts.message('error.levelNotFound', {
            code: oldLevel.code,
          }),
        );
      let newLevel = await ts
        .getLevels()
        .where({ code: newCode })
        .first();
      const newLevelExist = !!newLevel;
      const oldApproved =
        oldLevel.status === ts.LEVEL_STATUS.USER_REMOVED
          ? oldLevel.old_status
          : oldLevel.status;

      if (newLevel && oldLevel.creator !== newLevel.creator)
        ts.userError(await ts.message('reupload.differentCreator'));
      if (
        newLevel &&
        newLevel.status !== ts.LEVEL_STATUS.PENDING &&
        newLevel.status !== ts.LEVEL_STATUS.APPROVED &&
        newLevel.status !== ts.LEVEL_STATUS.NEED_FIX
      )
        ts.userError(
          await ts.message('reupload.wrongApprovedStatus'),
        );
      // Reupload means you're going to replace the old one so need to do that for upload check
      const creatorPoints = await ts.calculatePoints(
        oldLevel.creator,
        ts.SHOWN_IN_LIST.includes(oldLevel.status),
      );
      if (oldLevel.new_code)
        ts.userError(
          await ts.message('reupload.haveReuploaded', {
            code: oldLevel.new_code,
          }),
        );
      if (
        !newLevel &&
        !(
          ts.SHOWN_IN_LIST.includes(oldLevel.status) ||
          (!ts.SHOWN_IN_LIST.includes(oldLevel.status) &&
            creatorPoints.canUpload)
        )
      ) {
        ts.userError(await ts.message('reupload.notEnoughPoints'));
      }
      if (!(oldLevel.creator_id === player.id || player.is_mod)) {
        ts.userError(
          await ts.message('reupload.noPermission', oldLevel),
        );
      }
      await ts.db.Levels.query()
        .patch({
          status:
            oldLevel.status === ts.LEVEL_STATUS.APPROVED
              ? ts.LEVEL_STATUS.REUPLOADED
              : ts.LEVEL_STATUS.REMOVED,
          old_status: oldLevel.status,
          new_code: newCode,
        })
        .where({
          code: oldLevel.code,
        });

      await ts.db.Levels.query()
        .patch({ new_code: newCode })
        .where({ new_code: oldLevel.code });
      if (!newLevel) {
        // if no new level was found create a new level copying over the old data

        await ts.db.Levels.query().insert({
          code: newCode,
          level_name: oldLevel.level_name,
          creator: oldLevel.creator_id,
          difficulty: false,
          status: 0,
          tags: oldLevel.tags || '',
        });
        newLevel = await ts
          .getLevels()
          .where({ code: newCode })
          .first();

        let oldTags = await ts
          .knex('level_tags')
          .where({ level_id: oldLevel.id });

        oldTags = oldTags.map(
          ({ guild_id, tag_id, user_id, created_at }) => {
            return {
              guild_id,
              tag_id,
              user_id,
              created_at,
              level_id: newLevel.id,
            };
          },
        );
        await ts.knex.transaction(async (trx) => {
          await trx('level_tags').insert(oldTags);
        });
      }
      await ts.db.PendingVotes.query()
        .patch({ code: newLevel.id })
        .where({ code: oldLevel.id });
      let newStatus = 0;
      if (oldApproved === ts.LEVEL_STATUS.NEED_FIX) {
        newStatus = ts.LEVEL_STATUS.PENDING_FIXED_REUPLOAD; // should make another one
      } else if (
        oldApproved === ts.LEVEL_STATUS.APPROVED ||
        oldApproved === ts.LEVEL_STATUS.PENDING_APPROVED_REUPLOAD
      ) {
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
        (newStatus === 0 && ts.discord.channel(oldLevel.code))
      ) {
        // TODO:FIX HERE
        //
        if (newStatus === ts.LEVEL_STATUS.PENDING) {
          const { channel } = await ts.pendingDiscussionChannel(
            newCode,
            oldLevel.code,
          );

          const voteEmbed = await ts.makeVoteEmbed(
            newLevel,
            reason || '',
          );

          await ts.discord.send(
            newCode,
            await ts.message('reupload.reuploadNotify', {
              oldCode: oldLevel.code,
              newCode,
            }),
          );

          // await this.fixModPing(newCode);

          await ts.discord.updatePinned(channel, voteEmbed);
        } else {
          const { channel } = await ts.auditDiscussionChannel(
            newCode,
            oldLevel.code,
            newStatus === ts.LEVEL_STATUS.PENDING_APPROVED_REUPLOAD
              ? this.CHANNEL_LABELS.AUDIT_APPROVED_REUPLOAD
              : this.CHANNEL_LABELS.AUDIT_FIX_REQUEST,
            {
              requester: ts.discord.getAuthor(message),
            },
          );

          // DO new embed instead
          const voteEmbed = await ts.makeVoteEmbed(
            newLevel,
            reason || '',
          );

          await ts.discord.send(
            newCode,
            await ts.message('reupload.reuploadNotify', {
              oldCode: oldLevel.code,
              newCode,
            }),
          );

          await ts.discord.send(
            `${
              newStatus === ts.LEVEL_STATUS.PENDING_APPROVED_REUPLOAD
                ? this.CHANNEL_LABELS.AUDIT_APPROVED_REUPLOAD
                : this.CHANNEL_LABELS.AUDIT_FIX_REQUEST
            }${newCode}`,
            `Reupload Request for <@${author.discord_id}>'s level with message: \`\`\`${reason}\`\`\``,
          );

          await this.fixModPing(newCode);

          await ts.discord.updatePinned(channel, voteEmbed);
        }
      }

      await ts.renameAuditChannels(oldLevel.code, newCode);

      // TODO: maybe post reupload message in all audit channels?

      let reply = await ts.message('reupload.success', {
        level: oldLevel,
        newCode,
      });
      if (!newLevelExist) {
        reply += await ts.message('reupload.renamingInstructions');
      }
      if (newStatus !== ts.LEVEL_STATUS.PENDING)
        reply += await ts.message('reupload.inReuploadQueue');
      await ts.recalculateAfterUpdate();
      return userReply + reply;
    };

    this.renameAuditChannels = async function (oldCode, newCode) {
      const existingAuditChannels = ts.discord.channels(
        oldCode,
        ts.channels.levelAuditCategory,
      );
      let notify = false;
      for (const existingAuditChannelArr of existingAuditChannels) {
        const existingAuditChannel = existingAuditChannelArr[1];
        const label = existingAuditChannel.name
          .toLowerCase()
          .replace(oldCode.toLowerCase(), '');

        await ts.renameAuditChannel(oldCode, newCode, label);
        notify = true;
      }
      return notify;
    };

    /**
     * @typedef {Object.<Object>} TsAddRaceParam
     * @property {Object} race   - The race daata
     */
    /**
     * @description This function adds a new race
     * @param {...TsClearParam} args Arguments to be supplied
     * @return {string} A response string to be sent to the user.
     */
    this.addRace = async (args = {}) => {
      const {
        name,
        startDate,
        endDate,
        raceType,
        levelType,
        submissionTimeType,
        minDifficulty,
        maxDifficulty,
        levelTagId,
        levelCode,
        unofficial,
        weightingType,
        levelStatusType,
        clearScoreFrom,
        clearScoreTo,
      } = args;
      const { discord_id } = args;

      if (!discord_id)
        ts.userError(await ts.message('error.noDiscordId'));

      const player = await ts.getUser(discord_id);

      if (!unofficial && !player.is_mod) {
        ts.userError(await ts.message('error.noAdmin'));
      }
      if (unofficial && !player.is_mod) {
        if (
          ts.teamVariables.MinimumPointsUnofficialRace &&
          player.clear_score_sum <
            ts.teamVariables.MinimumPointsUnofficialRace
        ) {
          ts.userError(
            await ts.message('race.needMorePoints', {
              minimumPoints:
                ts.teamVariables.MinimumPointsUnofficialRace,
            }),
          );
        }
      }

      let race = {};

      if (startDate) {
        race.start_date = moment(startDate, 'x').format(
          'YYYY-MM-DD HH:mm:ss',
        );
      }
      if (endDate) {
        race.end_date = moment(endDate, 'x').format(
          'YYYY-MM-DD HH:mm:ss',
        );
      }

      race.name = name;
      race.race_type = raceType;
      race.level_type = levelType;

      race.creator_id = player.id;
      race.unofficial = unofficial;

      if (clearScoreFrom) {
        race.clear_score_from = clearScoreFrom;
      } else {
        race.clear_score_from = null;
      }
      if (clearScoreTo) {
        race.clear_score_to = clearScoreTo;
      } else {
        race.clear_score_to = null;
      }

      if (levelType === 'specific') {
        const level = await ts.getExistingLevel(levelCode);
        race.level_id = level.id;
        race.level_filter_tag_id = null;
        race.level_filter_submission_time_type = 'all';
        race.level_filter_diff_from = null;
        race.level_filter_diff_to = null;
        race.level_status_type = 'approved';
        race.weighting_type = 'unweighted';
      } else {
        if (levelTagId) {
          race.level_filter_tag_id = levelTagId;
        } else {
          race.level_filter_tag_id = null;
        }
        race.level_filter_submission_time_type = submissionTimeType;
        race.level_id = null;
        race.level_status_type = levelStatusType;
        if (race.level_status_type === 'approved') {
          race.weighting_type = weightingType;
          race.level_filter_diff_from = minDifficulty;
          race.level_filter_diff_to = maxDifficulty;
        } else {
          race.weighting_type = 'unweighted';
          race.level_filter_diff_from = 0;
          race.level_filter_diff_to = 100;
        }
      }

      race.status = 'upcoming';

      race = await ts.db.Races.query().insert(race);

      if (ts.channels.raceChannel) {
        await ts.discord.send(
          ts.channels.raceChannel,
          await ts.message('race.newRaceAdded', {
            unofficial: race.unofficial,
          }),
        );
        await ts.discord.send(
          ts.channels.raceChannel,
          await ts.raceEmbed(race),
        );
      }

      return 'success';
    };

    /**
     * @typedef {Object.<Object>} TsAddRaceParam
     * @property {Object} race   - The race daata
     */
    /**
     * @description This function adds a new race
     * @param {...TsClearParam} args Arguments to be supplied
     * @return {string} A response string to be sent to the user.
     */
    this.editRace = async (args = {}) => {
      const {
        name,
        startDate,
        endDate,
        raceType,
        levelType,
        submissionTimeType,
        minDifficulty,
        maxDifficulty,
        levelTagId,
        id,
        levelCode,
        weightingType,
        levelStatusType,
        clearScoreFrom,
        clearScoreTo,
      } = args;
      const { discord_id } = args;

      if (!discord_id) ts.userError(ts.message('error.noDiscordId'));

      const player = await ts.getUser(discord_id);

      const race = await ts.db.Races.query()
        .where({ id: id })
        .first();

      if (!race.unofficial && !player.is_mod) {
        ts.userError(ts.message('error.noAdmin'));
      }

      if (race.creator_id !== player.id && !player.is_mod) {
        ts.userError(ts.message('race.notRaceCreator'));
      }

      if (startDate) {
        race.start_date = moment(startDate, 'x').format(
          'YYYY-MM-DD HH:mm:ss',
        );
      }
      if (endDate) {
        race.end_date = moment(endDate, 'x').format(
          'YYYY-MM-DD HH:mm:ss',
        );
      }

      race.name = name;
      race.race_type = raceType;
      race.level_type = levelType;

      if (clearScoreFrom) {
        race.clear_score_from = clearScoreFrom;
      } else {
        race.clear_score_from = null;
      }
      if (clearScoreTo) {
        race.clear_score_to = clearScoreTo;
      } else {
        race.clear_score_to = null;
      }

      if (levelType === 'specific') {
        const level = await ts.getExistingLevel(levelCode);
        race.level_id = level.id;
        race.level_filter_tag_id = null;
        race.level_filter_submission_time_type = 'all';
        race.level_filter_diff_from = null;
        race.level_filter_diff_to = null;
        race.level_status_type = 'approved';
        race.weighting_type = 'unweighted';
      } else {
        if (levelTagId) {
          race.level_filter_tag_id = levelTagId;
        } else {
          race.level_filter_tag_id = null;
        }
        race.level_filter_submission_time_type = submissionTimeType;
        race.level_filter_diff_from = minDifficulty;
        race.level_filter_diff_to = maxDifficulty;
        race.level_id = null;
        race.level_status_type = levelStatusType;
        if (race.level_status_type === 'approved') {
          race.weighting_type = weightingType;
          race.level_filter_diff_from = minDifficulty;
          race.level_filter_diff_to = maxDifficulty;
        } else {
          race.weighting_type = 'unweighted';
          race.level_filter_diff_from = 0;
          race.level_filter_diff_to = 100;
        }
      }

      await ts.db.Races.query().patch(race).where('id', '=', id);

      if (ts.channels.raceChannel) {
        await ts.discord.send(
          ts.channels.raceChannel,
          await ts.message('race.raceEdited', {}),
        );
        await ts.discord.send(
          ts.channels.raceChannel,
          await ts.raceEmbed(race),
        );
      }

      return 'success';
    };

    this.enterRace = async (args = {}) => {
      const { raceId } = args;
      const { discord_id } = args;

      if (!discord_id)
        ts.userError(await ts.message('error.noDiscordId'));

      const player = await ts.getUser(discord_id);

      const race = await ts.db.Races.query()
        .where({ id: raceId })
        .first();

      if (!race) {
        ts.userError(await ts.message('error.raceNotFound'));
      }

      if (race.status !== 'upcoming') {
        ts.userError(await ts.message('error.raceHasStarted'));
      }

      let min = 0;
      let max = 99999999;

      if (race.clear_score_from) {
        min = race.clear_score_from;
      }
      if (race.clear_score_to) {
        max = race.clear_score_to;
      }

      if (
        player.clear_score_sum < min ||
        player.clear_score_sum > max
      ) {
        ts.userError(await ts.message('race.tooManyPoints'));
      }

      const entrant = await ts.db.RaceEntrants.query()
        .where({
          race_id: raceId,
          member_id: player.id,
        })
        .first();

      if (!entrant) {
        await ts.db.RaceEntrants.query().insert({
          race_id: raceId,
          member_id: player.id,
        });
      }

      if (ts.channels.raceChannel) {
        await ts.discord.send(
          ts.channels.raceChannel,
          await ts.message('race.newRaceEntrant', {
            name: race.name,
            discord_id: discord_id,
          }),
        );
      }

      return 'success';
    };

    this.leaveRace = async (args = {}) => {
      const { raceId } = args;
      const { discord_id } = args;

      if (!discord_id)
        ts.userError(await ts.message('error.noDiscordId'));

      const player = await ts.getUser(discord_id);

      const race = await ts.db.Races.query()
        .where({ id: raceId })
        .first();

      if (!race) {
        ts.userError(await ts.message('error.raceNotFound'));
      }

      await ts.db.RaceEntrants.query()
        .where({
          race_id: raceId,
          member_id: player.id,
        })
        .del();

      if (ts.channels.raceChannel) {
        await ts.discord.send(
          ts.channels.raceChannel,
          await ts.message('race.entrantLeftRace', {
            name: race.name,
            discord_id: discord_id,
          }),
        );
      }

      const raceEntrants = await ts.db.RaceEntrants.query().where({
        race_id: race.id,
      });

      if (raceEntrants.length === 0) {
        if (ts.channels.raceChannel) {
          await ts.discord.send(
            ts.channels.raceChannel,
            await ts.message('race.noParticipants', {
              name: race.name,
            }),
          );
        }

        await ts.db.Races.query().where('id', race.id).del();
      }

      return 'success';
    };

    this.endRace = async (pRace) => {
      const race = {};
      Object.assign(race, pRace);
      const raceEntrants = await ts.db.RaceEntrants.query().where({
        race_id: race.id,
      });

      const mentionsArr = [];
      for (const raceEntrant of raceEntrants) {
        const member = await ts.db.Members.query()
          .where({
            id: raceEntrant.member_id,
          })
          .first();

        mentionsArr.push(`<@${member.discord_id}>`);
      }

      if (ts.channels.raceChannel) {
        await ts.discord.send(
          ts.channels.raceChannel,
          await ts.message('race.raceEnded', {
            name: race.name,
            mentions: mentionsArr.join(', '),
            url_slug: this.url_slug,
          }),
        );
        await ts.discord.send(
          ts.channels.raceChannel,
          await ts.raceEmbed(race),
        );
      }

      race.status = 'finished';
      await ts.db.Races.query().where('id', race.id).update(race);
    };

    this.finishRace = async (args = {}) => {
      const { raceId, like } = args;
      const { discord_id } = args;

      if (!discord_id)
        ts.userError(await ts.message('error.noDiscordId'));

      const player = await ts.getUser(discord_id);

      const race = await ts.db.Races.query()
        .where({ id: raceId })
        .first();

      if (!race) {
        ts.userError(await ts.message('error.raceNotFound'));
      }

      const raceEntrants = await ts.db.RaceEntrants.query().where({
        race_id: raceId,
      });

      let maxRank = 0;
      for (const entrant of raceEntrants) {
        if (entrant.rank && entrant.rank > maxRank) {
          maxRank = entrant.rank;
        }
      }

      await ts.db.RaceEntrants.query()
        .where({
          race_id: raceId,
          member_id: player.id,
        })
        .update({
          finished_date: moment().format('YYYY-MM-DD HH:mm:ss'),
          rank: maxRank + 1,
        });

      if (race.level_id) {
        const level = await ts.db.Levels.query()
          .where({ id: race.level_id })
          .first();

        if (player.id !== level.creator) {
          await ts.clear({
            discord_id,
            code: level.code,
            completed: true,
            liked: like,
          });
        }
      }

      if (ts.channels.raceChannel) {
        await ts.discord.send(
          ts.channels.raceChannel,
          await ts.message('race.entrantFinishedRace', {
            name: race.name,
            discord_id: discord_id,
            rank: maxRank + 1,
          }),
        );
      }

      const unfinishedRaceEntrants = await ts.db.RaceEntrants.query().where(
        {
          race_id: race.id,
          finished_date: null,
        },
      );

      if (unfinishedRaceEntrants.length === 0) {
        await this.endRace(race);
      }

      return 'success';
    };
  }

  /**
   * Clean a channel name to remove any possible emote labels
   */
  getUnlabledName(str) {
    if (str == null) return false;
    return str
      .toUpperCase()
      .split(/[^0-9A-Z-]/g)
      .pop();
  }

  async fixModPing(code) {
    const fixVotes = await this.knex('members')
      .select('members.discord_id')
      .join('pending_votes', {
        'members.id': 'pending_votes.player',
      })
      .join('levels', {
        'levels.id': 'pending_votes.code',
      })
      .where('levels.code', code)
      .where('type', 'fix');

    if (fixVotes && fixVotes.length > 0) {
      const modPings = fixVotes.map((v) => `<@${v.discord_id}>`);
      return this.discord.send(
        code,
        `${modPings.join(
          ', ',
        )} please check if your fixes were made.`,
      );
    }
    return false;
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
          levels.status in (:SHOWN_IN_LIST:)
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

  async getLevelTags(levelId) {
    return this.knex('tags')
      .join('level_tags', { 'level_tags.tag_id': 'tags.id' })
      .where({ level_id: levelId });
  }

  async getShownTags() {
    return this.knex('tags')
      .select(
        knex.raw(
          `tags.*,regexp_replace(lower(name),'[^a-z0-9]','') tagComp,count(levels.id) num`,
        ),
      )
      .leftJoin('level_tags', {
        'level_tags.tag_id': 'tags.id',
      })
      .leftJoin('levels', {
        'levels.id': 'level_tags.level_id',
      })
      .where({ 'tags.guild_id': this.team.id })
      .whereIn('levels.status', this.SHOWN_IN_LIST)
      .groupBy('tags.id');
  }

  splitOnce(str) {
    const pos = str.search(/[ \n]/);
    if (pos === -1) return [str, ''];
    return [str.substr(0, pos).trim(), str.substr(pos + 1).trim()];
  }

  /**
   * Parses a message from discord and converts it to an array of words
   * @param {object} message
   * @returns {object} returns command
   */
  parseCommand(message) {
    let rawCommand = message.content.trim().substring(1).trim();
    const storedCommand = rawCommand;
    rawCommand = rawCommand.split(/[ \n]/);
    let [cmd, args] = this.splitOnce(storedCommand);
    cmd = cmd.toLowerCase();
    const sbCommand = rawCommand.shift().toLowerCase(); // remove first character
    if (!sbCommand) rawCommand.shift().toLowerCase();
    let filtered = [];
    filtered = rawCommand.filter((s) => s);
    const that = this;
    return {
      cmd,
      next: function () {
        if (!args) return false;
        const [first, second] = that.splitOnce(args);
        args = second;
        return first;
      },
      rest: function () {
        return args;
      },
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
    if (ret) {
      return ret;
    }
    return {};
  }

  /**
   * Checks if reason is larger than 1500 characters. throws a user error if it's more than than
   * @param {string} reason
   * @throws {UserError} Reason more than 1500 characters
   */
  reasonLengthCheck(reason, maxLength = 1500) {
    if (reason.length > maxLength)
      this.userError('error.reasonTooLong', { maxLength });
  }

  /**
   * get the language modifer
   */
  languageCode(language) {
    const synonymousLanguages = {
      lang: 'lang',
      fr: 'fr',
      french: 'fr',
      no: 'no',
      nor: 'no',
      norwegian: 'no',
      ko: 'ko',
      kr: 'ko',
      korean: 'ko',
      korea: 'ko',
      de: 'de',
      german: 'de',
      ger: 'de',
      es: 'es',
      spain: 'es',
      spanish: 'es',
      se: 'se',
      sweden: 'se',
      swedish: 'se',
      ru: 'ru',
      russian: 'ru',
      russia: 'ru',
    };

    const languageSelected =
      synonymousLanguages[language.toLowerCase()] || '';

    return languageSelected ? `${languageSelected}.` : '';
  }

  /**
   * Function to convert a tag to lowercase, and stripped of all special characters for comparison
   * @param {string} str tag to be tranformed
   * @returns {string}
   */
  transformTag(str) {
    return str.toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  async findTag(tag) {
    const existingTags = await this.getShownTags();
    if (existingTags.length === 0) this.userError('tags.notDefined');

    const foundTag = existingTags.find(function (t) {
      return t.tagComp === this.transformTag(tag);
    }, this);
    if (foundTag) return foundTag;
    const tagNames = existingTags.map((t) => t.tagComp);
    const match = stringSimilarity.findBestMatch(
      this.transformTag(tag),
      tagNames,
    );
    let suggestion = '';
    if (match.bestMatch && match.bestMatch.rating >= 0.6) {
      suggestion = await this.message('general.didYouMean', {
        info: existingTags.find(
          (t) => t.tagComp === match.bestMatch.target,
        ).name,
      });
    }

    return this.userError(
      `${await this.message('tag.notFound', { tag })}\n${suggestion}`,
    );
  }

  /**
   * Add tags to database if doesn't exist
   * @param {string|string[]} tags Can pass a comma seperated string or an array of strings
   * @param {knex} [trx] a transaction object
   * @param {string} [discordId]
   * @returns {string[]}  returns an array of tags
   */
  async addTags(pTags, trx = knex, discordId, insertTags = true) {
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
          if (
            discordId &&
            this.teamVariables.whitelistedTagsOnly === 'true' &&
            !(await this.modOnly(discordId))
          ) {
            this.userError('tags.whitelistedOnly', { tag: tags[i] });
          }
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
    if (newTags.length !== 0 && insertTags) {
      await trx('tags').insert(newTags);
    }

    return tags;
  }

  /**
   * checks and removes tags that are not being used, is not set by an admin, or has no type
   */
  async checkTagsForRemoval() {
    await this.knex.raw(
      `DELETE FROM tags WHERE ID in (select tags.id from tags
      left join level_tags on tags.id=tag_id
      left join levels on level_tags.level_id=levels.id
      where (admin_id is null or type is null or type='')
      and tags.guild_id=:guild_id
      group by tags.id
      having count(level_id)=0);`,
      { guild_id: this.team.id },
    );
  }

  /**
   * checks and removes tags that are not being used, is not set by an admin, or has no type
   */
  async levelRequiresVerifiedClears(level) {
    const rows = await this.knex.raw(
      `select COUNT(*) as count
      from level_tags lt
      left join tags t
      on lt.tag_id = t.id
      where lt.level_id = :level_id
      and lt.guild_id = :guild_id
      and t.verify_clears = 1;`,
      {
        level_id: level.id,
        guild_id: this.team.id,
      },
    );
    for (const row of rows) {
      if (row[0].count > 0) {
        return true;
      }
    }

    return false;
  }

  /**
   * Helper function to help secure data being send for updating/editing
   * @param {RowPacket[]} data Rows of data probably from the database. expects to contain an id and a guild_id
   * @returns {RowPacket[]} returns the same data but with signed values to verify id
   */
  secureData(data) {
    return data.map((pD) => {
      const d = { ...pD };
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
   * Function to get code either from the channel name or the first argument of the command
   * @param {Message} message A message object
   */
  getCodeArgument(message) {
    let inPendingDiscussionChannel = false;
    let inAuditDiscussionChannel = false;
    const command = this.parseCommand(message);
    // Check if in level discussion channel

    let code;
    if (
      this.validCode(this.discord.messageGetChannelName(message)) &&
      this.discord.messageGetParent(message) ===
        this.channels.levelDiscussionCategory
    ) {
      inPendingDiscussionChannel = true;
      code = this.getUnlabledName(
        this.discord.messageGetChannelName(message),
      );
    } else if (
      this.validCode(this.discord.messageGetChannelName(message)) &&
      this.discord.messageGetParent(message) ===
        this.channels.levelAuditCategory
    ) {
      inAuditDiscussionChannel = true;
      code = this.getUnlabledName(
        this.discord.messageGetChannelName(message),
      );
    } else {
      code = command.next();
    }

    if (code) {
      code = code.toUpperCase();
    } else {
      this.userError('error.noCode');
    }

    return {
      code,
      command,
      inPendingDiscussionChannel,
      inAuditDiscussionChannel,
    };
  }

  /**
   * Helper function to help verified secure data being recieved. Checks for id
   * @param {RowPacket[]} data Rows of data recieved from user. each row should contain SECURE_TOKEN created in secureData
   * @returns {RowPacket[]} returns the same data but removes SECURE_TOKEN after verifying it.
   * @throws {UserError} returns an error if the id in the row does not match the one in SECURE_TOKEN
   */
  verifyData(data) {
    return Promise.all(
      data.map(async (pD) => {
        const d = { ...pD };
        if (d.id) {
          if (!d.SECURE_TOKEN) {
            this.userError('error.wrongTokens');
          }
          try {
            const decoded = jwt.verify(
              d.SECURE_TOKEN,
              this.config.key,
            );
            if (Number(decoded.id) !== Number(d.id)) {
              this.userError(await this.message('error.wrongTokens'));
            }
          } catch (error) {
            debug(error);
            this.userError(await this.message('error.wrongTokens'));
          }
        } else {
          delete d.id;
          delete d.guild_id;
        }
        delete d.SECURE_TOKEN;
        return d;
      }),
    );
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
    if (TS.TS_LIST[guildId]) {
      console.log(
        'ALREADY EXISTING TS FOR GUILD ID ',
        guildId,
        ' OVERWRITTEN!',
      );
    }
    TS.TS_LIST[guildId] = new TS(guildId, client, gs);
    await TS.TS_LIST[guildId].load();
    return TS.TS_LIST[guildId];
  }

  /**
   * Get a TS object from a url_slug
   */
  static teamFromUrl(urlSlug) {
    return Object.values(TS.TS_LIST).find(
      (team) => team.config && team.url_slug === urlSlug,
    );
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

  /**
   * Get a team
   * @param {Snowflake} guildId
   */
  static addMessage(name, message) {
    for (const key of Object.keys(TS.TS_LIST)) {
      const ts = TS.TS_LIST[key];
      ts.messages[name] = ts.makeTemplate(message || '');
    }
  }
}
TS.defaultChannels = defaultChannels;
TS.TS_LIST = {};
TS.UserError = UserError;
TS.promisedCallback = () => {
  // do nothing
};
module.exports = TS;
