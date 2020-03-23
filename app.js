const config = require('./config.json');
const { AkairoClient } = require('discord-akairo');
const TS=require('./TS.js')
const GS=require('./GS.js')
const express = require('express');
const bodyParser = require('body-parser');
const moment = require('moment');
var compression = require('compression')
const db={}
db.Tokens=require('./models/Tokens.js');
db.Plays = require('./models/Plays.js');


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
    await client.login(config.token);
    await app.listen(config.webPort, () => console.log(config.botName+':Web server now listening on '+config.webPort));
   console.log(config.botName+":logged in")

 } catch(error){
  console.error(error)
 }
})();

async function generateSiteJson(isShellder){
  var SheetCache = gs.getArrayFormat([
        "Raw Levels!J",
        "Seasons!B",
        "tags",
        "Competition Winners",
        "Raw Members!C",
        "Points!B"
      ])

    var _rawLevels = SheetCache["Raw Levels"]
    var _seasons = SheetCache["Seasons"]
    var tags = SheetCache["tags"];
    var competiton_winners = SheetCache["Competition Winners"];
    var _members = SheetCache["Raw Members"]
    var _points = SheetCache["Points"]

    var _playedLevels = await db.Plays.query();

    var rawLevels=[_rawLevels[0]];
    var reuploaded=[]
    var pending=[]
    for(var i=1;i<_rawLevels.length;i++){
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


    var tag_header=tags.shift()
    var comp_winners_header=competiton_winners.shift()
    var _tags={}
    var _seperate=[]
    for(var i=0;i<tags.length;i++){
      if(tags[i][2]=="1"){
        _seperate.push(tags[i][0])
      }
      _tags[tags[i][0]]=tags[i][1]
    }

    var seasons_header=_seasons.shift()
    var Seasons=[]
    for(var i=0;i<_seasons.length;i++){
      Seasons.push({
        name:_seasons[i][1],
        startdate:_seasons[i][0]
      })
    }

    for(var i=0;i<_members.length;i++){
      if(_members[i].length==2){
        _members[i].push("")
      } else if(_members[i].length==1){ //so hack
        _members[i].push("")
        _members[i].push("")
      }
    }


    var d=new Date()
    var day = d.getDay();
    var DAY_START=(new Date(d.getFullYear(), d.getMonth(), d.getDate())).getTime()/1000;
    var WEEK_START=(new Date(d.getFullYear(), d.getMonth(), d.getDate() + (day == 0?-6:1)-day )).getTime()/1000;
    var MONTH_START=(new Date(d.getFullYear(), d.getMonth(), 1)).getTime()/1000;
    var json={
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
    if(isShellder){
      //console.log(pending)
      var _comments=gs.select("Shellder Votes")
      //console.log(_comments)
      var comments={}
      for(var i=0;i<_comments.length;i++){
        var currCode=_comments[i].Code
        if(pending.indexOf(currCode)!="-1"){
          if(!comments[currCode]){
            comments[currCode]=[]
          }
          var temp=Object.assign({},_comments[i])
          delete temp.Code
          comments[currCode].push(temp)
        }
      }
      json["shellder"]=true;
      json["shellder_comments"]=comments;
    }
    return json;


}

app.get('/json', (req, res) => {

  var lastUpdated = gs.lastUpdated

  if(req.query.lastLoaded==lastUpdated){
    json = "No Updated Needed"
  } else {
    json = generateSiteJson()
  }

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.send(encodeURIComponent(req.query.callback)+"("+JSON.stringify(json)+")");
});

app.post('/json',async (req,res)=>{
    try {

    if(req.body.token && req.body.discord_id){
      await ts.checkBearerToken(req.body.discord_id,req.body.token)
      var user=ts.get_user(req.body.discord_id)
      //console.log(user)
    }

    /*
      var lastUpdated = gs.lastUpdated
      if(req.body.lastLoaded==lastUpdated){
        json = {status:"No Updated Needed"}
      } else {
        json = {status:"Authenticated",data:generateSiteJson()}
      }
*/
      json = {status:"Authenticated",data:generateSiteJson(user.shelder)}
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.send(JSON.stringify(json));
    } catch (error){
      res.send(ts.getWebUserErrorMsg(error))
    }
})


app.post('/json/login', async (req, res) => {
  try{

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    var returnObj={}
    var user=gs.select("Raw Members",{"Name":req.body.username});
    if(!user)
      ts.userError(encodeURI(req.body.username)+" is not a registered member")

    var token=await db.Tokens.query()
      .where('discord_id','=',user.discord_id)
      .where('token','=',req.body.otp)


    if(token.length){
      token=token[0]
      var tokenExpireAt=moment(token.created_at).add(30,'m').valueOf()
      var now=moment().valueOf()
      if(tokenExpireAt<now)
        ts.userError("The OTP password given is already expired")
      var bearer=await ts.login(user.discord_id,token.id)
      returnObj={status:"logged_in",type:"bearer","discord_id":user.discord_id,"token":bearer}
    } else {
      ts.userError("Your one time password was incorrect. You can DM ShellBot with !login to get another code")
    }

      res.send(JSON.stringify(returnObj))
    } catch (error){
      res.send(ts.getWebUserErrorMsg(error));
    }
});
