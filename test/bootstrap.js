'use strict';
global.TEST={}
const chai = require('chai');
const { AkairoClient } = require('discord-akairo');
const WebApi=require('../WebApi');
global.assert = chai.assert;
global.TEST.knex= require('../db/knex');
global.TEST.request = require('supertest');
global.TEST.config = require('../config.json')['testing']; //force testing TEST.config
global.TEST.config.defaultCooldown=0;
global.TS=require('../TS.js')
let DiscordLog=require('../DiscordLog');
DiscordLog.log=(obj,client)=>{}
DiscordLog.error=(obj,client)=>{ console.log(obj) }

function mockGS(){
  const data={
    "TeamSettings":[
      {Name:'TeamName',value:'AutoTest'},
      {Name:'ModName',value:'Jampolice'},
      {Name:'BotName',value:'Autobot'},
      {Name:'Minimum Point',value:0},
      {Name:'New Level',value:0},
      {Name:'VotesNeeded',value:1},
      {Name:'memberRoleId',value:'701487078852001942'}, //change memberRoleId to name?
      {Name:'isTesting',value:'yes'},
      {Name:'VotesNeededReject',value:null},
      {Name:'VotesNeededFix',value:null},
      {Name:'includeOwnPoints',value:null},
    ],
    "CustomString":[],
    "Messages":[],
    "Channels":[
      {Name:'modChannel',value:'703205477491671090',default:'bot-mod-channel',description:'The only channel where mod commands will work (approve,rerate). Only mods should be able to send/read channel'},
      {Name:'initiateChannel',value:'704991246757658692',default:'bot-makerteam-initiation',description:'The channel where the member will be notified if they officially become a member. This channel should be read only to everybody'},
      {Name:'levelChangeNotification',value:'704991248259350618',default:'bot-level-updates',description:'The channel where level approvals,rejections and rerates notifications are posted by the bot. This should be readonly to everyone'},
      {Name:'commandFeed',value:'704991250096586752',default:'bot-command-feed',description:'This is where clears/likes and other commands from the web will be shown. This should be read only to everyone'},
      {Name:'pendingReuploadCategory',value:'704991252256522290',default:'bot-pending-reupload',description:'The channel where level reuploads are discussed. Only mods should be able to send/read this category'},
      {Name:'feedbackChannel',value:'704991254072786944',default:'bot-makerteam-feedback',description:'Channel where the anonymous feedback will be posted. This should be readonly for whoever can read the feedback'},
      {Name:'levelDiscussionCategory',value:'704991256140316712',default:'bot-pending-discussion',description:'Channel category where pending channels will be created. Only mods should be able to send/read this category'},
    ],
    "Emotes":[
      {Name:'robo',value:null},
      {Name:'think',value:null},
      {Name:'PigChamp',value:null},
      {Name:'buzzyS',value:null},
      {Name:'bam',value:null},
      {Name:'love',value:null},
      {Name:'GG',value:null},
      {Name:'axemuncher',value:null},
      {Name:'judgement',value:null},
    ],
    "Ranks":[
      {'Min Points':0,Rank:'no rank',Pips:'',discord_roles:''},
      {'Min Points':5,Rank:'rank1',Pips:'',discord_roles:'703547357182034041'},
      {'Min Points':20,Rank:'rank2',Pips:'',discord_roles:'703547391948750880'},
      {'Min Points':40,Rank:'rank3',Pips:'',discord_roles:''},
      {'Min Points':75,Rank:'rank4',Pips:'',discord_roles:''},
      {'Min Points':120,Rank:'rank5',Pips:'',discord_roles:''},
      {'Min Points':175,Rank:'rank6',Pips:'',discord_roles:''},
      {'Min Points':250,Rank:'rank7',Pips:'',discord_roles:''},
    ],
    "Seasons":[
      {"StartDate":null,Name:'Season 1'},
    ],
    "Competition Winners":[
      //{Code:'',Creator:'','Competition Name':'',Rank:''}
    ],
    "Points":[
      {Difficulty:'0.0',Points:'0.0'},
      {Difficulty:'0.1',Points:'0.1'},
      {Difficulty:'0.2',Points:'0.2'},
      {Difficulty:'0.3',Points:'0.3'},
      {Difficulty:'0.4',Points:'0.4'},
      {Difficulty:'0.5',Points:'0.5'},
      {Difficulty:'0.6',Points:'0.6'},
      {Difficulty:'0.7',Points:'0.7'},
      {Difficulty:'0.8',Points:'0.8'},
      {Difficulty:'0.9',Points:'0.9'},
      {Difficulty:'1.0',Points:'1.0'},
      {Difficulty:'1.1',Points:'1.1'},
      {Difficulty:'1.2',Points:'1.2'},
      {Difficulty:'1.3',Points:'1.3'},
      {Difficulty:'1.4',Points:'1.4'},
      {Difficulty:'1.5',Points:'1.5'},
      {Difficulty:'1.6',Points:'1.6'},
      {Difficulty:'1.7',Points:'1.7'},
      {Difficulty:'1.8',Points:'1.8'},
      {Difficulty:'1.9',Points:'1.9'},
      {Difficulty:'2.0',Points:'2.0'},
      {Difficulty:'2.1',Points:'2.1'},
      {Difficulty:'2.2',Points:'2.2'},
      {Difficulty:'2.3',Points:'2.3'},
      {Difficulty:'2.4',Points:'2.4'},
      {Difficulty:'2.5',Points:'2.5'},
      {Difficulty:'2.6',Points:'2.6'},
      {Difficulty:'2.7',Points:'2.7'},
      {Difficulty:'2.8',Points:'2.8'},
      {Difficulty:'2.9',Points:'2.9'},
      {Difficulty:'3.0',Points:'3.0'},
      {Difficulty:'3.1',Points:'3.1'},
      {Difficulty:'3.2',Points:'3.2'},
      {Difficulty:'3.3',Points:'3.3'},
      {Difficulty:'3.4',Points:'3.4'},
      {Difficulty:'3.5',Points:'3.5'},
      {Difficulty:'3.6',Points:'3.6'},
      {Difficulty:'3.7',Points:'3.7'},
      {Difficulty:'3.8',Points:'3.8'},
      {Difficulty:'3.9',Points:'3.9'},
      {Difficulty:'4.0',Points:'4.0'},
      {Difficulty:'4.1',Points:'4.1'},
      {Difficulty:'4.2',Points:'4.2'},
      {Difficulty:'4.3',Points:'4.3'},
      {Difficulty:'4.4',Points:'4.4'},
      {Difficulty:'4.5',Points:'4.5'},
      {Difficulty:'4.6',Points:'4.6'},
      {Difficulty:'4.7',Points:'4.7'},
      {Difficulty:'4.8',Points:'4.8'},
      {Difficulty:'4.9',Points:'4.9'},
      {Difficulty:'5.0',Points:'5.0'},
      {Difficulty:'5.1',Points:'5.1'},
      {Difficulty:'5.2',Points:'5.2'},
      {Difficulty:'5.3',Points:'5.3'},
      {Difficulty:'5.4',Points:'5.4'},
      {Difficulty:'5.5',Points:'5.5'},
      {Difficulty:'5.6',Points:'5.6'},
      {Difficulty:'5.7',Points:'5.7'},
      {Difficulty:'5.8',Points:'5.8'},
      {Difficulty:'5.9',Points:'5.9'},
      {Difficulty:'6.0',Points:'6.0'},
      {Difficulty:'6.1',Points:'6.1'},
      {Difficulty:'6.2',Points:'6.2'},
      {Difficulty:'6.3',Points:'6.3'},
      {Difficulty:'6.4',Points:'6.4'},
      {Difficulty:'6.5',Points:'6.5'},
      {Difficulty:'6.6',Points:'6.6'},
      {Difficulty:'6.7',Points:'6.7'},
      {Difficulty:'6.8',Points:'6.8'},
      {Difficulty:'6.9',Points:'6.9'},
      {Difficulty:'7.0',Points:'7.0'},
      {Difficulty:'7.1',Points:'7.1'},
      {Difficulty:'7.2',Points:'7.2'},
      {Difficulty:'7.3',Points:'7.3'},
      {Difficulty:'7.4',Points:'7.4'},
      {Difficulty:'7.5',Points:'7.5'},
      {Difficulty:'7.6',Points:'7.6'},
      {Difficulty:'7.7',Points:'7.7'},
      {Difficulty:'7.8',Points:'7.8'},
      {Difficulty:'7.9',Points:'7.9'},
      {Difficulty:'8.0',Points:'8.0'},
      {Difficulty:'8.1',Points:'8.1'},
      {Difficulty:'8.2',Points:'8.2'},
      {Difficulty:'8.3',Points:'8.3'},
      {Difficulty:'8.4',Points:'8.4'},
      {Difficulty:'8.5',Points:'8.5'},
      {Difficulty:'8.6',Points:'8.6'},
      {Difficulty:'8.7',Points:'8.7'},
      {Difficulty:'8.8',Points:'8.8'},
      {Difficulty:'8.9',Points:'8.9'},
      {Difficulty:'9.0',Points:'9.0'},
      {Difficulty:'9.1',Points:'9.1'},
      {Difficulty:'9.2',Points:'9.2'},
      {Difficulty:'9.3',Points:'9.3'},
      {Difficulty:'9.4',Points:'9.4'},
      {Difficulty:'9.5',Points:'9.5'},
      {Difficulty:'9.6',Points:'9.6'},
      {Difficulty:'9.7',Points:'9.7'},
      {Difficulty:'9.8',Points:'9.8'},
      {Difficulty:'9.9',Points:'9.9'},
      {Difficulty:'10.0',Points:'10.0'},
      {Difficulty:'10.5',Points:'10.5'},
      {Difficulty:'11.0',Points:'11.0'},
      {Difficulty:'12.0',Points:'12.0'},
    ],
    tags:[
      {Tag:'tag1',Type:'success',Seperate:null,add_lock:null,remove_lock:null,},
      {Tag:'tag2',Type:'success',Seperate:null,add_lock:null,remove_lock:null,},
      {Tag:'seperate',Type:'warning',Seperate:1,add_lock:null,remove_lock:null,},
      {Tag:'all_locked',Type:'success',Seperate:null,add_lock:1,remove_lock:1,},
      {Tag:'remove_lock',Type:'success',Seperate:null,add_lock:null,remove_lock:1,},
    ],
  }
  this.loadSheets=()=>{}
  this.select=(tableName)=>{
    return data[tableName];
  }
  this.clearCache=()=>{};
}


