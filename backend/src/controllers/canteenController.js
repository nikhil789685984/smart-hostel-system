import { get, all, run } from '../database/db.js';
import { createNotification } from './notificationController.js';

export async function initCanteenDB() {
  await run(`
    CREATE TABLE IF NOT EXISTS canteen_menu (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      category TEXT,
      image_url TEXT,
      is_available BOOLEAN DEFAULT 1
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS canteen_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      items_json TEXT NOT NULL,
      total_amount REAL NOT NULL,
      status TEXT DEFAULT 'Pending', 
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id)
    )
  `);

  const count = await get("SELECT COUNT(*) as count FROM canteen_menu");
  if (count.count < 100) {
    console.log("Seeding large canteen menu...");
    const bases = ['Burger', 'Pizza', 'Sandwich', 'Wrap', 'Roll', 'Noodles', 'Maggi', 'Pasta', 'Fries', 'Momos'];
    const modifiers = ['Veg', 'Paneer', 'Cheese', 'Spicy', 'Peri Peri', 'Tandoori', 'Corn', 'Mushroom', 'Crispy', 'Loaded'];
    const bevBases = ['Shake', 'Cold Coffee', 'Tea', 'Mojito', 'Lemonade', 'Lassi', 'Smoothie', 'Juice'];
    const bevFlav = ['Chocolate', 'Strawberry', 'Mango', 'Oreo', 'Mint', 'Masala', 'Sweet', 'Salted'];

    // Add classic items
    let seedItems = [
      { name: 'Masala Maggi', desc: 'Spicy hostel special maggi', price: 40, category: 'Snacks', img: 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=400' },
      { name: 'Cheese Maggi', desc: 'Loaded with mozzarella cheese', price: 60, category: 'Snacks', img: 'https://images.unsplash.com/photo-1603105037880-880cd41f40f0?w=400' },
      { name: 'Aloo Patty', desc: 'Crispy and hot baked patty', price: 25, category: 'Snacks', img: 'https://images.unsplash.com/photo-1626245842846-993d39572b83?w=400' },
      { name: 'Paneer Patty', desc: 'Stuffed with spicy paneer', price: 35, category: 'Snacks', img: 'https://images.unsplash.com/photo-1604152135912-04a022e23696?w=400' },
    ];

    // Generate ~100 Food Items
    bases.forEach(base => {
      modifiers.forEach(mod => {
        seedItems.push({
          name: `${mod} ${base}`,
          desc: `Delicious ${mod.toLowerCase()} ${base.toLowerCase()} freshly prepared.`,
          price: Math.floor(Math.random() * 100) + 40,
          category: 'Meals & Snacks',
          img: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400'
        });
      });
    });

    // Generate ~64 Beverages
    bevBases.forEach(base => {
      bevFlav.forEach(flav => {
        seedItems.push({
          name: `${flav} ${base}`,
          desc: `Refreshing ${flav.toLowerCase()} ${base.toLowerCase()} to quench your thirst.`,
          price: Math.floor(Math.random() * 60) + 30,
          category: 'Beverages',
          img: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400'
        });
      });
    });

    // Generate ~30 Desserts
    const desserts = ['Brownie', 'Ice Cream', 'Pastry', 'Waffle', 'Pancake', 'Donut'];
    const dFlavs = ['Chocolate', 'Vanilla', 'Red Velvet', 'Blueberry', 'Caramel'];
    desserts.forEach(base => {
      dFlavs.forEach(flav => {
        seedItems.push({
          name: `${flav} ${base}`,
          desc: `Sweet and decadent ${flav.toLowerCase()} ${base.toLowerCase()}.`,
          price: Math.floor(Math.random() * 80) + 50,
          category: 'Desserts',
          img: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400'
        });
      });
    });

    for (const item of seedItems) {
      await run(
        "INSERT INTO canteen_menu (name, description, price, category, image_url) VALUES (?, ?, ?, ?, ?)",
        [item.name, item.desc, item.price, item.category, item.img]
      );
    }
  }
}

export async function getMenu(req, res) {
  try {
    await initCanteenDB();
    const menu = await all("SELECT * FROM canteen_menu WHERE is_available = 1");
    res.json({ success: true, menu });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function placeOrder(req, res) {
  try {
    await initCanteenDB();
    const { items, total_amount, payment_mode } = req.body; 
    
    const student = await get('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    // Deduct from fee ledger if 'Ledger'
    if (payment_mode === 'Ledger') {
      const fee = await get("SELECT * FROM fees WHERE student_id = ? ORDER BY semester DESC LIMIT 1", [student.id]);
      if (fee) {
        await run("UPDATE fees SET pending_amount = pending_amount + ? WHERE id = ?", [total_amount, fee.id]);
        const receiptNo = `CANT-${Date.now()}`;
        await run(`
          INSERT INTO fee_transactions (fee_id, student_id, amount, payment_method, transaction_id, receipt_number)
          VALUES (?, ?, ?, 'Canteen Bill (Added to Ledger)', 'BILL_CANT', ?)
        `, [fee.id, student.id, total_amount, receiptNo]);
      } else {
         return res.status(400).json({ success: false, message: 'No active fee account found to bill the order.'});
      }
    }

    // If Razorpay, it's pre-paid. We can just create the order directly.

    const info = await run(
      "INSERT INTO canteen_orders (student_id, items_json, total_amount) VALUES (?, ?, ?)",
      [student.id, JSON.stringify(items), total_amount]
    );

    await createNotification(
      req.user.id,
      '🍔 Order Placed!',
      `Your Canteen order for ₹${total_amount} is placed. It will be delivered to your room shortly.`,
      'info',
      '/canteen'
    );

    res.json({ success: true, message: `Order placed successfully! Paid via ${payment_mode}.`, orderId: info.insertId });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getMyOrders(req, res) {
  try {
    await initCanteenDB();
    const student = await get('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    // Auto mark orders as Delivered if older than 10 mins
    await run(`
      UPDATE canteen_orders 
      SET status = 'Delivered' 
      WHERE status != 'Delivered' 
      AND (julianday('now') - julianday(created_at)) * 24 * 60 >= 10
    `);

    const orders = await all("SELECT * FROM canteen_orders WHERE student_id = ? ORDER BY created_at DESC", [student.id]);
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getAllOrders(req, res) {
  try {
    await initCanteenDB();
    
    // Auto mark orders as Delivered if older than 10 mins
    await run(`
      UPDATE canteen_orders 
      SET status = 'Delivered' 
      WHERE status != 'Delivered' 
      AND (julianday('now') - julianday(created_at)) * 24 * 60 >= 10
    `);

    const orders = await all(`
      SELECT o.*, u.name, r.room_number, s.roll_number
      FROM canteen_orders o
      JOIN students s ON s.id = o.student_id
      JOIN users u ON u.id = s.user_id
      LEFT JOIN room_allocations ra ON ra.student_id = s.id AND ra.status = 'active'
      LEFT JOIN beds b ON b.id = ra.bed_id
      LEFT JOIN rooms r ON r.id = b.room_id
      ORDER BY 
        CASE 
          WHEN o.status = 'Pending' THEN 1
          WHEN o.status = 'Preparing' THEN 2
          WHEN o.status = 'Out for Delivery' THEN 3
          ELSE 4 
        END,
        o.created_at DESC
    `);
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function updateOrderStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    await run("UPDATE canteen_orders SET status = ? WHERE id = ?", [status, id]);
    
    const order = await get("SELECT student_id, total_amount FROM canteen_orders WHERE id = ?", [id]);
    if (order) {
      const student = await get("SELECT user_id FROM students WHERE id = ?", [order.student_id]);
      if (student) {
        let msg = `Your Canteen order (₹${order.total_amount}) is now ${status}.`;
        if (status === 'Delivered') msg = `Enjoy your meal! Your Canteen order (₹${order.total_amount}) has been Delivered.`;
        
        await createNotification(
          student.user_id,
          '🍔 Order Update',
          msg,
          status === 'Delivered' ? 'success' : 'info',
          '/canteen'
        );
      }
    }
    
    res.json({ success: true, message: `Order status updated to ${status}` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
