// =====================================================================
//  ДОМ ЧАСОВЩИКА — Глава 2: «Подвал и Страж»
// ---------------------------------------------------------------------
//  Подвал под мастерской. Здесь живёт Страж — заводная сова, которую
//  дедушка сделал, чтобы охранять дом от воров.
//
//  Что можно попробовать поменять:
//    • положение рычагов у двери №4 (pattern) — и рисунок на стене (chalkArrows);
//    • маршрут, по которому летает сова (owl.route);
//    • скорость совы (owl.speed и owl.chaseSpeed);
//    • куда спрятаны вентиль и минутная стрелка;
//    • где стоят шкафы, в которых можно прятаться.
// =====================================================================

export const level = {
  id: "chapter2",
  title: { ru: "Глава 2 · Подвал и Страж", en: "Chapter 2 · The Cellar and the Guardian" },
  next: "chapter3",

  // -------------------------------------------------------------------
  //  КАРТА. # — стена, s — кладовая, m — лабиринт, w — затопленный проход,
  //  n — гнездо Стража, D — дверь, u — лестница наверх (конец главы).
  // -------------------------------------------------------------------
  map: [
    "##########################",
    "#ssssss#mmmmm#mmmmmmmmm###",
    "#ssssss#m#m###m###m#m#####",
    "#ssssssDm#mmm#mmmmm#mmm###",
    "#ssssss#m###m#m###m###m###",
    "#ssssss#mmm#mmmmmmm#mmm###",
    "##########m#m#######m#m###",
    "########mmm#mmmmmmmmm#m###",
    "########m#m###m#m#########",
    "########mmmmmmm#m#nnnnn###",
    "########m#####m#m#nnnnn###",
    "########m#mmmmmmwwnnnnnDu#",
    "########m#m#######nnnnn###",
    "########mmmmmmmmm#nnnnn###",
    "##########################",
  ],
  themes: { s: "storage", m: "cellar", w: "cellar", n: "nest" },
  stoneFloors: "mwnu",          // по каким клеткам шаги звучат как по камню
  endCells: "u",                // ступишь сюда — глава пройдена

  start: { x: 2.2, z: 2.6, angle: -90 },

  // Куда Роберт возвращается, если Страж его поймал (берётся последняя подходящая точка)
  checkpoints: [
    { x: 5.5, z: 3.5, angle: -90 },
    { flag: "drained", x: 15.5, z: 11.5, angle: -90 },
  ],

  doors: [
    { id: "door4", number: 4, cell: [7, 3], side: "W",
      lock: { type: "levers", pattern: ["up", "down", "up", "up", "down"] } },
    { id: "door5", number: 5, cell: [23, 11], side: "W",
      lock: { type: "key", item: "silver_key" } },
  ],

  // -------------------------------------------------------------------
  //  СТРАЖ — заводная сова.
  // -------------------------------------------------------------------
  owl: {
    start: [18, 5],
    cells: "mwn",              // где сова может летать (в кладовую она не залетает)
    route: [[18, 5], [14, 7], [10, 9], [14, 13], [16, 9], [16, 7], [20, 5], [22, 1], [18, 1], [14, 3], [12, 5]],
    speed: 1.5,                // скорость, когда просто патрулирует (м/с)
    chaseSpeed: 2.9,           // скорость погони. Роберт бегом — 3.3, шагом — 1.9
    sight: 9,                  // как далеко видит (м)
    fov: 0.2,                  // насколько широко смотрит (меньше — шире)
    hearing: 4.5,              // слышит бегущего Роберта на таком расстоянии (м)
    perch: [20.5, 13.2],       // гнездо, где сова засыпает
    sleepFlag: "owl_asleep",
    dropItem: "silver_key",
  },

  items: {
    lantern:      { icon: "lantern", name: { ru: "Фонарь", en: "Lantern" },
                    about: { ru: "Старый масляный фонарь. С ним в подвале гораздо светлее.", en: "An old oil lantern. The cellar is much brighter with it." } },
    valve_wheel:  { icon: "valve", name: { ru: "Вентиль", en: "Valve wheel" },
                    about: { ru: "Красное колесо от водопроводной трубы.", en: "A red wheel from a water pipe." } },
    minute_hand:  { icon: "hand", name: { ru: "Минутная стрелка", en: "Minute hand" },
                    about: { ru: "Длинная ажурная стрелка от больших часов.", en: "A long ornate hand from a big clock." } },
    silver_key:   { icon: "key", name: { ru: "Серебряный ключ", en: "Silver key" },
                    about: { ru: "Висел на шее у Стража. На бирке цифра 5.", en: "It hung on the Guardian's neck. The tag says 5." } },
  },

  notes: {
    guardian: {
      title: { ru: "Записка о Страже", en: "Note about the Guardian" },
      text: {
        ru: "Роберт!\n\nВ подвале живёт мой Страж — заводная сова. Я сделал её, чтобы охранять дом от воров.\n\nОна не злая, но очень старательная. Если заметит тебя — догонит и отнесёт обратно ко входу.\n\nУвидела? Беги изо всех сил и прячься в шкаф — внутри она тебя не найдёт.\n\nА лучше всего — усыпи её. Как это сделать, я записал в лабиринте.\n\nДа, и возьми фонарь — внизу темно.",
        en: "Robert!\n\nMy Guardian lives in the cellar: a clockwork owl. I built it to protect the house from thieves.\n\nIt isn't mean, but it is very diligent. If it spots you, it will catch you and carry you back to the entrance.\n\nIf it sees you, run as fast as you can and hide in a wardrobe. It won't find you inside.\n\nBetter still, put it to sleep. I wrote down how somewhere in the maze.\n\nOh, and take the lantern. It's dark down there.",
      },
    },
    barrels: {
      title: { ru: "Надпись у двери", en: "Writing by the door" },
      text: {
        ru: "Дверь в лабиринт помнит мои бочки.\nОдни стоят на посту, другие отдыхают.\nНачинай с той, что ближе к лестнице.",
        en: "The door to the maze remembers my barrels.\nSome stand on guard, others are resting.\nStart with the one nearest the stairs.",
      },
    },
    nest: {
      title: { ru: "Как усыпить Стража", en: "How to put the Guardian to sleep" },
      text: {
        ru: "В ту ночь, когда Страж впервые взлетел, он задел крылом одни из часов в лабиринте. Стекло треснуло, и часы остановились.\n\nС тех пор Страж засыпает ровно в это время — если часы в его гнезде его покажут.\n\nМинутную стрелку я снял, чтобы он не уснул раньше времени. Вот она.\n\nГнездо — за водой.",
        en: "On the night the Guardian first took flight, it brushed one of the clocks in the maze with its wing. The glass cracked and the clock stopped.\n\nEver since, the Guardian falls asleep at exactly that time, if the clock in its nest shows it.\n\nI took off the minute hand so it wouldn't fall asleep too early. Here it is.\n\nThe nest is beyond the water.",
      },
    },
  },

  // Подсказки: первая — намёк, вторая (через 40 секунд) — подробнее
  // Подсказки: первая — намёк, вторая (через минуту) — подробнее
  objectives: [
    { done: "got:lantern",
      hint: [{ ru: "Внизу темно. Что поможет видеть дальше?", en: "It's dark down here. What would help you see further?" },
             { ru: "Фонарь стоит на полке у стены кладовой.", en: "The lantern is on the shelf by the storage room wall." }] },
    { done: "open:door4",
      hint: [{ ru: "Прочитай надпись у двери №4 и осмотри кладовую. Что здесь «стоит на посту», а что «отдыхает»?", en: "Read the writing by door 4 and look around the storage room. What is “on guard” here, and what is “resting”?" },
             { ru: "Бочки у южной стены: стоящая — рычаг вверх, лежащая — вниз. Считай от лестницы.", en: "The barrels by the south wall: standing means lever up, lying means down. Count from the stairs." }] },
    { done: "got:minute_hand",
      hint: [{ ru: "Дедушка спрятал в лабиринте записку о Страже. Не бегай рядом с совой — она слышит шаги!", en: "Grandpa hid a note about the Guardian in the maze. Don't run near the owl: it hears footsteps!" },
             { ru: "Записка и минутная стрелка лежат в тупике на юге лабиринта.", en: "The note and the minute hand are in a dead end in the south of the maze." }] },
    { done: "got:valve_wheel",
      hint: [{ ru: "Без вентиля воду не спустить. Обойди все тупики.", en: "You can't drain the water without a valve wheel. Check every dead end." },
             { ru: "Вентиль лежит на ящике в тупике на востоке лабиринта.", en: "The valve wheel is on a crate in a dead end in the east of the maze." }] },
    { done: "drained",
      hint: [{ ru: "Возле воды есть труба.", en: "There's a pipe near the water." },
             { ru: "Нажми на трубу у затопленного коридора, вставь вентиль и поверни его.", en: "Tap the pipe by the flooded corridor, put the wheel on and turn it." }] },
    { done: "placed:minute_hand",
      hint: [{ ru: "У больших часов в гнезде чего-то не хватает.", en: "The big clock in the nest is missing something." },
             { ru: "Нажми на часы в гнезде — минутная стрелка встанет на место.", en: "Tap the clock in the nest and the minute hand will go on." }] },
    { done: "owl_asleep",
      hint: [{ ru: "В лабиринте висят остановившиеся часы. Какие из них задел крылом Страж?", en: "Stopped clocks hang in the maze. Which one did the Guardian hit with its wing?" },
             { ru: "Найди часы с треснувшим стеклом (на востоке лабиринта), запомни время и выставь его на часах в гнезде.", en: "Find the clock with cracked glass (in the east of the maze), remember the time and set it on the clock in the nest." }] },
    { done: "got:silver_key",
      hint: [{ ru: "Страж уснул! Посмотри под его гнездом.", en: "The Guardian is asleep! Look under its nest." }] },
    { done: "open:door5",
      hint: [{ ru: "Где-то здесь есть дверь, к которой подходит серебряный ключ.", en: "There's a door somewhere here that the silver key fits." }] },
    { done: "chapter_end",
      hint: [{ ru: "Поднимайся по лестнице!", en: "Climb the stairs!" }] },
  ],

  objects: [
    // ---------- КЛАДОВАЯ ----------
    { type: "stairsDecor", x: 1.5, z: 1.0, rot: 0 },
    { type: "hangingLamp", x: 3.8, z: 3.0, power: 7 },
    { type: "shelf", x: 4.2, z: 1.15, rot: 0, item: "lantern" },
    { type: "table", x: 3.6, z: 4.4, rot: 0, note: "guardian" },
    { type: "wineRack", x: 1.13, z: 3.6, rot: 90 },
    // Бочки у южной стены: стоит / лежит — это и есть положение рычагов двери №4
    { type: "barrel", x: 1.6, z: 5.55 },
    { type: "barrel", x: 2.6, z: 5.55, lying: true, rot: 90 },
    { type: "barrel", x: 3.6, z: 5.55 },
    { type: "barrel", x: 4.6, z: 5.55, tilt: true },
    { type: "barrel", x: 5.7, z: 5.55, lying: true, rot: 90 },
    { type: "wallNote", x: 6.98, z: 4.6, rot: -90, note: "barrels" },
    { type: "cobweb", x: 1.0, z: 1.0, corner: "nw" },
    { type: "cobweb", x: 7.0, z: 6.0, corner: "se" },
    { type: "cat", spots: [
      { x: 2.8, z: 3.0, rot: 120, until: "got:lantern",
        hint: { ru: "Мяу! Тик щурится в темноту. Ему-то хорошо, он и так всё видит…", en: "Meow! Tik squints into the dark. Lucky him, he can see anyway…" } },
      { x: 6.2, z: 4.0, rot: -60, until: "open:door4",
        hint: { ru: "Мррр… Тик запрыгнул на бочку, спрыгнул, прошёлся вдоль них и сел у двери. Будто что-то считает.", en: "Purr… Tik hopped onto a barrel, jumped down, walked along them and sat by the door. As if counting something." } },
      { x: 14.4, z: 11.5, rot: -90, until: "drained",
        hint: { ru: "Тик не любит воду. Он фыркает и смотрит на стену.", en: "Tik doesn't like water. He snorts and stares at the wall." } },
      { x: 20.5, z: 9.8, rot: 180, until: "owl_asleep",
        hint: { ru: "Тик зевает и смотрит на часы. Он не любит разбитое стекло — всегда обходит его стороной.", en: "Tik yawns and looks at the clock. He doesn't like broken glass and always avoids it." } },
      { x: 21.5, z: 12.3, rot: 0, until: "chapter_end",
        hint: { ru: "Тик спокойно умывается рядом со спящим Стражем. Пора наверх!", en: "Tik washes calmly next to the sleeping Guardian. Time to go up!" } },
    ] },

    // ---------- ЛАБИРИНТ ----------
    { type: "cellarLamp", x: 10.98, z: 5.5, rot: -90 },
    { type: "cellarLamp", x: 16.5, z: 7.02, rot: 0 },
    { type: "cellarLamp", x: 12.5, z: 13.98, rot: 180 },
    { type: "wardrobe", id: "wardrobe1", x: 12.8, z: 1.5, rot: -90 },
    { type: "wardrobe", id: "wardrobe2", x: 20.8, z: 7.5, rot: -90 },
    { type: "wardrobe", id: "wardrobe3", x: 8.2, z: 13.5, rot: 90 },
    { type: "crate", x: 22.5, z: 7.6, rot: 15, small: true },
    { type: "itemOn", item: "valve_wheel", x: 22.5, z: 7.6, y: 0.5 },
    { type: "stool", x: 16.6, z: 13.5, note: "nest" },
    { type: "itemOn", item: "minute_hand", x: 16.6, z: 13.5, y: 0.52, dx: 0.05 },
    { type: "cobweb", x: 8.0, z: 1.0, corner: "nw" },
    { type: "cobweb", x: 23.0, z: 1.0, corner: "ne" },
    { type: "cobweb", x: 17.0, z: 14.0, corner: "se" },
    { type: "pipes", x: 8.98, z: 10.5, rot: -90 },

    // ---------- ЗАТОПЛЕННЫЙ ПРОХОД ----------
    { type: "water", id: "water", cells: [[16, 11], [17, 11]], flag: "drained" },
    { type: "valvePipe", id: "valve", x: 15.5, z: 11.02, rot: 0, item: "valve_wheel", flag: "drained" },
    { type: "lamp", x: 16.2, z: 11.5, color: "#7aa0ff", power: 1.6 },

    // ---------- ГНЕЗДО СТРАЖА ----------
    { type: "hangingLamp", x: 20.5, z: 11.2, power: 9 },
    { type: "nestClock", id: "nestclock", x: 20.5, z: 9.02, rot: 0, item: "minute_hand", hour: 9, minute: 30,
      minuteStep: 5, target: { hour: 7, minute: 20 } },   // время сна Стража = время на разбитых часах
    // Остановившиеся часы в лабиринте. Нужны только разбитые (cracked)!
    { type: "stoppedClock", id: "sclock1", x: 10.5, z: 1.02, rot: 0, hour: 2, minute: 50 },
    { type: "stoppedClock", id: "sclock2", x: 16.5, z: 3.02, rot: 0, hour: 10, minute: 5 },
    { type: "stoppedClock", id: "sclock3", x: 21.5, z: 5.98, rot: 180, hour: 7, minute: 20, cracked: true },
    { type: "stoppedClock", id: "sclock4", x: 12.5, z: 9.98, rot: 180, hour: 5, minute: 35 },
    { type: "perch", x: 20.5, z: 13.2 },
    { type: "wardrobe", id: "wardrobe4", x: 18.25, z: 12.8, rot: 90 },
    { type: "gearDecor", x: 22.97, z: 9.6, rot: -90 },
    { type: "toolShelf", x: 18.6, z: 9.12, rot: 0 },
  ],

  ending: {
    title: { ru: "Глава 2 пройдена!", en: "Chapter 2 complete!" },
    text: {
      ru: "Страж мирно спит в своём гнезде, а кот Тик сторожит его сон.\n\nКаменная лестница ведёт наверх — в часовую башню. Оттуда доносится мерное «тик-так» самого большого механизма дедушки…\n\nПродолжение следует: Глава 3 — «Часовая башня».",
      en: "The Guardian sleeps peacefully in its nest, and Tik the cat watches over it.\n\nA stone staircase leads up to the clock tower. From there comes the steady “tick-tock” of Grandpa's biggest mechanism…\n\nTo be continued: Chapter 3 — “The Clock Tower”.",
    },
  },
};
