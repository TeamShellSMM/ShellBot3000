const botPermissions = Object.freeze({
  allow: [
    'VIEW_CHANNEL',
    'SEND_MESSAGES',
    'MANAGE_MESSAGES',
    'MANAGE_CHANNELS',
    'READ_MESSAGE_HISTORY',
    'ADD_REACTIONS',
    'USE_EXTERNAL_EMOJIS',
  ],
  deny: [],
});

const defaultChannels = Object.freeze([
  {
    name: 'modChannel',
    default: 'bot-mod-channel',
    description:
      'The only channel where mod commands will work (approve,rerate). Only mods should be able to send/read channel',
    defaultPermission: {
      allow: [],
      deny: ['VIEW_CHANNEL', 'SEND_MESSAGES'],
    },
  },
  {
    name: 'initiateChannel',
    default: 'bot-makerteam-initiation',
    description:
      'The channel where the member will be notified if they officially become a member. This channel should be read only to everybody',
    defaultPermission: {
      allow: ['VIEW_CHANNEL'],
      deny: ['SEND_MESSAGES'],
    },
  },
  {
    name: 'levelChangeNotification',
    default: 'bot-level-updates',
    description:
      'The channel where level approvals,rejections and rerates notifications are posted by the bot. This should be readonly to everyone',
    defaultPermission: {
      allow: ['VIEW_CHANNEL'],
      deny: ['SEND_MESSAGES'],
    },
  },
  {
    name: 'commandFeed',
    default: 'bot-command-feed',
    description:
      'This is where clears/likes and other commands from the web will be shown. This should be read only to everyone',
    defaultPermission: {
      allow: ['VIEW_CHANNEL'],
      deny: ['SEND_MESSAGES'],
    },
  },
  {
    name: 'levelAuditCategory',
    default: 'bot-level-audit',
    description:
      'The channel category where level reuploads, deletion and rerate requests are put in and where you can discuss about them. Only mods should be able to send/read this category',
    type: 'category',
    defaultPermission: {
      allow: [],
      deny: ['VIEW_CHANNEL', 'SEND_MESSAGES'],
    },
  },
  {
    name: 'feedbackChannel',
    default: 'bot-makerteam-feedback',
    description:
      'Channel where the anonymous feedback will be posted. This should be readonly for whoever can read the feedback',
    defaultPermission: {
      allow: [],
      deny: ['VIEW_CHANNEL', 'SEND_MESSAGES'],
    },
  },
  {
    name: 'levelDiscussionCategory',
    default: 'bot-pending-discussion',
    description:
      'Channel category where pending channels will be created. Only mods should be able to send/read this category',
    type: 'category',
    defaultPermission: {
      allow: [],
      deny: ['VIEW_CHANNEL', 'SEND_MESSAGES'],
    },
  },
  {
    name: 'raceChannel',
    default: 'bot-race-channel',
    description:
      'The channel where race updates get posted and race discussion can happen.',
    defaultPermission: {
      allow: ['VIEW_CHANNEL', 'SEND_MESSAGES'],
      deny: [],
    },
  },
]);

/**
 * Team settable Variables
 */
