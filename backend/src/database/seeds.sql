-- =====================================================================
-- SMART HOSTEL MANAGEMENT SYSTEM - SEED DATA
-- Institution: Apex Institute of Technology
-- =====================================================================

-- 1. USERS
INSERT INTO users (id, name, email, password_hash, role, phone, avatar_url) VALUES
(1, 'Aarav Sharma', 'student@hostel.com', '$2a$10$8M7RoA3gp64u30UfKaZANOHmqwgcZBNuiYDnGBxwNWZJKQTDnHQsi', 'student', '+91 98765 43210', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'),
(2, 'Rohan Patel', 'rohan@hostel.com', '$2a$10$8M7RoA3gp64u30UfKaZANOHmqwgcZBNuiYDnGBxwNWZJKQTDnHQsi', 'student', '+91 98765 43211', 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150'),
(3, 'Priya Nair', 'priya@hostel.com', '$2a$10$8M7RoA3gp64u30UfKaZANOHmqwgcZBNuiYDnGBxwNWZJKQTDnHQsi', 'student', '+91 98765 43212', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'),
(4, 'Dr. Rajesh Verma', 'warden@hostel.com', '$2a$10$fNLiQvL3hVbT7cys4SWbmuQB0ytzmjs/MctdNp02fy03iFFtGB60y', 'warden', '+91 98112 34567', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'),
(5, 'Chief Warden Admin', 'admin@hostel.com', '$2a$10$Azhcmvh.BCQfsnJq8E/gQeJ1nAfpgqdALFj7l/3UTmhb9sOXCTuCW', 'admin', '+91 98223 34455', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150');

-- 2. HOSTELS
INSERT INTO hostels (id, name, type, total_blocks, address, contact_phone) VALUES
(1, 'Himalaya Boys Hostel', 'boys', 3, 'North Campus, Apex Institute of Technology', '+91 11 2766 8001'),
(2, 'Nilgiri Girls Hostel', 'girls', 2, 'South Campus, Apex Institute of Technology', '+91 11 2766 8002');

-- 3. BLOCKS
INSERT INTO blocks (id, hostel_id, name, floors_count) VALUES
(1, 1, 'Block A (Aryabhata)', 3),
(2, 1, 'Block B (Bhaskara)', 3),
(3, 1, 'Block C (Charaka)', 3),
(4, 2, 'Block A (Gargi)', 3);

-- 4. ROOMS
INSERT INTO rooms (id, block_id, room_number, floor, capacity, room_type, fee_per_semester, status) VALUES
(1, 2, 'B-201', 2, 2, 'AC', 42000.00, 'full'),
(2, 2, 'B-202', 2, 2, 'Non-AC', 35000.00, 'available'),
(3, 2, 'B-203', 2, 3, 'Non-AC', 30000.00, 'available'),
(4, 2, 'B-204', 2, 2, 'AC', 42000.00, 'full'),
(5, 2, 'B-205', 2, 2, 'Deluxe', 48000.00, 'available'),
(6, 1, 'A-101', 1, 2, 'AC', 42000.00, 'available'),
(7, 1, 'A-102', 1, 2, 'Non-AC', 35000.00, 'full'),
(8, 1, 'A-103', 1, 2, 'Non-AC', 35000.00, 'maintenance'),
(9, 3, 'C-301', 3, 3, 'Non-AC', 30000.00, 'available'),
(10, 4, 'G-102', 1, 2, 'AC', 42000.00, 'available');

-- 5. BEDS
INSERT INTO beds (id, room_id, bed_number, status) VALUES
(1, 4, 'Bed-1', 'occupied'),
(2, 4, 'Bed-2', 'occupied'),
(3, 1, 'Bed-1', 'occupied'),
(4, 1, 'Bed-2', 'occupied'),
(5, 2, 'Bed-1', 'vacant'),
(6, 2, 'Bed-2', 'vacant'),
(7, 3, 'Bed-1', 'occupied'),
(8, 3, 'Bed-2', 'vacant'),
(9, 3, 'Bed-3', 'vacant'),
(10, 5, 'Bed-1', 'vacant'),
(11, 5, 'Bed-2', 'vacant'),
(12, 6, 'Bed-1', 'vacant'),
(13, 6, 'Bed-2', 'occupied'),
(14, 7, 'Bed-1', 'occupied'),
(15, 7, 'Bed-2', 'occupied'),
(16, 8, 'Bed-1', 'maintenance'),
(17, 8, 'Bed-2', 'maintenance'),
(18, 9, 'Bed-1', 'vacant'),
(19, 9, 'Bed-2', 'vacant'),
(20, 9, 'Bed-3', 'vacant'),
(21, 10, 'Bed-1', 'occupied'),
(22, 10, 'Bed-2', 'vacant');

-- 6. STUDENTS
INSERT INTO students (id, user_id, roll_number, course, branch, year, semester, blood_group, parent_name, parent_phone, emergency_contact, checkin_date, status) VALUES
(1, 1, '21BCSE104', 'B.Tech', 'Computer Science & Engineering', 3, 6, 'O+', 'Sunil Sharma', '+91 94123 45678', '+91 94123 45678', '2024-08-01', 'active'),
(2, 2, '21BCSE105', 'B.Tech', 'Computer Science & Engineering', 3, 6, 'B+', 'Mahesh Patel', '+91 94123 88776', '+91 94123 88776', '2024-08-01', 'active'),
(3, 3, '21BECE210', 'B.Tech', 'Electronics & Comm. Engg', 3, 6, 'A+', 'K. Narayanan Nair', '+91 94123 11223', '+91 94123 11223', '2024-08-01', 'active');

-- 7. WARDENS
INSERT INTO wardens (id, user_id, employee_id, assigned_hostel_id, department, office_location) VALUES
(1, 4, 'EMP-WRD-042', 1, 'Chief Warden Office - Boys Wings', 'Ground Floor Admin Wing, Block A');

-- 8. ROOM ALLOCATIONS
INSERT INTO room_allocations (id, student_id, bed_id, allocated_from, status) VALUES
(1, 1, 1, '2024-08-01', 'active'),
(2, 2, 2, '2024-08-01', 'active'),
(3, 3, 21, '2024-08-01', 'active');

-- 9. COMPLAINTS
INSERT INTO complaints (id, student_id, title, description, category, location, priority, department, status, assigned_to, resolution_notes, created_at) VALUES
(1, 1, 'Ceiling fan regulator vibrating with high noise', 'The ceiling fan in Room B-204 is making an abnormal rattling sound at speed 3 and above, disturbing study hours.', 'Electrical', 'Room B-204', 'Medium', 'Electrical Maintenance', 'In Progress', 'Suresh Kumar (Electrician)', 'Inspected capacitor and bearings. Replacement scheduled for today afternoon.', '2026-09-12 10:15:00'),
(2, 1, 'Wi-Fi 5GHz AP disconnecting intermittently', 'Wi-Fi access point in Block B 2nd floor corridor drops packets every 10 minutes during evening peak study hours.', 'Internet', 'Block B - 2nd Floor Corridor', 'High', 'IT & Network Operations', 'Assigned', 'NetLink Team', 'Firmware patch scheduled during maintenance window.', '2026-09-13 16:30:00'),
(3, 1, 'Bathroom tap leaking in common washroom', 'Tap 2 in 2nd floor north washroom does not close fully and drips continuously.', 'Plumbing', 'Block B - 2nd Floor Washroom', 'Low', 'Sanitary Maintenance', 'Resolved', 'Ramesh Plumber', 'Washer replaced. Flow restored to normal.', '2026-09-08 09:00:00'),
(4, 2, 'Door lock latch sticking', 'Main door lock latch gets jammed when shutting from outside.', 'Furniture', 'Room B-204', 'Medium', 'Carpentry', 'Resolved', 'Jagdish Carpenter', 'Lubricated and realigned striker plate.', '2026-09-05 14:00:00');

-- 10. COMPLAINT UPDATES
INSERT INTO complaint_updates (id, complaint_id, updated_by_user_id, status, notes, created_at) VALUES
(1, 1, 1, 'Pending', 'Complaint registered by student Aarav Sharma', '2026-09-12 10:15:00'),
(2, 1, 4, 'Assigned', 'Assigned to Suresh Kumar (Electrical Dept)', '2026-09-12 11:30:00'),
(3, 1, 4, 'In Progress', 'Electrician visited site and ordered replacement ball-bearing', '2026-09-13 14:00:00');

-- 11. MESS MENU (WEEKLY)
INSERT INTO mess_menu (id, day_of_week, breakfast, lunch, snacks, dinner, special_item, dietary_tags) VALUES
(1, 'Monday', 'Masala Dosa, Sambar, Coconut Chutney, Boiled Eggs, Tea/Coffee', 'Rajma Masala, Steamed Basmati Rice, Jeera Aloo, Curd, Mixed Salad, Roti', 'Samosa, Mint Chutney, Ginger Tea', 'Paneer Butter Masala / Chicken Curry, Dal Tadka, Phulka Roti, Gulab Jamun', 'Gulab Jamun (2 pcs)', 'Veg / Non-Veg options'),
(2, 'Tuesday', 'Poha with Roasted Peanuts, Sprouted Moong Salad, Banana, Tea/Coffee', 'Kadhi Pakora, Steamed Rice, Bhindi Do Pyaza, Boondi Raita, Chapati', 'Veg Cutlet, Tomato Sauce, Lemon Tea', 'Dal Makhani, Mix Veg Sabzi, Tandoori Roti, Jeera Rice, Fruit Custard', 'Fruit Custard', 'Pure Veg'),
(3, 'Wednesday', 'Idli, Medu Vada, Sambar, Tomato Chutney, Tea/Coffee', 'Chole Bhature / Steamed Rice, Yellow Dal, Sirka Onion Salad, Fresh Buttermilk', 'Onion Pakoda, Masala Chai', 'Matar Mushroom / Egg Curry, Dal Fry, Roti, Pulao, Rasgulla', 'Rasgulla', 'Veg / Non-Veg options'),
(4, 'Thursday', 'Aloo Paratha with White Butter, Pickle, Curd, Tea/Coffee', 'Kashmiri Dum Aloo, Dal Palak, Steamed Rice, Roti, Cucumber Raita', 'Sweet Corn Chaat, Filter Coffee', 'Shahi Paneer, Dal Tadka, Missi Roti, Steamed Rice, Moong Dal Halwa', 'Moong Dal Halwa', 'Pure Veg'),
(5, 'Friday', 'Upma with Vegetables, Sev, Coconut Chutney, Boiled Eggs, Tea/Coffee', 'Amritsari Dal, Seasonal Subzi, Steamed Rice, Roti, Fresh Curd, Papad', 'Bread Pakoda with Green Chutney, Masala Chai', 'Veg Biryani / Hyderabadi Chicken Biryani, Mirchi Ka Salan, Raita, Ice Cream', 'Special Biryani & Ice Cream', 'High-Protein Feast'),
(6, 'Saturday', 'Methi Thepla, Chhundo, Boiled Sprouts, Banana, Tea/Coffee', 'Pav Bhaji with Butter Pav, Jeera Pulao, Curd, Lemon Salad', 'Biscuits & Roasted Chana, Green Tea / Chai', 'Malai Kofta, Dal Kolhapuri, Garlic Naan / Chapati, Steamed Rice, Sewaiyan Kheer', 'Sewaiyan Kheer', 'Deluxe Feast'),
(7, 'Sunday', 'Chole Puri with Halwa, Fresh Fruit Juice, Tea/Coffee', 'Special Sunday Thali: Paneer Lababdar / Mutton Curry, Dal Maharani, Rice, Roti, Papad', 'Cold Coffee, Veg Sandwich', 'Light Khichdi / Pulao, Aloo Gobi, Roti, Kadhi, Sweet Lassi', 'Sunday Special Thali & Lassi', 'Chef Special');

-- 12. MESS FEEDBACK
INSERT INTO mess_feedback (id, student_id, meal_type, rating, taste_rating, quality_rating, cleanliness_rating, comments, date) VALUES
(1, 1, 'Dinner', 5, 5, 5, 4, 'Friday Hyderabadi Biryani was outstanding! Chicken was tender and aroma was authentic.', '2026-09-11'),
(2, 2, 'Lunch', 4, 4, 4, 5, 'Rajma chawal taste was very good and served piping hot.', '2026-09-12'),
(3, 3, 'Breakfast', 4, 4, 5, 4, 'South Indian breakfast sambar consistency was very good.', '2026-09-13');

-- 13. NOTICES
INSERT INTO notices (id, title, description, category, priority, published_by_user_id, target_audience, date, expires_at) VALUES
(1, 'Hostel Room Safety & Electrical Equipment Inspection', 'Annual mandatory room safety audit will be conducted by the Chief Warden and Technical Team on 18th Sept between 10:00 AM - 02:00 PM. High-wattage heating coils are strictly prohibited.', 'Inspection', 'Urgent', 4, 'all', '2026-09-14', '2026-09-20'),
(2, 'Core Switch Network Maintenance - Block B & C', 'Campus Network Operations Centre will upgrade the fiber backbone switches in Block B & C on Saturday midnight (1:00 AM - 4:00 AM). Internet will be briefly intermittent.', 'Maintenance', 'Normal', 5, 'students', '2026-09-13', '2026-09-19'),
(3, 'Night Gate Curfew & Biometric Attendance Reminder', 'All hostel residents are reminded that main campus entry gate closes at 09:30 PM sharp. Night biometric check-in is mandatory between 09:30 PM - 10:15 PM.', 'Discipline', 'High', 4, 'students', '2026-09-10', '2026-10-31'),
(4, 'Annual Inter-Hostel Sports & Cultural Meet 2026', 'Registrations are open for Badminton, Table Tennis, Chess, and E-Sports representing Himalaya and Nilgiri Hostels. Contact sports secretary before 22nd Sept.', 'Event', 'Normal', 4, 'all', '2026-09-12', '2026-09-22');

-- 14. FEES
INSERT INTO fees (id, student_id, semester, total_amount, paid_amount, pending_amount, due_date, status, receipt_number, last_payment_date, transaction_id, payment_method) VALUES
(1, 1, 6, 45000.00, 30000.00, 15000.00, '2026-09-30', 'Partial', 'RCPT-2026-08912', '2026-08-15 11:24:00', 'TXN_APEX_89234710', 'UPI - GPay'),
(2, 2, 6, 42000.00, 42000.00, 0.00, '2026-09-30', 'Paid', 'RCPT-2026-08913', '2026-08-10 16:40:00', 'TXN_APEX_89234711', 'Net Banking - HDFC'),
(3, 3, 6, 45000.00, 0.00, 45000.00, '2026-09-30', 'Pending', NULL, NULL, NULL, NULL);

-- 15. ROOM CHANGE REQUESTS
INSERT INTO room_change_requests (id, student_id, current_bed_id, preferred_block, preferred_room_type, reason, status, warden_notes, created_at) VALUES
(1, 2, 2, 'Block B', 'Deluxe', 'Require quiet corner room for GATE preparation', 'Pending', 'Under review subject to vacancy in B-205.', '2026-09-14 11:00:00');

-- 16. GATE PASSES
INSERT INTO gate_passes (id, student_id, pass_type, destination, reason, departure_time, expected_return, status, qr_token, approved_by_user_id, warden_remarks, created_at) VALUES
(1, 1, 'Night Out', 'Family Residence, Vasant Kunj, New Delhi', 'Attending sister wedding ceremony and weekend family event', '2026-09-19 16:00:00', '2026-09-21 20:00:00', 'Approved', 'GP-2026-78491-AARAV', 4, 'Parent confirmation call verified. Return before 8 PM Sunday.', '2026-09-13 14:20:00'),
(2, 1, 'Day Outing', 'Connaught Place / Central Library', 'Book purchase and semester reference material study', '2026-09-16 14:00:00', '2026-09-16 20:30:00', 'Pending', 'GP-2026-78492-AARAV', NULL, NULL, '2026-09-15 09:00:00');

-- 17. ATTENDANCE (Recent 10 days for Aarav)
INSERT INTO attendance (student_id, date, status, remarks) VALUES
(1, '2026-09-05', 'Present', 'Biometric Check-in 21:42'),
(1, '2026-09-06', 'Present', 'Biometric Check-in 21:55'),
(1, '2026-09-07', 'Present', 'Biometric Check-in 21:38'),
(1, '2026-09-08', 'Present', 'Biometric Check-in 22:01'),
(1, '2026-09-09', 'Present', 'Biometric Check-in 21:45'),
(1, '2026-09-10', 'Present', 'Biometric Check-in 21:50'),
(1, '2026-09-11', 'Present', 'Biometric Check-in 21:40'),
(1, '2026-09-12', 'Present', 'Biometric Check-in 21:52'),
(1, '2026-09-13', 'Present', 'Biometric Check-in 22:04'),
(1, '2026-09-14', 'Present', 'Biometric Check-in 21:47');
