'use strict'
const crypto=require('crypto');
const moment=require('moment');
const knex = require('./db/knex');
const jwt = require('jsonwebtoken');
const DEFAULTMESSAGES=require("./DefaultStrings.js");
const DiscordLog = require('./DiscordLog');
const stringSimilarity = require('string-similarity')
const Handlebars = require("handlebars");
/* istanbul ignore next */
Handlebars.registerHelper('plural', function(num){
  return num>1 || num==0 ? 's' : ''
});

/* istanbul ignore next */
Handlebars.registerHelper('1dp', function(num){
  if(typeof num==='number') return num.toFixed(1)
  if(typeof num==='string' && !isNaN(num)) return Number(num).toFixed(1)
  return num
});

/* istanbul ignore next */
const server_config = require('./config.json')[process.env.NODE_ENV || 'development'];

const defaultChannels=[
  {name:'modChannel',default:'bot-mod-channel',description:'The only channel where mod commands will work (approve,rerate). Only mods should be able to send/read channel'},
  {name:'initiateChannel',default:'bot-makerteam-initiation',description:'The channel where the member will be notified if they officially become a member. This channel should be read only to everybody'},
  {name:'levelChangeNotification',default:'bot-level-updates',description:'The channel where level approvals,rejections and rerates notifications are posted by the bot. This should be readonly to everyone'},
  {name:'commandFeed',default:'bot-command-feed',description:'This is where clears/likes and other commands from the web will be shown. This should be read only to everyone'},
  {name:'pendingReuploadCategory',default:'bot-pending-reupload',description:'The channel where level reuploads are discussed. Only mods should be able to send/read this category'},
  {name:'feedbackChannel',default:'bot-makerteam-feedback',description:'Channel where the anonymous feedback will be posted. This should be readonly for whoever can read the feedback'},
  {name:'levelDiscussionCategory',default:'bot-pending-discussion',description:'Channel category where pending channels will be created. Only mods should be able to send/read this category'},
];

/**
 * Team settable Variables
 */
const defaultVariables=[
  {name:'TeamName',caption:'Team Name',default:'A Maker Team',type:'text',description:'Will be used by the bot in the reponses'},
  {name:'ModName',caption:'Mod Name',default:'Admin',type:'text',description:'Will be refered to by the bot\'s response'},
  {name:'BotName',caption:'Bot Name',default:'ShellBot 3000',type:'text',description:'What the bot will refer to itself in it\'s responses'},
  {name:'Minimum Point',caption:'First Level Points',default:0,type:'number',description:'Minimum no. of points needed to submit their first level'},
  {name:'New Level',caption:'New Level Points',default:0,type:'number',description:'How many points needed to submit another level'},
  {name:'memberRole',caption:'Member Role',default:'',type:'text',description:'Roles assigned when a member gets an approved level (name)'},
  {name:'memberRoleId',caption:'Member Role Id',default:'',type:'text',description:'Roles assigned when a member gets an approved level'},

  
  {name:'maxDifficulty',caption:'Maximum Difficulty',default:10,type:'number',description:'The maximum allowed difficulty for this team.'},
  {name:'VotesNeeded',caption:'Votes Needed',default:1,type:'number',description:'How many mods needed to approve/reject  level'},
  {name:'ApprovalVotesNeeded',caption:'Approval Votes',default:null,type:'number',description:'How many mods needed to approve a level'},
  {name:'RejectVotesNeeded',caption:'Reject Votes',default:null,type:'number',description:'How many mods are needed to reject a level'},
  {name:'AgreeingVotesNeeded',caption:'Agreeing Votes',default:null,type:'number',description:'How many approval/fix votes are needed in agreement (within the max difference of difficulty, and with no rejects) to allow judging'},
  {name:'AgreeingMaxDifference',caption:'Aggreeing Votes Difference',default:null,type:'number',step:'0.1',description:'How far apart the approval/fix votes can be to count as in agreement'},

  {name:'includeOwnPoints',caption:'Own Points',default:false,type:'boolean',description:'Allow creator made levels to count with own points?'},
  {name:'allowSMM1',caption:'Allow SMM1',default:false,type:'boolean',description:'Allow submissions of SMM1 levels'},
  {name:'discordAdminCanMod',caption:'Discord Admin Mod',default:false,type:'boolean',description:'Allows anyone with admin role to mod for the team'},

  {name:'userErrorEmote',caption:'User Error Emote',default:null,type:'text',description:'The default emote that will show when a user error occurs.'},
  {name:'criticalErrorEmote',caption:'Critical Error Emote',default:null,type:'text',description:'The default emote of an error you should tell the devs about buzzyS'},
  {name:'updateEmote',caption:'Update Emote',default:null,type:'text',description:'The default emote that will show when an update appears'},
  {name:'pogEmote',caption:'Pog Emote',default:null,type:'text',description:'The default emote that will show when pog things happen'},
  {name:'loveEmote',caption:'Love Emote',default:null,type:'text',description:'The default love emote used in some messages'},
  {name:'GGEmote',caption:'GG Emote',default:null,type:'text',description:'GG emote shown in clear messages'},

  {name:'rejectedEmote',caption:'Rejected Level Emote',default:null,type:'text',description:'Emote to be shown in level rejected messages'},
  {name:'approvedEmote',caption:'Approved Level Emote',default:null,type:'text',description:'Emote to be shown in level approved messages'},
  {name:'needFixEmote',caption:'Fix Request Emote',default:null,type:'text',description:'Emote to be shown in need fix messages'},
  {name:'judgementEmote',caption:'Judgement Emote',default:null,type:'text',description:'Emote to be shown in approval votes embed for mods'},
  {name:'removeEmote',caption:'Remove Level Emote',default:null,type:'text',description:'Emote to be shown in remove level messages'},
  {name:'undoEmote',caption:'Undo Remove Emote',default:null,type:'text',description:'Emote to be shown in undo remove level messages'},
  {name:'rerateEmote',caption:'Level Rerate Emote',default:null,type:'text',description:'Emote to be shown in rerate level messages'},
  {name:'randomEmote',caption:'Random Level Emote',default:null,type:'text',description:'Emote to be shown in random level messages'},
  
];


/**
 * Level statuses
 * @type {object}
 */
const LEVEL_STATUS={
  PENDING:0,
  PENDING_APPROVED_REUPLOAD:3,
  PENDING_FIXED_REUPLOAD:4,
  PENDING_NOT_FIXED_REUPLOAD:5,

  NEED_FIX:-10,
  APPROVED:1,
  REJECTED:-1,

  REUPLOADED:2,
  REMOVED:-2, 
  USER_REMOVED:-3,
};

/**
 * Level status that are pending
 * @type {number[]}
 */
const PENDING_LEVELS=[
  LEVEL_STATUS.PENDING,
  LEVEL_STATUS.PENDING_NOT_FIXED_REUPLOAD,
  LEVEL_STATUS.PENDING_APPROVED_REUPLOAD,
  LEVEL_STATUS.PENDING_FIXED_REUPLOAD,
];

/**
 * Level status that appears in the list
 * @type {number[]}
 */
const SHOWN_IN_LIST=[
  ...PENDING_LEVELS,
  LEVEL_STATUS.NEED_FIX,
  LEVEL_STATUS.APPROVED,
];

/**
 * Level status that doesn't appear in the list
 * @type {number[]}
 */
const REMOVED_LEVELS=[
  LEVEL_STATUS.REUPLOADED,
  LEVEL_STATUS.REJECTED,
  LEVEL_STATUS.REMOVED,
  LEVEL_STATUS.USER_REMOVED,
];

/**
 * Class representing a user error. To be thrown and caught and sent to the user with ts.getUserErrorMsg() for discord
 * @extends Error
 */
class UserError extends Error {
  constructor(message) {
    super(message);
    this.type='user'
    this.msg=message
    this.name = "UserError"; // (2)
  }
}

/**
 * This is the main object that encapsulates all the various MakerTeam processes for a guild. Any methods called from an instance will only be for that guild
 * @class
 * @param {string} guild_id - the discord guild_id this TS does
 * @param {AkairoClient} client
 *
 */
