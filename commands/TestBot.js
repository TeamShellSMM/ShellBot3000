const { Command } = require('discord-akairo');
const TS = require('../TS');
class TestBot extends Command {
  constructor() {
    super('test', {
      aliases: ['test'],
      prefix:'?',
    });
  }

  async canRun(ts,message,config){
    //can only be run in with config is setup properly
    if(config.AutomatedTest!==message.guild.id) return false;

    if(config.ownerID && config.ownerID.indexOf(message.author.id)!==-1){
      return true;
    }
    if(config.devs && config.devs.indexOf(message.author.id)!==-1){
      return true;
    }

    //can be called by the bot itself
    if(message.author.id==ts.client.user.id) return true;

    return false;
  }


  async exec(message,args) {

    let ts;
    try {
      ts=TS.teams(message.guild.id)
    } catch(error){
      message.reply(error)
      throw error;
    }
    

    const config = require('../config.json');

    if(!this.canRun(ts,message,config)) return false;

    const argv = require('yargs').argv;

    try{
      //just setup consistent
      ts.teamVariables['Minimum Point']=0;
      ts.teamVariables['New Level']=0;
      ts.teamVariables.ApprovalVotesNeeded=1;
      ts.teamVariables.RejectionVotesNeeded=1;
      ts.teamVariables.memberRoleId='701487078852001942';
      ts.teamVariables.includeOwnPoints=false;

      const bot_id=ts.client.user.id
      const guild=ts.getGuild()
      message.author.id=bot_id



      const testTables=["Members","Levels","Plays","PendingVotes",]
      async function clearDb(){
        for(let i=0;i<testTables.length;i++){
          await ts.db[testTables[i]].query().select().del()
        }
      }


      async function setupData(data){
        await clearDb()
        for(let i in data){
          for(let j=0;j<data[i].length;j++){
            await ts.db[i].query().insert(data[i][j])
          }
        }
        ts.recalculateAfterUpdate()
      }

      const defaultChannel=ts.channels.modChannel
      const DISCORDTESTS=[{
          description:'rerate:succesful',
          cmd:'!rerate xxx-xxx-xxx 3 "It\'s a doozey"',
          discord_id:bot_id,
          initialData:{
            Members:[{
              name:'Mod',
              discord_id:bot_id,
            },{
              name:'Creator',
              discord_id:'256',
            }],
            Levels:[{
              level_name:'EZ GG',
              creator:'Creator',
              code:'XXX-XXX-XXX',
              status:1,
              difficulty:1,
            }]
          },
          expected:ts.message('difficulty.success'),
        },{
          description:'rerate:not in mod channel. do nothing',
          cmd:'!rerate xxx-xxx-xxx 3 "It\'s a doozey"',
          discord_id:bot_id,
          channel:'general',
          initialData:{
            Members:[{
              name:'Mod',
              discord_id:bot_id,
            },{
              name:'Creator',
              discord_id:'256',
            }],
            Levels:[{
              level_name:'EZ GG',
              creator:'Creator',
              code:'XXX-XXX-XXX',
              status:1,
              difficulty:1,
            }]
          },
          expected:null,
        },{
          description:'rerate:no arguments',
          cmd:'!rerate',
          type:'userError',
          discord_id:bot_id,
          initialData:{
            Members:[{
              name:'Mod',
              discord_id:bot_id,
            },{
              name:'Creator',
              discord_id:'256',
            }],
            Levels:[{
              level_name:'EZ GG',
              creator:'Creator',
              code:'XXX-XXX-XXX',
              status:1,
              difficulty:1,
            }]
          },
          expected:ts.message('error.noCode'),
        },{
          description:'rerate:no reason',
          cmd:'!rerate xxx-xxx-xxx 3',
          type:'userError',
          discord_id:bot_id,
          initialData:{
            Members:[{
              name:'Mod',
              discord_id:bot_id,
            },{
              name:'Creator',
              discord_id:'256',
            }],
            Levels:[{
              level_name:'EZ GG',
              creator:'Creator',
              code:'XXX-XXX-XXX',
              status:1,
              difficulty:1,
            }]
          },
          expected:ts.message('difficulty.noReason'),
        },{
          description:'Other people can\'t remove levels',
          cmd:'!removelevel xxx-xxx-xxx "i trollol"',
          discord_id:'128',
          initialData:{
            Members:[{
              name:'Troll',
              discord_id:'128',
            },{
              name:'Creator',
              discord_id:'256',
            }],
            Levels:[{
              level_name:'Dont remove me bro',
              creator:'Creator',
              code:'XXX-XXX-XXX',
              status:1,
              difficulty:1,
            }]
          },
          type:'userError',
          expected:ts.message('removeLevel.cant',{
            level_name:'Dont remove me bro',
            creator:'Creator',
            code:'XXX-XXX-XXX',
            status:1,
            difficulty:1,
          }),
        },{
          description:'Creator can remove levels',
          cmd:'!removelevel xxx-xxx-xxx "i hate it"',
          discord_id:'256',
          initialData:{
            Members:[{
              name:'Creator',
              discord_id:'256',
            }],
            Levels:[{
              level_name:'Dont remove me bro',
              creator:'Creator',
              code:'XXX-XXX-XXX',
              status:1,
              difficulty:1,
            }]
          },
          type:'registeredSuccess',
          expected:ts.message('removeLevel.success',{
            level_name:'Dont remove me bro',
            creator:'Creator',
            code:'XXX-XXX-XXX',
            status:1,
            difficulty:1,
          }),
        },{
          description:'Mods can remove levels',
          cmd:'!removelevel xxx-xxx-xxx "I use my veto powers on you"',
          discord_id:'512',
          initialData:{
            Members:[{
              name:'Creator',
              discord_id:'256',
            },{
              name:'Mod',
              discord_id:'512',
            }],
            Levels:[{
              level_name:'Dont remove me bro',
              creator:'Creator',
              code:'XXX-XXX-XXX',
              status:1,
              difficulty:1,
            }]
          },
          setup:async function(){
            ts.mods=['512'] //setup 123 a mod
          },
          type:'registeredSuccess',
          expected:ts.message('removeLevel.success',{
            level_name:'Dont remove me bro',
            creator:'Creator',
            code:'XXX-XXX-XXX',
            status:1,
            difficulty:1,
          }),
        },{
          description:'Remove level without any parameters',
          cmd:'!removelevel',
          discord_id:'256',
          initialData:{
            Members:[{
              name:'Creator',
              discord_id:'256',
            }],
            Levels:[{
              level_name:'Dont remove me bro',
              creator:'Creator',
              code:'XXX-XXX-XXX',
              status:1,
              difficulty:1,
            }]
          },
          type:'userError',
          expected:ts.message('error.noCode'),
        },{
          description:'!removelevel without reason',
          cmd:'!removelevel xxx-xxx-xxx',
          discord_id:'256',
          initialData:{
            Members:[{
              name:'Creator',
              discord_id:'256',
            }],
            Levels:[{
              level_name:'Dont remove me bro',
              creator:'Creator',
              code:'XXX-XXX-XXX',
              status:1,
              difficulty:1,
            }]
          },
          type:'userError',
          expected:ts.message('removeLevel.noReason'),
        },{
          description:'!removelevel already removed',
          cmd:'!removelevel xxx-xxx-xxx "i delete it more"',
          discord_id:'256',
          initialData:{
            Members:[{
              name:'Creator',
              discord_id:'256',
            }],
            Levels:[{
              level_name:'Dont remove me bro',
              creator:'Creator',
              code:'XXX-XXX-XXX',
              status:ts.LEVEL_STATUS.REMOVED,
            }]
          },
          type:'userError',
          expected:ts.message('removeLevel.alreadyRemoved',{
            level_name:'Dont remove me bro',
            creator:'Creator',
            code:'XXX-XXX-XXX',
            status:ts.LEVEL_STATUS.REMOVED,
          }),
        },
        //what to do with fixed?







        {
          description:'Check !register with banned person',
          cmd:'!register',
          initialData:{
            Members:[{
              name:"banned",
              discord_id:bot_id,
              is_banned:1,
            }],
          },
          discord_id:bot_id,
          type:'userError',
          expected:ts.message('error.userBanned'),
        },{
          description:'Check !points when barred',
          cmd:'!points',
          initialData:{
            Members:[{
              name:"banned",
              discord_id:bot_id,
              is_banned:1,
            }],
          },
          discord_id:bot_id,
          type:'userError',
          expected:ts.message('error.userBanned'),
        },{
          description:'Check !points when not registered',
          cmd:'!points',
          type:'userError',
          initialData:{
          Members:[{
              name:'mockMod1',
              discord_id:123,
            },{
              name:'mockPlayer1',
              discord_id:256,
            }],
          },
          async setup(){
            ts.mods=['123'] //setup 123 a mod
          },
          discord_id:bot_id,
          expected:ts.message('error.notRegistered'),
        },{
          description:'registering with existing name',
          cmd:'!register mockPlayer1',
          discord_id:bot_id,
          type:'userError',
          expected:ts.message('register.nameTaken',{name:'mockPlayer1'}),
        },{
          description:'register as mockCreator',
          cmd:'!register mockCreator',
          discord_id:bot_id,
          expected:ts.message('register.success',{name:'mockCreator'}),
        },{
          description:'at me bot',
          cmd:'!atmebot',
          discord_id:bot_id,
          type:'registeredSuccess',
          async expected({value,ts,obj}){
            //message is correct
            const user=await ts.get_user(obj.discord_id)
            if((user.user_reply+ts.message('atme.willBe'))!=value) return false;

            //values are correct
            let memberEntry=await ts.db.Members.query().where({discord_id:bot_id}).first()
            if(!memberEntry.atme) return false;

            return true
          },
        },{
          description:'at me bot already',
          cmd:'!atmebot',
          type:'userError',
          discord_id:bot_id,
          async expected({value,ts,obj}){
            //message is correct
            if((ts.message('atme.already')+ts.message('error.afterUserDiscord'))!=value) return false;

            //values are correct
            let memberEntry=await ts.db.Members.query().where({discord_id:bot_id}).first()
            if(!memberEntry.atme) return false;

            return true
          },

        },{
          description:'dont at me bot',
          cmd:'!dontatmebot',
          type:'registeredSuccess',
          discord_id:bot_id,
          async expected({value,ts,obj}){
            //message is correct
            const user=await ts.get_user(obj.discord_id)
            if((user.user_reply+ts.message('atme.willBeNot'))!=value) return false;

            //values are correct
            let memberEntry=await ts.db.Members.query().where({discord_id:bot_id}).first()
            if(memberEntry.atme) return false;

            return true
          },
        },{
          description:'dont at me already',
          cmd:'!dontatmebot',
          type:'userError',
          discord_id:bot_id,
          async expected({value,ts,obj}){
            //message is correct
            if((ts.message('atme.alreadyNot')+ts.message('error.afterUserDiscord'))!=value) return false;

            //values are correct
            let memberEntry=await ts.db.Members.query().where({discord_id:bot_id}).first()
            if(memberEntry.atme) return false;

            return true
          },
        },{
          description:'!add without any arguments',
          cmd:'!add',
          discord_id:bot_id,
          type:'userError',
          expected:ts.message('error.noCode'),
        },{
          description:'!add with invalid level code',
          cmd:'!add xxx-xxx-xx',
          discord_id:bot_id,
          type:'userError',
          expected:ts.message('error.invalidCode'),
        },{
          description:'!add without any level name',
          cmd:'!add xxx-xxx-xxx',
          discord_id:bot_id,
          type:'userError',
          expected:ts.message('add.noName'),
        },{
          description:'succesful level add',
          cmd:'!add xxx-xxx-xxx level name is long',
          discord_id:bot_id,
          type:'registeredSuccess',
          expected:ts.message('add.success',{
            level_name:'level name is long',
            code:'XXX-XXX-XXX',
          }),
          //TODO: add actual tests for database?
        },{
          description:'adding an existing level',
          cmd:'!add xxx-xxx-xxx long',
          type:'userError',
          discord_id:bot_id,
          expected:ts.message('add.levelExisting',{
            level:{
              level_name:'level name is long',
              code:'XXX-XXX-XXX',
              creator:'mockCreator'
            },
          }),
        },{
          description:'!addtags, no tags given',
          cmd:'!addtag xxx-xxx-xxx',
          type:'userError',
          discord_id:bot_id,
          expected:ts.message('tags.noTags'),
        },{
          description:'add tags one tag',
          cmd:'!addtag xxx-xxx-xxx SMW',
          type:'registeredSuccess',
          discord_id:bot_id,
          expected:'Tags added for  "level name is long" (XXX-XXX-XXX)\n' +
          'Current tags:```\n' +
          'SMW```',
        },{
          description:'add tags multiple tag',
          cmd:'!addtag xxx-xxx-xxx Speed-Run,Yoshi Tech',
          type:'registeredSuccess',
          discord_id:bot_id,
          expected:'Tags added for  "level name is long" (XXX-XXX-XXX)\n' +
          'Current tags:```\n' +
          'SMW\n' +
          'Speed-Run\n' +
          'Yoshi Tech```',
        },{
          description:'add tags one tag repeated',
          cmd:'!addtag xxx-xxx-xxx smw',
          discord_id:bot_id,
          expected:'No new tags added for "level name is long" by mockCreator\n' +
          'Current tags:```\n' +
          'SMW\n' +
          'Speed-Run\n' +
          'Yoshi Tech``` ',
        },{
          description:'add tags many tag some repeated',
          cmd:'!addtag xxx-xxx-xxx yoshi tech,fire-flower,smw',
          discord_id:bot_id,
          type:'registeredSuccess',
          expected:'Tags added for  "level name is long" (XXX-XXX-XXX)\n' +
          'Current tags:```\n' +
          'SMW\n' +
          'Speed-Run\n' +
          'Yoshi Tech\n' +
          'fire-flower```',
        },{
          description:'add tags many all repeated',
          cmd:'!addtag xxx-xxx-xxx SMW,yoshi tech,smw',
          discord_id:bot_id,
          expected:'No new tags added for "level name is long" by mockCreator\n' +
          'Current tags:```\n' +
          'SMW\n' +
          'Speed-Run\n' +
          'Yoshi Tech\n' +
          'fire-flower``` ',
        },{
          description:'removetags one tags',
          cmd:'!removetag xxx-xxx-xxx smw',
          discord_id:bot_id,
          type:'registeredSuccess',
          expected:'Tags removed for  "level name is long" (XXX-XXX-XXX)\n' +
          'Current tags:```\n' +
          'Speed-Run\n' +
          'Yoshi Tech\n' +
          'fire-flower```',
        },{
          description:'removetags on repeat',
          cmd:'!removetag xxx-xxx-xxx smw',
          discord_id:bot_id,
          expected:'No tags have been removed for "level name is long" (XXX-XXX-XXX)\n' +
          'Current Tags:```\n' +
          'Speed-Run\n' +
          'Yoshi Tech\n' +
          'fire-flower``` ',
        },{
          description:'!clear with a slightly wrong level code',
          cmd:'!clear xxx-xxx-xx',
          discord_id:bot_id,
          type:'userError',
          expected:[
          ts.message('error.levelNotFound',{code:'XXX-XXX-XX'}),
          ts.message('level.didYouMean',{level_info:'XXX-XXX-XXX - "level name is long" by mockCreator'}),
        ].join(''),
        },{
          description:"Can't clear own level",
          cmd:'!clear xxx-xxx-xxx',
          discord_id:bot_id,
          type:'userError',
          expected:ts.message('clear.ownLevel'),
        },{
          description:'!points with no clear',
          cmd:'!points',
          discord_id:'256',
          type:'registeredSuccess',
          expected:ts.message('points.points',{
              player:{
                earned_points:{
                  clearPoints:'0.0',
                  levelsMade:0,
                },
              },
            })+ts.message('points.canUpload')+ts.message('points.rank',{
              player:{
                rank:ts.ranks[0],
              },
            }),
        },{
          description:'!clear wrong difficulty rating',
          cmd:'!clear xxx-xxx-xxx lol lol',
          type:'userError',
          discord_id:'256',
          expected:ts.message('clear.invalidDifficulty'),
        },{
          description:'!clear wrong difficulty rating',
          cmd:'!clear xxx-xxx-xxx lol lol',
          type:'userError',
          discord_id:'256',
          expected:ts.message('clear.invalidDifficulty'),
        },{
          description:'!clear without discord id (this is more for web api)',
          cmd:'!clear xxx-xxx-xxx',
          type:'userError',
          discord_id:null,
          expected:ts.message('error.noDiscordId'),
        },{
          description:'Succesful clear, level is pending',
          cmd:'!clear xxx-xxx-xxx',
          type:'registeredSuccess',
          discord_id:'256',
          expected:'\n ‣You have cleared \'level name is long\'  by mockCreator \n'+
          ' ‣This level is still pending',
        },{
          description: "remove clears",
          cmd:'!removeclear xxx-xxx-xxx',
          discord_id:'256',
          type:'registeredSuccess',
          expected:'\n' +
          ts.message('clear.removedClear',{levelInfo:"'level name is long'  by mockCreator"}),
        },{
          description: "Already remove clear",
          cmd:'!removeclear xxx-xxx-xxx',
          discord_id:'256',
          type:'registeredSuccess',
          expected:'\n' +
          ts.message('clear.alreadyUncleared',{levelInfo:"'level name is long'  by mockCreator"}),
        },{
          cmd:'!approve xxx-xxx-xxx',
          discord_id:'123',
          type:'userError',
          expected:ts.message('approval.invalidDifficulty'),

        },{
          cmd:'!approve xxx-xxx-xxx 5',
          discord_id:'123',
          type:'userError',
          expected:ts.message('approval.changeReason'),
        },{
          cmd:'!approve xxx-xxx-xxx 5 "some reason"',
          discord_id:'123',
          async expected({value,guild,ts}){
            const newChannel=await guild.channels.find(c => c.name === 'xxx-xxx-xxx')
            if(!newChannel) return false;

            return ts.message('approval.voteAdded',{channel_id:newChannel.id})==value
          },
          slow:true,
        },{
          description:"judge a level. Channel should be deleted",
          cmd:'!judge',
          discord_id:bot_id, //not exactly correct but test won't work without this
          channel:"xxx-xxx-xxx",
          async expected({guild,ts}){
            const newChannel=await guild.channels.find(c => c.name === 'xxx-xxx-xxx')
            if(newChannel) return false;

            let level=await ts.db.Levels.query().where({code:'XXX-XXX-XXX'}).first()
            if(!level) return false;
            if(level.status!==ts.LEVEL_STATUS.APPROVED) return false;

            return true;
            //currently initation isn't really testable.
            //there's an error where we're overwriting the member and we can't
            //get a fresh one from server
            //not sure how to test initiation and show approval stuff
          },
          slow:true,
        },{
          description:'!points, count self option=off',
          cmd:'!points',
          discord_id:bot_id,
          type:'registeredSuccess',
          expected:ts.message('points.points',{
            player:{
              earned_points:{
                clearPoints:'0.0',
                levelsMade:1,
              },
            },
          })+ts.message('points.canUpload')+ts.message('points.rank',{
            player:{
              rank:ts.ranks[0],
            },
          }),
        },{
          description:'!points, count self option=yes',
          cmd:'!points',
          type:'registeredSuccess',
          setup(){
            ts.teamVariables.includeOwnPoints='yes'
            ts.recalculateAfterUpdate()
          },
          discord_id:bot_id,
          expected:
          ts.message('points.points',{
            player:{
              earned_points:{
                clearPoints:'5.0',
                levelsMade:1,
              },
            },
          })+ts.message('points.canUpload')+ts.message('points.rank',{
            player:{
              rank:ts.ranks[1],
            },
          }),
          teardown(){
            ts.teamVariables.includeOwnPoints=null;
          }
        },{
          description:'Succesful approved clear+like',
          cmd:'!clear xxx-xxx-xxx like',
          discord_id:'256',
          type:'registeredSuccess',
          expected:'\n'+[
            ts.message('clear.addClear',{levelInfo:"'level name is long'  by mockCreator"}),
            ' ‣You have earned 5 points',
            ' ‣You also have liked this level ',
          ].join('\n'),
        },{
          description:'Check points after clearing a level',
          cmd:'!points',
          discord_id:'256',
          type:'registeredSuccess',
          expected:ts.message('points.points',{
              player:{
                earned_points:{
                  clearPoints:'5.0',
                  levelsMade:0,
                },
              },
            })+ts.message('points.canUpload')+ts.message('points.rank',{
              player:{
                rank:ts.ranks[1],
              },
            }),
        },{
          description:'Change bot user to mockPlayer',
          cmd:'!mockuser mockPlayer1',
          discord_id:bot_id,
          expected:ts.message('mock.userSuccess',{name:'mockPlayer1'})
        },{
          cmd:'!points role',
          discord_id:bot_id,
          async expected({value,ts,obj}){
            const user=await ts.get_user(obj.discord_id)
            let reply=user.user_reply+ts.message('points.points',{
              player:{
                earned_points:{
                  clearPoints:'5.0',
                  levelsMade:0,
                },
              },
            })+ts.message('points.canUpload')+ts.message('points.rank',{
              player:{
                rank:ts.ranks[1],
              },
            });
            return reply==value
          },
          slow:true,

        },{
          description:'Change bot user to mockCreator for next tests',
          cmd:'!mockuser mockCreator',
          discord_id:bot_id,
          expected:ts.message('mock.userSuccess',{name:'mockCreator'})
        },{
          cmd:'!reupload xxx-xxx-xxx',
          discord_id:bot_id,
          type:'userError',
          expected:ts.message('reupload.invalidNewCode'),
        },{
          cmd:'!reupload xxx-xxx-xxx xxx-xxx-xxx',
          discord_id:bot_id,
          type:'userError',
          expected:ts.message('reupload.sameCode'),
        },{
          cmd:'!reupload xxx-xxx-xxx xxx-xxx-yy',
          discord_id:bot_id,
          type:'userError',
          expected:ts.message('reupload.invalidNewCode'),
        },{
          cmd:'!reupload xxx-xxx-xxx xxx-xxx-yyy',
          discord_id:bot_id,
          type:'userError',
          expected:ts.message('reupload.giveReason'),
        },{
          cmd:'!reupload xxx-xxx-xxx xxx-xxx-yyy "some reason"',
          discord_id:bot_id,
          type:'registeredSuccess',
          expected:ts.message('reupload.success',{
            level:{
              level_name:'level name is long',
              creator:'mockCreator',
            },
            new_code:'XXX-XXX-YYY'
          })+ts.message('reupload.inReuploadQueue'),
          slow:true,
        },{
          cmd:'!fixapprove',
          discord_id:bot_id,
          channel:"xxx-xxx-yyy",
          async expected({value,ts,guild}){
            //TODO: check if channel is deleted
            return true;
          },
          slow:true,
        },{
          description:'!makerid no arguments',
          cmd:'!makerid',
          initialData:{
            "Members":[{
              Name:"test",
              discord_id:bot_id,
            }],
          },
          discord_id:bot_id,
          type:'userError',
          expected:ts.message('makerid.noCode'),
        },{
          description:'!makerid success',
          cmd:'!makerid xxx-xxx-xxx',
          initialData:{
            "Members":[{
              Name:"test",
              discord_id:bot_id,
            }],
          },
          discord_id:bot_id,
          type:'registeredSuccess',
          expected:ts.message('makerid.success',{code:'XXX-XXX-XXX'}),
        },{
          description:'!makerid already',
          cmd:'!makerid xxx-xxx-xxx',
          initialData:{
            "Members":[{
              Name:"test",
              discord_id:bot_id,
              maker_id:'XXX-XXX-XXX',
            }],
          },
          discord_id:bot_id,
          type:'userError',
          expected:ts.message('makerid.already',{code:'XXX-XXX-XXX'}),
        },{
          description:'!makerid used by someone else',
          cmd:'!makerid xxx-xxx-xxx',
          initialData:{
            "Members":[{
              Name:'Real',
              discord_id:'123',
              maker_id:'XXX-XXX-XXX',
            },{
              Name:'test',
              discord_id:bot_id,
            }],
          },
          discord_id:bot_id,
          type:'userError',
          expected:ts.message('makerid.existing',{name:'Real',code:'XXX-XXX-XXX'}),
        },
      ];

      async function send({ setup, cmd , channel, discord_id , initialData }){
        if(initialData!=null){
          await setupData(initialData)
        }

        if((typeof setup)==="function"){
          await setup()
        }
        message.author.id=discord_id;
        message.content = cmd;
        channel=channel || defaultChannel
        if(/[^0-9]/.test(channel)){
          message.channel=await guild.channels.find(c => c.name === channel.toLowerCase())
        } else {
          message.channel=await guild.channels.get(channel)
        }
        await ts.client.emit("message",message)
      }

      async function test(value){
        let obj=DISCORDTESTS[i]
        if(obj==null)
          return false
        if(typeof obj.teardown==="function"){
          await obj.teardown()
        }
        if(typeof obj.expected==="function"){
          post_result({
            description:obj.description,
            command:obj.cmd,
            value,
            expected:"function",
            result:await obj.expected({value,guild,ts,obj}),
          })
        } else {
          let expected=obj.expected
          if(obj.type==='userError'){
            expected=expected+ts.message('error.afterUserDiscord');
          }
          if(obj.type==='registeredSuccess'){
            let user=await ts.get_user(obj.discord_id);
            expected=user.user_reply+expected;
          }
          post_result({
            description:obj.description,
            command:obj.cmd,
            value,
            expected:expected,
            result:expected==value,
          })
        }
      }

      let timeout_id;
      global.TESTREPLY=async function(arg){
        clearTimeout(timeout_id)
        await test(arg)
        global.NEXTTEST()
      }
      let has_error=false;
      function post_result(obj){
        let id=(i+1).toString().padEnd(4)
        if(obj.result){
          const description=obj.description || obj.command
          console.log(`#${id} ✅: ${description}`)
        } else {
          if(argv.test===true) has_error=true;
          console.log(`#${id} ❌:`)
          console.log(obj)
        }
      }

      let i=(typeof argv.test==="number") ? argv.test-2 : -1;
      global.NEXTTEST=async function(){
        i++
        if(!has_error && i<DISCORDTESTS.length){
          send(DISCORDTESTS[i])
          timeout_id=setTimeout(async function(){
            await test();
            global.NEXTTEST()
          },2000)
        } else {
          console.log('--done--')
          process.exit()
        }
      }
      global.NEXTTEST()
    } catch (error) {
      console.error(error)
      process.exit()
    }
  }
}
module.exports = TestBot;