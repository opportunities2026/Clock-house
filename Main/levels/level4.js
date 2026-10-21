// =====================================================================
//  ДОМ ЧАСОВЩИКА — Глава 4: «Обсерватория»
// ---------------------------------------------------------------------
//  Дедушки в обсерватории нет — его унесла огромная механическая Ворона.
//  Роберт идёт по следу: кабинет, мышиные ходы и мастерская.
//  В мастерской живёт стая механических мышей!
//
//  Цепочка загадок (каждая открывает следующую):
//    телескоп → ключик от ящика стола
//    звёздная карта (оборот) → провода двери №9
//    ящик стола → кусок письма + ключ от стеклянного шкафа (он в обсерватории!)
//    4 куска письма → примеры → код двери №10
//    пластинка в тупике → фонограф в обсерватории → код шкафа в мастерской
//    предохранитель → дверь №11 (и мыши просыпаются!)
//
//  Что можно поменять:
//    • провода (WIRES) — схема на обороте карты нарисуется сама;
//    • примеры в письме (notes.torn) и код двери №10;
//    • сколько ламп горит в обсерватории (oilLamp, lit) — тогда поменяй CABINET_CODE.
// =====================================================================

// Какой цвет к какому знаку подключать
const WIRES = { red: "comet", blue: "sun", yellow: "moon", green: "star" };
const COLORS = ["red", "blue", "yellow", "green"];
const SYMBOLS = ["sun", "moon", "star", "comet"];
// Норок в мастерской 6, горящих ламп в обсерватории 3: 6, 3 и 6 × 3 = 18
const CABINET_CODE = "6318";

