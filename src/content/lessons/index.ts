import type { LessonContent } from "../types";
import { T1 } from "./t1";
import { T2 } from "./t2";
import { T3 } from "./t3";
import { T4 } from "./t4";
import { T5 } from "./t5";
import { T6 } from "./t6";

const ALL: LessonContent[] = [...T1, ...T2, ...T3, ...T4, ...T5, ...T6];

export const LESSON_CONTENT: Record<string, LessonContent> = Object.fromEntries(ALL.map((l) => [l.id, l]));
