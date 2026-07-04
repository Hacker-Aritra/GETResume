-- ============================================================
-- AI Resume Builder — Database Schema
-- Import this file in phpMyAdmin (XAMPP) or run:
--   mysql -u root -p < database.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS resume_builder
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE resume_builder;

-- ---------------------------------------------------------------
-- Users
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(191) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------------------------------------------------------
-- Resumes  (the full resume form is stored as JSON in `data`,
-- which keeps the schema flexible for new sections/fields later)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS resumes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(150) NOT NULL DEFAULT 'Untitled Resume',
  template VARCHAR(50) NOT NULL DEFAULT 'classic',
  data LONGTEXT NOT NULL,             -- JSON blob: personal info, experience, education, skills...
  ats_score INT DEFAULT NULL,         -- last AI-computed ATS-friendliness score
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------
-- AI generation log (optional but useful for auditing/history)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_generations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  resume_id INT DEFAULT NULL,
  request_type VARCHAR(50) NOT NULL,   -- e.g. 'summary', 'bullet', 'skills', 'ats_score'
  input_text TEXT,
  output_text TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE SET NULL
) ENGINE=InnoDB;
