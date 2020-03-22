const config = require('./config.json');
const { AkairoClient } = require('discord-akairo');
const TS=require('./TS.js')
const GS=require('./GS.js')
const express = require('express');
var compression = require('compression')


const app = express();
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

app.get('/json', (req, res) => {

  var lastUpdated = gs.lastUpdated

  if(req.query.lastLoaded==lastUpdated){
    json = "No Updated Needed"
  } else {
    var SheetCache = gs.getArrayFormat([
    	  "Raw Levels!J", 
        "Seasons!B",
        "tags",
        "Competition Winners",
        "Raw Played", 
        "Raw Members!C",
        "Points!B"
      ])
    
    var _rawLevels = SheetCache["Raw Levels"]
    var _seasons = SheetCache["Seasons"]
    var tags = SheetCache["tags"];
    var competiton_winners = SheetCache["Competition Winners"];
    var _playedLevels = SheetCache["Raw Played"];
    var _members = SheetCache["Raw Members"]
    var _points = SheetCache["Points"]
    
    
    var rawLevels=[_rawLevels[0]];
    var reuploaded=[]
    for(var i=1;i<_rawLevels.length;i++){
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
      "lastUpdated":lastUpdated,
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
  }

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.send(encodeURIComponent(req.query.callback)+"("+JSON.stringify(json)+")");
});

