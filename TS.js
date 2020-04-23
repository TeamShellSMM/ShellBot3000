'use strict'
const stringSimilarity = require('string-similarity')
const Handlebars = require("handlebars");
const crypto=require('crypto')
const moment=require('moment')
const server_config = require('./config.json');
const GS=require("./GS.js");
const TS=function(guild_id,config,client){ //loaded after gs
  const ts=this
  this.gs=new GS(config)
  this.db={}
  this.db.Tokens=require('./models/Tokens.js')
  this.db.Plays = require('./models/Plays.js')(guild_id);
  this.db.PendingVotes = require('./models/PendingVotes.js')(guild_id);


  this.load=async function(){
    
    ts.gs.clearCache();
    let guild=await ts.getGuild()

    
    const defaultVars = {
      customStrings:{ //defaults
        "levelInfo":"@@LEVEL_PLACEHOLDER@@",
        "teamurl": server_config.page_url+"/"+config.url_slug,
        "BotName":"ShellBot3000",
      },
      emotes:{},
    }
    guild.emojis.forEach((e)=>{
      defaultVars.emotes[e.name]=e.toString()
    });

    const static_vars=[
      "TeamSettings","Points",
      "Ranks","Seasons",
      "Emotes","Channels","tags",
      "CustomString","Messages",
      "Competition Winners", //static vars
      'Raw Members','Raw Levels' //play info
      ]; //initial vars to be loaded on bot load

      await ts.gs.loadSheets(static_vars) //loading initial sheets

      this.pointMap={}
      var _points=ts.gs.select("Points");
      for(let i=0;i<_points.length;i++){
        this.pointMap[parseFloat(_points[i].Difficulty)]=parseFloat(_points[i].Points)
      }

      let sheetToMap={
        channels:'Channels',
        emotes:'Emotes',
        customStrings:'CustomString',
        teamVariables:'TeamSettings',
      }

      for(let key in sheetToMap){
        this[key]={...defaultVars[key]}
        ts.gs.select(sheetToMap[key]).forEach(v=>{
          this[key][v.Name]=v.value?v.value:'';
        });
      }

      this.messages={}
      ts.gs.select("Messages").forEach((v)=>{
        this.messages[v.Name]=_makeTemplate(v.value||'')
      });

      for(var i in DEFAULTMESSAGES){
        if(this.messages[i] === undefined){ 
          this.messages[i]=_makeTemplate(DEFAULTMESSAGES[i])
        }
      }

      console.log(`Data loaded for ${this.teamVariables.TeamName}`)
  }

  /* template and string */
  function _makeTemplate(template){
    var template =Handlebars.compile(template)
    return function(args){
      if(!args) args={}
      let obj={...ts.emotes,...ts.customStrings,...ts.teamVariables,...args}
      return template(obj);
    }
  }

  this.message=function(type,args){
    if(this.messages[type]){
      return this.messages[type](args)
    }
    throw `"${type}" message string was not found in ts.message`;
  }



  this.getGuild=function(){
    return client.guilds.get(guild_id)
  }

  this.valid_format=function(code){
    return /^[0-9A-Z]{3}-[0-9A-Z]{3}-[0-9A-Z]{3}$/.test(code.toUpperCase())
  }

  this.generateOtp=async function(discord_id){
    let newOtp=crypto.randomBytes(8).toString('hex').toUpperCase()
    let existing=await ts.db.Tokens.query().where({token:newOtp}) //need to add check for only within expiry time (30 minutes)
    while(!existing){
      newOtp=crypto.randomBytes(8).toString('hex').toUpperCase()
      existing=await ts.db.Tokens.query().where({token:newOtp})
    }
    await ts.db.Tokens.query().insert({
      discord_id:discord_id,
      token:newOtp,
    })
    return newOtp
  }

  this.login=async function(discord_id,row_id){
    let bearer=crypto.randomBytes(16).toString('hex').toUpperCase()
    let existing=await ts.db.Tokens.query().where({token:bearer}) //need to add check for only within expiry time (30 minutes)
    while(!existing){
      bearer=crypto.randomBytes(16).toString('hex').toUpperCase()
      existing=await ts.db.Tokens.query().where({token:bearer})
    }
    await ts.db.Tokens.query()
    .findById(row_id)
    .patch({
      token: bearer,
      authenticated:1
    });
    await client.guilds.get(guild_id).members.get(discord_id).send(ts.message("website.loggedin"))
    return bearer
  }

  this.checkBearerToken=async function(token){
    token=await ts.db.Tokens.query().where('token','=',token).first()
    if(token){
      const tokenExpireAt=moment(token.created_at).add(30,'days').valueOf()
      const now=moment().valueOf()
      if(tokenExpireAt<now)
        ts.userError(ts.message("website.tokenError"))
    } else {
        ts.userError(ts.message("website.authError"))
    }
    return token.discord_id
  }


  this.valid_code=function(code){
    if(code==null) return false;
    return /^[1234567890QWERTYUPASDFGHJKLXCVBNM]{3}-[1234567890QWERTYUPASDFGHJKLXCVBNM]{3}-[1234567890QWERTYUPASDFGHJKLXCVBNM]{3}$/.test(code.toUpperCase())
  }

  this.getEmoteUrl=function(emote){
    if(!emote) return ""
    let id=emote.split(":")[2].slice(0,-1)
    return "https://cdn.discordapp.com/emojis/"+id+"?v=100"
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

  this.pointMap=null

  this.levelRemoved=function(level){
    return !level || level && level.Approved!="0" && level.Approved!="1"
  }

  this.isReupload=async function(code){
    let reuploads=ts.gs.select("Raw Levels",{
      "NewCode":code
    })
    if(reuploads.length===0) return false

    let isFixStatus=false;
    let hasBeenApproved=false;
    reuploads=reuploads.map( o =>{
      if(o.Approved==="-10"){
        isFixStatus=true;
      }
      if(o.Approved==="1"){
        hasBeenApproved=true
      }
      return o.Code;
    })
    return {
      "reupload":true,
      "isFixStatus":isFixStatus,
      "hasBeenApproved":hasBeenApproved,
      "codes":reuploads
    }
  }

  this.creator_str=function(level){
    var creator=ts.gs.selectOne("Raw Members",{"Name":level.Creator});
    if(creator && creator.atme=="1" && creator.discord_id){
      return "<@"+creator.discord_id+">"
      } else {
      return level.Creator
      }
  }

  this.embedAddLongField=function(embed,header,body){
    if(!header) header="\u200b"
    var bodyArr=body?body.split("."):[]
    var bodyStr=[""];
    for(var k=0,l=0;k<bodyArr.length;k++){
      if(bodyArr[k]){
      if( (bodyStr[l].length+bodyArr[k].length+1) > 980 ){
        l++
        bodyStr[l]=""
      }
        bodyStr[l]+=bodyArr[k]+"."
      }
    }
    for(var k=0;k<bodyStr.length;k++){
      embed.addField(header,bodyStr[k]);
      header = "\u200b"
    }
  }

  function argToStr(str){
    return (str==null?'':str+'').toLowerCase()

  }

  this.clear=async function(args,strOnly){
      args.code=args.code.toUpperCase();

      args.like=argToStr(args.like)
      args.difficulty=argToStr(args.difficulty)
      args.completed=argToStr(args.completed)


      if(args.like==="like"){
        args.like="1"
      }

      if(args.like=="unlike"){
        args.like="0"
      }

      if(args.difficulty=="like"){
        args.difficulty=''
        args.like="1"
      }

      if(args.difficulty=="unlike"){
        args.difficulty=''
        args.like="0"
      }
      
      if(args.difficulty!=="0" && args.difficulty && !ts.valid_difficulty(args.difficulty)){
        ts.userError(ts.message("clear.invalidDifficulty"));
      }
      
      if(!args.discord_id)
        ts.userError(ts.message("clear.discordId"))

      await ts.gs.loadSheets(["Raw Members","Raw Levels"]);
      const player=await ts.get_user(args.discord_id);
      var level=ts.getExistingLevel(args.code);
      if(level.Creator==player.Name)
        ts.userError(ts.message("clear.ownLevel"));

      var existing_play = await ts.db.Plays.query()
        .where('code','=',args.code)
        .where('player','=',player.Name)
        .first();

      var creator=ts.gs.selectOne("Raw Members",{"Name":level.Creator}); //oddface/taika is only non registered member with a level
      if(creator && creator.atme=="1" && creator.discord_id && !strOnly){
      var creator_str="<@"+creator.discord_id+">"
      } else {
      var creator_str=level.Creator
      }

      var msg=[],updated={}
      if(existing_play){
        var updated_row={}
        if(
            ["1","0"].includes(args.completed) &&
            (""+existing_play.completed)!==args.completed
          ){ //update completed
          updated_row.completed=args.completed;
          updated.completed=1
        }
        if(
          ["1","0"].includes(args.like) &&
          (""+existing_play.liked)!==args.like
        ){ //like updated
          updated_row.liked=args.like;
          updated.liked=1
        }
        if(
          (args.difficulty || args.difficulty==="0" ) &&
          ( (""+existing_play.difficulty_vote)!==args.difficulty )
        ){ //difficulty update
          updated_row.difficulty_vote=args.difficulty==="0"?null:args.difficulty; //0 difficulty will remove your vote
          updated.difficulty=1
        }
        await ts.db.Plays.query().findById(existing_play.id).patch(updated_row);

      } else {
        await ts.db.Plays.query().insert({
          "code":args.code,
          "player":player.Name,
          "completed": args.completed?1:0,
          "is_shellder":player.shelder,
          "liked":args.like?1:0,
          "difficulty_vote":args.difficulty==="0" ? null:args.difficulty
        });
        if(args.completed!=='') updated.completed=1;
        if(args.like!=='') updated.liked=1;
        if(args.difficulty!=='') updated.difficulty=1;
      }


        if(updated.completed){
          if(args.completed==="0"){
            msg.push(ts.message("clear.removedClear",{level}))
          } else {
            msg.push(ts.message("clear.addClear",{level}))
            if(level.Approved=="1"){
              msg.push(ts.message("clear.earnedPoints",{
                earned_points:this.pointMap[parseFloat(level.Difficulty)],
              }))
            } else {
              msg.push(ts.message("clear.pendingLevel"))
            }
          }
        } else if(args.completed || args.completed==="0"){
          msg.push(args.completed==="0"?
            ts.message("clear.alreadyUncleared"):
            ts.message("clear.alreadyCleared")
          )
        }

        if(updated.difficulty){
          msg.push(args.difficulty==="0"?
            ts.message("clear.removeDifficulty",{ level }):
            ts.message("clear.addDifficulty",{
              level:level,
              difficulty_vote:args.difficulty,
            })
          )
        } else if(args.difficulty || args.difficulty==="0" ){
          msg.push(args.difficulty==="0"?
            ts.message("clear.alreadyDifficulty",{ level }):
            ts.message("clear.alreadyNoDifficulty",{
              level:level,
              difficulty_vote:args.difficulty,
            })
          )
        }

        if(updated.liked){
          msg.push(args.like==="0"?
          ts.message("clear.removeLike",{ level }):
          ts.message("clear.addLike",{ level })
          )
        } else if(args.like || args.like==="0" ){
          msg.push(args.like==="0"?
            ts.message("clear.alreadyLiked",{ level }):
            ts.message("clear.alreadyUnliked",{ level })
          )
        }


      var level_placeholder=this.customStrings["levelInfo"]
      var level_str=ts.message("clear.levelInfo",{ level , creator:creator_str })

      var singleHave=ts.message("clear.singleHave")
      var manyHave=ts.message("clear.manyHave")
      var levelPronoun=ts.message("clear.levelPronoun")
      for(var i=0;i<msg.length;i++){
        if(msg[i]){
          msg[i]=msg[i].replace(level_placeholder,level_str)
          if(i>1) msg[i]=msg[i].replace(singleHave,manyHave);
          level_str=levelPronoun
        }
      }

      return (strOnly?"":player.user_reply+"\n")+msg.join("\n");
  }

  this.getExistingLevel=function(code,includeRemoved=false){
    var level=ts.gs.selectOne("Raw Levels",{"Code":code})
    if(!level){ //level doesn't exist
      let notDeletedLevels={}
      let allLevels={}
      ts.gs.select("Raw Levels").forEach((level)=>{
        if(level && (level.Approved=="0" || level.Approved=="1")){
          notDeletedLevels[level.Code]=level.Code+" - \""+level["Level Name"]+"\" by "+level.Creator
        }
        allLevels[level.Code]=level.Code+" - \""+level["Level Name"]+"\" by "+level.Creator
      })
      let listUsed=includeRemoved?allLevels:notDeletedLevels
      const match=stringSimilarity.findBestMatch(code,Object.keys(listUsed))
      if(match.bestMatch && match.bestMatch.rating>=0.6){
        var matchStr=" Did you mean:```\n"+listUsed[match.bestMatch.target]+"```"
      } else {
        var matchStr=""
      }

      
      ts.userError(ts.message("error.levelNotFound", { code })+matchStr);
    }
    if(!includeRemoved && !(level.Approved==0 || level.Approved==1)){ //level is removed. not pending/accepted
      if(level.Approved==-10){
        ts.userError(ts.message("error.levelIsFixing",{ level }));
      }
      ts.userError(ts.message("error.levelIsRemoved",{ level }));
    }
    return level
  }

  this.get_variable=function(var_name){
    return this.teamVariables[var_name]
  }

  this.levelsAvailable=function(points,levelsUploaded,freeLevels){
    var min=parseFloat(this.get_variable("Minimum Point"));
    var next=parseFloat(this.get_variable("New Level"));

    var nextLevel=levelsUploaded+1-(freeLevels?freeLevels:0);
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
  this.getUserErrorMsg=function(obj,message){
    if(typeof obj=="object" && obj.errorType=="user"){
      return obj.msg+ts.message("error.afterUserDiscord")
    } else {
      console_error({
        error:obj.stack?obj.stack:obj,
        url_slug:this.config.url_slug,
        content:message.content,
        user:message.author.username,
        channel:"<#"+message.channel.id+">"
      })
      return ts.message("error.unknownError")
    }
  }

  this.getWebUserErrorMsg=function(obj){
    if(typeof obj=="object" && obj.errorType=="user"){
      return { status:"error", message:obj.msg+ts.message("error.afterUserWeb") }
    } else {
      console_error({
        error:obj.stack?obj.stack:obj,
        url_slug:this.config.url_slug
      })
      return { status:"error", message:ts.message("error.unknownError")}
    }
  }

  function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
  }

  
  this.randomLevel=async function(args){
    if(args.minDifficulty && !ts.valid_difficulty(args.minDifficulty)){
      ts.userError(args.maxDifficulty? ts.message("random.noMinDifficulty") : ts.message("random.noDifficulty"))
    }

    if(args.maxDifficulty){
      if(!ts.valid_difficulty(args.maxDifficulty))
        ts.userError(ts.message("random.noMaxDifficulty"))
    } else {
      if(args.minDifficulty){
        args.maxDifficulty=args.minDifficulty
      }
    }

    if(parseFloat(args.minDifficulty)>parseFloat(args.maxDifficulty)){
      let temp=args.maxDifficulty
      args.maxDifficulty=args.minDifficulty
      args.minDifficulty=temp
    }

    await ts.gs.loadSheets(["Raw Members","Raw Levels"]);
    const player=args.discord_id!=null? await ts.get_user(args.discord_id) : null
    let players=null;
    if(args.players){
      let rawPlayers=ts.gs.select("Raw Members").map( p => {
        return p.Name
      });
      players=args.players.split(",")
      players.forEach( p => {
        if(rawPlayers.indexOf(p) === -1)
          ts.userError(ts.message("random.playerNotFound",{player:p}))
      })
    } else {
      players=[player.Name]
    }

    //console.time("get levels")
    var allLevels=await ts.get_levels()
    let levels={}
    if(player){
      allLevels=allLevels.filter((l)=>{
        return players.indexOf(l.Creator)===-1
      })
    }
    allLevels.forEach(o=>{
      levels[o.Code]=o
    })
    //const levels=await ts.get_levels(true) //get levels with aggregates and stats
    var difficulties=[]
    var played=[];


    //console.time("get plays")
    if(player){
      var plays = await ts.db.Plays.query()
        .whereIn('player', players)
        .where('completed', 1);
      //console.timeEnd("get plays")


      //console.time("process plays")
      plays.forEach((clear)=>{
        const level=levels[clear.code]
        if(level && level.Approved=="1" && level.Creator!=player.Name){
          played.push(level.Code)
          difficulties.push(level.Difficulty)
        }
        if(level && players.indexOf(level.Creator)!==-1){
          played.push(level.Code)
        }
      })
    }
    //console.timeEnd("process plays")


    //console.time("process difficulties")
    if(args.minDifficulty){
      var min=args.minDifficulty
      var max=args.maxDifficulty
    } else {
      if(difficulties.length>0){
        var middle=(difficulties.length-1)/2
        difficulties.sort(function(a,b){
          return parseFloat(a)-parseFloat(b)
        })
        var min=difficulties[Math.floor(middle)]
        var max=difficulties[difficulties.length-1]
      } else {
        var min=0.5
        var max=1
      }
    }
    //console.timeEnd("process difficulties")

    min=parseFloat(min)
    max=parseFloat(max)

    //console.time("getting the range of levels")

    //var filtered_levels=[]
    if(allLevels){
    var filtered_levels=allLevels.filter((level)=>{
        var currDifficulty=parseFloat(level.Difficulty)
        return level.Approved=="1" &&
          currDifficulty>=min &&
          currDifficulty<=max
          && played.indexOf(level.Code)==-1
          && level.Tags.indexOf("Consistency") === -1
          && level.Tags.indexOf("Practice") === -1
      })
    } else {
      throw ts.message("error.emptyLevelList")
    }
    //console.timeEnd("getting the range of levels")

    //console.time("sorting levels")
    filtered_levels.sort(function(a,b){
      return parseFloat(a.likes)-parseFloat(b.likes)
    })
    //console.timeEnd("sorting levels")
    if(filtered_levels.length==0){
      ts.userError(ts.message("random.outOfLevels",{
        range:(min==max?min:min+"-"+max)
      }))
    }

    //console.time("rolling dice")
    var borderLine=Math.floor(filtered_levels.length*0.6)
    if(Math.random()<0.2){
      var randNum=getRandomInt(0,borderLine)
    } else {
      var randNum=getRandomInt(borderLine,filtered_levels.length)
    }
    var level=filtered_levels[randNum]
    return {
      player:player,
      level:level
    }
  }


  this.get_user= async function(message){
    var discord_id=typeof message=="string"?message:message.author.id
    var player=ts.gs.selectOne("Raw Members",{
      "discord_id":discord_id
    })

    if(!player)
      ts.userError(ts.message("error.notRegistered"));

    if(player.banned)
      ts.userError(ts.message("error.userBanned"));

    player.earned_points= await this.calculatePoints(player.Name);
    player.rank=this.get_rank(player.earned_points.clearPoints);
    player.user_reply="<@"+discord_id+">" + (player.rank.Pips ? player.rank.Pips : "") + " ";
    return player
  }

  this.makeVoteEmbed=async function(level){
    var approveVotes = await ts.db.PendingVotes.query().where("code",level.Code).where("is_shellder",1).where("type","approve");
    var fixVotes = await ts.db.PendingVotes.query().where("code",level.Code).where("is_shellder",1).where("type","fix");
    var rejectVotes = await ts.db.PendingVotes.query().where("code",level.Code).where("is_shellder",1).where("type","reject");

    var voteEmbed=ts.levelEmbed(level)
        .setAuthor(ts.message("approval.judgementBegin"));

    if(ts.emotes.judgement){
      voteEmbed.setThumbnail(ts.getEmoteUrl(ts.emotes.judgement));
    }

      var postString = ts.message("approval.approvalVotes");
      if(approveVotes == undefined || approveVotes.length == 0){
        postString += ts.message("approval.noVotes");
      } else {
        for(var i = 0; i < approveVotes.length; i++){
          const curShellder = ts.gs.selectOne("Raw Members",{"Name":approveVotes[i].player});
          postString += "<@" + curShellder.discord_id + "> - Difficulty: " + approveVotes[i].difficulty_vote + ", Reason: " + approveVotes[i].reason + "\n";
        }
      }

      postString += ts.message("approval.fixVotes");
      if(fixVotes == undefined || fixVotes.length == 0){
        postString += "> None\n";
      } else {
        for(var i = 0; i < fixVotes.length; i++){
          const curShellder = ts.gs.selectOne("Raw Members",{"Name":fixVotes[i].player});
          postString += "<@" + curShellder.discord_id + "> - Difficulty: " + fixVotes[i].difficulty_vote + ", Requested fixes: " + fixVotes[i].reason + "\n";
        }
      }

      postString += ts.message("approval.rejectVotes");

      if(rejectVotes == undefined || rejectVotes.length == 0){
        postString += "None\n";
      } else {
        for(var i = 0; i < rejectVotes.length; i++){
          const curShellder = ts.gs.selectOne("Raw Members",{"Name":rejectVotes[i].player});
          postString += "<@" + curShellder.discord_id + "> - Reason: " + rejectVotes[i].reason + "\n";
        }
      }

      ts.embedAddLongField(voteEmbed,"",postString)
      return voteEmbed
  }

  this.makePendingReuploadEmbed=async function(level, author, refuse, alreadyApprovedMessage){
    var fixVotes = await ts.db.PendingVotes.query().where("code",level.Code).where("is_shellder",1).where("type","fix");

    var voteEmbed=ts.levelEmbed(level);

    if(alreadyApprovedMessage){
      //If we got a level we already approved before we just build a mini embed with the message
      voteEmbed.setAuthor(ts.message("pending.pendingTitle"))
      .setDescription(ts.message("pending.alreadyApprovedBefore"))
      .addField(author.Name + ":", alreadyApprovedMessage);
      return voteEmbed;
    }

    if(refuse){
        voteEmbed.setAuthor(ts.message("pending.refuseTitle"))
        .setDescription(ts.message("pending.refuseDescription"))
    } else {
      voteEmbed.setAuthor(ts.message("pending.reuploadedTitle"))
      .setDescription(ts.message("pending.fixReuploadDescription"))
    }
    if(ts.emotes.judgement){
      voteEmbed.setThumbnail(ts.getEmoteUrl(ts.emotes.judgement));
    }

    let postString = ts.message("approval.fixVotes");
    if(fixVotes == undefined || fixVotes.length == 0){
      postString += "> None\n";
    } else {
      for(var i = 0; i < fixVotes.length; i++){
        const curShellder = ts.gs.selectOne("Raw Members",{"Name":fixVotes[i].player});
        postString += "<@" + curShellder.discord_id + "> - Difficulty: " + fixVotes[i].difficulty_vote + ", Requested fixes: " + fixVotes[i].reason + "\n";
      }
    }

    ts.embedAddLongField(voteEmbed,"",postString)
    return voteEmbed
  }

  this.approve=async function(args){
      //Check if vote already exists
      await ts.gs.loadSheets(["Raw Levels", "Raw Members"]);
      const shellder=await ts.get_user(args.discord_id);
      var vote=await ts.db.PendingVotes.query().where("code",args.code).where("player",shellder.Name).first();

      if(!vote){
        //We only check reason if we have no vote yet
        if(!args.reason){
          ts.userError(ts.message("approval.changeReason"));
        }
      }

      const level=ts.getExistingLevel(args.code);
      const author = ts.gs.selectOne("Raw Members",{"Name":level.Creator});

      if(!author){
        ts.userError(ts.message("approval.creatorNotFound"));
      }

      //Check if level is approved, if it's approved only allow rejection
      if(level.Approved === "1"){
        if(args.type === "approve"){
          ts.userError(ts.message("approval.levelAlreadyApproved"));
        }
      } else if(level.Approved === "0"){
        //I don't care that this is empty, I can't be arsed anymore to think how to structure this if
      } else {
        ts.userError(ts.message("approval.levelNotPending"));
      }


      //Add/Update Approval/Rejection to new sheet 'shellder votes?' + difficulty + reason
      var updating = false;
      if(!vote){
        await ts.db.PendingVotes.query().insert({
          code: level.Code,
          is_shellder: 1, //to be changed to member value?
          player: shellder.Name,
          type: args.type,
          difficulty_vote: (args.type=== "approve" || args.type == "fix") ? args.difficulty : "",
          reason: args.reason
        });
      } else {
        updating = true;
        var updateJson = {
          "type": args.type
        }
        if(args.reason){
          updateJson.reason = args.reason;
        }
        if(args.difficulty){
          updateJson.difficulty_vote = args.difficulty;
        }
        var updateVote = await ts.db.PendingVotes.query().findById(vote.id).patch(updateJson);
      }


      //generate judgement embed
      var overviewMessage;
      var discussionChannel;

      let guild=this.getGuild()

      discussionChannel = guild.channels.find(channel => channel.name === level.Code.toLowerCase() && channel.parent.id == ts.channels.levelDiscussionCategory); //not sure should specify guild/server

      if(!discussionChannel){
        //Create new channel and set parent to category
        if(guild.channels.get(ts.channels.levelDiscussionCategory).children.size===50){
          ts.userError(ts.message("approval.tooManyDiscussionChannels"))
        }
        discussionChannel = await guild.createChannel(args.code, {
          type: 'text',
          parent: guild.channels.get(ts.channels.levelDiscussionCategory)
        });
        //Post empty overview post
        overviewMessage = await discussionChannel.send("**The Judgement for '" + level["Level Name"] + " (" + level.Code + ") by <@" + author.discord_id + ">' has now begun!**\n\n> Current Votes for approving the level:\n> None\n\n> Current votes for rejecting the level:\n> None");
        overviewMessage = await overviewMessage.pin();
      }

      var voteEmbed=await ts.makeVoteEmbed(level)

      if(!overviewMessage){
        overviewMessage = (await discussionChannel.fetchPinnedMessages()).last();
      }

      await overviewMessage.edit(voteEmbed);

      var replyMessage = "";
      if(updating){
        replyMessage += ts.message("approval.voteChanged",{channel_id:discussionChannel.id})
      } else {
        replyMessage += ts.message("approval.voteAdded",{channel_id:discussionChannel.id})
      }
      return replyMessage
  }


  this.judge=async function(levelCode, fromFix = false){
    var guild=this.getGuild()
    await ts.gs.loadSheets(["Raw Levels", "Raw Members"]);
    var level;
    if(fromFix){
      level = ts.gs.selectOne("Raw Levels",{"Code":levelCode});
    } else {
      level = ts.getExistingLevel(levelCode);
    }
    const author = ts.gs.selectOne("Raw Members",{"Name":level.Creator});

    if(!author){
      ts.userError(ts.message("approval.creatorNotFound"))
    }

    //Get all current votes for this level
    var approvalVotes = await ts.db.PendingVotes.query().where("code",levelCode).where("is_shellder",1).where("type","approve");
    var fixVotes = await ts.db.PendingVotes.query().where("code",levelCode).where("is_shellder",1).where("type","fix");
    var rejectVotes = await ts.db.PendingVotes.query().where("code",levelCode).where("is_shellder",1).where("type","reject");
    var allComments = [...approvalVotes, ...fixVotes, ...rejectVotes];
    var fixComments = [...fixVotes, ...rejectVotes];

    //Count Approval and Rejection Votes
    var approvalVoteCount = approvalVotes.length + fixVotes.length;
    var fixVoteCount = fixVotes.length;
    var rejectVoteCount = rejectVotes.length;

    let fixMode = false;

    if(rejectVoteCount >= ts.get_variable("VotesNeeded") && rejectVoteCount>approvalVoteCount){
      //Reject level
      var updateLevel = ts.gs.query("Raw Levels", {
        filter: {"Code":levelCode},
        update: {"Approved": -2}
      });
      if(updateLevel.Code == levelCode){
        await ts.gs.batchUpdate(updateLevel.update_ranges);
      }

      //Build embed
      var color="#dc3545",title;
      if(level.Approved==="0"){
        title=ts.message("judge.levelRejected")
      } else {
        title=ts.message("judge.levelRemoved")
      }
      if(this.emotes.axemuncher){
        var image=this.getEmoteUrl(this.emotes.axemuncher);
      }

    } else if (approvalVoteCount >= ts.get_variable("VotesNeeded")  && approvalVoteCount>rejectVoteCount && fixVoteCount > 0 && level.Approved !== "-10") {
      if(level.Approved !== "0")
        ts.userError(ts.message("approval.levelNotPending"))

      //We set the level approval status to -10 aka requested fix
      var updateLevel = ts.gs.query("Raw Levels", {
        filter: {"Code":levelCode},
        update: {
          "Approved": "-10"
        }
      });
      if(updateLevel.Code == levelCode){
        await ts.gs.batchUpdate(updateLevel.update_ranges);
      }

      var color="#D68100";
      var title=ts.message("approval.fixPlayerInstructions");
      if(this.emotes.think){
        var image=this.getEmoteUrl(this.emotes.think);
      }

      fixMode = true;
    } else if (approvalVoteCount >= ts.get_variable("VotesNeeded")  && approvalVoteCount>rejectVoteCount ){
      if(level.Approved !== "0" && level.Approved !== "-10")
        ts.userError(ts.message("approval.levelNotPending"))
        //Get the average difficulty and round to nearest .5, build the message at the same time
        var diffCounter = 0;
        var diffSum = 0;
        for(var i = 0; i < approvalVotes.length; i++){
          var diff = parseFloat(approvalVotes[i].difficulty_vote);
          if(!Number.isNaN(diff)){
            diffCounter++;
            diffSum += diff;
          }
        }
        for(var i = 0; i < fixVotes.length; i++){
          var diff = parseFloat(fixVotes[i].difficulty_vote);
          if(!Number.isNaN(diff)){
            diffCounter++;
            diffSum += diff;
          }
        }

        var finalDiff = Math.round((diffSum/diffCounter)*2)/2;

        //Only if the level is pending we approve it and send the message
        var updateLevel = ts.gs.query("Raw Levels", {
          filter: {"Code":levelCode},
          update: {
            "Approved": "1",
            "Difficulty": finalDiff
          }
        });
        if(updateLevel.Code == levelCode){
          await ts.gs.batchUpdate(updateLevel.update_ranges);
        }

        //Update author to set cult_member if they're not already. send initiate message and assign cult role
        if(author.cult_member !== "1"){
          var updateAuthor = ts.gs.query("Raw Members", {
            filter: {"Name":author.Name},
            update: {
              "cult_member": "1"
            }
          });

          if(updateAuthor.Name == author.Name){
            await ts.gs.batchUpdate(updateAuthor.update_ranges); //should combine the batch updates
            if(author.discord_id){
              var curr_user=await guild.members.get(author.discord_id)
              if(curr_user){ //assign role
                await curr_user.addRole(ts.teamVariables.memberRoleId)
                  await client.channels.get(ts.channels.initiateChannel).send(ts.message("initiation.message",{discord_id:author.discord_id}))
              } else {
                console_error(ts.message("initiation.userNotInDiscord",{name:author.Name})) //not a breaking error.
              }
            }
          }
        }

        //Build Status Message
        var color="#01A19F";
        var title=ts.message('judge.approved',{difficulty:finalDiff});
        if(this.emotes.bam){
          var image=this.getEmoteUrl(this.emotes.bam);
        }
      } else if(approvalVoteCount==rejectVoteCount ) {
        ts.userError(ts.message("approval.comboBreaker"));
      } else {
        ts.userError(ts.message("approval.numVotesNeeded"),{vote_num:ts.get_variable("VotesNeeded")});
      }

      var mention = ts.message("general.heyListen",{discord_id:author.discord_id});
      var judgeEmbed = ts.levelEmbed(level)
        .setColor(color)
        .setAuthor(title);

      if(image){
        judgeEmbed.setThumbnail(image);
      }

      if(fixMode){
        judgeEmbed.setDescription(ts.message("approval.fixInstructionsCreator"));
      }

      if(fixMode){
        for(let i = 0; i < fixComments.length; i++){
          let msgString = "";
          if(fixComments[i].type=="fix"){
            msgString='judge.votedFix';
          } else {
            msgString='judge.votedReject';
          }
          let embedHeader=ts.message(msgString,{ ...fixComments[i] })
          ts.embedAddLongField(judgeEmbed,embedHeader,fixComments[i].reason)
        }
      } else {
        for(let i = 0; i < allComments.length; i++){
          let msgString = "";
          if(allComments[i].type=="fix"){
            msgString='judge.votedFix'
          } else if(allComments[i].type=="approve"){
            msgString='judge.votedApprove'
          } else {
            msgString='judge.votedReject'
          }
          let embedHeader=ts.message(msgString,{ ...allComments[i] })
          ts.embedAddLongField(judgeEmbed,embedHeader,allComments[i].reason)
        }
      }

      await client.channels.get(ts.channels.levelChangeNotification).send(mention);
      await client.channels.get(ts.channels.levelChangeNotification).send(judgeEmbed);


      //Remove Discussion Channel
      if(!fromFix){
        await ts.deleteDiscussionChannel(level.Code,ts.message("approval.channelDeleted"))
      } else {
        await ts.deleteReuploadChannel(level.Code,ts.message("approval.channelDeleted"))
      }
  }

  this.rejectLevelWithReason=async function(levelCode, shellder, message){
    var approvalVotes = await ts.db.PendingVotes.query().where("code",levelCode).where("is_shellder",1).where("type","approve");
    var fixVotes = await ts.db.PendingVotes.query().where("code",levelCode).where("is_shellder",1).where("type","fix");
    var rejectVotes = await ts.db.PendingVotes.query().where("code",levelCode).where("is_shellder",1).where("type","reject");
    var allComments = [...approvalVotes, ...fixVotes, ...rejectVotes];

    var updateLevel = ts.gs.query("Raw Levels", {
      filter: {"Code":levelCode},
      update: {"Approved": -2}
    });
    if(updateLevel.Code == levelCode){
      await ts.gs.batchUpdate(updateLevel.update_ranges);
    }
    const author = ts.gs.selectOne("Raw Members",{"Name":updateLevel.Creator});

    var color="#dc3545";

    var mention = ts.message("general.heyListen",{discord_id:author.discord_id});
    var exampleEmbed = ts.levelEmbed(updateLevel)
      .setColor(color)
      .setAuthor(ts.message("approval.rejectAfterRefuse"))

    if(this.emotes.axemuncher){
      var image=this.getEmoteUrl(this.emotes.axemuncher);
      exampleEmbed.setThumbnail(image);
    }

    exampleEmbed.setDescription("Rejected by <@" + shellder.id + ">: " + message);

    for(var i = 0; i < allComments.length; i++){
      let action = "";
      if(allComments[i].type=="fix"){
        action = " voted for fix with difficulty " + allComments[i].difficulty_vote;
      } else if(allComments[i].type=="approve"){
        action = " voted to approve with difficulty " + allComments[i].difficulty_vote;
      } else {
        action = " voted for rejection";
      }
      var embedHeader=allComments[i].player + action +":"
      ts.embedAddLongField(exampleEmbed,embedHeader,allComments[i].reason)
    }

    await client.channels.get(ts.channels.levelChangeNotification).send(mention);
    await client.channels.get(ts.channels.levelChangeNotification).send(exampleEmbed);

    //Remove Discussion Channel
    await ts.deleteReuploadChannel(levelCode,ts.message("approval.channelDeleted"))
  }

  this.deleteDiscussionChannel=async function(levelCode,reason){
    var levelChannel=this.getGuild().channels.find(channel => channel.name === levelCode.toLowerCase() && channel.parent.id == ts.channels.levelDiscussionCategory)
      if(levelChannel){
        await levelChannel.delete(reason)
      }
  }

  this.deleteReuploadChannel=async function(levelCode,reason){
    var levelChannel=this.getGuild().channels.find(channel => channel.name === levelCode.toLowerCase() && channel.parent.id == ts.channels.pendingReuploadCategory)
      if(levelChannel){
        await levelChannel.delete(reason)
      }
  }

  this.putFeedback = async function(ip, discordId, salt, message){
    let hash = crypto.createHmac('sha512', salt);
    hash.update(ip + " - " + discordId);
    let value = hash.digest('hex');

    await client.channels.get(ts.channels.feedbackChannel).send("**[" + value.slice(0, 8) + "]**\n> " + message.replace(/\n/g, "\n> "));
  }


  this.levelEmbed=function(level,noLink){
    var videoStr=[]
    level["Clear Video"].split(",").forEach((vid,i)=>{
      if(vid) videoStr.push("[ 🎬 ]("+vid+")")
    })
    videoStr=videoStr.join(",")
    var tagStr=[]
    level.Tags=level.Tags?level.Tags:""
    level.Tags.split(",").forEach((tag)=>{
      if(tag) tagStr.push("["+tag+"](" + server_config.page_url + ts.config.url_slug + "/levels/"+encodeURIComponent(tag)+")")
    })
    tagStr=tagStr.join(",")
    var embed = client.util.embed()
        .setColor("#007bff")
        .setTitle(level["Level Name"] + " (" + level.Code + ")")
        .setDescription(
          "made by "+
          (noLink?level.Creator:"[" + level.Creator + "](" + server_config.page_url + ts.config.url_slug + "/maker/" + encodeURIComponent(level.Creator) + ")")+"\n"+
          (level.clears!=undefined ? "Difficulty: "+level.Difficulty+", Clears: "+level.clears+", Likes: "+level.likes+"\n":"")+
            (tagStr?"Tags: "+tagStr+"\n":"")+
            (videoStr?"Clear Video: "+videoStr:"")
        )
      if(!noLink){
        embed.setURL(server_config.page_url + ts.config.url_slug + "/level/" + level.Code)
      }

          //randomEmbed.addField(,);
    embed = embed.setTimestamp();
    return embed
  }

  this.parse_command=function(message){ //assumes there's prefix
    var raw_command=message.content.trim();
    raw_command=raw_command.split(" ");
    var sb_command=raw_command.shift().toLowerCase().substring(1);
    var filtered=[]
    raw_command.forEach((s)=>{
      if(s) filtered.push(s)
    })
    return {
      command:sb_command,
      arguments:filtered,
      argumentString:filtered.join(" "),
    }
  }

  this.reuploadLevel=async function(message){
    let command=ts.parse_command(message);

    let oldCode=command.arguments.shift()
    if(oldCode)
      oldCode=oldCode.toUpperCase()

    if(!ts.valid_code(oldCode))
      ts.userError(ts.message("reupload.invalidOldCode"))


    let newCode=command.arguments.shift()
    if(newCode)
      newCode=newCode.toUpperCase()

    if(!ts.valid_code(newCode))
      ts.userError(ts.message("reupload.invalidNewCode"))

    const reason=command.arguments.join(" ")

    if(oldCode==newCode)
      ts.userError(ts.message("reupload.sameCode"))
    if(!reason){
      ts.userError(ts.message("reupload.giveReason"))
    }

    await ts.gs.loadSheets(["Raw Members","Raw Levels"]);

    var player=ts.gs.selectOne("Raw Members",{
      "discord_id":message.author.id
    })

    if(!player)
      ts.userError(ts.message("error.notRegistered"));
    var earned_points=await ts.calculatePoints(player.Name);
    var rank=ts.get_rank(earned_points.clearPoints);
    var user_reply="<@"+message.author.id+">"+(rank.Pips ? rank.Pips : "")+" ";

    var level=ts.getExistingLevel(oldCode,true)
    var new_level=ts.gs.selectOne("Raw Levels",{"Code":newCode}) //new level just incase they've already tsadded

    var oldApproved = level.Approved;

    var older_level=ts.gs.query("Raw Levels",{ //this is just in case this is not the first reupload. assign
      filter:{"NewCode":oldCode},
      update:{"NewCode":newCode}
    },true)

    if(!level) ts.userError(ts.message("error.levelNotFound",{code:oldCode}));

    var creator_points=await ts.calculatePoints(level.Creator,level.Approved=="1" || level.Approved=="0")

    if(new_level && level.Creator!=new_level.Creator)
      ts.userError(ts.message("reupload.differentCreator"));
    if(new_level && new_level.Approved!=0 && new_level.Approved!=1 && new_level.Approved!=-10)
      ts.userError(ts.message("reupload.wrongApprovedStatus"));
    if(!new_level && creator_points.available<0)
      ts.userError(ts.message("reupload.notEnoughPoints"));
    if(level.NewCode && ts.valid_code(level.NewCode))
      ts.userError(ts.message("reupload.haveReuploaded",{code:level.NewCode}));

    //only creator and shellder can reupload a level
    if(!(level.Creator==player.Name || player.shelder=="1"))
      ts.userError(ts.message("reupload.noPermission", {level}));

    level=ts.gs.query("Raw Levels",{
      filter:{"Code":oldCode},
      update:{"Approved":level.Approved=="1"?2:-1,"NewCode":newCode},
    })
    var batch_updates=level.update_ranges
    //combine all the updates into one array to be passed to gs.batchUpdate

    if(older_level){
      older_level.forEach((o)=>{
        batch_updates=batch_updates.concat(o.update_ranges)
      })

    }
    if(!new_level){ //if no new level was found create a new level copying over the old data
      await ts.gs.insert("Raw Levels",{
        Code:newCode,
        "Level Name":level["Level Name"],
        Creator:level.Creator,
        Difficulty:0,
        Approved:0,
        Tags:level.Tags
      });
    }

    if(batch_updates!=null){
      await ts.gs.batchUpdate(batch_updates)
    }

    await ts.deleteReuploadChannel(oldCode,ts.message("approval.channelDeleted"))

    if(oldApproved == -10 || oldApproved == 1){
      //set the new one to fix request status and add channel
      //Move pending votes to the new level
      await ts.db.PendingVotes.query().where("code",oldCode).where("is_shellder",1)
        .update({
          code: newCode
        });

      await ts.gs.loadSheets(["Raw Members","Raw Levels"]);
      new_level=ts.gs.query("Raw Levels",{
        filter:{"Code":newCode},
        update:{"Approved":-10},
      })
      await ts.gs.batchUpdate(new_level.update_ranges);
      const author = ts.gs.selectOne("Raw Members",{"Name":new_level.Creator});

      var overviewMessage;
      var discussionChannel;

      let guild=ts.getGuild()

      discussionChannel = guild.channels.find(channel => channel.name === new_level.Code.toLowerCase() && channel.parent.id == ts.channels.pendingReuploadCategory); //not sure should specify guild/server

      if(discussionChannel){
        await ts.deleteReuploadChannel(newCode,ts.message("approval.channelDeleted"))
      }

      //Create new channel and set parent to category
      if(guild.channels.get(ts.channels.pendingReuploadCategory).children.size===50){
        ts.userError(ts.message("reupload.tooManyReuploadChannels"))
      }
      discussionChannel = await guild.createChannel(newCode, {
        type: 'text',
        parent: guild.channels.get(ts.channels.pendingReuploadCategory)
      });
      //Post empty overview post
      if(oldApproved == -10){
        await discussionChannel.send("Reupload Request for <@" + author.discord_id + ">'s level with message: " + reason);
        let voteEmbed = await ts.makePendingReuploadEmbed(new_level, author, false);
        overviewMessage = await discussionChannel.send(voteEmbed);
        overviewMessage = await overviewMessage.pin();
      } else {
        await discussionChannel.send("Reupload Request for <@" + author.discord_id + ">'s level: ");
        let voteEmbed = await ts.makePendingReuploadEmbed(new_level, author, false, reason);
        overviewMessage = await discussionChannel.send(voteEmbed);
        overviewMessage = await overviewMessage.pin();
      }
    }

    let guild=ts.getGuild();
    let existingChannel=guild.channels.find(channel => channel.name === oldCode.toLowerCase() && channel.parent.id == ts.channels.levelDiscussionCategory)
    if(existingChannel){
      await existingChannel.setName(newCode.toLowerCase())
      await existingChannel.send(ts.message("reupload.reuploadNotify",{oldCode,newCode}))
      let oldEmbed=await ts.makeVoteEmbed(level)
      await existingChannel.send(oldEmbed)
    }

    var reply=ts.message("reupload.success",{ level , newCode })
    if(!new_level){
      reply+=ts.message("reupload.renamingInstructions")
    }
    if(oldApproved == -10 || oldApproved == 1){
      reply += ts.message("reupload.inReuploadQueue")
    }

    return user_reply+reply;
  }

  this.get_levels=async function(isMap){ //get the aggregates
      var clears={}
      var plays = await ts.db.Plays.query();
      plays.forEach((played)=>{
        if(!clears[played.code]) clears[played.code]={}
        clears[played.code][played.player]=played
      });
      var levels=isMap?{}:[]
      ts.gs.select("Raw Levels").forEach((level)=>{
          var tsclears=0;
          var votesum=0;
          var votetotal=0;
          var likes=0;

          if(clears[level.Code]){
            for(var player in clears[level.Code]){
              if(player!=level.Creator){
                if(clears[level.Code][player].completed=="1"){
                  tsclears++;
                }
                if(clears[level.Code][player].difficulty_vote){
                  votetotal++;
                  votesum+=Number(clears[level.Code][player].difficulty_vote)
                }
                if(clears[level.Code][player].liked=="1"){
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
    var point_rank=ts.gs.select("Ranks")
    for(var i=point_rank.length-1;i>=0;i--){
      if(parseFloat(points)>=parseFloat(point_rank[i]["Min Points"])){
        let ret={}
        for(var j in point_rank[i]){
          ret[j]=point_rank[i][j]?point_rank[i][j]:''
        }
        return ret
      }
    }
    return false
  }

  this.calculatePoints= async function(user,if_remove_check){ //delta check is to see if we can add a level if we remove it
    var currentLevels = ts.gs.select("Raw Levels");
    var levelMap={};
    var ownLevels=[];
    var freeSubmissions=0;
    var reuploads={};
    for (var row = currentLevels.length-1; row >=0 ; row--) {
      if(currentLevels[row].Approved=="1"){
        if(currentLevels[row].Creator==user){
          ownLevels.push(currentLevels[row].Code)
          if(currentLevels[row].free_submission=="1"){
            freeSubmissions++;
          }
        } else {
          levelMap[currentLevels[row].Code]=this.pointMap[parseFloat(currentLevels[row].Difficulty)]
        }
      } else if(currentLevels[row].Approved=="2") { //reupload
        if(currentLevels[row].Creator==user){
          //reuploads don't count for self
        } else {
          if(currentLevels[row].NewCode){
            reuploads[currentLevels[row].Code]=currentLevels[row].NewCode
            levelMap[currentLevels[row].Code]=this.pointMap[parseFloat(currentLevels[row].Difficulty)]
          }
        }
      } else if((currentLevels[row].Approved==null || currentLevels[row].Approved=="" || currentLevels[row].Approved=="0") && currentLevels[row].Creator==user){
        ownLevels.push(currentLevels[row].Code)
      }

    }

    var playedLevels = await ts.db.Plays.query()
      .where('player', '=', user)
      .where('completed', '=', "1");

    var userCleared={};
    for (var row = 0; playedLevels && row < playedLevels.length; row++){
        var id= reuploads[playedLevels[row].code] ? reuploads[playedLevels[row].code] : playedLevels[row].code
        userCleared[id]= Math.max( userCleared[id]?userCleared[id]:0, levelMap[playedLevels[row].code] )
    }

    var clearPoints=0;
    for(var id in userCleared){
      if(userCleared[id]) clearPoints+=userCleared[id]
    }


    var ownLevelNumbers=ownLevels.length + (if_remove_check?-1:0) //check if can upload a level if we removed one. for reuploads
    return {
      clearPoints:clearPoints.toFixed(1),
      levelsMade:ownLevels.length,
      freeSubmissions:freeSubmissions,
      available:this.levelsAvailable(clearPoints,ownLevelNumbers,freeSubmissions),
    }
  }
}

module.exports=TS