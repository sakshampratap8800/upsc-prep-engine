-- CreateTable
CREATE TABLE "subjects" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "books" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "className" INTEGER NOT NULL,
    "subjectId" INTEGER NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "totalChapters" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "books_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "chapters" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "bookId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "summary" TEXT,
    "keyConceptsJson" TEXT,
    "definitionsJson" TEXT,
    "findOutQuestionsJson" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "chapters_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "books" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sections" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "chapterId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sections_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "chapters" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "syllabus_topics" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "paper" TEXT NOT NULL,
    "parentId" INTEGER,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "syllabus_topics_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "syllabus_topics" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "concepts" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "pyqs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "year" INTEGER NOT NULL,
    "examStage" TEXT NOT NULL,
    "paper" TEXT NOT NULL,
    "questionNumber" INTEGER,
    "questionText" TEXT NOT NULL,
    "optionsJson" TEXT,
    "correctAnswer" TEXT,
    "explanation" TEXT,
    "difficulty" TEXT,
    "questionType" TEXT,
    "directiveWord" TEXT,
    "questionDemand" TEXT,
    "subjectArea" TEXT,
    "sourceFile" TEXT NOT NULL,
    "sourcePage" INTEGER,
    "confidence" REAL NOT NULL DEFAULT 1.0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "practice_questions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "questionText" TEXT NOT NULL,
    "answerText" TEXT,
    "questionType" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "answer_attempts" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "pyqId" INTEGER,
    "practiceQuestionId" INTEGER,
    "userAnswer" TEXT NOT NULL,
    "score" REAL,
    "feedback" TEXT,
    "timeTakenSeconds" INTEGER,
    "attemptedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "answer_attempts_pyqId_fkey" FOREIGN KEY ("pyqId") REFERENCES "pyqs" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "answer_attempts_practiceQuestionId_fkey" FOREIGN KEY ("practiceQuestionId") REFERENCES "practice_questions" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "error_logs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "answerAttemptId" INTEGER NOT NULL,
    "errorType" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "error_logs_answerAttemptId_fkey" FOREIGN KEY ("answerAttemptId") REFERENCES "answer_attempts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "revision_items" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "contentJson" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "nextReviewAt" DATETIME,
    "lastReviewedAt" DATETIME,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "study_tasks" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "monthNumber" INTEGER,
    "weekNumber" INTEGER,
    "dayOfWeek" TEXT,
    "timeAllocation" TEXT,
    "status" TEXT NOT NULL DEFAULT 'not_started',
    "scheduledDate" DATETIME,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "map_assets" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "filePath" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "diagrams" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "filePath" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "current_affairs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "date" DATETIME,
    "sourceUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "import_logs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "message" TEXT,
    "processedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "_ChapterTopic" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_ChapterTopic_A_fkey" FOREIGN KEY ("A") REFERENCES "chapters" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ChapterTopic_B_fkey" FOREIGN KEY ("B") REFERENCES "syllabus_topics" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_ChapterPYQ" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_ChapterPYQ_A_fkey" FOREIGN KEY ("A") REFERENCES "chapters" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ChapterPYQ_B_fkey" FOREIGN KEY ("B") REFERENCES "pyqs" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_ChapterRevisionItem" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_ChapterRevisionItem_A_fkey" FOREIGN KEY ("A") REFERENCES "chapters" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ChapterRevisionItem_B_fkey" FOREIGN KEY ("B") REFERENCES "revision_items" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_TopicConcept" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_TopicConcept_A_fkey" FOREIGN KEY ("A") REFERENCES "concepts" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_TopicConcept_B_fkey" FOREIGN KEY ("B") REFERENCES "syllabus_topics" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_PYQConcept" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_PYQConcept_A_fkey" FOREIGN KEY ("A") REFERENCES "concepts" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_PYQConcept_B_fkey" FOREIGN KEY ("B") REFERENCES "pyqs" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_ConceptRevisionItem" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_ConceptRevisionItem_A_fkey" FOREIGN KEY ("A") REFERENCES "concepts" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ConceptRevisionItem_B_fkey" FOREIGN KEY ("B") REFERENCES "revision_items" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_PYQTopic" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_PYQTopic_A_fkey" FOREIGN KEY ("A") REFERENCES "pyqs" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_PYQTopic_B_fkey" FOREIGN KEY ("B") REFERENCES "syllabus_topics" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_TopicPracticeQuestion" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_TopicPracticeQuestion_A_fkey" FOREIGN KEY ("A") REFERENCES "practice_questions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_TopicPracticeQuestion_B_fkey" FOREIGN KEY ("B") REFERENCES "syllabus_topics" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_TopicRevisionItem" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_TopicRevisionItem_A_fkey" FOREIGN KEY ("A") REFERENCES "revision_items" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_TopicRevisionItem_B_fkey" FOREIGN KEY ("B") REFERENCES "syllabus_topics" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_TopicMapAsset" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_TopicMapAsset_A_fkey" FOREIGN KEY ("A") REFERENCES "map_assets" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_TopicMapAsset_B_fkey" FOREIGN KEY ("B") REFERENCES "syllabus_topics" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_TopicDiagram" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_TopicDiagram_A_fkey" FOREIGN KEY ("A") REFERENCES "diagrams" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_TopicDiagram_B_fkey" FOREIGN KEY ("B") REFERENCES "syllabus_topics" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_TopicCurrentAffair" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_TopicCurrentAffair_A_fkey" FOREIGN KEY ("A") REFERENCES "current_affairs" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_TopicCurrentAffair_B_fkey" FOREIGN KEY ("B") REFERENCES "syllabus_topics" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "subjects_slug_key" ON "subjects"("slug");

