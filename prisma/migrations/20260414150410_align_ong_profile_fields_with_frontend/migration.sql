-- Add new columns first
ALTER TABLE `donor_profiles`
  ADD COLUMN `description` VARCHAR(500) NULL;

ALTER TABLE `ong_profiles`
  ADD COLUMN `description` VARCHAR(500) NULL,
  ADD COLUMN `websiteUrls` JSON NULL,
  ADD COLUMN `yearsOfOperation` INTEGER NULL;

-- Backfill data from old columns
UPDATE `donor_profiles`
SET `description` = `bio`
WHERE `bio` IS NOT NULL;

UPDATE `ong_profiles`
SET
  `description` = `bio`,
  `websiteUrls` = CASE
    WHEN `websiteUrl` IS NULL OR TRIM(`websiteUrl`) = '' THEN NULL
    ELSE JSON_ARRAY(`websiteUrl`)
  END
WHERE `bio` IS NOT NULL OR `websiteUrl` IS NOT NULL;

-- Remove deprecated columns
ALTER TABLE `donor_profiles`
  DROP COLUMN `bio`;

ALTER TABLE `ong_profiles`
  DROP COLUMN `bio`,
  DROP COLUMN `websiteUrl`;
