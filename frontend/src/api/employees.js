const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

async function handleResponse(res) {
  const contentType = res.headers.get('content-type') || '';
  const body = contentType.includes('application/json') ? await res.json() : null;
  if (!res.ok) {
    const message =
      (body && (body.error || (body.errors && body.errors.join(', ')))) ||
      `HTTP error ${res.status}`;
    throw new Error(message);
  }
  return body;
}

export async function getEmployees(department = '') {
  const url = department
    ? `${BASE_URL}/employees?department=${encodeURIComponent(department)}`
    : `${BASE_URL}/employees`;
  const res = await fetch(url);
  return handleResponse(res);
}

export async function getDepartments() {
  const res = await fetch(`${BASE_URL}/employees/departments`);
  return handleResponse(res);
}

export async function getEmployee(id) {
  const res = await fetch(`${BASE_URL}/employees/${id}`);
  return handleResponse(res);
}

export async function createEmployee(data) {
  const res = await fetch(`${BASE_URL}/employees`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function updateEmployee(id, data) {
  const res = await fetch(`${BASE_URL}/employees/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function deleteEmployee(id) {
  const res = await fetch(`${BASE_URL}/employees/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const body = res.headers.get('content-type')?.includes('application/json')
      ? await res.json()
      : null;
    throw new Error((body && body.error) || `HTTP error ${res.status}`);
  }
}
