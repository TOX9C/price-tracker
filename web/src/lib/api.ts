import ky from 'ky'

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1'

export const api = ky.create({
 prefixUrl: API_BASE,
 credentials: 'include',
 hooks: {
 beforeRequest: [
 (request) => {
 const authStorage = localStorage.getItem('auth-storage')
 if (authStorage) {
 try {
 const { state } = JSON.parse(authStorage)
 if (state?.token) {
 request.headers.set('Authorization', `Bearer ${state.token}`)
 }
 } catch {
 // Ignore parse errors
 }
 }
 },
 ],
 afterResponse: [
 async (_request, _options, response) => {
 if (response.status === 401) {
 localStorage.removeItem('auth-storage')
 window.dispatchEvent(new CustomEvent('auth:logout'))
 }
 return response
 },
 ],
 },
})

export default api
