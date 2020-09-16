exports.up = function (knex) {
  const japaneseInserts = [
    {
      name: 'help',
      language: 'ja',
      message:
        '\n• はじめに、 {{{RegistrationChannel}}} にて `!register` コマンドを入力してサイトへの登録をしてください。\n• コースの一覧は右のリンクより確認できます {{TeamURI}}/levels.\n• ログイン後、クリアしたコースを {{{LevelClearChannel}}} にて `!clear LEV-ELC-ODE` といった形式で入力する事でクリア報告が可能です。\n• もしくは、 `!login` と送信する事でサイトからもクリア報告ができます。\n• 十分なコースクリアによるポイント取得で自分のコースを提出できます。 {{{LevelSubmissionChannel}}} にて `!add コースID コース名` という形式で提出してください。 \n• 全コマンドの確認は `!help commands` と入力してください。\n🌐 `!help:lang`\n🌐 `!command:lang`',
    },
    {
      name: 'help.commands',
      language: 'ja',
      message:
        '下記が **このチャンネルで** 使用可能なコマンド一覧です。 (特に重要な物は下線がついています。). 特定のコマンドに関する詳細は `!help:ja コマンド名`. と入力してください。',
    },
    {
      name: 'website.loggedin',
      language: 'ja',
      message: 'サイトへのログインが完了しました。',
    },
    {
      name: 'website.tokenError',
      language: 'ja',
      message:
        'トークンが期限切れですので、再ログインをお願いします。',
    },
    {
      name: 'website.authError',
      language: 'ja',
      message: '認証エラー',
    },
    {
      name: 'website.noToken',
      language: 'ja',
      message: 'トークンが送信されませんでした。',
    },
    {
      name: 'website.noDataSent',
      language: 'ja',
      message: 'データが送信されませんでした。',
    },
    {
      name: 'website.forbidden',
      language: 'ja',
      message: '禁止事項です。',
    },
    {
      name: 'api.noslug',
      language: 'ja',
      message:
        '\n• はじめに、 {{{RegistrationChannel}}} にて `!register` コマンドを入力してサイトへの登録をしてください。\n• コースの一覧は右のリンクより確認できます {{TeamURI}}/levels.\n• ログイン後、クリアしたコースを {{{LevelClearChannel}}} にて `!clear LEV-ELC-ODE` といった形式で入力する事でクリア報告が可能です。\n• もしくは、 `!login` と送信する事でサイトからもクリア報告ができます。\n• 十分なコースクリアによるポイント取得で自分のコースを提出できます。 {{{LevelSubmissionChannel}}} にて `!add LEV-ELC-ODE コース名` という形式で提出してください。 \n• 全コマンドの確認は `!help commands` と入力してください。\n🌐 `!help:lang`\n🌐 `!command:lang`',
    },
    {
      name: 'api.slugNotFound',
      language: 'ja',
      message: 'URLが間違っている可能性があります。',
    },
    {
      name: 'feedback.noMessage',
      language: 'ja',
      message: 'メッセージが送信されませんでした。',
    },
    {
      name: 'feedback.tooLong',
      language: 'ja',
      message: '文章が長すぎます。1000文字以内に収めてください。',
    },
    {
      name: 'login.invalidToken',
      language: 'ja',
      message:
        'ワンタイムパスワードが間違っています。 {{TeamName}}のDiscordサーバーで!loginと入力し、別のパスワードを取得するようお願いします。',
    },
    {
      name: 'login.expiredOTP',
      language: 'ja',
      message: 'このワンタイムパスワードは期限切れです。',
    },
    {
      name: 'login.noOTP',
      language: 'ja',
      message: 'ワンタイムパスワードを入力してください。',
    },
    {
      name: 'general.didYouMean',
      language: 'ja',
      message: 'もしかして:```\n{{{info}}}```',
    },
    {
      name: 'tag.notFound',
      language: 'ja',
      message: 'そのタグは存在しません。 `{{tag}}`',
    },
    {
      name: 'tag.noTag',
      language: 'ja',
      message: 'タグが提示されていません。',
    },
    {
      name: 'tags.notDefined',
      language: 'ja',
      message: 'コースリストにタグがありません。',
    },
    {
      name: 'error.hadIdButNotInDb',
      language: 'ja',
      message: 'データベースからIDを見つけられませんでした。',
    },
    {
      name: 'error.noDiscordId',
      language: 'ja',
      message: 'Discord IDが見つかりませんでした。',
    },
    {
      name: 'error.noAdmin',
      language: 'ja',
      message: '権限がありません。',
    },
    {
      name: 'clear.noArgs',
      language: 'ja',
      message: 'リクエストに関する評論がありません。',
    },
    {
      name: 'clear.invalidDifficulty',
      language: 'ja',
      message: '正しい難易度評価の数値ではありません。',
    },
    {
      name: 'clear.ownLevel',
      language: 'ja',
      message: '自分自身のコースのクリア報告はできません。',
    },
    {
      name: 'clear.removedClear',
      language: 'ja',
      message: 'コースのクリア報告を削除しました。 {{{levelInfo}}}',
    },
    {
      name: 'clear.addClear',
      language: 'ja',
      message:
        '‣コースのクリア報告が完了しました。 {{{levelInfo}}} {{{GG}}}',
    },
    {
      name: 'clear.earnedPoints',
      language: 'ja',
      message:
        '‣獲得したポイントです。 {{1dp earned_points}} point{{plural earned_points}}',
    },
    {
      name: 'clear.pendingLevel',
      language: 'ja',
      message: '‣このコースは未査定です。',
    },
    {
      name: 'clear.alreadyUncleared',
      language: 'ja',
      message:
        '‣このコースのクリア報告をしていません。 {{{levelInfo}}}',
    },
    {
      name: 'clear.alreadyCleared',
      language: 'ja',
      message:
        '‣このコースのクリア報告は既に完了しています。 {{{levelInfo}}}',
    },
    {
      name: 'clear.removeDifficulty',
      language: 'ja',
      message:
        '‣このコースの難易度評価を削除しました。 {{{levelInfo}}} {{{bam}}}',
    },
    {
      name: 'clear.addDifficulty',
      language: 'ja',
      message:
        '‣難易度 {{1dp difficulty_vote}} としてこちらのコースを評価しました。 {{{levelInfo}}} {{{bam}}}',
    },
    {
      name: 'clear.alreadyDifficulty',
      language: 'ja',
      message:
        '‣このコースの難易度評価は送信されていません。 {{{levelInfo}}} {{{think}}}',
    },
    {
      name: 'clear.alreadyNoDifficulty',
      language: 'ja',
      message:
        '‣このコースの難易度評価は既に送信されています。 {{difficulty_vote}} for {{{levelInfo}}} {{{think}}}',
    },
    {
      name: 'clear.removeLike',
      language: 'ja',
      message:
        '‣コースのいいねを取り消しました。 {{{levelInfo}}} {{{bam}}}',
    },
    {
      name: 'clear.addLike',
      language: 'ja',
      message:
        '‣コースにいいねをつけました。 {{{levelInfo}}} {{{love}}}',
    },
    {
      name: 'clear.alreadyUnliked',
      language: 'ja',
      message:
        '‣コースにいいねをつけていません。 {{{levelInfo}}} {{{think}}}',
    },
    {
      name: 'clear.alreadyLiked',
      language: 'ja',
      message:
        '‣このコースには既にいいねをつけています。 {{{levelInfo}}} {{{love}}}',
    },
    {
      name: 'clear.singleHave',
      language: 'ja',
      message: '‣あなたは',
    },
    {
      name: 'clear.manyHave',
      language: 'ja',
      message: '‣また、',
    },
    {
      name: 'clear.levelPronoun',
      language: 'ja',
      message: 'このコース',
    },
    {
      name: 'clear.levelInfo',
      language: 'ja',
      message: "{{{level.level_name}}}' by {{{creator}}}",
    },
    {
      name: 'random.embedTitle',
      language: 'ja',
      message:
        '{{BotName}} がランダムにこちらのコースを選出しました。',
    },
    {
      name: 'random.embedTitlePlayers',
      language: 'ja',
      message:
        '{{BotName}} が {{players}} 用にこちらのコースを選出しました。',
    },
    {
      name: 'random.noMinDifficulty',
      language: 'ja',
      message: '正しい最小難易度数値を入力してください。',
    },
    {
      name: 'random.noDifficulty',
      language: 'ja',
      message: '正しい難易度数値を入力してください。',
    },
    {
      name: 'random.noMaxDifficulty',
      language: 'ja',
      message: '正しい最大難易度数値を入力してください。',
    },
    {
      name: 'random.playerNotFound',
      language: 'ja',
      message: '{{player}} さんは見つかりませんでした。',
    },
    {
      name: 'random.outOfLevels',
      language: 'ja',
      message:
        'この難易度のコースは既に全てクリア済みです。 ({{range}})',
    },
    {
      name: 'random.outOfLevelsTag',
      language: 'ja',
      message: 'こちらのタグ: {{tag}}',
    },
    {
      name: 'random.noPlayersGiven',
      language: 'ja',
      message: 'プレイヤー名を提示してください。',
    },
    {
      name: 'approval.invalidDifficulty',
      language: 'ja',
      message: '難易度のフォーマットが不正確です。',
    },
    {
      name: 'approval.judgementBegin',
      language: 'ja',
      message: 'このコースの評価が開始されました。',
    },
    {
      name: 'approval.approvalVotes',
      language: 'ja',
      message: '__現在の「承認」票数:__\n',
    },
    {
      name: 'approval.noVotes',
      language: 'ja',
      message: '> 無し\n',
    },
    {
      name: 'approval.fixVotes',
      language: 'ja',
      message: '\n__現在の「要修正」票数:__\n',
    },
    {
      name: 'approval.rejectVotes',
      language: 'ja',
      message: '\n__現在の「却下」票数:__\n',
    },
    {
      name: 'approval.changeReason',
      language: 'ja',
      message:
        'コースを変更した理由を引用符(")を使用して提示してください。',
    },
    {
      name: 'approval.creatorNotFound',
      language: 'ja',
      message: 'メンバーリストに製作者の名前がありません。',
    },
    {
      name: 'approval.levelAlreadyApproved',
      language: 'ja',
      message: 'このコースは既に承認されています。',
    },
    {
      name: 'approval.levelNotPending',
      language: 'ja',
      message: 'このコースは未査定ではありません。',
    },
    {
      name: 'approval.inWrongFixStatus',
      language: 'ja',
      message:
        'このコースは正しい修正状態ではありません。(本来発生するような状況ではありません)',
    },
    {
      name: 'approval.oldLevelNotFound',
      language: 'ja',
      message:
        '再投稿前のコースが見つかりませんでした。 (本来発生するような状況ではありません)',
    },
    {
      name: 'approval.tooManyDiscussionChannels',
      language: 'ja',
      message:
        '投票は保存されましたが、多数のチャンネルが動作中の為コースへの新しい票を入れることができません。',
    },
    {
      name: 'approval.voteChanged',
      language: 'ja',
      message: '<#{{channel_id}}> にて投票が変更されました。',
    },
    {
      name: 'approval.voteAdded',
      language: 'ja',
      message: '<#{{channel_id}}> にて投票が入りました。',
    },
    {
      name: 'approval.fixPlayerInstructions',
      language: 'ja',
      message:
        'このコースの承認を行うには修正が必要です、下記のフィードバックを確認してください。',
    },
    {
      name: 'approval.comboBreaker',
      language: 'ja',
      message: '票数が同じの為、タイブレークが必要になりました。',
    },
    {
      name: 'approval.numVotesNeeded',
      language: 'ja',
      message: '承認/却下の票数が十分ではありません。',
    },
    {
      name: 'approval.fixInstructionsCreator',
      language: 'ja',
      message:
        'コースを修正した場合、次のコマンドを使用してください **!reupload** (再査定が迅速に行われやすくなります) 修正したくない場合、次のコマンドを使用してください **!refusefix** モデレーターが承認可能かどうかを判断します。',
    },
    {
      name: 'approval.channelDeleted',
      language: 'ja',
      message: '正義が遂行されました!',
    },
    {
      name: 'approval.rejectAfterRefuse',
      language: 'ja',
      message:
        '申し訳ありませんが、問題点の未修正は良好ではないと判断された為却下されました。',
    },
    {
      name: 'approval.approveAfterRefuse',
      language: 'ja',
      message:
        '要修正だった部分は大した問題では無いと判断された為、承認されました。難易度評価は次の通りです。 {{1dp difficulty}}',
    },
    {
      name: 'approval.rejectAfterFix',
      language: 'ja',
      message:
        '申し訳ありませんが、修正後も問題が発見された為コースが却下されました。',
    },
    {
      name: 'approval.approveAfterFix',
      language: 'ja',
      message:
        '修正のご協力ありがとうございます、コースの承認が完了しました。難易度評価は次の通りです。 {{1dp difficulty}}',
    },
    {
      name: 'approval.rejectAfterReupload',
      language: 'ja',
      message:
        '大変申し訳ありません、承認済のコースですが問題点が浮上した為現時点で却下とさせていただきます。下記メッセージをご確認ください。',
    },
    {
      name: 'approval.approveAfterReupload',
      language: 'ja',
      message:
        'このコースは既に承認済です。再投稿後も承認済の状態です。',
    },
    {
      name: 'approval.approveDeletion',
      language: 'ja',
      message:
        '削除の申請が承認された為、リストから削除を行いました。',
    },
    {
      name: 'approval.approveRerate',
      language: 'ja',
      message:
        '難易度再評価の申請が承認された為、コースの難易度が {{oldDifficulty}} から {{difficulty}} に変更されました。',
    },
    {
      name: 'approval.approveVerifyClear',
      language: 'ja',
      message: 'このコースのクリア報告が承認されました。',
    },
    {
      name: 'approval.rejectDeletion',
      language: 'ja',
      message:
        '申し訳ありませんが、コースを既にクリアされた方からポイントを消去するのは良い判断では無い為削除の申請は却下されました。',
    },
    {
      name: 'approval.rejectRerate',
      language: 'ja',
      message:
        '難易度再評価の申請が却下されました。難易度の変更はありません。',
    },
    {
      name: 'approval.rejectVerifyClear',
      language: 'ja',
      message:
        'クリア報告が却下されました。動画等の証拠を提示してください。',
    },
    {
      name: 'judge.levelRejected',
      language: 'ja',
      message:
        'このコースは {{TeamName}} に相応しくないと判断されました。 下記のメッセージもしくはアドバイスを参考に、再投稿をお試しください。',
    },
    {
      name: 'judge.levelRemoved',
      language: 'ja',
      message: 'コースの削除が完了しました。',
    },
    {
      name: 'judge.approved',
      language: 'ja',
      message:
        'このコースは承認されました、難易度評価は次の通りです: {{1dp difficulty}}!',
    },
    {
      name: 'judge.votedApprove',
      language: 'ja',
      message:
        '{{player}} がコースを次の難易度で承認票に入れました {{1dp difficulty_vote}}:',
    },
    {
      name: 'judge.votedReject',
      language: 'ja',
      message: '{{player}} がコースを却下票に入れました:',
    },
    {
      name: 'judge.votedFix',
      language: 'ja',
      message:
        '{{player}} がコースを次の難易度で要修正票に入れました {{1dp difficulty_vote}}:',
    },
    {
      name: 'fixApprove.notInChannel',
      language: 'ja',
      message:
        'このチャンネルは「修正、再投稿待ち」のカテゴリーに属していません。',
    },
    {
      name: 'fixApprove.noReason',
      language: 'ja',
      message:
        '決定した理由を製作者に伝えるために短い文を入力してください。',
    },
    {
      name: 'fixApprove.rejectNotNeedFix',
      language: 'ja',
      message: 'このコースは \\"Need Fix\\" 状態ではありません。',
    },
    {
      name: 'fixApprove.noLabel',
      language: 'ja',
      message:
        '査定するためのラベルが存在しません。(本来発生するような状況ではありません)',
    },
    {
      name: 'remove.removedBy',
      language: 'ja',
      message: 'このコースは {{name}} により削除されました。',
    },
    {
      name: 'reupload.noOldCode',
      language: 'ja',
      message:
        '削除したコースのIDが提示されていません。再投稿時は次のような形式で入力してください。 `!reupload 削除済ID 新ID 再投稿理由`',
    },
    {
      name: 'reupload.noNewCode',
      language: 'ja',
      message:
        '再投稿したコースのIDが提示されていません。再投稿時は次のような形式で入力してください。 `!reupload 削除済ID 新ID 再投稿理由`',
    },
    {
      name: 'reupload.invalidOldCode',
      language: 'ja',
      message:
        '削除したコースのIDが不正確です。再投稿時は次のような形式で入力してください。 `!reupload 削除済ID 新ID 再投稿理由`',
    },
    {
      name: 'reupload.invalidNewCode',
      language: 'ja',
      message:
        '再投稿したコースのIDが不正確です。再投稿時は次のような形式で入力してください。 `!reupload 削除済ID 新ID 再投稿理由`',
    },
    {
      name: 'reupload.sameCode',
      language: 'ja',
      message: 'コースIDが両方同じです。',
    },
    {
      name: 'reupload.giveReason',
      language: 'ja',
      message:
        'コマンドの最後に、再投稿した理由もしくは修正した部分を入力してください。',
    },
    {
      name: 'reupload.differentCreator',
      language: 'ja',
      message:
        '再投稿したコースと削除したコースの制作者が一致しません。',
    },
    {
      name: 'reupload.wrongApprovedStatus',
      language: 'ja',
      message: '再投稿したコースはまだ未査定状態です。',
    },
    {
      name: 'reupload.notEnoughPoints',
      language: 'ja',
      message: '新しくコースを投稿する分のポイントが不足しています。',
    },
    {
      name: 'reupload.haveReuploaded',
      language: 'ja',
      message:
        '削除済のコースは既に次のIDで再投稿されています {{code}}',
    },
    {
      name: 'reupload.noPermission',
      language: 'ja',
      message:
        "{{creator}} の '{{{level_name}}}' を再投稿する権限がありません。",
    },
    {
      name: 'reupload.tooManyReuploadChannels',
      language: 'ja',
      message:
        'リクエストが受理されませんでした(このメッセージが表示された場合、異常事態と捉えてください)',
    },
    {
      name: 'reupload.reuploadNotify',
      language: 'ja',
      message:
        'このコースは再投稿され、IDが {{oldCode}} から {{newCode}} へ変更されました。',
    },
    {
      name: 'reupload.success',
      language: 'ja',
      message:
        "{{level.creator}} の '{{{level.level_name}}}' は、次のIDで再投稿されました `{{newCode}}`. {{{bam}}}",
    },
    {
      name: 'reupload.renamingInstructions',
      language: 'ja',
      message:
        'コース名の変更を行う場合、次のコマンド形式で入力してください !rename 新ID コース名',
    },
    {
      name: 'reupload.inReuploadQueue',
      language: 'ja',
      message:
        'コースが再投稿リストに追加されました、返事までもうしばらくお待ちください。',
    },
    {
      name: 'ammendcode.notify',
      language: 'ja',
      message:
        'コースIDが `{{oldCode}}` から `{{newCode}}` へ変更されました。',
    },
    {
      name: 'error.specialDiscordString',
      language: 'ja',
      message:
        '<@666085542085001246> のような物が入っているコマンドは、ここでは使用できません。',
    },
    {
      name: 'initiation.message',
      language: 'ja',
      message: '<@{{discord_id}}> さん、チームへようこそ!',
    },
    {
      name: 'initiation.userNotInDiscord',
      language: 'ja',
      message:
        '{{name}} という名前は {{TeamName}}のDiscordにいません。',
    },
    {
      name: 'general.heyListen',
      language: 'ja',
      message:
        '**<@{{discord_id}}> さん、進捗があった為お知らせします: **',
    },
    {
      name: 'renameMember.noDiscordId',
      language: 'ja',
      message: 'Discord IDが提示されていません。',
    },
    {
      name: 'renameMember.noMemberFound',
      language: 'ja',
      message: '`{{discord_id}}` というIDのメンバーは存在しません。',
    },
    {
      name: 'renameMember.noNewName',
      language: 'ja',
      message: '新しい名前が提示されていません。',
    },
    {
      name: 'renameMember.alreadyUsed',
      language: 'ja',
      message:
        '\\"{{newName}}\\" という名前は、既に使用されています。',
    },
    {
      name: 'renameMember.already',
      language: 'ja',
      message: '既に \\"{{newName}}\\" という名前を使用しています。',
    },
    {
      name: 'nickname.already',
      language: 'ja',
      message: '既に名前が登録されています: \\"{{newName}}\\"',
    },
    {
      name: 'nickname.success',
      language: 'ja',
      message:
        '名前を \\"{{oldName}}\\" から \\"{{newName}}\\" へ変更しました。',
    },
    {
      name: 'rename.noNewName',
      language: 'ja',
      message: '新しいコース名の提示がありません。',
    },
    {
      name: 'rename.alreadyName',
      language: 'ja',
      message:
        'コース名は既に次の通りになっています \\"{{{level_name}}}\\"',
    },
    {
      name: 'rename.success',
      language: 'ja',
      message:
        'コース名が \\"{{{level_name}}}\\" ({{code}}) から次のように変更されました \\"{{{new_level_name}}}\\" {{{bam}}}',
    },
    {
      name: 'rename.noPermission',
      language: 'ja',
      message:
        "次のコース名は変更できません '{{{level_name}}}' by {{creator}}",
    },
    {
      name: 'pending.pendingTitle',
      language: 'ja',
      message: 'コースは既に再投稿されており、承認待ち状態です。',
    },
    {
      name: 'pending.alreadyApprovedBefore',
      language: 'ja',
      message:
        'コースは既に承認済です。問題が無ければ、承認可能な状態です (**!fixapprove** を使用してください)',
    },
    {
      name: 'pending.refuseTitle',
      language: 'ja',
      message: 'このコースはまだ再投稿されていません。',
    },
    {
      name: 'pending.reuploadedTitle',
      language: 'ja',
      message: 'このコースは再投稿されており、結果待ち状態です。',
    },
    {
      name: 'pending.refuseDescription',
      language: 'ja',
      message:
        '拒否されました: 要修正票を確認し、承認するか否かを決定してください (**!fixapprove** か **!fixreject** をメッセージ付きで入力してください)',
    },
    {
      name: 'pending.fixReuploadDescription',
      language: 'ja',
      message:
        '必要な修正が施されたか確認し、承認するか否かを決定してください (**!fixapprove** か **!fixreject** をメッセージ付きで入力してください)',
    },
    {
      name: 'removeLevel.cant',
      language: 'ja',
      message:
        '次のコースは削除できません \\"{{{level_name}}}\\" by {{{creator}}}',
    },
    {
      name: 'removeLevel.success',
      language: 'ja',
      message:
        '次のコースを削除しました \\"{{{level_name}}}\\" by {{{creator}}} {{{buzzyS}}}',
    },
    {
      name: 'removeLevel.noReason',
      language: 'ja',
      message:
        'このコースを削除した理由を提示していません。 再投稿する場合、 `!reupload` コマンドの使用をおすすめします。削除して再投稿する場合、 __削除するコースのIDはメモしておいてください。__',
    },
    {
      name: 'removeLevel.alreadyRemoved',
      language: 'ja',
      message:
        '次のコースはすでに削除されています \\"{{{level_name}}}\\" by {{{creator}}}',
    },
    {
      name: 'undoRemoveLevel.cant',
      language: 'ja',
      message:
        '次のコースの削除を復活させることはできません \\"{{{level_name}}}\\" by {{{creator}}}',
    },
    {
      name: 'undoRemoveLevel.noReason',
      language: 'ja',
      message: 'コースの削除を取り消そうとする理由を述べてください。',
    },
    {
      name: 'undoRemoveLevel.alreadyNotRemoved',
      language: 'ja',
      message:
        '次のコースは削除されていません \\"{{{level_name}}}\\" by {{{creator}}}',
    },
    {
      name: 'undoRemoveLevel.title',
      language: 'ja',
      message: 'コースの状態を1つ前に戻します。',
    },
    {
      name: 'undoRemoveLevel.success',
      language: 'ja',
      message:
        '次のコースの変更を取り消しました \\"{{{level_name}}}\\" by {{{creator}}} {{{bam}}}',
    },
    {
      name: 'error.reasonTooLong',
      language: 'ja',
      message:
        'コメント/メッセージは {{maxLength}} 以下にしてください。',
    },
    {
      name: 'error.notApproved',
      language: 'ja',
      message: 'コースは承認されていません。',
    },
    {
      name: 'error.userBanned',
      language: 'ja',
      message: 'あなたはこちらのサービスの使用を禁止されています。',
    },
    {
      name: 'error.notRegistered',
      language: 'ja',
      message:
        'サイトへの登録が完了していません。最初に `!register` コマンドを次のチャンネルで入力してください {{{RegistrationChannel}}}\n🇰🇷 `!help:kr`\n🇷🇺 `!help:ru`\n🌐 `!help:lang`',
    },
    {
      name: 'error.emptyLevelList',
      language: 'ja',
      message: 'コースが見つかりません。 buzzyS',
    },
    {
      name: 'error.afterUserDiscord',
      language: 'ja',
      message: '{{{think}}}',
    },
    {
      name: 'error.levelNotFound',
      language: 'ja',
      message:
        '次のID `{{code}}` は {{TeamName}}のリストに存在しません。',
    },
    {
      name: 'error.raceNotFound',
      language: 'ja',
      message: 'レースはありません。',
    },
    {
      name: 'error.raceHasStarted',
      language: 'ja',
      message: 'このレースは既に開始しています。',
    },
    {
      name: 'error.levelIsFixing',
      language: 'ja',
      message: "{{{level.level_name}}}' は現在要修正の状態です。",
    },
    {
      name: 'error.levelIsRemoved',
      language: 'ja',
      message:
        "{{{level.level_name}}}' は {{TeamName}}のリストから削除されました。",
    },
    {
      name: 'error.unknownError',
      language: 'ja',
      message: '問題が発生しました。 buzzyS',
    },
    {
      name: 'error.noCode',
      language: 'ja',
      message: 'コースIDが提示されていません。',
    },
    {
      name: 'error.invalidCode',
      language: 'ja',
      message: '正しいコースIDを提示してください。',
    },
    {
      name: 'error.invalidMakerCode',
      language: 'ja',
      message: '`{{code}}` は正しい職人IDではありません。',
    },
    {
      name: 'error.wrongTokens',
      language: 'ja',
      message:
        'セキュリティトークンに何らかの問題が発生しました。時間を置いて再度お試しください。',
    },
    {
      name: 'error.noSearch',
      language: 'ja',
      message: '検索語を入れてください。',
    },
    {
      name: 'search.foundNum',
      language: 'ja',
      message:
        ', 次のコースを発見 {{levelsFound}} level{{plural levelsFound}}.',
    },
    {
      name: 'search.showingOnly',
      language: 'ja',
      message:
        '次の通りのみのコース {{num_shown}} level{{plural num_shown}}',
    },
    {
      name: 'points.points',
      language: 'ja',
      message:
        '現在の所持ポイント {{1dp player.earned_points.clearPoints}} clear point{{plural player.earned_points.clearPoints}}. これまで提出したコース数 {{player.earned_points.levelsMade}} level{{plural player.earned_points.levelsMade}} {{#if player.earned_points.freeSubmissions}} ({{player.earned_points.freeSubmissions}} free submission{{plural player.earned_points.freeSubmissions}}){{/if}}.',
    },
    {
      name: 'points.canUpload',
      language: 'ja',
      message:
        '1コース提出するのに十分なポイントを所持しています {{{PigChamp}}}',
    },
    {
      name: 'points.cantUpload',
      language: 'ja',
      message:
        '1コース提出するには次のポイント数が不足しています {{1dp points_needed}} more point{{plural points_needed}} {{{buzzyS}}}. URLからポイントの割り当てが確認できます {{TeamURI}}',
    },
    {
      name: 'points.rank',
      language: 'ja',
      message:
        '次のランクを取得しました **{{player.rank.rank}}** {{{player.rank.pips}}}',
    },
    {
      name: 'difficulty.updated',
      language: 'ja',
      message:
        '難易度の変更 {{1dp old_difficulty}} - {{1dp new_difficulty}}',
    },
    {
      name: 'difficulty.success',
      language: 'ja',
      message: '難易度が変更されました。',
    },
    {
      name: 'difficulty.noReason',
      language: 'ja',
      message: '難易度変更の理由を提示してください(引用符使用)',
    },
    {
      name: 'difficulty.noDifficulty',
      language: 'ja',
      message: '難易度の提示をしてください。',
    },
    {
      name: 'add.noName',
      language: 'ja',
      message: 'コース名が提示されていません。',
    },
    {
      name: 'add.levelExisting',
      language: 'ja',
      message:
        "`{{level.code}}` は既に次のように提出されています '{{{level.level_name}}}' by {{level.creator}}",
    },
    {
      name: 'add.success',
      language: 'ja',
      message:
        '新しいコースが追加されました {{{level_name}}} ({{code}}) {{{love}}}',
    },
    {
      name: 'add.notAllowed',
      language: 'ja',
      message:
        'メンバーはこのサーバーで自分自身のコースを提出することはできません。',
    },
    {
      name: 'tags.noTags',
      language: 'ja',
      message: 'タグの提示がありません。',
    },
    {
      name: 'tags.cantAdd',
      language: 'ja',
      message: "次のタグは使用できません '{{tag}}'",
    },
    {
      name: 'tags.noNew',
      language: 'ja',
      message:
        '次のコースにタグは追加されていません \\"{{{level_name}}}\\" by \\"{{creator}}\\"\n',
    },
    {
      name: 'tags.noRemoved',
      language: 'ja',
      message:
        '次のコースからタグは削除されていません \\"{{{level_name}}}\\" by \\"{{creator}}\\"\n',
    },
    {
      name: 'tags.haveNew',
      language: 'ja',
      message:
        '次のコースにタグを追加しました \\"{{{level_name}}}\\" by \\"{{creator}}\\" {{{bam}}}\n',
    },
    {
      name: 'tags.haveRemoved',
      language: 'ja',
      message:
        '次のコースからタグを削除しました \\"{{level_name}}\\" by \\"{{creator}} {{{bam}}}\\"\n',
    },
    {
      name: 'tags.noPermission',
      language: 'ja',
      message:
        '次のコースのタグは削除できません \\"{{{level_name}}}\\" by \\"{{creator}}\\"',
    },
    {
      name: 'tags.cantRemove',
      language: 'ja',
      message: 'タグの削除はできません \\"{{tag}}\\"',
    },
    {
      name: 'tags.currentTags',
      language: 'ja',
      message: '現在のタグ:```\n{{tags_str}}```',
    },
    {
      name: 'tags.duplicateTags',
      language: 'ja',
      message: '重複して追加されたタグがありました {{tag}}',
    },
    {
      name: 'tags.whitelistedOnly',
      language: 'ja',
      message: '`{{tag}}` は現在使用可能ではありません。',
    },
    {
      name: 'addVids.noPermission',
      language: 'ja',
      message:
        '次のコースの動画は削除できません \\"{{{level_name}}}\\" by \\"{{creator}}\\"',
    },
    {
      name: 'addVids.haveNew',
      language: 'ja',
      message:
        '次のコースのクリア動画を追加しました \\"{{{level_name}}}\\" by \\"{{creator}}\\" {{{bam}}}\n',
    },
    {
      name: 'addVids.currentVideos',
      language: 'ja',
      message: '動画:```\n{{videos_str}}```',
    },
    {
      name: 'addVids.haveRemoved',
      language: 'ja',
      message:
        '次のコースのクリア動画を削除しました \\"{{{level_name}}}\\" by \\"{{creator}}\\" {{{bam}}}\n',
    },
    {
      name: 'addVids.noNew',
      language: 'ja',
      message:
        '次のコースにクリア動画は追加されていません \\"{{{level_name}}}\\" by \\"{{creator}}\\"\n',
    },
    {
      name: 'addVids.noRemoved',
      language: 'ja',
      message:
        '次のコースからクリア動画は削除されていません \\"{{{level_name}}}\\" by \\"{{creator}}\\"\n',
    },
    {
      name: 'register.already',
      language: 'ja',
      message:
        '既に次の名前で登録しています: **{{name}}** 名前変更は、次のコマンド形式で入力してください `!nick 新しい名前`',
    },
    {
      name: 'register.nameTaken',
      language: 'ja',
      message:
        "{{name}}' は既に使用されています。別の名前を使用してください。",
    },
    {
      name: 'register.success',
      language: 'ja',
      message:
        "次の名前で登録が完了しました '{{name}}'. {{{bam}}}\n ‣ URLからコースのリストが確認できます {{TeamURI}}/levels\n ‣ クリアしたコースを {{{LevelClearChannel}}} にて `!clear LEV-ELC-ODE` といった形式で入力する事でクリア報告が可能です。\n ‣ もしくは、 `!login` と送信する事でサイトからもクリア報告ができます。\n ‣ English - `!help`\n 🇰🇷 `!help:kr`\n 🇷🇺 `!help:ru`\n 🌐 `!help:lang`",
    },
    {
      name: 'register.noPointsNeeded',
      language: 'ja',
      message:
        '\n‣ コースを {{TeamName}} へ提出する場合、 `!add LEV-ELC-ODE level name` というコマンド形式で {{{LevelSubmissionChannel}}} に入力してください。',
    },
    {
      name: 'register.pointsNeeded',
      language: 'ja',
      message:
        '\n‣ コースを {{TeamName}} へ提出する為に必要なクリアポイントは次の通りです: {{1dp minPoints}} clear points',
    },
    {
      name: 'initmembers.success',
      language: 'ja',
      message:
        '{{registeredCount}} 人のメンバーが登録しています。 {{alreadyRegisteredCount}} 人の分は既に登録済みなので、スキップしました。',
    },
    {
      name: 'login.reply',
      language: 'ja',
      message:
        'サイトのログイントークンが発行されました、以下のURLから飛んでください:\n <{{loginLink}}> {{{bam}}}\n モバイルの場合、リンクをコピーして優先されているブラウザに貼り付けてください。アプリ内のブラウザで飛んだ場合、ログイン履歴が残らない可能性があります。 {{{buzzyS}}}\n トークンは30分間有効です。',
    },
    {
      name: 'login.failedReply',
      language: 'ja',
      message:
        'ダイレクトメッセージの送信に失敗しました。Discordの設定「サーバーにいるメンバーからのダイレクトメッセージを許可する」がオンになっている事を確認し、再度お試しください。',
    },
    {
      name: 'makerid.noCode',
      language: 'ja',
      message: '職人IDの提示がありません。',
    },
    {
      name: 'makerid.noName',
      language: 'ja',
      message: '職人名の提示がありません。',
    },
    {
      name: 'makerid.success',
      language: 'ja',
      message:
        '職人IDを次の物に更新しました {{code}} 同様に名前を次の物に更新しました {{name}} {{{bam}}}',
    },
    {
      name: 'makerid.existing',
      language: 'ja',
      message: "`{{code}} は既に '{{name}}' によって使用されています",
    },
    {
      name: 'makerid.already',
      language: 'ja',
      message: '`{{code}}` は既に使用している職人IDです',
    },
    {
      name: 'setworld.invalidWorldCount',
      language: 'ja',
      message: '正しいワールドの数値が提示されていません。',
    },
    {
      name: 'setworld.invalidLevelCount',
      language: 'ja',
      message: '正しいコースの数値が提示されていません。',
    },
    {
      name: 'setworld.noWorldName',
      language: 'ja',
      message: 'ワールドの名前が提示されていません。',
    },
    {
      name: 'setworld.success',
      language: 'ja',
      message:
        'ワールドの登録が完了しました。サイトのworldsタブに追加されているかご確認ください。',
    },
    {
      name: 'setworld.noMakerId',
      language: 'ja',
      message:
        '職人IDと名前を次のコマンド形式で入力してください: !makerid XXX-XXX-XXX 名前',
    },
    {
      name: 'pendingStatus.approves',
      language: 'ja',
      message: '{{approves}} 承認票{{plural 承認票}}',
    },
    {
      name: 'pendingStatus.rejects',
      language: 'ja',
      message: '{{rejects}} 却下票{{plural 却下票}}',
    },
    {
      name: 'pendingStatus.wantFixes',
      language: 'ja',
      message: '{{want_fixes}} 要修正票{{plural 要修正票}}',
    },
    {
      name: 'pendingStatus.noVotes',
      language: 'ja',
      message: '票が集まっていません。',
    },
    {
      name: 'pendingStatus.none',
      language: 'ja',
      message: '未査定のコースはありません。',
    },
    {
      name: 'unsetworld.success',
      language: 'ja',
      message: 'ワールドの削除が完了しました。',
    },
    {
      name: 'atme.already',
      language: 'ja',
      message: '既にメンションされる予定が立っています。',
    },
    {
      name: 'atme.willBe',
      language: 'ja',
      message:
        '次のBotによりメンションされる予定です: {{BotName}} {{{bam}}}',
    },
    {
      name: 'atme.alreadyNot',
      language: 'ja',
      message: '既にメンションされない予定が立っています。',
    },
    {
      name: 'atme.willBeNot',
      language: 'ja',
      message:
        '次のBotによりメンションされない予定です: {{BotName}} {{{bam}}}',
    },
    {
      name: 'ammendCode.success',
      language: 'ja',
      message:
        '{{level.creator}} の \\"{{{level.level_name}}}\\" のコースIDを `{{oldCode}}` から `{{newCode}}` に変更しました。',
    },
    {
      name: 'help.basic',
      language: 'ja',
      message:
        '次のリンクからコマンド一覧を確認できます <https://makerteams.net/features>',
    },
    {
      name: 'mock.userSuccess',
      language: 'ja',
      message: '名前が {{name}} になりました！',
    },
    {
      name: 'mock.noTargetGiven',
      language: 'ja',
      message: '名前を提示していません。',
    },
    {
      name: 'mock.already',
      language: 'ja',
      message: '既にその名前です。',
    },
    {
      name: 'mock.notFound',
      language: 'ja',
      message: 'ユーザーが見つかりませんでした。',
    },
    {
      name: 'resetStatus.alreadyPending',
      language: 'ja',
      message:
        'このコースは既に査定待ち状態です。使用したコマンドは状態を査定待ちにする物です。',
    },
    {
      name: 'resetStatus.successful',
      language: 'ja',
      message:
        '{{{creator}}} の \\"{{{level_name}}}\\" は査定待ち状態にリセットされました。',
    },
    {
      name: 'vote.noVoteSubmitted',
      language: 'ja',
      message:
        '次のコースへの票は入ってません \\"{{{level_name}}}\\" by {{{creator}}}',
    },
    {
      name: 'vote.voteRemoved',
      language: 'ja',
      message:
        '次のコースへの票を削除しました \\"{{{level_name}}}\\" by {{{creator}}}',
    },
    {
      name: 'clearDifficulty.success',
      language: 'ja',
      message:
        '次のコースの難易度評価を削除しました \\"{{{level_name}}}\\" by {{{creator}}}',
    },
    {
      name: 'race.newRaceAdded',
      language: 'ja',
      message:
        '新しいレース {{#if unofficial}}unofficial{{else}}official{{/if}} が追加されました:',
    },
    {
      name: 'race.raceEdited',
      language: 'ja',
      message: '以下のレースに変更が加わりました:',
    },
    {
      name: 'race.newRaceEntrant',
      language: 'ja',
      message:
        '<@{{{discord_id}}}> さんがレースに参加しました \\"{{{name}}}\\".',
    },
    {
      name: 'race.entrantLeftRace',
      language: 'ja',
      message:
        '<@{{{discord_id}}}> さんがレースから抜けました \\"{{{name}}}\\".',
    },
    {
      name: 'race.entrantFinishedRace',
      language: 'ja',
      message:
        '<@{{{discord_id}}}> さんがレースを完走しました \\"{{{name}}}\\" (Rank: #{{{rank}}}). 完走した証拠の提示をお願いします。',
    },
    {
      name: 'race.raceStarted',
      language: 'ja',
      message:
        '{{{mentions}}}: レース \\"{{{name}}}\\" が開始しました、以下のコースで他プレイヤーと競争をしましょう。',
    },
    {
      name: 'race.noParticipants',
      language: 'ja',
      message:
        'レース \\"{{{name}}}\\" への参加者がいなかったため、削除されました。',
    },
    {
      name: 'race.raceFailed',
      language: 'ja',
      message:
        '{{{mentions}}}: レース \\"{{{name}}}\\" が開始できませんでした。基準を満たすコースが見つかりませんでした。レースは5分延期中です、基準の変更をお願いします。',
    },
    {
      name: 'race.raceEnded',
      language: 'ja',
      message:
        '{{{mentions}}}: レース \\"{{{name}}}\\" が終了しました、優勝者の方々おめでとうございます:',
    },
    {
      name: 'race.notRaceCreator',
      language: 'ja',
      message: 'このレースを編集する権限がありません。',
    },
    {
      name: 'race.needMorePoints',
      language: 'ja',
      message:
        '最低でも {{{minimumPoints}}} ポイントが無いと非公式レースが主催できません。',
    },
    {
      name: 'race.tooManyPoints',
      language: 'ja',
      message:
        'このレースに参加する基準を満たしていません。一定のポイントが参加に必要です。',
    },
    {
      name: 'modaddmember.missingParam',
      language: 'ja',
      message: 'メンバーネームが必要です。',
    },
    {
      name: 'modaddmember.success',
      language: 'ja',
      message: 'メンバーネーム \\"{{{name}}}\\" が追加されました。',
    },
    {
      name: 'modaddlevel.memberNotFound',
      language: 'ja',
      message: 'メンバーリストに \\"{{{name}}}\\" は存在しません。',
    },
    {
      name: 'modsetdiscordid.missingName',
      language: 'ja',
      message: 'メンバーネームが必要です。',
    },
    {
      name: 'modsetdiscordid.missingId',
      language: 'ja',
      message: 'Discord IDが必要です。',
    },
    {
      name: 'modsetdiscordid.memberNotFound',
      language: 'ja',
      message: 'メンバーリストに \\"{{{name}}}\\" は存在しません。',
    },
    {
      name: 'modsetdiscordid.duplicateId',
      language: 'ja',
      message: 'このDiscord IDは既に他のメンバーが使用しています。',
    },
    {
      name: 'modsetdiscordid.success',
      language: 'ja',
      message: 'Discord IDが追加されました \\"{{{name}}}\\".',
    },
    {
      name: 'requestRerate.noReason',
      language: 'ja',
      message:
        '再評価の理由提示がありません。理由・適切と思われる難易度の提示をお願いします。',
    },
    {
      name: 'requestRerate.notApproved',
      language: 'ja',
      message: '難易度の変更は承認済のコースのみ可能です。',
    },
    {
      name: 'help.unknownCommand',
      language: 'ja',
      message:
        '入力したコマンドは存在しません、スペルの確認をお願いします。 `!help commands` からコマンドの確認が可能です。',
    },
    {
      name: 'help.add',
      language: 'ja',
      message:
        '必要なクリアポイントを取得後(チームにより必要なポイントは変わります)、コースの提出が可能となります。査定後に承認・要修正・却下のいずれかがメンションつきで連絡されます。',
    },
    {
      name: 'help.addtags',
      language: 'ja',
      message: 'このコマンドでタグを追加できます(SMB1、SMWなど)',
    },
    {
      name: 'help.removetags',
      language: 'ja',
      message: 'このコマンドでタグの消去ができます。',
    },
    {
      name: 'help.addvids',
      language: 'ja',
      message:
        'このコマンドでクリア動画が追加できます(サイトにリンクが表示されます。!infoコマンドでも表示されます)',
    },
    {
      name: 'help.removevids',
      language: 'ja',
      message: 'このコマンドでクリア動画を削除できます。',
    },
    {
      name: 'help.amendcode',
      language: 'ja',
      message: 'このコマンドでコースIDのミスを修正できます。',
    },
    {
      name: 'help.atme',
      language: 'ja',
      message:
        'このコマンドを使用すると、誰かがあなたのコースのクリア報告をした時にメンションされるようになります。',
    },
    {
      name: 'help.dontatme',
      language: 'ja',
      message:
        'このコマンドを使用すると、クリア報告時のメンションがされなくなります。',
    },
    {
      name: 'help.nickname',
      language: 'ja',
      message:
        'このコマンドを使用する事でニックネームが変更できます。',
    },
    {
      name: 'help.clear',
      language: 'ja',
      message:
        'このコマンドでコースのクリア報告をします。難易度に応じてクリアポイントが加算されます。コマンドの最後に \\"like\\" と付けるとサイト上でいいねのマークが追加されます。',
    },
    {
      name: 'help.cleardifficulty',
      language: 'ja',
      message: 'このコマンドで投票された難易度評価を削除できます。',
    },
    {
      name: 'help.difficulty',
      language: 'ja',
      message: 'このコマンドで難易度評価ができます。',
    },
    {
      name: 'help.fixdiscuss',
      language: 'ja',
      message:
        '（非推奨）現在このコマンドは使用しない事を推奨しています。',
    },
    {
      name: 'help.search',
      language: 'ja',
      message: 'このコマンドでコース名もしくは職人の検索ができます。',
    },
    {
      name: 'help.like',
      language: 'ja',
      message:
        'このコマンドでコースにいいねを残せます(!clear使用時に同時に残せますが、忘れた場合このコマンド単体でつけられます)',
    },
    {
      name: 'help.unlike',
      language: 'ja',
      message: 'このコマンドでいいねを取り消せます。',
    },
    {
      name: 'help.login',
      language: 'ja',
      message:
        'このコマンドを使用すると、Botからサイトへのログイン用リンクが送信されます。 (クリア報告やいいねをサイトでつけられるようになります) 重要: モバイルの場合、コピー＆ペーストでリンクをブラウザに貼ってください。クリックしただけだと、Discordが一時的なブラウザを開いてログインできない状態になる可能性があります。',
    },
    {
      name: 'help.makerid',
      language: 'ja',
      message: 'このコマンドで職人IDと名前を登録できます。',
    },
    {
      name: 'help.modaddclear',
      language: 'ja',
      message:
        'モデレーターの場合、他のメンバーの為にコースのいいねやクリア報告ができます。パラメーターは!clearと同じです。',
    },
    {
      name: 'help.modaddlevel',
      language: 'ja',
      message: '他のメンバーの為にコースを登録できます。',
    },
    {
      name: 'help.modaddmember',
      language: 'ja',
      message: '他メンバーの新規登録を行います。',
    },
    {
      name: 'help.modsetdiscordid',
      language: 'ja',
      message:
        '一時的なメンバーにDiscord IDと名前をリンクさせます。 (IDは開発者モードをオンにしてユーザーを右クリックすると見つけられます)',
    },
    {
      name: 'help.pendingstatus',
      language: 'ja',
      message:
        'このコマンドで未査定のコースの状況(票があるかどうかなど)を確認できます。',
    },
    {
      name: 'help.playersrandom',
      language: 'ja',
      message:
        'ランダムにコースを持ってきます。名前を入力する事で、複数人にお知らせします(並走等向け)',
    },
    {
      name: 'help.points',
      language: 'ja',
      message:
        'このコマンドで現在どのぐらいクリアポイントを所持しているか確認します (コースの難易度が変わった場合、自動的に取得したポイント数も変わります) また、コース提出に十分なポイントを所持しているか、ランクはどこかも確認できます。',
    },
    {
      name: 'help.random',
      language: 'ja',
      message:
        'ランダムに未クリアのコースを持ってきます。数字で難易度を指定する事も可能です。',
    },
    {
      name: 'help.randomall',
      language: 'ja',
      message:
        '未査定のコースも含め、ランダムに未クリアのコースを持ってきます。数字で難易度を指定する事も可能です。',
    },
    {
      name: 'help.randompending',
      language: 'ja',
      message:
        '未査定のコースの中からランダムに未クリアのコースを持ってきます。数字で難易度を指定する事も可能です。',
    },
    {
      name: 'help.randomtag',
      language: 'ja',
      message:
        '指定のタグ付きのコースの中からランダムに未クリアのコースを持ってきます。数字で難易度を指定する事も可能です。',
    },
    {
      name: 'help.register',
      language: 'ja',
      message:
        '最初に使用するコマンドです。仮メンバーとして登録されます。',
    },
    {
      name: 'help.refresh',
      language: 'ja',
      message: 'Botの設定をリロードします。',
    },
    {
      name: 'help.requestremoval',
      language: 'ja',
      message:
        'このコマンドでコースの削除申請ができます。モデレーターが確認後、メンション付きで結果をお知らせします。削除された場合再投稿ができなくなるので、慎重に使用してください。',
    },
    {
      name: 'help.removevote',
      language: 'ja',
      message: 'このコマンドで結果待ちの票を削除できます。',
    },
    {
      name: 'help.rename',
      language: 'ja',
      message: 'このコマンドでコース名の変更を行えます。',
    },
    {
      name: 'help.requestrerate',
      language: 'ja',
      message:
        'このコマンドでコースの難易度再評価申請ができます。モデレーターが確認後、メンション付きで結果をお知らせします。',
    },
    {
      name: 'help.resetstatus',
      language: 'ja',
      message:
        'このコマンドでコースの状態を審査待ちにできます。モデレーターに再審査して欲しい場合等に使用してください。',
    },
    {
      name: 'help.reupload',
      language: 'ja',
      message:
        '要修正になった場合のコース再投稿時に使用してください (削除済コースID、新コースID、再投稿理由の順に半角で入力します) 削除したコースが既に承認されていた場合、優先的にモデレーターが再査定します。',
    },
    {
      name: 'help.setworld',
      language: 'ja',
      message:
        '現在使用中のワールドの名前、ワールド・コースの数を登録します。登録後、worldsのタブに表示されます。',
    },
    {
      name: 'help.approve',
      language: 'ja',
      message:
        '指定の難易度で承認票を追加します。モデレーターが票を追加する事で本格的な審査に移ります。',
    },
    {
      name: 'help.fix',
      language: 'ja',
      message:
        '承認票としてカウントされますが、.1票でも入っているときに承認されると自動的に要修正の状態になり、製作者が修正するかどうかの立場に置かれます。',
    },
    {
      name: 'help.reject',
      language: 'ja',
      message:
        '拒否票です。チームに相応しくない、ギミックがあまりにも不器用等の適切な理由がある場合は使用します。',
    },
    {
      name: 'help.auditapprove',
      language: 'ja',
      message:
        '手早く審査されたい場合、このコマンドで監査チャンネルに直接コースを送信します。',
    },
    {
      name: 'help.auditreject',
      language: 'ja',
      message:
        '手早く拒否審査されたい場合、このコマンドで監査チャンネルに直接コースを送信します。',
    },
    {
      name: 'help.help',
      language: 'ja',
      message:
        '一般的なコマンドです。これと他のコマンドの併用(!help:ja clear等)で各コマンドの詳細がわかります。',
    },
    {
      name: 'help.info',
      language: 'ja',
      message:
        'コース名、タグ、クリア動画等そのコースの情報がわかります。',
    },
    {
      name: 'help.judge',
      language: 'ja',
      message:
        'ジャッジメントチャンネルで使用します。必要なモデレーターの票数が集まったコースの最終確認を行います。',
    },
    {
      name: 'help.refusefix',
      language: 'ja',
      message:
        '要修正の状態になって修正を施したくない場合に使用します。モデレーターが再度確認し、承認か拒否かをメンション付きでお知らせします。',
    },
    {
      name: 'help.removeclear',
      language: 'ja',
      message:
        '間違えて未クリアのコースをクリア扱いにした時に取り消せます。',
    },
    {
      name: 'help.rerate',
      language: 'ja',
      message:
        'コースの難易度を再評価します。変わった場合は製作者にお知らせが行きます。',
    },
    {
      name: 'help.unsetworld',
      language: 'ja',
      message:
        'ワールドを削除したい場合このコマンドを使用して削除します。',
    },
    {
      name: 'modaddlevel.missingMemberName',
      language: 'ja',
      message: '正しいメンバーの名前を入力してください。',
    },
    {
      name: 'help.renamemember',
      language: 'ja',
      message:
        '別メンバーの名前を変更できます。Discord IDが必要です。',
    },
    {
      name: 'add.missingGameStyle',
      language: 'ja',
      message:
        'ゲームスキンの指定が必要です (SMB1, SMB3, SMW, NSMBU, 3DW). 次のコマンドで使用してください `!add XXX-XXX-XXX スキン コース名`.',
    },
    {
      name: 'help.discuss',
      language: 'ja',
      message:
        'コースのディスカッションチャンネル作成に使います。チャンネル内で情報をリロードする際にも使えます。',
    },
  ];

  return knex.schema
    .table('default_strings', (t) => {
      t.string('language').after('name').notNull().defaultTo('en');
      t.boolean('auto_translated').notNull().defaultTo(0);
      t.integer('version').notNull().defaultTo(1);
    })
    .then(() => {
      return knex.raw(
        "update default_strings set language = SUBSTR(name, 1, 2), name = SUBSTR(name, 4) where name like '__.%'",
      );
    })
    .then(() => {
      return knex.raw(
        "update default_strings set auto_translated = 1 where message like '%Google%'",
      );
    })
    .then(function () {
      // Inserts seed entries
      return knex('default_strings').insert(japaneseInserts);
    });
};

exports.down = function (knex) {
  return knex
    .raw(
      "update default_strings set name = CONCAT(language, '.', name) where language <> 'en'",
    )
    .then(() => {
      return knex('default_strings').where('language', 'ja').del();
    })
    .then(() => {
      return knex.schema.table('default_strings', (t) => {
        t.dropColumn('version');
        t.dropColumn('auto_translated');
        t.dropColumn('language');
      });
    });
};
