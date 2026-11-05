async function request(path, options = {}) {
  const response = await fetch(path, {
    credentials: 'same-origin',
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });
  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error('The server returned an invalid response.');
  }
  if (!response.ok) {
    const error = new Error(result.error || 'The request could not be completed.');
    error.status = response.status;
    throw error;
  }
  return result;
}

const json = (method, body) => ({ method, body: JSON.stringify(body) });

export const api = {
  getOptions: () => request('/api/options'),
  getSession: () => request('/api/session'),
  register: (username, password) => request('/api/register', json('POST', { username, password })),
  login: (username, password) => request('/api/login', json('POST', { username, password })),
  logout: () => request('/api/logout', json('POST', {})),
  getLifts: () => request('/api/lifts'),
  addLift: (lift) => request('/api/lifts', json('POST', lift)),
  updateLift: (id, lift) => request(`/api/lifts/${encodeURIComponent(id)}`, json('PATCH', lift)),
  deleteLift: (id) => request(`/api/lifts/${encodeURIComponent(id)}`, { method: 'DELETE' }),
};
