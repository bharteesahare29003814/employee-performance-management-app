const request = require('supertest');
const path = require('path');
const os = require('os');
const fs = require('fs');

// Use a temp DB for tests
process.env.DB_PATH = path.join(os.tmpdir(), `test_employees_${Date.now()}.db`);

const { createApp } = require('../src/app');
const { closeDb } = require('../src/database');

const app = createApp();

afterAll(() => {
  closeDb();
  try {
    fs.unlinkSync(process.env.DB_PATH);
  } catch (_) {}
});

describe('GET /api/employees', () => {
  it('returns empty array initially', async () => {
    const res = await request(app).get('/api/employees');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe('POST /api/employees', () => {
  it('creates a new employee', async () => {
    const payload = {
      name: 'Alice Smith',
      email: 'alice@example.com',
      department: 'Engineering',
      role: 'Developer',
      hire_date: '2023-01-15',
    };
    const res = await request(app).post('/api/employees').send(payload);
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.name).toBe('Alice Smith');
    expect(res.body.email).toBe('alice@example.com');
  });

  it('returns 400 for missing fields', async () => {
    const res = await request(app).post('/api/employees').send({ name: 'Bob' });
    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  it('returns 400 for invalid email', async () => {
    const res = await request(app).post('/api/employees').send({
      name: 'Bob',
      email: 'not-an-email',
      department: 'HR',
      role: 'Manager',
      hire_date: '2023-01-01',
    });
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid hire_date format', async () => {
    const res = await request(app).post('/api/employees').send({
      name: 'Bob',
      email: 'bob@example.com',
      department: 'HR',
      role: 'Manager',
      hire_date: '01-01-2023',
    });
    expect(res.status).toBe(400);
  });

  it('returns 409 for duplicate email', async () => {
    const payload = {
      name: 'Alice Duplicate',
      email: 'alice@example.com',
      department: 'HR',
      role: 'Manager',
      hire_date: '2023-06-01',
    };
    const res = await request(app).post('/api/employees').send(payload);
    expect(res.status).toBe(409);
  });
});

describe('GET /api/employees/:id', () => {
  let employeeId;

  beforeAll(async () => {
    const res = await request(app).post('/api/employees').send({
      name: 'Carol Jones',
      email: 'carol@example.com',
      department: 'Marketing',
      role: 'Analyst',
      hire_date: '2022-05-10',
    });
    employeeId = res.body.id;
  });

  it('returns the employee by id', async () => {
    const res = await request(app).get(`/api/employees/${employeeId}`);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe('carol@example.com');
  });

  it('returns 404 for unknown id', async () => {
    const res = await request(app).get('/api/employees/999999');
    expect(res.status).toBe(404);
  });

  it('returns 400 for non-numeric id', async () => {
    const res = await request(app).get('/api/employees/abc');
    expect(res.status).toBe(400);
  });
});

describe('PUT /api/employees/:id', () => {
  let employeeId;

  beforeAll(async () => {
    const res = await request(app).post('/api/employees').send({
      name: 'Dave Brown',
      email: 'dave@example.com',
      department: 'Finance',
      role: 'Accountant',
      hire_date: '2021-03-20',
    });
    employeeId = res.body.id;
  });

  it('updates the employee', async () => {
    const res = await request(app).put(`/api/employees/${employeeId}`).send({
      name: 'Dave Brown',
      email: 'dave@example.com',
      department: 'Finance',
      role: 'Senior Accountant',
      hire_date: '2021-03-20',
    });
    expect(res.status).toBe(200);
    expect(res.body.role).toBe('Senior Accountant');
  });

  it('returns 404 for unknown id', async () => {
    const res = await request(app).put('/api/employees/999999').send({
      name: 'Ghost',
      email: 'ghost@example.com',
      department: 'X',
      role: 'X',
      hire_date: '2020-01-01',
    });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/employees/:id', () => {
  let employeeId;

  beforeAll(async () => {
    const res = await request(app).post('/api/employees').send({
      name: 'Eve White',
      email: 'eve@example.com',
      department: 'Legal',
      role: 'Counsel',
      hire_date: '2020-07-01',
    });
    employeeId = res.body.id;
  });

  it('deletes the employee', async () => {
    const res = await request(app).delete(`/api/employees/${employeeId}`);
    expect(res.status).toBe(204);
  });

  it('returns 404 on second delete', async () => {
    const res = await request(app).delete(`/api/employees/${employeeId}`);
    expect(res.status).toBe(404);
  });
});

describe('Filter by department', () => {
  beforeAll(async () => {
    await request(app).post('/api/employees').send({
      name: 'Frank Lee',
      email: 'frank@example.com',
      department: 'Engineering',
      role: 'QA',
      hire_date: '2023-08-01',
    });
    await request(app).post('/api/employees').send({
      name: 'Grace Kim',
      email: 'grace@example.com',
      department: 'HR',
      role: 'Recruiter',
      hire_date: '2023-09-01',
    });
  });

  it('filters employees by department', async () => {
    const res = await request(app).get('/api/employees?department=Engineering');
    expect(res.status).toBe(200);
    expect(res.body.every((e) => e.department === 'Engineering')).toBe(true);
  });
});

describe('GET /api/employees/departments', () => {
  it('returns distinct departments', async () => {
    const res = await request(app).get('/api/employees/departments');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.includes('Engineering')).toBe(true);
  });
});
