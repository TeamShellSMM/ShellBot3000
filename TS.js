'use strict'
const stringSimilarity = require('string-similarity')
const argv = require('yargs').argv
const Handlebars = require("handlebars");
const crypto=require('crypto');
const moment=require('moment');
const knex = require('./db/knex');
const server_config = require('./config.json')[process.env.NODE_ENV || 'development'];
const DEFAULTMESSAGES=require("./DefaultStrings.js");
const DiscordLog = require('./DiscordLog');

const GS=require("./GS.js");
const TS=function(guild_id,team,client){ //loaded after gs
  if(!client) throw new Error(`No client passed to TS()`);
  const ts=this;
  this.team=team;
  this.url_slug=this.team.url_slug;
  this.config=this.team.config?
    (typeof this.team.config==="string"?JSON.parse(this.team.config):this.team.config)
    :{}
  this.web_config=this.team.web_config?JSON.parse(this.team.web_config):{}
  this.client=client;
  this.guild_id=guild_id;
  this.gs=new GS({...server_config,...this.config});
  this.LEVEL_STATUS={
    PENDING:0,
    APPROVED:1,
    REJECTED:-1,
    NEED_FIX:-10,
    REUPLOADED:2,
    REMOVED:-2,
  };
  this.db={
    Teams:require('./models/Teams.js')(guild_id),
    Tokens:require('./models/Tokens'),
    Plays:require('./models/Plays')(this.team.id,ts),
    PendingVotes:require('./models/PendingVotes')(this.team.id,ts),
    Members:require('./models/Members')(this.team.id,ts),
    Levels:require('./models/Levels')(this.team.id,ts),
    Points:require('./models/Points')(this.team.id,ts),
  };

  this.load=async function(){
    ts.knex=knex;
    ts.gs.clearCache();
    let guild=await ts.getGuild()
    await guild.fetchMembers(); //just load up all members
    const defaultVars = {
      customStrings:{ //defaults
        "levelInfo":"@@LEVEL_PLACEHOLDER@@",
        "teamurl": server_config.page_url+"/"+this.url_slug,
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

      await this.gs.loadSheets(static_vars) //loading initial sheets

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
      this.gs.select("Messages").forEach((v)=>{
        this.messages[v.Name]=_makeTemplate(v.value||'')
      });

      TS.defaultMessages={}
      for(var i in DEFAULTMESSAGES){
        if(this.messages[i] === undefined){
          TS.defaultMessages[i]=_makeTemplate(DEFAULTMESSAGES[i])
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

      
      await this.saveSheetToDb();
      await this.recalculateAfterUpdate();

      
      
      if(server_config.AutomatedTest == guild_id && argv.test){
        await DiscordLog.log(`Data loaded for ${this.teamVariables.TeamName}. Starting Test`,this.client)
        guild.channels.get(TS.TS_LIST[guild.id].channels.modChannel).send('?test')
      } else {
        if(process.env.NODE_ENV !== "testing"){
          await DiscordLog.log(`Data loaded for ${this.teamVariables.TeamName}`,this.client)
        }
      }
  }

  this.getPoints=function(difficulty){
    return this.pointMap[parseFloat(difficulty)]
  }

  this.getLevels=()=>{
    return knex('levels')
      .select(knex.raw(`levels.*, members.id creator_id,members.name creator`))
      .join('members',{'levels.creator':'members.id'})
      .where('levels.guild_id',this.team.id)
  }
  this.getPlays=()=>{
    return knex('plays')
      .select(knex.raw(`plays.*, members.id player_id,members.name player,levels.id level_id,levels.code code`))
      .join('members',{'plays.player':'members.id'})
      .join('levels',{'plays.code':'levels.id'})
      .where('plays.guild_id',this.team.id)
  }
  this.getPendingVotes=()=>{
    return knex('pending_votes')
      .select(knex.raw(`pending_votes.*, members.id player_id,members.name player,levels.id level_id,levels.code code`))
      .join('members',{'pending_votes.player':'members.id'})
      .join('levels',{'pending_votes.code':'levels.id'})
      .where('pending_votes.guild_id',this.team.id)
  }

  
  //to be called whenever there are any updates to level difficulty and clears
  this.recalculateAfterUpdate=async function(){
    await knex.raw(`UPDATE levels 
      inner join (SELECT *
    ,round(((likes*2+clears)*score*likes/clears),1) maker_points
    ,round(likes/clears*100,1) clear_like_ratio
    ,concat(vote,',',votetotal) votestr
    FROM
    (SELECT 
    ROW_NUMBER() OVER ( ORDER BY id ) as no
      ,levels.id
      ,points.score
      ,sum(plays.completed) clears
      ,sum(plays.liked) likes
      ,round(avg(plays.difficulty_vote),1) vote
      ,count(plays.difficulty_vote) votetotal
      ,pending.approves
      ,pending.rejects
      ,pending.want_fixes
    FROM
      levels
      INNER JOIN teams on
        levels.guild_id=teams.id
      LEFT JOIN plays ON
        levels.guild_id=plays.guild_id
        AND levels.id=plays.code
        AND levels.creator!=plays.player
    LEFT JOIN members ON
        levels.guild_id=members.guild_id
        AND levels.creator=members.id
      LEFT JOIN points ON
        levels.guild_id=points.guild_id
        AND levels.difficulty=points.difficulty
      LEFT JOIN (
        select code,sum(CASE WHEN pending_votes.type='approve' THEN 1 ELSE 0 END) approves
      ,sum(CASE WHEN pending_votes.type='reject' THEN 1 ELSE 0 END) rejects
      ,sum(CASE WHEN pending_votes.type='fix' THEN 1 ELSE 0 END) want_fixes from pending_votes group by pending_votes.code) pending on
      levels.id=pending.code
    WHERE 
      levels.status IN (0,1,-10)
      AND teams.id=:guild_id
    GROUP BY levels.id) a) b on
    levels.id=b.id
    set 
      levels.row_num=b.no,
      levels.clears=COALESCE(b.clears,0),
      levels.likes=COALESCE(b.likes,0),
      levels.average_votes=COALESCE(b.vote,0),
      levels.num_votes=COALESCE(b.votetotal,0),
      levels.maker_points=COALESCE(b.maker_points,0),
      levels.approves=COALESCE(b.approves,0),
      levels.rejects=COALESCE(b.rejects,0),
      levels.want_fixes=COALESCE(b.want_fixes,0),
      levels.clear_like_ratio=COALESCE(b.clear_like_ratio,0);

      UPDATE members LEFT JOIN (
        SELECT
          plays.guild_id,
          plays.player,
          sum(points.score) total_score,
          count(distinct plays.id) total_cleared from plays
        INNER JOIN levels ON
          levels.id=plays.code
          AND levels.guild_id=plays.guild_id
        INNER JOIN points ON
          levels.difficulty=points.difficulty
          AND points.guild_id=levels.guild_id
        WHERE
          levels.status=1
          AND plays.completed=1
          AND levels.guild_id=:guild_id
        GROUP BY plays.player,plays.guild_id
      ) clear_stats ON
            members.guild_id=clear_stats.guild_id
            AND members.id=clear_stats.player
      LEFT JOIN (
        SELECT
          levels.guild_id,
          COUNT(levels.id) calculated_levels_created,
          SUM(levels.maker_points) maker_points,
          SUM(levels.is_free_submission) free_submissions,
          SUM(points.score) own_score,
          levels.creator
        FROM levels
        INNER JOIN points ON points.difficulty=levels.difficulty AND points.guild_id=levels.guild_id
        WHERE
          levels.guild_id=:guild_id and
          levels.status in (0,1)
        GROUP BY creator,levels.guild_id
      ) own_levels ON
          members.guild_id=own_levels.guild_id
          AND members.id=own_levels.creator
      SET
        members.clear_score_sum=COALESCE(total_score,0),
        members.levels_cleared=COALESCE(total_cleared,0),
        members.levels_created=COALESCE(calculated_levels_created,0),
        members.own_score=COALESCE(own_levels.own_score,0),
        members.free_submissions=COALESCE(own_levels.free_submissions,0),
        members.maker_points=COALESCE(own_levels.maker_points,0)
      WHERE members.guild_id=:guild_id;
  `,{ guild_id:this.team.id });


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

    await ts.db.Members.query().patch({is_mod:null}).whereNotIn('discord_id',mods).where({is_mod:1});
    await ts.db.Members.query().patch({is_mod:1}).whereIn('discord_id',mods).where({is_mod:null});

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


  this.generateLoginLink=function(otp){
    return server_config.page_url + ts.url_slug + "/login/"+otp
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
    
    this.sendDM(discord_id,ts.message("website.loggedin"))
    return bearer
  }

  this.sendDM=async function(discord_id,message){
    await client.guilds.get(guild_id).members.get(discord_id).send(message)
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
    if(!code) return false;
    return /^[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}$/.test(code.toUpperCase());
  }

  this.is_smm2=function(code){
    if(!code) return false;
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
    let reuploads=await ts.getLevels().where({new_code:code})
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


  this.commandPassedBoolean=(value)=>{
    if(value==='') return null;
    if(['1',1,true].includes(value)) return 1;
    if(['0',0,false].includes(value)) return 0;
    if(value!=null) DiscordLog.error(`"${value}" was passed to this.commandPassedBoolean.`)
    return null
  }

  this.clear=async (args,strOnly)=>{

    if(args.difficulty==="like"){
      args.difficulty=null
      args.liked=1
    }

    if(args.difficulty==="unlike"){
      args.difficulty=null
      args.liked=0
    }
    if(args.liked==="like"){
      args.liked=1
    }
    if(args.liked==="unlike"){
      args.liked=0
    }

    args.liked=ts.commandPassedBoolean(args.liked)
    args.completed=ts.commandPassedBoolean(args.completed)
    
    if(args.difficulty==='') args.difficulty=null;
    if(args.difficulty==null) args.difficulty=null;

    if(args.completed==null && args.liked==null && args.difficulty==null) ts.userError(ts.message('clear.noArgs'))

    args.code=args.code.toUpperCase();

    if(args.difficulty) args.difficulty=parseFloat(args.difficulty)
      

      


    if(args.difficulty!='0' && args.difficulty && !ts.valid_difficulty(args.difficulty)){
      ts.userError(ts.message("clear.invalidDifficulty"));
    }

    if(!args.discord_id) ts.userError(ts.message("error.noDiscordId"));

    const player=await ts.get_user(args.discord_id);
    var level=await ts.getExistingLevel(args.code);
    if(level.creator_id==player.id)
      ts.userError(ts.message("clear.ownLevel"));

    var existing_play = await ts.db.Plays.query()
      .where('code','=',level.id)
      .where('player','=',player.id)
      .first();

    var creator=await ts.db.Members.query().where({ id:level.creator_id }).first(); //oddface/taika is only non registered member with a level
    if(creator && creator.atme && creator.discord_id && !strOnly){
      var creator_str="<@"+creator.discord_id+">"
    } else {
      var creator_str=creator.name
    }

    var msg=[],updated={}
    if(existing_play){
      var updated_row={}
      if(
          [1,0].includes(args.completed) &&
          existing_play.completed!==args.completed
        ){ //update completed
        updated_row.completed=args.completed?1:0;
        updated.completed=true
      }
      if(
        [1,0].includes(args.liked) &&
        existing_play.liked!==args.liked
      ){ //like updated
        updated_row.liked=args.liked;
        updated.liked=true
      }
      if(
        (args.difficulty || args.difficulty==='0' ) &&
        existing_play.difficulty_vote!=args.difficulty 
      ){ //difficulty update
        updated_row.difficulty_vote=args.difficulty==='0'?null:args.difficulty; //0 difficulty will remove your vote
        updated.difficulty=true
      }
      if(updated_row) await ts.db.Plays.query().findById(existing_play.id).patch(updated_row);
    } else {
      await ts.db.Plays.query().insert({
        code:level.id,
        player:player.id,
        completed: args.completed||0,
        liked:args.liked||0,
        difficulty_vote:args.difficulty==='0' ? null:args.difficulty
      });
      if(args.completed!=null) updated.completed=true;
      if(args.liked!=null ) updated.liked=true;
      if(args.difficulty!=null ) updated.difficulty=true;
      await ts.recalculateAfterUpdate({name:player.name})
    }

    if([0,1].includes(args.completed)){
      if(updated.completed){
        if(args.completed){
          msg.push(ts.message("clear.addClear",{level}))
          if(level.status===ts.LEVEL_STATUS.APPROVED){
            msg.push(ts.message("clear.earnedPoints",{
              earned_points:ts.getPoints(level.difficulty),
            }))
          } else {
            msg.push(ts.message("clear.pendingLevel"))
          }
        } else {
          msg.push(ts.message("clear.removedClear",{level}))
        }
      } else {
        msg.push(ts.message(args.completed ? "clear.alreadyCleared" : "clear.alreadyUncleared"));
      }
    } else {
      if(args.completed!==null) DiscordLog.log('ts.clear, args.completed was not null,1 or 0')
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

    if([0,1].includes(args.liked)){
      if(updated.liked){
        msg.push(ts.message( args.liked ? "clear.addLike": "clear.removeLike",{ level }))
      } else {
        msg.push(ts.message( args.liked ? "clear.alreadyLiked" :"clear.alreadyUnliked",{ level }))
      }
    } else {
      if(args.liked!==null) DiscordLog.log('ts.clear, args.liked was not null,1 or 0')
    }

      return (strOnly?'':player.user_reply)+ts.processClearMessage({ msg,creator_str , level });
  }

  this.processClearMessage=function({ msg,creator_str, level }){
    let level_placeholder=this.customStrings["levelInfo"]
    let level_str=ts.message("clear.levelInfo",{ level , creator:creator_str })

    let singleHave=ts.message("clear.singleHave")
    let manyHave=ts.message("clear.manyHave")
    let levelPronoun=ts.message("clear.levelPronoun")
    for(let i=0;i<msg.length;i++){
      if(msg[i]){
        msg[i]=msg[i].replace(level_placeholder,level_str)
        if(i>1) msg[i]=msg[i].replace(singleHave,manyHave);
        level_str=levelPronoun
      }
    }
    return '\n'+msg.join('\n')
  }
  this.getExistingLevel=async function(code,includeRemoved=false){

    if(!code) ts.userError(ts.message('error.noCode'));

    var level=await ts.getLevels().where({ code }).first()
    if(!level){ //level doesn't exist
      let notDeletedLevels={}
      let allLevels={}
      const _levels=await ts.getLevels().select();
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
          matchStr=ts.message('level.didYouMean',{level_info:allLevels[match.bestMatch.target]})
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
      url_slug:this.team.url_slug,
      content:message.content,
      user:message.author.username,
      channel:"<#"+message.channel.id+">"
    };
  }

  this.getUserErrorMsg=function(obj,message){
    if(typeof obj=="object" && obj.errorType=="user"){
      return obj.msg+ts.message("error.afterUserDiscord")
    } else {
      DiscordLog.error(ts.makeErrorObj(obj,message),ts.client)
      return ts.message("error.unknownError")
    }
  }

  this.getWebUserErrorMsg=function(obj){
    if(typeof obj=="object" && obj.errorType=="user"){
      return { status:"error", message:obj.msg+ts.message("error.afterUserWeb") }
    } else {
      DiscordLog.error({
        error:obj.stack?obj.stack:obj,
        url_slug:this.url_slug
      },ts.client)
      return { status:"error", message:ts.message("error.unknownError")}
    }
  }

  function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
  }

//TODO. Fix random
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

    let min=parseFloat(args.minDifficulty) || 1
    let max=parseFloat(args.maxDifficulty) || min

    const player=args.discord_id!=null? await ts.get_user(args.discord_id) : null
    let players=null;
    if(args.players){
      let playerNames=args.players.split(",");
      let rawPlayers=await ts.db.Members.query().whereIn('name',playerNames);
      players=[]
      rawPlayers.forEach( p => {
        players.push(p.id)
        if(playerNames.indexOf(p.name) === -1){
          ts.userError(ts.message("random.playerNotFound",{player:p.name}));
        }
      })
    } else {
      players=[player.id]
    }


    //console.time("get levels")
    var [ filtered_levels , fields ]=await knex.raw(`
    SELECT levels.*,members.name creator from 
    levels
    inner join members on levels.creator=members.id
    left join plays on
    levels.id=plays.code
    and plays.player in (:players:)
    and completed=1
    where status=1 
    and creator not in (:players:)
    and levels.guild_id=:team_id
    and ( levels.not_default is null or levels.not_default!=1 )
    and levels.difficulty between :min and :max
    and plays.id is null
    group by levels.id
    order by likes;`,{
      team_id:ts.team.id,
      min, max,
      players:players||-1
    })
    //var filtered_levels=[]

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

    player.created_at=player.created_at.toString()
    player.earned_points= await this.calculatePoints(player.name);
    player.rank=this.get_rank(player.earned_points.clearPoints);
    player.user_reply="<@"+discord_id+">" + (player.rank.Pips ? player.rank.Pips : "") + " ";
    return player
  }

  this.makeVoteEmbed=async function(level){
    var approveVotes = await ts.getPendingVotes().where("code",level.id).where({type:'approve'});
    var fixVotes = await ts.getPendingVotes().where("code",level.id).where({type:'fix'});
    var rejectVotes = await ts.getPendingVotes().where("code",level.id).where({type:'reject'});

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
    var fixVotes = await ts.getPendingVotes().where("code",level.id).where("type","fix");
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

      const level=await ts.getExistingLevel(args.code);
      const author = await ts.db.Members.query().where({id:level.creator_id}).first();
      var vote=await ts.getPendingVotes().where("code",level.id).where("player",shellder.id).first();

      if(!vote){
        //We only check reason if we have no vote yet
        if(!args.reason){
          ts.userError(ts.message("approval.changeReason"));
        }
      }

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


      var updating = false;
      if(!vote){
        await ts.db.PendingVotes.query().insert({
          code: level.id,
          player: shellder.id,
          type: args.type,
          difficulty_vote: (args.type=== "approve" || args.type == "fix") ? args.difficulty : null,
          reason: args.reason
        });
      } else {
        updating = true;
        var updateJson = {
          type: args.type
        }
        if(args.reason){
          updateJson.reason = args.reason;
        }
        if(args.difficulty){
          updateJson.difficulty_vote = args.difficulty || null;
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
    var approvalVotes = await ts.getPendingVotes().where({code:level.id}).where("type","approve");
    var fixVotes = await ts.getPendingVotes().where({code:level.id}).where("type","fix");
    var rejectVotes = await ts.getPendingVotes().where({code:level.id}).where("type","reject");
    var allComments = [...approvalVotes, ...fixVotes, ...rejectVotes];
    var fixComments = [...fixVotes, ...rejectVotes];

    //Count Approval and Rejection Votes
    var approvalVoteCount = approvalVotes.length;
    var fixVoteCount = fixVotes.length + approvalVotes.length;
    var rejectVoteCount = rejectVotes.length;

    let fixMode = false;

    if(rejectVoteCount >= rejectVotesNeeded && rejectVoteCount>approvalVoteCount){
      //Reject level
      await ts.db.Levels.query().patch({status:ts.LEVEL_STATUS.REMOVED})
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

        await ts.db.Levels.query().patch({
            status:ts.LEVEL_STATUS.APPROVED,
            difficulty:finalDiff,
          })
          .where({code:code})

        await ts.recalculateAfterUpdate({code})

        //Update author to set cult_member if they're not already. send initiate message and assign cult role
        if(author.is_member != 1){
          await ts.db.Members.query()
            .patch({is_member:true})
            .where({name:author.name})

          if(author.discord_id){ //!argv.test &&
            //doesn't work with mocked user method here.
            try{
              var curr_user=await guild.members.get(author.discord_id)
              if(curr_user){ //assign role
                await curr_user.addRole(ts.teamVariables.memberRoleId)
                await client.channels.get(ts.channels.initiateChannel).send(ts.message("initiation.message",{discord_id:author.discord_id}))
              } else {
                DiscordLog.error(ts.message("initiation.userNotInDiscord",{name:author.name}),ts.client) //not a breaking error.
              }
            } catch (error){
              DiscordLog.error(ts.message("initiation.userNotInDiscord",{name:author.name}),ts.client) //not a breaking error.
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

      await ts.db.Levels.query().patch({status:ts.LEVEL_STATUS.NEED_FIX})
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
    let level=ts.getLevels().where({code})
    
    var approvalVotes = await ts.getPendingVotes().where({code:level.id}).where("type","approve");
    var fixVotes = await ts.getPendingVotes().where({code:level.id}).where("type","fix");
    var rejectVotes = await ts.getPendingVotes().where({code:level.id}).where("type","reject");
    var allComments = [...approvalVotes, ...fixVotes, ...rejectVotes];

    await ts.db.Levels.query().patch({status:ts.LEVEL_STATUS.REMOVED})
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
      if(tag) tagStr.push("["+tag+"](" + server_config.page_url + ts.url_slug + "/levels/"+encodeURIComponent(tag)+")")
    })
    tagStr=tagStr.join(",")
    var embed = client.util.embed()
        .setColor("#007bff")
        .setTitle(level.level_name + " (" + level.code + ")")
        .setDescription(
          "made by "+
          (noLink?level.creator:"[" + level.creator + "](" + server_config.page_url + ts.url_slug + "/maker/" + encodeURIComponent(level.creator) + ")")+"\n"+
          (ts.is_smm1(level.code)? `Links: [Bookmark Page](https://supermariomakerbookmark.nintendo.net/courses/${level.code})\n` : '')+
          ("Difficulty: "+level.difficulty+", Clears: "+level.clears+", Likes: "+level.likes+"\n")+
            (tagStr?"Tags: "+tagStr+"\n":"")+
            (vidStr?"Clear Video: "+vidStr:"")
        )
      if(!noLink){
        embed.setURL(server_config.page_url + ts.url_slug + "/level/" + level.code)
      }

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
    var new_level=await ts.getLevels().where({code:new_code}).first()
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
    if(!(level.creator_id==player.id || player.is_mod)){
      ts.userError(ts.message("reupload.noPermission", {level}));
    }

    await ts.db.Levels.query().patch({
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
        creator:level.creator_id,
        difficulty:false,
        status:0,
        tags:level.tags,
      });
      new_level=await ts.getLevels().where({code:new_code}).first();
    }

    //await ts.deleteReuploadChannel(old_code,ts.message("approval.channelDeleted"))

    if(oldApproved == ts.LEVEL_STATUS.NEED_FIX || oldApproved == ts.LEVEL_STATUS.APPROVED ){
      //set the new one to fix request status and add channel
      //Move pending votes to the new level
      await ts.db.PendingVotes.query()
        .patch({code: new_level.id})
        .where({code:level.id})


      await ts.db.Levels.query()
        .patch({status:ts.LEVEL_STATUS.NEED_FIX})
        .where({code:new_code})

      const author = await ts.db.Members.query()
        .where({id:new_level.creator_id})
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
    return {
      clearPoints:member.clear_score_sum.toFixed(1),
      levelsMade:member.levels_created,
      freeSubmissions:member.free_submissions,
      available:this.levelsAvailable( member.clear_score_sum,member.levels_created-(if_remove_check?1:0),member.free_submissions),
    }
  }
}
TS.TS_LIST={}

TS.add=async (guild_id,team,client)=>{
  TS.TS_LIST[guild_id]=new TS(guild_id,team,client)
  await TS.TS_LIST[guild_id].load()
  return TS.TS_LIST[guild_id];
}

TS.teamFromUrl=(url_slug)=>{
  for(let i in TS.TS_LIST){
    let team=TS.TS_LIST[i]
    if(team.config && team.url_slug == url_slug){
      return team;
    }
  }
  return false
}

TS.message=function(type,args){
  if(TS.defaultMessages[type]){
    return TS.defaultMessages[type](args)
  }
  throw `"${type}" message string was not found in ts.message`;
}

TS.teams=(guild_id)=>{
  if(TS.TS_LIST[guild_id]){
    return TS.TS_LIST[guild_id];
  } else {
    throw `This team, with guild id ${guild_id} has not yet setup it's config, buzzyS`;
  }
}

TS.create=async (args,client)=>{
  if(!args) throw new Error(`No arguments passed to TS.create`)
  const { guild_id } = args;
  const Team=require('./models/Teams.js')()
  let existingTeam=await Team.query().where({ guild_id }).first()
  if(!existingTeam){
    await Team.query().insert(args)
    let existingTeam=await Team.query().where({ guild_id }).first()
    if(!existingTeam) new Error(`Can't get get row after inserting`);
    return await TS.add(existingTeam.guild_id,existingTeam,client)
  } else {
    throw new Error(`Server already registered as ${existingTeam.guild_name}`)
  }
}

module.exports=TS