after(async()=>{
  await client.destroy();
  await TEST.knex.destroy();
})


describe('Setup test and check teams registration',function(){

  it('Creating discord connection and sending a message',async function(){
    global.client=new AkairoClient(TEST.config, {
      disableEveryone: true
    });
    await client.login(TEST.config.discord_access_token);
    TEST.bot_id=client.user.id
    assert.isOk(client,'client is okay')
    global.message=await client.channels.get(TEST.config.initTestChannel).send('ShellBotted');
    await global.message.delete()
    assert.isOk(message,'message is sent');
  });

  it('Creating team info and TS',async function(){
    await TEST.knex.raw(`
      SET FOREIGN_KEY_CHECKS = 0; 
      TRUNCATE table teams;
      TRUNCATE table points;
      SET FOREIGN_KEY_CHECKS = 1;
    `);
    global.TEST.ts=await TS.create(TEST.config.testConfig,client,new mockGS())

    let [teams,fields]=await TEST.knex.raw(`SELECT * FROM teams;`);
    assert.lengthOf(teams,1,'Should have created teams');

    assert.isOk(TEST.ts,'ts is created')
  });

  it('Creating web api',async function(){
    global.app = await WebApi(TEST.config,client);
    assert.isOk(app,'App is created')
  });


  it('Setting up test functions',async function(){
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
      await TEST.clearDb() 
      await TEST.knex.transaction(async(trx)=>{
        for(let i in data){
          for(let j=0;j<data[i].length;j++){
            await TEST.ts.db[i].query(trx).insert(data[i][j])
          }
        }
      })
      TEST.ts.recalculateAfterUpdate()
    }
    
    global.TEST.clearTable=async(table,trx)=>{
      await (trx || TEST.knex).raw(`
        SET FOREIGN_KEY_CHECKS = 0; 
        TRUNCATE table ??;
        SET FOREIGN_KEY_CHECKS = 1;
      `,[table]);
    }
  
    const all_tables=['plays','pending_votes','levels','members','tokens'];
    global.TEST.clearDb=async()=>{
      await TEST.knex.transaction(async(trx)=>{
        for(let table of all_tables){
          await TEST.clearTable(table,trx)
        }
      })
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
      message.author.send=collect_reply
      guild.channels.forEach((c)=>{
        c.send=collect_reply
        c.reply=collect_reply
      })
      return ()=>{
        if(cache.length==1) cache=cache[0]
        return cache;
      }
    }
    
    global.TEST.expectReply=(waitFor=10000)=>{
      return new Promise(function(_fulfill,reject){
        let clearId;
        const result=TEST.acceptReply()
        function fulfill(){
          clearTimeout(clearId);
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
      message.author.id=discord_id;
      message.content = cmd;
      channel=channel || global.TEST.ts.channels.modChannel
      if(/[^0-9]/.test(channel)){
        message.channel=await guild.channels.find(c => c.name === channel.toLowerCase())
      } else {
        message.channel=await guild.channels.get(channel)
      }
    
      const ret=global.TEST.expectReply(waitFor)
      client.emit("message",message)
      return await ret;
    }
    
  });
})