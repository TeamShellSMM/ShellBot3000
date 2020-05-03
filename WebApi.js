'use strict'
const bodyParser = require('body-parser');
const compression = require('compression');
const Teams=require('./models/Teams');
const moment = require('moment');
const knex = require('./db/knex');
const express=require('express');
const DiscordLog = require('./DiscordLog');
const TS=require('./TS');


module.exports = async function(config,client){
  const app = express();
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(compression())
  if(config.json_dev){
    app.use("/dev", express.static(__dirname + '/json_dev.html'));
  }

  async function generateSiteJson({ ts, user , code , name , dashboard }){
    if(!ts) throw `TS not loaded buzzyS`;
    const SheetCache = ts.gs.getArrayFormat(["Competition Winners"])

    let competition_winners = SheetCache["Competition Winners"];
    competition_winners.shift()
    let _tags = ts.gs.select("tags");
    let _seasons = ts.gs.select("Seasons")

    let filterSql=''
    if(code){
      filterSql= 'AND levels.code=:code';
    } else if(name){
      filterSql= 'AND members.name=:name';
    }

    let registeredColumns=(!dashboard && user)?`
    ,registered_plays.completed
    ,registered_plays.liked
    ,registered_plays.difficulty_vote
    `:`
    ,'-' completed
    ,'-' liked
    ,'-' difficulty_vote`;

    let registeredSql=(!dashboard && user)?`
      LEFT JOIN plays registered_plays ON
        levels.guild_id=registered_plays.guild_id
        AND levels.id=registered_plays.code
        AND registered_plays.player=:player_id
    `:``

    let [ levels, fields ]= await knex.raw(`
      SELECT *
      ,ROW_NUMBER() OVER ( ORDER BY id ) as no
      ,round(((likes*2+clears)*score*likes/clears),1) lcd
      ,concat(vote,',',votetotal) votestr
      FROM
      (SELECT levels.id
        ,levels.code
        ,levels.creator
        ,levels.level_name
        ,levels.status
        ,levels.difficulty
        ,levels.tags
        ,levels.videos
        ,levels.created_at
        ,points.score
        ,sum(NULLIF(plays.completed,'')) clears
        ,sum(NULLIF(plays.liked,'')) likes
        ,round(avg(NULLIF(plays.difficulty_vote,'')),1) vote
        ,count(NULLIF(plays.difficulty_vote,'')) votetotal
        ,members.maker_id
        ,sum(CASE WHEN pending_votes.type='approve' THEN 1 ELSE 0 END) approves
        ,sum(CASE WHEN pending_votes.type='reject' THEN 1 ELSE 0 END) rejects
        ,sum(CASE WHEN pending_votes.type='fix' THEN 1 ELSE 0 END) want_fixes
        ${registeredColumns}
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
      LEfT JOIN pending_votes ON
        levels.guild_id=pending_votes.guild_id
        AND levels.id=pending_votes.code
        AND levels.status=0
      ${registeredSql}
      WHERE 
        levels.status IN (:statuses:)
        AND teams.guild_id=:guild_id
        ${filterSql}
      GROUP BY levels.id) a
    `, { 
      guild_id:ts.guild_id,
      code,
      name,
      player_id: user ? user.id : null,
      statuses: [
      ts.LEVEL_STATUS.PENDING,
      ts.LEVEL_STATUS.APPROVED,
      ts.LEVEL_STATUS.NEED_FIX,
    ] })
    
    let tags={}
    let seperate=[]
    for(let i=0;i<_tags.length;i++){
      if(_tags[i].Seperate=='1'){
        seperate.push(_tags[i].Tag)
      }
      tags[_tags[i].Tag]=_tags[i].Type
    }

    let seasons=[]
    for(let i=0;i<_seasons.length;i++){
      seasons.push({
        name:_seasons[i].Name,
        startdate:_seasons[i].StartDate
      })
    }

    let json={
      //"lastUpdated":ts.gs.lastUpdated,
      levels,
      seasons,
      competition_winners,
      tags,
      seperate,
    };

    if(name){
      json.maker=await knex.raw(`
      SELECT members.*
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
            AND levels.code=plays.code
            AND levels.creator!=plays.player
            AND levels.status=1
          LEFT JOIN points ON
            levels.guild_id=points.guild_id
            AND levels.difficulty=points.difficulty
          WHERE 
            levels.guild_id=:guild_id
            AND levels.status = :status
            AND levels.creator = :name
          GROUP BY levels.id
        ) a ON
          members.guild_id=a.guild_id
          AND members.name=a.creator
        WHERE members.name=:name 
        AND members.guild_id=:guild_id
      `, { 
        guild_id:ts.guild_id,
        name,
        status:ts.LEVEL_STATUS.APPROVED 
      })
      json.maker=json.maker[0]
      if(json.maker.length>0){
        json.maker=json.maker[0]
        delete json.maker.discord_id
        delete json.maker.guild_id
      }
    }

    if(dashboard){
      json.dashboard={
        members:await knex.raw(`
        SELECT sum(members.is_member) official
          ,count(members.id)-sum(members.is_member) unoffocial
          ,sum(members.is_mod) mods
        FROM members
        where guild_id=:guild_id
      `, { guild_id:ts.guild_id }),
      }
      json.dashboard.members=json.dashboard.members[0]
    }

    if(code && levels[0]){
      json.plays=await ts.db.Plays.query().where({ code })
      if(user && user.is_mod && json.level.status==ts.LEVEL_STATUS.PENDING){
        json.pending_comments=await ts.db.PendingVotes.query().where({ code })
      }
    }

    return json;
  }

  async function generateMembersJson(ts,isShellder, data){
    const SheetCache = ts.gs.getArrayFormat([
        "Seasons!B",
        "tags",
        "Competition Winners",
        "Points!B"
      ])

    let competition_winners = SheetCache["Competition Winners"];
    competition_winners.shift();

    let members = [];

    if(data.membershipStatus == '1'){
      members = await ts.db.Members.query().select().where("is_member", 1).orderBy("clear_score_sum", "desc");
    } else if(data.membershipStatus == '2'){
      members = await ts.db.Members.query().select().orderBy("clear_score_sum", "desc");
      members = members.filter(member => ts.is_mod(member));
    } else if(data.membershipStatus == '4'){
      members = await ts.db.Members.query().select().where("is_member", 0).orWhere("is_member", null).orderBy("clear_score_sum", "desc");
    } else {
      members = await ts.db.Members.query().select().orderBy("clear_score_sum", "desc");
    }

    let json = [];

    if(data.timePeriod == '1' && data.timePeriod2 == '1'){
      let memberCounter = 1;
      for(let member of members){
        let comps = [];
        for(let comp of competition_winners){
          if(comp[1] === member.name){
            comps.push({
              name: comp[2],
              rank: comp[3]
            })
          }
        }

        let memberObj = {
          "id": memberCounter,
          "name": member.name,
          "wonComps": comps,
          "levels_created": member.levels_created,
          "levels_cleared": member.levels_cleared,
          "clear_score_sum": member.clear_score_sum
        }
        json.push(memberObj);

        memberCounter++;
      }

      return json;
    } else {
      let membersObj = {};

      let memberNames = Array.from(members, x => x.name);

      for(let memName of memberNames){
        membersObj[memName] = {
          "name": memName,
          "levels_created": 0,
          "levels_cleared": 0,
          "clear_score_sum": 0.0,
          "wonComps": []
        };
      }

      let lCountQueryBuilder = ts.db.Levels.query().whereIn('creator',memberNames);
      if (data.timePeriod == '2') {
        lCountQueryBuilder = lCountQueryBuilder.whereRaw("strftime('%m-%Y', created_at) = strftime('%m-%Y', CURRENT_TIMESTAMP)")
      } else if (data.timePeriod == '3') {
        lCountQueryBuilder = lCountQueryBuilder.whereRaw("strftime('%W-%Y', created_at) = strftime('%W-%Y', CURRENT_TIMESTAMP)");
      } else if (data.timePeriod == '4') {
        lCountQueryBuilder = lCountQueryBuilder.whereRaw("strftime('%j-%Y', created_at) = strftime('%j-%Y', CURRENT_TIMESTAMP)");
      }
      let lCountResult = await lCountQueryBuilder.groupBy('creator').select('creator').count('id as count_created');

      for(let row of lCountResult){
        membersObj[row.creator]["levels_created"] = row.count_created;
      }

      let cCountQueryBuilder = ts.db.Plays.query().join('levels', function() {
        this.on('plays.code', '=', 'levels.code').on('plays.guild_id', '=', 'levels.guild_id')
      }).join('points', function() {
        this.on('levels.difficulty', '=', 'points.difficulty').on('levels.guild_id', '=', 'points.guild_id')
      }).whereIn('plays.player', memberNames).where('plays.completed', '=', '1');

      if (data.timePeriod == '2') {
        cCountQueryBuilder = cCountQueryBuilder.whereRaw("strftime('%m-%Y', levels.created_at) = strftime('%m-%Y', CURRENT_TIMESTAMP)")
      } else if (data.timePeriod == '3') {
        cCountQueryBuilder = cCountQueryBuilder.whereRaw("strftime('%W-%Y', levels.created_at) = strftime('%W-%Y', CURRENT_TIMESTAMP)");
      } else if (data.timePeriod == '4') {
        cCountQueryBuilder = cCountQueryBuilder.whereRaw("strftime('%j-%Y', levels.created_at) = strftime('%j-%Y', CURRENT_TIMESTAMP)");
      }
      if (data.timePeriod2 == '2') {
        cCountQueryBuilder = cCountQueryBuilder.whereRaw("strftime('%m-%Y', plays.created_at) = strftime('%m-%Y', CURRENT_TIMESTAMP)")
      } else if (data.timePeriod2 == '3') {
        cCountQueryBuilder = cCountQueryBuilder.whereRaw("strftime('%W-%Y', plays.created_at) = strftime('%W-%Y', CURRENT_TIMESTAMP)");
      } else if (data.timePeriod2 == '4') {
        cCountQueryBuilder = cCountQueryBuilder.whereRaw("strftime('%j-%Y', plays.created_at) = strftime('%j-%Y', CURRENT_TIMESTAMP)");
      }
      let cCountResult = await cCountQueryBuilder.groupBy('plays.player').select('plays.player').count('plays.id as count_cleared').sum('points.score as score_sum');

      for(let row of cCountResult){
        let memName = row['player'];
        membersObj[memName]["levels_cleared"] = row.count_cleared;
        membersObj[memName]["clear_score_sum"] = row.score_sum;
      }

      let memberArr = Object.values(membersObj);

      for(let mem of memberArr){
        let comps = [];
        for(let comp of competition_winners){
          if(comp[1] === mem.name){
            comps.push({
              name: comp[2],
              rank: comp[3]
            })
          }
        }

        mem['wonComps'] = comps;
      }

      json = memberArr;

      let memberCounter = 1;
      json.sort(function(a,b){
        if(a.clear_score_sum > b.clear_score_sum){
          return -1;
        }
        if(a.clear_score_sum < b.clear_score_sum){
          return 1;
        }
        return 0;
      });

      for(let obj of json){
        obj.id = memberCounter++;
      }

      return json;
    }
  }


  async function generateWorldsJson(ts,isShellder, data){
    const SheetCache = ts.gs.getArrayFormat([
        "Seasons!B",
        "tags",
        "Competition Winners",
        "Points!B"
      ])
  
    let competition_winners = SheetCache["Competition Winners"];
    competition_winners.shift();
  
    let members = [];
  
    if(data.membershipStatus == '1'){
      members = await ts.db.Members.query().select().where("is_member", 1).where('world_level_count', '>', 0);
    } else if(data.membershipStatus == '2'){
      members = await ts.db.Members.query().select().where('world_level_count', '>', 0);
      members = members.filter(member => ts.is_mod(member));
    } else if(data.membershipStatus == '4'){
      members = await ts.db.Members.query().select().where('world_level_count', '>', 0).where(function () {
        this
          .where("is_member", 0)
          .orWhere("is_member", null)
      });
    } else {
      members = await ts.db.Members.query().select().where('world_level_count', '>', 0);
    }
  
    let json = [];
  
    let memberCounter = 1;
    for(let member of members){
      let comps = [];
      for(let comp of competition_winners){
        if(comp[1] === member.name){
          comps.push({
            name: comp[2],
            rank: comp[3]
          })
        }
      }
  
      json.push({
        'id': memberCounter++,
        'wonComps': comps,
        'name': member.name,
        'maker_id': member.maker_id,
        'maker_name': member.maker_name,
        'world_name': member.world_description,
        'world_world_count': member.world_world_count,
        'world_level_count': member.world_level_count
      });
    }
  
    return {data: json};
  }

  async function generateMakersJson(ts,isShellder, data){
    const SheetCache = ts.gs.getArrayFormat([
        "Seasons!B",
        "tags",
        "Competition Winners",
        "Points!B"
      ])

    let competition_winners = SheetCache["Competition Winners"];
    competition_winners.shift();
    let seasons = SheetCache["Seasons"];
    seasons.shift();

    if(data.season == -1){
      data.season = seasons.length;
    }

    let current_season = seasons[data.season - 1];
    let from_season = current_season[0];
    let to_season = 9999999999;
    if(seasons.length > data.season){
      let next_season = seasons[data.season];
      to_season = parseInt(next_season[0]);
    }

    if(!from_season){
      from_season = 0;
    } else {
      from_season = parseInt(from_season);
    }

    let members = [];
    let membersSQL=``;
    if(data.membershipStatus == '1'){
      membersSQL=`AND members.is_member=1`
    } else if(data.membershipStatus == '2'){;
      membersSQL=`AND members.is_mod=1`
    } else if(data.membershipStatus == '4'){
      membersSQL=`AND members.is_member!=1`
    }

    let json = [];

    console.log({ from_season, to_season })

    json=await knex.raw(`SELECT name
	  ,code
      ,COUNT(distinct code) as levels_created
      ,SUM(clears) as clears
      ,SUM(likes) as likes
      ,AVG(clear_like_ratio) as clear_like_ratio
      ,SUM(maker_points) as maker_points
    FROM (
           SELECT members.name
          ,levels.code
          ,points.score
          ,SUM(plays.completed) AS clears
          ,SUM(plays.liked) AS likes
          ,SUM(plays.liked) / SUM(plays.completed) AS clear_like_ratio
          ,(SUM(plays.liked) * 2 + SUM(plays.completed)) * points.score * (SUM(plays.liked) / SUM(plays.completed)) AS maker_points
      FROM members
      INNER JOIN teams ON 
        members.guild_id=teams.id
      LEFT JOIN levels ON 
          levels.creator = members.id
          AND levels.guild_id = members.guild_id
      LEFT JOIN plays ON
          levels.id = plays.code
          AND levels.guild_id = plays.guild_id
      LEFT JOIN points ON
          levels.difficulty = points.difficulty
          AND levels.guild_id = points.guild_id
      WHERE levels.status IN (0,1)
          AND levels.created_at between FROM_UNIXTIME(:from_season) AND FROM_UNIXTIME(:to_season)
          AND teams.guild_id = :guild_id
      group by levels.code ) a
      group by name;`,{ from_season, to_season, guild_id: ts.guild_id });

    json=json?json[0]:[]

    for(let mem of json){
      let comps = [];
      for(let comp of competition_winners){
        if(comp[1] === mem.name){
          comps.push({
            name: comp[2],
            rank: comp[3]
          })
        }
      }

      mem['wonComps'] = comps;
    }

    let memberCounter = 1;
    json.sort(function(a,b){
      if(a.maker_points > b.maker_points){
        return -1;
      }
      if(a.maker_points < b.maker_points){
        return 1;
      }
      return 0;
    });

    for(let obj of json){
      obj.id = memberCounter++;
    }

    return {data: json, seasons: seasons};
  }

  /*
  function get_slug(){
    let refer=req.headers.referer.split(req.host)[1].split('/')
  }
  */


  function web_ts(callback){
    return async (req, res) => {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      let ts;
      if(req.body && req.body.url_slug ){
        try {
          ts=TS.teamFromUrl(req.body.url_slug)
          if(!ts) throw `"${req.body.url_slug}" not found`; 

          let data=await callback(ts,req,res)
          res.send(JSON.stringify(data));

        } catch(error){
          if(ts){
            res.send(ts.getWebUserErrorMsg(error))
          } else {
            DiscordLog.error(error)
            console.error(error)
            res.send(JSON.stringify({status:'error','message':error}))
            //throw error;
          }
        }
      } else {
        res.send(JSON.stringify({status:'error',message: TS.message('api.noslug')}))
      }
    }
  }

  async function generateWorldsJson(ts,isShellder, data){
  const SheetCache = ts.gs.getArrayFormat([
      "Seasons!B",
      "tags",
      "Competition Winners",
      "Points!B"
    ])

  let competition_winners = SheetCache["Competition Winners"];
  competition_winners.shift();

  let members = [];

  if(data.membershipStatus == '1'){
    members = await ts.db.Members.query().select().where("is_member", 1).where('world_level_count', '>', 0);
  } else if(data.membershipStatus == '2'){
    members = await ts.db.Members.query().select().where('world_level_count', '>', 0);
    members = members.filter(member => ts.is_mod(member));
  } else if(data.membershipStatus == '4'){
    members = await ts.db.Members.query().select().where('world_level_count', '>', 0).where(function () {
      this
        .where("is_member", 0)
        .orWhere("is_member", null)
    });
  } else {
    members = await ts.db.Members.query().select().where('world_level_count', '>', 0);
  }

  let json = [];

  let memberCounter = 1;
  for(let member of members){
    let comps = [];
    for(let comp of competition_winners){
      if(comp[1] === member.name){
        comps.push({
          name: comp[2],
          rank: comp[3]
        })
      }
    }

    json.push({
      'id': memberCounter++,
      'wonComps': comps,
      'name': member.name,
      'maker_id': member.maker_id,
      'maker_name': member.maker_name,
      'world_name': member.world_description,
      'world_world_count': member.world_world_count,
      'world_level_count': member.world_level_count
    });
  }

  return {data: json};
}


app.post('/json/worlds',web_ts(async (ts,req)=>{
  if(req.body.token){
    req.body.discord_id=await ts.checkBearerToken(req.body.token)
    var user=await ts.get_user(req.body.discord_id)
  }

  let json = await generateWorldsJson(ts,user && ts.is_mod(user),req.body)
  return json;
}))

  app.post('/teams',async (req, res) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    try {
      let teams=await Teams.query().select('guild_name','url_slug','web_config').where({public:1})
      console.log(teams)
      res.send(JSON.stringify(data));
    } catch(error){
      let ret={"error":error.stack}
      DiscordLog.error(ret)
      res.send(ts.getWebUserErrorMsg(error))
      throw error;
    } 
  })

  app.post('/json',web_ts(async (ts,req)=>{
      console.time('user')
      
      if(req.body && req.body.token){
        req.body.discord_id=await ts.checkBearerToken(req.body.token)
        var user=await ts.get_user(req.body.discord_id)
      }
      console.timeEnd('user')

      console.time('json')
      let json = await generateSiteJson({ts , user ,...req.body })
      console.timeEnd('json')
      return json;
  }))

  app.post('/json/members',web_ts(async (ts,req)=>{
    if(req.body && req.body.token){
      req.body.discord_id=await ts.checkBearerToken(req.body.token)
      var user=await ts.get_user(req.body.discord_id)
    }

    let json = await generateMembersJson(ts,user && ts.is_mod(user), req.body)
    return json;
  }))

  app.post('/json/makers',web_ts(async (ts,req)=>{
    if(req.body && req.body.token){
      req.body.discord_id=await ts.checkBearerToken(req.body.token)
      var user=await ts.get_user(req.body.discord_id)
    }

    let json = await generateMakersJson(ts,user && ts.is_mod(user), req.body)
    return json;
  }))

  app.post('/clear',web_ts(async (ts,req)=>{
    if(!req.body || !req.body.token) ts.userError("website.noToken");

    req.body.discord_id=await ts.checkBearerToken(req.body.token)
    await ts.get_user(req.body.discord_id)

    let msg=await ts.clear(req.body)
    await client.channels.get(ts.channels.commandFeed).send(msg)
    let json = {status:"sucessful",msg:msg}
    return json;
  }))

  app.post('/approve',web_ts(async (ts,req)=>{
    if(!req.body || !req.body.token) ts.userError("website.noToken");

    req.body.discord_id=await ts.checkBearerToken(req.body.token)
    let user=await ts.get_user(req.body.discord_id)

    if(ts.is_mod(user)) ts.userError("Forbidden");

    req.body.reason=req.body.comment

    let msg=await ts.approve(req.body)
    let clearmsg=await ts.clear(req.body)

    await client.channels.get(ts.channels.commandFeed).send(clearmsg)
    json = {status:"sucessful",msg:msg}
    return json
  }))

  app.post('/random',web_ts(async (ts,req)=>{
    if(req.body && req.body.token){
      req.body.discord_id=await ts.checkBearerToken(req.body.token)
      var user=await ts.get_user(req.body.discord_id)
    }

    let rand=await ts.randomLevel(req.body)
    rand.status="sucessful"
    return rand
  }))

  app.post('/feedback',web_ts(async (ts,req)=>{

    if(!req.body || !req.body.token)
      ts.userError("website.noToken");

    req.body.discord_id=await ts.checkBearerToken(req.body.token) //checks if logged in
    await ts.get_user(req.body.discord_id) //just checks if registered

    if(req.body.message == null) ts.userError(ts.message("feedback.noMessage"));
    if(req.body.message.length > 1000) ts.userError(ts.message("feedback.tooLong"));

    let ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    let discordId = req.body.discord_id;
    await ts.putFeedback(ip, discordId, ts.config.config.feedback_salt, req.body.message);
    return { status: "successful"}

  }))

  app.post('/json/level',web_ts(async (ts,req)=>{


    
  }))

  app.post('/json/login', web_ts(async (ts,req) => {
      let returnObj={}
      if(!req.body.otp)
        ts.userError(ts.message("login.noOTP"));

      let token=await ts.db.Tokens.query()
        .where('token','=',req.body.otp)

      if(token.length){
        token=token[0]
        let tokenExpireAt=moment(token.created_at).add(30,'m').valueOf()
        let now=moment().valueOf()
        if(tokenExpireAt<now)
          ts.userError(ts.message("login.expiredOTP"))
        let user=await ts.get_user(token.discord_id);
        let bearer=await ts.login(token.discord_id,token.id)
        returnObj={status:"logged_in",type:"bearer","discord_id":user.discord_id,"token":bearer,"user_info":user}
      } else {
        ts.userError(ts.message("login.invalidToken"))
      }

      return returnObj
  }));

  return app
}