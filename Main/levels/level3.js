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
      lock: { type: "bells", sequence: ["low", "high", "mid", "high"] } },
    { id: "door7", number: 7, cell: [14, 8], side: "N",
      lock: { type: "beam", flag: "beam_on" } },
    { id: "door8", number: 8, cell: [16, 11], side: "W",
      lock: { type: "key", item: "bronze_key" } },
  ],

  items: {
    weight1: { icon: "weight", value: 1, label: "1", name: { ru: "Гиря «1»", en: "Weight “1”" },
               about: { ru: "Маленькая чугунная гиря. На ней цифра 1.", en: "A small iron weight marked 1." } },
    weight2: { icon: "weight", value: 2, label: "2", name: { ru: "Гиря «2»", en: "Weight “2”" },
               about: { ru: "Гиря побольше. На ней цифра 2.", en: "A bigger weight marked 2." } },
    weight3: { icon: "weight", value: 3, label: "3", name: { ru: "Гиря «3»", en: "Weight “3”" },
               about: { ru: "Тяжёлая гиря с цифрой 3.", en: "A heavy weight marked 3." } },
    bronze_key: { icon: "key", name: { ru: "Бронзовый ключ", en: "Bronze key" },
                  about: { ru: "Лежал в тайнике весов. На бирке цифра 8.", en: "It was in the scales' secret drawer. The tag says 8." } },
  },

  notes: {
    bells: {
      title: { ru: "«Песня башни»", en: "“The Tower's Song”" },
      text: {
        ru: "Каждый вечер я звоню в колокола башни в одном и том же порядке:\n\nНИЗКИЙ — ВЫСОКИЙ — СРЕДНИЙ — ВЫСОКИЙ.\n\nСамый большой колокол звучит ниже всех, а самый маленький — выше всех.\n\nКолокола висят прямо на двери в зеркальный зал.",
        en: "Every evening I ring the tower bells in the same order:\n\nLOW — HIGH — MIDDLE — HIGH.\n\nThe biggest bell sounds the lowest, and the smallest sounds the highest.\n\nThe bells hang right on the door to the hall of mirrors.",
      },
    },
    mirrors: {
      title: { ru: "Записка о зеркалах", en: "Note about the mirrors" },
      text: {
        ru: "Лунный луч — ключ к хрустальной двери.\n\nЗеркала на подставках поворачиваются от лёгкого нажатия. Проведи луч от окна через все четыре зеркала прямо в кристалл на двери №7.\n\nСмотри, куда падает свет, — он сам подскажет дорогу.",
        en: "The moonbeam is the key to the crystal door.\n\nThe mirrors on stands turn with a light touch. Guide the beam from the window through all four mirrors straight into the crystal on door 7.\n\nWatch where the light falls: it will show you the way.",
      },
    },
    balance: {
      title: { ru: "Записка о весах", en: "Note about the scales" },
      text: {
        ru: "Тайник в весах открывается, только когда они уравновешены.\n\nНа левой чаше лежит гиря «6». Три маленькие гири я спрятал по всей башне: у входа, в зеркальном зале и здесь, в зале механизма.\n\n1 + 2 + 3 = 6. Положи их на правую чашу!",
        en: "The secret drawer in the scales opens only when they balance.\n\nThere is a “6” weight on the left pan. I hid three small weights around the tower: by the entrance, in the hall of mirrors, and here in the mechanism hall.\n\n1 + 2 + 3 = 6. Put them on the right pan!",
      },
    },
  },

  objectives: [
    { done: "open:door6",
      hint: { ru: "Прочитай книгу на подставке — там записана песня колоколов. Колокола висят на двери №6.", en: "Read the book on the stand: it has the bells' song. The bells hang on door 6." } },
    { done: "beam_on",
      hint: { ru: "Нажимай на зеркала, чтобы поворачивать их. Лунный луч должен попасть в кристалл на двери №7.", en: "Tap the mirrors to turn them. The moonbeam must hit the crystal on door 7." } },
    { done: "balanced",
      hint: { ru: "Найди три гири: на полке у входа, в зеркальном зале и в зале механизма. Положи их на правую чашу весов.", en: "Find three weights: on the shelf by the entrance, in the hall of mirrors, and in the mechanism hall. Put them on the right pan of the scales." } },
    { done: "got:bronze_key",
      hint: { ru: "Весы уравновешены! Возьми ключ из ящика под ними.", en: "The scales balance! Take the key from the drawer underneath." } },
    { done: "open:door8",
      hint: { ru: "Открой дверь №8 бронзовым ключом.", en: "Open door 8 with the bronze key." } },
    { done: "chapter_end",
      hint: { ru: "Поднимайся по лестнице в обсерваторию!", en: "Climb the stairs to the observatory!" } },
  ],

  objects: [
    // ---------- ОСНОВАНИЕ БАШНИ ----------
    { type: "stairsDecor", x: 1.5, z: 6.0, rot: 180 },
    { type: "lectern", x: 3.6, z: 1.6, rot: 0, note: "bells" },
    { type: "bigPendulum", x: 5.2, z: 4.6 },
    { type: "shelf", x: 1.15, z: 3.0, rot: 90, item: "weight1" },
    { type: "gearDecor", x: 5.6, z: 1.02, rot: 0 },
    { type: "cellarLamp", x: 6.98, z: 5.2, rot: -90 },
    { type: "cellarLamp", x: 1.02, z: 4.8, rot: 90 },
    { type: "cobweb", x: 1.0, z: 1.0, corner: "nw" },

    // ---------- ЗЕРКАЛЬНЫЙ ЗАЛ ----------
    { type: "window", x: 9.5, z: 1.02, rot: 0 },
    { type: "lightPuzzle", id: "mirrors", flag: "beam_on", door: "door7",
      source: { cell: [9, 1], dir: [0, 1] },
      mirrors: [
        { cell: [9, 5], state: "/", correct: "\\" },
        { cell: [11, 5], state: "\\", correct: "/" },
        { cell: [11, 2], state: "\\", correct: "/" },
        { cell: [14, 2], state: "/", correct: "\\" },
      ],
      target: { cell: [14, 7], dir: [0, 1] } },
    { type: "table", x: 12.6, z: 6.3, rot: 0, note: "mirrors" },
    { type: "smallTable", x: 15.4, z: 4.5, rot: 0 },
    { type: "itemWeight", item: "weight2", x: 15.4, z: 4.5, y: 0.75 },
    { type: "cellarLamp", x: 8.02, z: 6.5, rot: 90, power: 3 },
    { type: "lamp", x: 12.0, z: 4.0, color: "#6a8aff", power: 2.5 },

    // ---------- ЗАЛ МЕХАНИЗМА ----------
    { type: "balance", id: "scales", x: 11.5, z: 10.6, rot: 0, left: 6,
      items: ["weight1", "weight2", "weight3"], flag: "balanced", reward: "bronze_key" },
    { type: "hangingLamp", x: 12.5, z: 10.4, power: 11 },
    { type: "crate", x: 8.6, z: 12.4, rot: 20 },
    { type: "itemWeight", item: "weight3", x: 8.6, z: 12.4, y: 0.5 },
    { type: "stool", x: 9.0, z: 9.6, note: "balance" },
    { type: "gearDecor", x: 12.0, z: 12.98, rot: 180 },
    { type: "wallClocks", x: 10.6, z: 9.02, rot: 0 },
    { type: "toolShelf", x: 14.8, z: 12.85, rot: 180 },

    { type: "cat", spots: [
      { x: 3.0, z: 2.4, rot: 160, until: "open:door6",
        hint: { ru: "Мяу! Тик сидит у книги и смотрит то на неё, то на колокола на двери.", en: "Meow! Tik sits by the book, looking at it and then at the bells on the door." } },
      { x: 12.4, z: 5.4, rot: -150, until: "beam_on",
        hint: { ru: "Тик ловит лапой лунный зайчик. Луч должен дойти до двери с кристаллом!", en: "Tik paws at the moonlight. The beam has to reach the door with the crystal!" } },
      { x: 13.4, z: 11.6, rot: -60, until: "got:bronze_key",
        hint: { ru: "Тик смотрит на весы: на одной чаше тяжело, на другой — пусто.", en: "Tik looks at the scales: one pan is heavy, the other is empty." } },
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
