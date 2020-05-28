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
    name: 'pendingReuploadCategory',
    default: 'bot-pending-reupload',
    description:
      'The channel where level reuploads are discussed. Only mods should be able to send/read this category',
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
]);

/**
 * Team settable Variables
 */
const defaultVariables = Object.freeze([
  {
    name: 'TeamName',
    caption: 'Team Name',
    default: 'A Maker Team',
    type: 'text',
    description: 'Will be used by the bot in the reponses',
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

module.exports = {
  botPermissions,
  defaultChannels,
  defaultVariables,
  LEVEL_STATUS,
  PENDING_LEVELS,
  SHOWN_IN_LIST,
  REMOVED_LEVELS,
};
