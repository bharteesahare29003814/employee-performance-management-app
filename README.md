# Employee Management System

An employee management system with CRUD operations, department filtering, and a clean React UI.

## Tech Stack

- **Backend**: Node.js + Express, SQLite (via better-sqlite3)
- **Frontend**: React (Create React App)

## Features

- Create, read, update, and delete employee records
- Employee fields: ID, Name, Email, Department, Role, Hire Date
- Filter employees by department
- Input validation and error handling
- RESTful API

## Getting Started

### Backend

```bash
cd backend
npm install
npm start        # runs on http://localhost:5000
```

### Frontend

```bash
cd frontend
npm install
npm start        # runs on http://localhost:3000
```

The frontend proxies `/api` requests to the backend automatically in development.

## API Reference

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/employees` | List all employees (supports `?department=` query param) |
| GET | `/api/employees/departments` | List distinct departments |
| GET | `/api/employees/:id` | Get a single employee |
| POST | `/api/employees` | Create a new employee |
| PUT | `/api/employees/:id` | Update an existing employee |
| DELETE | `/api/employees/:id` | Delete an employee |

### Employee Object

```json
{
  "id": 1,
  "name": "Alice Smith",
  "email": "alice@example.com",
  "department": "Engineering",
  "role": "Software Engineer",
  "hire_date": "2023-01-15"
}
```

## Running Tests

### Backend Tests

```bash
cd backend
npm test
```

### Frontend Tests

```bash
cd frontend
npm test
```
