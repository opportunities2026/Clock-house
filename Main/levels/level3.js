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

// Песня башни: её играют куранты, и её же нужно повторить на колоколах двери №6
const SONG = ["mid", "low", "high", "high", "low", "mid"];

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
      lock: { type: "bells", sequence: SONG } },
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
    weight4: { icon: "weight", value: 4, label: "4", name: { ru: "Гиря «4»", en: "Weight “4”" },
               about: { ru: "Гиря с цифрой 4.", en: "A weight marked 4." } },
    weight5: { icon: "weight", value: 5, label: "5", name: { ru: "Гиря «5»", en: "Weight “5”" },
               about: { ru: "Тяжёлая гиря с цифрой 5.", en: "A heavy weight marked 5." } },
    weight7: { icon: "weight", value: 7, label: "7", name: { ru: "Гиря «7»", en: "Weight “7”" },
               about: { ru: "Самая тяжёлая из маленьких гирь. На ней цифра 7.", en: "The heaviest of the small weights, marked 7." } },
    bronze_key: { icon: "key", name: { ru: "Бронзовый ключ", en: "Bronze key" },
                  about: { ru: "Лежал в тайнике весов. На бирке цифра 8.", en: "It was in the scales' secret drawer. The tag says 8." } },
  },

  notes: {
    bells: {
      title: { ru: "Дедушкина книга", en: "Grandpa's book" },
      text: {
        ru: "Песню башни я не записываю — её помнят мои куранты.\n\nЗаведи их, слушай внимательно и смотри на молоточки. Колокола на двери откроют путь только тому, кто повторит песню без ошибки.",
        en: "I never write down the tower's song: my chimes remember it.\n\nWind them up, listen carefully and watch the hammers. The bells on the door will only let through someone who repeats the song without a mistake.",
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
        ru: "Тайник в весах откроется, только если уравновесить их честно: ровно тремя гирями — не больше и не меньше.\n\nПо башне спрятано пять гирь. Ищи на полках, в углах и даже среди инструментов.\n\nЧтобы выбрать гирю, нажми на неё в кармане. Лишнюю можно снять с чаши.",
        en: "The secret drawer opens only if the scales are balanced fairly: with exactly three weights, no more and no fewer.\n\nFive weights are hidden around the tower. Look on shelves, in corners and even among the tools.\n\nTo choose a weight, tap it in your pocket. You can take an extra one off the pan.",
      },
    },
  },

  // Подсказки: первая — намёк, вторая (через 40 секунд) — подробнее
  // Подсказки: первая — намёк, вторая (через минуту) — подробнее
  objectives: [
    { done: "open:door6",
      hint: [{ ru: "Где-то в основании башни живёт песня. Найди, кто её помнит.", en: "A song lives somewhere at the base of the tower. Find what remembers it." },
             { ru: "Нажми на куранты у стены — они сыграют песню. Повтори её на колоколах двери №6: большой — низкий, маленький — высокий.", en: "Tap the chimes by the wall and they will play the song. Repeat it on the bells of door 6: big is low, small is high." }] },
    { done: "beam_on",
      hint: [{ ru: "Лунный луч должен попасть в кристалл на двери №7. Следи, куда он светит, и поворачивай зеркала по одному.", en: "The moonbeam must hit the crystal on door 7. Watch where it shines and turn the mirrors one at a time." },
             { ru: "Луч идёт от окна вниз, потом через весь зал направо, вниз, налево, снова вниз, направо — и вниз в кристалл. Два зеркала лишние.", en: "The beam goes down from the window, then right across the hall, down, left, down again, right, and down into the crystal. Two mirrors are spare." }] },
    { done: "balanced",
      hint: [{ ru: "На левой чаше «12». Три гири из пяти должны вместе весить столько же.", en: "The left pan has “12”. Three of the five weights must weigh the same together." },
             { ru: "Гири лежат: на полке и в углу у входа, на столике в зеркальном зале, на ящике и на полке с инструментами в зале механизма. Подойдут 3 + 4 + 5 или 2 + 3 + 7.", en: "The weights are: on the shelf and in a corner by the entrance, on a small table in the hall of mirrors, on a crate and on the tool shelf in the mechanism hall. 3 + 4 + 5 or 2 + 3 + 7 will work." }] },
    { done: "got:bronze_key",
      hint: [{ ru: "Весы уравновешены! Загляни под них.", en: "The scales balance! Look underneath." }] },
    { done: "open:door8",
      hint: [{ ru: "Где-то есть дверь для бронзового ключа.", en: "Somewhere there is a door for the bronze key." }] },
    { done: "chapter_end",
      hint: [{ ru: "Поднимайся по лестнице в обсерваторию!", en: "Climb the stairs to the observatory!" }] },
  ],

  objects: [
    // ---------- ОСНОВАНИЕ БАШНИ ----------
    { type: "stairsDecor", x: 1.5, z: 6.0, rot: 180 },
    { type: "lectern", x: 3.6, z: 1.6, rot: 0, note: "bells" },
    { type: "bigPendulum", x: 5.2, z: 4.6 },
    { type: "chimeBox", id: "chimes", x: 1.18, z: 4.6, rot: 90, sequence: SONG },
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
    { type: "balance", id: "scales", x: 11.5, z: 10.6, rot: 0, left: 12, count: 3,
      items: ["weight2", "weight3", "weight4", "weight5", "weight7"], flag: "balanced", reward: "bronze_key" },
    { type: "itemWeight", item: "weight4", x: 14.55, z: 12.86, y: 0.67 },
    { type: "hangingLamp", x: 12.5, z: 10.4, power: 11 },
    { type: "crate", x: 8.6, z: 12.4, rot: 20 },
    { type: "itemWeight", item: "weight5", x: 8.6, z: 12.4, y: 0.5 },
    { type: "stool", x: 9.0, z: 9.6, note: "balance" },
    { type: "gearDecor", x: 12.0, z: 12.98, rot: 180 },
    { type: "wallClocks", x: 10.6, z: 9.02, rot: 0 },
    { type: "toolShelf", x: 14.8, z: 12.85, rot: 180 },

    { type: "cat", spots: [
      { x: 3.0, z: 2.4, rot: 160, until: "open:door6",
        hint: { ru: "Мяу! Тик сидит у деревянного шкафчика со стеклом и мурлычет какую-то мелодию.", en: "Meow! Tik sits by a wooden cabinet with glass and purrs a little tune." } },
      { x: 12.4, z: 5.4, rot: -150, until: "beam_on",
        hint: { ru: "Тик ловит лапой лунный зайчик и недовольно мяукает на одно из зеркал.", en: "Tik paws at the moonlight and meows crossly at one of the mirrors." } },
      { x: 13.4, z: 11.6, rot: -60, until: "got:bronze_key",
        hint: { ru: "Тик трогает лапой весы: раз, два, три… и останавливается. Больше трёх он считать не любит.", en: "Tik pats the scales: one, two, three… and stops. He doesn't like counting past three." } },
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
