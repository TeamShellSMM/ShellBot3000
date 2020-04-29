'use strict'
const config = require('./config.json');
const argv = require('yargs').argv
const { AkairoClient } = require('discord-akairo');
const TS=require('./TS.js')
const Teams=require('./models/Teams');
const express = require('express');
const bodyParser = require('body-parser');
const moment = require('moment');
const compression = require('compression')
const knex = require('./db/knex');
const app = express();

global.DEFAULTMESSAGES=require("./DefaultStrings.js");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(compression())
if(config.json_dev){
  app.use("/dev", express.static(__dirname + '/json_dev.html'));
}

const client = new AkairoClient(config, {
    disableEveryone: true
});

client.on('shardError', error => {
	 console.error('A websocket connection encountered an error:', error);
});

global.console_error=async function(error){
  console.error(error)
  if(argv.test){
    let channel=await client.channels.get(config.error_channel)
    let dev="<@"+config.devs.join(">,<@")+"> "+(error.channel?" at "+error.channel:"")
    error=JSON.stringify(error,null,2).replace(/\\n/g,"\n")
    channel.send(dev+"```fix\n"+error+"```")
  }
}

client.on("guildCreate", async guild => {
  console.log(`Joined a new guild: ${guild.name}`);
});

global.TS_LIST={}
global.get_ts=function(guild_id){
  if(TS_LIST[guild_id]){
    return TS_LIST[guild_id];
  } else {
    throw `This team, with guild id ${guild_id} has not yet setup it's config, buzzyS`;
  }
}


client.on("ready", async () => {
  console.log(`${config.botName} has started, with ${client.users.size} users, in ${client.channels.size} channels of ${client.guilds.size} guilds.`);
  await client.guilds.forEach(async guild =>{
    if(
        !argv.test
        || argv.test
        && (
          !  config.AutomatedTest
          || config.AutomatedTest == guild.id
      )){
      let Teams = require('./models/Teams.js')(guild.id);
      let team_config=await Teams.query().select().first();
      if(team_config==null){

      } else {
        team_config.config=team_config.config?JSON.parse(team_config.config):{}
        team_config.web_config=team_config.web_config?JSON.parse(team_config.web_config):{}
        global.TS_LIST[guild.id]=new TS(guild.id,team_config.config,client)
        await global.TS_LIST[guild.id].load()
        if(config.AutomatedTest == guild.id && argv.test){
          guild.channels.get(global.TS_LIST[guild.id].channels.modChannel).send('?test')
        }
        global.TS_LIST[guild.id].db.Teams=Teams
        global.TS_LIST[guild.id].config=team_config
      }
    }
  })
});


(async () => { //main thread
  try {
    await client.login(config.discord_access_token);
    await app.listen(config.webPort, () => console.log(config.botName+':Web server now listening on '+config.webPort));
 } catch(error){
   console_error(error.stack)
 }
})();

