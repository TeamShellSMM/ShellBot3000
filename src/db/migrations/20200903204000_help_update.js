exports.up = function (knex) {
  return knex('default_strings')
    .where('name', 'help')
    .update({
      message:
        '\n• To do anything, you will have to register first by using `!register` in {{{RegistrationChannel}}}.\n• To get a list of levels go to {{TeamURI}}/levels.\n• Then you can now submit your clears of level by using `!clear LEV-ELC-ODE` in {{{LevelClearChannel}}}\n• You can also `!login` and submit your clears in the site\n• You can submit a level by using `!add LEV-ELC-ODE level name` in {{{LevelSubmissionChannel}}}\n• To get a list of all commands you can use `!help commands`\n🌐 `!help:lang`\n🌐 `!command:lang`',
    })
    .then(() => {
      return knex('default_strings').where('name', 'ru.help').update({
        message:
          '\n• Ïðåæäå ÷åì äåëàòü ÷òî-ëèáî, íóæíî çàðåãèñòðèðîâàòüñÿ, íàïèñàâ êîìàíäó `!register` â êàíàëå {{{RegistrationChannel}}}.\n• ×òîáû óâèäåòü ñïèñîê óðîâíåé, ïåðåéäèòå íà {{TeamURI}}/levels\n• Çàòåì âû ñìîæåòå îòìåòèòü ïðîéäåííûå âàìè óðîâíè, èñïîëüçóÿ êîìàíäó `!clear ÊÎÄ-ÓÐÎ-ÂÍß` â êàíàëå {{{LevelClearChannel}}}.\n• Âû òàêæå ìîæåòå íàïèñàòü `!login` è îòìå÷àòü ïðîéäåííûå âàìè óðîâíè íåïîñðåäñòâåííî íà ñàéòå.\n• ×òîáû îòïðàâèòü ñâîé óðîâåíü, èñïîëüçóéòå êîìàíäó `!add ÊÎÄ-ÓÐÎ-ÂÍß íàçâàíèå óðîâíÿ` â êàíàëå {{{LevelSubmissionChannel}}}.\n• ×òîáû ïðîñìîòðåòü ïîëíûé ñïèñîê êîìàíä, èñïîëüçóéòå êîìàíäó `!help commands`.\n🌐 `!help:lang`\n🌐 `!command:lang`',
      });
    })
    .then(() => {
      return knex('default_strings').where('name', 'ko.help').update({
        message:
          '\n• 활동을 하려면 {{{RegistrationChannel}}} 에서 `!register` 를 사용하여 먼저 등록해야합니다.\n• 레벨 목록을 보려면 {{TeamURI}}/levels 로 이동하십시오.\n• 이제 `!clear LEV-ELC-ODE` 를 사용하여 레벨 클리어를 제출할 수 있습니다\n• 당신은 또한 `!login` 을 할 수 있고 사이트에서 당신의 레벨 클리어를 제출할 수 있습니다\n• `!add LEV-ELC-ODE level name` 을 사용하여 레벨을 제출할 수 있습니다.\n\n이것은 기계 번역입니다. 번역이 틀렸다면 알려주십시오. <:SpigRobo:628051703320805377>\n• 모든 명령 목록을 얻으려면 `!help commands` 를 사용할 수 있습니다.\n🌐 `!help:lang`\n🌐 `!command:lang`',
      });
    })
    .then(() => {
      return knex('default_strings').where('name', 'no.help').update({
        message:
          '\n• For å gjøre noe, må du registrere deg først ved bruk av `!register` i {{{RegistrationChannel}}} .\n• for og få en liste av leveler gå til {{TeamURI}}/levels.\n• Etter det kan du sende inn dine clears på leveler ved bruk av `!clear LEV-ELC-ODE` i {{{LevelClearChannel}}}\n• Du kan også bruke `!login` og sende inn dine clears på nettsiden\n• Du kan sende inn dine leveler ved bruk av `!add LEV-ELC-ODE level navn` i {{{LevelSubmissionChannel}}}\n• For å få en liste over alle kommandoer kan du bruke `!help commands`\n🌐 `!help:lang`\n🌐 `!command:lang`',
      });
    })
    .then(() => {
      return knex('default_strings').where('name', 'fr.help').update({
        message:
          '\n• Avant tout, il faut faire la commande `!register` dans {{{RegistrationChannel}}}.\n• Pour accéder à la liste des niveaux va sur {{TeamURI}}/levels.\n• Quand tu bats un niveau de la liste, fais `!clear LEV-ELC-ODE` dans {{{LevelClearChannel}}}.\n• Tu peux aussi faire !login et mettre les niveaux que tu as battu directement sur le site.\n• Si tu veux proposer un niveau, fais `!add LEV-ELC-ODE nom` dans {{{LevelSubmissionChannel}}}.\n• Pour obtenir une liste de toutes les commandes, vous pouvez utiliser `!help commands`\n🌐 `!help:lang`\n🌐 `!command:lang`',
      });
    })
    .then(() => {
      return knex('default_strings').where('name', 'de.help').update({
        message:
          '\n• Um loszulegen musst du dich zuerst registrieren, indem du `!register` in dem {{{RegistrationChannel}}} benutzt.\n• Eine Liste mit allen Leveln findest du unter {{TeamURI}}/levels.\n• Den Abschluss eines Levels kannst du mit `!clear LEV-ELC-ODE` in dem {{{LevelClearChannel}}} übermitteln.\n• Du kannst auch !login benutzen, um den Abschluss eines Levels stattdessen über die Webseite zu bestätigen.\n• Dein eigenes Level kannst du mit `!add LEV-ELC-ODE level name` in dem {{{LevelSubmissionChannel}}} einreichen.\n• Um eine Liste aller verfügbaren Befehle anzuzeigen verwende einfach `!help commands`\n🌐 `!help:lang`\n🌐 `!command:lang`',
      });
    })
    .then(() => {
      return knex('default_strings').where('name', 'es.help').update({
        message:
          '\n• Para comenzar, primero tienes que registrarte usando !register en {{{RegistrationChannel}}}.\n• Para agarrar una lista de niveles visita {{TeamURI}}/levels.\n• Puedes enviar los niveles completados usando !clear LEV-ELC-ODE en {{{LevelClearChannel}}}.\n• También puedes usar !login y enviar los niveles completados del sitio web.\n• Puedes enviar un nuevo nivel usando !add LEV-ELC-ODE en {{{LevelSubmissionChannel}}}.\n• Para obtener una lista de todos los comandos, puede usar `!help commands`',
      });
    })
    .then(() => {
      return knex('default_strings').where('name', 'se.help').update({
        message:
          '\n• För att göra någonting, måste du registrera dig först genom att använda !register i {{{RegistrationChannel}}}.\n• För att få en lista av banor gå till {{TeamURI}}/levels.\n• Sedan kan du nu skicka in dina clears av banor genom att använda !clear LEV-ELC-ODE i {{{LevelClearChannel}}}.\n• Du kan också använda !login och skicka in dina clears på hemsidan.\n• Du kan skicka in en bana genom att använda !add LEV-ELC-ODE och namnet på banan i {{{LevelSubmissionChannel}}}.\n• För att få en lista över alla kommandon kan du använda `!help commands`\n🌐 `!help:lang`\n🌐 `!command:lang`',
      });
    })
    .then(() => {
      return knex('default_strings')
        .where('name', 'help.commands')
        .update({
          message:
            "Here's a list of all commands you can use **in this channel** (the most important ones are underlined). To get a detailed explanation for a certain command use `!help <commandname>`.",
        });
    })
    .then(() => {
      return knex('default_strings').insert({
        name: 'help.discuss',
        message:
          'Use this to create a level discussion channel for a (pending) level without casting a vote. You can also use this inside a level discussion channel to refresh the information at the top (in case something goes wrong).',
      });
    })
    .then(() => {
      return knex('commands').where('name', 'fixdiscuss').del();
    })
    .then(() => {
      return knex('commands').insert({
        name: 'discuss',
        format: '!discuss <LevelCode>',
        aliases: 'discusschannel,fixdiscuss',
        category: 'mods',
      });
    });
};

