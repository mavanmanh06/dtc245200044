CREATE DATABASE IF NOT EXISTS gym_db;
USE gym_db;

CREATE TABLE IF NOT EXISTS members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    join_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS packages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    duration_months INT NOT NULL,
    price DECIMAL(10, 2) NOT NULL
);

CREATE TABLE IF NOT EXISTS trainers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    specialty VARCHAR(100),
    phone VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    member_id INT NOT NULL,
    trainer_id INT NOT NULL,
    workout_time DATETIME NOT NULL,
    status ENUM('SCHEDULED', 'COMPLETED', 'CANCELLED') DEFAULT 'SCHEDULED',
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
    FOREIGN KEY (trainer_id) REFERENCES trainers(id) ON DELETE CASCADE
);

INSERT INTO packages (name, duration_months, price) VALUES 
('Goi Co Ban 1 Thang', 1, 500000.00),
('Goi VIP 6 Thang', 6, 2500000.00),
('Goi Diamond 12 Thang', 12, 4500000.00);

INSERT INTO trainers (full_name, specialty, phone) VALUES 
('Nguyen Van Hung', 'The hinh / Hypertrophy', '0912345678'),
('Tran Thi Mai', 'Yoga & Cardio', '0987654321');

INSERT INTO members (full_name, phone, email, join_date) VALUES 
('Le Van Nam', '0901112233', 'namle@gmail.com', '2026-01-10'),
('Pham Thi Thu', '0934445566', 'thupham@gmail.com', '2026-02-15');

INSERT INTO schedules (member_id, trainer_id, workout_time, status) VALUES 
(1, 1, '2026-10-25 08:00:00', 'SCHEDULED'),
(2, 2, '2026-10-25 17:30:00', 'SCHEDULED');
