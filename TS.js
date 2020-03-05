'use strict'
var TS=function(gs){ //loaded after gs
  
this.valid_format=function(code){
  return /^[0-9A-Z]{3}-[0-9A-Z]{3}-[0-9A-Z]{3}$/.test(code)
}

this.valid_code=function(code){
return /^[1234567890QWERTYUPASDFGHJKLXCVBNM]{3}-[1234567890QWERTYUPASDFGHJKLXCVBNM]{3}-[1234567890QWERTYUPASDFGHJKLXCVBNM]{3}$/.test(code)
}

this.channels={}
this.emotes={}

//hard coded for now. 10.5 and 11 just in case
var validDifficulty=[0.1,0.2,0.3,0.4,0.5,0.6,0.7,0.8,0.9,1,1.1,1.2,1.3,1.4,1.5,1.6,1.7,1.8,1.9,2,2.1,2.2,2.3,2.4,2.5,2.6,2.7,2.8,2.9,3,3.1,3.2,3.3,3.4,3.5,3.6,3.7,3.8,3.9,4,4.1,4.2,4.3,4.4,4.5,4.6,4.7,4.8,4.9,5,5.1,5.2,5.3,5.4,5.5,5.6,5.7,5.8,5.9,6,6.1,6.2,6.3,6.4,6.5,6.6,6.7,6.8,6.9,7,7.1,7.2,7.3,7.4,7.5,7.6,7.7,7.8,7.9,8,8.1,8.2,8.3,8.4,8.5,8.6,8.7,8.8,8.9,9,9.1,9.2,9.3,9.4,9.5,9.6,9.7,9.8,9.9,10,10.5,11,12];
this.valid_difficulty=function(str){ //whack code. 
  for(var i=0;i<validDifficulty.length;i++){
    if(validDifficulty[i]==str) return true
  }
  return false;
}

const static_vars=[
"TeamShell Variable","Points","TeamShell Ranks","Seasons","Emotes","Channels", //static vars
'Raw Members','Raw Levels','Raw Played' //play info
]; //initial vars to be loaded on bot load

var pointMap=null

this.load=async function(){
  pointMap={}
 this.channels={}
 this.emotes={}
 const response=await gs.loadSheets(static_vars) //loading initial sheets
  var _points=gs.select("Points");
  for(var i=0;i<_points.length;i++){
    pointMap[parseFloat(_points[i].Difficulty)]=parseFloat(_points[i].Points)
  }
  var _channels=gs.select("Channels");
  for(var i=0;i<_channels.length;i++){
    this.channels[_channels[i].Name]=_channels[i].value
  }
    var _emotes=gs.select("Emotes");
  for(var i=0;i<_emotes.length;i++){
    this.emotes[_emotes[i].Name]=_emotes[i].value
  }

  console.log("TS Vars loaded")
}

function get_variable(var_name){
  var ret=gs.select("TeamShell Variable",{
    "Variable":var_name
  })
  return ret?ret.Value:false
}

function levelsAvailable(points,levelsUploaded){
  var min=parseFloat(get_variable("Minimum Point"));
  var next=parseFloat(get_variable("New Level"));
  
  var nextLevel=levelsUploaded+1;
  var nextPoints= nextLevel==1? min : min+ (nextLevel-1)*next
  
  points=parseFloat(points);
  
  var pointsDifference=points-nextPoints;
  return pointsDifference
}

this.userError=function(errorStr){
  throw {
    "errorType":"user",
    "msg":errorStr
  }
}
this.getUserErrorMsg=function(obj){
  if(typeof obj=="object" && obj.errorType=="user"){
    return obj.msg+" "+this.emotes.think
  } else {
    console.error(obj)
    return "Something went wrong "+this.emotes.buzzyS
  }
}

this.get_levels=function(isMap){ //get the aggregates
    var clears={}
    gs.select("Raw Played").forEach((played)=>{
      if(!clears[played.Code]) clears[played.Code]={}
      clears[played.Code][played.Player]=played
    })
    var levels=isMap?{}:[]
    gs.select("Raw Levels").forEach((level)=>{
        var tsclears=0;
        var votesum=0;
        var votetotal=0;
        var likes=0;

        if(clears[level.Code]){
          for(var player in clears[level.Code]){
            if(player!=level.Creator){
              if(clears[level.Code][player].Completed=="1"){
                tsclears++;
              }
              if(clears[level.Code][player]["Difficulty Vote"]){
                votetotal++;
                votesum+=Number(clears[level.Code][player]["Difficulty Vote"])
              }
              if(clears[level.Code][player].Liked){
                likes++;
              }
            }
          }
        }
        level.clears=tsclears //no. of clears
        level.vote=votetotal>0? ((votesum/votetotal).toFixed(1)):0 //avg vote, num votes
        level.votetotal=votetotal
        level.likes=likes
        if(isMap){
          levels[level.Code]=level
        } else {
          levels.push(level)  
        }
    })
    return levels
}

this.get_rank=function(points){
  var point_rank=gs.select("TeamShell Ranks")
  for(var i=point_rank.length-1;i>=0;i--){
    if(parseFloat(points)>=parseFloat(point_rank[i]["Min Points"])){
      return point_rank[i]
    }
  }
  return false
}

this.calculatePoints=function(user,if_remove_check){ //delta check is to see if we can add a level if we remove it
   var currentLevels = gs.select("Raw Levels");
   var levelMap={};
   var ownLevels=[];
   var reuploads={};
   for (var row = currentLevels.length-1; row >=0 ; row--) {
     if(currentLevels[row].Approved=="1"){
       if(currentLevels[row].Creator==user){
         ownLevels.push(currentLevels[row].Code)
       } else {
         levelMap[currentLevels[row].Code]=pointMap[parseFloat(currentLevels[row].Difficulty)]  
       }
     } else if(currentLevels[row].Approved=="2") { //reupload
       if(currentLevels[row].Creator==user){
         //reuploads don't count for self
       } else {
         if(currentLevels[row].NewCode){
           reuploads[currentLevels[row].Code]=currentLevels[row].NewCode
           levelMap[currentLevels[row].Code]=pointMap[parseFloat(currentLevels[row].Difficulty)]
         }
       }
     } else if((currentLevels[row].Approved==null || currentLevels[row].Approved=="" || currentLevels[row].Approved=="0") && currentLevels[row].Creator==user){
       ownLevels.push(currentLevels[row].Code)
     }
      
   }
  
   var playedLevels = gs.select("Raw Played",{
      "Player":user,
      "Completed":"1"
   })
  
   var userCleared={};
   for (var row = 0; playedLevels && row < playedLevels.length; row++){
       var id= reuploads[playedLevels[row].Code] ? reuploads[playedLevels[row].Code] : playedLevels[row].Code
       userCleared[id]= Math.max( userCleared[id]?userCleared[id]:0, levelMap[playedLevels[row].Code] )
   }
  
  var clearPoints=0;
  for(var id in userCleared){
    if(userCleared[id]) clearPoints+=userCleared[id]
  }

   
  var ownLevelNumbers=ownLevels.length + (if_remove_check?-1:0) //check if can upload a level if we removed one. for reuploads
  return {
    clearPoints:clearPoints.toFixed(1),
    levelsMade:ownLevels.length,
    available:levelsAvailable(clearPoints,ownLevelNumbers),
  }
}


}

module.exports=TS