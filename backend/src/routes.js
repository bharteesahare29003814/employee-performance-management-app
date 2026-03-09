const express = require('express');
const router = express.Router();
const employees = require('./employees');

// GET /api/employees?department=Engineering
router.get('/', (req, res) => {
  const { department } = req.query;
  const list = employees.getAll(department || null);
  res.json(list);
});

// GET /api/employees/departments
router.get('/departments', (req, res) => {
  res.json(employees.getDepartments());
});

// GET /api/employees/:id
router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
  const emp = employees.getById(id);
  if (!emp) return res.status(404).json({ error: 'Employee not found' });
  res.json(emp);
});

// POST /api/employees
router.post('/', (req, res) => {
  const errors = employees.validate(req.body);
  if (errors.length) return res.status(400).json({ errors });
  try {
    const emp = employees.create(req.body);
    res.status(201).json(emp);
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Email already exists' });
    }
    throw err;
  }
});

// PUT /api/employees/:id
router.put('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
  const errors = employees.validate(req.body);
  if (errors.length) return res.status(400).json({ errors });
  try {
    const emp = employees.update(id, req.body);
    if (!emp) return res.status(404).json({ error: 'Employee not found' });
    res.json(emp);
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Email already exists' });
    }
    throw err;
  }
});

// DELETE /api/employees/:id
router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
  const deleted = employees.remove(id);
  if (!deleted) return res.status(404).json({ error: 'Employee not found' });
  res.status(204).send();
});

module.exports = router;