-- CreateIndex
CREATE INDEX "books_subjectId_idx" ON "books"("subjectId");

-- CreateIndex
CREATE INDEX "chapters_bookId_idx" ON "chapters"("bookId");

-- CreateIndex
CREATE INDEX "sections_chapterId_idx" ON "sections"("chapterId");

-- CreateIndex
CREATE INDEX "syllabus_topics_parentId_idx" ON "syllabus_topics"("parentId");

-- CreateIndex
CREATE INDEX "syllabus_topics_paper_idx" ON "syllabus_topics"("paper");

-- CreateIndex
CREATE INDEX "concepts_name_idx" ON "concepts"("name");

-- CreateIndex
CREATE INDEX "pyqs_year_idx" ON "pyqs"("year");

-- CreateIndex
CREATE INDEX "pyqs_examStage_idx" ON "pyqs"("examStage");

-- CreateIndex
CREATE INDEX "pyqs_paper_idx" ON "pyqs"("paper");

-- CreateIndex
CREATE INDEX "answer_attempts_pyqId_idx" ON "answer_attempts"("pyqId");

-- CreateIndex
CREATE INDEX "answer_attempts_practiceQuestionId_idx" ON "answer_attempts"("practiceQuestionId");

-- CreateIndex
CREATE INDEX "error_logs_answerAttemptId_idx" ON "error_logs"("answerAttemptId");

-- CreateIndex
CREATE INDEX "error_logs_errorType_idx" ON "error_logs"("errorType");

-- CreateIndex
CREATE INDEX "revision_items_status_idx" ON "revision_items"("status");

-- CreateIndex
CREATE INDEX "revision_items_nextReviewAt_idx" ON "revision_items"("nextReviewAt");

-- CreateIndex
CREATE INDEX "study_tasks_status_idx" ON "study_tasks"("status");

-- CreateIndex
CREATE INDEX "study_tasks_scheduledDate_idx" ON "study_tasks"("scheduledDate");

-- CreateIndex
CREATE INDEX "import_logs_status_idx" ON "import_logs"("status");

-- CreateIndex
CREATE UNIQUE INDEX "_ChapterTopic_AB_unique" ON "_ChapterTopic"("A", "B");

-- CreateIndex
CREATE INDEX "_ChapterTopic_B_index" ON "_ChapterTopic"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ChapterPYQ_AB_unique" ON "_ChapterPYQ"("A", "B");

-- CreateIndex
CREATE INDEX "_ChapterPYQ_B_index" ON "_ChapterPYQ"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ChapterRevisionItem_AB_unique" ON "_ChapterRevisionItem"("A", "B");

-- CreateIndex
CREATE INDEX "_ChapterRevisionItem_B_index" ON "_ChapterRevisionItem"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_TopicConcept_AB_unique" ON "_TopicConcept"("A", "B");

-- CreateIndex
CREATE INDEX "_TopicConcept_B_index" ON "_TopicConcept"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_PYQConcept_AB_unique" ON "_PYQConcept"("A", "B");

-- CreateIndex
CREATE INDEX "_PYQConcept_B_index" ON "_PYQConcept"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ConceptRevisionItem_AB_unique" ON "_ConceptRevisionItem"("A", "B");

-- CreateIndex
CREATE INDEX "_ConceptRevisionItem_B_index" ON "_ConceptRevisionItem"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_PYQTopic_AB_unique" ON "_PYQTopic"("A", "B");

-- CreateIndex
CREATE INDEX "_PYQTopic_B_index" ON "_PYQTopic"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_TopicPracticeQuestion_AB_unique" ON "_TopicPracticeQuestion"("A", "B");

-- CreateIndex
CREATE INDEX "_TopicPracticeQuestion_B_index" ON "_TopicPracticeQuestion"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_TopicRevisionItem_AB_unique" ON "_TopicRevisionItem"("A", "B");

-- CreateIndex
CREATE INDEX "_TopicRevisionItem_B_index" ON "_TopicRevisionItem"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_TopicMapAsset_AB_unique" ON "_TopicMapAsset"("A", "B");

-- CreateIndex
CREATE INDEX "_TopicMapAsset_B_index" ON "_TopicMapAsset"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_TopicDiagram_AB_unique" ON "_TopicDiagram"("A", "B");

-- CreateIndex
CREATE INDEX "_TopicDiagram_B_index" ON "_TopicDiagram"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_TopicCurrentAffair_AB_unique" ON "_TopicCurrentAffair"("A", "B");

-- CreateIndex
CREATE INDEX "_TopicCurrentAffair_B_index" ON "_TopicCurrentAffair"("B");

