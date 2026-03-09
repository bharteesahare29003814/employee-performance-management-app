import React, { useEffect, useState, useCallback } from 'react';
import {
  getEmployees,
  getDepartments,
  deleteEmployee,
} from '../api/employees';

export default function EmployeeList({ onEdit, onAdd, refreshKey }) {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadDepartments = useCallback(async () => {
    try {
      const depts = await getDepartments();
      setDepartments(depts);
    } catch (_) {}
  }, []);

  const loadEmployees = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getEmployees(filter);
      setEmployees(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadEmployees();
    loadDepartments();
  }, [loadEmployees, loadDepartments, refreshKey]);

  async function handleDelete(id, name) {
    if (!window.confirm(`Delete employee "${name}"?`)) return;
    try {
      await deleteEmployee(id);
      setEmployees((prev) => prev.filter((e) => e.id !== id));
      loadDepartments();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="employee-list">
      <div className="list-header">
        <h2>Employees</h2>
        <div className="list-controls">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            aria-label="Filter by department"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <button onClick={onAdd}>+ Add Employee</button>
        </div>
      </div>

      {loading && <p className="status">Loading…</p>}
      {error && <p className="status error">{error}</p>}

      {!loading && employees.length === 0 && !error && (
        <p className="status">No employees found.</p>
      )}

      {employees.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Department</th>
              <th>Role</th>
              <th>Hire Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => (
              <tr key={emp.id}>
                <td>{emp.id}</td>
                <td>{emp.name}</td>
                <td>{emp.email}</td>
                <td>{emp.department}</td>
                <td>{emp.role}</td>
                <td>{emp.hire_date}</td>
                <td>
                  <button
                    className="btn-edit"
                    onClick={() => onEdit(emp)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn-delete"
                    onClick={() => handleDelete(emp.id, emp.name)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