const defaultVariables = Object.freeze([
  {
    name: 'TeamName',
    caption: 'Team Name',
    default: 'Maker Team',
    type: 'text',
    description: 'Will be used by the bot in the reponses',
  },
  {
    name: 'FirstPart',
    caption: 'First Part',
    default: 'Maker',
    type: 'text',
    description:
      'The first part of your team name. Used to make the colour style/work',
  },
  {
    name: 'SecondPart',
    caption: 'Second Part',
    default: ' Team',
    type: 'text',
    description:
      'The second part of your team name. Used to make the colour style/work',
  },
  {
    name: 'ManagerName',
    caption: 'Team Manager Name',
    default: 'Admin',
    type: 'text',
    description:
      'The discord role that will let them to edit team settings and other commands',
  },
  {
    name: 'ModName',
    caption: 'Mod Name',
    default: 'Admin',
    type: 'text',
    description: "Will be refered to by the bot's response",
  },
  {
    name: 'BotName',
    caption: 'Bot Name',
    default: 'ShellBot 3000',
    type: 'text',
    description:
      "What the bot will refer to itself in it's responses",
  },
  {
    name: 'DiscordInvite',
    caption: 'Discord Invite Link',
    default: '',
    type: 'text',
    description:
      'A discord link, ideally a non expiring one pointing towards your rules channel or registration channel',
  },
  {
    name: 'AddLevelRequirements',
    caption: 'Requirements for adding a level',
    default: '',
    type: 'text',
    description:
      'This will be shown as part of the fourth step in "How to become part of the team"',
  },
  {
    name: 'TwitterUser',
    caption: 'Twitter User of the Team',
    default: '',
    type: 'text',
    description:
      'If provided we will embed your twitter timeline in the homepage',
  },
  {
    name: 'HaveFun',
    caption: 'Have Fun Message',
    default: 'Have fun.',
    type: 'text',
    description:
      'Short message after the "How to become part of the team"',
  },
  {
    name: 'FrontPageDescription',
    caption: 'Team Summary/Description',
    default: 'We are a team.',
    type: 'text',
    description:
      'The description which will be shown in the front page',
  },
  {
    name: 'PrimaryColor',
    caption: 'Primary Color',
    default: '#888888',
    type: 'text',
    description: 'Primary color for your team',
  },
  {
    name: 'SecondaryColor',
    caption: 'Secondary Color',
    default: '#888888',
    type: 'text',
    description: 'Secondary color for your team',
  },
  {
    name: 'ChannelsShellbotAllowed',
    caption: 'Allow ShellBot in channels/categories',
    default: '',
    type: 'text',
    description:
      'Channels/Category names seperated by commas. If set, ShellBot will only run most commands in the set channels/categories. Help commands will still run anywhere else though',
  },
  {
    name: 'RegistrationChannel',
    caption: 'Registration Channel',
    default: 'registration',
    type: 'text',
    description:
      'The channel which ShellBot will suggest where registration should be done',
  },
  {
    name: 'LevelSubmissionChannel',
    caption: 'Level Submission Channel',
    default: 'level-submission',
    type: 'text',
    description:
      'The channel which ShellBot will suggest where level submissions should be done',
  },
  {
    name: 'LevelClearChannel',
    caption: 'Clear Submission Channel',
    default: 'level-clears',
    type: 'text',
    description:
      'The channel which ShellBot will suggest where level clears should be done',
  },
  {
    name: 'MiscChannel',
    caption: 'Misc Channel',
    default: 'misc-commands',
    type: 'text',
    description:
      'The channel which ShellBot will suggest for other commands',
  },
  {
    name: 'Minimum Point',
    caption: 'First Level Points',
    default: 0,
    type: 'number',
    description:
      'Minimum no. of points needed to submit their first level',
  },
  {
    name: 'New Level',
    caption: 'New Level Points',
    default: 0,
    type: 'number',
    description: 'How many points needed to submit another level',
  },
  {
    name: 'MinimumPointsUnofficialRace',
    caption: 'Minimum Points Unofficial Race',
    default: 0,
    type: 'number',
    description:
      'Minimum no. of points needed to create unofficial races',
  },
  {
    name: 'memberRole',
    caption: 'Member Role',
    default: '',
    type: 'text',
    description:
      'Roles assigned when a member gets an approved level (name)',
  },
  {
    name: 'memberRoleId',
    caption: 'Member Role Id',
    default: '',
    type: 'text',
    description:
      'Roles assigned when a member gets an approved level',
  },
  {
    name: 'nonMemberRoleId',
    caption: 'Non-Member Role Id',
    default: '',
    type: 'text',
    description: 'Roles assigned when a member registers',
  },
  {
    name: 'maxDifficulty',
    caption: 'Maximum Difficulty',
    default: 10,
    type: 'number',
    description: 'The maximum allowed difficulty for this team.',
  },
  {
    name: 'VotesNeeded',
    caption: 'Votes Needed',
    default: 1,
    type: 'number',
    description: 'How many mods needed to approve/reject  level',
  },
  {
    name: 'ApprovalVotesNeeded',
    caption: 'Approval Votes',
    default: null,
    type: 'number',
    description: 'How many mods needed to approve a level',
  },
  {
    name: 'RejectVotesNeeded',
    caption: 'Reject Votes',
    default: null,
    type: 'number',
    description: 'How many mods are needed to reject a level',
  },
  {
    name: 'AgreeingVotesNeeded',
    caption: 'Agreeing Votes',
    default: null,
    type: 'number',
    description:
      'How many approval/fix votes are needed in agreement (within the max difference of difficulty, and with no rejects) to allow judging',
  },
  {
    name: 'AgreeingMaxDifference',
    caption: 'Aggreeing Votes Difference',
    default: null,
    type: 'number',
    step: '0.1',
    description:
      'How far apart the approval/fix votes can be to count as in agreement',
  },

  {
    name: 'includeOwnPoints',
    caption: 'Own Points',
    default: false,
    type: 'boolean',
    description:
      'Allow creator made levels to count with own points?',
  },
  {
    name: 'whitelistedTagsOnly',
    caption: 'Whitelisted Tags Only',
    default: false,
    type: 'boolean',
    description:
      'Non mods can only add tags that are already existing',
  },
  {
    name: 'allowSMM1',
    caption: 'Allow SMM1',
    default: false,
    type: 'boolean',
    description: 'Allow submissions of SMM1 levels',
  },
  {
    name: 'discordAdminCanMod',
    caption: 'Discord Admin Mod',
    default: false,
    type: 'boolean',
    description: 'Allows anyone with admin role to mod for the team',
  },
  {
    name: 'disableMemberLevelSubmission',
    caption: 'Disable Member Level Submission',
    default: false,
    type: 'boolean',
    description:
      'Disallow members to submit their own levels, if this is set only mods can add levels for members.',
  },
  {
    name: 'hideJoinTeamInstructions',
    caption: 'Hide Join Team Instructions',
    default: false,
    type: 'boolean',
    description:
      'Check this to hide the "How to join the Team" section on your team homepage that shows up when you are not logged in.',
  },
  {
    name: 'hideRacesTab',
    caption: 'Hide Races Tab',
    default: false,
    type: 'boolean',
    description: 'Check this to hide the races tab on your page.',
  },
  {
    name: 'hideMembersTab',
    caption: 'Hide Members tab',
    default: false,
    type: 'boolean',
    description: 'Check this to hide the members tab on your page.',
  },
  {
    name: 'userErrorEmote',
    caption: 'User Error Emote',
    default: null,
    type: 'text',
    description:
      'The default emote that will show when a user error occurs.',
  },
  {
    name: 'criticalErrorEmote',
    caption: 'Critical Error Emote',
    default: null,
    type: 'text',
    description:
      'The default emote of an error you should tell the devs about buzzyS',
  },
  {
    name: 'updateEmote',
    caption: 'Update Emote',
    default: null,
    type: 'text',
    description:
      'The default emote that will show when an update appears',
  },
  {
    name: 'pogEmote',
    caption: 'Pog Emote',
    default: null,
    type: 'text',
    description:
      'The default emote that will show when pog things happen',
  },
  {
    name: 'loveEmote',
    caption: 'Love Emote',
    default: null,
    type: 'text',
    description: 'The default love emote used in some messages',
  },
  {
    name: 'GGEmote',
    caption: 'GG Emote',
    default: null,
    type: 'text',
    description: 'GG emote shown in clear messages',
  },

  {
    name: 'rejectedEmote',
    caption: 'Rejected Level Emote',
    default: null,
    type: 'text',
    description: 'Emote to be shown in level rejected messages',
  },
  {
    name: 'approvedEmote',
    caption: 'Approved Level Emote',
    default: null,
    type: 'text',
    description: 'Emote to be shown in level approved messages',
  },
  {
    name: 'needFixEmote',
    caption: 'Fix Request Emote',
    default: null,
    type: 'text',
    description: 'Emote to be shown in need fix messages',
  },
  {
    name: 'judgementEmote',
    caption: 'Judgement Emote',
    default: null,
    type: 'text',
    description: 'Emote to be shown in approval votes embed for mods',
  },
  {
    name: 'removeEmote',
    caption: 'Remove Level Emote',
    default: null,
    type: 'text',
    description: 'Emote to be shown in remove level messages',
  },
  {
    name: 'undoEmote',
    caption: 'Undo Remove Emote',
    default: null,
    type: 'text',
    description: 'Emote to be shown in undo remove level messages',
  },
  {
    name: 'rerateEmote',
    caption: 'Level Rerate Emote',
    default: null,
    type: 'text',
    description: 'Emote to be shown in rerate level messages',
  },
  {
    name: 'randomEmote',
    caption: 'Random Level Emote',
    default: null,
    type: 'text',
    description: 'Emote to be shown in random level messages',
  },
]);

