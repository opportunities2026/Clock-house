// =====================================================================
//  ДОМ ЧАСОВЩИКА — Глава 6: «Гнездо Вороны» (финал)
// ---------------------------------------------------------------------
//  Под самой крышей — гнездо огромной механической Вороны.
//  Дедушка висит в клетке под потолком. Ворона кружит рядом.
//
//  Цепочка:
//    ключ в маленьком гнезде Вороны → кладовая (дверь №14)
//    ящик с огоньками (зажги все) → золотые часы — блестящая приманка
//    приманка в клетку-ловушку → Ворона залезает сама, клетка захлопывается
//    бирки на проводах (примеры) → щиток лебёдки → ток
//    лебёдка опускает клетку → дедушка подсказывает, как найти код
//    блестяшки в большом гнезде × 125 → код замка → свобода!
//
//  Что можно поменять:
//    • примеры на бирках (notes.tags) и ответы на щитке (WIRES);
//    • сколько блестяшек в гнезде (shiny) — тогда поменяй CAGE_CODE (shiny × 125).
// =====================================================================

const WIRES = { red: "6", blue: "2", yellow: "9", green: "4" };
const SHINY = 7;
const CAGE_CODE = String(SHINY * 125); // 875

export const level = {
  id: "chapter6",
  title: { ru: "Глава 6 · Гнездо Вороны", en: "Chapter 6 · The Crow's Nest" },
  next: null,

  // b — лестничная площадка, n — гнездо Вороны, w — кладовая
  map: [
    "####################",
    "#bbb#nnnnnnnnnnnnnn#",
    "#bbbbnnnnnnnnnnnnnn#",
    "#bbb#nnnnnnnnnnnnnn#",
    "#####nn##nnnnn##nnn#",
    "#wwwDnn##nnnnn##nnn#",
    "#www#nnnnnnnnnnnnnn#",
    "#www#nnnnnnnnnnnnnn#",
    "#####nnnnnnnnnnnnnn#",
    "####################",
  ],
  themes: { b: "storage", n: "tower", w: "mech" },
  endFlag: "grandpa_free",

  start: { x: 2.0, z: 2.4, angle: -90 },
  checkpoints: [
    { x: 2.0, z: 2.4, angle: -90 },
    { flag: "open:door14", x: 2.5, z: 6.5, angle: -90 },
  ],

  doors: [
    { id: "door14", number: 14, cell: [4, 5], side: "E",
      lock: { type: "key", item: "iron_key" } },
  ],

  // Ворона летает только над гнездом (n). На площадку и в кладовую она не пролезает.
  crow: {
    cells: "n", start: [12, 5],
    route: [[6, 2], [12, 2], [17, 2], [17, 6], [12, 7], [6, 7], [6, 3]],
    speed: 1.7, chaseSpeed: 3.0, sight: 9, fov: 0.3, hearing: 5,
    trap: [17.6, 7.4], trapYaw: Math.PI, baitFlag: "bait_placed", trapFlag: "crow_trapped",
  },

  items: {
    iron_key:   { icon: "key", name: { ru: "Железный ключ", en: "Iron key" },
                  about: { ru: "Ворона утащила его в свой тайник. На бирке — 14.", en: "The Crow dragged it into its stash. The tag says 14." } },
    gold_watch: { icon: "watch", name: { ru: "Золотые часы", en: "Gold watch" },
                  about: { ru: "Дедушкины золотые часы. Блестят так, что глазам больно.", en: "Grandpa's gold watch. It shines so brightly it hurts your eyes." } },
  },

  introNote: "intro",

  notes: {
    intro: {
      title: { ru: "Гнездо", en: "The Nest" },
      text: {
        ru: "Чердак под самой крышей. Пахнет ржавчиной и машинным маслом. Где-то в темноте скрежещут огромные когти.\n\nПосреди чердака под потолком висит клетка. В ней — дедушка!\n\nНе высовывайся, пока не поймёшь, куда летает Ворона. Если она тебя заметит — беги сюда, на площадку, или прячься в ящик.",
        en: "An attic right under the roof. It smells of rust and machine oil. Somewhere in the dark, huge claws are scraping.\n\nA cage hangs from the ceiling in the middle of the attic. Grandpa is inside!\n\nStay out of sight until you know where the Crow flies. If it spots you, run back here to the landing or hide in a crate.",
      },
    },
    tags: {
      title: { ru: "Бирки на проводах", en: "Tags on the wires" },
      text: {
        ru: "Дедушкин почерк: «Лебёдку питает щиток на северной стене. Каждый провод подключи к числу — ответу примера на его бирке:\n\nкрасный: 7 · 8 − 50\nсиний: (24 + 12) : 18\nжёлтый: 3 · (15 − 12)\nзелёный: 100 : 25»",
        en: "Grandpa's handwriting: “The winch is powered by the panel on the north wall. Connect each wire to the number that answers the sum on its tag:\n\nred: 7 · 8 − 50\nblue: (24 + 12) : 18\nyellow: 3 · (15 − 12)\ngreen: 100 : 25”",
      },
    },
    grandpaTalk: {
      title: { ru: "Дедушка", en: "Grandpa" },
      text: {
        ru: "— Роберт! Ты пришёл! Какой же ты молодец…\n\nЗамок на клетке кодовый. Код знала только Ворона, но я подсмотрел, как она его придумала: сосчитай все блестящие вещи в её большом гнезде и умножь на 125.\n\nТолько считай внимательно!",
        en: "“Robert! You came! You're amazing…\n\nThe lock on the cage has a code. Only the Crow knew it, but I watched how it made it up: count all the shiny things in its big nest and multiply by 125.\n\nCount carefully!”",
      },
    },
  },

  objectives: [
    { done: "got:iron_key",
      hint: [{ ru: "Кладовая заперта. Ворона тащит всё блестящее в свои гнёзда — и ключи тоже.", en: "The storeroom is locked. The Crow drags everything shiny into its nests, keys included." },
             { ru: "Маленький тайник Вороны — в дальнем северо-восточном углу. Иди, когда Ворона улетит на юг.", en: "The Crow's small stash is in the far north-east corner. Go when the Crow flies south." }] },
    { done: "open:door14",
      hint: [{ ru: "Ключ подходит к двери №14 — она у площадки, чуть южнее.", en: "The key fits door 14, just south of the landing." }] },
    { done: "got:gold_watch",
      hint: [{ ru: "В кладовой — ящик с огоньками. Зажги все.", en: "There's a box of little lights in the storeroom. Turn them all on." },
             { ru: "Нажатие переключает лампочку и её соседей сверху, снизу, слева и справа. Пробуй нажимать на тёмные — и на те, что рядом с ними.", en: "A tap switches a light and its neighbours above, below, left and right. Try tapping the dark ones and the ones next to them." }] },
    { done: "crow_trapped",
      hint: [{ ru: "Вспомни чертёж Вороны: её слабость — всё блестящее.", en: "Remember the Crow's blueprint: its weakness is anything shiny." },
             { ru: "Положи золотые часы в большую клетку в юго-восточном углу и спрячься. Ворона залезет туда сама.", en: "Put the gold watch in the big cage in the south-east corner and hide. The Crow will climb in by itself." }] },
    { done: "power_on",
      hint: [{ ru: "Лебёдке нужен ток. Бирки на проводах — в записке на площадке.", en: "The winch needs power. The wire tags are in the note on the landing." },
             { ru: "Ответы: красный — 6, синий — 2, жёлтый — 9, зелёный — 4. Щиток — на северной стене.", en: "Answers: red is 6, blue is 2, yellow is 9, green is 4. The panel is on the north wall." }] },
    { done: "cage_down",
      hint: [{ ru: "Ток есть! Потяни рычаг лебёдки.", en: "There's power! Pull the winch lever." }] },
    { done: "grandpa_free",
      hint: [{ ru: "Сосчитай блестяшки в большом гнезде и умножь на 125.", en: "Count the shiny things in the big nest and multiply by 125." },
             { ru: "В гнезде 7 блестящих вещей. 7 · 125 = 875.", en: "There are 7 shiny things in the nest. 7 · 125 = 875." }] },
  ],

  objects: [
    // ---------- ПЛОЩАДКА ----------
    { type: "wallNote", x: 2.5, z: 1.02, rot: 0, note: "tags" },
    { type: "crate", x: 1.5, z: 3.4, rot: 10 },
    { type: "oilLamp", x: 3.5, z: 1.5 },
    { type: "stairsDecor", x: 1.5, z: 1.0, rot: 0 },
    { type: "cobweb", x: 1.0, z: 4.0, corner: "sw" },

    // ---------- КЛАДОВАЯ ----------
    { type: "lightsBox", id: "lightsbox", x: 2.0, z: 6.2, rot: 90, contents: ["gold_watch"] },
    { type: "oilLamp", x: 3.5, z: 7.5 },
    { type: "toolShelf", x: 2.0, z: 7.85, rot: 180 },
    { type: "gearDecor", x: 1.02, z: 7.0, rot: 90 },

    // ---------- ГНЕЗДО ----------
    { type: "cabinet", id: "winchpanel", x: 9.5, z: 1.15, rot: 0, w: 0.7, h: 0.8, color: "#2a2a30", flag: "power_on", openMsg: "powerOn",
      lock: { type: "wires", colors: ["red", "blue", "yellow", "green"], symbols: ["2", "4", "6", "9"], answer: WIRES } },
    { type: "winch", x: 12.0, z: 1.4, rot: 0, powerFlag: "power_on", flag: "cage_down" },
    { type: "grandpaCage", id: "cage", x: 12.0, z: 3.5, rot: 0, code: CAGE_CODE, flag: "grandpa_free", downFlag: "cage_down", note: "grandpaTalk" },
    { type: "nestPile", id: "nest", x: 11.5, z: 6.9, r: 1.0, shiny: SHINY },
    { type: "nestPile", id: "stash", x: 18.0, z: 1.6, r: 0.5, shiny: 0, item: "iron_key", seed: 9 },
    { type: "trapCage", x: 17.6, z: 7.4, rot: -90, item: "gold_watch", baitFlag: "bait_placed", trapFlag: "crow_trapped" },
    { type: "hideCrate", id: "hide1", x: 6.0, z: 8.7, rot: 180 },
    { type: "hideCrate", id: "hide2", x: 14.0, z: 8.7, rot: 180 },
    { type: "hideCrate", id: "hide3", x: 18.7, z: 4.5, rot: -90 },
    { type: "crate", x: 5.6, z: 4.6, rot: 25 },
    { type: "crate", x: 14.0, z: 6.0, rot: -15 },
    { type: "barrel", x: 9.6, z: 6.4 },
    { type: "gearDecor", x: 14.5, z: 1.02, rot: 0 },
    { type: "cobweb", x: 19.0, z: 1.0, corner: "ne" },
    { type: "cobweb", x: 5.0, z: 9.0, corner: "sw" },
    { type: "hangingLamp", x: 12.0, z: 5.5, power: 3 },
    { type: "lamp", x: 6.5, z: 2.0, color: "#6a7aa0", power: 1.5 },
    { type: "lamp", x: 17.5, z: 4.0, color: "#6a7aa0", power: 1.5 },
    { type: "lamp", x: 8.0, z: 7.5, color: "#a04030", power: 1.2 },

    { type: "cat", spots: [
      { x: 3.4, z: 2.6, rot: -90, until: "got:iron_key",
        hint: { ru: "Тик прижал уши и смотрит в темноту чердака. Хвост показывает в дальний правый угол.", en: "Tik has his ears flat and stares into the dark attic. His tail points to the far right corner." } },
      { x: 3.4, z: 6.6, rot: 180, until: "got:gold_watch",
        hint: { ru: "Тик бьёт лапой по огонькам на ящике: тык — и загораются соседние!", en: "Tik bats at the lights on the box: tap, and the neighbours light up too!" } },
      { x: 3.4, z: 2.6, rot: -90, until: "crow_trapped",
        hint: { ru: "Тик не сводит глаз с золотых часов — так они блестят. Вороне бы тоже понравились…", en: "Tik can't take his eyes off the gold watch, it shines so much. The Crow would like it too…" } },
      { x: 10.5, z: 2.4, rot: 0, until: "grandpa_free",
        hint: { ru: "Тик сидит под клеткой и громко мяукает дедушке. Потом идёт к гнезду и считает лапой: раз, два, три…", en: "Tik sits under the cage, meowing loudly up at Grandpa. Then he goes to the nest and counts with his paw: one, two, three…" } },
    ] },
  ],

  ending: {
    title: { ru: "Конец! Дедушка спасён!", en: "The End! Grandpa is saved!" },
    text: {
      ru: "Дверца клетки распахнулась, и дедушка крепко обнял Роберта.\n\n— Я знал, что ты справишься. Ты прошёл весь мой дом: часы, подвал, башню, обсерваторию, оранжерею… и даже Ворону перехитрил!\n\nВорона сидит в клетке и обиженно щёлкает клювом. Дедушка обещает её перечинить, чтобы она стала доброй.\n\nТик мурлычет у Роберта на руках. Все часы в доме разом бьют полночь.\n\nСпасибо, что играл в «Дом часовщика»!",
      en: "The cage door swung open, and Grandpa gave Robert a big hug.\n\n“I knew you could do it. You made it through my whole house: the clocks, the cellar, the tower, the observatory, the greenhouse… and you even outsmarted the Crow!”\n\nThe Crow sits in its cage, clacking its beak in a sulk. Grandpa promises to rebuild it so that it turns out kind.\n\nTik purrs in Robert's arms. Every clock in the house strikes midnight at once.\n\nThank you for playing “The Clockmaker's House”!",
    },
  },
};
