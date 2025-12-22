CREATE DATABASE IF NOT EXISTS user_db
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE user_db;

-- ============================================
-- TABLA PRINCIPAL: users
-- ============================================
CREATE TABLE `user` (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    profession VARCHAR(100),
    age TINYINT,
    gender ENUM('male', 'female', 'non-binary', 'other'),
    computer_expertise ENUM('low', 'mid', 'high', 'expert')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- TABLA RESULT (entidad débil)
-- ============================================
CREATE TABLE `result` (
    result_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    responses TEXT,
    time TIME NOT NULL,
    completed BIT,
    comments VARCHAR(255),
    proposals VARCHAR(255),
    assessment TINYINT,

    CONSTRAINT fk_result_user
        FOREIGN KEY (user_id)
        REFERENCES `user`(user_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- TABLA OBSERVATION (entidad débil)
-- ============================================
CREATE TABLE `observation` (
    observation_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    comments VARCHAR(255),

    CONSTRAINT fk_observation_user
        FOREIGN KEY (user_id)
        REFERENCES `user`(user_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
)
