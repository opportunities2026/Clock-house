// Список всех глав игры. Новая глава = новый файл в этой папке + строчка здесь.
import { level as chapter1 } from "./level1.js";
import { level as chapter2 } from "./level2.js";
import { level as chapter3 } from "./level3.js";
import { level as chapter4 } from "./level4.js";

export const LEVELS = { chapter1, chapter2, chapter3, chapter4 };
export const ORDER = ["chapter1", "chapter2", "chapter3", "chapter4"];
