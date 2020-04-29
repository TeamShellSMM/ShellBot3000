'use strict'
const stringSimilarity = require('string-similarity')
const argv = require('yargs').argv
const Handlebars = require("handlebars");
const crypto=require('crypto')
const moment=require('moment')
const server_config = require('./config.json');
const GS=require("./GS.js");
const TS=function(guild_id,config,client){ //loaded after gs
  const ts=this;
  this.client=client;
  this.guild_id = guild_id;
  this.gs=new GS({...server_config,...config});

  this.LEVEL_STATUS={
    PENDING:0,
    APPROVED:1,
    REJECTED:-1,
    NEED_FIX:-10,
    REUPLOADED:2,
    REMOVED:-2,
  };

  this.load=async function(){
    this.db={
      Tokens:require('./models/Tokens'),
      Plays:require('./models/Plays')(guild_id,ts),
      PendingVotes:require('./models/PendingVotes')(guild_id,ts),
      Members:require('./models/Members')(guild_id,ts),
      Levels:require('./models/Levels')(guild_id,ts),
      Points:require('./models/Points')(guild_id,ts),
    };

    this.knex = this.db.Levels.knex();

    ts.gs.clearCache();
    let guild=await ts.getGuild()

    await guild.fetchMembers(); //just load up all members


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
      ]; //initial vars to be loaded on bot load

      await ts.gs.loadSheets(static_vars) //loading initial sheets

      this.pointMap={}
      var _points=ts.gs.select("Points");
      for(let i=0;i<_points.length;i++){
        this.pointMap[parseFloat(_points[i].Difficulty)]=parseFloat(_points[i].Points);
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

      //should verify that the discord roles id exist in server
      this.ranks=ts.gs.select("Ranks");
      this.rank_ids=this.ranks.map((r)=>r.discord_roles)

      if(this.teamVariables.ModName){
        this.mods=guild.members
          .filter((m)=> m.roles.some(role=> role.name==this.teamVariables.ModName))
          .map((m)=> m.user.id)
      } else {
        this.mods=[guild.owner.user.id]
      }
      ts.recalculateAfterUpdate()

      console.log(`Data loaded for ${this.teamVariables.TeamName}`)
  }

  this.getMakerPoints = function(likes, clears, difficultyPoints){
    if(clears == 0) return 0;
    return ((likes * 2 + clears)*difficultyPoints) * (likes/clears);
}

  this.getPoints=function(difficulty){
    return this.pointMap[parseFloat(difficulty)]
  }

  //to be called whenever there are any updates to level difficulty and clears
  this.recalculateAfterUpdate=async function(args){
    //const wheres=
    let code,name;
    if(args){
      code=args.code;
      name=args.name;
    }

    let filter1='';
    let filter2='';
    let filter3='';
    if(name){
      filter1='and plays.player=:name';
      filter2='and levels.creator=:name';
      filter3='and members.name=:name';
    } else if(code) {
      let subsql='select player from plays where guild_id=:guild_id and code=:code and completed=1'
      filter1=`and plays.player in (${subsql})`;
      filter2=`and levels.creator in (${subsql})`;
      filter3=`and members.name in (${subsql})`;
    }



    let calculated_values=await this.db.Members.knex().raw(`
      SELECT
        members.id,
        members.guild_id,
        members.name,
        total_score,
        total_cleared,
        calculated_levels_created,
        own_score,
        free_submissions
      FROM members LEFT JOIN (
        SELECT
          plays.guild_id,
          plays.player,
          sum(points.score) total_score,
          count(plays.id) total_cleared from plays
        INNER JOIN levels ON
          levels.code=plays.code
          AND levels.guild_id=plays.guild_id
        INNER JOIN points ON
          levels.difficulty=points.difficulty
          AND points.guild_id=levels.guild_id
        WHERE
          levels.status=1
          AND plays.completed=1
          AND levels.guild_id=:guild_id
          ${filter1}
        GROUP BY plays.player,plays.guild_id
      ) clear_stats ON
            members.guild_id=clear_stats.guild_id
            AND members.name=clear_stats.player
      LEFT JOIN (
        SELECT
          levels.guild_id,
          COUNT(levels.id) calculated_levels_created,
          SUM(levels.is_free_submission) free_submissions,
          SUM(points.score) own_score,
          levels.creator
        FROM levels
        INNER JOIN points ON points.difficulty=levels.difficulty AND points.guild_id=levels.guild_id
        WHERE
          levels.guild_id=:guild_id and
          levels.status in (:statuses:)
          ${filter2}
        GROUP BY creator,levels.guild_id
      ) own_levels ON
          members.guild_id=own_levels.guild_id
          AND members.name=own_levels.creator
      WHERE members.guild_id=:guild_id ${filter3}`,{
        guild_id,
        name,
        code,
        statuses:[ts.LEVEL_STATUS.PENDING,ts.LEVEL_STATUS.APPROVED],
      });

    await ts.db.Members.transaction(async (trx)=>{
      for(let j=0;j<calculated_values.length;j++){
        if(ts.teamVariables.includeOwnPoints){
          calculated_values[j].total_score+=calculated_values[j].own_score;
        }
        await ts.db.Members.query(trx)
        .patch({
          clear_score_sum:calculated_values[j].total_score||0,
          levels_cleared:calculated_values[j].total_cleared||0,
          levels_created:calculated_values[j].calculated_levels_created||0,
        })
        .findById(calculated_values[j].id)
      }
    })
  }

  //used to save variables to db?
  this.saveSheetToDb=async function(){
    let guild=ts.getGuild();
    let mods=[guild.owner.user.id];
    if(this.teamVariables.ModName){
      mods=guild.members
        .filter((m)=> m.roles.some(role=> role.name==this.teamVariables.ModName))
        .map((m)=> m.user.id)
    }

    await ts.db.Members.query().patch({is_mod:0}).whereNotIn('discord_id',mods).where({is_mod:1});
    await ts.db.Members.query().patch({is_mod:1}).whereIn('discord_id',mods).where({is_mod:0});

    ts.gs.loadSheets(["Points"]);
    var _points=ts.gs.select("Points");
    for(let i=0;i<_points.length;i++){
      this.pointMap[parseFloat(_points[i].Difficulty)]=parseFloat(_points[i].Points);
      let dbPoint = await ts.db.Points.query().select().where('difficulty', parseFloat(_points[i].Difficulty));
      if(dbPoint.length == 0){
        await ts.db.Points.query().insert({
          difficulty: _points[i].Difficulty,
          score: _points[i].Points
        });
      } else {
        await ts.db.Points.query().where('difficulty', parseFloat(_points[i].Difficulty)).update({
          difficulty: _points[i].Difficulty,
          score: _points[i].Points
        });
      }
    }
  }

  this.is_mod=function(player){
    return player && ts.mods.indexOf(player.discord_id)!==-1;


  }

  this.getDiscordMember=function(discord_id){
    const member=this.getGuild().members.get(discord_id);
    return member
  }

  this.removeRankRoles=async function(discord_id){
    const member=ts.getDiscordMember(discord_id);
    //if has role
    await member.removeRoles(this.ranks_ids)
  }

  this.addRankRoles=async function(discord_id,role_id){
    const member=ts.getDiscordMember(discord_id);
    //if not has role
    ts.removeRankRoles(discord_id)
    await member.addRole(role_id)
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

  this.is_smm1=function(code){
    return /^[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}$/.test(code.toUpperCase());
  }

  this.is_smm2=function(code){
    return /^[1234567890QWERTYUPASDFGHJKLXCVBNM]{3}-[1234567890QWERTYUPASDFGHJKLXCVBNM]{3}-[1234567890QWERTYUPASDFGHJKLXCVBNM]{3}$/.test(code.toUpperCase());
  }

  this.valid_code=function(code){
    if(code==null) return false;
    return this.is_smm2(code) || ts.teamVariables.allowSMM1 && this.is_smm1(code);
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
    return !level || (
      level
      && level.status!=ts.LEVEL_STATUS.PENDING
      && level.status!=ts.LEVEL_STATUS.APPROVED
    )
  }

  this.isReupload=async function(code){
    let reuploads=await ts.db.Levels.query().where({new_code:code})
    if(reuploads.length===0) return false

    let isFixStatus=false;
    let hasBeenApproved=false;
    reuploads=reuploads.map( o =>{
      if(o.status===ts.LEVEL_STATUS.NEED_FIX){
        isFixStatus=true;
      }
      if(o.status===ts.LEVEL_STATUS.APPROVED){
        hasBeenApproved=true
      }
      return o.code;
    })
    return {
      "reupload":true,
      "isFixStatus":isFixStatus,
      "hasBeenApproved":hasBeenApproved,
      "codes":reuploads
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
        args.like='1'
      }

      if(args.like=="unlike"){
        args.like='0'
      }

      if(args.difficulty=="like"){
        args.difficulty=''
        args.like='1'
      }

      if(args.difficulty=="unlike"){
        args.difficulty=''
        args.like='0'
      }

      if(args.difficulty!=='0' && args.difficulty && !ts.valid_difficulty(args.difficulty)){
        ts.userError(ts.message("clear.invalidDifficulty"));
      }

      if(!args.discord_id) ts.userError(ts.message("error.noDiscordId"));

      const player=await ts.get_user(args.discord_id);
      var level=await ts.getExistingLevel(args.code);
      if(level.creator==player.name)
        ts.userError(ts.message("clear.ownLevel"));

      var existing_play = await ts.db.Plays.query()
        .where('code','=',args.code)
        .where('player','=',player.name)
        .first();

      var creator=await ts.db.Members.query().where({ name:level.creator }).first(); //oddface/taika is only non registered member with a level
      if(creator && creator.atme=='1' && creator.discord_id && !strOnly){
      var creator_str="<@"+creator.discord_id+">"
      } else {
      var creator_str=level.creator
      }

      var msg=[],updated={}
      if(existing_play){
        var updated_row={}
        if(
            ['1','0'].includes(args.completed) &&
            (""+existing_play.completed)!==args.completed
          ){ //update completed
          updated_row.completed=args.completed;
          updated.completed=1
        }
        if(
          ['1','0'].includes(args.like) &&
          (""+existing_play.liked)!==args.like
        ){ //like updated
          updated_row.liked=args.like;
          updated.liked=1
        }
        if(
          (args.difficulty || args.difficulty==='0' ) &&
          ( (""+existing_play.difficulty_vote)!==args.difficulty )
        ){ //difficulty update
          updated_row.difficulty_vote=args.difficulty==='0'?null:args.difficulty; //0 difficulty will remove your vote
          updated.difficulty=1
        }
        await ts.db.Plays.query().findById(existing_play.id).patch(updated_row);
      } else {
        await ts.db.Plays.query().insert({
          code:args.code,
          player:player.name,
          completed: args.completed?1:0,
          liked:args.like?1:0,
          difficulty_vote:args.difficulty==='0' ? null:args.difficulty
        });
        if(args.completed!=='') updated.completed=1;
        if(args.like!=='') updated.liked=1;
        if(args.difficulty!=='') updated.difficulty=1;
      }


        if(updated.completed){
          if(args.completed==='0'){
            msg.push(ts.message("clear.removedClear",{level}))
          } else {
            msg.push(ts.message("clear.addClear",{level}))
            if(level.status===ts.LEVEL_STATUS.APPROVED){
              msg.push(ts.message("clear.earnedPoints",{
                earned_points:ts.getPoints(level.difficulty),
              }))
            } else {
              msg.push(ts.message("clear.pendingLevel"))
            }
          }
          await ts.recalculateAfterUpdate({name:player.name})
        } else if(args.completed || args.completed==='0'){
          msg.push(args.completed==='0'?
            ts.message("clear.alreadyUncleared"):
            ts.message("clear.alreadyCleared")
          )
        }

        if(updated.difficulty){
          msg.push(args.difficulty==='0'?
            ts.message("clear.removeDifficulty",{ level }):
            ts.message("clear.addDifficulty",{
              level:level,
              difficulty_vote:args.difficulty,
            })
          )
        } else if(args.difficulty || args.difficulty==='0' ){
          msg.push(args.difficulty==='0'?
            ts.message("clear.alreadyDifficulty",{ level }):
            ts.message("clear.alreadyNoDifficulty",{
              level:level,
              difficulty_vote:args.difficulty,
            })
          )
        }

        if(updated.liked){
          msg.push(args.like==='0'?
          ts.message("clear.removeLike",{ level }):
          ts.message("clear.addLike",{ level })
          )
        } else if(args.like || args.like==='0' ){
          msg.push(args.like==='0'?
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

  this.getExistingLevel=async function(code,includeRemoved=false){

    if(!code) ts.userError(ts.message('error.noCode'));

    var level=await ts.db.Levels.query().where({ code }).first()
    if(!level){ //level doesn't exist
      let notDeletedLevels={}
      let allLevels={}
      const _levels=await ts.db.Levels.query().select();
      _levels.forEach((level)=>{
        if(level && (level.status == ts.LEVEL_STATUS.PENDING || level.status == ts.LEVEL_STATUS.APPROVED )){
          notDeletedLevels[level.code]=level.code+" - \""+level.level_name+"\" by "+level.creator
        }
        allLevels[level.code]=level.code+" - \""+level.level_name+"\" by "+level.creator
      })
      let listUsed=includeRemoved?allLevels:notDeletedLevels
      listUsed=Object.keys(listUsed)
      let matchStr=""
      if(listUsed.length>0){
        const match=stringSimilarity.findBestMatch(code,listUsed)
        if(match.bestMatch && match.bestMatch.rating>=0.6){
          matchStr='Did you mean:```\n'+allLevels[match.bestMatch.target]+'```'
        }
      }


      ts.userError(ts.message("error.levelNotFound", { code })+matchStr);
    }
    if(!includeRemoved && !(level.status==ts.LEVEL_STATUS.PENDING || level.status==ts.LEVEL_STATUS.APPROVED)){ //level is removed. not pending/accepted
      if(level.status==ts.LEVEL_STATUS.NEED_FIX){
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

  this.makeErrorObj=function(obj,message){
    return {
      error:obj.stack?obj.stack:obj,
      url_slug:this.config.url_slug,
      content:message.content,
      user:message.author.username,
      channel:"<#"+message.channel.id+">"
    };
  }

  this.getUserErrorMsg=function(obj,message){
    if(typeof obj=="object" && obj.errorType=="user"){
      return obj.msg+ts.message("error.afterUserDiscord")
    } else {
      console_error(ts.makeErrorObj(obj,message))
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

    const player=args.discord_id!=null? await ts.get_user(args.discord_id) : null
    let players=null;
    if(args.players){
      players=args.players.split(",")
      let rawPlayers=await ts.db.Members.query().whereIn('name',players)
      rawPlayers.forEach( p => {
        if(players.indexOf(p.name) === -1){
          ts.userError(ts.message("random.playerNotFound",{player:p.name}));
        }
      })
    } else {
      players=[player.name]
    }

    //console.time("get levels")
    var allLevels=await ts.get_levels()
    let levels={}
    if(player){
      allLevels=allLevels.filter((l)=>{
        return players.indexOf(l.creator)===-1
      })
    }
    allLevels.forEach(o=>{
      levels[o.code]=o
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
        if(level && level.status== ts.LEVEL_STATUS.APPROVED && level.creator!=player.name){
          played.push(level.code)
          difficulties.push(level.difficulty)
        }
        if(level && players.indexOf(level.creator)!==-1){
          played.push(level.code)
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
        var currDifficulty=parseFloat(level.difficulty)
        level.tags=level.tags||""
        return level.status==ts.LEVEL_STATUS.APPROVED
          && currDifficulty>=min
          && currDifficulty<=max
          && played.indexOf(level.code)==-1
          && level.tags.indexOf("Consistency") === -1
          && level.tags.indexOf("Practice") === -1
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

  this.assign_rank_role=async function(discord_id,rank){
    //check if rank exists, if not skip
    //load all rank roles
    //remove all rank roles
    //assign set role
  }


  this.get_user= async function(message){
    var discord_id=typeof message=="string"?message:message.author.id
    if(!discord_id) ts.userError(ts.message('error.noDiscordId'));
    var player=await ts.db.Members.query().where({ discord_id }).first()

    if(!player)
      ts.userError(ts.message("error.notRegistered"));

    if(player.is_banned)
      ts.userError(ts.message("error.userBanned"));

    player.is_mod=ts.is_mod(player.name);
    player.earned_points= await this.calculatePoints(player.name);
    player.rank=this.get_rank(player.earned_points.clearPoints);
    player.user_reply="<@"+discord_id+">" + (player.rank.Pips ? player.rank.Pips : "") + " ";
    return player
  }

  this.makeVoteEmbed=async function(level){
    var approveVotes = await ts.db.PendingVotes.query().where("code",level.code).where({type:'approve'});
    var fixVotes = await ts.db.PendingVotes.query().where("code",level.code).where({type:'fix'});
    var rejectVotes = await ts.db.PendingVotes.query().where("code",level.code).where({type:'reject'});

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
          const curShellder = await ts.db.Members.query().where({name:approveVotes[i].player}).first();
          postString += "<@" + curShellder.discord_id + "> - Difficulty: " + approveVotes[i].difficulty_vote + ", Reason: " + approveVotes[i].reason + "\n";
        }
      }

      postString += ts.message("approval.fixVotes");
      if(fixVotes == undefined || fixVotes.length == 0){
        postString += "> None\n";
      } else {
        for(var i = 0; i < fixVotes.length; i++){
          const curShellder = await ts.db.Members.query().where({name:fixVotes[i].player}).first();
          postString += "<@" + curShellder.discord_id + "> - Difficulty: " + fixVotes[i].difficulty_vote + ", Requested fixes: " + fixVotes[i].reason + "\n";
        }
      }

      postString += ts.message("approval.rejectVotes");

      if(rejectVotes == undefined || rejectVotes.length == 0){
        postString += "None\n";
      } else {
        for(var i = 0; i < rejectVotes.length; i++){
          const curShellder = await ts.db.Members.query().where({name:rejectVotes[i].player}).first();
          postString += "<@" + curShellder.discord_id + "> - Reason: " + rejectVotes[i].reason + "\n";
        }
      }

      ts.embedAddLongField(voteEmbed,"",postString)
      return voteEmbed
  }

  this.makePendingReuploadEmbed=async function(level, author, refuse, alreadyApprovedMessage){
    var fixVotes = await ts.db.PendingVotes.query().where("code",level.code).where("type","fix");

    var voteEmbed=ts.levelEmbed(level);

    if(alreadyApprovedMessage){
      //If we got a level we already approved before we just build a mini embed with the message
      voteEmbed.setAuthor(ts.message("pending.pendingTitle"))
      .setDescription(ts.message("pending.alreadyApprovedBefore"))
      .addField(author.name + ":", alreadyApprovedMessage);
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
        const curShellder = await ts.db.Members.query().where({name:fixVotes[i].player}).first();
        postString += "<@" + curShellder.discord_id + "> - Difficulty: " + fixVotes[i].difficulty_vote + ", Requested fixes: " + fixVotes[i].reason + "\n";
      }
    }

    ts.embedAddLongField(voteEmbed,"",postString)
    return voteEmbed
  }

  this.approve=async function(args){
      //Check if vote already exists
      const shellder=await ts.get_user(args.discord_id);
      var vote=await ts.db.PendingVotes.query().where("code",args.code).where("player",shellder.name).first();

      if(!vote){
        //We only check reason if we have no vote yet
        if(!args.reason){
          ts.userError(ts.message("approval.changeReason"));
        }
      }

      const level=await ts.getExistingLevel(args.code);
      const author = await ts.db.Members.query().where({name:level.creator}).first();

      if(!author){
        ts.userError(ts.message("approval.creatorNotFound"));
      }

      //Check if level is approved, if it's approved only allow rejection
      if(level.status === ts.LEVEL_STATUS.APPROVED){
        if(args.type === "approve"){
          ts.userError(ts.message("approval.levelAlreadyApproved"));
        }
      } else if(level.status === ts.LEVEL_STATUS.PENDING){
        //I don't care that this is empty, I can't be arsed anymore to think how to structure this if
      } else {
        ts.userError(ts.message("approval.levelNotPending"));
      }


      //Add/Update Approval/Rejection to new sheet 'shellder votes?' + difficulty + reason
      var updating = false;
      if(!vote){
        await ts.db.PendingVotes.query().insert({
          code: level.code,
          is_shellder: 1, //to be changed to member value?
          player: shellder.name,
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

      discussionChannel = guild.channels.find(channel => channel.name === level.code.toLowerCase() && channel.parent.id == ts.channels.levelDiscussionCategory); //not sure should specify guild/server

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
        overviewMessage = await discussionChannel.send("**The Judgement for '" + level.level_name + " (" + level.code + ") by <@" + author.discord_id + ">' has now begun!**\n\n> Current Votes for approving the level:\n> None\n\n> Current votes for rejecting the level:\n> None");
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


  this.judge=async function(code, fromFix = false){
    var guild=this.getGuild()
    var level = await ts.getExistingLevel(code,fromFix);
    const author = await ts.db.Members.query().where({name:level.creator}).first();


    if(!author){
      ts.userError(ts.message("approval.creatorNotFound"))
    }

    const approvalVotesNeeded=ts.teamVariables.ApprovalVotesNeeded || ts.teamVariables.VotesNeeded || 1
    const rejectVotesNeeded=ts.teamVariables.RejectVotesNeeded || ts.teamVariables.VotesNeeded || 1
    const fixVotesNeeded=ts.teamVariables.FixVotesNeeded || ts.teamVariables.VotesNeeded || 1

    //Get all current votes for this level
    var approvalVotes = await ts.db.PendingVotes.query().where({code}).where("type","approve");
    var fixVotes = await ts.db.PendingVotes.query().where({code}).where("type","fix");
    var rejectVotes = await ts.db.PendingVotes.query().where({code}).where("type","reject");
    var allComments = [...approvalVotes, ...fixVotes, ...rejectVotes];
    var fixComments = [...fixVotes, ...rejectVotes];

    //Count Approval and Rejection Votes
    var approvalVoteCount = approvalVotes.length;
    var fixVoteCount = fixVotes.length + approvalVotes.length;
    var rejectVoteCount = rejectVotes.length;

    let fixMode = false;

    if(rejectVoteCount >= rejectVotesNeeded && rejectVoteCount>approvalVoteCount){
      //Reject level
      await ts.db.Levels.query()
        .patch({status:ts.LEVEL_STATUS.REMOVED})
        .where({code:code})

      //Build embed
      var color="#dc3545",title;
      if(level.status===ts.LEVEL_STATUS.PENDING){
        title=ts.message("judge.levelRejected")
      } else {
        title=ts.message("judge.levelRemoved")
      }
      if(this.emotes.axemuncher){
        var image=this.getEmoteUrl(this.emotes.axemuncher);
      }
    }  else if (
        approvalVoteCount >= approvalVotesNeeded
        && approvalVoteCount>rejectVoteCount 
    ){
      if(level.status !== ts.LEVEL_STATUS.PENDING && level.status !== ts.LEVEL_STATUS.NEED_FIX)
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

        await ts.db.Levels.query()
          .patch({
            status:ts.LEVEL_STATUS.APPROVED,
            difficulty:finalDiff,
          })
          .where({code:code})

        await ts.recalculateAfterUpdate({code})

        //Update author to set cult_member if they're not already. send initiate message and assign cult role
        if(author.is_member != 1){
          await ts.db.Members.query()
            .patch({is_member:1})
            .where({name:author.name})

          if(author.discord_id){ //!argv.test &&
            //doesn't work with mocked user method here.
            try{
              var curr_user=await guild.members.get(author.discord_id)
            } catch (error){
              throw `Can't find ${author.discord_id} in guild`
            }
            if(curr_user){ //assign role
                await curr_user.addRole(ts.teamVariables.memberRoleId)
                await client.channels.get(ts.channels.initiateChannel).send(ts.message("initiation.message",{discord_id:author.discord_id}))
            } else {
              console_error(ts.message("initiation.userNotInDiscord",{name:author.name})) //not a breaking error.
            }
          }
        }

        //Build Status Message
        var color="#01A19F";
        var title=ts.message('judge.approved',{difficulty:finalDiff});
        if(this.emotes.bam){
          var image=this.getEmoteUrl(this.emotes.bam);
        }
      } else if (
        fixVoteCount >= fixVotesNeeded
        && approvalVoteCount>rejectVoteCount
        && fixVoteCount > 0
        && level.status !== ts.LEVEL_STATUS.NEED_FIX
      ) {
      if(level.status !== ts.LEVEL_STATUS.PENDING)
        ts.userError(ts.message("approval.levelNotPending"))

      await ts.db.Levels.query()
        .patch({status:ts.LEVEL_STATUS.NEED_FIX})
        .where({code:code})

      var color="#D68100";
      var title=ts.message("approval.fixPlayerInstructions");
      if(this.emotes.think){
        var image=this.getEmoteUrl(this.emotes.think);
      }

      fixMode = true;
    } else if(approvalVoteCount==rejectVoteCount ) {
      ts.userError(ts.message("approval.comboBreaker"));
    } else {
      ts.userError(ts.message("approval.numVotesNeeded"),{vote_num:approvalVotesNeeded});
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
      await ts.deleteDiscussionChannel(level.code,ts.message("approval.channelDeleted"))
    } else {
      await ts.deleteReuploadChannel(level.code,ts.message("approval.channelDeleted"))
    }
  }

  this.rejectLevelWithReason=async function(code, shellder, message){
    var approvalVotes = await ts.db.PendingVotes.query().where("code",code).where("type","approve");
    var fixVotes = await ts.db.PendingVotes.query().where("code",code).where("type","fix");
    var rejectVotes = await ts.db.PendingVotes.query().where("code",code).where("type","reject");
    var allComments = [...approvalVotes, ...fixVotes, ...rejectVotes];

    await ts.db.Levels.query()
        .patch({status:ts.LEVEL_STATUS.REMOVED})
        .where({code})

    const author = await ts.db.Member.query().where({"name":updateLevel.creator});

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
    await ts.deleteReuploadChannel(code,ts.message("approval.channelDeleted"))
  }

  this.deleteDiscussionChannel=async function(code,reason){
    var levelChannel=this.getGuild().channels.find(channel => channel.name === code.toLowerCase() && channel.parent.id == ts.channels.levelDiscussionCategory)
      if(levelChannel){
        await levelChannel.delete(reason)
      }
  }

  this.deleteReuploadChannel=async function(code,reason){
    var levelChannel=this.getGuild().channels.find(channel => channel.name === code.toLowerCase() && channel.parent.id == ts.channels.pendingReuploadCategory)
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
    var vidStr=[]

    level.videos.split(",").forEach((vid,i)=>{
      if(vid) vidStr.push("[ 🎬 ]("+vid+")")
    })


    vidStr=vidStr.join(",")
    var tagStr=[]
    level.tags=level.tags?level.tags:""
    level.tags.split(",").forEach((tag)=>{
      if(tag) tagStr.push("["+tag+"](" + server_config.page_url + ts.config.url_slug + "/levels/"+encodeURIComponent(tag)+")")
    })
    tagStr=tagStr.join(",")
    var embed = client.util.embed()
        .setColor("#007bff")
        .setTitle(level.level_name + " (" + level.code + ")")
        .setDescription(
          "made by "+
          (noLink?level.creator:"[" + level.creator + "](" + server_config.page_url + ts.config.url_slug + "/maker/" + encodeURIComponent(level.creator) + ")")+"\n"+
          (ts.is_smm1(level.code)? `Links: [Bookmark Page](https://supermariomakerbookmark.nintendo.net/courses/${level.code})\n` : '')+
          (level.clears!=undefined ? "Difficulty: "+level.difficulty+", Clears: "+level.clears+", Likes: "+level.likes+"\n":"")+
            (tagStr?"Tags: "+tagStr+"\n":"")+
            (vidStr?"Clear Video: "+vidStr:"")
        )
      if(!noLink){
        embed.setURL(server_config.page_url + ts.config.url_slug + "/level/" + level.code)
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

    let old_code=command.arguments.shift();
    if(old_code) old_code=old_code.toUpperCase();

    if(!ts.valid_code(old_code)) ts.userError(ts.message("reupload.invalidOldCode"))


    let new_code=command.arguments.shift()
    if(new_code) new_code=new_code.toUpperCase();

    if(!ts.valid_code(new_code)) ts.userError(ts.message("reupload.invalidNewCode"));

    const reason=command.arguments.join(" ")

    if(old_code==new_code) ts.userError(ts.message("reupload.sameCode"));
    if(!reason) ts.userError(ts.message("reupload.giveReason"));

    var player=await ts.db.Members.query().where({ discord_id:message.author.id }).first()

    if(!player) ts.userError(ts.message("error.notRegistered"));

    var earned_points=await ts.calculatePoints(player.name);
    var rank=ts.get_rank(earned_points.clearPoints);
    var user_reply="<@"+message.author.id+">"+(rank.Pips ? rank.Pips : "")+" ";

    var level=await ts.getExistingLevel(old_code,true)
    var new_level=await ts.db.Levels.query().where({code:new_code}).first()
    let oldApproved=level.status;


    if(!level) ts.userError(ts.message("error.levelNotFound",{code:old_code}));

    //Reupload means you're going to replace the old one so need to do that for upload check
    var creator_points=await ts.calculatePoints(level.creator, level.status==ts.LEVEL_STATUS.APPROVED || level.status==ts.LEVEL_STATUS.PENDING || level.status==ts.LEVEL_STATUS.NEED_FIX)


    //level.status==ts.LEVEL_STATUS.APPROVED || level.status==ts.LEVEL_STATUS.PENDING
    if(new_level && level.creator!=new_level.creator)
      ts.userError(ts.message("reupload.differentCreator"));
    if( new_level
        && new_level.status != ts.LEVEL_STATUS.PENDING
        && new_level.status != ts.LEVEL_STATUS.APPROVED
        && new_level.status != ts.LEVEL_STATUS.NEED_FIX
        ) ts.userError(ts.message("reupload.wrongApprovedStatus"));
    if(!new_level && creator_points.available<0)
      ts.userError(ts.message("reupload.notEnoughPoints"));
    if(level.new_code && ts.valid_code(level.new_code))
      ts.userError(ts.message("reupload.haveReuploaded",{code:level.new_code}));

    //only creator and shellder can reupload a level
    if(!(level.creator==player.name || ts.is_mod(player))){
      ts.userError(ts.message("reupload.noPermission", {level}));
    }

    await ts.db.Levels.query()
    .patch({
      status: level.status==ts.LEVEL_STATUS.APPROVED ? ts.LEVEL_STATUS.REUPLOADED : ts.LEVEL_STATUS.REMOVED,
      new_code,
    })
    .where({
      code:old_code,
    })
    await ts.db.Levels.query().patch({ new_code }).where({new_code:old_code});

    if(!new_level){ //if no new level was found create a new level copying over the old data
      await ts.db.Levels.query().insert({
        code:new_code,
        level_name:level.level_name,
        creator:level.creator,
        difficulty:0,
        status:0,
        tags:level.tags,
      });
      new_level=await ts.db.Levels.query().where({code:new_code}).first();
    }

    //await ts.deleteReuploadChannel(old_code,ts.message("approval.channelDeleted"))

    if(oldApproved == ts.LEVEL_STATUS.NEED_FIX || oldApproved == ts.LEVEL_STATUS.APPROVED ){
      //set the new one to fix request status and add channel
      //Move pending votes to the new level
      await ts.db.PendingVotes.query()
        .patch({code: new_code})
        .where({code:old_code})


      await ts.db.Levels.query()
        .patch({status:ts.LEVEL_STATUS.NEED_FIX})
        .where({code:new_code})

      const author = await ts.db.Members.query()
        .where({name:new_level.creator})
        .first();

      var overviewMessage;
      var discussionChannel;

      let guild=ts.getGuild()

      discussionChannel = guild.channels.find(channel => channel.name === new_level.code.toLowerCase() && channel.parent.id == ts.channels.pendingReuploadCategory); //not sure should specify guild/server

      if(discussionChannel){
        await ts.deleteReuploadChannel(new_code,ts.message("approval.channelDeleted"))
      }

      //Create new channel and set parent to category
      if(guild.channels.get(ts.channels.pendingReuploadCategory).children.size===50){
        ts.userError(ts.message("reupload.tooManyReuploadChannels"))
      }
      discussionChannel = await guild.createChannel(new_code, {
        type: 'text',
        parent: guild.channels.get(ts.channels.pendingReuploadCategory)
      });
      //Post empty overview post
      if(oldApproved == ts.LEVEL_STATUS.NEED_FIX){
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
    let existingChannel=guild.channels.find(channel => channel.name === old_code.toLowerCase() && channel.parent.id == ts.channels.levelDiscussionCategory)
    if(existingChannel){
      await existingChannel.setName(new_code.toLowerCase())
      await existingChannel.send(ts.message("reupload.reuploadNotify",{old_code,new_code}))
      let oldEmbed=await ts.makeVoteEmbed(level)
      await existingChannel.send(oldEmbed)
    }

    var reply=ts.message("reupload.success",{ level , new_code })
    if(!new_level){
      reply+=ts.message("reupload.renamingInstructions")
    }
    if(oldApproved == ts.LEVEL_STATUS.NEED_FIX || oldApproved == 1){
      reply += ts.message("reupload.inReuploadQueue")
    }

    return user_reply+reply;
  }

  this.get_levels=async function(isMap){ //get the aggregates
    const levels=await ts.db.Levels.knex().raw(`
    SELECT levels.*,levels.level_name,
    sum(nullif(plays.completed,0)) as clears,
    count(nullif(plays.difficulty_vote,0)) as votetotal,
    avg(nullif(plays.difficulty_vote,0)) as vote,
    sum(plays.liked) as likes
    FROM levels
      LEFT JOIN plays ON
      levels.code=plays.code and
      levels.guild_id=plays.guild_id
      where levels.guild_id=:guild_id
    group by levels.id
    `,{guild_id});
    console.log(levels)
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

  this.calculatePoints= async function(name,if_remove_check){ //delta check is to see if we can add a level if we remove it
    let member=await ts.db.Members.query().where({name}).first()
    let freeSubmissions=await ts.db.Levels.query().where({creator:name}).where({is_free_submission:1})
    return {
      clearPoints:member.clear_score_sum.toFixed(1),
      levelsMade:member.levels_created,
      freeSubmissions:freeSubmissions.length,
      available:this.levelsAvailable( member.clear_score_sum,member.levels_created-(if_remove_check?1:0),freeSubmissions.length),
    }
  }
}

module.exports=TS