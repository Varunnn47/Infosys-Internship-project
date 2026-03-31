const API = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://127.0.0.1:8000'
  : 'https://iip-e723.onrender.com'

export async function apiFetch(url, options = {}) {
  const token = localStorage.getItem('access_token')
  const res = await fetch(`${API}${url}`, {
    ...options,
    headers: {
      ...options.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
  if (res.status === 401) {
    localStorage.removeItem('access_token')
    localStorage.removeItem('username')
    window.location.reload()
    throw new Error('Session expired. Please login again.')
  }
  return res
}

export default API
