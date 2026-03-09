import React, { useState } from 'react';

const EMPTY = { name: '', email: '', department: '', role: '', hire_date: '' };

export default function EmployeeForm({ initial = EMPTY, onSubmit, onCancel }) {
  const [form, setForm] = useState({ ...initial });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await onSubmit(form);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="employee-form">
      {error && <p className="form-error">{error}</p>}

      <div className="form-group">
        <label htmlFor="name">Name</label>
        <input
          id="name"
          name="name"
          value={form.name}
          onChange={handleChange}
          required
          placeholder="Full name"
        />
      </div>

      <div className="form-group">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          required
          placeholder="email@example.com"
        />
      </div>

      <div className="form-group">
        <label htmlFor="department">Department</label>
        <input
          id="department"
          name="department"
          value={form.department}
          onChange={handleChange}
          required
          placeholder="e.g. Engineering"
        />
      </div>

      <div className="form-group">
        <label htmlFor="role">Role</label>
        <input
          id="role"
          name="role"
          value={form.role}
          onChange={handleChange}
          required
          placeholder="e.g. Software Engineer"
        />
      </div>

      <div className="form-group">
        <label htmlFor="hire_date">Hire Date</label>
        <input
          id="hire_date"
          name="hire_date"
          type="date"
          value={form.hire_date}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-actions">
        <button type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
