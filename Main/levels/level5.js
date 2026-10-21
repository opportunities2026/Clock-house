// =====================================================================
//  ДОМ ЧАСОВЩИКА — Глава 5: «Механическая оранжерея»
// ---------------------------------------------------------------------
//  Оранжерея на крыше. Здесь никто не гонится — зато загадки самые хитрые.
//  Выход — по подъёмному мосту через канал. Но у рычага моста нет рукоятки…
//
//  Цепочка:
//    пятнашки на шкатулке → два куска письма
//    цветы в горшках (цвет + знак) → провода двери №12
//    6 кусков письма → уравнения → код сейфа в насосной
//    сейф → рукоятка насоса → насос осушает фонтан → ключ со дна
//    свеча клонится к шатающемуся кирпичу → за ним скважина → тайная комната
//    тайная комната → рукоятка рычага → мост опускается → выход
//
//  Что можно поменять:
//    • цвета и знаки цветов (FLOWERS) — провода на двери поменяются сами;
//    • уравнения в письме (notes.torn) и код сейфа (SAFE_CODE).
// =====================================================================

// Какой цветок под каким знаком растёт — так же подключаются провода
const FLOWERS = { red: "moon", blue: "planet", yellow: "sun", white: "star", purple: "comet" };
const HEX = { red: "#c8302a", blue: "#2a5ad0", yellow: "#e8b820", white: "#f0f0e8", purple: "#8a3ac0" };
const SAFE_CODE = "9673";

