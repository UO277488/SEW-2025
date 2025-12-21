-- Crear usuario obligatorio para la práctica y otorgar permisos sobre la BD `user_db`
CREATE USER IF NOT EXISTS 'DBUSER2025'@'localhost' IDENTIFIED BY 'DBPSWD2025';
GRANT ALL PRIVILEGES ON `user_db`.* TO 'DBUSER2025'@'localhost';
FLUSH PRIVILEGES;

-- Nota: Ejecuta este script en phpMyAdmin o en la consola MySQL como usuario con privilegios (root).