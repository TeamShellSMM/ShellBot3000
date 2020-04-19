'use strict'
const config = require('./config.json');
const { AkairoClient } = require('discord-akairo');
const TS=require('./TS.js')
const express = require('express');
const bodyParser = require('body-parser');
const moment = require('moment');
const compression = require('compression')
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(compression())

if(config.json_dev){
  app.use("/dev", express.static(__dirname + '/json_dev.html'));
}

const client = new AkairoClient(config, {
    disableEveryone: true
});

client.on("guildCreate", async guild => {
  console.log("Joined a new guild: " + guild.name);
});

global.TS_LIST={}
global.get_ts=function(guild_id){
  if(TS_LIST[guild_id]){
    return TS_LIST[guild_id];
  } else {
    throw "This team has not yet setup it's config, buzzyS";
  }
}

function get_web_ts(url_slug){
  for(var id in global.TS_LIST){
    if(global.TS_LIST[id] && global.TS_LIST[id].config && global.TS_LIST[id].config.url_slug == url_slug){
      return global.TS_LIST[id];
    }
  }
  return false
}


client.on("ready", async () => {
  console.log(config.botName+` has started, with ${client.users.size} users, in ${client.channels.size} channels of ${client.guilds.size} guilds.`);
  await client.guilds.forEach(async guild =>{
    let Teams = require('./models/Teams.js')(guild.id);
    let team_config=await Teams.query().select().first();
    if(team_config==null){

    } else {
      team_config.config=team_config.config?JSON.parse(team_config.config):{}
      team_config.web_config=team_config.web_config?JSON.parse(team_config.web_config):{}
      global.TS_LIST[guild.id]=new TS(guild.id,team_config.config,client,team_config)
      await global.TS_LIST[guild.id].load()
      global.TS_LIST[guild.id].db.Teams=Teams
      global.TS_LIST[guild.id].config=team_config
      global.TS_LIST.guild_name=guild.name
      global.TS_LIST.icon=guild.icon_url
    }
  })
});


(async () => { //main thread
  try {
    await client.login(config.discord_access_token);
    await app.listen(config.webPort, () => console.log(config.botName+':Web server now listening on '+config.webPort));

 } catch(error){
  console.error(error)
 }
})();

