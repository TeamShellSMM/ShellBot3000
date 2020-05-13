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
  if(!client) throw new Error(`DiscordClient is not defined`);
  const app = express();
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(compression())

  async function generateSiteJson(args={}){
    const { ts, user , code , name , dashboard } = args;
    if(!ts) throw `TS not loaded buzzyS`;
    let competition_winners = await ts.knex("competition_winners").where({guild_id:ts.team.id});
    let tags=await ts.knex("tags").where({guild_id:ts.team.id});
    let seasons = await ts.knex("seasons").where({guild_id:ts.team.id})

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

    let [ levels ]= await knex.raw(`
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
        ,levels.tags
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
      INNER JOIN points on
        levels.guild_id=teams.id
        AND points.difficulty=levels.difficulty
      INNER JOIN members on
        levels.creator=members.id
      ${registeredSql}
      WHERE 
        levels.status IN (:statuses:)
        AND teams.guild_id=:guild_id
        ${filterSql}
      GROUP BY levels.id
      order by levels.id
    `, { 
      guild_id:ts.guild_id,
      code,
      name,
      player_id: user ? user.id : -1,
      statuses: [
      ts.LEVEL_STATUS.PENDING,
      ts.LEVEL_STATUS.APPROVED,
      ts.LEVEL_STATUS.NEED_FIX,
    ] })
    

    const seperate=tags.filter( t => t.is_seperate ).map( t => t.name )
    let json={
      levels,
      seasons,
      competition_winners,
      tags,
      seperate,
    };

    if(name){
      const [ makerDetails ]=await knex.raw(`
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
      `, { 
        guild_id:ts.team.id,
        name,
        status:ts.LEVEL_STATUS.APPROVED 
      })
      if(makerDetails){
        json.maker=makerDetails
        if(json.maker.length>0){
          json.maker=json.maker[0]
          delete json.maker.discord_id
          delete json.maker.guild_id
          json.plays=await ts.getPlays().where('player',json.maker.id)
        }
      }
    }

    if(dashboard){
        const [ memberStats , fields ]=await knex.raw(`
        SELECT sum(members.is_member) official
          ,count(members.id)-sum(members.is_member) unoffocial
          ,sum(members.is_mod) mods
        FROM members
        where guild_id=:guild_id
      `, { guild_id:ts.team.id});
      json.dashboard={
        members:memberStats[0],
      }
    }

    if(code && levels && levels[0]){
      json.plays=await ts.getPlays().where('levels.id',levels[0].id)
      if(user && user.is_mod && [ts.LEVEL_STATUS.PENDING,ts.LEVEL_STATUS.NEED_FIX].includes(levels[0].status)){
        json.pending_comments=await ts.getPendingVotes().where('levels.id',levels[0].id)
      }
    }

    return json;
  }

  async function generateMembersJson(ts,isShellder, data){
    let competition_winners = await ts.knex("competition_winners").where({guild_id:ts.team.id});

    let members = [];

    if(data.membershipStatus == '1'){
      members = await ts.db.Members.query().select().where("is_member", 1).orderBy("clear_score_sum", "desc");
    } else if(data.membershipStatus == '2'){
      members = await ts.db.Members.query().select().where("is_mod",1).orderBy("clear_score_sum", "desc");
    } else if(data.membershipStatus == '4'){
      members = await ts.db.Members.query().select().where(q=> q.where("is_member", 0).orWhere("is_member", null)).orderBy("clear_score_sum", "desc");
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

      //TODO: fix 
      let membersObj = {};

      let memberNames = Array.from(members, x => x.id);

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

    let competition_winners = await ts.knex("competition_winners").where({guild_id:ts.team.id});
    
  
    let members = [];
  
    if(data.membershipStatus == '1'){
      members = await ts.db.Members.query().select().where("is_member", 1).where('world_level_count', '>', 0);
    } else if(data.membershipStatus == '2'){
      members = await ts.db.Members.query().select().where('world_level_count', '>', 0);
      members = members.filter(member => member.is_mod);
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

  async function generateMakersJson(ts,data){

    let competition_winners = await ts.knex("competition_winners").where({guild_id:ts.team.id});
    let seasons = await ts.knex('seasons').where({guild_id:ts.team.id}).orderBy('start_date');

    let end_date='2038-01-19 03:14:08'
    for(let i=seasons.length-1; i>=0 ;i--){
      seasons[i].end_date=end_date;
      end_date=seasons[i].start_date
    }
    data.season = data.season || seasons.length
    
    const current_season=seasons.length ? seasons[data.season-1] : {}
    let membersSQL='';  
    if(data.membershipStatus == '1'){
      membersSQL=`AND members.is_member=1`
    } else if(data.membershipStatus == '2'){;
      membersSQL=`AND members.is_mod=1`
    } else if(data.membershipStatus == '4'){
      membersSQL=`AND members.is_member!=1`
    }

    let [ json ]=await knex.raw(`SELECT 
    row_number() over ( order by sum(maker_points)) id
      ,name
      ,creator_id
	    ,code
      ,levels_created
      ,sum(clears) clears
      ,sum(likes) likes
      ,AVG(clear_like_ratio) as clear_like_ratio
      ,SUM(maker_points) as maker_points
    FROM (
           SELECT members.name
          ,members.levels_created
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
      order by maker_points desc`,{ 
        from_season:current_season.start_date || '0000-00-00',
        to_season:current_season.end_date || '3000-01-01',
        guild_id: ts.guild_id,
      });

    return {data: json, seasons, competition_winners};
  }

  let web_ts=(callback)=>{
    //let refer=req.headers.referer.split(req.host)[1].split('/')
    return async (req, res) => {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      let ts;
      if(req.body && req.body.url_slug ){
        try {
          ts=TS.teamFromUrl(req.body.url_slug)
          if(!ts){
            res.status(404).send('Not found');
            DiscordLog.error(`"${req.body.url_slug}" not found`);
          } else {
            if(req.body && req.body.token){
              req.body.discord_id=await ts.checkBearerToken(req.body.token)
              req.user=await ts.get_user(req.body.discord_id)
            }
            let data=await callback(ts,req,res)
            data.url_slug=ts.url_slug;
            if(ts.teamAdmin(req.body.discord_id)){
              data.teamAdmin=true;
            }
            res.send(JSON.stringify(data));
          }
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

  let competition_winners = await ts.knex("competition_winners").where({guild_id:ts.team.id});
  let members = [];

  if(data.membershipStatus == '1'){
    members = await ts.db.Members.query().select().where("is_member", 1).where('world_level_count', '>', 0);
  } else if(data.membershipStatus == '2'){
    members = await ts.db.Members.query().select().where('world_level_count', '>', 0);
    members = members.filter(member => member.is_mod);
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
      'creator_id': member.name,
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

  let json = await generateWorldsJson(ts,user && user.is_mod,req.body)
  return json;
}))

  app.post('/teams',async (req, res) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    try {
      let teams=await Teams.query().select('guild_name','url_slug','web_config').where({public:1})
      res.send(JSON.stringify(data));
    } catch(error){
      let ret={"error":error.stack}
      DiscordLog.error(ret)
      res.send(ts.getWebUserErrorMsg(error))
      throw error;
    } 
  })

  app.post('/teams/settings',web_ts(async (ts,req) => {
    if(!req.body.discord_id) ts.userError("website.noToken");
    if(!await ts.teamAdmin(req.body.discord_id)) ts.userError(ts.message('website.forbidden'));

    const settings=await ts.getSettings('settings')
    const ret=[]
    for(let i=0;i<ts.defaultVariables.length;i++){
      let value=settings[ts.defaultVariables[i].name] || ts.defaultVariables[i].default;
      if(ts.defaultVariables[i].type==="boolean"){
        value= value=='true'
      } else if(ts.defaultVariables[i].type==="number"){
        value=Number(value)
      }
      ret.push({
        ...ts.defaultVariables[i],
        value,
      })
    }
    return {settings:ret}
  }))

  app.put('/teams/settings',web_ts(async (ts,req) => {
    if(!req.body || !req.body.token) ts.userError("website.noToken");
    req.body.discord_id=await ts.checkBearerToken(req.body.token)
    if(!await ts.teamAdmin(req.body.discord_id)) ts.userError(ts.message('website.forbidden'));
    const user=await ts.get_user(req.body.discord_id)
    const varName=ts.defaultVariables.map((v)=> v.name)
    await knex.transaction(async(trx)=>{
      for(const row of req.body.data){
        if(varName.includes(row.name)){
          const existing=await trx('team_settings')
            .where({'guild_id':ts.team.id})
            .where({type:'settings'})
            .where({name:row.name}).first()
          if(existing){
            if(existing.value!==row.value){
              await trx('team_settings')
              .update({value:row.value,admin_id:user.id})
              .where({'guild_id':ts.team.id})
              .where({type:'settings'})
              .where({name:row.name})
            }
          } else {
            await trx('team_settings')
            .insert({
              guild_id:ts.team.id,
              admin_id:user.id,
              name:row.name,
              value:row.value,
              type:'settings',
            })
          }

        }
      }
    })
    await ts.load()
    return { status: "successful"}
  }))

  app.post('/json',web_ts(async (ts,req)=>{
      
      if(req.body && req.body.token){
        req.body.discord_id=await ts.checkBearerToken(req.body.token)
        var user=await ts.get_user(req.body.discord_id)
      }

    let json = await generateSiteJson({ts , user ,...req.body })
    return json;
  }))

  app.post('/json/members',web_ts(async (ts,req)=>{
    if(req.body && req.body.token){
      req.body.discord_id=await ts.checkBearerToken(req.body.token)
      var user=await ts.get_user(req.body.discord_id)
    }

    let json = await generateMembersJson(ts,user && user.is_mod, req.body)
    return json;
  }))

  app.post('/json/makers',web_ts(async (ts,req)=>{
    if(req.body && req.body.token){
      req.body.discord_id=await ts.checkBearerToken(req.body.token)
    }
    let json = await generateMakersJson(ts,req.body)
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

    if(user.is_mod) ts.userError("Forbidden");

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

  app.post('/json/login', web_ts(async (ts,req) => {
      let returnObj={}
      if(!req.body.otp) ts.userError(ts.message("login.noOTP"));


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