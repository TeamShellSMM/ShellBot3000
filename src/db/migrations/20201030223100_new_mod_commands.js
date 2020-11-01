exports.up = function (knex) {
  const newCommands = [
    {
      name: 'modmergemembers',
      format: '!modmergemembers <MemberToKeep> <MemberToMerge>',
      aliases: 'modmergemember',
      category: 'mod',
    },
    {
      name: 'modremovelevel',
      format: '!modremovelevel <XXX-XXX-XXX> <Reason>',
      aliases: '',
      category: 'mod',
    },
    {
      name: 'modrenamemember',
      format: '!modrenamemember <OldName> <NewName>',
      aliases: '',
      category: 'mod',
    },
    {
      name: 'modremoveclear',
      format: '!modremoveclear <MemberName> <XXX-XXX-XXX>',
      aliases: '',
      category: 'mod',
    },
  ];

  const newDefaultStrings = [
    {
      name: 'help.modmergemembers',
      message:
        "You can use this to merge 2 members. All the levels and clears of the second member will be transferred to the first. Afterwards the second member will be removed.",
    },
    {
      name: 'help.modremovelevel',
      message:
        "Use this to flat out remove a level from the list (without going through the deletion request process). The creator will be notified with your reason.",
    },
    {
      name: 'help.modrenamemember',
      message:
        "Use this to rename another member.",
    },
    {
      name: 'help.modremoveclear',
      message:
        "With this you can remove a clear of a level from another member.",
    },
    {
      name: 'error.levelNotApproved',
      message:
        "This level is not an approved level.",
    },
    {
      name: 'error.wrongGameStyle',
      message:
        "This is not a valid game style (SMB1, SMB3, SMW, NSMBU, 3DW).",
    },
    {
      name: 'error.missingParameter',
      message:
        "Missing parameter. You have to enter something here.",
    },
    {
      name: 'error.textTooLong',
      message:
        "The text you entered is too long for this command, a maximum of {{{maximumChars}}} characters are allowed here.",
    },
    {
      name: 'error.noVideos',
      message:
        "You didn't enter any video urls.",
    },
    {
      name: 'error.notUrls',
      message:
        "The links below didn't look like urls: \`\`\`\n{{{urls}}}\`\`\`"
    },
    {
      name: 'error.missingMemberName',
      message:
        "You have to enter a valid member name."
    },
    {
      name: 'error.missingMemberNames',
      message:
        "You have to enter at least one valid member name."
    },
    {
      name: 'error.memberNotFound',
      message:
        'No member with the name "{{{name}}}" was found in the members list.'
    },
    {
      name: 'modsetdiscordid.invalidId',
      message:
        'This is not a valid discord id.'
    },
    {
      name: 'random.outOfLevelsTags',
      message:
        ' with tags: {{tags}}'
    },
    {
      name: 'error.invalidInt',
      message:
        'This is not a valid integer.'
    },
  ];

  return knex('commands').insert(newCommands)
    .then(() => {
      return knex('default_strings').insert(newDefaultStrings);
    })
    .then(() => {
      return knex('default_strings')
        .where({ name: "error.noCode" })
        .update({ message: "You didn't enter a level code." });
    })
    .then(() => {
      return knex('default_strings')
        .where({ name: "error.invalidCode" })
        .update({ message: "This is not a valid level code." });
    })
    .then(() => {
      return knex('command_permissions')
        .whereRaw("command_id = (select id from commands where name = 'renamemember' limit 1)")
        .del();
    })
    .then(() => {
      return knex('commands')
        .where({ name: "renamemember" })
        .del();
    });
};

exports.down = function (knex) {
  return knex('commands')
    .whereIn('name', [
      'modmergemembers',
      'modremovelevel',
      'modrenamemember',
      'modremoveclear',
    ])
    .del()
    .then(() => {
      return knex('default_strings')
        .whereIn('name', [
          'help.modmergemembers',
          'help.modremovelevel',
          'help.modrenamemember',
          'help.modremoveclear',
          'error.levelNotApproved',
          'error.wrongGameStyle',
          'error.missingParameter',
          'error.textTooLong',
          'error.noVideos',
          'error.notUrls',
          'error.missingMemberName',
          'error.missingMemberNames',
          'error.memberNotFound',
          'modsetdiscordid.invalidId',
          'random.outOfLevelsTags',
          'error.invalidInt',
        ])
        .del();
    })
    .then(() => {
      return knex('default_strings')
        .where({ name: "error.noCode" })
        .update({ message: "You did not give a level code " });
    })
    .then(() => {
      return knex('default_strings')
        .where({ name: "error.invalidCode" })
        .update({ message: "You did not provide a valid level code" });
    });
};
