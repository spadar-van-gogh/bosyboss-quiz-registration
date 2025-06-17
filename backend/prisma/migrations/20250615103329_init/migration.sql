-- CreateTable
CREATE TABLE "quizzes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "date" DATETIME NOT NULL,
    "startTime" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "maxParticipants" INTEGER NOT NULL DEFAULT 50,
    "location" TEXT,
    "price" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "registrations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "age" INTEGER,
    "experience" TEXT NOT NULL DEFAULT 'BEGINNER',
    "dietaryInfo" TEXT,
    "howHeardAbout" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'CONFIRMED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "quizId" TEXT NOT NULL,
    CONSTRAINT "registrations_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "quizzes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "admins" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MODERATOR',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "registrations_email_quizId_key" ON "registrations"("email", "quizId");

-- CreateIndex
CREATE UNIQUE INDEX "admins_email_key" ON "admins"("email");
