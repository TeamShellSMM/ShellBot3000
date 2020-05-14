'use strict';
global.TEST={}
const chai = require('chai');
const { AkairoClient } = require('discord-akairo');
const WebApi=require('../WebApi');
global.assert = chai.assert;
global.TEST.knex= require('../db/knex');
global.TEST.request = require('supertest');
global.TEST.config = require('../config.json')['test']; //force testing TEST.config
global.TEST.config.defaultCooldown=0;
global.TS=require('../TS.js')
let DiscordLog=require('../DiscordLog');
DiscordLog.log=(obj,client)=>{}
DiscordLog.error=(obj,client)=>{ console.log(obj) }




after(async()=>{
  await TEST.client.destroy();
  await TEST.knex.destroy();
})

before(async()=>{
  global.TEST.client=new AkairoClient(TEST.config, {
    disableEveryone: true
  });
  await TEST.client.login(TEST.config.discord_access_token);
  assert.exists(global.TEST.client,'should have dicord client right now')

  TEST.bot_id=TEST.client.user.id
  TEST.userBot=global.TEST.config.userBot
  global.TEST.message=await TEST.client.channels.get(TEST.config.initTestChannel).send('ShellBotted');
  await global.TEST.message.delete()

  await TEST.knex.raw(`
    SET FOREIGN_KEY_CHECKS = 0; 
    TRUNCATE table tags;
    TRUNCATE table teams;
    TRUNCATE table points;
    TRUNCATE table ranks;
    TRUNCATE table team_settings;
    SET FOREIGN_KEY_CHECKS = 1;
  `);

  const defaultTeam=[{
      guild_id:TEST.config.AutomatedTest,
      guild_name:"MakerTeam",
      url_slug:"makerteam",
      config:"{\"feedback_salt\": \"123\"}",
    },
  ]
  const defaultSettings=[
    {guild_id:1,name:'TeamName',value:'AutoTest',type:'settings',admin_id:1},
    {guild_id:1,name:'ModName',value:'Jampolice',type:'settings',admin_id:1},
    {guild_id:1,name:'BotName',value:'Autobot',type:'settings',admin_id:1},
    {guild_id:1,name:'Minimum Point',value:0,type:'settings',admin_id:1},
    {guild_id:1,name:'New Level',value:0,type:'settings',admin_id:1},
    {guild_id:1,name:'VotesNeeded',value:1,type:'settings',admin_id:1},
    {guild_id:1,name:'memberRoleId',value:'701487078852001942',type:'settings',admin_id:1},
    {guild_id:1,name:'isTesting',value:'yes',type:'settings',admin_id:1},
    {guild_id:1,name:'VotesNeededReject',value:null,type:'settings',admin_id:1},
    {guild_id:1,name:'VotesNeededFix',value:null,type:'settings',admin_id:1},
    {guild_id:1,name:'includeOwnPoints',value:null,type:'settings',admin_id:1},
    {guild_id:1,name:'modChannel',value:'703205477491671090',type:'channels',admin_id:1},
    {guild_id:1,name:'initiateChannel',value:'704991246757658692',type:'channels',admin_id:1},
    {guild_id:1,name:'levelChangeNotification',value:'704991248259350618',type:'channels',admin_id:1},
    {guild_id:1,name:'commandFeed',value:'704991250096586752',type:'channels',admin_id:1},
    {guild_id:1,name:'feedbackChannel',value:'704991254072786944',type:'channels',admin_id:1},
    {guild_id:1,name:'pendingReuploadCategory',value:'709534212306239489',type:'channels',admin_id:1},
    {guild_id:1,name:'levelDiscussionCategory',value:'709534284905709578',type:'channels',admin_id:1},
  ];

const points=[
  {guild_id:1,difficulty:'0.0',score:'0.0'},
{guild_id:1,difficulty:'0.1',score:'0.1'},
{guild_id:1,difficulty:'0.2',score:'0.2'},
{guild_id:1,difficulty:'0.3',score:'0.3'},
{guild_id:1,difficulty:'0.4',score:'0.4'},
{guild_id:1,difficulty:'0.5',score:'0.5'},
{guild_id:1,difficulty:'0.6',score:'0.6'},
{guild_id:1,difficulty:'0.7',score:'0.7'},
{guild_id:1,difficulty:'0.8',score:'0.8'},
{guild_id:1,difficulty:'0.9',score:'0.9'},
{guild_id:1,difficulty:'1.0',score:'1.0'},
{guild_id:1,difficulty:'1.1',score:'1.1'},
{guild_id:1,difficulty:'1.2',score:'1.2'},
{guild_id:1,difficulty:'1.3',score:'1.3'},
{guild_id:1,difficulty:'1.4',score:'1.4'},
{guild_id:1,difficulty:'1.5',score:'1.5'},
{guild_id:1,difficulty:'1.6',score:'1.6'},
{guild_id:1,difficulty:'1.7',score:'1.7'},
{guild_id:1,difficulty:'1.8',score:'1.8'},
{guild_id:1,difficulty:'1.9',score:'1.9'},
{guild_id:1,difficulty:'2.0',score:'2.0'},
{guild_id:1,difficulty:'2.1',score:'2.1'},
{guild_id:1,difficulty:'2.2',score:'2.2'},
{guild_id:1,difficulty:'2.3',score:'2.3'},
{guild_id:1,difficulty:'2.4',score:'2.4'},
{guild_id:1,difficulty:'2.5',score:'2.5'},
{guild_id:1,difficulty:'2.6',score:'2.6'},
{guild_id:1,difficulty:'2.7',score:'2.7'},
{guild_id:1,difficulty:'2.8',score:'2.8'},
{guild_id:1,difficulty:'2.9',score:'2.9'},
{guild_id:1,difficulty:'3.0',score:'3.0'},
{guild_id:1,difficulty:'3.1',score:'3.1'},
{guild_id:1,difficulty:'3.2',score:'3.2'},
{guild_id:1,difficulty:'3.3',score:'3.3'},
{guild_id:1,difficulty:'3.4',score:'3.4'},
{guild_id:1,difficulty:'3.5',score:'3.5'},
{guild_id:1,difficulty:'3.6',score:'3.6'},
{guild_id:1,difficulty:'3.7',score:'3.7'},
{guild_id:1,difficulty:'3.8',score:'3.8'},
{guild_id:1,difficulty:'3.9',score:'3.9'},
{guild_id:1,difficulty:'4.0',score:'4.0'},
{guild_id:1,difficulty:'4.1',score:'4.1'},
{guild_id:1,difficulty:'4.2',score:'4.2'},
{guild_id:1,difficulty:'4.3',score:'4.3'},
{guild_id:1,difficulty:'4.4',score:'4.4'},
{guild_id:1,difficulty:'4.5',score:'4.5'},
{guild_id:1,difficulty:'4.6',score:'4.6'},
{guild_id:1,difficulty:'4.7',score:'4.7'},
{guild_id:1,difficulty:'4.8',score:'4.8'},
{guild_id:1,difficulty:'4.9',score:'4.9'},
{guild_id:1,difficulty:'5.0',score:'5.0'},
{guild_id:1,difficulty:'5.1',score:'5.1'},
{guild_id:1,difficulty:'5.2',score:'5.2'},
{guild_id:1,difficulty:'5.3',score:'5.3'},
{guild_id:1,difficulty:'5.4',score:'5.4'},
{guild_id:1,difficulty:'5.5',score:'5.5'},
{guild_id:1,difficulty:'5.6',score:'5.6'},
{guild_id:1,difficulty:'5.7',score:'5.7'},
{guild_id:1,difficulty:'5.8',score:'5.8'},
{guild_id:1,difficulty:'5.9',score:'5.9'},
{guild_id:1,difficulty:'6.0',score:'6.0'},
{guild_id:1,difficulty:'6.1',score:'6.1'},
{guild_id:1,difficulty:'6.2',score:'6.2'},
{guild_id:1,difficulty:'6.3',score:'6.3'},
{guild_id:1,difficulty:'6.4',score:'6.4'},
{guild_id:1,difficulty:'6.5',score:'6.5'},
{guild_id:1,difficulty:'6.6',score:'6.6'},
{guild_id:1,difficulty:'6.7',score:'6.7'},
{guild_id:1,difficulty:'6.8',score:'6.8'},
{guild_id:1,difficulty:'6.9',score:'6.9'},
{guild_id:1,difficulty:'7.0',score:'7.0'},
{guild_id:1,difficulty:'7.1',score:'7.1'},
{guild_id:1,difficulty:'7.2',score:'7.2'},
{guild_id:1,difficulty:'7.3',score:'7.3'},
{guild_id:1,difficulty:'7.4',score:'7.4'},
{guild_id:1,difficulty:'7.5',score:'7.5'},
{guild_id:1,difficulty:'7.6',score:'7.6'},
{guild_id:1,difficulty:'7.7',score:'7.7'},
{guild_id:1,difficulty:'7.8',score:'7.8'},
{guild_id:1,difficulty:'7.9',score:'7.9'},
{guild_id:1,difficulty:'8.0',score:'8.0'},
{guild_id:1,difficulty:'8.1',score:'8.1'},
{guild_id:1,difficulty:'8.2',score:'8.2'},
{guild_id:1,difficulty:'8.3',score:'8.3'},
{guild_id:1,difficulty:'8.4',score:'8.4'},
{guild_id:1,difficulty:'8.5',score:'8.5'},
{guild_id:1,difficulty:'8.6',score:'8.6'},
{guild_id:1,difficulty:'8.7',score:'8.7'},
{guild_id:1,difficulty:'8.8',score:'8.8'},
{guild_id:1,difficulty:'8.9',score:'8.9'},
{guild_id:1,difficulty:'9.0',score:'9.0'},
{guild_id:1,difficulty:'9.1',score:'9.1'},
{guild_id:1,difficulty:'9.2',score:'9.2'},
{guild_id:1,difficulty:'9.3',score:'9.3'},
{guild_id:1,difficulty:'9.4',score:'9.4'},
{guild_id:1,difficulty:'9.5',score:'9.5'},
{guild_id:1,difficulty:'9.6',score:'9.6'},
{guild_id:1,difficulty:'9.7',score:'9.7'},
{guild_id:1,difficulty:'9.8',score:'9.8'},
{guild_id:1,difficulty:'9.9',score:'9.9'},
{guild_id:1,difficulty:'10.0',score:'10.0'},
];
const defaultRanks=[{admin_id:1,guild_id:1,min_points:0,rank:'no rank',pips:'',discord_role:''},
{admin_id:1,guild_id:1,min_points:5,rank:'rank1',pips:'',discord_role:'703547357182034041'},
{admin_id:1,guild_id:1,min_points:20,rank:'rank2',pips:'',discord_role:'703547391948750880'}];

  await TEST.knex.transaction(async(trx)=>{
    await trx.raw('SET FOREIGN_KEY_CHECKS = 0; ');
    await trx('teams').insert(defaultTeam);
    await trx('team_settings').insert(defaultSettings);
    await trx('points').insert(points);
    await trx('ranks').insert(defaultRanks);
    await trx.raw('SET FOREIGN_KEY_CHECKS = 1; ');
  })
  

  global.TEST.ts=await TS.add(TEST.config.AutomatedTest,global.TEST.client)

  global.app = await WebApi(TEST.config,TEST.client);

  global.TEST.mockMessage=async (template,{ type , discord_id },args)=>{
    let msg=TEST.ts.message(template,args);
    if(type=='userError') return msg+TEST.ts.message('error.afterUserDiscord');
    if(type=='registeredSuccess'){
      let user=await TEST.ts.get_user(discord_id);
      return user.user_reply+msg;
    }
    return msg;
  }

  global.TEST.sleep=(ms)=>{
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  global.TEST.setupData=async(data)=>{
    const ret=await TEST.knex.transaction(async(trx)=>{
      await TEST.clearDb(trx) 
      for(let i in data){
        for(let j=0;j<data[i].length;j++){
          await TEST.ts.db[i].query(trx).insert(data[i][j])
        }
      }
    })
    await TEST.ts.recalculateAfterUpdate()
  }
  
  global.TEST.clearTable=async(table,trx)=>{
    return await (trx || TEST.knex).raw(`
      SET FOREIGN_KEY_CHECKS = 0; 
      TRUNCATE table ??;
      SET FOREIGN_KEY_CHECKS = 1;
    `,[table]);
  }

  const all_tables=['plays','pending_votes','levels','members','tokens','competition_winners','tags','seasons'];
  global.TEST.clearDb=async(trx)=>{
    for(let table of all_tables){
      await TEST.clearTable(table,trx)
    }
  }


  global.TEST.acceptReply=()=>{
    let guild=TEST.ts.getGuild();
    let cache=[]
    function collect_reply(args){
      cache.push(args)
    }
    TEST.ts.sendDM=(discord_id,msg)=>{
      collect_reply(msg)
    }
    TEST.message.author.send=collect_reply
    guild.channels.forEach((c)=>{
      c.send=collect_reply
      c.reply=collect_reply
    })
    return ()=>{
      if(cache.length==1) return cache[0]
      return cache;
    }
  }

  global.TEST.clearChannels=async ()=>{
    const guild=global.TEST.ts.getGuild()
    const channels=guild.channels.array()
    for(let i=0;i<channels.length;i++){
      let channel=channels[i]
      if(global.TEST.ts.channels.levelDiscussionCategory && channel.parentID === global.TEST.ts.channels.levelDiscussionCategory 
        || global.TEST.ts.channels.pendingReuploadCategory && channel.parentID === global.TEST.ts.channels.pendingReuploadCategory){
          await channel.delete('AUTOTEST')
      } else if(TEST.ts.valid_code(channel.name)){
        await channel.delete('AUTOTEST')
      }
    }
  }
  /**
   * Create a channel
   * @param {Object} args passed parameter object
   * @param {string} args.name channel name
   * @param {string} args.parentID the id of the parent channel
   */
  global.TEST.createChannel=async({ name, parent })=>{
    const guild=global.TEST.ts.getGuild()
    await guild.createChannel(name, {
      type: 'text',
      parent,
    })
  }

  global.TEST.clearUserBot=async()=>{
    const guild=global.TEST.ts.getGuild();
    const allRoles=guild.roles.filter((r)=> r.name!=="TestUser" && r.name!=="ShellBot Testing").map((r)=>r.id)
    const member=guild.members.get(TEST.userBot)
    await member.removeRoles(allRoles)
  }

  global.TEST.getUserBot=async ()=>{
    const guild=global.TEST.ts.getGuild();
    const member=guild.members.get(TEST.userBot);
    return member;
  }
  global.TEST.findChannel=({ name, parentID })=>{
    const guild=global.TEST.ts.getGuild()
    return guild.channels.find((channel)=> (!parentID || parentID && channel.parentID===parentID)&& channel.name===name.toLowerCase())
  }
  global.TEST.expectReply=(waitFor=10000)=>{
    return new Promise(function(_fulfill,reject){
      let clearId;
      const result=TEST.acceptReply()
      function fulfill(){
        clearTimeout(clearId);
        TEST.message.author.id=TEST.bot_id
        TEST.ts.promisedCallback=null
        _fulfill(result());
      }
      clearId=setTimeout(fulfill,waitFor)
      TEST.ts.promisedCallback=fulfill
      TEST.ts.promisedReject=reject
    })
  }
  
  global.TEST.mockBotSend=async ({ cmd , channel, discord_id, waitFor })=>{
    let guild=TEST.ts.getGuild()
    TEST.message.author.id=discord_id;
    TEST.message.content = cmd;
    channel=channel || global.TEST.ts.channels.modChannel
    if(/[^0-9]/.test(channel)){
      TEST.message.channel=await guild.channels.find(c => c.name === channel.toLowerCase())
    } else {
      TEST.message.channel=await guild.channels.get(channel)
    }
  
    const ret=global.TEST.expectReply(waitFor)
    TEST.client.emit("message",TEST.message)
    return await ret;
  }
})


describe('Setup test and check teams registration',function(){

  it('Creating discord connection and sending a message',async function(){
    assert.isOk(TEST.client,'client is okay')
    assert.isOk(TEST.message,'message is sent');
  });

  it('Creating team info and TS',async function(){
    let [ teams ]=await TEST.knex.raw(`SELECT * FROM teams;`);
    assert.lengthOf(teams,1,'Should have created teams');
    assert.isOk(TEST.ts,'ts is created')
  });

  it('Creating web api',async function(){
    assert.isOk(app,'App is created')
  });
})