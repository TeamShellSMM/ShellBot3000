const config = require('./config.json');
const { AkairoClient } = require('discord-akairo');
const TS=require('./TS.js')
const GS=require('./GS.js')
const express = require('express');
const bodyParser = require('body-parser');
const moment = require('moment');
const compression = require('compression')

global.db={}
db.Tokens=require('./models/Tokens.js');
db.Plays = require('./models/Plays.js');
db.PendingVotes = require('./models/PendingVotes.js');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(compression())

if(config.json_dev){
  app.use("/dev", express.static(__dirname + '/json_dev.html'));
}

const client = new AkairoClient(config, { //not sure this is a good idea or not
    disableEveryone: true
});
global.gs=new GS(config); //not sure if this is a good idea or not
global.ts=new TS(gs,client);

(async () => { //main thread
  try {
    await ts.load()
    await client.login(config.discord_access_token);
    await app.listen(config.webPort, () => console.log(config.botName+':Web server now listening on '+config.webPort));
   console.log(config.botName+":logged in")

 } catch(error){
  console.error(error)
 }
})();

async function generateSiteJson(isShellder){
  const SheetCache = gs.getArrayFormat([
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

    let _playedLevels = await db.Plays.query();

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
      "lastUpdated":gs.lastUpdated,
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
    
      let _comments=await db.PendingVotes.query().where("is_shellder",1)
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

app.get('/json', async (req, res) => {

  let lastUpdated = gs.lastUpdated
  let json = null;
  if(req.query.lastLoaded==lastUpdated){
    json = "No Updated Needed"
  } else {
    json = await generateSiteJson()
  }

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.send(encodeURIComponent(req.query.callback)+"("+JSON.stringify(json)+")");
});

app.post('/json',async (req,res)=>{
    try {
    if(req.body.token){
      req.body.discord_id=await ts.checkBearerToken(req.body.token)
      var user=await ts.get_user(req.body.discord_id)
    }
      json = await generateSiteJson(user?user.shelder:false)
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.send(JSON.stringify(json));
    } catch (error){
      res.send(ts.getWebUserErrorMsg(error))
    }
})

app.post('/clear',async (req,res)=>{
    try {
      if(req.body.token){
        req.body.discord_id=await ts.checkBearerToken(req.body.token)
        var user=await ts.get_user(req.body.discord_id)
      } else {
        ts.userError("Token was not sent")
      }
      
      let msg=await ts.clear(req.body)

      await client.channels.get(ts.channels.clearSubmit).send(msg)
      json = {status:"sucessful",msg:msg}
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.send(JSON.stringify(json));
    } catch (error){
      res.send(ts.getWebUserErrorMsg(error))
    }
})


app.post('/approve',async (req,res)=>{
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



app.post('/json/login', async (req, res) => {
  try{
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    let returnObj={}

    if(!req.body.otp) ts.userError("No OTP provided")

    let token=await db.Tokens.query()
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
