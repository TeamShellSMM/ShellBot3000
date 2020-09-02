exports.up = function (knex) {
  const insertJson = [
    {
      name: 'add.missingGameStyle',
      message:
        'You now need to enter a valid game style (SMB1, SMB3, SMW, NSMBU, 3DW). Try `!add <LevelCode> <GameStyle> <LevelName>`.',
    },
  ];

  return knex('default_strings')
    .insert(insertJson)
    .then(() => {
      return knex('commands').where('name', 'add').update({
        format: '!add <LevelCode> <GameStyle> <LevelName>',
      });
    });
};

exports.down = function (knex) {
  return knex('default_strings')
    .where('name', 'add.missingGameStyle')
    .del()
    .then(() => {
      return knex('commands').where('name', 'add').update({
        format: '!add <LevelCode> <Level Name>',
      });
    });
};