/**
 * The status of a level
 * * PENDING_APPROVED_REUPLOAD
 * * PENDING_FIXED_REUPLOAD
 * * PENDING_NOT_FIXED_REUPLOAD
 * * NEED_FIX
 * * APPROVED
 * * REJECTED
 * * REUPLOADED
 * * REMOVED
 * * USER_REMOVED
 * @typedef {number} LevelStatus
 */
const LEVEL_STATUS = Object.freeze({
  PENDING: 0,
  PENDING_APPROVED_REUPLOAD: 3,
  PENDING_FIXED_REUPLOAD: 4,
  PENDING_NOT_FIXED_REUPLOAD: 5,

  NEED_FIX: -10,
  APPROVED: 1,
  REJECTED: -1,

  REUPLOADED: 2,
  REMOVED: -2,
  USER_REMOVED: -3,
});

/**
 * Level status that are pending
 * @type {LevelStatus[]}
 */
const PENDING_LEVELS = Object.freeze([
  LEVEL_STATUS.PENDING,
  LEVEL_STATUS.PENDING_NOT_FIXED_REUPLOAD,
  LEVEL_STATUS.PENDING_APPROVED_REUPLOAD,
  LEVEL_STATUS.PENDING_FIXED_REUPLOAD,
]);

/**
 * Level status that appears in the list
 * @type {LevelStatus[]}
 */