async function generateSiteJson({ ts, user , code , name , dashboard }){
    console.log(user);
    console.log(name);
    console.log(code);
    const SheetCache = ts.gs.getArrayFormat(["Competition Winners"])

    let competiton_winners = SheetCache["Competition Winners"];
    competiton_winners.shift()
    let tags = ts.gs.select("tags");
    let _seasons = ts.gs.select("Seasons")

    let filterSql=''
    if(code){
      filterSql= 'AND levels.code=:code';
    } else if(name){
      filterSql= 'AND levels.creator=:name';
    }

    let registeredColumns=(user)?`
    ,registered_plays.completed
    ,registered_plays.liked
    ,registered_plays.difficulty_vote
    `:`
    ,'-' completed
    ,'-' liked
    ,'-' difficulty_vote`;

    let registeredSql=(user)?`
      LEFT JOIN plays registered_plays ON
        levels.guild_id=registered_plays.guild_id
        AND levels.code=registered_plays.code
        AND registered_plays.player=:player
    `:``


    let newLevels= await ts.knex.raw(`
      SELECT ROW_NUMBER () OVER (ORDER BY id) no
      ,*
      ,round(((likes*2+clears)*score*likes/clears),1) lcd
      ,vote||','||votetotal votestr
      ,max(row_last_updated,0) loaded_on
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
        ,MAX(
          levels.created_at
          ,levels.updated_at
          ,MAX(plays.created_at)
          ,MAX(plays.updated_at)
          ,points.created_at
          ,points.updated_at
        ) row_last_updated
      FROM
        levels
      LEFT JOIN plays ON
        levels.guild_id=plays.guild_id
        AND levels.code=plays.code
        AND levels.creator!=plays.player
      LEFT JOIN members ON
        levels.guild_id=members.guild_id
        AND levels.creator=members.name
      LEFT JOIN points ON
        levels.guild_id=points.guild_id
        AND levels.difficulty=points.difficulty
      LEfT JOIN pending_votes ON
        levels.guild_id=pending_votes.guild_id
        AND levels.code=pending_votes.code
        AND levels.status=0
      ${registeredSql}
      WHERE 
        levels.status IN (:statuses:)
        AND levels.guild_id=:guild_id
      GROUP BY levels.id);
    `, { 
      guild_id:ts.guild_id,
      code,
      name,
      player:user.name,
      statuses: [
      ts.LEVEL_STATUS.PENDING,
      ts.LEVEL_STATUS.APPROVED,
      ts.LEVEL_STATUS.NEED_FIX,
    ] })
    
    let _tags={}
    let _seperate=[]
    for(let i=0;i<tags.length;i++){
      if(tags[i].Seperate=='1'){
        _seperate.push(tags[i].Tag)
      }
      _tags[tags[i].Tag]=tags[i].Type
    }

    let Seasons=[]
    for(let i=0;i<_seasons.length;i++){
      Seasons.push({
        name:_seasons[i].Name,
        startdate:_seasons[i].StartDate
      })
    }

    let json={
      //"lastUpdated":ts.gs.lastUpdated,
      "seasons":Seasons,
      "comp_winners":competiton_winners,
      "tags":_tags,
      "seperate":_seperate,
    };

    if(name){
      json.maker=await ts.knex.raw(`members.*
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
      if(json.maker.length>0){
        json.maker=json.maker[0]
        delete json.maker.discord_id
        delete json.maker.guild_id
      }
    }

    if(dashboard){
      json.dashboard={
        members:await ts.knex.raw(`
        SELECT sum(members.is_member) official
          ,count(members.id)-sum(members.is_member) unoffocial
          ,sum(members.is_mod) mods
        FROM members
        where guild_id=:guild_id
      `, { guild_id:ts.guild_id }),
      }
      json.dashboard.members=json.dashboard.members[0]
    }

    if(code && newLevels[0]){
      json.level=newLevels[0]
      json.plays=await ts.db.Plays.query().where({ code })
      if(user && user.is_mod && json.level.status==ts.LEVEL_STATUS.PENDING){
        json.pending_comments=await ts.db.PendingVotes.query().where({ code })
      }
    } else {
      json.levels=newLevels;
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

  let competiton_winners = SheetCache["Competition Winners"];
  competiton_winners.shift();

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
      for(let comp of competiton_winners){
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
      for(let comp of competiton_winners){
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

async function generateMakersJson(ts,isShellder, data){
  const SheetCache = ts.gs.getArrayFormat([
      "Seasons!B",
      "tags",
      "Competition Winners",
      "Points!B"
    ])

  let competiton_winners = SheetCache["Competition Winners"];
  competiton_winners.shift();
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

  if(data.membershipStatus == '1'){
    members = await ts.db.Members.query().select().where("is_member", 1);
  } else if(data.membershipStatus == '2'){
    members = await ts.db.Members.query().select();
    members = members.filter(member => ts.is_mod(member));
  } else if(data.membershipStatus == '4'){
    members = await ts.db.Members.query().select().where("is_member", 0).orWhere("is_member", null);
  } else {
    members = await ts.db.Members.query().select();
  }

  let json = [];

  let member_ids = Array.from(members, x => x.id);

  json=await knex.raw(`SELECT name
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
    LEFT JOIN levels ON levels.creator = members.name
        AND levels.guild_id = members.guild_id
    LEFT JOIN plays ON levels.code = plays.code
        AND levels.guild_id = plays.guild_id
    LEFT JOIN points ON levels.difficulty = points.difficulty
        AND levels.guild_id = points.guild_id
    WHERE levels.status IN (:statuses:)
        AND levels.created_at >= datetime(:from_season:, 'unixepoch')
        AND levels.created_at < datetime(:to_season:, 'unixepoch')
        AND members.id in (:member_ids:)
        AND members.guild_id = :guild_id
    GROUP BY members.name
        ,levels.code
    )
  GROUP BY name;`,{ statuses:[ts.LEVEL_STATUS.PENDING,ts.LEVEL_STATUS.APPROVED], from_season, to_season, member_ids, guild_id: ts.guild_id });

  for(let mem of json){
    let comps = [];
    for(let comp of competiton_winners){
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


function get_web_ts(url_slug){
  for(var id in global.TS_LIST){
    if(global.TS_LIST[id].config && global.TS_LIST[id].config.url_slug == url_slug){
      return global.TS_LIST[id];
    }
  }
  return false
}

function web_ts(callback){
  return async (req, res) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    try {
      var ts=get_web_ts(req.body.url_slug)
      if(!ts)
        throw `"${req.body.url_slug}" not found`;
    } catch(error){
      let ret={status:'error',message: error.stack || error,"url_slug":req.body.url_slug}
      console_error(ret)
      res.send(JSON.stringify(ret));
      throw error;
    }

    try{
      let data=await callback(ts,req,res)
      res.send(JSON.stringify(data));
    } catch(error) {
      res.send(ts.getWebUserErrorMsg(error))
    }
  }
}

app.post('/teams',async (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  try {
    let teams=await Teams.query().select('guild_name','url_slug','web_config').where({public:1})
    console.log(teams)
    res.send(JSON.stringify(data));
  } catch(error){
    let ret={"error":error.stack}
    console_error(ret)
    res.send(ts.getWebUserErrorMsg(error))
    throw error;
  } 
})

app.post('/json',web_ts(async (ts,req)=>{
    console.time('user')
    
    if(req.body.token){
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
  if(req.body.token){
    req.body.discord_id=await ts.checkBearerToken(req.body.token)
    var user=await ts.get_user(req.body.discord_id)
  }

  let json = await generateMembersJson(ts,user && ts.is_mod(user), req.body)
  return json;
}))

app.post('/json/makers',web_ts(async (ts,req)=>{
  if(req.body.token){
    req.body.discord_id=await ts.checkBearerToken(req.body.token)
    var user=await ts.get_user(req.body.discord_id)
  }

  let json = await generateMakersJson(ts,user && ts.is_mod(user), req.body)
  return json;
}))

app.post('/clear',web_ts(async (ts,req)=>{
  if(!req.body.token) ts.userError("website.noToken");

  req.body.discord_id=await ts.checkBearerToken(req.body.token)
  await ts.get_user(req.body.discord_id)

  let msg=await ts.clear(req.body)
  await client.channels.get(ts.channels.commandFeed).send(msg)
  let json = {status:"sucessful",msg:msg}
  return json;
}))

app.post('/approve',web_ts(async (ts,req)=>{
  if(!req.body.token) ts.userError("website.noToken");

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
  if(req.body.token){
    req.body.discord_id=await ts.checkBearerToken(req.body.token)
    var user=await ts.get_user(req.body.discord_id)
  }

  let rand=await ts.randomLevel(req.body)
  rand.status="sucessful"
  return rand
}))

app.post('/feedback',web_ts(async (ts,req)=>{

  if(!req.body.token)
    ts.userError("website.noToken");

  req.body.discord_id=await ts.checkBearerToken(req.body.token) //checks if logged in
  let user=await ts.get_user(req.body.discord_id) //just checks if registered

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