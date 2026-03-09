import React, { useState } from 'react';
import EmployeeList from './components/EmployeeList';
import EmployeeForm from './components/EmployeeForm';
import PomodoroTimer from './pomodoro/PomodoroTimer';
import { createEmployee, updateEmployee } from './api/employees';
import './App.css';

export default function App() {
  const [tab, setTab]       = useState('employees'); // 'employees' | 'pomodoro'
  const [mode, setMode]     = useState('list');       // 'list' | 'add' | 'edit'
  const [selected, setSelected] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  function refresh() { setRefreshKey((k) => k + 1); }

  function handleAdd()       { setSelected(null); setMode('add'); }
  function handleEdit(emp)   { setSelected(emp);  setMode('edit'); }
  function handleCancel()    { setMode('list'); }

  async function handleSubmit(form) {
    if (mode === 'edit') {
      await updateEmployee(selected.id, form);
    } else {
      await createEmployee(form);
    }
    setMode('list');
    refresh();
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Employee Management System</h1>
        <nav className="app-nav">
          <button
            className={`nav-btn${tab === 'employees' ? ' active' : ''}`}
            onClick={() => setTab('employees')}
          >
            👥 Employees
          </button>
          <button
            className={`nav-btn${tab === 'pomodoro' ? ' active' : ''}`}
            onClick={() => setTab('pomodoro')}
          >
            🍅 Pomodoro
          </button>
        </nav>
      </header>

      <main>
        {tab === 'employees' && (
          <>
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
          </>
        )}

        {tab === 'pomodoro' && (
          <div className="pomodoro-page">
            <h2 className="page-title">🍅 Pomodoro Timer</h2>
            <p className="page-subtitle">
              Use timed focus sessions to boost your productivity.
            </p>
            <PomodoroTimer />
          </div>
        )}
      </main>
    </div>
  );
}
