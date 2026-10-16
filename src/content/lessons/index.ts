import type { LessonContent } from "../types";
import { T1 } from "./t1";
import { T2 } from "./t2";
import { T3 } from "./t3";

const ALL: LessonContent[] = [...T1, ...T2, ...T3];

export const LESSON_CONTENT: Record<string, LessonContent> = Object.fromEntries(ALL.map((l) => [l.id, l]));
