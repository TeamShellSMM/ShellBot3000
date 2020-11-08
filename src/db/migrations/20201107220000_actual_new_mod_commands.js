exports.up = function (knex) {
  const newDefaultStrings = [
    {
      name: 'success.modrenamemember',
      message:
        "The member '{{oldName}}' has successfully been renamed to '{{newName}}'.",
    },
    {
      name: 'success.modremovelevel',
      message:
        "You have successfully deleted '{{levelName}}' by <@{{discordId}}>, the creator has already been notified with your reason for the deletion.",
    },
    {
      name: 'notice.modremovelevel',
      message:
        "We're very sorry, but this level has just been manually removed.",
    },
    {
      name: 'success.modremoveclear',
      message:
        "You have successfully removed '{{memberName}}'s clear of '{{levelName}}' (made by {{authorName}}).",
    },
    {
      name: 'modremoveclear.noClear',
      message:
        "'{{memberName}}' doesn't have a clear of '{{levelName}}' (made by {{authorName}}).",
    },
    {
      name: 'modmergemembers.sameMember',
      message: 'You entered the same member twice.',
    },
    {
      name: 'success.modmergemembers',
      message:
        "All of '{{memberMergeName}}'s levels, clears, races, competitions, submitted videos and pending votes have been migrated to '{{memberKeepName}}'s account. '{{memberMergeName}}'s discord id has also been unset (their account will stay in the DB as '{{memberMergeName}} (merged)').",
    },
  ];

  return knex('default_strings')
    .insert(newDefaultStrings)
    .then(() => {
      return knex('default_strings')
        .where('name', 'pendingStatus.rejects')
        .update({ message: '{{rejects}} reject{{plural rejects}}' });
    });
};

exports.down = function (knex) {
  return knex('default_strings')
    .whereIn('name', [
      'success.modrenamemember',
      'success.modremovelevel',
      'notice.modremovelevel',
      'success.modremoveclear',
      'modremoveclear.noClear',
      'modmergemembers.sameMember',
      'success.modmergemembers',
    ])
    .del()
    .then(() => {
      return knex('default_strings')
        .where('name', 'pendingStatus.rejects')
        .update({ message: '{{rejects}} rejects{{plural rejects}}' });
    });
};
