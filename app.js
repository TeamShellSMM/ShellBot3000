'use strict'
const config = require('./config.json');
const argv = require('yargs').argv
const { AkairoClient } = require('discord-akairo');
const TS=require('./TS.js')
const express = require('express');
const bodyParser = require('body-parser');
const moment = require('moment');
const compression = require('compression')
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

function sqlDateToTimestamp(date){
  if(!date) return ""
  return (new Date(date.replace(/-/g,"/"))).getTime()/1000
}

//to be used until we update web frontend
function newLevelDataToOld(level){
  return [
    level.code,
    level.creator,
    level.level_name,
    level.difficulty,
    level.status,
    level.new_code || '',
    level.videos || '',
    sqlDateToTimestamp(level.created_at),
    level.tags || '',
    level.is_free_submission || '',
  ];
}


async function generateSiteJson(ts,isShellder){
    const SheetCache = ts.gs.getArrayFormat([
        "Seasons!B",
        "tags",
        "Competition Winners",
        "Points!B"
      ])

    let competiton_winners = SheetCache["Competition Winners"];
    let _points = SheetCache["Points"]
    let tags = ts.gs.select("tags");
    let _seasons = ts.gs.select("Seasons")

    let _members = await ts.db.Members.query().select();
    let _playedLevels = await ts.db.Plays.query();


    for(let i=0;i<_playedLevels.length;i++){ //fix old dates
      _playedLevels[i].created_at=(new Date(_playedLevels[i].created_at.replace(/-/g,"/"))).getTime()/1000;
    }

    let _rawLevels = await ts.db.Levels.query().select().whereIn('status',[
      ts.LEVEL_STATUS.PENDING,
      ts.LEVEL_STATUS.APPROVED,
      ts.LEVEL_STATUS.REUPLOADED,
      ts.LEVEL_STATUS.NEED_FIX,
    ])

    let rawLevels=[];
    let reuploaded=[]
    let pending=[]
    for(let i=1;i<_rawLevels.length;i++){
      if(_rawLevels[i].status==ts.LEVEL_STATUS.PENDING){
        pending.push(_rawLevels[i].code)
      }
      if(_rawLevels[i].status==ts.LEVEL_STATUS.PENDING || _rawLevels[i].status==ts.LEVEL_STATUS.APPROVED){
        rawLevels.push(newLevelDataToOld(_rawLevels[i]))
      }
      if(_rawLevels[i].status==ts.LEVEL_STATUS.REUPLOADED && _rawLevels[i].new_code){
        reuploaded.push(newLevelDataToOld(_rawLevels[i]))
      }
    }

    //remove headers
    competiton_winners.shift()

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

    _members=_members.map( m =>{
      return [
        m.name,
        ts.is_mod(m)?1:'',
        m.is_member?1:'',
        m.maker_id||"",
        m.badges||"",
      ]
    })

    let d=new Date()
    let day = d.getDay();
    let DAY_START=(new Date(d.getFullYear(), d.getMonth(), d.getDate())).getTime()/1000;
    let WEEK_START=(new Date(d.getFullYear(), d.getMonth(), d.getDate() + (day == 0?-6:1)-day )).getTime()/1000;
    let MONTH_START=(new Date(d.getFullYear(), d.getMonth(), 1)).getTime()/1000;
    let json={
      //"lastUpdated":ts.gs.lastUpdated,
      "DAY_START":DAY_START,
      "WEEK_START":WEEK_START,
      "MONTH_START":MONTH_START,
      "seasons":Seasons,
      "comp_winners":competiton_winners,
      "levels":rawLevels,
      "reuploaded":reuploaded,
      "played":_playedLevels,
      "members":_members,
      "tags":_tags,
      "seperate":_seperate,
      "points":_points,
    };

      let _comments=await ts.db.PendingVotes.query().where("is_shellder",1)
      let comments={}
      let voteCounts={}
      for(let i=0;i<_comments.length;i++){
        let currCode=_comments[i].code
        if(pending.indexOf(currCode)!="-1"){
          if(!comments[currCode]){
            comments[currCode]=[]
          }
          if(!voteCounts[currCode]){
            voteCounts[currCode]={}
          }
          if(!voteCounts[currCode][_comments[i].type]){
            voteCounts[currCode][_comments[i].type]=1
          } else {
            voteCounts[currCode][_comments[i].type]++
          }
          let temp=Object.assign({},_comments[i])
          delete temp.code
          comments[currCode].push(temp)
        }
      }
    json["vote_counts"]=voteCounts;
    if(isShellder){
      json["shellder"]=true;
      json["shellder_comments"]=comments;
    }
    return json;
}

async function generateMembersJson(ts,isShellder){
  const SheetCache = ts.gs.getArrayFormat([
      "Seasons!B",
      "tags",
      "Competition Winners",
      "Points!B"
    ])

  let competiton_winners = SheetCache["Competition Winners"];
  let _points = SheetCache["Points"]
  let seasons = ts.gs.select("Seasons")

  _points.unshift();
  let points = {};

  for(let _point of _points){
    points[_point[0]] = _point[1];
    let dbPoint = await ts.db.Points.query().select().where('difficulty', _point[0]);
    if(!dbPoint){
      await ts.db.Points.insert({
        difficulty: _point[0],
        score: _point[1]
      });
    }
  }

  let members = await ts.db.Members.query().select();

  let json = [];

  for(let member of members){
    let levelCount = await ts.db.Levels.query().select().whereIn('status',[
      ts.LEVEL_STATUS.APPROVED,
      ts.LEVEL_STATUS.REUPLOADED,
      ts.LEVEL_STATUS.PENDING,
    ]).where('creator', '=', member.name)
    .count('id as id_count');

    let playCount = await ts.db.Plays.query().select().where('player', '=', member.name).count('id as id_count');

    let plays = await ts.db.Plays.query().select().where('player', '=', member.name).join('levels', 'plays.code', '=', 'levels.code').whereIn('status',[
      ts.LEVEL_STATUS.APPROVED,
      ts.LEVEL_STATUS.REUPLOADED
    ]).select('levels.difficulty');

    let sumPoints = 0.0;

    for(let play of plays){
      if(points[play.difficulty]){
        sumPoints += parseFloat(points[play.difficulty]);
      }
    }

    let memberArr = [
      member.name,
      levelCount[0].id_count,
      playCount[0].id_count,
      sumPoints
    ]

    json.push(memberArr);
  }

  return json;
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
      let ret={"error":error.stack,"url_slug":req.body.url_slug}
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

app.post('/json',web_ts(async (ts,req)=>{
    if(req.body.token){
      req.body.discord_id=await ts.checkBearerToken(req.body.token)
      var user=await ts.get_user(req.body.discord_id)
    }

    let json = await generateSiteJson(ts,user && ts.is_mod(user))
    return json;
}))

app.post('/json/members',web_ts(async (ts,req)=>{
  if(req.body.token){
    req.body.discord_id=await ts.checkBearerToken(req.body.token)
    var user=await ts.get_user(req.body.discord_id)
  }

  let json = await generateMembersJson(ts,user && ts.is_mod(user))
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