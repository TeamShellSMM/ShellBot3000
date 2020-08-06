exports.up = function (knex) {
  const insertJson = [
    {
      name: 'lang.help',
      message:
        '\n🇰🇷 `!help kr`\n🇷🇺 `!help ru`\n🇩🇪 `!help de`\n🇫🇷 `!help fr`\n🇳🇴 `!help no`\n🇪🇸 `!help es`\n🇸🇪 `!help se`\n',
    },
    {
      name: 'help',
      message:
        '\n• To do anything, you will have to register first by using `!register` in {{{RegistrationChannel}}}.\n• To get a list of levels go to {{TeamURI}}/levels.\n• Then you can now submit your clears of level by using `!clear LEV-ELC-ODE` in {{{LevelClearChannel}}}\n• You can also `!login` and submit your clears in the site\n• You can submit a level by using `!add LEV-ELC-ODE level name` in {{{LevelSubmissionChannel}}}\n🇰🇷 `!help kr`\n🇷🇺 `!help ru`\n🌐 `!help lang`',
    },
    {
      name: 'ko.help',
      message:
        '\n• 활동을 하려면 {{{RegistrationChannel}}} 에서 `!register` 를 사용하여 먼저 등록해야합니다.\n• 레벨 목록을 보려면 {{TeamURI}}/levels 로 이동하십시오.\n• 이제 `!clear LEV-ELC-ODE` 를 사용하여 레벨 클리어를 제출할 수 있습니다\n• 당신은 또한 `!login` 을 할 수 있고 사이트에서 당신의 레벨 클리어를 제출할 수 있습니다\n• `!add LEV-ELC-ODE level name` 을 사용하여 레벨을 제출할 수 있습니다.\n\n이것은 기계 번역입니다. 번역이 틀렸다면 알려주십시오. <:SpigRobo:628051703320805377>',
    },
    {
      name: 'no.help',
      message:
        '\n• For å gjøre noe, må du registrere deg først ved bruk av `!register` i {{{RegistrationChannel}}} .\n• for og få en liste av leveler gå til {{TeamURI}}/levels.\n• Etter det kan du sende inn dine clears på leveler ved bruk av `!clear LEV-ELC-ODE` i {{{LevelClearChannel}}}\n• Du kan også bruke `!login` og sende inn dine clears på nettsiden\n• Du kan sende inn dine leveler ved bruk av `!add LEV-ELC-ODE level navn` i {{{LevelSubmissionChannel}}}',
    },
    {
      name: 'fr.help',
      message:
        '\n• Avant tout, il faut faire la commande `!register` dans {{{RegistrationChannel}}}.\n• Pour accéder à la liste des niveaux va sur {{TeamURI}}/levels.\n• Quand tu bats un niveau de la liste, fais `!clear LEV-ELC-ODE` dans {{{LevelClearChannel}}}.\n• Tu peux aussi faire !login et mettre les niveaux que tu as battu directement sur le site.\n• Si tu veux proposer un niveau, fais `!add LEV-ELC-ODE nom` dans {{{LevelSubmissionChannel}}}.',
    },
    {
      name: 'de.help',
      message:
        '\n• Um loszulegen musst du dich zuerst registrieren, indem du `!register` in dem {{{RegistrationChannel}}} benutzt.\n• Eine Liste mit allen Leveln findest du unter {{TeamURI}}/levels.\n• Den Abschluss eines Levels kannst du mit `!clear LEV-ELC-ODE` in dem {{{LevelClearChannel}}} übermitteln.\n• Du kannst auch !login benutzen, um den Abschluss eines Levels stattdessen über die Webseite zu bestätigen.\n• Dein eigenes Level kannst du mit `!add LEV-ELC-ODE level name` in dem {{{LevelSubmissionChannel}}} einreichen.',
    },
    {
      name: 'ru.help',
      message:
        '\n• Для того, чтобы сделать что-нибудь, сначала нужно зарегистрироваться, используя `!register` в {{{RegistrationChannel}}}.\n• Чтобы получить список уровней, перейдите на {{TeamURI}}/levels.\n• Затем вы можете отправить свои пройденные уровни, используя `!clear LEV-ELC-ODE` в {{{LevelClearChannel}}}.\n• Вы также можете `!login` и отправить свои завершения на сайте.\n• Вы можете отправить уровень, используя `!add LEV-ELC-ODE название уровня` в {{{LevelSubmissionChannel}}}.',
    },
    {
      name: 'es.help',
      message:
        '\n• Para comenzar, primero tienes que registrarte usando !register en {{{RegistrationChannel}}}.\n• Para agarrar una lista de niveles visita {{TeamURI}}/levels.\n• Puedes enviar los niveles completados usando !clear LEV-ELC-ODE en {{{LevelClearChannel}}}.\n• También puedes usar !login y enviar los niveles completados del sitio web.\n• Puedes enviar un nuevo nivel usando !add LEV-ELC-ODE en {{{LevelSubmissionChannel}}}.',
    },
    {
      name: 'se.help',
      message:
        '\n• För att göra någonting, måste du registrera dig först genom att använda !register i {{{RegistrationChannel}}}.\n• För att få en lista av banor gå till {{TeamURI}}/levels.\n• Sedan kan du nu skicka in dina clears av banor genom att använda !clear LEV-ELC-ODE i {{{LevelClearChannel}}}.\n• Du kan också använda !login och skicka in dina clears på hemsidan.\n• Du kan skicka in en bana genom att använda !add LEV-ELC-ODE och namnet på banan i {{{LevelSubmissionChannel}}}.',
    },
    {
      name: 'website.loggedin',
      message: 'Your account was logged in on the website.',
    },
    {
      name: 'website.tokenError',
      message: 'Token expired. Need to relogin',
    },
    {
      name: 'website.authError',
      message: 'Authentication error',
    },
    {
      name: 'website.noToken',
      message: 'No token sent',
    },
    {
      name: 'website.noDataSent',
      message: 'No data sent',
    },
    {
      name: 'website.forbidden',
      message: 'forbidden',
    },
    {
      name: 'api.noslug',
      message: 'No url_slug found',
    },
    {
      name: 'api.slugNotFound',
      message: 'url slug provided was not found',
    },
    {
      name: 'feedback.noMessage',
      message: 'No message was sent!',
    },
    {
      name: 'feedback.tooLong',
      message:
        'The supplied message is too long, please keep it lower than 1000 characters!',
    },
    {
      name: 'login.invalidToken',
      message:
        "Your one time password was incorrect. You can run !login in {{TeamName}}'s discord server to get another code",
    },
    {
      name: 'login.expiredOTP',
      message: 'The OTP password given is already expired',
    },
    {
      name: 'login.noOTP',
      message: 'No OTP provided',
    },
    {
      name: 'general.didYouMean',
      message: ' Did you mean:```\n{{{info}}}```',
    },
    {
      name: 'tag.notFound',
      message: "We couldn't find the tag `{{tag}}`",
    },
    {
      name: 'tag.noTag',
      message: "You didn't give a tag",
    },
    {
      name: 'tags.notDefined',
      message: 'There are no tags in the level list',
    },
    {
      name: 'error.hadIdButNotInDb',
      message:
        'We got a row id, but we could not find it in the database',
    },
    {
      name: 'error.noDiscordId',
      message: "We couldn't find your discord id",
    },
    {
      name: 'error.noAdmin',
      message:
        'You are not an admin in this team, you have no permission to do this.',
    },
    {
      name: 'clear.noArgs',
      message: 'There were no arguments in the request',
    },
    {
      name: 'clear.invalidDifficulty',
      message: 'You did not provide a valid difficulty vote',
    },
    {
      name: 'clear.ownLevel',
      message: "You can't submit a clear for your own level",
    },
    {
      name: 'clear.removedClear',
      message: 'You have removed your clear for {{{levelInfo}}}',
    },
    {
      name: 'clear.addClear',
      message: ' ‣You have cleared {{{levelInfo}}} {{{GG}}}',
    },
    {
      name: 'clear.earnedPoints',
      message:
        ' ‣You have earned {{1dp earned_points}} point{{plural earned_points}}',
    },
    {
      name: 'clear.pendingLevel',
      message: ' ‣This level is still pending',
    },
    {
      name: 'clear.alreadyUncleared',
      message: ' ‣You have not submited a clear for {{{levelInfo}}}',
    },
    {
      name: 'clear.alreadyCleared',
      message:
        ' ‣You have already submitted a clear for {{{levelInfo}}}',
    },
    {
      name: 'clear.removeDifficulty',
      message:
        '‣You have removed your difficulty vote for {{{levelInfo}}} {{{bam}}}',
    },
    {
      name: 'clear.addDifficulty',
      message:
        ' ‣You have voted {{1dp difficulty_vote}} as the difficulty for {{{levelInfo}}} {{{bam}}}',
    },
    {
      name: 'clear.alreadyDifficulty',
      message:
        " ‣You haven't submitted a difficulty vote for {{{levelInfo}}} {{{think}}}",
    },
    {
      name: 'clear.alreadyNoDifficulty',
      message:
        ' ‣You have already voted {{difficulty_vote}} for {{{levelInfo}}} {{{think}}}',
    },
    {
      name: 'clear.removeLike',
      message: '‣You have unliked {{{levelInfo}}} {{{bam}}}',
    },
    {
      name: 'clear.addLike',
      message: ' ‣You have liked {{{levelInfo}}} {{{love}}}',
    },
    {
      name: 'clear.alreadyUnliked',
      message:
        ' ‣You have not added a like for {{{levelInfo}}} {{{think}}}',
    },
    {
      name: 'clear.alreadyLiked',
      message: ' ‣You have already liked {{{levelInfo}}} {{{love}}}',
    },
    {
      name: 'clear.singleHave',
      message: '‣You have',
    },
    {
      name: 'clear.manyHave',
      message: '‣You also have',
    },
    {
      name: 'clear.levelPronoun',
      message: 'this level',
    },
    {
      name: 'clear.levelInfo',
      message: "'{{{level.level_name}}}'  by {{{creator}}}",
    },
    {
      name: 'random.embedTitle',
      message:
        '{{BotName}} rolled a d97 and found this level for you',
    },
    {
      name: 'random.embedTitlePlayers',
      message:
        '{{BotName}} rolled a d97 and found this level for {{players}}',
    },
    {
      name: 'random.noMinDifficulty',
      message: "You didn't specify a valid minimum difficulty",
    },
    {
      name: 'random.noDifficulty',
      message: "You didn't specify a valid difficulty",
    },
    {
      name: 'random.noMaxDifficulty',
      message: "You didn't specify a valid maximum difficulty",
    },
    {
      name: 'random.playerNotFound',
      message: '{{player}} is not found in the memory banks',
    },
    {
      name: 'random.outOfLevels',
      message: 'You have ran out of levels in this range ({{range}})',
    },
    {
      name: 'random.outOfLevelsTag',
      message: ' with tag: {{tag}}',
    },
    {
      name: 'random.noPlayersGiven',
      message: 'You did not provide any players',
    },
    {
      name: 'approval.invalidDifficulty',
      message: 'Invalid difficulty format!',
    },
    {
      name: 'approval.judgementBegin',
      message: 'The Judgement  has now begun for this level:',
    },
    {
      name: 'approval.approvalVotes',
      message: '__Current Votes for approving the level:__\n',
    },
    {
      name: 'approval.noVotes',
      message: '> None\n',
    },
    {
      name: 'approval.fixVotes',
      message: '\n__Current Votes for fixing the level:__\n',
    },
    {
      name: 'approval.rejectVotes',
      message: '\n__Current votes for rejecting the level:__\n',
    },
    {
      name: 'approval.changeReason',
      message:
        'You need to give a reason for the change (in quotation marks)!',
    },
    {
      name: 'approval.creatorNotFound',
      message: 'Author was not found in Members List!',
    },
    {
      name: 'approval.levelAlreadyApproved',
      message: 'Level is already approved!',
    },
    {
      name: 'approval.levelNotPending',
      message: 'Level is not pending!',
    },
    {
      name: 'approval.inWrongFixStatus',
      message:
        'Level is not in a valid fix status (this should not happen)!',
    },
    {
      name: 'approval.oldLevelNotFound',
      message:
        'Old level could not be found after reupload (this should not happen)!',
    },
    {
      name: 'approval.tooManyDiscussionChannels',
      message:
        "Your vote is saved but there are 50 discussion channels active right now so we can't make a new one for this level",
    },
    {
      name: 'approval.voteChanged',
      message: 'Your vote was changed in <#{{channel_id}}>!',
    },
    {
      name: 'approval.voteAdded',
      message: 'Your vote was added to <#{{channel_id}}>!',
    },
    {
      name: 'approval.fixPlayerInstructions',
      message:
        "This level is one step from being approved, we'd just like to see some fixes!",
    },
    {
      name: 'approval.comboBreaker',
      message: 'The votes are the same! We need a tiebreaker',
    },
    {
      name: 'approval.numVotesNeeded',
      message:
        'The necessary amount of reject/approval votes has not been reached yet!',
    },
    {
      name: 'approval.fixInstructionsCreator',
      message:
        "If you want to fix these issues use **!reupload** (to get it approved really quickly) or if you don't want to just use **!refusefix** and the mods will decide if it's still acceptable.",
    },
    {
      name: 'approval.channelDeleted',
      message: 'Justice has been met!',
    },
    {
      name: 'approval.rejectAfterRefuse',
      message:
        "We're really sorry, but this level was rejected after you refused to reupload.",
    },
    {
      name: 'approval.approveAfterRefuse',
      message:
        "You didn't reupload your level, but it got approved for difficulty {{1dp difficulty}} anyway. Seems like the issues mentioned weren't a big deal.",
    },
    {
      name: 'approval.rejectAfterFix',
      message:
        "We're really sorry, but it seems there are still some issues after you reuploaded, so it got rejected for now.",
    },
    {
      name: 'approval.approveAfterFix',
      message:
        'You fixed your level up nicely and it got approved for difficulty {{1dp difficulty}}, good job!',
    },
    {
      name: 'approval.rejectAfterReupload',
      message:
        "We're really sorry, but some kind of issues must have come up even though your level was already approved before. The level got rejected for now. Please check out the message below to see what's going on.",
    },
    {
      name: 'approval.approveAfterReupload',
      message:
        'This level was already approved before, and now your reupload is as well.',
    },
    {
      name: 'approval.approveDeletion',
      message:
        'A deletion request was approved and this level was removed from the list.',
    },
    {
      name: 'approval.approveRerate',
      message:
        'A rerate request was approved for this level and the difficulty got updated from {{oldDifficulty}} to {{difficulty}}. Thanks for the report.',
    },
    {
      name: 'approval.approveVerifyClear',
      message: 'Your clear for this level was approved.',
    },
    {
      name: 'approval.rejectDeletion',
      message:
        "We're sorry, but your deletion request was rejected, we don't wanna take people's points away, so we'd like this one to stay in the list.",
    },
    {
      name: 'approval.rejectRerate',
      message:
        'Your rerate request was rejected, the difficulty of the level was NOT updated.',
    },
    {
      name: 'approval.rejectVerifyClear',
      message:
        'Your clear for this level was rejected, you need to provide valid proof that you actually completed this level.',
    },
    {
      name: 'judge.levelRejected',
      message:
        "Sorry, this level didn't quite make the cut for {{TeamName}}, but feel free to use the advice below to improve your level and resubmit it to us at later time",
    },
    {
      name: 'judge.levelRemoved',
      message: 'Level was removed!',
    },
    {
      name: 'judge.approved',
      message:
        'This level was approved for difficulty: {{1dp difficulty}}!',
    },
    {
      name: 'judge.votedApprove',
      message:
        '{{player}} voted for approval with difficulty {{1dp difficulty_vote}}:',
    },
    {
      name: 'judge.votedReject',
      message: '{{player}} voted for rejection:',
    },
    {
      name: 'judge.votedFix',
      message:
        '{{player}} voted for fix with difficulty {{1dp difficulty_vote}}:',
    },
    {
      name: 'fixApprove.notInChannel',
      message: 'This channel is not in the pending reupload category',
    },
    {
      name: 'fixApprove.noReason',
      message:
        'Please provide a short message to the creator explaining your decision!',
    },
    {
      name: 'fixApprove.rejectNotNeedFix',
      message: 'This level is not in the "Need Fix" status',
    },
    {
      name: 'fixApprove.noLabel',
      message:
        'There is no valid label to identify this audit request. This should not happen!',
    },
    {
      name: 'remove.removedBy',
      message: 'This level has been removed by {{name}}',
    },
    {
      name: 'reupload.noOldCode',
      message:
        'You did not provide a code for the old level. The reupload command is `!reupload <old code> <new code> reason for reuploading`',
    },
    {
      name: 'reupload.noNewCode',
      message:
        'You did not provide a code for the new level. The reupload command is `!reupload <old code> <new code> reason for reuploading`',
    },
    {
      name: 'reupload.invalidOldCode',
      message:
        'You did not provide a valid code for the old level. The reupload command is `!reupload <old code> <new code> reason for reuploading`',
    },
    {
      name: 'reupload.invalidNewCode',
      message:
        'You did not provide a valid code for the new level. The reupload command is `!reupload <old code> <new code> reason for reuploading`',
    },
    {
      name: 'reupload.sameCode',
      message: 'The codes given were the same',
    },
    {
      name: 'reupload.giveReason',
      message:
        'Please provide a little message on why you reuploaded at the end of the command (in quotes)',
    },
    {
      name: 'reupload.differentCreator',
      message:
        "The new level uploaded doesn't have the same creator as the old level",
    },
    {
      name: 'reupload.wrongApprovedStatus',
      message:
        'The new level is not approved, pending or in a fix request',
    },
    {
      name: 'reupload.notEnoughPoints',
      message:
        "Creator doesn't have enough points to upload a new level",
    },
    {
      name: 'reupload.haveReuploaded',
      message:
        'Old level has already been reuploaded with Code {{code}}',
    },
    {
      name: 'reupload.noPermission',
      message: "You can't reupload '{{{level_name}}}' by {{creator}}",
    },
    {
      name: 'reupload.tooManyReuploadChannels',
      message:
        "Can't handle the request right now because there are already 50 open reupload requests (this should really never happen)!",
    },
    {
      name: 'reupload.reuploadNotify',
      message:
        'This level has been reuploaded from {{oldCode}} to {{newCode}}.',
    },
    {
      name: 'reupload.success',
      message:
        "You have reuploaded '{{{level.level_name}}}' by {{level.creator}} with code `{{newCode}}`. {{{bam}}}",
    },
    {
      name: 'reupload.renamingInstructions',
      message:
        ' If you want to rename the new level, you can use !rename new-code level name.',
    },
    {
      name: 'reupload.inReuploadQueue',
      message:
        " Your level has also been put in the reupload queue, we'll get back to you shortly.",
    },
    {
      name: 'ammendcode.notify',
      message:
        'The level code has been ammended from `{{oldCode}}` to `{{newCode}}`.',
    },
    {
      name: 'error.specialDiscordString',
      message:
        "We can't process your command because it had special discord strings like <@666085542085001246> in it",
    },
    {
      name: 'initiation.message',
      message: 'We welcome <@{{discord_id}}> to our team!',
    },
    {
      name: 'initiation.userNotInDiscord',
      message: "{{name}} was not found in {{TeamName}}'s discord",
    },
    {
      name: 'general.heyListen',
      message: '**<@{{discord_id}}>, we got some news for you: **',
    },
    {
      name: 'renameMember.noDiscordId',
      message: 'No discord_id provided',
    },
    {
      name: 'renameMember.noMemberFound',
      message: 'No member found with discord_id `{{discord_id}}`',
    },
    {
      name: 'renameMember.noNewName',
      message: "You didn't give a new name",
    },
    {
      name: 'renameMember.alreadyUsed',
      message:
        'There is already another member with name "{{newName}}"',
    },
    {
      name: 'renameMember.already',
      message: 'Member already has the name "{{newName}}"',
    },
    {
      name: 'nickname.already',
      message: 'You already have the name "{{newName}}"',
    },
    {
      name: 'nickname.success',
      message:
        'You have changed your name from "{{oldName}}" to "{{newName}}"',
    },
    {
      name: 'rename.noNewName',
      message: "You didn't give a new level name",
    },
    {
      name: 'rename.alreadyName',
      message: 'Level name is already "{{{level_name}}}"',
    },
    {
      name: 'rename.success',
      message:
        'The level "{{{level_name}}}" ({{code}}) has been renamed to "{{{new_level_name}}}" {{{bam}}}',
    },
    {
      name: 'rename.noPermission',
      message: "You can't rename '{{{level_name}}}' by {{creator}}",
    },
    {
      name: 'pending.pendingTitle',
      message:
        'This level has been reuploaded and is now awaiting approval!',
    },
    {
      name: 'pending.alreadyApprovedBefore',
      message:
        "This level was already approved before so if everything's alright you can approve it (use **!fixapprove**)",
    },
    {
      name: 'pending.refuseTitle',
      message: 'This level has NOT been reuploaded!',
    },
    {
      name: 'pending.reuploadedTitle',
      message:
        'This level has been reuploaded and is now awaiting a decision!',
    },
    {
      name: 'pending.refuseDescription',
      message:
        'Refused by: Please check the fixvotes and decide if this is still acceptable to approve or not (use **!fixapprove** or **!fixreject** with a message).',
    },
    {
      name: 'pending.fixReuploadDescription',
      message:
        'Please check if the mandatory fixes were made and make your decision (use **!fixapprove** or **!fixreject** with a message).',
    },
    {
      name: 'removeLevel.cant',
      message:
        'You can\'t remove "{{{level_name}}}" by {{{creator}}}',
    },
    {
      name: 'removeLevel.success',
      message:
        'You have removed "{{{level_name}}}" by {{{creator}}} {{{buzzyS}}}',
    },
    {
      name: 'removeLevel.noReason',
      message:
        "You did not provide a reason to remove this level. If you want to reupload, we recommend using the `!reupload` command. If you want to remove it now and reupload it later make sure __you don't lose the old code__",
    },
    {
      name: 'removeLevel.alreadyRemoved',
      message:
        '"{{{level_name}}}" by {{{creator}}} has already been removed',
    },
    {
      name: 'undoRemoveLevel.cant',
      message:
        'You can\'t undo the removal of "{{{level_name}}}" by {{{creator}}}',
    },
    {
      name: 'undoRemoveLevel.noReason',
      message:
        "Just leave a note why you're undoing the level remove",
    },
    {
      name: 'undoRemoveLevel.alreadyNotRemoved',
      message: '"{{{level_name}}}" by {{{creator}}} is not removed',
    },
    {
      name: 'undoRemoveLevel.title',
      message: 'Reverting level to last status',
    },
    {
      name: 'undoRemoveLevel.success',
      message:
        'You have undid the status change of "{{{level_name}}}" by {{{creator}}} {{{bam}}}',
    },
    {
      name: 'error.reasonTooLong',
      message:
        "Your reason/comment can't be longer than {{maxLength}}",
    },
    {
      name: 'error.notApproved',
      message: 'Level is not approved',
    },
    {
      name: 'error.userBanned',
      message: 'You have been barred from using this service',
    },
    {
      name: 'error.notRegistered',
      message:
        'You are not yet registered. You will have to register first by using `!register` in {{{RegistrationChannel}}}\n🇰🇷 `!help kr`\n🇷🇺 `!help ru`\n🌐 `!help lang`',
    },
    {
      name: 'error.emptyLevelList',
      message: 'No levels found buzzyS',
    },
    {
      name: 'error.afterUserDiscord',
      message: ' {{{think}}}',
    },
    {
      name: 'error.afterUserWeb',
      message: '',
    },
    {
      name: 'error.levelNotFound',
      message:
        "The code `{{code}}` was not found in {{TeamName}}'s list.",
    },
    {
      name: 'error.raceNotFound',
      message: 'The race could not be found.',
    },
    {
      name: 'error.raceHasStarted',
      message: 'This race has already started.',
    },
    {
      name: 'error.levelIsFixing',
      message:
        "The level '{{{level.level_name}}}' is under 'Request to fix' status",
    },
    {
      name: 'error.levelIsRemoved',
      message:
        "The level '{{{level.level_name}}}'  has been removed from {{TeamName}}'s list",
    },
    {
      name: 'error.unknownError',
      message: 'something went wrong buzzyS',
    },
    {
      name: 'error.noCode',
      message: 'You did not give a level code',
    },
    {
      name: 'error.invalidCode',
      message: 'You did not provide a valid level code',
    },
    {
      name: 'error.invalidMakerCode',
      message: '`{{code}}` is not a valid maker id',
    },
    {
      name: 'error.wrongTokens',
      message:
        'There was something wrong with the secure tokens. Please try again',
    },
    {
      name: 'error.noSearch',
      message: "You didn't provide any search terms",
    },
    {
      name: 'search.foundNum',
      message:
        ', we found {{levelsFound}} level{{plural levelsFound}}.',
    },
    {
      name: 'search.showingOnly',
      message:
        ' Showing only {{num_shown}} level{{plural num_shown}}',
    },
    {
      name: 'points.points',
      message:
        'You have {{1dp player.earned_points.clearPoints}} clear point{{plural player.earned_points.clearPoints}}. You have submitted {{player.earned_points.levelsMade}} level{{plural player.earned_points.levelsMade}} {{#if player.earned_points.freeSubmissions}} ({{player.earned_points.freeSubmissions}} free submission{{plural player.earned_points.freeSubmissions}}){{/if}}.',
    },
    {
      name: 'points.canUpload',
      message:
        'You have enough points to upload a level {{{PigChamp}}}',
    },
    {
      name: 'points.cantUpload',
      message:
        'You need {{1dp points_needed}} more point{{plural points_needed}} to upload a new level {{{buzzyS}}}. Check how the points are mapped on {{TeamURI}}',
    },
    {
      name: 'points.rank',
      message:
        ' You have earned the rank **{{player.rank.rank}}** {{{player.rank.pips}}}',
    },
    {
      name: 'difficulty.updated',
      message:
        'Difficulty rating updated from {{1dp old_difficulty}} - {{1dp new_difficulty}}',
    },
    {
      name: 'difficulty.success',
      message: 'Difficulty was successfully changed!',
    },
    {
      name: 'difficulty.noReason',
      message:
        'You need to give a reason for the change (in quotation marks)!',
    },
    {
      name: 'difficulty.noDifficulty',
      message: 'You need to give a difficulty',
    },
    {
      name: 'add.noName',
      message: "You didn't give a level name",
    },
    {
      name: 'add.levelExisting',
      message:
        "`{{level.code}}` has already been submitted as '{{{level.level_name}}}' by {{level.creator}}",
    },
    {
      name: 'add.success',
      message:
        'The level {{{level_name}}} ({{code}}) has been added {{{love}}}',
    },
    {
      name: 'add.notAllowed',
      message:
        "Members aren't allowed to submit their own levels on this server.",
    },
    {
      name: 'tags.noTags',
      message: "You didn't give any tags",
    },
    {
      name: 'tags.cantAdd',
      message: "You can't add the tag '{{tag}}'",
    },
    {
      name: 'tags.noNew',
      message:
        'No new tags added for "{{{level_name}}}" by "{{creator}}"\n',
    },
    {
      name: 'tags.noRemoved',
      message:
        'No tags have been removed for "{{{level_name}}}" by "{{creator}}"\n',
    },
    {
      name: 'tags.haveNew',
      message:
        'Tags added for "{{{level_name}}}" by "{{creator}}" {{{bam}}}\n',
    },
    {
      name: 'tags.haveRemoved',
      message:
        'Tags removed for "{{level_name}}" by "{{creator}} {{{bam}}}"\n',
    },
    {
      name: 'tags.noPermission',
      message:
        'You can\'t remove tags from "{{{level_name}}}" by "{{creator}}"',
    },
    {
      name: 'tags.cantRemove',
      message: 'You can\'t remove the tag "{{tag}}"',
    },
    {
      name: 'tags.currentTags',
      message: 'Current tags:```\n{{tags_str}}```',
    },
    {
      name: 'tags.duplicateTags',
      message: 'There were duplicate tags for {{tag}}',
    },
    {
      name: 'tags.whitelistedOnly',
      message: '`{{tag}}` is not a tag that has been whitelisted.',
    },
    {
      name: 'addVids.noPermission',
      message:
        'You can\'t remove videos from "{{{level_name}}}" by "{{creator}}"',
    },
    {
      name: 'addVids.haveNew',
      message:
        'Clear videos added for "{{{level_name}}}" by "{{creator}}" {{{bam}}}\n',
    },
    {
      name: 'addVids.currentVideos',
      message: 'Current videos:```\n{{videos_str}}```',
    },
    {
      name: 'addVids.haveRemoved',
      message:
        'Clear videos removed for "{{{level_name}}}" by "{{creator}}" {{{bam}}}\n',
    },
    {
      name: 'addVids.noNew',
      message:
        'No new videos added for "{{{level_name}}}" by "{{creator}}"\n',
    },
    {
      name: 'addVids.noRemoved',
      message:
        'No videos have been removed for "{{{level_name}}}" by "{{creator}}"\n',
    },
    {
      name: 'register.already',
      message:
        "You're already registered as **{{name}}**. If you want to change your name you can use `!nick new name`",
    },
    {
      name: 'register.nameTaken',
      message:
        "'{{name}}' has already been registered by someone else. Please use another nickname",
    },
    {
      name: 'register.success',
      message:
        "You are now registered as '{{name}}'.  {{{bam}}}\n ‣ You can find the levels in {{TeamURI}}/levels\n ‣ You can submit your clears with `!clear LEV-ELC-ODE` in {{{LevelClearChannel}}}\n ‣ You can also submit your clears in the website by logging in with `!login`\n ‣ English - `!help`\n 🇰🇷 `!help kr`\n 🇷🇺 `!help ru`\n 🌐 `!help lang`",
    },
    {
      name: 'register.noPointsNeeded',
      message:
        '\n‣ To submit a level to {{TeamName}}, you can use `!add LEV-ELC-ODE level name` in {{{LevelSubmissionChannel}}}',
    },
    {
      name: 'register.pointsNeeded',
      message:
        '\n‣ To submit a level to {{TeamName}}, you need {{1dp minPoints}} clear points',
    },
    {
      name: 'initmembers.success',
      message:
        '{{registeredCount}} members have been registered with their discord name, {{alreadyRegisteredCount}} have been skipped because they were already registered.',
    },
    {
      name: 'login.reply',
      message:
        " You have requested a login token for the website. click the link below to login.:\n <{{loginLink}}> {{{bam}}}\n If you're on mobile, copy the link and paste it into your preferred browser app. If you open this link in an in-app browser, your login might not be saved properly. {{{buzzyS}}}\n This token will only be valid for 30 minutes",
    },
    {
      name: 'login.failedReply',
      message:
        " It seems the bot couldn't send you a direct message with the login link, are you maybe blocking direct messages from non-friends? You can try this command again if you change your discord settings.",
    },
    {
      name: 'makerid.noCode',
      message: "You didn't provide any maker code",
    },
    {
      name: 'makerid.noName',
      message: "You didn't provide your maker name",
    },
    {
      name: 'makerid.success',
      message:
        'You have updated your maker-id to {{code}} and maker-name to {{name}} {{{bam}}}',
    },
    {
      name: 'makerid.existing',
      message: "`{{code}} is already being used by '{{name}}' ",
    },
    {
      name: 'makerid.already',
      message:
        '`{{code}}` is already what you have set for your maker-id ',
    },
    {
      name: 'setworld.invalidWorldCount',
      message: "You didn't provide a valid world count",
    },
    {
      name: 'setworld.invalidLevelCount',
      message: "You didn't provide a valid level count",
    },
    {
      name: 'setworld.noWorldName',
      message: "You didn't provide a world name",
    },
    {
      name: 'setworld.success',
      message:
        'Your world was successfully set and should now show up on the worlds page',
    },
    {
      name: 'setworld.noMakerId',
      message:
        'You need to set your Maker ID and Name first with !makerid XXX-XXX-XXX Name',
    },
    {
      name: 'pendingStatus.approves',
      message: '{{approves}} approval{{plural approves}}',
    },
    {
      name: 'pendingStatus.rejects',
      message: '{{rejects}} rejects{{plural rejects}}',
    },
    {
      name: 'pendingStatus.wantFixes',
      message: '{{want_fixes}} fix request{{plural want_fixes}}',
    },
    {
      name: 'pendingStatus.noVotes',
      message: 'No votes has been cast yet',
    },
    {
      name: 'pendingStatus.none',
      message: 'You have no levels pending',
    },
    {
      name: 'unsetworld.success',
      message: 'Your world was successfully removed',
    },
    {
      name: 'atme.already',
      message: 'You already have chosen to be atted',
    },
    {
      name: 'atme.willBe',
      message: 'You will be atted by {{BotName}} {{{bam}}}',
    },
    {
      name: 'atme.alreadyNot',
      message: 'You already have chosen not to be atted',
    },
    {
      name: 'atme.willBeNot',
      message: 'You will not be atted by {{BotName}} {{{bam}}}',
    },
    {
      name: 'ammendCode.success',
      message:
        'The level "{{{level.level_name}}}", by {{level.creator}}, has changed code from `{{oldCode}}` to `{{newCode}}`',
    },
    {
      name: 'help.basic',
      message:
        'You can find all the commands at <https://makerteams.net/features>',
    },
    {
      name: 'mock.userSuccess',
      message:
        "You're now {{name}}. Identity theft is not a joke, Jim!",
    },
    {
      name: 'mock.noTargetGiven',
      message: "You didn't give any names",
    },
    {
      name: 'mock.already',
      message: "You're already them",
    },
    {
      name: 'mock.notFound',
      message: 'No user found',
    },
    {
      name: 'resetStatus.alreadyPending',
      message:
        "This level is already pending. This command only resets a level's status to PENDING",
    },
    {
      name: 'resetStatus.successful',
      message:
        '"{{{level_name}}}" by {{{creator}}} has been reset to PENDING',
    },
    {
      name: 'vote.noVoteSubmitted',
      message:
        'You have not submitted any votes for "{{{level_name}}}" by {{{creator}}}',
    },
    {
      name: 'vote.voteRemoved',
      message:
        'You have removed your vote for "{{{level_name}}}" by {{{creator}}}',
    },
    {
      name: 'clearDifficulty.success',
      message:
        'You have cleared the difficulty votes for "{{{level_name}}}" by {{{creator}}}',
    },
    {
      name: 'race.newRaceAdded',
      message:
        'A new {{#if unofficial}}unofficial{{else}}official{{/if}} race has been added:',
    },
    {
      name: 'race.raceEdited',
      message: 'The following race has been updated just now: ',
    },
    {
      name: 'race.newRaceEntrant',
      message:
        '<@{{{discord_id}}}> has entered the race "{{{name}}}".',
    },
    {
      name: 'race.entrantLeftRace',
      message: '<@{{{discord_id}}}> has left the race "{{{name}}}".',
    },
    {
      name: 'race.entrantFinishedRace',
      message:
        '<@{{{discord_id}}}> just finished the race "{{{name}}}" (Rank: #{{{rank}}}). Please post some verification of your clear.',
    },
    {
      name: 'race.raceStarted',
      message:
        '{{{mentions}}}: The race "{{{name}}}" has just started, you will be racing each other on the following level. Good luck and have fun!',
    },
    {
      name: 'race.noParticipants',
      message:
        'The race "{{{name}}}" did not have any participants and was removed!',
    },
    {
      name: 'race.raceFailed',
      message:
        '{{{mentions}}}: The race "{{{name}}}" could not be started, no level was found that fits all the criteria. The race has been postponed by 5 minutes, please change the criterias!',
    },
    {
      name: 'race.raceEnded',
      message:
        '{{{mentions}}}: The race "{{{name}}}" has just finished, congratulations to the winners:',
    },
    {
      name: 'race.notRaceCreator',
      message: 'You are not allowed to edit this race!',
    },
    {
      name: 'race.needMorePoints',
      message:
        'You need at least {{{minimumPoints}}} clear points to be able to create unofficial races!',
    },
    {
      name: 'race.tooManyPoints',
      message:
        'You are not allowed to join this race, this race needs you to have a certain amount of points!',
    },
    {
      name: 'modaddmember.missingParam',
      message: 'You have to supply a member name!',
    },
    {
      name: 'modaddmember.success',
      message: 'The member "{{{name}}}" has been successfully added.',
    },
    {
      name: 'modaddlevel.memberNotFound',
      message:
        'No member with the name "{{{name}}}" was found in the members list.',
    },
    {
      name: 'modsetdiscordid.missingName',
      message: 'You have to supply a member name!',
    },
    {
      name: 'modsetdiscordid.missingId',
      message: 'You have to supply a discord id',
    },
    {
      name: 'modsetdiscordid.memberNotFound',
      message:
        'No member with the name "{{{name}}}" was found in the members list.',
    },
    {
      name: 'modsetdiscordid.duplicateId',
      message: 'This discord id is already in use by another member.',
    },
    {
      name: 'modsetdiscordid.success',
      message:
        'The discord id was sucessfully set on the member with the name "{{{name}}}".',
    },
    {
      name: 'requestRerate.noReason',
      message:
        'You did not provide a reason to rerate this level, please provide a reason and the difficulty you think would be correct for this level.',
    },
    {
      name: 'requestRerate.notApproved',
      message:
        'The level you entered is not approved, difficulty can only be changed for approved levels.',
    },
  ];

  return knex.schema
    .createTable('commands', function (t) {
      t.increments('id').unsigned().primary();
      t.dateTime('created_at')
        .notNull()
        .defaultTo(knex.raw('CURRENT_TIMESTAMP'));
      t.dateTime('updated_at').nullable();
      t.dateTime('deleted_at').nullable();

      t.string('name').notNull();
      t.string('format').notNull();
      t.string('aliases').nullable();
      t.string('category').nullable();
    })
    .createTable('default_strings', function (t) {
      t.increments('id').unsigned().primary();
      t.dateTime('created_at')
        .notNull()
        .defaultTo(knex.raw('CURRENT_TIMESTAMP'));
      t.dateTime('updated_at').nullable();
      t.dateTime('deleted_at').nullable();

      t.string('name').notNull();
      t.text('message').notNull();
    })
    .createTable('command_permissions', function (t) {
      t.increments('id').unsigned().primary();
      t.dateTime('created_at')
        .notNull()
        .defaultTo(knex.raw('CURRENT_TIMESTAMP'));
      t.dateTime('updated_at').nullable();
      t.dateTime('deleted_at').nullable();

      t.integer('guild_id')
        .unsigned()
        .references('teams.id')
        .notNull();

      t.integer('command_id')
        .unsigned()
        .references('commands.id')
        .notNull();

      t.string('allowed_roles').nullable();
      t.string('allowed_channels').nullable();

      t.index(['guild_id']);
    })
    .then(function () {
      // Inserts seed entries
      return knex('default_strings').insert(insertJson);
    });
};

exports.down = function (knex) {
  return knex.schema
    .dropTable('command_permissions')
    .dropTable('default_strings')
    .dropTable('commands');
};
