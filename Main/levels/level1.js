// =====================================================================
//  ДОМ ЧАСОВЩИКА — Глава 1: «Три двери»
// ---------------------------------------------------------------------
//  Это файл уровня. Здесь описано ВСЁ, что есть в главе:
//  карта дома, предметы, записки, загадки и подсказки.
//
//  Его можно менять, не трогая остальной код игры!
//  Попробуй, например:
//    • поменять код замка у двери №2 (и не забудь табличку под портретом);
//    • переставить ключ в другой ящик комода;
//    • изменить порядок символов в шкатулке (и рисунок на доске);
//    • дописать свои записки дедушки.
// =====================================================================

export const level = {
  id: "chapter1",

  // -------------------------------------------------------------------
  //  КАРТА. Каждый символ — одна клетка 1,5 × 1,5 метра.
  //  Смотрим на дом сверху: вверх — север, вправо — восток.
  //
  //   #  стена
  //   h  прихожая        l  библиотека
  //   c  коридор         w  мастерская
  //   D  дверь (настраивается ниже, в списке doors)
  //   e  лестница вниз — конец главы
  // -------------------------------------------------------------------
  map: [
    "#######################",
    "#hhhh#lllllll#wwwwww###",
    "#hhhh#lllllll#wwwwww###",
    "#hhhhDlllllll#wwwwwwDe#",
    "#hhhh#lllllll#wwwwww###",
    "#hhhh#lllllll#wwwwww###",
    "#########D######c######",
    "#########c######c######",
    "#########cccccccc######",
    "#######################",
  ],

  // Где появляется Роберт. x, z — клетки карты (можно с дробью),
  // angle — куда он смотрит в градусах: 0 — север, 90 — запад, 180 — юг, -90 — восток.
  start: { x: 2.5, z: 5.2, angle: 0 },

  // -------------------------------------------------------------------
  //  ДВЕРИ. cell — клетка с буквой D на карте (сначала x, потом z).
  //  side — с какой стороны к двери подходит игрок ("N", "S", "W", "E").
  //  lock — какой замок:
  //     { type: "key",   item: "..." }        — нужен ключ
  //     { type: "code",  code: "...." }       — кодовый замок с цифрами
  //     { type: "gears", items: [...] }       — механизм из шестерёнок
  // -------------------------------------------------------------------
  doors: [
    { id: "door1", number: 1, cell: [5, 3], side: "W",
      lock: { type: "key", item: "brass_key" } },
    { id: "door2", number: 2, cell: [9, 6], side: "N",
      lock: { type: "code", code: "1987" } },
    { id: "door3", number: 3, cell: [20, 3], side: "W",
      lock: { type: "gears", items: ["gear_small", "gear_medium", "gear_large"] } },
  ],

  // -------------------------------------------------------------------
  //  ПРЕДМЕТЫ, которые можно положить в инвентарь.
  //  icon — картинка в инвентаре: "key" или "gear".
  // -------------------------------------------------------------------
  items: {
    brass_key:   { icon: "key",  name: { ru: "Латунный ключ", en: "Brass key" },
                   about: { ru: "Тяжёлый старинный ключ. На бирке цифра 1.", en: "A heavy old key. The tag says 1." } },
    gear_small:  { icon: "gear", size: 0.07, name: { ru: "Маленькая шестерёнка", en: "Small gear" },
                   about: { ru: "Блестящая латунная шестерёнка.", en: "A shiny brass gear." } },
    gear_medium: { icon: "gear", size: 0.095, name: { ru: "Средняя шестерёнка", en: "Medium gear" },
                   about: { ru: "Шестерёнка с аккуратными зубчиками.", en: "A gear with neat little teeth." } },
    gear_large:  { icon: "gear", size: 0.12, name: { ru: "Большая шестерёнка", en: "Large gear" },
                   about: { ru: "Самая большая из трёх шестерёнок.", en: "The biggest of the three gears." } },
  },

  // -------------------------------------------------------------------
  //  ЗАПИСКИ. Всё, что Роберт прочитал, попадает в дневник.
  // -------------------------------------------------------------------
  notes: {
    letter: {
      title: { ru: "Письмо дедушки", en: "Grandpa's letter" },
      text: {
        ru: "Дорогой Роберт!\n\nЕсли ты читаешь это письмо — значит, я не успел вернуться. Не бойся. Всё, что тебе нужно, спрятано в этом доме.\n\nИди от двери к двери. Каждая дверь — это загадка, и каждую можно открыть, если смотреть внимательно.\n\nНачни с прихожей. Мой старый комод хранит больше, чем кажется.\n\nЯ верю в тебя.\nТвой дедушка",
        en: "Dear Robert,\n\nIf you are reading this letter, it means I did not make it back in time. Don't be afraid. Everything you need is hidden in this house.\n\nGo from door to door. Every door is a puzzle, and every one can be opened if you look carefully.\n\nStart in the hallway. My old chest of drawers keeps more than it seems.\n\nI believe in you.\nYour Grandpa",
      },
    },
    desk: {
      title: { ru: "Записка на столе", en: "Note on the desk" },
      text: {
        ru: "Роберт, вторую дверь я запер на кодовый замок.\n\nКод — это год, с которого всё началось: год, когда открылась моя мастерская.\n\nЯ так им горжусь, что не удержался и написал его прямо под своим портретом.",
        en: "Robert, I locked the second door with a code lock.\n\nThe code is the year it all began: the year my workshop opened.\n\nI am so proud of it that I could not resist writing it right under my portrait.",
      },
    },
    portrait: {
      title: { ru: "Табличка под портретом", en: "Plaque under the portrait" },
      text: {
        ru: "«Мастерская часов и механизмов.\nОснована в 1987 году».",
        en: "“Workshop of Clocks and Mechanisms.\nFounded in 1987.”",
      },
    },
    workshop: {
      title: { ru: "Записка на верстаке", en: "Note on the workbench" },
      text: {
        ru: "Механизм третьей двери остановился — из него пропали три шестерёнки.\n\nОдну я оставил прямо здесь, на верстаке. Вторую спрятал в ящик с инструментами. А третью запер в шкатулку с символами.\n\nКакие символы нажимать и в каком порядке — я нарисовал мелом на доске.",
        en: "The mechanism of the third door has stopped: three gears went missing.\n\nI left one right here on the workbench. I hid the second in the toolbox. And I locked the third in the box with symbols.\n\nWhich symbols to press, and in what order, I drew in chalk on the board.",
      },
    },
    chalkboard: {
      title: { ru: "Рисунок на доске", en: "Drawing on the board" },
      text: {
        ru: "На доске мелом: Луна → Звезда → Солнце.\nИ подпись: «Сначала ночь, потом звёзды, потом утро».",
        en: "Chalk on the board: Moon → Star → Sun.\nAnd a caption: “First the night, then the stars, then the morning.”",
      },
    },
  },

  // -------------------------------------------------------------------
  //  ЗАДАНИЯ И ПОДСКАЗКИ. Кнопка с лампочкой показывает подсказку
  //  к первому невыполненному заданию. done — какой флаг его выполняет.
  // -------------------------------------------------------------------
  objectives: [
    { done: "got:brass_key",
      hint: { ru: "Дедушка писал про старый комод в прихожей. Загляни в его ящики.",
              en: "Grandpa wrote about the old chest of drawers in the hallway. Look inside its drawers." } },
    { done: "open:door1",
      hint: { ru: "Ключ у тебя! Подойди к двери с номером 1 и нажми на замок.",
              en: "You have the key! Walk up to door number 1 and tap the lock." } },
    { done: "open:door2",
      hint: { ru: "Прочитай записку на столе в библиотеке. А потом посмотри на табличку под портретом над камином.",
              en: "Read the note on the library desk. Then look at the plaque under the portrait above the fireplace." } },
    { done: "open:door3",
      hint: { ru: "Нужны три шестерёнки: одна на верстаке, одна в ящике с инструментами, одна в шкатулке с символами. Порядок символов нарисован на доске.",
              en: "You need three gears: one on the workbench, one in the toolbox, one in the symbol box. The order of symbols is drawn on the board." } },
    { done: "chapter_end",
      hint: { ru: "Дверь открыта. Иди вперёд!", en: "The door is open. Go ahead!" } },
  ],

  // -------------------------------------------------------------------
  //  ОБСТАНОВКА. x, z — клетки карты, rot — поворот в градусах
  //  (0 — предмет смотрит на юг, 180 — на север, 90 — на восток, -90 — на запад).
  // -------------------------------------------------------------------
  objects: [
    // ---------- ПРИХОЖАЯ ----------
    { type: "rug", x: 2.9, z: 3.4, w: 3.2, d: 2.2, pattern: "red" },
    { type: "chandelier", x: 3.0, z: 3.4 },
    { type: "dresser", id: "dresser", x: 2.6, z: 1.17, rot: 0,
      drawers: [null, "brass_key", null] },          // что лежит в ящиках сверху вниз
    { type: "grandfatherClock", x: 1.14, z: 2.4, rot: 90 },
    { type: "sideTable", x: 1.3, z: 4.3, note: "letter" },
    { type: "coatRack", x: 4.6, z: 5.6 },
    { type: "frontDoor", x: 2.5, z: 6.0, rot: 180 },
    { type: "painting", x: 4.98, z: 1.9, rot: -90, y: 1.7, w: 0.8, h: 0.6, art: "landscape" },
    { type: "sconce", x: 4.97, z: 4.3, rot: -90 },

    // ---------- БИБЛИОТЕКА ----------
    { type: "fireplace", x: 9.5, z: 1.17, rot: 0 },
    { type: "portrait", id: "portrait", x: 9.5, z: 1.02, rot: 0, note: "portrait" },
    { type: "bookshelf", x: 7.15, z: 1.15, rot: 0 },
    { type: "bookshelf", x: 11.85, z: 1.15, rot: 0 },
    { type: "bookshelf", x: 12.85, z: 3.0, rot: -90 },
    { type: "bookshelf", x: 12.85, z: 4.5, rot: -90 },
    { type: "rug", x: 9.5, z: 2.6, w: 2.6, d: 1.7, pattern: "blue" },
    { type: "armchair", x: 8.35, z: 2.55, rot: 140 },
    { type: "armchair", x: 10.65, z: 2.55, rot: -140 },
    { type: "desk", x: 7.6, z: 4.8, rot: 180, note: "desk" },
    { type: "globe", x: 11.6, z: 5.2 },

    // ---------- КОРИДОР ----------
    { type: "window", x: 11.5, z: 8.98, rot: 180 },
    { type: "window", x: 14.5, z: 8.98, rot: 180 },
    { type: "sconce", x: 9.03, z: 7.6, rot: 90 },
    { type: "sconce", x: 13.0, z: 8.03, rot: 0 },
    { type: "painting", x: 15.0, z: 8.03, rot: 0, y: 1.7, w: 0.6, h: 0.8, art: "ship" },

    // ---------- МАСТЕРСКАЯ ----------
    { type: "workbench", x: 16.2, z: 1.24, rot: 0, item: "gear_small", note: "workshop" },
    { type: "hangingLamp", x: 16.2, z: 1.8 },
    { type: "toolShelf", x: 18.6, z: 1.12, rot: 0 },
    { type: "crate", x: 14.4, z: 2.0, rot: 10 },
    { type: "toolbox", id: "toolbox", x: 14.4, z: 2.0, y: 0.5, rot: 80, item: "gear_medium" },
    { type: "chalkboard", id: "chalkboard", x: 14.03, z: 4.2, rot: 90, note: "chalkboard",
      symbols: ["moon", "star", "sun"] },
    { type: "smallTable", x: 18.4, z: 5.35, rot: 0 },
    { type: "symbolBox", id: "symbolbox", x: 18.4, z: 5.35, y: 0.75, rot: 180,
      buttons: ["sun", "moon", "star"],              // как кнопки стоят на шкатулке
      order: ["moon", "star", "sun"],                // в каком порядке их нажимать
      item: "gear_large" },
    { type: "wallClocks", x: 18.3, z: 5.97, rot: 180 },
    { type: "gearDecor", x: 19.97, z: 1.8, rot: -90 },
    { type: "lamp", x: 19.4, z: 4.3, color: "#ffb36b", power: 6 },
  ],

  // Текст в конце главы
  ending: {
    title: { ru: "Глава 1 пройдена!", en: "Chapter 1 complete!" },
    text: {
      ru: "За третьей дверью каменная лестница уходит вниз, в темноту подвала. Оттуда доносится странное уханье…\n\nДедушка где-то там. И кажется, дом охраняет кто-то ещё.\n\nПродолжение следует: Глава 2 — «Подвал и Страж».",
      en: "Behind the third door, a stone staircase leads down into the darkness of the cellar. A strange hooting comes from below…\n\nGrandpa is somewhere down there. And it seems something else is guarding the house.\n\nTo be continued: Chapter 2 — “The Cellar and the Guardian”.",
    },
  },
};