async function generateSiteJson(ts,isShellder){
  const SheetCache = ts.gs.getArrayFormat([
        "Raw Levels!J",
        "Seasons!B",
        "tags",
        "Competition Winners",
        "Raw Members!C",
        "Points!B"
      ])

    let _rawLevels = SheetCache["Raw Levels"]
    let _seasons = SheetCache["Seasons"]
    let tags = SheetCache["tags"];
    let competiton_winners = SheetCache["Competition Winners"];
    let _members = SheetCache["Raw Members"]
    let _points = SheetCache["Points"]

    let _playedLevels = await ts.db.Plays.query();

    for(let i=0;i<_playedLevels.length;i++){
      _playedLevels[i].created_at=typeof _playedLevels[i].created_at ==="string" ?
      (new Date(_playedLevels[i].created_at.replace(/-/g,"/"))).getTime()/1000:
      _playedLevels[i].created_at;
    }

    let rawLevels=[_rawLevels[0]];
    let reuploaded=[]
    let pending=[]
    for(let i=1;i<_rawLevels.length;i++){
      if(_rawLevels[i][4]=="0"){
        pending.push(_rawLevels[i][0])
      }
      if(_rawLevels[i][4]=="0" || _rawLevels[i][4]=="1"){
        rawLevels.push(_rawLevels[i])
      }
      if(_rawLevels[i][4]=="2" && _rawLevels[i][5]){
        reuploaded.push(_rawLevels[i])
      }
    }


    let tag_header=tags.shift()
    let comp_winners_header=competiton_winners.shift()
    let _tags={}
    let _seperate=[]
    for(let i=0;i<tags.length;i++){
      if(tags[i][2]=="1"){
        _seperate.push(tags[i][0])
      }
      _tags[tags[i][0]]=tags[i][1]
    }

    let seasons_header=_seasons.shift()
    let Seasons=[]
    for(let i=0;i<_seasons.length;i++){
      Seasons.push({
        name:_seasons[i][1],
        startdate:_seasons[i][0]
      })
    }

    for(let i=0;i<_members.length;i++){
      if(_members[i].length==2){
        _members[i].push("")
      } else if(_members[i].length==1){ //so hack
        _members[i].push("")
        _members[i].push("")
      }
    }


    let d=new Date()
    let day = d.getDay();
    let DAY_START=(new Date(d.getFullYear(), d.getMonth(), d.getDate())).getTime()/1000;
    let WEEK_START=(new Date(d.getFullYear(), d.getMonth(), d.getDate() + (day == 0?-6:1)-day )).getTime()/1000;
    let MONTH_START=(new Date(d.getFullYear(), d.getMonth(), 1)).getTime()/1000;
    let json={
      "lastUpdated":ts.gs.lastUpdated,
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
          delete temp.Code
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

function get_slug(){
  console.log(req.headers)
  console.log(req.body)
  let refer=req.headers.referer.split(req.host)[1].split('/')
  //console.log(refer)
}

app.get('/json', async (req, res) => {

  try {
    console.log(req.headers)
    console.log(req.body)
    var ts=get_web_ts(req.body.url_slug)
  } catch(error){
    console.error(error)
    throw error;
  }

  let lastUpdated = ts.gs.lastUpdated
  let json = null;
  if(req.query.lastLoaded==lastUpdated){
    json = "No Updated Needed"
  } else {
    json = await generateSiteJson(ts)
  }

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.send(encodeURIComponent(req.query.callback)+"("+JSON.stringify(json)+")");
});

app.post('/json',async (req,res)=>{
    var ts=null
    console.log(req.body)
    try {
      ts=get_web_ts(req.body.url_slug)
      if(!ts)
        throw "No data found";
    } catch(error){`
      res.send(error)`
      console.error(error)
      return false
    }

    try {
    if(req.body.token){
      req.body.discord_id=await ts.checkBearerToken(req.body.token)
      var user=await ts.get_user(req.body.discord_id)
    }

      console.log(req.body)
      console.log(ts)
      let json = await generateSiteJson(ts,user?user.shelder:false)
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.send(JSON.stringify(json));
    } catch (error){
      console.error(error)
      res.send(ts.getWebUserErrorMsg(error))
    }
})

app.post('/clear',async (req,res)=>{


    try {
      console.log(req.headers)
      console.log(req.body)
      var ts=get_web_ts(req.body.url_slug)
    } catch(error){
      res.send(error)
      console.error(error)
      return false
    }

    try {
      if(req.body.token){
        req.body.discord_id=await ts.checkBearerToken(req.body.token)
        var user=await ts.get_user(req.body.discord_id)
      } else {
        ts.userError("Token was not sent")
      }

      let msg=await ts.clear(req.body)

      await client.channels.get(ts.channels.clearSubmit).send(msg)
      let json = {status:"sucessful",msg:msg}
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.send(JSON.stringify(json));
    } catch (error){
      res.send(ts.getWebUserErrorMsg(error))
    }
})


app.post('/approve',async (req,res)=>{

  try {
    console.log(req.headers)
    console.log(req.body)
    var ts=get_web_ts(req.body.url_slug)
  } catch(error){
    res.send(error)
      console.error(error)
      return false
  }
    try {

      if(req.body.token){
        req.body.discord_id=await ts.checkBearerToken(req.body.token)
        var user=await ts.get_user(req.body.discord_id)
      }

      if(user.shelder!="1"){
        ts.userError("Forbidden")
      }

      //req.body.discord_id=discord_id
      req.body.reason=req.body.comment

      let msg=await ts.approve(req.body)
      let clearmsg=await ts.clear(req.body)

      await client.channels.get(ts.channels.clearSubmit).send(clearmsg)

      json = {status:"sucessful",msg:msg}
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.send(JSON.stringify(json));
    } catch (error){
      res.send(ts.getWebUserErrorMsg(error))
    }
})

app.post('/random',async (req,res)=>{

  try {
    console.log(req.headers)
    console.log(req.body)
    var ts=get_web_ts(req.body.url_slug)
  } catch(error){
      res.send(error)
      console.log(error)
      return false
  }

    try {

      if(req.body.token){
        req.body.discord_id=await ts.checkBearerToken(req.body.token)
        var user=await ts.get_user(req.body.discord_id)
      }




      let rand=await ts.randomLevel(req.body)
      rand.status="sucessful"
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.send(JSON.stringify(rand));
    } catch (error){
      res.send(ts.getWebUserErrorMsg(error))
    }
})

app.post('/feedback',async (req,res)=>{

  try {
    console.log(req.headers)
    console.log(req.body)
    var ts=get_web_ts(req.body.url_slug)
  } catch(error){
    res.send(error)
    console.error(error)
    return false
  }

  try {
    if(req.body.token && req.body.message){
      if(req.body.message.length > 1000){
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.send(JSON.stringify({
          status: "error",
          message: "The supplied message is too long, please keep it lower than 1000 characters!"
        }));
        return;
      }

      req.body.discord_id=await ts.checkBearerToken(req.body.token)

      let ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      let discordId = req.body.discord_id;

      await ts.putFeedback(ip, discordId, config.feedback_salt, req.body.message);

      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.send(JSON.stringify({
        status: "successful"
      }));
    }

    res.send(ts.getWebUserErrorMsg("No valid user was supplied!"));
  } catch (error){
    res.send(ts.getWebUserErrorMsg(error))
  }
})

app.post('/json/login', async (req, res) => {

  try {
    console.log(req.headers)
    console.log(req.body)
    var ts=get_web_ts(req.body.url_slug)
  } catch(error){
    res.send(error)
    console.error(error)
    return false
  }

  try{
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    let returnObj={}

    if(!req.body.otp) ts.userError("No OTP provided")

    let token=await ts.db.Tokens.query()
      .where('token','=',req.body.otp)

    if(token.length){
      token=token[0]
      let tokenExpireAt=moment(token.created_at).add(30,'m').valueOf()
      let now=moment().valueOf()
      if(tokenExpireAt<now)
        ts.userError("The OTP password given is already expired")
      let user=await ts.get_user(token.discord_id);
      let bearer=await ts.login(token.discord_id,token.id)
      returnObj={status:"logged_in",type:"bearer","discord_id":user.discord_id,"token":bearer,"user_info":user}
    } else {
      ts.userError("Your one time password was incorrect. You can DM ShellBot with !login to get another code")
    }

      res.send(JSON.stringify(returnObj))
    } catch (error){
      res.send(ts.getWebUserErrorMsg(error));
    }
});
