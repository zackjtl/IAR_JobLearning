-- CreateTable
CREATE TABLE "Settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "dailyMinutes" INTEGER NOT NULL DEFAULT 60,
    "planStartDate" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DiagnosticResult" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scoresJson" TEXT NOT NULL,
    "answersJson" TEXT NOT NULL,
    "selfJson" TEXT NOT NULL,
    CONSTRAINT "DiagnosticResult_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "QuizAttempt" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" TEXT NOT NULL,
    "refId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "skill" TEXT NOT NULL,
    "chosen" INTEGER NOT NULL,
    "correct" BOOLEAN NOT NULL,
    CONSTRAINT "QuizAttempt_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LessonProgress" (
    "lessonId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'in_progress',
    "bestScore" INTEGER NOT NULL DEFAULT 0,
    "lastScore" INTEGER NOT NULL DEFAULT 0,
    "visits" INTEGER NOT NULL DEFAULT 0,
    "completedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "LessonProgress_pkey" PRIMARY KEY ("lessonId")
);

CREATE TABLE "Note" (
    "id" SERIAL NOT NULL,
    "refType" TEXT NOT NULL,
    "refId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Bookmark" (
    "id" SERIAL NOT NULL,
    "refType" TEXT NOT NULL,
    "refId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "href" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Bookmark_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ReviewCard" (
    "id" SERIAL NOT NULL,
    "cardKey" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "skill" TEXT NOT NULL,
    "front" TEXT NOT NULL,
    "back" TEXT NOT NULL,
    "ease" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
    "interval" INTEGER NOT NULL DEFAULT 0,
    "reps" INTEGER NOT NULL DEFAULT 0,
    "lapses" INTEGER NOT NULL DEFAULT 0,
    "due" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "suspended" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ReviewCard_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Activity" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL,
    "refId" TEXT NOT NULL,
    "skill" TEXT NOT NULL DEFAULT '',
    "minutes" INTEGER NOT NULL DEFAULT 0,
    "score" INTEGER,
    "payloadJson" TEXT NOT NULL DEFAULT '{}',
    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MockSession" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "mode" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "transcriptJson" TEXT NOT NULL DEFAULT '[]',
    "summaryJson" TEXT NOT NULL DEFAULT '{}',
    CONSTRAINT "MockSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PlanTask" (
    "taskId" TEXT NOT NULL,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PlanTask_pkey" PRIMARY KEY ("taskId")
);

-- CreateIndex
CREATE INDEX "QuizAttempt_questionId_idx" ON "QuizAttempt"("questionId");
CREATE INDEX "QuizAttempt_skill_idx" ON "QuizAttempt"("skill");
CREATE INDEX "Note_refType_refId_idx" ON "Note"("refType", "refId");
CREATE UNIQUE INDEX "Bookmark_refType_refId_key" ON "Bookmark"("refType", "refId");
CREATE UNIQUE INDEX "ReviewCard_cardKey_key" ON "ReviewCard"("cardKey");
CREATE INDEX "ReviewCard_due_idx" ON "ReviewCard"("due");
CREATE INDEX "Activity_type_idx" ON "Activity"("type");
CREATE INDEX "Activity_createdAt_idx" ON "Activity"("createdAt");
