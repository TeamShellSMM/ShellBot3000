'use strict';

const debug = require('debug')('shellbot3000:webApi');
const debugError = require('debug')('shellbot3000:webApi.error');
const bodyParser = require('body-parser');
const compression = require('compression');
const moment = require('moment');
const express = require('express');
const deepEqual = require('deep-equal');
const knex = require('./db/knex');
const DiscordLog = require('./DiscordLog');
const TS = require('./TS');

module.exports = async function (client) {
  if (!client) throw new Error(`DiscordClient is not defined`);
  const app = express();
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(compression());

  async function generateSiteJson(args = {}) {
    const { ts, user, code, name, dashboard } = args;
    if (!ts) throw new Error(`TS not loaded buzzyS`);
    const competitionWinners = await ts
      .knex('competition_winners')
      .where({ guild_id: ts.team.id });

    const competitions = await ts
      .knex('competitions')
      .where({ guild_id: ts.team.id });

    for (const competition of competitions) {
      competition.competition_group = await ts
        .knex('competition_groups')
        .where({
          guild_id: ts.team.id,
          id: competition.competition_group_id,
        });
    }

    const tags = await ts.getShownTags();
    const seasons = await ts
      .knex('seasons')
      .where({ guild_id: ts.team.id });

    let filterSql = '';
    if (code) {
      filterSql = 'AND levels.code=:code';
    } else if (name) {
      filterSql = 'AND members.name=:name';
    }

    const registeredColumns =
      !dashboard && user
        ? `
    ,registered_plays.completed
    ,registered_plays.liked
    ,registered_plays.difficulty_vote
    `
        : `
    ,'-' completed
    ,'-' liked
    ,'-' difficulty_vote`;

    const registeredSql =
      !dashboard && user
        ? `
      LEFT JOIN plays registered_plays ON
        levels.guild_id=registered_plays.guild_id
        AND levels.id=registered_plays.code
        AND registered_plays.player=:player_id
    `
        : ``;

    const [levels] = await knex.raw(
      `
      SELECT
        levels.row_num no
        ,levels.id
        ,levels.id DR_RowId
        ,levels.code
        ,members.name creator
        ,members.id creator_id
        ,levels.level_name
        ,levels.status
        ,levels.difficulty
        ,COALESCE(group_concat(distinct tags.name order by tags.id),'') tags
        ,levels.videos
        ,levels.created_at
        ,levels.clears
        ,levels.likes
        ,levels.maker_points lcd
        ,concat(average_votes,',',num_votes) votestr
        ,levels.num_votes
        ,points.score
        ,members.maker_id
        ,levels.approves
        ,levels.rejects
        ,levels.want_fixes
        ${registeredColumns}
      FROM
        levels
      INNER JOIN teams on
        levels.guild_id=teams.id
      LEFT JOIN points on
        points.guild_id=teams.id
        AND points.difficulty=levels.difficulty
      INNER JOIN members on
        levels.creator=members.id and
        members.is_banned is null
      LEFT JOIN level_tags on
        levels.id=level_tags.level_id
      LEFT JOIN tags on
        level_tags.tag_id=tags.id
      ${registeredSql}
      WHERE
        levels.status IN (:statuses:)
        AND teams.guild_id=:guild_id
        ${filterSql}
      GROUP BY levels.id
      order by levels.id
    `,
      {
        guild_id: ts.guild_id,
        code,
        name,
        player_id: user ? user.id : -1,
        statuses: ts.SHOWN_IN_LIST,
      },
    );

    const seperate = tags
      .filter((t) => t.is_seperate)
      .map((t) => t.name);
    const json = {
      levels,
      seasons,
      competition_winners: competitionWinners,
      competitions: competitions,
      tags,
      seperate,
    };

    if (name) {
      const [makerDetails] = await knex.raw(
        `
      SELECT members.*,members.id creator_id
        ,sum(round(((likes*2+clears)*score*likes/clears),1)) maker_points
        FROM members
        LEFT JOIN (
          SELECT levels.guild_id
            ,levels.creator
            ,points.score
            ,sum(NULLIF(plays.completed,'')) clears
            ,sum(NULLIF(plays.liked,'')) likes
            ,round(avg(NULLIF(plays.difficulty_vote,'')),1) vote
            ,count(NULLIF(plays.difficulty_vote,'')) votetotal
          FROM
            levels
          LEFT JOIN plays ON
            levels.guild_id=plays.guild_id
            AND levels.id=plays.code
            AND levels.creator!=plays.player
            AND levels.status=1
          LEFT JOIN points ON
            levels.guild_id=points.guild_id
            AND levels.difficulty=points.difficulty
          WHERE
            levels.guild_id=:guild_id
            AND levels.status = :status
          GROUP BY levels.id
        ) a ON
          members.guild_id=a.guild_id
          AND members.id=a.creator
        WHERE members.name=:name
        AND members.guild_id=:guild_id
        AND members.is_banned is null
      `,
        {
          guild_id: ts.team.id,
          name,
          status: ts.LEVEL_STATUS.APPROVED,
        },
      );
      if (makerDetails) {
        json.maker = makerDetails;
        if (json.maker.length > 0) {
          const [maker] = json.maker;
          json.maker = maker;

          const makerMember = ts.discord.getMember(maker.discord_id);
          if (makerMember) {
            json.maker.hexColor = makerMember.displayHexColor;
            if (makerMember.user.avatarURL) {
              json.maker.avatarURL = makerMember.user.avatarURL.replace(
                /size=.*/g,
                'size=128',
              );
            }
          }

          delete json.maker.discord_id;
          delete json.maker.guild_id;
          json.plays = await ts
            .getPlays()
            .where('player', json.maker.id);
        }
      }
    }

    if (dashboard) {
      const [memberStats] = await knex.raw(
        `
        SELECT sum(members.is_member) official
          ,count(members.id)-sum(members.is_member) unoffocial
          ,sum(members.is_mod) mods
        FROM members
        where guild_id=:guild_id AND members.is_banned is null
      `,
        { guild_id: ts.team.id },
      );
      json.dashboard = {
        members: memberStats[0],
      };
    }

    if (code && levels && levels[0]) {
      json.plays = await ts
        .getPlays()
        .where('levels.id', levels[0].id);
      if (
        user &&
        user.is_mod
        // &&
        // [ts.LEVEL_STATUS.PENDING, ts.LEVEL_STATUS.NEED_FIX].includes(
        //  levels[0].status,
        // )
      ) {
        json.pending_comments = await ts
          .getPendingVotes()
          .where('levels.id', levels[0].id);
      }
    }

    return json;
  }

  async function generateMembersJson(ts, data) {
    let { membershipStatus, timePeriod, timePeriod2 } = data;
    membershipStatus = parseInt(membershipStatus, 10);
    timePeriod = timePeriod ? parseInt(timePeriod, 10) : 1;
    timePeriod2 = timePeriod2 ? parseInt(timePeriod2, 10) : 1;

    const competitionWinners = await ts
      .knex('competition_winners')
      .where({ guild_id: ts.team.id });

    let memberFilterSql = '';
    if (membershipStatus === 1) {
      memberFilterSql = 'AND is_member=1';
    } else if (membershipStatus === 2) {
      memberFilterSql = 'AND is_mod=1';
    } else if (membershipStatus === 4) {
      memberFilterSql = 'AND (is_member=0 or is_member is null)';
    }

    const json = {};
    if (timePeriod === 1 && timePeriod2 === 1) {
      const [rows] = await ts.knex.raw(
        `SELECT
          ROW_NUMBER() OVER ( ORDER BY clear_score_sum desc ) as id,
          members.name,
          members.id member_id,
          members.maker_id,
          clear_score_sum,
          levels_created,
          levels_cleared
          from members
          where members.guild_id=:guild_id ${memberFilterSql}
          AND members.is_banned is null
          group by members.id
          order by clear_score_sum desc
        `,
        {
          guild_id: ts.team.id,
        },
      );
      json.data = rows;
    } else {
      let levelFilter = '';
      if (timePeriod === 2) {
        levelFilter =
          "AND DATE_FORMAT(levels.created_at,'%m-%Y') = DATE_FORMAT(CURRENT_TIMESTAMP,'%m-%Y')";
      } else if (timePeriod === 3) {
        levelFilter =
          "AND DATE_FORMAT(levels.created_at,'%u-%Y') = DATE_FORMAT(CURRENT_TIMESTAMP,'%u-%Y')";
      } else if (timePeriod === 4) {
        levelFilter =
          "AND DATE_FORMAT(levels.created_at,'%j-%Y') = DATE_FORMAT(CURRENT_TIMESTAMP,'%j-%Y')";
      }

      let playsFilter = '';
      if (timePeriod2 === 2) {
        playsFilter =
          "AND DATE_FORMAT(plays.created_at,'%m-%Y') = DATE_FORMAT(CURRENT_TIMESTAMP,'%m-%Y')";
      } else if (timePeriod2 === 3) {
        playsFilter =
          "AND DATE_FORMAT(plays.created_at,'%u-%Y') = DATE_FORMAT(CURRENT_TIMESTAMP,'%u-%Y')";
      } else if (timePeriod2 === 4) {
        playsFilter =
          "AND DATE_FORMAT(plays.created_at,'%j-%Y') = DATE_FORMAT(CURRENT_TIMESTAMP,'%j-%Y')";
      }

      const [rows] = await ts.knex.raw(
        `select
              ROW_NUMBER() OVER ( ORDER BY clear_score_sum desc ) as id,
              members.name,
              maker_id,
              members.id member_id,
              calculated_levels_created levels_created,
              COALESCE(total_score,0)+if(:include_own_score,COALESCE(own_levels.own_score,0),0) clear_score_sum,
              COALESCE(total_cleared,0) levels_cleared
              from members LEFT JOIN (
                SELECT
                  plays.guild_id,
                  plays.player,
                  sum(points.score) total_score,
                  count(distinct plays.id) total_cleared from plays
                INNER JOIN levels ON
                  levels.id=plays.code
                  AND levels.guild_id=plays.guild_id
                LEFT JOIN points ON
                  levels.difficulty=points.difficulty
                  AND points.guild_id=levels.guild_id
                WHERE
                  levels.status in (:SHOWN_IN_LIST:)
                    AND plays.completed=1
                    AND levels.guild_id=:guild_id
                    ${levelFilter}
                    ${playsFilter}
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
                  ${levelFilter}
                GROUP BY creator,levels.guild_id
              ) own_levels ON
                  members.guild_id=own_levels.guild_id
                  AND members.id=own_levels.creator
              where members.guild_id=:guild_id ${memberFilterSql}
              order by total_score desc`,
        {
          guild_id: ts.team.id,
          SHOWN_IN_LIST: knex.raw(ts.SHOWN_IN_LIST),
          include_own_score:
            ts.teamVariables.includeOwnPoints === 'true' || false,
        },
      );
      json.data = rows;
    }

    json.competition_winners = competitionWinners;
    return json;
  }

  async function generateMakersJson(ts, data) {
    let { membershipStatus, season } = data;
    membershipStatus = parseInt(membershipStatus, 10);
    const competitionWinners = await ts
      .knex('competition_winners')
      .where({ guild_id: ts.team.id });

    const seasons = await ts
      .knex('seasons')
      .where({ guild_id: ts.team.id })
      .orderBy('start_date');

    let endDate = '2038-01-19 03:14:08';
    for (let i = seasons.length - 1; i >= 0; i -= 1) {
      seasons[i].end_date = endDate;
      endDate = seasons[i].start_date;
    }
    season = season || seasons.length;

    const currentSeason = seasons.length ? seasons[season - 1] : {};
    let membersSQL = '';
    if (membershipStatus === 1) {
      membersSQL = `AND members.is_member=1`;
    } else if (membershipStatus === 2) {
      membersSQL = `AND members.is_mod=1`;
    } else if (membershipStatus === 4) {
      membersSQL = `AND members.is_member!=1`;
    }

    const [json] = await knex.raw(
      `SELECT
    row_number() over ( order by sum(maker_points)) id
      ,name
      ,creator_id
	    ,code
      ,COUNT(*) as levels_created
      ,sum(clears) clears
      ,sum(likes) likes
      ,AVG(clear_like_ratio) as clear_like_ratio
      ,SUM(maker_points) as maker_points
    FROM (
           SELECT members.name
          ,members.id creator_id
          ,levels.code
          ,levels.clears
          ,levels.likes
          ,levels.clear_like_ratio
          ,levels.maker_points
      FROM members
      INNER JOIN teams ON
        members.guild_id=teams.id
      LEFT JOIN levels ON
          levels.creator = members.id
      WHERE levels.status IN (0,1)
          AND levels.created_at between :from_season AND :to_season
          AND teams.guild_id = :guild_id
          ${membersSQL}
      group by levels.code) a
      group by name
      order by maker_points desc`,
      {
        from_season: currentSeason.start_date || '0000-00-00',
        to_season: currentSeason.end_date || '3000-01-01',
        guild_id: ts.guild_id,
      },
    );

    return {
      data: json,
      seasons,
      competition_winners: competitionWinners,
    };
  }

  async function generateRacesJson(ts, data, user) {
    const { currentTimeMillis, mode } = data;

    const serverTimeOffset = moment().valueOf() - currentTimeMillis;

    let stati = [];
    let officialStates = [];
    if (mode === 'current') {
      stati = ['upcoming', 'active'];
      officialStates = [0];
    } else if (mode === 'unofficial') {
      stati = ['upcoming', 'active'];
      officialStates = [1];
    } else {
      stati = ['finished'];
      officialStates = [1, 2];
    }

    const [json] = await knex.raw(
      `select
        races.id,
        races.name,
        races.status,
        races.start_date,
        races.end_date,
        races.race_type,
        races.level_type,
        races.level_filter_diff_from,
        races.level_filter_diff_to,
        races.level_filter_submission_time_type,
        races.level_filter_failed,
        races.unofficial,
        races.level_status_type,
        races.weighting_type,
        races.clear_score_from,
        races.clear_score_to,
        race_creators.id as race_creator_id,
        race_creators.name as race_creator_name,
        race_creators.discord_id as race_creator_discord_id,
        tags.id as tag_id,
        tags.name as tag_name,
        tags.type as tag_type,
        races.level_id as level_id,
        levels.code as level_code,
        levels.difficulty as level_difficulty,
        levels.level_name as level_name,
        creators.id as creator_id,
        creators.name as creator_name,
        race_entrants.id as race_entrant_id,
        race_entrants.finished_date as race_entrant_finished_date,
        race_entrants.rank as race_entrant_rank,
        race_members.id as race_member_id,
        race_members.name as race_member_name,
        race_members.discord_id as race_member_discord_id
      from
        races
        left join members race_creators on races.creator_id = race_creators.id
        left join tags on races.level_filter_tag_id = tags.id
        left join levels on races.level_id = levels.id
        left join members creators on levels.creator = creators.id
        left join race_entrants on races.id = race_entrants.race_id
        left join members race_members on race_entrants.member_id = race_members.id
      where
        races.guild_id = :guild_id AND
        races.status in (:stati) AND
        races.unofficial in (:unofficial_states) AND
        (tags.is_hidden = 0 or tags.is_hidden is null)
      order by races.start_date ${
        mode === 'current' ? 'asc' : 'desc'
      }`,
      {
        guild_id: ts.team.id,
        stati: stati,
        unofficial_states: officialStates,
      },
    );

    const raceData = {};

    for (const row of json) {
      if (!raceData[row.id]) {
        raceData[row.id] = {
          id: row.id,
          name: row.name,
          status: row.status,
          start_date: row.start_date,
          end_date: row.end_date,
          race_type: row.race_type,
          level_type: row.level_type,
          level_filter_diff_from: row.level_filter_diff_from,
          level_filter_diff_to: row.level_filter_diff_to,
          level_filter_submission_time_type:
            row.level_filter_submission_time_type,
          level_filter_failed: row.level_filter_failed,
          unofficial: row.unofficial,
          level_status_type: row.level_status_type,
          weighting_type: row.weighting_type,
          clear_score_from: row.clear_score_from,
          clear_score_to: row.clear_score_to,
          race_entrants: {},
        };

        if (row.race_creator_id) {
          raceData[row.id].creator = {
            id: row.race_creator_id,
            name: row.race_creator_name,
            discord_id: row.race_creator_discord_id,
          };
        }

        if (row.tag_id) {
          raceData[row.id].level_filter_tag = {
            id: row.tag_id,
            name: row.tag_name,
            type: row.tag_type,
          };
        }

        if (row.level_id) {
          raceData[row.id].level = {
            id: row.level_id,
            code: row.level_code,
            difficulty: row.level_difficulty,
            level_name: row.level_name,
          };

          if (row.creator_id) {
            raceData[row.id].level.creator = {
              id: row.creator_id,
              name: row.creator_name,
            };
          }
        }
      }

      if (row.race_entrant_id) {
        if (!raceData[row.id][row.race_entrant_id]) {
          raceData[row.id].race_entrants[row.race_entrant_id] = {
            id: row.race_entrant_id,
            finished_date: row.race_entrant_finished_date,
            rank: row.race_entrant_rank,
          };

          if (row.race_member_id) {
            raceData[row.id].race_entrants[
              row.race_entrant_id
            ].member = {
              id: row.race_member_id,
              name: row.race_member_name,
            };

            const raceMember = ts.discord.getMember(
              row.race_member_discord_id,
            );
            if (raceMember) {
              raceData[row.id].race_entrants[
                row.race_entrant_id
              ].member.hexColor = raceMember.displayHexColor;
              if (raceMember.user.avatarURL) {
                raceData[row.id].race_entrants[
                  row.race_entrant_id
                ].member.avatarURL = raceMember.user.avatarURL.replace(
                  /size=.*/g,
                  'size=128',
                );
              }
            }
          }
        }
      }
    }

    const races = {
      active: [],
      upcoming: [],
      finished: [],
    };

    Object.keys(raceData).forEach((id) => {
      const race = raceData[id];
      if (
        race.level &&
        race.status === 'upcoming' &&
        (!user || !user.is_mod)
      ) {
        delete race.level;
      }

      const raceEntrants = [];
      Object.keys(race.race_entrants).forEach((reKey) => {
        const raceEntrant = race.race_entrants[reKey];
        raceEntrants.push(raceEntrant);
      });

      raceEntrants.sort(function (a, b) {
        if (a && b) {
          return a.rank - b.rank;
        }
        if (!a) {
          return -1;
        }
        if (!b) {
          return 1;
        }
        return 0;
      });

      race.race_entrants = raceEntrants;

      races[race.status].push(race);
    });

    races.active.sort(function (a, b) {
      return a.start_date.getTime() - b.start_date.getTime();
    });

    races.upcoming.sort(function (a, b) {
      return a.start_date.getTime() - b.start_date.getTime();
    });

    races.finished.sort(function (a, b) {
      return b.start_date.getTime() - a.start_date.getTime();
    });

    const tags = await ts.db.Tags.query();

    const whitelistedKeys = ['id', 'name', 'type'];

    for (const tag of tags) {
      Object.keys(tag).forEach(
        (key) => whitelistedKeys.includes(key) || delete tag[key],
      );
    }

    return {
      data: races,
      tags: tags,
      serverTimeOffset: serverTimeOffset,
    };
  }

  const adminChecks = Object.freeze({
    admin: 'teamAdmin',
    mod: 'modOnly',
  });

  const webTS = (callback, requirePermission = false) => {
    return async (req, res) => {
      res.setHeader(
        'Content-Type',
        'application/json; charset=utf-8',
      );
      let ts;
      debug(req.body);
      if (req.body && req.body.url_slug) {
        try {
          ts = TS.teamFromUrl(req.body.url_slug);
          if (!ts) {
            throw new Error(`"${req.body.url_slug}" not found`);
          } else {
            if (req.body && req.body.token) {
              req.body.discord_id = await ts.checkBearerToken(
                req.body.token,
              );
              req.user = await ts.getUser(req.body.discord_id);
              if (
                adminChecks[requirePermission] &&
                !(await ts[adminChecks[requirePermission]](
                  req.body.discord_id,
                ))
              ) {
                ts.userError('website.forbidden');
              }
            } else if (requirePermission) {
              ts.userError('website.noToken');
            }
            const data = await callback(ts, req, res);
            data.url_slug = ts.url_slug;
            if (ts.teamAdmin(req.body.discord_id)) {
              data.teamAdmin = true;
            }
            if (await ts.raceCreator(req.body.discord_id)) {
              data.raceCreator = true;
            }
            data.teamSettings = await ts.getSettings('settings');
            res.send(JSON.stringify(data));
          }
        } catch (error) {
          if (ts) {
            res.send(ts.getWebUserErrorMsg(error));
            debugError(error);
          } else {
            DiscordLog.error(error);
            debugError(error);
            res.send(
              JSON.stringify({
                status: 'error',
                message: error.toString(),
              }),
            );
          }
        }
      } else {
        debugError('api.noslug');
        res.send(
          JSON.stringify({
            status: 'error',
            message: TS.message('api.noslug'),
          }),
        );
      }
    };
  };

  async function generateWorldsJson(ts, isShellder, data) {
    let { membershipStatus } = data;
    membershipStatus = parseInt(membershipStatus, 10);
    const competitionWinners = await ts
      .knex('competition_winners')
      .where({ guild_id: ts.team.id });
    let members = [];

    if (membershipStatus === 1) {
      members = await ts.db.Members.query()
        .select()
        .where('is_member', 1)
        .where('world_level_count', '>', 0);
    } else if (membershipStatus === 2) {
      members = await ts.db.Members.query()
        .select()
        .where('world_level_count', '>', 0);
      members = members.filter((member) => member.is_mod);
    } else if (membershipStatus === 4) {
      members = await ts.db.Members.query()
        .select()
        .where('world_level_count', '>', 0)
        .where(function () {
          this.where('is_member', 0).orWhere('is_member', null);
        });
    } else {
      members = await ts.db.Members.query()
        .select()
        .where('world_level_count', '>', 0);
    }

    const json = [];

    let memberCounter = 1;
    for (const member of members) {
      const comps = [];
      for (const comp of competitionWinners) {
        if (comp.creator === member.id) {
          comps.push({
            name: comp.details,
            rank: comp.rank,
          });
        }
      }

      json.push({
        id: (memberCounter += 1),
        wonComps: comps,
        name: member.name,
        creator_id: member.name,
        maker_id: member.maker_id,
        maker_name: member.maker_name,
        world_name: member.world_description,
        world_world_count: member.world_world_count,
        world_level_count: member.world_level_count,
      });
    }

    return { data: json };
  }

  app.post(
    '/json/worlds',
    webTS(async (ts, req) => {
      const json = await generateWorldsJson(
        ts,
        req.user && req.user.is_mod,
        req.body,
      );
      return json;
    }),
  );

  /* TODO: get teams info from team_settings and teams table
  app.post('/teams', async (req, res) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    try {
      const teams = await Teams.query()
        .select('guild_name', 'url_slug', 'web_config')
        .where({ public: 1 });
      res.send(JSON.stringify(data));
    } catch (error) {
      const ret = { error: error.stack };
      DiscordLog.error(ret);
      res.send('Something went wrong');
    }
  }); */

  app.post(
    '/teams/settings',
    webTS(async (ts) => {
      const settings = await ts.getSettings('settings');
      const ret = [];
      for (let i = 0; i < ts.defaultVariables.length; i += 1) {
        let value =
          settings[ts.defaultVariables[i].name] ||
          ts.defaultVariables[i].default;
        if (ts.defaultVariables[i].type === 'boolean') {
          value = value === 'true';
        } else if (ts.defaultVariables[i].type === 'number') {
          value = Number(value);
        }
        ret.push({
          ...ts.defaultVariables[i],
          value,
        });
      }
      return { settings: ret };
    }, 'admin'),
  );

  app.post(
    '/teams/tags',
    webTS(async (ts) => {
      const data = await ts
        .knex('tags')
        .select(
          'tags.id',
          'tags.name',
          'tags.synonymous_to',
          'tags.type',
          'tags.color',
          'tags.is_seperate',
          'tags.add_lock',
          'tags.remove_lock',
          'tags.is_hidden',
          'tags.verify_clears',
        )
        .where({ guild_id: ts.team.id });
      return { data: ts.secureData(data) };
    }, 'admin'),
  );

  app.put(
    '/teams/tags',
    webTS(async (ts, req) => {
      if (!req.body.data) ts.userError('website.noDataSent');
      const data = ts.verifyData(req.body.data);

      let updated = false;
      await ts.knex.transaction(async (trx) => {
        const existingTags = await trx('tags')
          .select(
            'id',
            'name',
            'synonymous_to',
            'type',
            'color',
            'is_seperate',
            'add_lock',
            'remove_lock',
            'is_hidden',
            'verify_clears',
          )
          .where({ guild_id: ts.team.id });

        // TODO:test this
        // TODO:tags transformation
        data.forEach((d) => {
          if (
            existingTags.find(
              (e) =>
                d.name === e.name && Number(d.id) !== Number(e.id),
            )
          ) {
            ts.userError('tags.duplicateTags', { tag: d.name });
          }
        });

        for (let i = 0; i < data.length; i += 1) {
          const currentID = data[i].id;
          const newData = {
            id: data[i].id ? Number(data[i].id) : null,
            name: data[i].name,
            synonymous_to: data[i].synonymous_to,
            type: data[i].type,
            color: data[i].color,
            is_seperate: ['true', '1', 1, true].includes(
              data[i].is_seperate,
            )
              ? 1
              : 0,
            add_lock: ['true', '1', 1, true].includes(
              data[i].add_lock,
            )
              ? 1
              : 0,
            remove_lock: ['true', '1', 1, true].includes(
              data[i].remove_lock,
            )
              ? 1
              : 0,
            is_hidden: ['true', '1', 1, true].includes(
              data[i].is_hidden,
            )
              ? 1
              : 0,
            verify_clears: ['true', '1', 1, true].includes(
              data[i].verify_clears,
            )
              ? 1
              : 0,
          };
          if (currentID) {
            const existing = existingTags.find(
              (t) => Number(t.id) === Number(currentID),
            );
            if (!existing) ts.userError('error.hadIdButNotInDb');
            if (!deepEqual(newData, existing)) {
              newData.updated_at = moment().format(
                'YYYY-MM-DD HH:mm:ss',
              );
              newData.admin_id = req.user.id;
              await trx('tags')
                .update(newData)
                .where({ id: newData.id });
              updated = true;
            }
          } else {
            delete data[i].id;
            newData.guild_id = ts.team.id;
            newData.admin_id = req.user.id;
            await trx('tags').insert(newData);
            updated = true;
          }
        }
        return trx;
      });
      return { data: updated ? 'tags updated' : 'No tags updated' };
    }, 'admin'),
  );

  app.put(
    '/teams/settings',
    webTS(async (ts, req) => {
      const varName = ts.defaultVariables.map((v) => v.name);
      await knex.transaction(async (trx) => {
        for (const row of req.body.data) {
          if (varName.includes(row.name)) {
            const existing = await trx('team_settings')
              .where({ guild_id: ts.team.id })
              .where({ type: 'settings' })
              .where({ name: row.name })
              .first();
            if (existing) {
              debug(`put /team/settings/ ${row.name} existing`);
              if (existing.value !== row.value) {
                await trx('team_settings')
                  .update({ value: row.value, admin_id: req.user.id })
                  .where({ guild_id: ts.team.id })
                  .where({ type: 'settings' })
                  .where({ name: row.name });
              }
            } else {
              debug(`put /team/settings/ ${row.name} not existing`);
              await trx('team_settings').insert({
                guild_id: ts.team.id,
                admin_id: req.user.id,
                name: row.name,
                value: row.value,
                type: 'settings',
              });
            }
          }
        }
      });
      await ts.load();
      return { status: 'successful' };
    }, 'admin'),
  );

  app.post(
    '/json',
    webTS(async (ts, req) => {
      const json = await generateSiteJson({
        ts,
        user: req.user,
        ...req.body,
      });
      return json;
    }),
  );

  app.post(
    '/json/members',
    webTS(async (ts, req) => {
      const json = await generateMembersJson(ts, req.body);
      return json;
    }),
  );

  app.post(
    '/json/makers',
    webTS(async (ts, req) => {
      const json = await generateMakersJson(ts, req.body);
      return json;
    }),
  );

  app.post(
    '/json/races',
    webTS(async (ts, req) => {
      const json = await generateRacesJson(ts, req.body, req.user);
      return json;
    }),
  );

  app.post(
    '/clear',
    webTS(async (ts, req) => {
      const msg = await ts.clear({
        ...req.body,
        playerDontAtMe: true,
      });
      await ts.discord.send(ts.channels.commandFeed, msg);
      const json = { status: 'successful', msg: msg };
      return json;
    }, true),
  );

  app.post(
    '/race',
    webTS(async (ts, req) => {
      const msg = await ts.addRace({
        ...req.body,
      });

      const json = { status: 'successful', msg: msg };
      return json;
    }, true),
  );

  app.patch(
    '/race',
    webTS(async (ts, req) => {
      const msg = await ts.editRace({
        ...req.body,
      });

      const json = { status: 'successful', msg: msg };
      return json;
    }, true),
  );

  app.post(
    '/race/enter',
    webTS(async (ts, req) => {
      const msg = await ts.enterRace({
        ...req.body,
      });

      const json = { status: 'successful', msg: msg };
      return json;
    }, true),
  );

  app.post(
    '/race/leave',
    webTS(async (ts, req) => {
      const msg = await ts.leaveRace({
        ...req.body,
      });

      const json = { status: 'successful', msg: msg };
      return json;
    }, true),
  );

  app.post(
    '/race/finish',
    webTS(async (ts, req) => {
      const msg = await ts.finishRace({
        ...req.body,
      });

      const json = { status: 'successful', msg: msg };
      return json;
    }, true),
  );

  app.post(
    '/approve',
    webTS(async (ts, req) => {
      const msg = await ts.approve(req.body);

      if (req.body.completed || req.body.liked) {
        const clearmsg = await ts.clear(req.body);
        await ts.discord.send(ts.channels.commandFeed, clearmsg);
      }

      return { status: 'successful', msg: msg };
    }, 'mod'),
  );

  app.post(
    '/random',
    webTS(async (ts, req) => {
      const rand = await ts.randomLevel(req.body);
      rand.status = 'successful';
      return rand;
    }),
  );

  app.post(
    '/feedback',
    webTS(async (ts, req) => {
      if (req.body.message == null)
        ts.userError(ts.message('feedback.noMessage'));
      if (req.body.message.length > 1000)
        ts.userError(ts.message('feedback.tooLong'));

      const ip =
        req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress;
      const discordId = req.body.discord_id;
      await ts.putFeedback(
        ip,
        discordId,
        ts.config.feedback_salt,
        req.body.message,
      );
      return { status: 'successful' };
    }, true),
  );

  app.post(
    '/json/login',
    webTS(async (ts, req) => {
      let returnObj = {};
      if (!req.body.otp) ts.userError('login.noOTP');

      const token = await ts.db.Tokens.query()
        .where('token', '=', req.body.otp)
        .first();
      if (token) {
        const tokenExpireAt = moment(token.created_at)
          .add(30, 'm')
          .valueOf();
        const now = moment().valueOf();
        if (tokenExpireAt < now) ts.userError('login.expiredOTP');
        const user = await ts.getUser(token.discord_id);
        const bearer = await ts.login(token.discord_id, token.id);
        returnObj = {
          status: 'logged_in',
          type: 'bearer',
          discord_id: user.discord_id,
          token: bearer,
          user_info: user,
        };
      } else {
        ts.userError('login.invalidToken');
      }

      return returnObj;
    }),
  );

  return app;
};
