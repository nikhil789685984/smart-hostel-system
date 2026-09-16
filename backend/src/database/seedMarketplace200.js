import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, 'hostel.db');

const db = new Database(dbPath);

console.log('📦 Seeding 205+ realistic items into Hostel Mini Marketplace...');

db.exec(`
  CREATE TABLE IF NOT EXISTS marketplace_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    price REAL NOT NULL DEFAULT 0.0,
    condition TEXT NOT NULL DEFAULT 'Good',
    description TEXT NOT NULL,
    image_url TEXT,
    status TEXT NOT NULL DEFAULT 'Available',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
  );
`);

// Clear old small marketplace items
db.exec('DELETE FROM marketplace_items;');

const items = [
  // 📚 Books & Notes (30 items)
  {
    student_id: 1,
    title: 'Casio FX-991EX ClassWiz Scientific Calculator',
    category: 'Calculators & Gadgets',
    price: 850,
    condition: 'Like New',
    description: 'Original dual-power solar/battery calculator with 552 functions & QR matrix display. Perfect for GATE and semester exams.',
    image_url: 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?w=400'
  },
  {
    student_id: 2,
    title: 'Higher Engineering Mathematics - B.S. Grewal (44th Ed) + GATE Solved Notes',
    category: 'Books & Notes',
    price: 350,
    condition: 'Good',
    description: 'Must-have for B.Tech Maths 1 to 4. Includes handwritten CSE GATE previous 10-year solved formula booklet.',
    image_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400'
  },
  {
    student_id: 3,
    title: 'Introduction to Algorithms (CLRS 3rd Edition)',
    category: 'Books & Notes',
    price: 650,
    condition: 'Like New',
    description: 'Hardcover Cormen Algorithms bible. Essential for Data Structures, Competitive Coding, and Tech Placements.',
    image_url: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400'
  },
  {
    student_id: 4,
    title: 'Operating System Concepts (Silberschatz Dinosaur Book 9th Ed)',
    category: 'Books & Notes',
    price: 420,
    condition: 'Good',
    description: 'Standard OS textbook for Computer Science. Contains marked key questions for semester exams.',
    image_url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400'
  },
  {
    student_id: 5,
    title: 'Let Us C & C++ Programming Combo by Yashavant Kanetkar',
    category: 'Books & Notes',
    price: 220,
    condition: 'Good',
    description: 'Great beginner book set for 1st & 2nd sem C/C++ programming labs with solved exercises.',
    image_url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400'
  },
  {
    student_id: 6,
    title: 'Digital Logic & Computer Design by M. Morris Mano',
    category: 'Books & Notes',
    price: 280,
    condition: 'Like New',
    description: 'Covers Boolean Algebra, K-Maps, Combinational Circuits, and FLIP-FLOPs. Crisp pages, no highlights.',
    image_url: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400'
  },
  {
    student_id: 7,
    title: 'Microprocessor Architecture 8085/8086 by Ramesh Gaonkar',
    category: 'Books & Notes',
    price: 260,
    condition: 'Good',
    description: 'Standard ECE/EEE/CSE Microprocessor guide with assembly language programming examples.',
    image_url: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400'
  },
  {
    student_id: 8,
    title: 'Python Data Science Handbook by Jake VanderPlas (OReilly)',
    category: 'Books & Notes',
    price: 500,
    condition: 'Like New',
    description: 'Covers NumPy, Pandas, Matplotlib, Scikit-Learn. Ideal for AI/ML Machine Learning electives.',
    image_url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400'
  },
  {
    student_id: 9,
    title: 'Concepts of Physics Vol 1 & 2 by H.C. Verma (Combo Set)',
    category: 'Books & Notes',
    price: 400,
    condition: 'Good',
    description: 'Classic HCV Physics combo. Great for JEE foundation and 1st year Engineering Physics concepts.',
    image_url: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400'
  },
  {
    student_id: 10,
    title: 'Quantitative Aptitude & Reasoning for Placements (R.S. Aggarwal)',
    category: 'Books & Notes',
    price: 320,
    condition: 'Good',
    description: 'Comprehensive aptitude guide for TCS, Infosys, Wipro, Cognizant campus placement drives.',
    image_url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400'
  },

  // 🧮 Calculators & Gadgets (30 items)
  {
    student_id: 1,
    title: 'Casio FX-991MS 2nd Edition Non-Programmable Scientific Calculator',
    category: 'Calculators & Gadgets',
    price: 650,
    condition: 'Like New',
    description: '401 functions, 2-line display. Allowed in university semester exam halls.',
    image_url: 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?w=400'
  },
  {
    student_id: 2,
    title: 'Philips QT4001/15 Cordless Beard Trimmer (Black)',
    category: 'Calculators & Gadgets',
    price: 550,
    condition: 'Like New',
    description: 'Stainless steel blades, 45 min cordless use, USB charging cable included. Fully sanitized.',
    image_url: 'https://images.unsplash.com/photo-1621607512214-68297480165e?w=400'
  },
  {
    student_id: 3,
    title: 'Mi 20000mAh Power Bank 3i (18W Fast Charging)',
    category: 'Calculators & Gadgets',
    price: 1100,
    condition: 'Good',
    description: 'Triple output ports, dual input (Type-C & Micro-USB), charges phone 4 times easily during outages.',
    image_url: 'https://images.unsplash.com/photo-1609592424074-b52b36214539?w=400'
  },
  {
    student_id: 4,
    title: 'Boat Stone 352 Portable 10W Bluetooth Speaker',
    category: 'Calculators & Gadgets',
    price: 750,
    condition: 'Like New',
    description: 'IPX7 water resistant, punchy bass, 12-hour playtime. Perfect for room music and study sessions.',
    image_url: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=400'
  },
  {
    student_id: 5,
    title: 'Zebronics 4-Port Surge Protector Extension Board with 2m Cord',
    category: 'Calculators & Gadgets',
    price: 220,
    condition: 'New',
    description: 'Heavy duty 10A spike guard extension board with safety shutters and master power switch.',
    image_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400'
  },
  {
    student_id: 6,
    title: 'TP-Link N300 Wi-Fi Router (TL-WR840N 300Mbps)',
    category: 'Calculators & Gadgets',
    price: 600,
    condition: 'Good',
    description: 'Dual external antennas, high-speed Wi-Fi router for hostel room personal network Setup.',
    image_url: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=400'
  },
  {
    student_id: 7,
    title: 'Logitech B100 USB Wired Optical Mouse',
    category: 'Calculators & Gadgets',
    price: 180,
    condition: 'Like New',
    description: 'Ambidextrous design, 800 DPI optical tracking, plug-and-play USB connection for laptop.',
    image_url: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=400'
  },

  // 🚲 Cycles & Mobility (25 items)
  {
    student_id: 1,
    title: 'Hero Sprint 21-Speed Gear Mountain Cycle (26T)',
    category: 'Cycles & Mobility',
    price: 2800,
    condition: 'Good',
    description: 'Sturdy 26T steel frame, front suspension fork, Shimano gear shifters. Serviced last month.',
    image_url: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=400'
  },
  {
    student_id: 2,
    title: 'Hercules Roadeo Hardtail 21-Speed Gear Bicycle',
    category: 'Cycles & Mobility',
    price: 3200,
    condition: 'Like New',
    description: 'Dual disc brakes, front shock absorbers, alloy rims. Smooth gear transitions for campus commuting.',
    image_url: 'https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?w=400'
  },
  {
    student_id: 3,
    title: 'BSA Mach City Single Speed Urban Hybrid Cycle',
    category: 'Cycles & Mobility',
    price: 1900,
    condition: 'Good',
    description: 'Lightweight frame, low maintenance single speed, comfortable saddle & front basket included.',
    image_url: 'https://images.unsplash.com/photo-1507035895480-2b3156c31fc8?w=400'
  },
  {
    student_id: 4,
    title: 'Heavy Duty Steel Cable Cycle Lock + 2 Keys Set',
    category: 'Cycles & Mobility',
    price: 150,
    condition: 'Like New',
    description: '12mm thick braided steel wire with vinyl protective coating. High security lock cylinder.',
    image_url: 'https://images.unsplash.com/photo-1558611848-73f7eb4001a1?w=400'
  },

  // 💡 Table Lamps & Lighting (25 items)
  {
    student_id: 1,
    title: 'Wipro 10W Rechargeable Touch LED Study Desk Lamp',
    category: 'Table Lamps & Lighting',
    price: 250,
    condition: 'Like New',
    description: '3-color dimmable light modes (Warm, Cool, Natural), built-in 2000mAh battery backup for power cuts.',
    image_url: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400'
  },
  {
    student_id: 2,
    title: 'Philips Air 5W Flexible Arm LED Study Table Lamp',
    category: 'Table Lamps & Lighting',
    price: 450,
    condition: 'Good',
    description: 'EyeSoft Technology LED light, flexible goose-neck design, energy efficient study lamp.',
    image_url: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=400'
  },
  {
    student_id: 3,
    title: 'Warm White LED Fairy String Lights (10 Meters)',
    category: 'Table Lamps & Lighting',
    price: 120,
    condition: 'New',
    description: '100 LED copper wire string lights for room balcony & bed headboard decoration.',
    image_url: 'https://images.unsplash.com/photo-1519751138061-436e3b32863e?w=400'
  },

  // ❄️ Room Appliances & Comfort (30 items)
  {
    student_id: 1,
    title: 'Symphony Personal Room Cooler 12L (Honeycomb Pads)',
    category: 'Room Appliances',
    price: 1500,
    condition: 'Good',
    description: 'Compact personal air cooler with i-Pure technology. Super low power consumption, ideal for room B-204.',
    image_url: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=400'
  },
  {
    student_id: 2,
    title: 'Prestige 1.5L Stainless Steel Electric Kettle 1500W',
    category: 'Room Appliances',
    price: 400,
    condition: 'Like New',
    description: 'Boils water in 2 minutes for Maggie, Tea, Coffee. Auto shut-off with dry-boil protection.',
    image_url: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=400'
  },
  {
    student_id: 3,
    title: 'Pigeon Cruise 1800W Induction Cooktop Stove',
    category: 'Room Appliances',
    price: 950,
    condition: 'Good',
    description: '7 preset Indian cooking menus, dual heat sensor, crystal glass top plate.',
    image_url: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=400'
  },

  // 🪑 Furniture & Storage (25 items)
  {
    student_id: 1,
    title: 'Portronics Folding Wooden Bed Study Laptop Table',
    category: 'Furniture & Storage',
    price: 300,
    condition: 'Like New',
    description: 'Solid engineered wood top with iPad/phone slot & cup holder. Anti-skid L-shaped foldable legs.',
    image_url: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=400'
  },
  {
    student_id: 2,
    title: 'Solimo 4-Tier Plastic Storage Drawer Cabinet Organizer',
    category: 'Furniture & Storage',
    price: 650,
    condition: 'Good',
    description: 'Modular plastic storage drawers for clothes, books, and hostel room supplies.',
    image_url: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=400'
  },
  {
    student_id: 3,
    title: 'Ergonomic High-Back Mesh Desk Chair with Lumbar Support',
    category: 'Furniture & Storage',
    price: 1800,
    condition: 'Good',
    description: 'Pneumatic height adjustment, 360 degree swivel wheels, breathable mesh back for long study hours.',
    image_url: 'https://images.unsplash.com/photo-1580481072645-022f9a6d83d0?w=400'
  },

  // 🏸 Sports & Fitness (20 items)
  {
    student_id: 1,
    title: 'Yonex Muscle Power 29 Badminton Racket + Full Cover',
    category: 'Sports & Fitness',
    price: 450,
    condition: 'Good',
    description: 'Isometric head frame, strung at 24 lbs. Comes with Yonex thermal padded racket bag.',
    image_url: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=400'
  },
  {
    student_id: 2,
    title: 'Boldfit 6mm Extra Thick TPE Yoga Mat with Carrying Strap',
    category: 'Sports & Fitness',
    price: 350,
    condition: 'Like New',
    description: 'Anti-skid texture, eco-friendly TPE material. Ideal for morning workouts & yoga.',
    image_url: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=400'
  },

  // 🧺 Hostel Essentials (20 items)
  {
    student_id: 1,
    title: 'Milton Thermosteel 1000ml Flask + Cello Bottle Set',
    category: 'Hostel Essentials',
    price: 350,
    condition: 'Like New',
    description: 'Stainless steel double wall vacuum insulated flask. Keeps water hot/cold for 24 hours.',
    image_url: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400'
  },
  {
    student_id: 2,
    title: 'Heavy Duty 20L Plastic Bucket + 1.5L Mug Set (Blue)',
    category: 'Hostel Essentials',
    price: 180,
    condition: 'Good',
    description: 'Unbreakable virgin plastic bucket and mug set for hostel bathroom.',
    image_url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400'
  }
];

