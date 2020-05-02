'use strict'
const config = require('./config.json');
const argv = require('yargs').argv
const { AkairoClient } = require('discord-akairo');
const TS=require('./TS.js')
const DiscordLog = require('./DiscordLog');
const WebApi=require('./WebApi');
if(argv.test) config.defaultCooldown=0;


const client = new AkairoClient(config, {
    disableEveryone: true
<<<<<<< HEAD
}); 
=======
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
>>>>>>> origin/master

client.on("guildCreate", async guild => {
  DiscordLog.log(`Joined a new guild: ${guild.name}`,client);
});



client.on("ready", async () => {
  await DiscordLog.log(`${config.botName} has started, with ${client.users.size} users, in ${client.channels.size} channels of ${client.guilds.size} guilds.`,client);
  let Teams = require('./models/Teams')();
  let teams = await Teams.query().select()
  if(!teams) throw `No teams configurations buzzyS`;

  for(let team of teams){
      let guild=await client.guilds.find((guild)=> guild.id==team.guild_id)
      if(
        !argv.test
        || argv.test
        && (
          !  config.AutomatedTest
          || config.AutomatedTest == guild.id
      )){
      if(team==null){

      } else {
        await TS.add(guild.id,team,client)
      }
    }
  }
});

(async () => { //main thread
  let app;
  try {
    await client.login(config.discord_access_token);
    app = await WebApi(config,client);
    await app.listen(config.webPort, () => DiscordLog.log(config.botName+':WebApi now listening on '+config.webPort,client));
 } catch(error) {
   DiscordLog.error(error.stack,client)
 }
<<<<<<< HEAD
})();
=======
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

async function generateWorldsJson(ts,isShellder, data){
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
    for(let comp of competiton_winners){
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

app.post('/json/worlds',web_ts(async (ts,req)=>{
  if(req.body.token){
    req.body.discord_id=await ts.checkBearerToken(req.body.token)
    var user=await ts.get_user(req.body.discord_id)
  }

  let json = await generateWorldsJson(ts,user && ts.is_mod(user),req.body)
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
>>>>>>> origin/master