class TS {
  constructor(guild_id, client) {
    if (!guild_id) {
      throw new Error(`No guild_id was passed to TS()`);
    }
    if (!client) {
      throw new Error(`No client passed to TS()`);
    }
    this.guild_id=guild_id
    this.client=client

    const guild=this.getGuild()
    if (!guild) throw new Error('Cannot find discord server. Invalid guild_id or ShellBot is not on this server.');

    this.getSettings = async (type) => {
      const rows = await knex('team_settings')
        .where({ 'guild_id': this.team.id })
        .where({ type });
      const ret = {};
      rows.forEach(r => {
        ret[r.name] = r.value;
      });
      return ret;
    };
    /**
     * Important function that loads all the necessary data on runtime.
     */
    const ts = this;
    this.load = async function () {
      const guild = ts.getGuild(guild_id);
      await guild.fetchMembers(); //just load up all members
      const Teams = require('./models/Teams.js')(guild_id);
      this.team = await Teams.query().select().first();
      this.db = {
        Teams,
        Tokens: require('./models/Tokens'),
        Plays: require('./models/Plays')(this.team.id, ts),
        PendingVotes: require('./models/PendingVotes')(this.team.id, ts),
        Members: require('./models/Members')(this.team.id, ts),
        Levels: require('./models/Levels')(this.team.id, ts),
        Points: require('./models/Points')(this.team.id, ts),
      };
      this.defaultVariables = defaultVariables;
      this.url_slug = this.team.url_slug;
      /* istanbul ignore next */
      this.config = this.team.config ?
        (typeof this.team.config === "string" ? JSON.parse(this.team.config) : this.team.config)
        : {};
      this.web_config = this.team.web_config ? JSON.parse(this.team.web_config) : {};
      let update_config=false;
      if(this.config.key){
        this.secure_key=this.config.key
      } else {
        this.secure_key=this.generateToken(512)
        this.config.key=this.secure_key;
        update_config=true
      }
      if(!this.config.feedback_salt){
        this.config.feedback_salt=this.generateToken(512)
        update_config=true;
      }
      if(update_config){
        await this.db.Teams.query().patch({
          config:JSON.stringify(this.config),
        }) //generate secure key if doesn't exist
      }
      this.client = client;
      this.guild_id = guild_id;
      /* istanbul ignore next */
      this.LEVEL_STATUS = LEVEL_STATUS;
      this.PENDING_LEVELS = PENDING_LEVELS;
      this.SHOWN_IN_LIST = SHOWN_IN_LIST;
      this.REMOVED_LEVELS = REMOVED_LEVELS;
      this.knex = knex;

      const defaultVars = {
        customStrings: {
          "levelInfo": "@@LEVEL_PLACEHOLDER@@",
          "teamurl": server_config.page_url + "/" + this.url_slug,
          "BotName": "ShellBot3000",
        },
        emotes: {},
      };

      guild.emojis.forEach((e) => {
        defaultVars.emotes[e.name] = e.toString();
      });

      let dbToMap = {
        teamVariables: 'settings',
        channels: 'channels',
        customStrings: 'strings',
      };

      for (let key in dbToMap) {
        this[key] = { ...defaultVars[key] };
        const data = await knex('team_settings')
          .where({ 'guild_id': this.team.id })
          .where({ type: dbToMap[key] });
        data.forEach((d) => {
          this[key][d.name] = d.value;
        });
      }
      this.emotes = {
        think: this.teamVariables.userErrorEmote,
        PigChamp: this.teamVariables.pogEmote,
        buzzyS: this.teamVariables.criticalErrorEmote,
        bam: this.teamVariables.updateEmote,
        love: this.teamVariables.loveEmote,
        GG: this.teamVariables.GGEmote,
      };

      this.validDifficulty = [];
      const maxDifficulty = Math.round(parseFloat(this.teamVariables.maxDifficulty)*10) || 100;
      for(let i=0;i<=maxDifficulty;i+=1){
        this.validDifficulty.push(i/10)
      }

      const all_levels=await this.getLevels();
      let all_tags=all_levels.map(l=>l.tags);
      if(all_tags.length!=0) all_tags=all_tags.reduce((total,t)=>total+","+t);
      await knex.transaction(async(trx)=>{
        await this.addTags(all_tags,trx)
      })

      this.messages = this.getSettings('messages');
      for (const i in this.messages) {
        this.messages[i] = _makeTemplate(this.messages[i] || '');
      }
      TS.defaultMessages = {};
      for (var i in DEFAULTMESSAGES) {
        TS.defaultMessages[i] = _makeTemplate(DEFAULTMESSAGES[i]);
        if (this.messages[i] === undefined) {
          this.messages[i] = _makeTemplate(DEFAULTMESSAGES[i]);
        }
      }

      this.embedStyle = {
        [ts.LEVEL_STATUS.REJECTED]: {
          color: this.teamVariables.rejectColor || '#dc3545',
          title: "judge.levelRejected",
          image: this.teamVariables.rejectedEmote,
          noLink: true,
        },
        [ts.LEVEL_STATUS.APPROVED]: {
          color: this.teamVariables.approveColor || '#01A19F',
          title: 'judge.approved',
          image: this.teamVariables.approvedEmote,
        },
        [ts.LEVEL_STATUS.NEED_FIX]: {
          color: this.teamVariables.needFixColor || '#D68100',
          title: 'approval.fixPlayerInstructions',
          image: this.teamVariables.needFixEmote,
        },
        judgement: {
          color: this.teamVariables.judgementColor || null,
          title: 'approval.judgementBegin',
          image: ts.teamVariables.judgementEmote,
        },
        remove: {
          color: this.teamVariables.removeColor || '#dc3545',
          title: 'remove.removedBy',
          image: ts.teamVariables.removeEmote,
          noLink: true,
        },
        rerate: {
          color: "#17a2b8",
          title: 'difficulty.updated',
          image: ts.teamVariables.rerateEmote,
        },
        random: {
          color: "#17a2b8",
          title: 'random.embedTitle',
          image: ts.teamVariables.randomEmote,
        },
        randoms: {
          title: 'random.embedTitlePlayers',
          image: ts.teamVariables.randomEmote
        },
        undo: {
          color: "#17a2b8",
          title: 'undoRemoveLevel.title',
          image: ts.teamVariables.undoEmote || ts.emotes.bam,
        }
      };
      //should verify that the discord roles id exist in server
      this.ranks = await knex('ranks').where({ guild_id: this.team.id }).orderBy('min_points', 'desc');
      this.rank_ids = this.ranks.map((r) => r.discord_role);
      await this.saveSheetToDb();
      await this.recalculateAfterUpdate();
      this.pointMap = {};
      var _points = await ts.db.Points.query().select();
      for (let i = 0; i < _points.length; i++) {
        this.pointMap[_points[i].difficulty] = _points[i].score;
      }
      /* istanbul ignore if */
      if (process.env.NODE_ENV !== 'test') {
        await DiscordLog.log(`Data loaded for ${this.teamVariables.TeamName}`, this.client);
      }
    };
    this.getPoints = function (difficulty) {
      return this.pointMap[parseFloat(difficulty)];
    };
    this.getLevels = () => {
      return knex('levels')
        .select(knex.raw(`levels.*, members.id creator_id,members.name creator`))
        .join('members', { 'levels.creator': 'members.id' })
        .where('levels.guild_id', this.team.id);
    };
    this.getPlays = () => {
      return knex('plays')
        .select(knex.raw(`
        ROW_NUMBER() OVER ( ORDER BY plays.id ) as no,
        plays.*,
        members.id player_id,
        members.name player,
        levels.id level_id,
        levels.code code,
        levels.difficulty,
        levels.level_name,
        levels.videos,
        levels.tags,
        creator_table.name creator_name,
        creator_table.id creator_id`))
        .join('members', { 'plays.player': 'members.id' })
        .join('levels', { 'plays.code': 'levels.id' })
        .join('members as creator_table', { 'creator_table.id': 'levels.creator' })
        .whereIn('levels.status', ts.SHOWN_IN_LIST)
        .where('plays.guild_id', this.team.id);
    };
    this.getPendingVotes = () => {
      return knex('pending_votes')
        .select(knex.raw(`pending_votes.*, members.id player_id,members.name player,levels.id level_id,levels.code code`))
        .join('members', { 'pending_votes.player': 'members.id' })
        .join('levels', { 'pending_votes.code': 'levels.id' })
        .where('pending_votes.guild_id', this.team.id);
    };
    /**
     * This checks if a string contains a special discord string.
     */
    this.isSpecialDiscordString = (str) => {
      return /<(@[!&]?|#|a?:[a-zA-Z0-9_]{2,}:)[0-9]{16,20}>/.test(str);
    };
    
    this.teamAdmin = (discord_id) => {
      if (!discord_id) return false;
      const guild = ts.getGuild();
      const discord_user = guild.members.get(discord_id);
      return (Array.isArray(server_config.devs) && server_config.devs.includes(discord_id))
      || (guild.owner.user.id == discord_id)
      || (discord_user && discord_user.hasPermission("ADMINISTRATOR"));
    };

    this.modOnly = async (discord_id) => {
      if (!discord_id)
        return false;
      if (server_config.devs && server_config.devs.indexOf(discord_id) !== -1) { //devs can help to troubleshoot
        return true;
      }
      const guild = await ts.getGuild();
      if (guild.owner.user.id == discord_id) { //owner can do anything
        return true;
      }
      if (ts.teamVariables.discordAdminCanMod === 'yes') {
        //if yes, any discord mods can do team administrative stuff but won't officially appear in the "Mod" list
        const discord_user = guild.members.get(discord_id);
        if (discord_user && discord_user.hasPermission("ADMINISTRATOR")) {
          return true;
        }
      }
      //specified, listed mods can do anything
      const member = await ts.db.Members.query().where({ discord_id }).first();
      if (member && member.is_mod) {
        return true;
      }
      return false;
    };

    /**
     * Will sync spreadsheet and discord information to the database. To be called on startup or via a command by mods
     */
    this.saveSheetToDb = async function () {
      return await ts.knex.transaction(async (trx) => {
        let guild = ts.getGuild();
        let mods = [guild.owner.user.id];
        if (this.teamVariables.ModName) {
          mods = guild.members
            .filter((m) => m.roles.some(role => role.name == this.teamVariables.ModName))
            .map((m) => m.user.id);
        }
        await ts.db.Members.query(trx).patch({ is_mod: null }).whereNotIn('discord_id', mods).where({ is_mod: 1 });
        await ts.db.Members.query(trx).patch({ is_mod: 1 }).whereIn('discord_id', mods).where({ is_mod: null });
      });
    };
    this.removeRankRoles = async function (discord_id) {
      const member = ts.getDiscordMember(discord_id);
      await member.removeRoles(this.ranks_ids);
    };
    this.addRankRoles = async function (discord_id, role_id) {
      const member = ts.getDiscordMember(discord_id);
      //if not has role
      ts.removeRankRoles(discord_id);
      await member.addRole(role_id);
    };
    /**
     * Method to add a level to MakerTeams
     */
    this.addLevel = async ({ code, level_name, discord_id }) => {
      if (!code)
        ts.userError(ts.message('error.noCode'));
      if (!ts.valid_code(code))
        ts.userError(ts.message("error.invalidCode"));
      if (!level_name)
        ts.userError(ts.message("add.noName"));
      if (ts.isSpecialDiscordString(level_name))
        ts.userError(ts.message('error.specialDiscordString'));
      const player = await ts.get_user(discord_id);
      var existing_level = await ts.getLevels().where({ code }).first();
      if (existing_level)
        ts.userError(ts.message("add.levelExisting", { level: existing_level }));
      if (!player.earned_points.canUpload) {
        ts.userError(ts.message("points.cantUpload", { points_needed: player.earned_points.pointsNeeded }));
      }
      await ts.db.Levels.query().insert({
        code,
        level_name,
        creator: player.id,
        difficulty: 0,
        tags: ts.teamVariables.allowSMM1 == "true" && ts.is_smm1(code) ? 'SMM1' : '',
        status: 0,
      });
      await ts.recalculateAfterUpdate({ name: player.name });
      return { reply: ts.message("add.success", { level_name, code }), player };
    };
    /**
     * internal function that encapsulates Handlebars which automatically passes all the user set variables and defaults to the strings
     */
    function _makeTemplate(template) {
      var template = Handlebars.compile(template);
      return function (args) {
        if (!args)
          args = {};
        let obj = { ...ts.emotes, ...ts.customStrings, ...ts.teamVariables, ...args };
        return template(obj);
      };
    }
    /**
     * function to generate a message based on the template string type. automatically assigns default and team variables apart from provided arguments
     * @param {string} type the message type defined in DefaultStrings which could be overwritten by custom messages
     * @param {object} args the values to be passed to Handlebar. overrides any default values
     * @returns {string} final message string
     */
    this.message = function (type, args) {
      if (this.messages[type]) {
        return this.messages[type](args);
      }
      throw new Error(`"${type}" message string was not found in ts.message`);
    };
    /**
     * Generates a login link to be DM-ed to the user to login to the website
     * @returns {string} login link
     */
    this.generateLoginLink = function (otp) {
      return server_config.page_url + ts.url_slug + "/login/" + otp;
    };
    /**
     * A helper function to generate the tokens. Will be mocked in tests
     * @param {number} [length] Length of the token. default is 8
     */
    this.generateToken = (length = 8) => {
      return crypto.randomBytes(length).toString('hex').toUpperCase();
    };
    /**
     * Generates a one time password for the user to login to the site
     * @param {string} discord_id - Discord id
     * @return {string} - A random unique token
     */
    this.generateOtp = async function (discord_id) {
      let newOtp = this.generateToken();
      let existing = await ts.db.Tokens.query().where({ token: newOtp }); //need to add check for only within expiry time (30 minutes)
      while (!existing) {
        newOtp = this.generateToken();
        existing = await ts.db.Tokens.query().where({ token: newOtp });
      }
      await ts.db.Tokens.query().insert({
        discord_id: discord_id,
        token: newOtp,
      });
      return newOtp;
    };
    /**
     * This will login the user to the site. The OTP token row will be generated by a new token that identifies the user
     */
    this.login = async function (discord_id, row_id) {
      let bearer = this.generateToken(16);
      let existing = await ts.db.Tokens.query().where({ token: bearer }); //need to add check for only within expiry time (30 minutes)
      while (!existing) {
        bearer = this.generateToken(16);
        existing = await ts.db.Tokens.query().where({ token: bearer });
      }
      await ts.db.Tokens.query()
        .findById(row_id)
        .patch({
          token: bearer,
          authenticated: 1
        });
      this.sendDM(discord_id, ts.message("website.loggedin"));
      return bearer;
    };
    /**
     * A helper function to help DM a discord user. To be mocked in tests
     */
    this.sendDM = async function (discord_id, message) {
      await client.guilds.get(guild_id).members.get(discord_id).send(message);
    };
    /**
     * A function that checks if a token is valid and returns the discord_id
     * @param {string} token  Token to be passed by the user via the Web endpoint
     * @returns {string}  Discord id of the user
     * @throws {UserError} - When the token is expired
     * @throws {UserError} - When the token is not found in the database
     */
    this.checkBearerToken = async function (token) {
      token = await ts.db.Tokens.query().where('token', '=', token).first();
      if (token) {
        const tokenExpireAt = moment(token.created_at).add(30, 'days').valueOf();
        const now = moment().valueOf();
        if (tokenExpireAt < now)
          ts.userError(ts.message("website.tokenError"));
      }
      else {
        ts.userError(ts.message("website.authError"));
      }
      return token.discord_id;
    };
    /**
     * Checks if the code is an SMM1 code. Should be true only when ts.teamVariables.allowSMM1=='yes'
     * @param {string} code Level code
     * @returns {boolean} is SMM1 code
     */
    this.is_smm1 = function (code) {
      if (!code)
        return false;
      return /^[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}$/.test(code.toUpperCase());
    };
    /**
     * Checks if the code is an SMM2 code
     * @param {string} code Level code
     * @returns {boolean} is SMM1 code
     */
    this.is_smm2 = function (code) {
      if (!code)
        return false;
      return /^[1234567890QWERTYUPASDFGHJKLXCVBNM]{3}-[1234567890QWERTYUPASDFGHJKLXCVBNM]{3}-[1234567890QWERTYUPASDFGHJKLXCVBNM]{3}$/.test(code.toUpperCase());
    };
    /**
     * Checks if the passed code is a valid code or not. Takes into account of ts.teamVariables.allowSMM1
     @ @param {string} code Level code
     * @returns {boolean}
     */
    this.valid_code = function (code) {
      if (code == null)
        return false;
      return this.is_smm2(code) || this.teamVariables.allowSMM1 == "true" && this.is_smm1(code);
    };
    /**
     * Helper function to get the direct Discord emote image url to be used for discord embeds
     */
    this.getEmoteUrl = function (emote) {
      if (!emote)
        return "";
      let id = emote.split(":")[2].slice(0, -1);
      return "https://cdn.discordapp.com/emojis/" + id + "?v=100";
    };
    /**
     * Function to check if the user supplied difficulty is a valid difficulty. to be refactored
     * @param diff the user supplied difficulty
     * @return {boolean}
     */
    this.valid_difficulty = function (diff) {
      for (var i = 0; i < this.validDifficulty.length; i++) {
        if (this.validDifficulty[i] == diff)
          return true;
      }
      return false;
    };
    /**
     * Helper function to convert a long text and embeds them as fields to a DiscordEmbed
     */
    this.embedAddLongField = function (embed, body, header = "\u200b") {
      var bodyArr = body ? body.split(".") : [];
      var bodyStr = [""];
      for (var k = 0, l = 0; k < bodyArr.length; k++) {
        if (bodyArr[k]) {
          if ((bodyStr[l].length + bodyArr[k].length + 1) > 980) {
            l++;
            bodyStr[l] = "";
          }
          bodyStr[l] += bodyArr[k] + ".";
        }
      }
      for (var k = 0; k < bodyStr.length; k++) {
        embed.addField(header, bodyStr[k]);
        header = "\u200b";
      }
    };
    /**
     * Helper function to coerce/validate passed parameter from user is the boolean format used
     */
    this.commandPassedBoolean = (value) => {
      if (value === '')
        return null;
      if (['1', 1, true].includes(value))
        return 1;
      if (['0', 0, false].includes(value))
        return 0;
      if (value != null)
        DiscordLog.error(`"${value}" was passed to this.commandPassedBoolean.`);
      return null;
    };
    /**
     * @typedef {Object.<string,string,boolean,boolean,number,boolean>} TsClearParam
     * @property {string} discord_id   - Discord id of user
     * @property {string} code         - Level code
     * @property {boolean} completed   - When 1, a clear will be saved. When 0 then a clear will be removed. Null will not updated the clear information
     * @property {boolean} liked       - When 1, a like will be saved. When 0 then a like will be removed. Null will not updated the like information
     * @property {number} difficulty   - When a valid difficulty is passed, a difficulty will be saved. When 0, the difficulty vote will be removed. Null will not update the difficulty infomration
     * @property {boolean} strOnly     - When 1, a formated user identification string will not be passed. Used for the web
     */
    /**
     * @description This function submits a clear based on the passed arguments and will do the checks.
     * @param {...TsClearParam} args Arguments to be supplied from either !clear or the website
     * @return {string} A response string to be sent to the user.
     */
    this.clear = async (args={}) => {
      let { discord_id, code, completed, liked, difficulty, strOnly, player_atme }=args

      if (!discord_id)
        ts.userError(ts.message("error.noDiscordId"));
      if (difficulty === "like") {
        difficulty = null;
        liked = 1;
      }
      if (difficulty === "unlike") {
        difficulty = null;
        liked = 0;
      }

      if (liked === "like") {
        
        liked = 1;
      }
      if (liked === "unlike") {
        liked = 0;
      }
      liked = ts.commandPassedBoolean(liked);
      completed = ts.commandPassedBoolean(completed);
      if (difficulty === '')
        difficulty = null;
      if (difficulty == null)
        difficulty = null;
      if (completed == null && liked == null && difficulty == null) {
        ts.userError(ts.message('clear.noArgs'));
      }
      if (code == null) {
        ts.userError(ts.message('error.noCode'));
      }
      code = code.toUpperCase();
      if (difficulty && isNaN(difficulty)) {
        ts.userError(ts.message('clear.invalidDifficulty'));
      }
      if (difficulty) {
        difficulty = parseFloat(difficulty);
      }
      if (difficulty != '0' && difficulty && !ts.valid_difficulty(difficulty)) {
        ts.userError(ts.message('clear.invalidDifficulty'));
      }
      const player = await ts.get_user(discord_id);
      var level = await ts.getExistingLevel(code);
      if (level.creator_id == player.id)
        ts.userError(ts.message("clear.ownLevel"));
      var existing_play = await ts.db.Plays.query()
        .where('code', '=', level.id)
        .where('player', '=', player.id)
        .first();
      var creator = await ts.db.Members.query().where({ id: level.creator_id }).first(); //oddface/taika is only non registered member with a level
      if (creator && creator.atme && creator.discord_id && !strOnly) {
        var creator_str = "<@" + creator.discord_id + ">";
      }
      else {
        var creator_str = creator.name;
      }
      var msg = [], updated = {};
      if (existing_play) {
        var updated_row = {};
        if ([1, 0].includes(completed) &&
          existing_play.completed !== completed) { //update completed
          updated_row.completed = completed ? 1 : 0;
          updated.completed = true;
        }
        if ([1, 0].includes(liked) &&
          existing_play.liked !== liked) { //like updated
          updated_row.liked = liked;
          updated.liked = true;
        }
        if ( (difficulty === 0 && existing_play.difficulty_vote !=null) ||
             (difficulty &&existing_play.difficulty_vote != difficulty)
          ) { //difficulty update
          updated_row.difficulty_vote = difficulty === 0 ? null : difficulty; //0 difficulty will remove your vote
          updated.difficulty = true;
        }
        if (updated_row)
          await ts.db.Plays.query().findById(existing_play.id).patch(updated_row);
      }
      else {
        await ts.db.Plays.query().insert({
          code: level.id,
          player: player.id,
          completed: completed || 0,
          liked: liked || 0,
          is_shellder: player.is_mod || 0,
          difficulty_vote: difficulty === 0 ? null : difficulty
        });
        if (completed != null)
          updated.completed = true;
        if (liked != null)
          updated.liked = true;
        if (difficulty != null)
          updated.difficulty = true;
        await ts.recalculateAfterUpdate({ name: player.name });
      }
      if ([0, 1].includes(completed)) {
        if (updated.completed) {
          if (completed) {
            msg.push(ts.message("clear.addClear", { level }));
            if (level.status === ts.LEVEL_STATUS.APPROVED) {
              msg.push(ts.message("clear.earnedPoints", {
                earned_points: ts.getPoints(level.difficulty),
              }));
            }
            else {
              msg.push(ts.message("clear.pendingLevel"));
            }
          }
          else {
            msg.push(ts.message("clear.removedClear", { level }));
          }
        }
        else {
          msg.push(ts.message(completed ? "clear.alreadyCleared" : "clear.alreadyUncleared"));
        }
      }
      if (updated.difficulty) {
        msg.push(difficulty === 0 ?
          ts.message("clear.removeDifficulty", { level }) :
          ts.message("clear.addDifficulty", {
            level: level,
            difficulty_vote: difficulty,
          }));
      }
      else if (difficulty || difficulty === 0) {
        msg.push(difficulty === 0 ?
          ts.message("clear.alreadyDifficulty", { level }) :
          ts.message("clear.alreadyNoDifficulty", {
            level: level,
            difficulty_vote: difficulty,
          }));
      }
      if ([0, 1].includes(liked)) {
        if (updated.liked) {
          msg.push(ts.message(liked ? "clear.addLike" : "clear.removeLike", { level }));
        }
        else {
          msg.push(ts.message(liked ? "clear.alreadyLiked" : "clear.alreadyUnliked", { level }));
        }
      }
      const user_reply = player_atme ? player.user_reply_atme : player.user_reply
      return (strOnly ? '' : user_reply) + ts.processClearMessage({ msg, creator_str, level });
    };
    /**
     * Processes the array of messages made by clear and replace repeating items with pronouns
     *
     * @param {Object} args - An object.
     * @param {string[]} args.msg - Array of strings provided by ts.clear
     * @param {string} args.creator_str - A string which is either the creator name or discord at
     * @param {Object} args.level - A level object, with creator being a name instead of id
     * @return {string} Returns the formatted string
     */
    this.processClearMessage = function ({ msg, creator_str, level }) {
      let level_placeholder = this.customStrings["levelInfo"];
      let level_str = ts.message("clear.levelInfo", { level, creator: creator_str });
      let singleHave = ts.message("clear.singleHave");
      let manyHave = ts.message("clear.manyHave");
      let levelPronoun = ts.message("clear.levelPronoun");
      for (let i = 0; i < msg.length; i++) {
        if (msg[i]) {
          msg[i] = msg[i].replace(level_placeholder, level_str);
          if (i > 1)
            msg[i] = msg[i].replace(singleHave, manyHave);
          level_str = levelPronoun;
        }
      }
      return '\n' + msg.join('\n');
    };
    /**
     * Gets an existing and does checks if they exist or not, also offering possible levels if the code was a mistake
     *
     *  @return {string} returns a level object
     *  @throws {ts.UserError} Will throw a UserError if level code is not found. Will provide a possible level suggestion
     *  @throws {ts.UserError} Will throw a UserError if level code is not pending or approved, noting either it's need fixing or removed
     */
    this.getExistingLevel = async function (code, includeRemoved = false) {
      if (!code){
        ts.userError(ts.message('error.noCode'));
      }
      var level = await ts.getLevels().where({ code }).first();
      if (!level) { //level doesn't exist
        let notDeletedLevels = {};
        let allLevels = {};
        const _levels = await ts.getLevels().select();
        _levels.forEach((level) => {
          if (level && (level.status == ts.LEVEL_STATUS.PENDING || level.status == ts.LEVEL_STATUS.APPROVED)) {
            notDeletedLevels[level.code] = level.code + " - \"" + level.level_name + "\" by " + level.creator;
          }
          allLevels[level.code] = level.code + " - \"" + level.level_name + "\" by " + level.creator;
        });
        let listUsed = includeRemoved ? allLevels : notDeletedLevels;
        listUsed = Object.keys(listUsed);
        let matchStr = "";
        if (listUsed.length > 0) {
          const match = stringSimilarity.findBestMatch(code, listUsed);
          if (match.bestMatch && match.bestMatch.rating >= 0.6) {
            matchStr = ts.message('level.didYouMean', { level_info: allLevels[match.bestMatch.target] });
          }
        }
        ts.userError(ts.message("error.levelNotFound", { code }) + matchStr);
      }
      if (!includeRemoved && ts.REMOVED_LEVELS.includes(level.status)) { //level is removed. not pending/accepted
        ts.userError(ts.message("error.levelIsRemoved", { level }));
      }
      return level;
    };
    /**
     * Get the team variables stored in the database
     */
    this.get_variable = function (var_name) {
      return this.teamVariables[var_name];
    };
    /**
     * Calculates the points needed to upload a level. 0 points needed means the user can upload a level
     *
     * @returns {Number} Will return the points needed rounded to the nearest 1 decimal point
     */
    this.pointsNeededForLevel = function (args) {
      const { points, levelsUploaded, freeLevels = 0, min, next } = args;
      let nextLevel = levelsUploaded + 1 - (freeLevels || 0);
      let nextPoints = (nextLevel == 1 ? min : min) + (nextLevel - 1) * next;
      var pointsDifference = Math.round((nextPoints - parseFloat(points)) * 10) / 10;
      return Math.max(pointsDifference, 0);
    };
    this.UserError = UserError;

    /**
     * Helper function to throw the user error
     */
    this.userError = function (errorStr,args) {
      if(this.messages[errorStr]){
        errorStr=this.messages[errorStr](args)
      }
      throw new UserError(errorStr);
    };

    /**
     * Makes a custom object to pass to DiscordLog
     */
    this.makeErrorObj = function (obj, message) {
      return {
        error: obj.stack ? obj.stack : obj,
        url_slug: this.team.url_slug,
        content: message.content,
        user: message.author.username,
        channel: "<#" + message.channel.id + ">"
      };
    };
    
    /**
     * To be used to parse a thrown exception and check if it's a user error in discord. User error can be passed to the user. any other error, we will throw a non descript error message to the user and log the actual error
     */
    this.getUserErrorMsg = function (obj, message) {
      if (typeof obj == "object" && obj.type == "user") {
        return obj.msg + ts.message("error.afterUserDiscord");
      }
      else {
        DiscordLog.error(ts.makeErrorObj(obj, message), ts.client);
        return ts.message("error.unknownError");
      }
    };
    /**
     * To be used to parse a thrown exception and check if it's a user error in the JSON endpoint. User error can be passed to the user. any other error, we will throw a non descript error message to the user and log the actual error
     */
    this.getWebUserErrorMsg = function (obj) {
      if (typeof obj == "object" && obj.type == "user") {
        return { status: "error", message: obj.msg + ts.message("error.afterUserWeb") };
      }
      else {
        DiscordLog.error({
          error: obj.stack ? obj.stack : obj,
          url_slug: this.url_slug
        }, ts.client);
        return { status: "error", message: ts.message("error.unknownError") };
      }
    };
    /**
     * Helper function to get a random integer for ts.random
     */
    this.getRandomInt = (min, max) => {
      min = Math.ceil(min);
      max = Math.floor(max);
      return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
    };
    /**
     * Gets a random level based on plays of the player/passed players and difficulty
     */
    this.randomLevel = async function ({ discord_id, players, minDifficulty, maxDifficulty }) {
      if (minDifficulty && !ts.valid_difficulty(minDifficulty)) {
        ts.userError(maxDifficulty ? ts.message("random.noMinDifficulty") : ts.message("random.noDifficulty"));
      }
      if (maxDifficulty) {
        if (!ts.valid_difficulty(maxDifficulty))
          ts.userError(ts.message("random.noMaxDifficulty"));
      }
      else {
        if (minDifficulty) {
          maxDifficulty = minDifficulty;
        }
      }
      if (parseFloat(minDifficulty) > parseFloat(maxDifficulty)) {
        let temp = maxDifficulty;
        maxDifficulty = minDifficulty;
        minDifficulty = temp;
      }
      let min = parseFloat(minDifficulty) || 1;
      let max = parseFloat(maxDifficulty) || min;
      let _players;
      const player = discord_id != null ? await ts.get_user(discord_id) : null;
      if (players) {
        let playerNames = players.split(",");
        let rawPlayers = await ts.db.Members.query().whereIn('name', playerNames);
        _players = [];
        rawPlayers.forEach(p => {
          _players.push(p.id);
          if (playerNames.indexOf(p.name) === -1) {
            ts.userError(ts.message("random.playerNotFound", { player: p.name }));
          }
        });
        if (_players.length === 0)
          ts.userError(ts.message("random.noPlayersGiven"));
      }
      else if (player) {
        _players = [player.id];
      }
      const playsSQL1 = _players ? `
    left join plays on levels.id=plays.code
    and plays.player in (:players:)
    and completed=1` : '';
      const playsSQL2 = _players ? `and creator not in (:players:)` : '';
      const playsSQL3 = _players ? `and plays.id is null` : '';
      const par = {
        team_id: ts.team.id,
        min, max,
        players: _players
      };
      let [filtered_levels] = await knex.raw(`
    SELECT levels.*,members.name creator from 
    levels
    inner join members on levels.creator=members.id
    ${playsSQL1}
    where status=1 
    ${playsSQL2}
    and levels.guild_id=:team_id
    and ( levels.not_default is null or levels.not_default!=1 )
    and levels.difficulty between :min and :max
    ${playsSQL3}
    group by levels.id
    order by likes;`, par);
      if (filtered_levels.length == 0) {
        ts.userError(ts.message("random.outOfLevels", {
          range: (min == max ? min : min + "-" + max)
        }));
      }
      var borderLine = Math.floor(filtered_levels.length * 0.6);
      if (Math.random() < 0.2) {
        var randNum = ts.getRandomInt(0, borderLine);
      }
      else {
        var randNum = ts.getRandomInt(borderLine, filtered_levels.length);
      }
      var level = filtered_levels[randNum];
      return {
        player: player,
        level: level
      };
    };
    this.assign_rank_role = async function (discord_id, rank) {
      //check if rank exists, if not skip
      //load all rank roles
      //remove all rank roles
      //assign set role
    };
    /**
     * A function that will get the user object based on the discord_id/message passed. Will do the necessary authentication checks and throw the necessary UserErrors
     */
    this.get_user = async function (message) {
      let discord_id = message && message.author ? message.author.id : message;
      if (!discord_id) {
        this.userError('error.noDiscordId');
      }
      var player = await this.db.Members.query().where({ discord_id }).first();
      if (!player)
        this.userError("error.notRegistered");
      if (player.is_banned)
        this.userError("error.userBanned");
      player.created_at = player.created_at.toString();
      player.earned_points = await this.calculatePoints(player.name);
      player.rank = this.get_rank(player.earned_points.clearPoints);
      player.rank.pips = player.rank.pips || ''
      player.atme_str = player.atme ? `<@${player.discord_id}>` : player.name;
      player.user_reply = `<@${player.discord_id}>` + player.rank.pips + " ";
      player.user_reply_atme = player.atme_str + player.rank.pips + " ";
      
      return player;
    };
    /**
     * This extends the levelEmbed and add all the pending votes associated with this level. to be used in the level discussion channels
     */
    this.makeVoteEmbed = async function (level, reupload_comment) {
      var approveVotes = await ts.getPendingVotes().where("levels.id", level.id).where({ type: 'approve' });
      var fixVotes = await ts.getPendingVotes().where("levels.id", level.id).where({ type: 'fix' });
      var rejectVotes = await ts.getPendingVotes().where("levels.id", level.id).where({ type: 'reject' });
      var voteEmbed = ts.levelEmbed(level, this.embedStyle.judgement);
      if (level.status === ts.LEVEL_STATUS.PENDING_APPROVED_REUPLOAD) {
        voteEmbed.setAuthor(ts.message("pending.pendingTitle"))
          .setDescription(ts.message("pending.alreadyApprovedBefore"));
      }
      else if (level.status === ts.LEVEL_STATUS.PENDING_NOT_FIXED_REUPLOAD) {
        voteEmbed.setAuthor(ts.message("pending.refuseTitle"))
          .setDescription(ts.message("pending.refuseDescription"));
      }
      else if (level.status === ts.LEVEL_STATUS.PENDING_FIXED_REUPLOAD) {
        voteEmbed.setAuthor(ts.message("pending.reuploadedTitle"))
          .setDescription(ts.message("pending.fixReuploadDescription"));
      }
      if (reupload_comment) {
        voteEmbed.addField(`Creator (${level.creator_name}) reupload comment:`, '```\n' + reupload_comment + '\n```');
      }
      var postString = ts.message("approval.approvalVotes");
      if (approveVotes == undefined || approveVotes.length == 0) {
        postString += ts.message("approval.noVotes");
      }
      else {
        for (var i = 0; i < approveVotes.length; i++) {
          const curShellder = await ts.db.Members.query().where({ name: approveVotes[i].player }).first();
          postString += "<@" + curShellder.discord_id + "> - Difficulty: " + approveVotes[i].difficulty_vote + ", Reason: " + approveVotes[i].reason + "\n";
        }
      }
      postString += ts.message("approval.fixVotes");
      if (fixVotes == undefined || fixVotes.length == 0) {
        postString += "> None\n";
      }
      else {
        for (var i = 0; i < fixVotes.length; i++) {
          const curShellder = await ts.db.Members.query().where({ name: fixVotes[i].player }).first();
          postString += "<@" + curShellder.discord_id + "> - Difficulty: " + fixVotes[i].difficulty_vote + ", Requested fixes: " + fixVotes[i].reason + "\n";
        }
      }
      postString += ts.message("approval.rejectVotes");
      if (rejectVotes == undefined || rejectVotes.length == 0) {
        postString += "None\n";
      }
      else {
        for (var i = 0; i < rejectVotes.length; i++) {
          const curShellder = await ts.db.Members.query().where({ name: rejectVotes[i].player }).first();
          postString += "<@" + curShellder.discord_id + "> - Reason: " + rejectVotes[i].reason + "\n";
        }
      }
      ts.embedAddLongField(voteEmbed, postString);
      return voteEmbed;
    };
    /**
     * This method is called and will process an approval vote. The method will generate the necessary discord channels if needed
     */
    this.approve = async function (args) {
      //Check if vote already exists
      const shellder = await ts.get_user(args.discord_id);
      const level = await ts.getExistingLevel(args.code,true);
      var vote = await ts.getPendingVotes().where("levels.id", level.id).where("player", shellder.id).first();
      if (!vote) {
        //We only check reason if we have no vote yet
        if (!args.reason) {
          ts.userError(ts.message("approval.changeReason"));
        }
      }
      //Check if level is approved, if it's approved only allow rejection
      if (level.status === ts.LEVEL_STATUS.APPROVED) {
        if (args.type === "approve") {
          ts.userError(ts.message("approval.levelAlreadyApproved"));
        }
      }
      else if (!PENDING_LEVELS.includes(level.status)) {
        ts.userError(ts.message("approval.levelNotPending"));
      }
      let replyMsg = 'approval.voteAdded';
      if (!vote) {
        await ts.db.PendingVotes.query().insert({
          code: level.id,
          player: shellder.id,
          type: args.type,
          difficulty_vote: (args.type === 'approve' || args.type == 'fix') ? args.difficulty : null,
          reason: args.reason
        });
      }
      else {
        replyMsg = 'approval.voteChanged';
        let updateJson = {
          type: args.type,
        };
        if (args.reason){
          updateJson.reason = args.reason;
        }
        if (args.difficulty){
          updateJson.difficulty_vote = args.difficulty;
        }
        await ts.db.PendingVotes.query().findById(vote.id).patch(updateJson);
      }
      //generate judgement embed
      if (!args.skip_update) {
        let voteEmbed = await ts.makeVoteEmbed(level);
        const { channel } = await ts.discussionChannel(level.code, ts.channels.levelDiscussionCategory);
        await ts.updatePinned(channel, voteEmbed);
        return ts.message(replyMsg, { channel_id: channel.id });
      }
    };
    /**
     * Helper function to create a discussion channel in the right parent. If there is already a channel, we will move the channel to the right one
     * @param {string} channel_name channel name to find
     * @param {Snowflake} parentID id of the parent category
     * @param {string} [old_channel_name] if given, the function will try to find the old name first and will be renamed to channel_name if found
     * @param {LevelRow} level
     * @return {Channel} returns a Discord Channel or either the created or found channel
     */
    this.discussionChannel = async (channel_name, parentID, old_channel_name, level) => {
      if (!channel_name)
        throw new TypeError('undefined channel_name');
      if (!parentID)
        throw new TypeError('undefined parentID');
      const guild = ts.getGuild();
      let created = false;
      const tooManyChannelsError = ts.message(parentID === ts.channels.levelDiscussionCategory ? 'approval.tooManyDiscussionChannels' : 'reupload.tooManyReuploadChannels');
      let discussionChannel = guild.channels.find(channel => channel.name === channel_name.toLowerCase());
      if (old_channel_name) {
        let old_channel = guild.channels.find(channel => channel.name === old_channel_name.toLowerCase());
        if (old_channel) {
          if (!discussionChannel) {
            await old_channel.setName(channel_name.toLowerCase());
            discussionChannel = old_channel;
          }
          else {
            await old_channel.delete('duplicate channel');
            DiscordLog.error('Duplicate channel found for `old_channel_name` reupload to `channel_name`. deleting `old_channel_name`');
          }
        }
      }
      if (!discussionChannel) {
        if (guild.channels.get(parentID).children.size === 50){
          ts.userError(tooManyChannelsError);
        }
        discussionChannel = await guild.createChannel(channel_name, {
          type: 'text',
          parent: guild.channels.get(parentID)
        });
        created = true;
      }
      else if (discussionChannel.parentID != parentID) {
        if (guild.channels.get(parentID).children.size === 50)
          ts.userError(tooManyChannelsError);
        await discussionChannel.setParent(parentID);
      }
      return { channel: discussionChannel, created };
    };
    /**
     *  Helper function to check if a channel exists, then post an overviem message and pin it if there are no pins or update it if there are pins
     * @param {Channel} channel a discord channel object
     * @param {RichEmbed} embed Discord Rich Embed
     * @throws {TypeError} Will throw type errors if the arguments are not provided
     */
    this.updatePinned = async (channel, embed) => {
      //console.time('pinned')
      if (!channel)
        throw new TypeError('channel_name undefined');
      if (!embed)
        throw new TypeError('embed not defined');
      let overviewMessage = (process.env.NODE_ENV !== 'test') ? (await channel.fetchPinnedMessages()).last() : null;
      if (!overviewMessage) {
        overviewMessage = await channel.send(embed);
        if (overviewMessage)
          await overviewMessage.pin();
      }
      else {
        await overviewMessage.edit(embed);
      }
      //console.timeEnd('pinned')
    };
    /**
     * @description This function will initiate any passed discord member object. Will set is_member=1 in the database and assign the member role. An initiation message will also be sent to the initiation channel
     */
    this.initiate = async (author) => {
      let guild = ts.getGuild();
      if (author.is_member != 1) {
        await ts.db.Members.query()
          .patch({ is_member: 1 })
          .where({ discord_id: author.discord_id });
        /* istanbul ignore if */
        if (author.discord_id) { //TODO: something broke here
          //doesn't work with mocked user method here.
          let curr_user = await guild.members.get(author.discord_id);
          if (curr_user) { //assign role
            await curr_user.addRole(ts.teamVariables.memberRoleId);
            await client.channels.get(ts.channels.initiateChannel).send(ts.message("initiation.message", { discord_id: author.discord_id }));
          }
          else {
            /* istanbul ignore if */
            if (process.env.NODE_ENV === "production")
              DiscordLog.error(ts.message("initiation.userNotInDiscord", { name: author.name }), ts.client); //not a breaking error.
          }
        }
      }
    };
    /**
     * Helper function to embed comments to a level embed
     */
    this.embedComments = (embed, comments) => {
      for (let i = 0; i < comments.length; i++) {
        let msgString = "";
        if (comments[i].type == "fix") {
          msgString = 'judge.votedFix';
        }
        else if (comments[i].type == "approve") {
          msgString = 'judge.votedApprove';
        }
        else {
          msgString = 'judge.votedReject';
        }
        let embedHeader = ts.message(msgString, { ...comments[i] });
        ts.embedAddLongField(embed, comments[i].reason, embedHeader);
      }
    };
    /**
     *
     */
    /**
     * @description This will process vote counts and get the respective votes needed and returns the result as a status update
     * @return {LevelStatus} returns the status update if any
     * @throws {UserError} if there is a tie
     * @throws {UserError} if there is not enough votes
     */
    this.processVotes = ({ approvalVotesNeeded = 0, fixVotesNeeded = 0, approvalVotesCount = 0, fixVotesCount = 0, rejectVotesCount = 0, is_fix = false }) => {
      const fixAndApproveVoteCount = fixVotesCount + approvalVotesCount;
      const VotesNeeded = parseInt(ts.teamVariables.VotesNeeded, 10);
      approvalVotesNeeded = approvalVotesNeeded || parseInt(ts.teamVariables.ApprovalVotesNeeded, 10) || VotesNeeded || 1;
      const rejectVotesNeeded = parseInt(ts.teamVariables.RejectVotesNeeded, 10) || VotesNeeded || 1;
      fixVotesNeeded = fixVotesNeeded || parseInt(ts.teamVariables.FixVotesNeeded, 10) || approvalVotesNeeded || VotesNeeded || 1;
      const approvalRatio = approvalVotesCount / approvalVotesNeeded;
      const rejectionRatio = rejectVotesCount / rejectVotesNeeded;
      const fixRatio = fixVotesCount / fixVotesNeeded;
      const fixApproveRatio = fixAndApproveVoteCount / fixVotesNeeded;
      const approvalFixRatio = fixAndApproveVoteCount / approvalVotesNeeded;
      let statusUpdate;
      if (!is_fix
        && approvalRatio >= 1
        && approvalRatio > rejectionRatio
        && approvalRatio >= fixRatio
        || is_fix
        && approvalFixRatio >= 1
        && approvalFixRatio > rejectionRatio) {
        statusUpdate = ts.LEVEL_STATUS.APPROVED;
      }
      else if (rejectionRatio >= 1
        && rejectionRatio > approvalRatio
        && rejectionRatio > fixApproveRatio) {
        statusUpdate = ts.LEVEL_STATUS.REJECTED;
      }
      else if (!is_fix //never reassign fix vote
        && fixApproveRatio >= 1
        && fixApproveRatio !== rejectionRatio
        && (approvalRatio < 1 ||
          approvalRatio >= 1 && approvalRatio !== fixRatio)) {
        statusUpdate = ts.LEVEL_STATUS.NEED_FIX;
      }
      else if (rejectVotesCount !== 0
        && (fixApproveRatio == rejectionRatio
          || approvalRatio == rejectionRatio)) {
        ts.userError(ts.message("approval.comboBreaker"));
      }
      else {
        ts.userError(ts.message('approval.numVotesNeeded'));
      }
      return statusUpdate;
    };
    /**
     * @description Processes the votes to see if it's all approval and fixes and see if the variance in difficulty is within the specified tolerance
     * @param {object} args
     * @param {object} args.AgreeingVotesNeeded
     * @param {object} args.AgreeingMaxDifference
     * @param {object} args.approvalVotes
     * @param {object} args.fixVotes
     * @param {object} args.rejectVotes
     * @return {boolean}
     */
    this.checkForAgreement = ({ AgreeingVotesNeeded, AgreeingMaxDifference, approvalVotes = [], fixVotes = [], rejectVotes = [] }) => {
      if (!(AgreeingVotesNeeded && AgreeingMaxDifference))
        return false;
      if ((approvalVotes.length + fixVotes.length) < AgreeingVotesNeeded)
        return false;
      if (rejectVotes.length > 0)
        return false;
      let min = 99, max = -1;
      [...approvalVotes, ...fixVotes].forEach(v => {
        min = Math.min(min, v.difficulty_vote);
        max = Math.max(max, v.difficulty_vote);
      });
      return (max - min) <= AgreeingMaxDifference;
    };
    this.judge = async function (code, fromFix = false) {
      const level = await ts.getExistingLevel(code, fromFix);
      const author = await ts.db.Members.query().where({ name: level.creator }).first();
      if (!PENDING_LEVELS.includes(level.status)) {
        ts.userError(ts.message("approval.levelNotPending"));
      }
      //Get all current votes for this level
      const approvalVotes = await ts.getPendingVotes().where('levels.id', level.id).where("type", "approve");
      const fixVotes = await ts.getPendingVotes().where('levels.id', level.id).where("type", "fix");
      const rejectVotes = await ts.getPendingVotes().where('levels.id', level.id).where("type", "reject");
      const AgreeingVotesNeeded = ts.teamVariables.AgreeingVotesNeeded || 0;
      const AgreeingMaxDifference = ts.teamVariables.AgreeingMaxDifference || 0;
      const inAgreement = ts.checkForAgreement({
        AgreeingVotesNeeded,
        AgreeingMaxDifference,
        approvalVotes,
        fixVotes,
        rejectVotes,
      });
      const statusUpdate = this.processVotes({
        approvalVotesNeeded: inAgreement ? AgreeingVotesNeeded : null,
        fixVotesNeeded: inAgreement ? AgreeingVotesNeeded : null,
        approvalVotesCount: approvalVotes.length,
        rejectVotesCount: rejectVotes.length,
        fixVotesCount: fixVotes.length,
        is_fix: fromFix,
      });
      let difficulty;
      if (statusUpdate == ts.LEVEL_STATUS.APPROVED) {
        ts.initiate(author);
        let difficultyArr = [...approvalVotes, ...fixVotes];
        let diffCounter = 0;
        let diffSum = 0;
        for (let i = 0; i < difficultyArr.length; i++) {
          let diff = parseFloat(difficultyArr[i].difficulty_vote);
          if (!Number.isNaN(diff)) {
            diffCounter++;
            diffSum += diff;
          }
        }
        difficulty = Math.round((diffSum / diffCounter) * 2) / 2;
      }

        await ts.db.Levels.query()
          .patch({ status: statusUpdate, difficulty })
          .where({ code });
        await ts.recalculateAfterUpdate({ code });
        const mention = this.message("general.heyListen", { discord_id: author.discord_id });
        const judgeEmbed = this.levelEmbed(level, this.embedStyle[statusUpdate], { difficulty });
        if (statusUpdate === this.LEVEL_STATUS.NEED_FIX)
          judgeEmbed.setDescription(ts.message("approval.fixInstructionsCreator"));
        this.embedComments(judgeEmbed, [...approvalVotes, ...fixVotes, ...rejectVotes]);
        await client.channels.get(ts.channels.levelChangeNotification).send(mention);
        await client.channels.get(ts.channels.levelChangeNotification).send(judgeEmbed);
        //Remove Discussion Channel
        await ts.deleteDiscussionChannel(level.code, ts.message("approval.channelDeleted"));
    };
    this.rejectLevelWithReason = async function (code, shellder, message) {
      let level = await ts.getLevels().where({ code }).first();
      if (level.status !== ts.LEVEL_STATUS.PENDING_FIXED_REUPLOAD && level.status !== ts.LEVEL_STATUS.PENDING_NOT_FIXED_REUPLOAD)
        ts.userError(ts.message('fixApprove.rejectNotNeedFix', { code }));
      let allVotes = await ts.getPendingVotes().where({ 'levels.id': level.id }).orderBy('type');
      await ts.db.Levels.query().patch({ status: ts.LEVEL_STATUS.REJECTED, old_status: level.status }).where({ code });
      const author = await ts.db.Members.query().where({ id: level.creator_id }).first();
      var mention = ts.message("general.heyListen", { discord_id: author.discord_id });
      var embed = ts.levelEmbed(level, this.embedStyle[ts.LEVEL_STATUS.REJECTED])
        .setAuthor(ts.message("approval.rejectAfterRefuse"));
      embed.setDescription("Rejected by <@" + shellder.id + ">: ```\n" + message + '\n```');
      this.embedComments(embed, allVotes);
      await client.channels.get(ts.channels.levelChangeNotification).send(mention);
      await client.channels.get(ts.channels.levelChangeNotification).send(embed);
      //Remove Discussion Channel
      await ts.deleteDiscussionChannel(code, ts.message("approval.channelDeleted"));
    };
    this.deleteDiscussionChannel = async function (code, reason) {
      if (!code)
        throw new Error('No code given to this.deleteDiscussionChannel');
      if (this.valid_code(code.toUpperCase())) {
        const levelChannel = this.getGuild().channels.find(channel => channel.name === code.toLowerCase());
        if (levelChannel) {
          await levelChannel.delete(reason);
        }
      }
    };
    this.putFeedback = async function (ip, discordId, salt, message) {
      let hash = crypto.createHmac('sha512', salt);
      hash.update(ip + " - " + discordId);
      let value = hash.digest('hex');
      await client.channels.get(ts.channels.feedbackChannel).send("**[" + value.slice(0, 8) + "]**\n> " + message.replace(/\n/g, "\n> "));
    };
    this.levelEmbed = function (level, args = {}, titleArgs) {
      let { color, title, image, noLink } = args;
      var vidStr = [];
      level.videos.split(",").forEach((vid, i) => {
        if (vid)
          vidStr.push("[ 🎬 ](" + vid + ")");
      });
      vidStr = vidStr.join(",");
      var tagStr = [];
      level.tags = level.tags ? level.tags : "";
      level.tags.split(",").forEach((tag) => {
        if (tag)
          tagStr.push("[" + tag + "](" + server_config.page_url + ts.url_slug + "/levels/" + encodeURIComponent(tag) + ")");
      });
      tagStr = tagStr.join(",");
      var embed = client.util.embed()
        .setColor(color || "#007bff")
        .setTitle(level.level_name + " (" + level.code + ")")
        .setDescription("made by " +
          (noLink ? level.creator : "[" + level.creator + "](" + server_config.page_url + ts.url_slug + "/maker/" + encodeURIComponent(level.creator) + ")") + "\n" +
          (ts.is_smm1(level.code) ? `Links: [Bookmark Page](https://supermariomakerbookmark.nintendo.net/courses/${level.code})\n` : '') +
          ("Difficulty: " + level.difficulty + ", Clears: " + level.clears + ", Likes: " + level.likes + "\n") +
          (tagStr ? "Tags: " + tagStr + "\n" : "") +
          (vidStr ? "Clear Video: " + vidStr : ""));
      if (title){
        embed.setAuthor(ts.message(title, titleArgs));
      }
      if (image){
        image = this.getEmoteUrl(image);
        embed.setThumbnail(image);
      }
      if (!noLink) {
        embed.setURL(server_config.page_url + ts.url_slug + "/level/" + level.code);
      }
      embed = embed.setTimestamp();
      return embed;
    };

    this.reuploadLevel = async function (message) {
      var player = await ts.db.Members.query().where({ discord_id: message.author.id }).first();
      if (!player)
        ts.userError(ts.message("error.notRegistered"));
      let command = ts.parse_command(message);
      let old_code = command.arguments.shift();
      if (old_code) {
        old_code = old_code.toUpperCase();
      }
      else {
        ts.userError(ts.message("reupload.noOldCode"));
      }
      if (!ts.valid_code(old_code)) {
        ts.userError(ts.message("reupload.invalidOldCode"));
      }
      let new_code = command.arguments.shift();
      if (new_code) {
        new_code = new_code.toUpperCase();
      }
      else {
        ts.userError(ts.message("reupload.noNewCode"));
      }
      if (!ts.valid_code(new_code))
        ts.userError(ts.message("reupload.invalidNewCode"));
      const reason = command.arguments.join(" ");
      if (old_code == new_code)
        ts.userError(ts.message("reupload.sameCode"));
      if (!reason)
        ts.userError(ts.message("reupload.giveReason"));
      var earned_points = await ts.calculatePoints(player.name);
      var rank = ts.get_rank(earned_points.clearPoints);
      var user_reply = "<@" + message.author.id + ">" + (rank.pips ? rank.pips : "") + " ";
      var level = await ts.getLevels().where({ code: old_code }).first();
      if (!level)
        ts.userError(ts.message("error.levelNotFound", { code: old_code }));
      var new_level = await ts.getLevels().where({ code: new_code }).first();
      let oldApproved = level.status;
      //level.status==ts.LEVEL_STATUS.APPROVED || level.status==ts.LEVEL_STATUS.PENDING
      if (new_level && level.creator != new_level.creator)
        ts.userError(ts.message("reupload.differentCreator"));
      if (new_level
        && new_level.status != ts.LEVEL_STATUS.PENDING
        && new_level.status != ts.LEVEL_STATUS.APPROVED
        && new_level.status != ts.LEVEL_STATUS.NEED_FIX)
        ts.userError(ts.message("reupload.wrongApprovedStatus"));
      //Reupload means you're going to replace the old one so need to do that for upload check
      let creator_points = await ts.calculatePoints(level.creator, ts.SHOWN_IN_LIST.includes(level.status));
      if (level.new_code)
        ts.userError(ts.message("reupload.haveReuploaded", { code: level.new_code }));
      if (!new_level && !(ts.SHOWN_IN_LIST.includes(level.status) ||
        !ts.SHOWN_IN_LIST.includes(level.status) && creator_points.canUpload)){
        ts.userError(ts.message("reupload.notEnoughPoints"));
      }
      if (!(level.creator_id == player.id || player.is_mod)){
        ts.userError(ts.message("reupload.noPermission", level));
      }
      await ts.db.Levels.query().patch({
        status: level.status == ts.LEVEL_STATUS.APPROVED ? ts.LEVEL_STATUS.REUPLOADED : ts.LEVEL_STATUS.REMOVED,
        old_status: level.status,
        new_code,
      })
        .where({
          code: old_code,
        });
      await ts.db.Levels.query().patch({ new_code }).where({ new_code: old_code });
      if (!new_level) { //if no new level was found create a new level copying over the old data
        await ts.db.Levels.query().insert({
          code: new_code,
          level_name: level.level_name,
          creator: level.creator_id,
          difficulty: false,
          status: 0,
          tags: level.tags,
        });
        new_level = await ts.getLevels().where({ code: new_code }).first();
      }
      await ts.db.PendingVotes.query()
        .patch({ code: new_level.id })
        .where({ code: level.id });
      let newStatus = 0;
      if (oldApproved === ts.LEVEL_STATUS.NEED_FIX) {
        newStatus = ts.LEVEL_STATUS.PENDING_FIXED_REUPLOAD; //should make another one
      }
      else if (oldApproved === ts.LEVEL_STATUS.APPROVED) {
        newStatus = ts.LEVEL_STATUS.PENDING_APPROVED_REUPLOAD;
      }
      if (newStatus) {
        await ts.db.Levels.query()
          .patch({ status: newStatus }) //new level doesn't need old_status
          .where({ code: new_code });
        new_level.status = newStatus;
      }
      const author = await ts.db.Members.query()
        .where({ id: new_level.creator_id })
        .first();
      if (newStatus !== 0 || newStatus === 0 && ts.findChannel({ name: level.code })) {
        //TODO:FIX HERE
        //  
        const { channel } = await ts.discussionChannel(new_code, newStatus === ts.LEVEL_STATUS.PENDING ? ts.channels.levelDiscussionCategory : ts.channels.pendingReuploadCategory, level.code);
        const voteEmbed = await ts.makeVoteEmbed(new_level, reason || "");
        await ts.updatePinned(channel, voteEmbed);
        await channel.send(ts.message("reupload.reuploadNotify", { old_code, new_code }));
        await channel.send(`Reupload Request for <@${author.discord_id}>'s level with message: ${reason}`);
      }
      let reply = ts.message("reupload.success", { level, new_code });
      if (!new_level){
        reply += ts.message("reupload.renamingInstructions");
      }
      if (newStatus !== ts.LEVEL_STATUS.PENDING)
        reply += ts.message("reupload.inReuploadQueue");
      await ts.recalculateAfterUpdate();
      return user_reply + reply;
    }
  
  }

    /**
   * Helper function to get the Discord Guild object
   * @returns {Guild}
   */
    getGuild() {
      return this.client.guilds.get(this.guild_id);
    };

      /**
     * Function that recalculates and updates the stored calculated information in the database. To be called everytime relevant data is added/updated/deleted.
     * Relevant updates: level difficulty update, level removal, clear add/updates/delete, point/score update, likes, difficulty vote, votes
     */
    async recalculateAfterUpdate () {
      return await knex.raw(`UPDATE levels 
      inner join (SELECT *
    ,if(clears=0,0,round(((likes*2+clears)*score*likes/clears),1)) maker_points
    ,if(clears=0,0,round(likes/clears*100,1)) clear_like_ratio
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
      levels.status IN (:SHOWN_IN_LIST:)
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
        INNER JOIN points ON
          points.difficulty=levels.difficulty
          AND points.guild_id=levels.guild_id
        WHERE
          levels.guild_id=:guild_id and
          levels.status in (:SHOWN_IN_LIST:)
        GROUP BY creator,levels.guild_id
      ) own_levels ON
          members.guild_id=own_levels.guild_id
          AND members.id=own_levels.creator
      SET
        members.clear_score_sum=COALESCE(total_score,0)+if(:include_own_score,COALESCE(own_levels.own_score,0),0),
        members.levels_cleared=COALESCE(total_cleared,0),
        members.levels_created=COALESCE(calculated_levels_created,0),
        members.own_score=COALESCE(own_levels.own_score,0),
        members.free_submissions=COALESCE(own_levels.free_submissions,0),
        members.maker_points=COALESCE(own_levels.maker_points,0)
      WHERE members.guild_id=:guild_id;
  `, {
        guild_id: this.team.id,
        SHOWN_IN_LIST: knex.raw(SHOWN_IN_LIST),
        include_own_score: this.teamVariables.includeOwnPoints == "true" || false,
      });
    };


  /**
   * Parses a message from discord and converts it to an array of words
   * @param {object} message
   * @returns {object} returns command
   */
  parse_command(message) {
    var raw_command = message.content.trim();
    raw_command = raw_command.split(" ");
    var sb_command = raw_command.shift().toLowerCase().substring(1); //remove first character
    if(!sb_command) raw_command.shift().toLowerCase();
    var filtered = [];
    raw_command.forEach((s) => {
      if (s)
        filtered.push(s);
    });
    return {
      command: sb_command,
      arguments: filtered,
      argumentString: filtered.join(" "),
    };
  }

  /**
   * Get the specified rank for a user by comparing achived score and the list or ranks from database
   * @return {Object} The rank row from database
   */
  get_rank(points){
    const ret = this.ranks.find(r => parseFloat(points) >= parseFloat(r.min_points));
    return ret;
  }

  /**
   * Helper function to find channels
   * @param {string} obj.name Channel name
   * @param {Snowflake} obj.parentID Category ID
   * @returns {boolean} channel found or not
   */
  findChannel({ name, parentID }){
    const guild = this.getGuild();
    const channel = guild.channels.find((channel) => (!parentID || parentID && channel.parentID === parentID) && channel.name === name.toLowerCase());
    return channel;
  };

  /**
   * Function to convert a tag to lowercase, and stripped of all special characters for comparison
   * @param {string} str tag to be tranformed
   * @returns {string}
   */
  transformTag(str){
    return str.toLowerCase().replace(/[^a-z0-9]/g,'')
  }

  /**
   * Add tags to database if doesn't exist
   * @param {string|string[]} tags Can pass a comma seperated string or an array of strings
   * @param {knex} [trx] a transaction object
   * @returns {string[]}  returns an array of tags
   */
  async addTags(tags,trx=knex){
    if(!Array.isArray(tags) && typeof tags === "string") tags=tags.split(/[,\n]/)
    if(!Array.isArray(tags)) throw TypeError("not a string or array of strings")
    

    let existing_tags=await trx('tags').where({guild_id:this.team.id})
    let that=this
    existing_tags=existing_tags.map((t)=>{
      return { value:t.name,compare:that.transformTag(t.name)}
    })
    const newTags=[]
    for(let i=0;i<tags.length;i++){
      if(tags[i]){
        const same_tag=existing_tags.find((t)=>this.transformTag(tags[i])===t.compare);
        if(same_tag){
          tags[i]=same_tag.value
        } else {
          existing_tags.push({value:tags[i].trim(),compare:this.transformTag(tags[i])})
          newTags.push({name:tags[i].trim(),guild_id:this.team.id})
        }
      }
    }
    if(newTags.length!==0){
      await trx('tags').insert(newTags);
    }

    return tags;
  }


  /**
   * Helper function to help secure data being send for updating/editing
   * @param {RowPacket[]} data Rows of data probably from the database. expects to contain an id and a guild_id
   * @returns {RowPacket[]} returns the same data but with signed values to verify id
   */
  secure_data(data){
    return data.map((d)=>{
      d.__secure=jwt.sign({
        id:d.id,
      },this.config.key);
      return d
    });
  }

  /**
   * Helper function to help verified secure data being recieved. Checks for id 
   * @param {RowPacket[]} data Rows of data recieved from user. each row should contain __secure created in secure_data
   * @returns {RowPacket[]} returns the same data but removes __secure after verifying it.
   * @throws {UserError} returns an error if the id in the row does not match the one in __secure
   */
  verify_data(data){
    return data.map( (d)=>{
      if(d.id){
        if(!d.__secure) this.userError(this.message('error.wrongTokens'));
        try {
          const decoded=jwt.verify(d.__secure,this.config.key);
          if(decoded.id!=d.id){
            this.userError(this.message('error.wrongTokens'));
          }
        } catch(error){
          this.userError(this.message('error.wrongTokens'));
        }
      } else {
        delete d.id
        delete d.guild_id
      }
      delete d.__secure;
      return d
    })
  }

    /**
     * This will gather the necessary data to generate the points achived by the player
     */
    async calculatePoints(name, if_remove_check) {
      let member = await this.db.Members.query().where({ name }).first();
      let min = parseFloat(this.get_variable("Minimum Point") || 0);
      let next = parseFloat(this.get_variable("New Level") || 0);
      let pointsNeeded = this.pointsNeededForLevel({
        points: member.clear_score_sum,
        levelsUploaded: Math.max(0, member.levels_created - (if_remove_check ? 1 : 0)),
        freeLevels: member.free_submissions,
        min,
        next,
      });
      return {
        clearPoints: member.clear_score_sum,
        levelsMade: member.levels_created,
        freeSubmissions: member.free_submissions,
        pointsNeeded: pointsNeeded,
        canUpload: pointsNeeded < 0.05,
      };
    }

  /**
   * call to add a TS into the list.
   */
  static async add(guild_id, client, gs) {
    TS.TS_LIST[guild_id] = new TS(guild_id, client, gs);
    await TS.TS_LIST[guild_id].load();
    return TS.TS_LIST[guild_id];
  }
  /**
   * Get a TS object from a url_slug
   */
  static teamFromUrl(url_slug) {
    for (let i in TS.TS_LIST) {
      let team = TS.TS_LIST[i];
      if (team.config && team.url_slug == url_slug) {
        return team;
      }
    }
    return false;
  }
  /**
   * default makerteam messages for use above the team layer
   */
  static message(type, args) {
    if (TS.defaultMessages[type]) {
      return TS.defaultMessages[type](args);
    }
    throw new Error(`"${type}" message string was not found in ts.message`);
  }
  /**
   * Get a team
   * @param {Snowflake} guild_id
   */
  static teams(guild_id) {
    if (TS.TS_LIST[guild_id]) {
      return TS.TS_LIST[guild_id];
    }
    else {
      throw new Error(`This team, with guild id ${guild_id} has not yet setup it's config, buzzyS`);
    }
  }
  /**
   * Registers a new team when they run it in a discord server that is not registered
   */
  /*
  static async create(args, client, gs) {
    if (!args)
      throw new Error(`No arguments passed to TS.create`);
    const { guild_id } = args;
    const Team = require('./models/Teams.js')();
    let existingTeam = await Team.query().where({ guild_id }).first();
    if (!existingTeam) {
      await Team.query().insert(args);
      let existingTeam = await Team.query().where({ guild_id }).first();
      return await TS.add(existingTeam.guild_id, existingTeam, client, gs);
    }
    else {
      throw new Error(`Server already registered as ${existingTeam.guild_name}`);
    }
  }
  */
}
TS.TS_LIST={}
TS.UserError=UserError;

module.exports=TS 
