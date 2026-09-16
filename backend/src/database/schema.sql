-- =====================================================================
-- SMART HOSTEL MANAGEMENT SYSTEM - DATABASE SCHEMA (MySQL 8.0+)
-- Institutional Grade: Apex Institute of Technology Smart Living Portal
-- =====================================================================

CREATE DATABASE IF NOT EXISTS smart_hostel_db;
USE smart_hostel_db;

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('student', 'warden', 'admin') NOT NULL DEFAULT 'student',
    phone VARCHAR(20),
    avatar_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_role (role),
    INDEX idx_user_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. HOSTELS TABLE
CREATE TABLE IF NOT EXISTS hostels (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type ENUM('boys', 'girls', 'co-ed') NOT NULL DEFAULT 'boys',
    total_blocks INT NOT NULL DEFAULT 1,
    address TEXT,
    contact_phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. BLOCKS TABLE
CREATE TABLE IF NOT EXISTS blocks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    hostel_id INT NOT NULL,
    name VARCHAR(50) NOT NULL,
    floors_count INT NOT NULL DEFAULT 3,
    FOREIGN KEY (hostel_id) REFERENCES hostels(id) ON DELETE CASCADE,
    INDEX idx_block_hostel (hostel_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. ROOMS TABLE
CREATE TABLE IF NOT EXISTS rooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    block_id INT NOT NULL,
    room_number VARCHAR(20) NOT NULL,
    floor INT NOT NULL DEFAULT 1,
    capacity INT NOT NULL DEFAULT 2,
    room_type ENUM('AC', 'Non-AC', 'Deluxe') NOT NULL DEFAULT 'Non-AC',
    fee_per_semester DECIMAL(10, 2) NOT NULL DEFAULT 35000.00,
    status ENUM('available', 'full', 'maintenance') NOT NULL DEFAULT 'available',
    FOREIGN KEY (block_id) REFERENCES blocks(id) ON DELETE CASCADE,
    UNIQUE KEY uq_block_room (block_id, room_number),
    INDEX idx_room_floor (floor)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. BEDS TABLE
CREATE TABLE IF NOT EXISTS beds (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room_id INT NOT NULL,
    bed_number VARCHAR(10) NOT NULL,
    status ENUM('vacant', 'occupied', 'maintenance') NOT NULL DEFAULT 'vacant',
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
    UNIQUE KEY uq_room_bed (room_id, bed_number),
    INDEX idx_bed_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. STUDENTS TABLE
CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    roll_number VARCHAR(30) NOT NULL UNIQUE,
    course VARCHAR(50) NOT NULL DEFAULT 'B.Tech',
    branch VARCHAR(50) NOT NULL DEFAULT 'Computer Science & Engineering',
    year INT NOT NULL DEFAULT 3,
    semester INT NOT NULL DEFAULT 6,
    blood_group VARCHAR(5) DEFAULT 'B+',
    parent_name VARCHAR(100),
    parent_phone VARCHAR(20),
    emergency_contact VARCHAR(20),
    checkin_date DATE,
    status ENUM('active', 'graduated', 'suspended') NOT NULL DEFAULT 'active',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_student_roll (roll_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. WARDENS TABLE
CREATE TABLE IF NOT EXISTS wardens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    employee_id VARCHAR(30) NOT NULL UNIQUE,
    assigned_hostel_id INT,
    department VARCHAR(50) DEFAULT 'Student Welfare & Security',
    office_location VARCHAR(100) DEFAULT 'Ground Floor Admin Cabin, Block A',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_hostel_id) REFERENCES hostels(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. ROOM ALLOCATIONS TABLE
CREATE TABLE IF NOT EXISTS room_allocations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    bed_id INT NOT NULL,
    allocated_from DATE NOT NULL,
    allocated_to DATE,
    status ENUM('active', 'vacated', 'transferred') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (bed_id) REFERENCES beds(id) ON DELETE CASCADE,
    INDEX idx_allocation_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. COMPLAINTS TABLE
CREATE TABLE IF NOT EXISTS complaints (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    category ENUM('Electrical', 'Plumbing', 'Cleaning', 'Internet', 'Furniture', 'Security', 'Other') NOT NULL DEFAULT 'Other',
    location VARCHAR(100) NOT NULL,
    image_url VARCHAR(255),
    priority ENUM('Low', 'Medium', 'High', 'Urgent') NOT NULL DEFAULT 'Medium',
    department VARCHAR(50) DEFAULT 'Maintenance',
    status ENUM('Pending', 'Assigned', 'In Progress', 'Resolved') NOT NULL DEFAULT 'Pending',
    assigned_to VARCHAR(100),
    resolution_notes TEXT,
    resolved_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    INDEX idx_complaint_status (status),
    INDEX idx_complaint_category (category),
    INDEX idx_complaint_priority (priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 10. COMPLAINT UPDATES TABLE
CREATE TABLE IF NOT EXISTS complaint_updates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    complaint_id INT NOT NULL,
    updated_by_user_id INT NOT NULL,
    status ENUM('Pending', 'Assigned', 'In Progress', 'Resolved') NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
    FOREIGN KEY (updated_by_user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 11. MESS MENU TABLE
CREATE TABLE IF NOT EXISTS mess_menu (
    id INT AUTO_INCREMENT PRIMARY KEY,
    day_of_week ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday') NOT NULL UNIQUE,
    breakfast TEXT NOT NULL,
    lunch TEXT NOT NULL,
    snacks TEXT NOT NULL,
    dinner TEXT NOT NULL,
    special_item VARCHAR(100),
    dietary_tags VARCHAR(150) DEFAULT 'Veg, High-Protein'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 12. MESS FEEDBACK TABLE
CREATE TABLE IF NOT EXISTS mess_feedback (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    meal_type ENUM('Breakfast', 'Lunch', 'Snacks', 'Dinner') NOT NULL,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    taste_rating INT CHECK (taste_rating BETWEEN 1 AND 5),
    quality_rating INT CHECK (quality_rating BETWEEN 1 AND 5),
    cleanliness_rating INT CHECK (cleanliness_rating BETWEEN 1 AND 5),
    comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 13. NOTICES TABLE
CREATE TABLE IF NOT EXISTS notices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) DEFAULT 'General',
    priority ENUM('Low', 'Normal', 'High', 'Urgent') NOT NULL DEFAULT 'Normal',
    published_by_user_id INT NOT NULL,
    target_audience ENUM('all', 'students', 'wardens') NOT NULL DEFAULT 'all',
    date DATE NOT NULL,
    expires_at DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (published_by_user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 14. FEES TABLE
CREATE TABLE IF NOT EXISTS fees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    semester INT NOT NULL DEFAULT 6,
    total_amount DECIMAL(10, 2) NOT NULL DEFAULT 45000.00,
    paid_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    pending_amount DECIMAL(10, 2) NOT NULL DEFAULT 45000.00,
    due_date DATE NOT NULL,
    status ENUM('Paid', 'Partial', 'Pending', 'Overdue') NOT NULL DEFAULT 'Pending',
    receipt_number VARCHAR(50),
    last_payment_date TIMESTAMP NULL,
    transaction_id VARCHAR(100),
    payment_method VARCHAR(50),
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 15. ROOM CHANGE REQUESTS TABLE
CREATE TABLE IF NOT EXISTS room_change_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    current_bed_id INT NOT NULL,
    preferred_block VARCHAR(50) NOT NULL,
    preferred_room_type VARCHAR(50) NOT NULL,
    reason TEXT NOT NULL,
    status ENUM('Pending', 'Approved', 'Rejected') NOT NULL DEFAULT 'Pending',
    warden_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (current_bed_id) REFERENCES beds(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 16. GATE PASSES (OUTING / NIGHT PASS SYSTEM)
CREATE TABLE IF NOT EXISTS gate_passes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    pass_type ENUM('Day Outing', 'Night Out', 'Emergency Leave', 'Vacation') NOT NULL DEFAULT 'Day Outing',
    destination VARCHAR(150) NOT NULL,
    reason TEXT NOT NULL,
    departure_time DATETIME NOT NULL,
    expected_return DATETIME NOT NULL,
    actual_return DATETIME NULL,
    status ENUM('Pending', 'Approved', 'Rejected', 'Departed', 'Returned') NOT NULL DEFAULT 'Pending',
    qr_token VARCHAR(64) UNIQUE,
    approved_by_user_id INT,
    warden_remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 17. ATTENDANCE TABLE
CREATE TABLE IF NOT EXISTS attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    date DATE NOT NULL,
    status ENUM('Present', 'Absent', 'On Leave') NOT NULL DEFAULT 'Present',
    remarks VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    UNIQUE KEY uq_student_date (student_id, date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 18. FEE TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS fee_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fee_id INT NOT NULL,
    student_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    transaction_id VARCHAR(100) NOT NULL UNIQUE,
    receipt_number VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (fee_id) REFERENCES fees(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 19. STAFF MESSAGES TABLE
CREATE TABLE IF NOT EXISTS staff_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sender_id INT NOT NULL,
    receiver_id INT,
    subject VARCHAR(150),
    message TEXT NOT NULL,
    priority ENUM('Normal', 'Urgent', 'Directive') NOT NULL DEFAULT 'Normal',
    category VARCHAR(50) DEFAULT 'General',
    is_read BOOLEAN NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_msg_sender (sender_id),
    INDEX idx_msg_receiver (receiver_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