exports.down = function (knex) {
  return knex('default_strings')
    .where('name', 'help')
    .update({
      message:
        '\n• To do anything, you will have to register first by using `!register` in {{{RegistrationChannel}}}.\n• To get a list of levels go to {{TeamURI}}/levels.\n• Then you can now submit your clears of level by using `!clear LEV-ELC-ODE` in {{{LevelClearChannel}}}\n• You can also `!login` and submit your clears in the site\n• You can submit a level by using `!add LEV-ELC-ODE level name` in {{{LevelSubmissionChannel}}}\n• To get a list of all commands you can use `!help commands`\n🌐 `!help:lang`',
    })
    .then(() => {
      return knex('default_strings').where('name', 'ru.help').update({
        message:
          '\n• Для того, чтобы сделать что-нибудь, сначала нужно зарегистрироваться, используя `!register` в {{{RegistrationChannel}}}.\n• Чтобы получить список уровней, перейдите на {{TeamURI}}/levels.\n• Затем вы можете отправить свои пройденные уровни, используя `!clear LEV-ELC-ODE` в {{{LevelClearChannel}}}.\n• Вы также можете `!login` и отправить свои завершения на сайте.\n• Вы можете отправить уровень, используя `!add LEV-ELC-ODE название уровня` в {{{LevelSubmissionChannel}}}.',
      });
    })
    .then(() => {
      return knex('default_strings').where('name', 'ko.help').update({
        message:
          '\n• 활동을 하려면 {{{RegistrationChannel}}} 에서 `!register` 를 사용하여 먼저 등록해야합니다.\n• 레벨 목록을 보려면 {{TeamURI}}/levels 로 이동하십시오.\n• 이제 `!clear LEV-ELC-ODE` 를 사용하여 레벨 클리어를 제출할 수 있습니다\n• 당신은 또한 `!login` 을 할 수 있고 사이트에서 당신의 레벨 클리어를 제출할 수 있습니다\n• `!add LEV-ELC-ODE level name` 을 사용하여 레벨을 제출할 수 있습니다.\n\n이것은 기계 번역입니다. 번역이 틀렸다면 알려주십시오. <:SpigRobo:628051703320805377>',
      });
    })
    .then(() => {
      return knex('default_strings').where('name', 'no.help').update({
        message:
          '\n• For å gjøre noe, må du registrere deg først ved bruk av `!register` i {{{RegistrationChannel}}} .\n• for og få en liste av leveler gå til {{TeamURI}}/levels.\n• Etter det kan du sende inn dine clears på leveler ved bruk av `!clear LEV-ELC-ODE` i {{{LevelClearChannel}}}\n• Du kan også bruke `!login` og sende inn dine clears på nettsiden\n• Du kan sende inn dine leveler ved bruk av `!add LEV-ELC-ODE level navn` i {{{LevelSubmissionChannel}}}',
      });
    })
    .then(() => {
      return knex('default_strings').where('name', 'fr.help').update({
        message:
          '\n• Avant tout, il faut faire la commande `!register` dans {{{RegistrationChannel}}}.\n• Pour accéder à la liste des niveaux va sur {{TeamURI}}/levels.\n• Quand tu bats un niveau de la liste, fais `!clear LEV-ELC-ODE` dans {{{LevelClearChannel}}}.\n• Tu peux aussi faire !login et mettre les niveaux que tu as battu directement sur le site.\n• Si tu veux proposer un niveau, fais `!add LEV-ELC-ODE nom` dans {{{LevelSubmissionChannel}}}.',
      });
    })
    .then(() => {
      return knex('default_strings').where('name', 'de.help').update({
        message:
          '\n• Um loszulegen musst du dich zuerst registrieren, indem du `!register` in dem {{{RegistrationChannel}}} benutzt.\n• Eine Liste mit allen Leveln findest du unter {{TeamURI}}/levels.\n• Den Abschluss eines Levels kannst du mit `!clear LEV-ELC-ODE` in dem {{{LevelClearChannel}}} übermitteln.\n• Du kannst auch !login benutzen, um den Abschluss eines Levels stattdessen über die Webseite zu bestätigen.\n• Dein eigenes Level kannst du mit `!add LEV-ELC-ODE level name` in dem {{{LevelSubmissionChannel}}} einreichen.',
      });
    })
    .then(() => {
      return knex('default_strings').where('name', 'es.help').update({
        message:
          '\n• Para comenzar, primero tienes que registrarte usando !register en {{{RegistrationChannel}}}.\n• Para agarrar una lista de niveles visita {{TeamURI}}/levels.\n• Puedes enviar los niveles completados usando !clear LEV-ELC-ODE en {{{LevelClearChannel}}}.\n• También puedes usar !login y enviar los niveles completados del sitio web.\n• Puedes enviar un nuevo nivel usando !add LEV-ELC-ODE en {{{LevelSubmissionChannel}}}.',
      });
    })
    .then(() => {
      return knex('default_strings').where('name', 'se.help').update({
        message:
          '\n• För att göra någonting, måste du registrera dig först genom att använda !register i {{{RegistrationChannel}}}.\n• För att få en lista av banor gå till {{TeamURI}}/levels.\n• Sedan kan du nu skicka in dina clears av banor genom att använda !clear LEV-ELC-ODE i {{{LevelClearChannel}}}.\n• Du kan också använda !login och skicka in dina clears på hemsidan.\n• Du kan skicka in en bana genom att använda !add LEV-ELC-ODE och namnet på banan i {{{LevelSubmissionChannel}}}.',
      });
    })
    .then(() => {
      return knex('default_strings')
        .where('name', 'help.commands')
        .update({
          message:
            "Here's a list of all of your available commands (the most important ones are underlined). To get a detailed explanation for a certain command use `!help <commandname>`.",
        });
    })
    .then(() => {
      return knex('default_strings')
        .where('name', 'help.discuss')
        .del();
    })
    .then(() => {
      return knex('commands').where('name', 'discuss').del();
    })
    .then(() => {
      return knex('commands').insert({
        name: 'fixdiscuss',
        format: '!fixdiscuss',
        aliases: 'discusschannel,discuss',
        category: 'mods',
      });
    });
};
