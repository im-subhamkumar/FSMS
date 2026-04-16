-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(255) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `firstName` VARCHAR(100) NOT NULL,
    `lastName` VARCHAR(100) NOT NULL,
    `role` ENUM('ADMIN', 'INSTRUCTOR', 'STUDENT', 'STAFF') NOT NULL DEFAULT 'STUDENT',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `instructors` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `employeeId` VARCHAR(50) NOT NULL,
    `designation` ENUM('CHIEF_FLIGHT_INSTRUCTOR', 'SENIOR_FLIGHT_INSTRUCTOR', 'FLIGHT_INSTRUCTOR', 'GROUND_INSTRUCTOR', 'SIMULATOR_INSTRUCTOR') NOT NULL,
    `department` ENUM('FLYING', 'GROUND', 'SIMULATOR') NOT NULL,
    `dateOfJoining` DATE NOT NULL,
    `employmentType` ENUM('FULL_TIME', 'PART_TIME', 'CONTRACT') NOT NULL,
    `employmentStatus` ENUM('ACTIVE', 'INACTIVE', 'ON_LEAVE') NOT NULL DEFAULT 'ACTIVE',
    `reportingToId` INTEGER NULL,
    `dateOfBirth` DATE NULL,
    `gender` VARCHAR(20) NULL,
    `nationality` VARCHAR(100) NULL,
    `phone` VARCHAR(20) NULL,
    `emergencyPhone` VARCHAR(20) NULL,
    `address` TEXT NULL,
    `city` VARCHAR(100) NULL,
    `state` VARCHAR(100) NULL,
    `pinCode` VARCHAR(20) NULL,
    `profilePhotoUrl` VARCHAR(500) NULL,
    `licenseNumber` VARCHAR(100) NULL,
    `licenseTypes` VARCHAR(255) NULL,
    `issuingAuthority` VARCHAR(50) NULL,
    `licenseIssueDate` DATE NULL,
    `licenseExpiryDate` DATE NULL,
    `ratings` VARCHAR(500) NULL,
    `typeRatings` VARCHAR(500) NULL,
    `medicalClass` VARCHAR(20) NULL,
    `medicalCertNumber` VARCHAR(100) NULL,
    `medicalIssuingAME` VARCHAR(200) NULL,
    `medicalIssueDate` DATE NULL,
    `medicalExpiryDate` DATE NULL,
    `totalHours` DOUBLE NULL DEFAULT 0,
    `picHours` DOUBLE NULL DEFAULT 0,
    `dualHours` DOUBLE NULL DEFAULT 0,
    `simHours` DOUBLE NULL DEFAULT 0,
    `nightHours` DOUBLE NULL DEFAULT 0,
    `instrumentHours` DOUBLE NULL DEFAULT 0,
    `aircraftFlown` VARCHAR(500) NULL,
    `lastFlightDate` DATE NULL,
    `subjectsCanTeach` VARCHAR(500) NULL,
    `fisDate` DATE NULL,
    `workDays` VARCHAR(100) NULL,
    `preferredStartTime` VARCHAR(10) NULL,
    `preferredEndTime` VARCHAR(10) NULL,
    `maxFlightHrsDay` DOUBLE NULL DEFAULT 8,
    `maxDualHrsMonth` DOUBLE NULL DEFAULT 100,
    `canDoSim` BOOLEAN NOT NULL DEFAULT true,
    `canDoGround` BOOLEAN NOT NULL DEFAULT true,
    `canDoNight` BOOLEAN NOT NULL DEFAULT false,
    `onLeave` BOOLEAN NOT NULL DEFAULT false,
    `leaveFrom` DATE NULL,
    `leaveTo` DATE NULL,
    `licenseStatus` ENUM('VALID', 'EXPIRING_SOON', 'EXPIRED') NOT NULL DEFAULT 'VALID',
    `medicalStatus` ENUM('VALID', 'EXPIRING_SOON', 'EXPIRED') NOT NULL DEFAULT 'VALID',
    `flightCurrencyStatus` ENUM('CURRENT', 'EXPIRING_SOON', 'NOT_CURRENT') NOT NULL DEFAULT 'CURRENT',
    `totalFlightHrsAccum` DOUBLE NOT NULL DEFAULT 0,
    `monthlyDualHrs` DOUBLE NOT NULL DEFAULT 0,
    `dailyFlightHrs` DOUBLE NOT NULL DEFAULT 0,
    `isDeleted` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `instructors_userId_key`(`userId`),
    UNIQUE INDEX `instructors_employeeId_key`(`employeeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `instructor_documents` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `instructorId` INTEGER NOT NULL,
    `category` VARCHAR(100) NOT NULL,
    `label` VARCHAR(200) NULL,
    `fileName` VARCHAR(255) NOT NULL,
    `fileUrl` VARCHAR(500) NOT NULL,
    `mimeType` VARCHAR(100) NULL,
    `sizeBytes` INTEGER NULL,
    `uploadedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `uploadedBy` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `instructor_change_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `instructorId` INTEGER NOT NULL,
    `changedBy` INTEGER NOT NULL,
    `changedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `section` VARCHAR(50) NULL,
    `fieldChanged` VARCHAR(100) NOT NULL,
    `oldValue` TEXT NULL,
    `newValue` TEXT NULL,
    `note` VARCHAR(255) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `instructors` ADD CONSTRAINT `instructors_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `instructors` ADD CONSTRAINT `instructors_reportingToId_fkey` FOREIGN KEY (`reportingToId`) REFERENCES `instructors`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `instructor_documents` ADD CONSTRAINT `instructor_documents_instructorId_fkey` FOREIGN KEY (`instructorId`) REFERENCES `instructors`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `instructor_change_logs` ADD CONSTRAINT `instructor_change_logs_instructorId_fkey` FOREIGN KEY (`instructorId`) REFERENCES `instructors`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