const SHOWN_IN_LIST = Object.freeze([
  ...PENDING_LEVELS,
  LEVEL_STATUS.NEED_FIX,
  LEVEL_STATUS.APPROVED,
]);

/**
 * Level status that doesn't appear in the list
 * @type {LevelStatus[]}
 */
const REMOVED_LEVELS = Object.freeze([
  LEVEL_STATUS.REUPLOADED,
  LEVEL_STATUS.REJECTED,
  LEVEL_STATUS.REMOVED,
  LEVEL_STATUS.USER_REMOVED,
]);

/**
 * Level status that doesn't appear in the list
 * @type {ChannelLabel[]}
 */
const CHANNEL_LABELS = Object.freeze({
  PENDING_ALMOST_APPROVE: '📗',
  PENDING_ALMOST_FIX: '📙',
  PENDING_ALMOST_REJECT: '📕',
  PENDING_CREATOR_UNINITIATED: '🔰',
  AUDIT_FIX_REQUEST: '🔨',
  AUDIT_APPROVED_REUPLOAD: '🔁',
  AUDIT_DELETION_REQUEST: '💀',
  AUDIT_RERATE_REQUEST: '🔢',
  AUDIT_VERIFY_CLEARS: '✅',
});

/**
 * Default permissions for all commands
 * allowedRoles are all, mods or admins
 * allowedChannels - if this is empty, all are allowed
 * allowedChannels types are text or category
 * allowedChannels settingChannelName is only used for category or text and is the team setting var name
 */