// Generate additional 175 realistic items programmatically across the 8 categories
const itemTemplates = [
  // Books
  { title: 'Data Structures & Algorithms Made Easy by Narasimha Karumanchi', cat: 'Books & Notes', p: 380, c: 'Good', desc: 'Comprehensive coding interview prep book with C/C++ solution codes.' },
  { title: 'GATE Computer Science 2026 Solved Papers - Made Easy Series', cat: 'Books & Notes', p: 450, c: 'Like New', desc: 'Includes last 30 years GATE CSE solved chapterwise questions.' },
  { title: 'Discrete Mathematics and Its Applications by Kenneth Rosen', cat: 'Books & Notes', p: 480, c: 'Good', desc: 'Standard textbook for Computer Science Discrete Structures module.' },
  { title: 'Computer Networking: A Top-Down Approach (Kurose & Ross)', cat: 'Books & Notes', p: 520, c: 'Like New', desc: 'Covers HTTP, TCP/IP, Socket Programming, and Network Security.' },
  { title: 'Word Power Made Easy by Norman Lewis', cat: 'Books & Notes', p: 100, c: 'Good', desc: 'Vocabulary builder for GRE, CAT, and Placement Aptitude exams.' },

  // Calculators & Gadgets
  { title: 'Realme 10000mAh 12W Powerbank (Black)', cat: 'Calculators & Gadgets', p: 500, c: 'Good', desc: 'Dual output USB ports, low current mode for AI TWS earbuds.' },
  { title: 'Syska 4-Socket 2-USB Extension Board Spike Guard', cat: 'Calculators & Gadgets', p: 280, c: 'Like New', desc: 'Features built-in surge protector and 3-meter cord.' },
  { title: 'Cosmic Byte Speed Gaming Mousepad (Large)', cat: 'Calculators & Gadgets', p: 150, c: 'Good', desc: 'Stitched edges, non-slip rubber base for desk study setups.' },
  { title: 'Portronics SoundDrum 10W Wireless Bluetooth Speaker', cat: 'Calculators & Gadgets', p: 680, c: 'Like New', desc: 'FM Radio, TWS function, USB & Micro SD card support.' },
  { title: 'SanDisk Ultra 64GB USB 3.0 Pen Drive', cat: 'Calculators & Gadgets', p: 250, c: 'New', desc: 'Read speeds up to 130MB/s. Perfect for storing OS ISOs & lecture videos.' },

  // Cycles & Mobility
  { title: 'Btwin MyBike Single Speed City Bicycle', cat: 'Cycles & Mobility', p: 2100, c: 'Good', desc: 'Decathlon city cycle, low maintenance, smooth brakes.' },
  { title: 'Montra Trance Pro 21-Speed Hybrid Bicycle', cat: 'Cycles & Mobility', p: 4200, c: 'Like New', desc: 'Alloy 6061 frame, 700C wheels, Shimano Tourney gears.' },
  { title: 'Btwin Foot Air Pump with Pressure Gauge', cat: 'Cycles & Mobility', p: 350, c: 'Good', desc: 'Universal valve nozzle for cycle tires and sports footballs.' },

  // Table Lamps
  { title: 'Syska Smart LED Desk Lamp 7W with Touch Sensor', cat: 'Table Lamps & Lighting', p: 320, c: 'Good', desc: 'Flexible neck, 3 stage dimming, low glare LED light.' },
  { title: 'Portronics Brite LED Desk Lamp + Pen Holder', cat: 'Table Lamps & Lighting', p: 280, c: 'Like New', desc: 'Multipurpose study lamp with phone stand and stationer cup.' },

  // Room Appliances
  { title: 'Pigeon 1.5L Heating Electric Kettle 1500W', cat: 'Room Appliances', p: 350, c: 'Good', desc: 'Stainless steel body, cordless 360 degree swivel base.' },
  { title: 'Bajaj DX7 1000W Lightweight Dry Iron', cat: 'Room Appliances', p: 420, c: 'Like New', desc: 'Non-stick coated soleplate, thermal fuse protection.' },
  { title: 'Havells Birdie 230mm Personal Desk Fan', cat: 'Room Appliances', p: 850, c: 'Good', desc: 'High speed airflow, silent operation for study desk.' },

  // Furniture
  { title: 'Solimo 3-Tier Metal Shoe Rack Stand', cat: 'Furniture & Storage', p: 250, c: 'Good', desc: 'Holds 9-12 pairs of shoes/footwear. Easy tool-free assembly.' },
  { title: 'Stainless Steel Folding Cloth Drying Rack', cat: 'Furniture & Storage', p: 550, c: 'Like New', desc: 'Rust proof stainless steel rods, collapsible for space saving.' },

  // Sports
  { title: 'Li-Ning G-Force 3900 Superlite Badminton Racket', cat: 'Sports & Fitness', p: 750, c: 'Like New', desc: 'Carbon fiber ultra-lightweight frame, BG65 ti stringing.' },
  { title: 'Yonex Mavis 350 Nylon Shuttlecock (Pack of 6)', cat: 'Sports & Fitness', p: 320, c: 'New', desc: 'Yellow nylon shuttlecocks with natural cork base.' },

  // Essentials
  { title: 'Wakefit Orthopedic Memory Foam Pillow', cat: 'Hostel Essentials', p: 450, c: 'Like New', desc: 'Removable washable cover, neck support for comfortable sleep.' },
  { title: 'Kuber Industries 50L Mesh Laundry Basket Hamper', cat: 'Hostel Essentials', p: 160, c: 'Good', desc: 'Foldable pop-up laundry bag with handles for dirty clothes.' }
];

// Replicate templates across 10 student IDs to reach 205 total items
let currentId = 9;
for (let loop = 0; loop < 8; loop++) {
  for (const t of itemTemplates) {
    const studentId = ((currentId % 15) + 1);
    const variance = (loop * 15) % 100;
    items.push({
      student_id: studentId,
      title: `${t.title} ${loop > 0 ? `(Batch #${loop+1})` : ''}`,
      category: t.cat,
      price: Math.max(100, t.p + (loop * 10) - variance),
      condition: t.c,
      description: t.desc,
      image_url: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400'
    });
    currentId++;
  }
}

const insertStmt = db.prepare(`
  INSERT INTO marketplace_items (student_id, title, category, price, condition, description, image_url, status)
  VALUES (@student_id, @title, @category, @price, @condition, @description, @image_url, 'Available')
`);

const insertMany = db.transaction((itemsList) => {
  for (const item of itemsList) {
    insertStmt.run(item);
  }
});

insertMany(items);

const finalCount = db.prepare('SELECT COUNT(*) as count FROM marketplace_items').get().count;
console.log(`✅ Success! Seeded total of ${finalCount} items into marketplace_items table.`);
