/*
  Warnings:

  - You are about to drop the `registrations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `maxParticipants` on the `quizzes` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "registrations_email_quizId_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "registrations";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "team_registrations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teamName" TEXT NOT NULL,
    "teamSize" INTEGER NOT NULL,
    "captainFirstName" TEXT NOT NULL,
    "captainLastName" TEXT NOT NULL,
    "captainEmail" TEXT NOT NULL,
    "captainPhone" TEXT NOT NULL,
    "experience" TEXT NOT NULL DEFAULT 'BEGINNER',
    "howHeardAbout" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'CONFIRMED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "quizId" TEXT NOT NULL,
    CONSTRAINT "team_registrations_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "quizzes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_quizzes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "date" DATETIME NOT NULL,
    "startTime" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "maxTeams" INTEGER NOT NULL DEFAULT 20,
    "minTeamSize" INTEGER NOT NULL DEFAULT 3,
    "maxTeamSize" INTEGER NOT NULL DEFAULT 6,
    "location" TEXT,
    "price" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_quizzes" ("createdAt", "date", "description", "duration", "id", "location", "price", "startTime", "status", "title", "updatedAt") SELECT "createdAt", "date", "description", "duration", "id", "location", "price", "startTime", "status", "title", "updatedAt" FROM "quizzes";
DROP TABLE "quizzes";
ALTER TABLE "new_quizzes" RENAME TO "quizzes";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "team_registrations_teamName_quizId_key" ON "team_registrations"("teamName", "quizId");
