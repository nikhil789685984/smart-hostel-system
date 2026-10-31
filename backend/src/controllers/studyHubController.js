import { get, all, run } from '../database/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, '../../uploads');

// Auto-initialize Study Hub DB Tables & Migrations
export async function initStudyHubDB() {
  try {
    // 1. Create study_subjects table
    await run(`
      CREATE TABLE IF NOT EXISTS study_subjects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        code TEXT,
        color TEXT DEFAULT 'indigo',
        icon TEXT DEFAULT 'book',
        semester INTEGER DEFAULT 6,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Create or verify study_materials table
    await run(`
      CREATE TABLE IF NOT EXISTS study_materials (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        subject_id INTEGER,
        subject_name TEXT,
        title TEXT NOT NULL,
        description TEXT,
        material_type TEXT NOT NULL,
        file_url TEXT,
        external_url TEXT,
        file_name TEXT,
        file_size TEXT,
        file_type TEXT,
        tags TEXT,
        is_favorite INTEGER DEFAULT 0,
        uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (subject_id) REFERENCES study_subjects(id) ON DELETE SET NULL
      )
    `);

    // Migrate existing columns if study_materials existed from previous partial schema
    const cols = await all(`PRAGMA table_info(study_materials)`);
    const colNames = cols.map(c => c.name);

    if (!colNames.includes('user_id')) {
      try { await run(`ALTER TABLE study_materials ADD COLUMN user_id INTEGER`); } catch (e) {}
    }
    if (!colNames.includes('subject_id')) {
      try { await run(`ALTER TABLE study_materials ADD COLUMN subject_id INTEGER`); } catch (e) {}
    }
    if (!colNames.includes('subject_name')) {
      try { await run(`ALTER TABLE study_materials ADD COLUMN subject_name TEXT`); } catch (e) {}
    }
    if (!colNames.includes('title')) {
      try { await run(`ALTER TABLE study_materials ADD COLUMN title TEXT`); } catch (e) {}
    }
    if (!colNames.includes('description')) {
      try { await run(`ALTER TABLE study_materials ADD COLUMN description TEXT`); } catch (e) {}
    }
    if (!colNames.includes('material_type')) {
      try { await run(`ALTER TABLE study_materials ADD COLUMN material_type TEXT DEFAULT 'document'`); } catch (e) {}
    }
    if (!colNames.includes('file_url')) {
      try { await run(`ALTER TABLE study_materials ADD COLUMN file_url TEXT`); } catch (e) {}
    }
    if (!colNames.includes('external_url')) {
      try { await run(`ALTER TABLE study_materials ADD COLUMN external_url TEXT`); } catch (e) {}
    }
    if (!colNames.includes('tags')) {
      try { await run(`ALTER TABLE study_materials ADD COLUMN tags TEXT`); } catch (e) {}
    }
    if (!colNames.includes('is_favorite')) {
      try { await run(`ALTER TABLE study_materials ADD COLUMN is_favorite INTEGER DEFAULT 0`); } catch (e) {}
    }
    if (!colNames.includes('created_at')) {
      try { await run(`ALTER TABLE study_materials ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP`); } catch (e) {}
    }

    console.log('✅ Study Hub database tables verified and initialized.');
  } catch (err) {
    console.error('Study Hub DB Init Error:', err);
  }
}

/**
 * GET /api/student/study-hub/subjects
 * Returns all subjects for the user along with material counts
 */
export async function getSubjects(req, res) {
  try {
    const userId = req.user.id;
    await initStudyHubDB();

    const subjects = await all(
      `SELECT s.*, 
              (SELECT COUNT(*) FROM study_materials m WHERE m.subject_id = s.id AND m.user_id = s.user_id) as material_count
       FROM study_subjects s
       WHERE s.user_id = ?
       ORDER BY s.id ASC`,
      [userId]
    );

    res.json({
      success: true,
      subjects: subjects || []
    });
  } catch (err) {
    console.error('getSubjects Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * POST /api/student/study-hub/subjects
 * Create new subject
 */
export async function createSubject(req, res) {
  try {
    const userId = req.user.id;
    const { name, code, color, icon, semester, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Subject name is required.' });
    }

    const result = await run(
      `INSERT INTO study_subjects (user_id, name, code, color, icon, semester, description)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        name.trim(),
        (code || '').trim().toUpperCase(),
        color || 'indigo',
        icon || 'book',
        parseInt(semester, 10) || 6,
        (description || '').trim()
      ]
    );

    const newId = result.lastInsertRowid || result.insertId;
    const newSubject = await get(`SELECT * FROM study_subjects WHERE id = ?`, [newId]);

    res.status(201).json({
      success: true,
      message: 'Subject added successfully!',
      subject: { ...newSubject, material_count: 0 }
    });
  } catch (err) {
    console.error('createSubject Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * PUT /api/student/study-hub/subjects/:id
 * Edit existing subject
 */
export async function updateSubject(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { name, code, color, icon, semester, description } = req.body;

    const existing = await get(`SELECT * FROM study_subjects WHERE id = ? AND user_id = ?`, [id, userId]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Subject not found or unauthorized.' });
    }

    await run(
      `UPDATE study_subjects
       SET name = ?, code = ?, color = ?, icon = ?, semester = ?, description = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND user_id = ?`,
      [
        name ? name.trim() : existing.name,
        code !== undefined ? code.trim().toUpperCase() : existing.code,
        color || existing.color,
        icon || existing.icon,
        semester ? parseInt(semester, 10) : existing.semester,
        description !== undefined ? description.trim() : existing.description,
        id,
        userId
      ]
    );

    // Also update cached subject_name in study_materials
    if (name && name.trim() !== existing.name) {
      await run(
        `UPDATE study_materials SET subject_name = ? WHERE subject_id = ? AND user_id = ?`,
        [name.trim(), id, userId]
      );
    }

    const updated = await get(`SELECT * FROM study_subjects WHERE id = ?`, [id]);
    const countRow = await get(`SELECT COUNT(*) as count FROM study_materials WHERE subject_id = ?`, [id]);

    res.json({
      success: true,
      message: 'Subject updated successfully!',
      subject: { ...updated, material_count: countRow?.count || 0 }
    });
  } catch (err) {
    console.error('updateSubject Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * DELETE /api/student/study-hub/subjects/:id
 * Delete subject & associated materials
 */
export async function deleteSubject(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const existing = await get(`SELECT * FROM study_subjects WHERE id = ? AND user_id = ?`, [id, userId]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Subject not found or unauthorized.' });
    }

    // Delete associated materials
    await run(`DELETE FROM study_materials WHERE subject_id = ? AND user_id = ?`, [id, userId]);
    await run(`DELETE FROM study_subjects WHERE id = ? AND user_id = ?`, [id, userId]);

    res.json({
      success: true,
      message: `Subject '${existing.name}' and its materials removed.`
    });
  } catch (err) {
    console.error('deleteSubject Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * GET /api/student/study-hub/materials
 * Returns materials filtered by subject, type, and search
 */
export async function getMaterials(req, res) {
  try {
    const userId = req.user.id;
    await initStudyHubDB();

    const { subject_id, type, search } = req.query;

    let sql = `SELECT * FROM study_materials WHERE user_id = ?`;
    const params = [userId];

    if (subject_id && subject_id !== 'all') {
      sql += ` AND subject_id = ?`;
      params.push(subject_id);
    }

    if (type && type !== 'all') {
      sql += ` AND material_type = ?`;
      params.push(type);
    }

    if (search && search.trim()) {
      const q = `%${search.trim()}%`;
      sql += ` AND (title LIKE ? OR description LIKE ? OR file_name LIKE ? OR tags LIKE ?)`;
      params.push(q, q, q, q);
    }

    sql += ` ORDER BY is_favorite DESC, created_at DESC`;

    const materials = await all(sql, params);

    // Calculate total storage used in bytes / MB
    const allUserFiles = await all(
      `SELECT file_size, material_type FROM study_materials WHERE user_id = ? AND file_url IS NOT NULL`,
      [userId]
    );

    let totalBytes = 0;
    for (const f of allUserFiles) {
      if (f.file_size) {
        const match = f.file_size.match(/([\d.]+)\s*(MB|KB|GB|bytes)?/i);
        if (match) {
          const val = parseFloat(match[1]);
          const unit = (match[2] || 'MB').toUpperCase();
          if (unit === 'GB') totalBytes += val * 1024 * 1024 * 1024;
          else if (unit === 'MB') totalBytes += val * 1024 * 1024;
          else if (unit === 'KB') totalBytes += val * 1024;
          else totalBytes += val;
        }
      }
    }

    const usedMb = (totalBytes / (1024 * 1024)).toFixed(1);

    res.json({
      success: true,
      data: materials || [],
      storage: {
        usedMb: parseFloat(usedMb) || 0.0,
        totalMb: 1024,
        totalItems: materials.length
      }
    });
  } catch (err) {
    console.error('getMaterials Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * POST /api/student/study-hub/materials
 * Create / Upload a new study material (PDF, Video, Audio, Link, Doc)
 */
export async function uploadMaterial(req, res) {
  try {
    const userId = req.user.id;
    const {
      subject_id,
      title,
      description,
      material_type,
      file_url,
      external_url,
      file_name,
      file_size,
      file_type,
      tags
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Material title is required.' });
    }

    if (!subject_id) {
      return res.status(400).json({ success: false, message: 'Please select a subject.' });
    }

    // Verify subject
    const subject = await get(`SELECT * FROM study_subjects WHERE id = ? AND user_id = ?`, [subject_id, userId]);
    if (!subject) {
      return res.status(400).json({ success: false, message: 'Selected subject does not exist.' });
    }

    // Determine type
    let finalType = material_type || 'document';
    if (!material_type) {
      if (external_url) {
        if (/youtube\.com|youtu\.be|vimeo\.com/i.test(external_url)) finalType = 'video';
        else if (/\.(mp3|wav|ogg)$/i.test(external_url)) finalType = 'audio';
        else if (/\.pdf$/i.test(external_url)) finalType = 'pdf';
        else finalType = 'link';
      } else if (file_url) {
        if (/\.(mp4|webm|mkv|mov)$/i.test(file_url)) finalType = 'video';
        else if (/\.(mp3|wav|m4a|ogg)$/i.test(file_url)) finalType = 'audio';
        else if (/\.pdf$/i.test(file_url)) finalType = 'pdf';
        else finalType = 'document';
      }
    }

    const formattedSize = file_size || (finalType === 'link' ? 'Web Link' : '2.4 MB');

    const studentId = req.user.student_id || req.user.id;

    const result = await run(
      `INSERT INTO study_materials (
        user_id, student_id, subject, subject_id, subject_name, title, description, material_type,
        file_url, external_url, file_name, file_size, file_type, tags
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        studentId,
        subject.name,
        subject.id,
        subject.name,
        title.trim(),
        (description || '').trim(),
        finalType,
        file_url || null,
        external_url ? external_url.trim() : null,
        file_name || (finalType === 'link' ? 'External Web Resource' : title.trim()),
        formattedSize,
        file_type || finalType,
        (tags || '').trim()
      ]
    );

    const newId = result.lastInsertRowid || result.insertId;
    const newMaterial = await get(`SELECT * FROM study_materials WHERE id = ?`, [newId]);

    res.status(201).json({
      success: true,
      message: 'Study material added successfully!',
      material: newMaterial,
      data: newMaterial
    });
  } catch (err) {
    console.error('uploadMaterial Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * PUT /api/student/study-hub/materials/:id
 * Edit existing study material
 */
export async function updateMaterial(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { title, description, subject_id, external_url, tags, is_favorite } = req.body;

    const existing = await get(`SELECT * FROM study_materials WHERE id = ? AND user_id = ?`, [id, userId]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Material not found or unauthorized.' });
    }

    let subjectName = existing.subject_name;
    let targetSubjectId = existing.subject_id;

    if (subject_id && subject_id !== existing.subject_id) {
      const sub = await get(`SELECT * FROM study_subjects WHERE id = ? AND user_id = ?`, [subject_id, userId]);
      if (sub) {
        subjectName = sub.name;
        targetSubjectId = sub.id;
      }
    }

    await run(
      `UPDATE study_materials
       SET title = ?, description = ?, subject_id = ?, subject_name = ?,
           external_url = ?, tags = ?, is_favorite = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND user_id = ?`,
      [
        title ? title.trim() : existing.title,
        description !== undefined ? description.trim() : existing.description,
        targetSubjectId,
        subjectName,
        external_url !== undefined ? (external_url ? external_url.trim() : null) : existing.external_url,
        tags !== undefined ? tags.trim() : existing.tags,
        is_favorite !== undefined ? (is_favorite ? 1 : 0) : existing.is_favorite,
        id,
        userId
      ]
    );

    const updated = await get(`SELECT * FROM study_materials WHERE id = ?`, [id]);

    res.json({
      success: true,
      message: 'Material updated successfully!',
      material: updated
    });
  } catch (err) {
    console.error('updateMaterial Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * DELETE /api/student/study-hub/materials/:id
 * Delete material (and local file if exists)
 */
export async function deleteMaterial(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const material = await get(`SELECT * FROM study_materials WHERE id = ? AND user_id = ?`, [id, userId]);
    if (!material) {
      return res.status(404).json({ success: false, message: 'Material not found or unauthorized.' });
    }

    // Try to remove local file if in /uploads
    if (material.file_url && material.file_url.startsWith('/uploads/')) {
      const fileName = path.basename(material.file_url);
      const filePath = path.join(uploadDir, fileName);
      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch (e) {}
      }
    }

    await run(`DELETE FROM study_materials WHERE id = ? AND user_id = ?`, [id, userId]);

    res.json({
      success: true,
      message: 'Study material deleted successfully.'
    });
  } catch (err) {
    console.error('deleteMaterial Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * PATCH /api/student/study-hub/materials/:id/favorite
 * Toggle favorite
 */
export async function toggleFavorite(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const material = await get(`SELECT * FROM study_materials WHERE id = ? AND user_id = ?`, [id, userId]);
    if (!material) {
      return res.status(404).json({ success: false, message: 'Material not found.' });
    }

    const newFav = material.is_favorite ? 0 : 1;
    await run(`UPDATE study_materials SET is_favorite = ? WHERE id = ?`, [newFav, id]);

    res.json({
      success: true,
      is_favorite: newFav,
      message: newFav ? 'Pinned to favorites!' : 'Unpinned from favorites.'
    });
  } catch (err) {
    console.error('toggleFavorite Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
}