const defaultCommandPermissions = Object.freeze({
  add: {
    allowedRoles: 'all',
    allowedChannels: [],
  },
  addtags: {
    allowedRoles: 'all',
    allowedChannels: [],
  },
  removetags: {
    allowedRoles: 'all',
    allowedChannels: [],
  },
  addvids: {
    allowedRoles: 'all',
    allowedChannels: [],
  },
  removevids: {
    allowedRoles: 'all',
    allowedChannels: [],
  },
  amendcode: {
    allowedRoles: 'mods',
    allowedChannels: [
      {
        type: 'text',
        settingChannelName: 'modChannel',
      },
    ],
  },
  atme: {
    allowedRoles: 'all',
    allowedChannels: [],
  },
  dontatme: {
    allowedRoles: 'all',
    allowedChannels: [],
  },
  nickname: {
    allowedRoles: 'all',
    allowedChannels: [],
  },
  clear: {
    allowedRoles: 'all',
    allowedChannels: [],
  },
  cleardifficulty: {
    allowedRoles: 'mods',
    allowedChannels: [
      {
        type: 'text',
        settingChannelName: 'modChannel',
      },
    ],
  },
  difficulty: {
    allowedRoles: 'all',
    allowedChannels: [],
  },
  fixdiscuss: {
    allowedRoles: 'mods',
    allowedChannels: [
      {
        type: 'text',
        settingChannelName: 'modChannel',
      },
      {
        type: 'category',
        settingChannelName: 'levelDiscussionCategory',
      },
    ],
  },
  search: {
    allowedRoles: 'all',
    allowedChannels: [],
  },
  like: {
    allowedRoles: 'all',
    allowedChannels: [],
  },
  unlike: {
    allowedRoles: 'all',
    allowedChannels: [],
  },
  login: {
    allowedRoles: 'all',
    allowedChannels: [],
  },
  makerid: {
    allowedRoles: 'all',
    allowedChannels: [],
  },
  modaddclear: {
    allowedRoles: 'mods',
    allowedChannels: [
      {
        type: 'text',
        settingChannelName: 'modChannel',
      },
    ],
  },
  modaddlevel: {
    allowedRoles: 'mods',
    allowedChannels: [
      {
        type: 'text',
        settingChannelName: 'modChannel',
      },
    ],
  },
  modaddmember: {
    allowedRoles: 'mods',
    allowedChannels: [
      {
        type: 'text',
        settingChannelName: 'modChannel',
      },
    ],
  },
  modsetdiscordid: {
    allowedRoles: 'mods',
    allowedChannels: [
      {
        type: 'text',
        settingChannelName: 'modChannel',
      },
    ],
  },
  pendingstatus: {
    allowedRoles: 'all',
    allowedChannels: [],
  },
  playersrandom: {
    allowedRoles: 'all',
    allowedChannels: [],
  },
  points: {
    allowedRoles: 'all',
    allowedChannels: [],
  },
  random: {
    allowedRoles: 'all',
    allowedChannels: [],
  },
  randomall: {
    allowedRoles: 'all',
    allowedChannels: [],
  },
  randompending: {
    allowedRoles: 'all',
    allowedChannels: [],
  },
  randomtag: {
    allowedRoles: 'all',
    allowedChannels: [],
  },
  register: {
    allowedRoles: 'all',
    allowedChannels: [],
  },
  refresh: {
    allowedRoles: 'mods',
    allowedChannels: [
      {
        type: 'text',
        settingChannelName: 'modChannel',
      },
    ],
  },
  requestremoval: {
    allowedRoles: 'all',
    allowedChannels: [],
  },
  removevote: {
    allowedRoles: 'mods',
    allowedChannels: [
      {
        type: 'category',
        settingChannelName: 'levelDiscussionCategory',
      },
      {
        type: 'text',
        settingChannelName: 'modChannel',
      },
    ],
  },
  rename: {
    allowedRoles: 'all',
    allowedChannels: [],
  },
  renamemember: {
    allowedRoles: 'mods',
    allowedChannels: [
      {
        type: 'text',
        settingChannelName: 'modChannel',
      },
    ],
  },
  requestrerate: {
    allowedRoles: 'all',
    allowedChannels: [],
  },
  resetstatus: {
    allowedRoles: 'mods',
    allowedChannels: [
      {
        type: 'text',
        settingChannelName: 'modChannel',
      },
    ],
  },
  reupload: {
    allowedRoles: 'all',
    allowedChannels: [],
  },
  setworld: {
    allowedRoles: 'all',
    allowedChannels: [],
  },
  approve: {
    allowedRoles: 'mods',
    allowedChannels: [
      {
        type: 'category',
        settingChannelName: 'levelDiscussionCategory',
      },
      {
        type: 'text',
        settingChannelName: 'modChannel',
      },
    ],
  },
  fix: {
    allowedRoles: 'mods',
    allowedChannels: [
      {
        type: 'category',
        settingChannelName: 'levelDiscussionCategory',
      },
      {
        type: 'text',
        settingChannelName: 'modChannel',
      },
    ],
  },
  reject: {
    allowedRoles: 'mods',
    allowedChannels: [
      {
        type: 'category',
        settingChannelName: 'levelDiscussionCategory',
      },
      {
        type: 'text',
        settingChannelName: 'modChannel',
      },
    ],
  },
  auditapprove: {
    allowedRoles: 'mods',
    allowedChannels: [
      {
        type: 'category',
        settingChannelName: 'levelAuditCategory',
      },
    ],
  },
  auditreject: {
    allowedRoles: 'mods',
    allowedChannels: [
      {
        type: 'category',
        settingChannelName: 'levelAuditCategory',
      },
    ],
  },
  help: {
    allowedRoles: 'all',
    allowedChannels: [],
  },
  info: {
    allowedRoles: 'all',
    allowedChannels: [],
  },
  judge: {
    allowedRoles: 'mods',
    allowedChannels: [
      {
        type: 'category',
        settingChannelName: 'levelDiscussionCategory',
      },
    ],
  },
  refusefix: {
    allowedRoles: 'all',
    allowedChannels: [],
  },
  removeclear: {
    allowedRoles: 'all',
    allowedChannels: [],
  },
  rerate: {
    allowedRoles: 'mods',
    allowedChannels: [
      {
        type: 'text',
        settingChannelName: 'modChannel',
      },
    ],
  },
  unsetworld: {
    allowedRoles: 'all',
    allowedChannels: [],
  },
});

module.exports = {
  botPermissions,
  defaultChannels,
  defaultVariables,
  defaultCommandPermissions,
  LEVEL_STATUS,
  PENDING_LEVELS,
  SHOWN_IN_LIST,
  REMOVED_LEVELS,
  CHANNEL_LABELS,
};
