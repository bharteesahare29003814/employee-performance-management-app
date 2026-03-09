import React, { useState } from 'react';
import EmployeeList from './components/EmployeeList';
import EmployeeForm from './components/EmployeeForm';
import { createEmployee, updateEmployee } from './api/employees';
import './App.css';

export default function App() {
  const [mode, setMode] = useState('list'); // 'list' | 'add' | 'edit'
  const [selected, setSelected] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  function refresh() {
    setRefreshKey((k) => k + 1);
  }

  function handleAdd() {
    setSelected(null);
    setMode('add');
  }

  function handleEdit(emp) {
    setSelected(emp);
    setMode('edit');
  }

  async function handleSubmit(form) {
    if (mode === 'edit') {
      await updateEmployee(selected.id, form);
    } else {
      await createEmployee(form);
    }
    setMode('list');
    refresh();
  }

  function handleCancel() {
    setMode('list');
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Employee Management System</h1>
      </header>
      <main>
        {mode === 'list' && (
          <EmployeeList
            onEdit={handleEdit}
            onAdd={handleAdd}
            refreshKey={refreshKey}
          />
        )}
        {(mode === 'add' || mode === 'edit') && (
          <div className="form-container">
            <h2>{mode === 'edit' ? 'Edit Employee' : 'Add Employee'}</h2>
            <EmployeeForm
              initial={
                mode === 'edit'
                  ? {
                      name: selected.name,
                      email: selected.email,
                      department: selected.department,
                      role: selected.role,
                      hire_date: selected.hire_date,
                    }
                  : undefined
              }
              onSubmit={handleSubmit}
              onCancel={handleCancel}
            />
          </div>
        )}
      </main>
    </div>
  );
}