export const level = {
  id: "chapter4",
  title: { ru: "Глава 4 · Обсерватория", en: "Chapter 4 · The Observatory" },
  next: null,

  // o — обсерватория, a — кабинет, y — мышиные ходы, x — мастерская, u — лестница на крышу
  map: [
    "########################",
    "#oooooo#aaaaa###########",
    "#oooooo#aaaaa###########",
    "#ooooooDaaaaa###########",
    "#oooooo#aaaaa###########",
    "#oooooo#aaaaa###########",
    "#oooooo###D#############",
    "##########y#####xxxxxx##",
    "####yyy#yyy#yyyyxxxxxx##",
    "####y#y#y#####y#xxxxxx##",
    "#uDyy#yyy#yyyyy#xxxxxx##",
    "####y###y#y###y#xxxxxx##",
    "####yyyyy#yyyyyyxxxxxx##",
    "####y#y#y###y#y#xxxxxx##",
    "####yyyyyyyyyyy#########",
    "########################",
  ],
  themes: { o: "stars", a: "library", y: "cellar", x: "mech" },
  stoneFloors: "yu",
  endCells: "u",

  start: { x: 3.5, z: 5.6, angle: 0 },
  checkpoints: [
    { x: 3.5, z: 5.6, angle: 0 },
    { flag: "open:door10", x: 10.5, z: 4.6, angle: 180 },
    { flag: "got:fuse", x: 18.5, z: 9.5, angle: 90 },
  ],

  doors: [
    { id: "door9", number: 9, cell: [7, 3], side: "W",
      lock: { type: "wires", colors: COLORS, symbols: SYMBOLS, answer: WIRES } },
    { id: "door10", number: 10, cell: [10, 6], side: "N",
      lock: { type: "code", code: "2745" } },
    { id: "door11", number: 11, cell: [2, 10], side: "E",
      lock: { type: "socket", item: "fuse" } },
  ],

  // Мыши спят в норах мастерской, пока Роберт не возьмёт предохранитель
  mice: { trigger: "got:fuse", cells: "xy", count: 26, speed: 2.6 },

  items: {
    desk_key:  { icon: "key", name: { ru: "Крошечный ключик", en: "Tiny key" },
                 about: { ru: "Был спрятан в лючке телескопа. Подходит к маленькому замку.", en: "It was hidden in the telescope's hatch. It fits a small lock." } },
    glass_key: { icon: "key", name: { ru: "Ключ со стёклышком", en: "Key with a glass bead" },
                 about: { ru: "На головке ключа — синее стёклышко, как на дверце шкафа в обсерватории.", en: "The key has a blue glass bead, just like the cabinet door in the observatory." } },
    piece1: { icon: "piece", name: { ru: "Кусок письма (1)", en: "Letter scrap (1)" }, about: { ru: "Обрывок дедушкиного письма.", en: "A scrap of Grandpa's letter." } },
    piece2: { icon: "piece", name: { ru: "Кусок письма (2)", en: "Letter scrap (2)" }, about: { ru: "Обрывок дедушкиного письма.", en: "A scrap of Grandpa's letter." } },
    piece3: { icon: "piece", name: { ru: "Кусок письма (3)", en: "Letter scrap (3)" }, about: { ru: "Обрывок дедушкиного письма.", en: "A scrap of Grandpa's letter." } },
    piece4: { icon: "piece", name: { ru: "Кусок письма (4)", en: "Letter scrap (4)" }, about: { ru: "Обрывок дедушкиного письма.", en: "A scrap of Grandpa's letter." } },
    record: { icon: "record", name: { ru: "Пластинка", en: "Record" },
              about: { ru: "Пластинка с дедушкиной записью. Мыши утащили её в нору.", en: "A record with Grandpa's voice. The mice dragged it away." } },
    fuse:   { icon: "fuse", name: { ru: "Предохранитель", en: "Fuse" },
              about: { ru: "Стеклянный предохранитель. Без него дверь №11 не откроется.", en: "A glass fuse. Door 11 won't open without it." } },
  },

  introNote: "intro",

  notes: {
    intro: {
      title: { ru: "Обсерватория", en: "The Observatory" },
      text: {
        ru: "Голос шёл из фонографа. Это была дедушкина запись — и она оборвалась на полуслове: пластинка соскочила и укатилась… прямо в щель под полом.\n\nКупол обсерватории разбит. На полу — чёрные железные перья. Огромные.\n\nДедушки здесь нет.",
        en: "The voice came from the phonograph. It was Grandpa's recording, and it broke off mid-word: the record jumped off and rolled away… right into a gap under the floor.\n\nThe observatory dome is smashed. Black iron feathers lie on the floor. Huge ones.\n\nGrandpa isn't here.",
      },
    },
    feather: {
      title: { ru: "Железное перо", en: "Iron feather" },
      text: {
        ru: "Перо длиной с руку, из чёрного железа. На стержне выбито: «В-1».\n\nДедушка рассказывал про свою первую машину — Ворону. Она вышла злой, и он запер её на крыше, в старой оранжерее…\n\nКажется, Ворона вырвалась. И унесла дедушку.",
        en: "A feather as long as your arm, made of black iron. Stamped on the shaft: “C-1”.\n\nGrandpa once told you about his very first machine: the Crow. It turned out wicked, and he locked it on the roof, in the old greenhouse…\n\nIt looks like the Crow broke free. And it carried Grandpa away.",
      },
    },
    torn: {
      title: { ru: "Письмо дедушки", en: "Grandpa's letter" },
      text: {
        ru: "Роберт, дверь №10 открывает код. Каждая цифра — ответ примера, по порядку:\n48 : 8 − 4\n(6 + 9) · 3 − 38\n100 − 12 · 8\nx + 15 = 20, найди x\nВ мастерской не шуми: там живут мыши.",
        en: "Robert, door 10 opens with a code. Each digit is the answer to a sum, in order:\n48 : 8 − 4\n(6 + 9) · 3 − 38\n100 − 12 · 8\nx + 15 = 20, find x\nBe quiet in the workshop: mice live there.",
      },
    },
    recording: {
      title: { ru: "Запись на пластинке", en: "The recording" },
      text: {
        ru: "(шипение)… Роберт, если ты слышишь это — Ворона близко. Я спрятал предохранитель в шкафу мастерской.\n\nКод шкафа я не записывал. Посчитай норы в мастерской — это первая цифра. Посчитай, сколько ламп горит здесь, в обсерватории, — вторая. А дальше — их произведение.\n\nКогда возьмёшь предохранитель, мыши проснутся. Беги к двери №11 и не останавливайся!… (шипение)",
        en: "(hiss)… Robert, if you can hear this, the Crow is close. I hid the fuse in the workshop cabinet.\n\nI never wrote the code down. Count the mouse holes in the workshop: that's the first digit. Count how many lamps are burning here in the observatory: that's the second. After that comes their product.\n\nWhen you take the fuse, the mice will wake up. Run to door 11 and don't stop!… (hiss)",
      },
    },
  },

  objectives: [
    { done: "open:door9",
      hint: [{ ru: "Дверь №9 с проводами. Схему дедушка всегда прятал там, где её не станут искать — на обороте чего-то.", en: "Door 9 has wires. Grandpa always hid his diagrams where nobody would look: on the back of something." },
             { ru: "Нажми на звёздную карту на стене — она перевернётся. На обороте схема: какой цвет к какому знаку. Знаки на щитке стоят в другом порядке!", en: "Tap the star chart on the wall and it flips over. The back shows which colour goes to which sign. The signs on the panel are in a different order!" }] },
    { done: "open:deskdrawer",
      hint: [{ ru: "Ящик в кабинете заперт на крошечный замок. Дедушка любил прятать мелочи в своих приборах.", en: "The drawer in the study has a tiny lock. Grandpa liked to hide small things inside his instruments." },
             { ru: "Подойди к телескопу и осмотри его трубу: сбоку есть лючок. Внутри — ключик.", en: "Go to the telescope and look closely at its tube: there's a little hatch on the side with a key inside." }] },
    { done: "letter_done",
      hint: [{ ru: "Письмо порвано на 4 куска. Ищи их в обеих комнатах, а потом сложи на столе с зелёным сукном.", en: "The letter is torn into 4 scraps. Look in both rooms, then put them together on the table with green cloth." },
             { ru: "Куски: в ящике стола, в стеклянном шкафу (ключ от него в ящике), в книге с пером на полке и под столом. На сукне нажми кусок, потом другой — поменяются; нажми дважды — повернётся.", en: "Scraps: in the desk drawer, in the glass cabinet (its key is in the drawer), in the book with a quill on the shelf and under the desk. On the cloth tap one scrap then another to swap; tap twice to rotate." }] },
    { done: "open:door10",
      hint: [{ ru: "Реши примеры из письма: каждый ответ — одна цифра кода двери №10.", en: "Solve the sums in the letter: each answer is one digit of door 10's code." },
             { ru: "Сначала умножение и деление, потом сложение и вычитание; скобки — первыми. Ответы: 2, 7, 4, 5.", en: "Multiplication and division first, then addition and subtraction; brackets come before everything. The answers are 2, 7, 4, 5." }] },
    { done: "played:phono",
      hint: [{ ru: "Пластинка укатилась в мышиные ходы. Обыщи тупики и верни её на фонограф.", en: "The record rolled into the mouse tunnels. Search the dead ends and put it back on the phonograph." },
             { ru: "Пластинка лежит в тупике у восточного края ходов, рядом с мастерской. Фонограф — в обсерватории.", en: "The record is in a dead end near the east side of the tunnels, next to the workshop. The phonograph is in the observatory." }] },
    { done: "got:fuse",
      hint: [{ ru: "Код шкафа в мастерской: норы, лампы и их произведение.", en: "The workshop cabinet code: holes, lamps and their product." },
             { ru: "Нор в мастерской 6, в обсерватории горят 3 лампы (одна погасла). 6 · 3 = 18. Код: 6318.", en: "There are 6 holes in the workshop and 3 burning lamps in the observatory (one is out). 6 · 3 = 18. The code is 6318." }] },
    { done: "open:door11",
      hint: [{ ru: "Беги к двери №11 на западе ходов! Если мыши догоняют — спрячься в шкаф.", en: "Run to door 11 in the west of the tunnels! If the mice catch up, hide in a wardrobe." },
             { ru: "Бегом: из мастерской на запад, вниз по ходам и на запад до самого конца. Вставь предохранитель в гнездо на двери.", en: "Run west out of the workshop, down through the tunnels and west to the very end. Put the fuse in the socket on the door." }] },
    { done: "chapter_end",
      hint: [{ ru: "Поднимайся по лестнице на крышу!", en: "Climb the stairs to the roof!" }] },
  ],

  objects: [
    // ---------- ОБСЕРВАТОРИЯ ----------
    { type: "telescope", id: "telescope", x: 4.2, z: 3.2, rot: 30, item: "desk_key" },
    { type: "starMap", id: "starmap", x: 3.0, z: 1.0, rot: 0, h: 1.6, symbols: SYMBOLS, colors: COLORS, answer: WIRES },
    { type: "phonograph", id: "phono", x: 6.5, z: 4.8, rot: -90, item: "record", note: "recording" },
    { type: "feather", x: 2.2, z: 3.4, rot: 40, note: "feather" },
    { type: "feather", x: 5.6, z: 2.0, rot: -70 },
    { type: "cabinet", id: "glasscab", x: 1.16, z: 4.6, rot: 90, color: "#2a3a5a",
      lock: { type: "key", item: "glass_key" }, contents: ["piece1"] },
    { type: "window", x: 5.5, z: 1.02, rot: 0 },
    // лампы: три горят, одна погасла (это важно!)
    { type: "oilLamp", x: 1.5, z: 1.5 },
    { type: "oilLamp", x: 6.5, z: 1.5 },
    { type: "oilLamp", x: 1.5, z: 6.5 },
    { type: "oilLamp", x: 6.5, z: 6.5, lit: false },
    { type: "lamp", x: 4.0, z: 4.0, color: "#6a8aff", power: 1.6 },
    { type: "cobweb", x: 7.0, z: 1.0, corner: "ne" },

    // ---------- КАБИНЕТ ----------
    { type: "desk", x: 10.5, z: 1.5, rot: 0 },
    { type: "itemOn", item: "piece4", x: 10.45, z: 1.62 },
    { type: "cabinet", id: "deskdrawer", x: 12.84, z: 3.6, rot: -90, w: 0.7, h: 0.5, d: 0.42, y0: 0.45,
      lock: { type: "key", item: "desk_key" }, contents: ["piece2", "glass_key"] },
    { type: "bookshelf", x: 9.0, z: 5.85, rot: 180 },
    { type: "secretBook", x: 9.25, z: 5.77, rot: 180, h: 1.24, item: "piece3", color: "#6a1a10" },
    { type: "letterBoard", id: "letter", x: 11.2, z: 4.0, rot: 0, pieces: ["piece1", "piece2", "piece3", "piece4"], note: "torn", flag: "letter_done" },
    { type: "globe", x: 8.6, z: 1.6 },
    { type: "armchair", x: 8.7, z: 3.4, rot: 120 },
    { type: "oilLamp", x: 12.5, z: 1.5, power: 2.5 },
    { type: "lamp", x: 10.5, z: 3.5, color: "#ffb36b", power: 2.5 },

    // ---------- МЫШИНЫЕ ХОДЫ ----------
    { type: "itemOn", item: "record", x: 12.4, z: 8.5 },
    { type: "cellarLamp", x: 10.02, z: 8.5, rot: 90, power: 3 },
    { type: "cellarLamp", x: 4.02, z: 10.5, rot: 90, power: 3 },
    { type: "cellarLamp", x: 9.0, z: 12.02, rot: 0, power: 2.5 },
    { type: "cellarLamp", x: 12.5, z: 14.98, rot: 180, power: 3 },
    { type: "cellarLamp", x: 14.98, z: 9.5, rot: -90, power: 2.5 },
    { type: "cellarLamp", x: 3.5, z: 9.98, rot: 0, power: 3, color: "#ff6040" },
    { type: "pipes", x: 6.5, z: 8.02, rot: 0 },
    { type: "cobweb", x: 4.0, z: 8.0, corner: "nw" },
    { type: "cobweb", x: 15.0, z: 15.0, corner: "se" },
    { type: "wardrobe", id: "wardrobe1", x: 4.5, z: 14.81, rot: 180 },
    { type: "wardrobe", id: "wardrobe2", x: 14.5, z: 14.81, rot: 180 },
    { type: "wardrobe", id: "wardrobe3", x: 8.19, z: 11.5, rot: 90 },
    { type: "stairsDecor", x: 1.5, z: 10.5, rot: -90 },

    // ---------- МАСТЕРСКАЯ ----------
    { type: "cabinet", id: "fusebox", x: 19.0, z: 7.15, rot: 0, w: 0.8, h: 0.9, color: "#3a2a1a",
      lock: { type: "code", code: CABINET_CODE }, contents: ["fuse"] },
    { type: "mouseHole", x: 17.0, z: 7.0, rot: 0 },
    { type: "mouseHole", x: 21.0, z: 7.0, rot: 0 },
    { type: "mouseHole", x: 17.8, z: 14.0, rot: 180 },
    { type: "mouseHole", x: 20.6, z: 14.0, rot: 180 },
    { type: "mouseHole", x: 22.0, z: 9.3, rot: -90 },
    { type: "mouseHole", x: 22.0, z: 12.2, rot: -90 },
    { type: "workbench", x: 21.5, z: 10.8, rot: -90 },
    { type: "toolShelf", x: 18.5, z: 13.85, rot: 180 },
    { type: "crate", x: 16.7, z: 13.2, rot: 15 },
    { type: "crate", x: 21.2, z: 13.1, rot: -20 },
    { type: "gearDecor", x: 20.5, z: 7.02, rot: 0 },
    { type: "hangingLamp", x: 18.5, z: 10.0, power: 8 },
    { type: "hangingLamp", x: 19.5, z: 12.5, power: 5 },

    { type: "cat", spots: [
      { x: 2.4, z: 2.0, rot: 150, until: "open:door9",
        hint: { ru: "Тик сидит под звёздной картой и трогает лапой её уголок, будто хочет перевернуть.", en: "Tik sits under the star chart and paws at its corner, as if he wants to turn it over." } },
      { x: 11.4, z: 2.6, rot: -150, until: "letter_done",
        hint: { ru: "Тик обнюхивает ящик стола, а потом смотрит на книжную полку. Там одна книга торчит, и из неё видно перо.", en: "Tik sniffs the desk drawer, then looks at the bookshelf. One book sticks out there with a quill poking from it." } },
      { x: 5.4, z: 5.4, rot: 60, until: "played:phono",
        hint: { ru: "Тик грустно сидит у пустого фонографа. Ему не хватает дедушкиного голоса.", en: "Tik sits sadly by the empty phonograph. He misses Grandpa's voice." } },
      { x: 11.0, z: 5.2, rot: 180, until: "got:fuse",
        hint: { ru: "Тик не хочет идти в мастерскую. Он боится мышей! Он машет хвостом: раз, два, три… и смотрит на лампы.", en: "Tik won't go into the workshop. He's scared of the mice! He swishes his tail: one, two, three… and looks at the lamps." } },
    ] },
  ],

  ending: {
    title: { ru: "Глава 4 пройдена!", en: "Chapter 4 complete!" },
    text: {
      ru: "Дверь №11 захлопнулась, и за ней стих писк сотен железных лапок.\n\nЛестница ведёт на крышу, в старую оранжерею. Оттуда тянет тёплым влажным воздухом и слышно, как журчат механические фонтаны.\n\nГде-то наверху хлопают огромные крылья.\n\nПродолжение следует: Глава 5 — «Механическая оранжерея».",
      en: "Door 11 slammed shut, and behind it the squeaking of hundreds of iron paws fell silent.\n\nThe stairs lead up to the roof, to the old greenhouse. Warm, damp air drifts down, and you can hear mechanical fountains gurgling.\n\nSomewhere above, huge wings are flapping.\n\nTo be continued: Chapter 5 — “The Mechanical Greenhouse”.",
    },
  },
};