export const level = {
  id: "chapter5",
  title: { ru: "Глава 5 · Механическая оранжерея", en: "Chapter 5 · The Mechanical Greenhouse" },
  next: "chapter6",

  // g — оранжерея, p — насосная, s — тайная комната, u — лестница к гнезду
  map: [
    "######################",
    "#sss#gggggggggg#ppppp#",
    "#sss#gggggggggg#ppppp#",
    "#sssDggggggggggDppppp#",
    "#sss#gggggggggg#ppppp#",
    "#####gggggggggg#ppppp#",
    "#####gggggggggg#######",
    "#####gggggggggg#######",
    "#####gggggggggg#######",
    "#####ggggggggggu######",
    "######################",
  ],
  themes: { g: "garden", p: "mech", s: "secret" },
  stoneFloors: "u",
  endCells: "u",

  start: { x: 7.0, z: 2.6, angle: 180 },
  checkpoints: [
    { x: 7.0, z: 2.6, angle: 180 },
  ],

  doors: [
    { id: "door12", number: 12, cell: [15, 3], side: "W",
      lock: { type: "wires", colors: ["red", "blue", "yellow", "white", "purple"], symbols: ["sun", "moon", "star", "comet", "planet"], answer: FLOWERS } },
    { id: "secretdoor", secret: true, theme: "garden", cell: [4, 3], side: "E",
      lock: { type: "brick", item: "fountain_key", x: 0.3, y: 0.55 } },
  ],

  items: {
    piece1: { icon: "piece", name: { ru: "Кусок письма (1)", en: "Letter scrap (1)" }, about: { ru: "Обрывок письма.", en: "A scrap of a letter." } },
    piece2: { icon: "piece", name: { ru: "Кусок письма (2)", en: "Letter scrap (2)" }, about: { ru: "Обрывок письма.", en: "A scrap of a letter." } },
    piece3: { icon: "piece", name: { ru: "Кусок письма (3)", en: "Letter scrap (3)" }, about: { ru: "Обрывок письма.", en: "A scrap of a letter." } },
    piece4: { icon: "piece", name: { ru: "Кусок письма (4)", en: "Letter scrap (4)" }, about: { ru: "Обрывок письма.", en: "A scrap of a letter." } },
    piece5: { icon: "piece", name: { ru: "Кусок письма (5)", en: "Letter scrap (5)" }, about: { ru: "Обрывок письма.", en: "A scrap of a letter." } },
    piece6: { icon: "piece", name: { ru: "Кусок письма (6)", en: "Letter scrap (6)" }, about: { ru: "Обрывок письма.", en: "A scrap of a letter." } },
    pump_handle:  { icon: "handle", name: { ru: "Рукоятка насоса", en: "Pump handle" },
                    about: { ru: "Железная рукоятка с деревянной ручкой. Лежала в сейфе.", en: "An iron crank with a wooden grip. It was in the safe." } },
    fountain_key: { icon: "key", name: { ru: "Ключ со дна фонтана", en: "Key from the fountain" },
                    about: { ru: "Позеленевший от воды ключ. Для какого он замка?", en: "A key turned green by the water. Which lock is it for?" } },
    lever_handle: { icon: "handle", name: { ru: "Рукоятка рычага", en: "Lever handle" },
                    about: { ru: "Рукоятка из тайной комнаты. Подойдёт к рычагу моста.", en: "A handle from the secret room. It fits the bridge lever." } },
  },

  introNote: "intro",

  notes: {
    intro: {
      title: { ru: "Оранжерея", en: "The Greenhouse" },
      text: {
        ru: "Тёплый влажный воздух. Стеклянные стены запотели, за ними — ночь.\n\nЧерез всю оранжерею тянется канал с чёрной водой. На том берегу — лестница к гнезду Вороны. Но мост поднят, а у рычага нет рукоятки.\n\nДедушка всегда говорил: «В моей оранжерее ничего не лежит просто так».",
        en: "Warm, damp air. The glass walls are fogged up, and beyond them is the night.\n\nA canal of black water runs right across the greenhouse. On the far side are the stairs to the Crow's nest. But the bridge is raised, and its lever has no handle.\n\nGrandpa always said: “Nothing in my greenhouse is there by accident.”",
      },
    },
    flowers: {
      title: { ru: "Записка у насосной", en: "Note by the pump room" },
      text: {
        ru: "Провода в насосной я подключил так же, как растут мои цветы.\n\nКаждый цветок — свой цвет, и каждый растёт под своим знаком.",
        en: "I wired the pump room the same way my flowers grow.\n\nEach flower has its own colour, and each grows under its own sign.",
      },
    },
    torn: {
      title: { ru: "Письмо дедушки", en: "Grandpa's letter" },
      text: {
        ru: "Сейф в насосной: код — четыре ответа по порядку.\n3x − 7 = 20\n2x + 5 = 17\n(x − 4) · 5 = 15\n4x : 2 = 6\nНасос осушит фонтан. Ключ со дна откроет то, что прячет сквозняк.",
        en: "The safe in the pump room: the code is four answers in order.\n3x − 7 = 20\n2x + 5 = 17\n(x − 4) · 5 = 15\n4x : 2 = 6\nThe pump will drain the fountain. The key at the bottom opens what the draught is hiding.",
      },
    },
    crowPlan: {
      title: { ru: "Чертёж Вороны", en: "The Crow's blueprint" },
      text: {
        ru: "«В-1. Ворона. Первая и самая неудачная моя машина.\n\nЯ хотел сделать сторожа, а вышел вор: она тащит в гнездо всё блестящее. Злая, быстрая, видит в темноте.\n\nСлабость: блестящее. Положи что-то блестящее в клетку — Ворона забудет обо всём и залезет туда сама. Тогда клетку можно захлопнуть.\n\nЕсли она меня когда-нибудь утащит — ищите меня в её гнезде под самой крышей.»",
        en: "“C-1. The Crow. My first and worst machine.\n\nI wanted to build a guard, but I built a thief: it drags everything shiny back to its nest. Wicked, fast, and it sees in the dark.\n\nWeakness: shiny things. Put something shiny in a cage and the Crow will forget everything and climb in by itself. Then the cage can be slammed shut.\n\nIf it ever carries me off, look for me in its nest right under the roof.”",
      },
    },
  },

  objectives: [
    { done: "open:slider",
      hint: [{ ru: "На столике стоит шкатулка с картинкой из квадратиков. Что-то в ней не так.", en: "There's a box on a little table with a picture made of squares. Something's wrong with it." },
             { ru: "Это пятнашки: нажимай на плитку рядом с пустым местом — она сдвинется. Собери розу, пустое место — внизу справа.", en: "It's a sliding puzzle: tap a tile next to the empty space to slide it. Put the rose back together; the empty space goes bottom right." }] },
    { done: "open:door12",
      hint: [{ ru: "У двери насосной висит записка. Провода подключаются «как растут цветы».", en: "There's a note by the pump room door. The wires go “the way the flowers grow”." },
             { ru: "У северной стены стоят горшки: у каждого цветка свой цвет, а на горшке нарисован знак. Подключи провод того же цвета к тому же знаку.", en: "Pots stand along the north wall: each flower has a colour and a sign is painted on its pot. Connect the wire of that colour to that sign." }] },
    { done: "letter_done",
      hint: [{ ru: "Письмо порвано на 6 кусков. Они разбросаны по оранжерее и насосной. Собирать — на столе в насосной.", en: "The letter is torn into 6 scraps, scattered around the greenhouse and the pump room. Put it together on the table in the pump room." },
             { ru: "Два куска в шкатулке с пятнашками, один в горшке без цветка, один под скамейкой, один на полке и один на ящике в насосной.", en: "Two scraps are in the sliding-puzzle box, one in the pot with no flower, one under the bench, one on the shelf and one on the crate in the pump room." }] },
    { done: "open:safe",
      hint: [{ ru: "Реши уравнения из письма — ответы и есть код сейфа.", en: "Solve the equations in the letter: the answers are the safe code." },
             { ru: "3x − 7 = 20 → 3x = 27 → x = 9. Остальные: 6, 7, 3. Код: 9673.", en: "3x − 7 = 20 → 3x = 27 → x = 9. The others: 6, 7, 3. The code is 9673." }] },
    { done: "pumped",
      hint: [{ ru: "Рукоятка из сейфа подойдёт к насосу.", en: "The handle from the safe fits the pump." },
             { ru: "Вставь рукоятку в насос у стены насосной и покрути её. Вода уйдёт из фонтана.", en: "Put the handle into the pump by the pump room wall and turn it. The water will drain from the fountain." }] },
    { done: "got:fountain_key",
      hint: [{ ru: "Фонтан пуст! На дне что-то блестит.", en: "The fountain is empty! Something is shining at the bottom." }] },
    { done: "open:secretdoor",
      hint: [{ ru: "«То, что прячет сквозняк». Посмотри на огонь свечей — какой из них неспокоен?", en: "“What the draught is hiding.” Look at the candle flames: which one isn't still?" },
             { ru: "Пламя свечи у западной стены клонится в сторону. Иди туда, куда оно показывает, и ищи кирпич, который чуть торчит, низко у пола.", en: "The flame of the candle by the west wall leans sideways. Go where it points and look for a brick that sticks out a little, low down." }] },
    { done: "got:lever_handle",
      hint: [{ ru: "Тайная комната! Осмотри её.", en: "A secret room! Search it." }] },
    { done: "bridge_down",
      hint: [{ ru: "Вставь рукоятку в рычаг у канала и опусти мост.", en: "Put the handle into the lever by the canal and lower the bridge." }] },
    { done: "chapter_end",
      hint: [{ ru: "Перейди по мосту и поднимайся к гнезду!", en: "Cross the bridge and climb up to the nest!" }] },
  ],

  objects: [
    // ---------- ОРАНЖЕРЕЯ ----------
    { type: "slidingBox", id: "slider", x: 7.0, z: 1.25, rot: 0, contents: ["piece1", "piece2"] },
    { type: "fountain", id: "fountain", x: 10.0, z: 4.0, item: "fountain_key", flag: "pumped" },
    // цветы: порядок вдоль стены не такой, как на щитке
    { type: "flowerPot", x: 9.3, z: 1.3, color: HEX.yellow, symbol: FLOWERS.yellow },
    { type: "flowerPot", x: 10.2, z: 1.3, color: HEX.purple, symbol: FLOWERS.purple },
    { type: "flowerPot", x: 11.1, z: 1.3 },
    { type: "flowerPot", x: 12.0, z: 1.3, color: HEX.red, symbol: FLOWERS.red },
    { type: "flowerPot", x: 12.9, z: 1.3, color: HEX.white, symbol: FLOWERS.white },
    { type: "flowerPot", x: 13.8, z: 1.3, color: HEX.blue, symbol: FLOWERS.blue },
    { type: "flowerPot", x: 14.6, z: 5.5, item: "piece5" },
    { type: "wallNote", x: 14.98, z: 2.4, rot: -90, note: "flowers" },
    // свечи: у одной пламя клонится к тайной двери
    { type: "candle", x: 5.55, z: 2.0, leanTo: [5.0, 3.3] },
    { type: "candle", x: 14.5, z: 6.4 },
    { type: "candle", x: 8.6, z: 1.3 },
    { type: "bench", x: 12.2, z: 6.3, rot: 180 },
    { type: "itemOn", item: "piece4", x: 12.4, z: 6.25 },
    { type: "bench", x: 7.6, z: 5.6, rot: 90 },
    { type: "bigPlant", x: 5.6, z: 1.5 },
    { type: "bigPlant", x: 5.7, z: 5.6 },
    { type: "bigPlant", x: 14.3, z: 3.9 },
    { type: "bigPlant", x: 5.7, z: 9.3 },
    { type: "bigPlant", x: 9.5, z: 9.4 },
    { type: "canal", cells: [[5, 7], [6, 7], [7, 7], [8, 7], [9, 7], [10, 7], [11, 7], [12, 7], [13, 7], [14, 7]], bridge: [9, 7], flag: "bridge_down" },
    { type: "bridgeLever", id: "lever", x: 10.6, z: 6.6, rot: 180, item: "lever_handle", flag: "bridge_down" },
    { type: "lamp", x: 7.5, z: 3.5, color: "#7a9aff", power: 2.5 },
    { type: "lamp", x: 12.5, z: 3.5, color: "#7a9aff", power: 2.5 },
    { type: "lamp", x: 10.0, z: 8.5, color: "#7a9aff", power: 2.5 },
    { type: "oilLamp", x: 14.5, z: 8.5 },
    { type: "oilLamp", x: 5.5, z: 6.5 },

    // ---------- НАСОСНАЯ ----------
    { type: "pump", id: "pump", x: 20.83, z: 3.5, rot: -90, item: "pump_handle", flag: "pumped" },
    { type: "cabinet", id: "safe", x: 18.5, z: 1.15, rot: 0, w: 0.7, h: 0.8, color: "#2a2a30",
      lock: { type: "code", code: SAFE_CODE }, contents: ["pump_handle"] },
    { type: "letterBoard", id: "letter", x: 18.2, z: 4.0, rot: 0, cols: 3, rows: 2,
      pieces: ["piece1", "piece2", "piece3", "piece4", "piece5", "piece6"], note: "torn", flag: "letter_done" },
    { type: "shelf", x: 16.6, z: 5.88, rot: 180, item: "piece3" },
    { type: "crate", x: 20.3, z: 5.4, rot: 10 },
    { type: "itemOn", item: "piece6", x: 20.3, z: 5.4, y: 0.5 },
    { type: "pipes", x: 18.5, z: 5.98, rot: 180 },
    { type: "gearDecor", x: 16.02, z: 1.8, rot: 90 },
    { type: "hangingLamp", x: 18.5, z: 3.5, power: 7 },

    // ---------- ТАЙНАЯ КОМНАТА ----------
    { type: "pedestal", x: 2.5, z: 2.6, item: "lever_handle", note: "crowPlan" },
    { type: "candle", x: 1.5, z: 1.5 },
    { type: "candle", x: 3.5, z: 4.4 },
    { type: "cobweb", x: 1.0, z: 1.0, corner: "nw" },
    { type: "cobweb", x: 4.0, z: 5.0, corner: "se" },

    { type: "cat", spots: [
      { x: 8.0, z: 2.0, rot: -30, until: "open:slider",
        hint: { ru: "Тик трогает лапой шкатулку с розой и двигает квадратики.", en: "Tik paws at the box with the rose and pushes the little squares around." } },
      { x: 11.5, z: 2.2, rot: 180, until: "open:door12",
        hint: { ru: "Тик нюхает цветы по очереди. Чихает на каждом — и смотрит на знак на горшке.", en: "Tik sniffs the flowers one by one. He sneezes at each one and looks at the sign on the pot." } },
      { x: 9.0, z: 5.6, rot: 30, until: "pumped",
        hint: { ru: "Тик сидит на бортике фонтана и пытается достать что-то со дна. Лапу мочить не хочет.", en: "Tik sits on the edge of the fountain trying to reach something at the bottom. He doesn't want to get his paw wet." } },
      { x: 6.0, z: 3.0, rot: -90, until: "open:secretdoor",
        hint: { ru: "Шерсть у Тика шевелится от сквозняка. Он смотрит на стену и тихо урчит.", en: "Tik's fur ruffles in a draught. He stares at the wall and purrs quietly." } },
      { x: 9.5, z: 6.4, rot: 0, until: "chapter_end",
        hint: { ru: "Тик ждёт у канала. Плавать он не умеет.", en: "Tik waits by the canal. He can't swim." } },
    ] },
  ],

  ending: {
    title: { ru: "Глава 5 пройдена!", en: "Chapter 5 complete!" },
    text: {
      ru: "Мост с грохотом лёг через канал. Роберт перебежал на другой берег и начал подниматься по узкой железной лестнице.\n\nСверху доносится скрежет когтей по железу и… дедушкин голос:\n«Роберт! Не подходи, она здесь!»\n\nДальше: Глава 6 — «Гнездо Вороны».",
      en: "The bridge crashed down across the canal. Robert ran to the other side and started up a narrow iron staircase.\n\nFrom above comes the scrape of claws on iron and… Grandpa's voice:\n“Robert! Stay back, it's here!”\n\nNext: Chapter 6 — “The Crow's Nest”.",
    },
  },
};
