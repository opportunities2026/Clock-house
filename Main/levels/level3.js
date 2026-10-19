// =====================================================================
//  ДОМ ЧАСОВЩИКА — Глава 3: «Часовая башня»
// ---------------------------------------------------------------------
//  Лестница из подвала привела Роберта в часовую башню.
//  Здесь три загадки: колокола, зеркала с лунным лучом и весы.
//
//  Что можно поменять:
//    • мелодию колоколов (sequence у двери №6) — и запись в книге (notes.bells);
//    • как стоят зеркала в начале (state) и как они должны стоять (correct);
//    • вес большой гири на весах (left) и маленьких гирь (value).
// =====================================================================

export const level = {
  id: "chapter3",
  title: { ru: "Глава 3 · Часовая башня", en: "Chapter 3 · The Clock Tower" },
  next: null,

  // b — основание башни, r — зеркальный зал, k — зал механизма, u — лестница в обсерваторию
  map: [
    "###################",
    "#bbbbbb#rrrrrrrr###",
    "#bbbbbb#rrrrrrrr###",
    "#bbbbbbDrrrrrrrr###",
    "#bbbbbb#rrrrrrrr###",
    "#bbbbbb#rrrrrrrr###",
    "#bbbbbb#rrrrrrrr###",
    "########rrrrrrrr###",
    "##############D####",
    "########kkkkkkkk###",
    "########kkkkkkkk###",
    "########kkkkkkkkDu#",
    "########kkkkkkkk###",
    "###################",
  ],
  themes: { b: "tower", r: "stars", k: "mech" },
  stoneFloors: "u",
  endCells: "u",

  start: { x: 2.4, z: 4.6, angle: 0 },

  doors: [
    { id: "door6", number: 6, cell: [7, 3], side: "W",
      lock: { type: "bells", sequence: ["low", "high", "mid", "mid", "low", "high"] } },
    { id: "door7", number: 7, cell: [14, 8], side: "N",
      lock: { type: "beam", flag: "beam_on" } },
    { id: "door8", number: 8, cell: [16, 11], side: "W",
      lock: { type: "key", item: "bronze_key" } },
  ],

  items: {
    weight2: { icon: "weight", value: 2, label: "2", name: { ru: "Гиря «2»", en: "Weight “2”" },
               about: { ru: "Небольшая чугунная гиря с цифрой 2.", en: "A small iron weight marked 2." } },
    weight3: { icon: "weight", value: 3, label: "3", name: { ru: "Гиря «3»", en: "Weight “3”" },
               about: { ru: "Гиря с цифрой 3.", en: "A weight marked 3." } },
    weight5: { icon: "weight", value: 5, label: "5", name: { ru: "Гиря «5»", en: "Weight “5”" },
               about: { ru: "Тяжёлая гиря с цифрой 5.", en: "A heavy weight marked 5." } },
    weight7: { icon: "weight", value: 7, label: "7", name: { ru: "Гиря «7»", en: "Weight “7”" },
               about: { ru: "Самая тяжёлая из маленьких гирь. На ней цифра 7.", en: "The heaviest of the small weights, marked 7." } },
    bronze_key: { icon: "key", name: { ru: "Бронзовый ключ", en: "Bronze key" },
                  about: { ru: "Лежал в тайнике весов. На бирке цифра 8.", en: "It was in the scales' secret drawer. The tag says 8." } },
  },

  notes: {
    bells: {
      title: { ru: "«Песня башни»", en: "“The Tower's Song”" },
      text: {
        ru: "Каждый вечер я звоню в колокола башни. Песня начинается так:\n\nНИЗКИЙ — ВЫСОКИЙ — СРЕДНИЙ…\n\nА конец песни я выгравировал там, где время качается туда-сюда.\n\nБольшой колокол звучит низко, маленький — высоко.",
        en: "Every evening I ring the tower bells. The song begins like this:\n\nLOW — HIGH — MIDDLE…\n\nAnd I engraved the end of the song where time swings back and forth.\n\nThe big bell sounds low, the small one sounds high.",
      },
    },
    bells2: {
      title: { ru: "Надпись на маятнике", en: "Engraving on the pendulum" },
      text: {
        ru: "На огромном диске маятника выгравировано:\n\n«…СРЕДНИЙ — НИЗКИЙ — ВЫСОКИЙ»",
        en: "Engraved on the huge pendulum disc:\n\n“…MIDDLE — LOW — HIGH”",
      },
    },
    mirrors: {
      title: { ru: "Записка о зеркалах", en: "Note about the mirrors" },
      text: {
        ru: "Лунный луч — ключ к хрустальной двери.\n\nЗеркала на подставках поворачиваются от лёгкого нажатия. Лучу предстоит долгий путь по всему залу, прежде чем он попадёт в кристалл двери №7.\n\nОсторожно: не все зеркала здесь нужны.",
        en: "The moonbeam is the key to the crystal door.\n\nThe mirrors on stands turn with a light touch. The beam has a long way to travel around the hall before it reaches the crystal in door 7.\n\nCareful: not every mirror here is needed.",
      },
    },
    balance: {
      title: { ru: "Записка о весах", en: "Note about the scales" },
      text: {
        ru: "Тайник в весах открывается, только когда они точно уравновешены.\n\nНа левой чаше лежит гиря «9». По башне я спрятал четыре маленькие гири — но подходят не все!\n\nПодумай, какие положить на правую чашу. Чтобы выбрать гирю, нажми на неё в кармане.",
        en: "The secret drawer in the scales opens only when they balance exactly.\n\nThere is a “9” weight on the left pan. I hid four small weights around the tower, but not all of them fit!\n\nThink about which ones to put on the right pan. To choose a weight, tap it in your pocket.",
      },
    },
  },

  // Подсказки: первая — намёк, вторая (через 40 секунд) — подробнее
  objectives: [
    { done: "open:door6",
      hint: [{ ru: "Колокола на двери №6 ждут дедушкину песню. Начало записано в книге, а конец спрятан в другом месте.", en: "The bells on door 6 are waiting for Grandpa's song. The beginning is in the book, the ending is hidden elsewhere." },
             { ru: "Конец песни выгравирован на огромном маятнике — нажми на него. Вся песня: низкий, высокий, средний, средний, низкий, высокий.", en: "The end of the song is engraved on the giant pendulum: tap it. The whole song: low, high, middle, middle, low, high." }] },
    { done: "beam_on",
      hint: [{ ru: "Лунный луч должен попасть в кристалл на двери №7. Следи, куда он светит, и поворачивай зеркала по одному.", en: "The moonbeam must hit the crystal on door 7. Watch where it shines and turn the mirrors one at a time." },
             { ru: "Луч идёт от окна вниз, потом через весь зал направо, вниз, налево, снова вниз, направо — и вниз в кристалл. Два зеркала лишние.", en: "The beam goes down from the window, then right across the hall, down, left, down again, right, and down into the crystal. Two mirrors are spare." }] },
    { done: "balanced",
      hint: [{ ru: "На левой чаше «9». В башне спрятаны четыре гири. Какие из них вместе весят ровно 9?", en: "The left pan has “9”. Four weights are hidden in the tower. Which of them add up to exactly 9?" },
             { ru: "Гири лежат: на полке у входа, в углу основания башни, на столике в зеркальном зале и на ящике в зале механизма. Подойдут 2 и 7.", en: "The weights are: on the shelf by the entrance, in a corner of the tower base, on a small table in the hall of mirrors, and on a crate in the mechanism hall. 2 and 7 will do." }] },
    { done: "got:bronze_key",
      hint: [{ ru: "Весы уравновешены! Возьми ключ из ящика под ними.", en: "The scales balance! Take the key from the drawer underneath." }] },
    { done: "open:door8",
      hint: [{ ru: "Открой дверь №8 бронзовым ключом.", en: "Open door 8 with the bronze key." }] },
    { done: "chapter_end",
      hint: [{ ru: "Поднимайся по лестнице в обсерваторию!", en: "Climb the stairs to the observatory!" }] },
  ],

  objects: [
    // ---------- ОСНОВАНИЕ БАШНИ ----------
    { type: "stairsDecor", x: 1.5, z: 6.0, rot: 180 },
    { type: "lectern", x: 3.6, z: 1.6, rot: 0, note: "bells" },
    { type: "bigPendulum", x: 5.2, z: 4.6, note: "bells2" },
    { type: "shelf", x: 1.15, z: 3.0, rot: 90, item: "weight2" },
    { type: "itemWeight", item: "weight7", x: 6.45, z: 1.5 },
    { type: "gearDecor", x: 5.6, z: 1.02, rot: 0 },
    { type: "cellarLamp", x: 6.98, z: 5.2, rot: -90 },
    { type: "cellarLamp", x: 1.02, z: 4.8, rot: 90 },
    { type: "cobweb", x: 1.0, z: 1.0, corner: "nw" },

    // ---------- ЗЕРКАЛЬНЫЙ ЗАЛ ----------
    { type: "window", x: 9.5, z: 1.02, rot: 0 },
    { type: "lightPuzzle", id: "mirrors", flag: "beam_on", door: "door7",
      source: { cell: [9, 1], dir: [0, 1] },
      // state — как зеркало стоит в начале, correct — как должно стоять
      mirrors: [
        { cell: [9, 2], state: "/", correct: "\\" },
        { cell: [15, 2], state: "/", correct: "\\" },
        { cell: [15, 4], state: "\\", correct: "/" },
        { cell: [11, 4], state: "\\", correct: "/" },
        { cell: [11, 6], state: "/", correct: "\\" },
        { cell: [14, 6], state: "/", correct: "\\" },
        { cell: [9, 5], state: "/" },      // лишнее зеркало
        { cell: [13, 3], state: "\\" },   // лишнее зеркало
      ],
      target: { cell: [14, 7], dir: [0, 1] } },
    { type: "table", x: 9.6, z: 6.4, rot: 0, note: "mirrors" },
    { type: "smallTable", x: 8.5, z: 4.3, rot: 0 },
    { type: "itemWeight", item: "weight3", x: 8.5, z: 4.3, y: 0.75 },
    { type: "cellarLamp", x: 8.02, z: 6.5, rot: 90, power: 3 },
    { type: "lamp", x: 12.0, z: 4.0, color: "#6a8aff", power: 2.5 },

    // ---------- ЗАЛ МЕХАНИЗМА ----------
    { type: "balance", id: "scales", x: 11.5, z: 10.6, rot: 0, left: 9,
      items: ["weight2", "weight3", "weight5", "weight7"], flag: "balanced", reward: "bronze_key" },
    { type: "hangingLamp", x: 12.5, z: 10.4, power: 11 },
    { type: "crate", x: 8.6, z: 12.4, rot: 20 },
    { type: "itemWeight", item: "weight5", x: 8.6, z: 12.4, y: 0.5 },
    { type: "stool", x: 9.0, z: 9.6, note: "balance" },
    { type: "gearDecor", x: 12.0, z: 12.98, rot: 180 },
    { type: "wallClocks", x: 10.6, z: 9.02, rot: 0 },
    { type: "toolShelf", x: 14.8, z: 12.85, rot: 180 },

    { type: "cat", spots: [
      { x: 3.0, z: 2.4, rot: 160, until: "open:door6",
        hint: { ru: "Мяу! Тик следит глазами за маятником: туда-сюда, туда-сюда…", en: "Meow! Tik follows the pendulum with his eyes: back and forth, back and forth…" } },
      { x: 12.4, z: 5.4, rot: -150, until: "beam_on",
        hint: { ru: "Тик ловит лапой лунный зайчик и недовольно мяукает на одно из зеркал.", en: "Tik paws at the moonlight and meows crossly at one of the mirrors." } },
      { x: 13.4, z: 11.6, rot: -60, until: "got:bronze_key",
        hint: { ru: "Тик сидит у весов и считает лапкой: раз, два… Кажется, не все гири ему нравятся.", en: "Tik sits by the scales counting with his paw: one, two… He doesn't seem to like every weight." } },
      { x: 15.3, z: 10.3, rot: -90, until: "chapter_end",
        hint: { ru: "Тик уже ждёт у последней двери. Мурр!", en: "Tik is already waiting by the last door. Purr!" } },
    ] },
  ],

  ending: {
    title: { ru: "Глава 3 пройдена!", en: "Chapter 3 complete!" },
    text: {
      ru: "Лестница привела Роберта на самый верх башни. Перед ним — дверь в обсерваторию, а из-за неё доносится знакомый голос:\n\n«Роберт? Это ты? Я знал, что ты справишься!»\n\nПродолжение следует: Глава 4 — «Обсерватория».",
      en: "The stairs led Robert to the very top of the tower. In front of him is the door to the observatory, and from behind it comes a familiar voice:\n\n“Robert? Is that you? I knew you could do it!”\n\nTo be continued: Chapter 4 — “The Observatory”.",
    },
  },
};
