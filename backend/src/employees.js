const { getDb } = require('./database');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_RE  = /^\d{4}-\d{2}-\d{2}$/;

function validate(body) {
  const errors = [];
  if (!body.name || typeof body.name !== 'string' || !body.name.trim())
    errors.push('name is required');
  if (!body.email || !EMAIL_RE.test(body.email))
    errors.push('valid email is required');
  if (!body.department || typeof body.department !== 'string' || !body.department.trim())
    errors.push('department is required');
  if (!body.role || typeof body.role !== 'string' || !body.role.trim())
    errors.push('role is required');
  if (!body.hire_date || !DATE_RE.test(body.hire_date))
    errors.push('hire_date must be a valid date in YYYY-MM-DD format');
  return errors;
}

function getAll(department) {
  const db = getDb();
  if (department) {
    return db
      .prepare('SELECT * FROM employees WHERE department = ? ORDER BY id')
      .all(department);
  }
  return db.prepare('SELECT * FROM employees ORDER BY id').all();
}

function getById(id) {
  return getDb()
    .prepare('SELECT * FROM employees WHERE id = ?')
    .get(id);
}

function create(data) {
  const db = getDb();
  const stmt = db.prepare(
    'INSERT INTO employees (name, email, department, role, hire_date) VALUES (?, ?, ?, ?, ?)'
  );
  const info = stmt.run(
    data.name.trim(),
    data.email.trim().toLowerCase(),
    data.department.trim(),
    data.role.trim(),
    data.hire_date
  );
  return getById(info.lastInsertRowid);
}

function update(id, data) {
  const db = getDb();
  const stmt = db.prepare(
    `UPDATE employees
     SET name = ?, email = ?, department = ?, role = ?, hire_date = ?
     WHERE id = ?`
  );
  const info = stmt.run(
    data.name.trim(),
    data.email.trim().toLowerCase(),
    data.department.trim(),
    data.role.trim(),
    data.hire_date,
    id
  );
  if (info.changes === 0) return null;
  return getById(id);
}

function remove(id) {
  const info = getDb()
    .prepare('DELETE FROM employees WHERE id = ?')
    .run(id);
  return info.changes > 0;
}

function getDepartments() {
  return getDb()
    .prepare('SELECT DISTINCT department FROM employees ORDER BY department')
    .all()
    .map((r) => r.department);
}

module.exports = { validate, getAll, getById, create, update, remove, getDepartments };
