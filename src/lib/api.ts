// API Client per DocuVault

import axios, { AxiosError, AxiosInstance } from 'axios'
import { useAuthStore } from '@/store/auth.store'

const API_URL = import.meta.env.VITE_API_URL || '/api'

// Crea istanza Axios
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor per aggiungere token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Interceptor per gestire refresh token
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config

    // Se 401 e non è già un retry
    if (error.response?.status === 401 && originalRequest && !(originalRequest as any)._retry) {
      (originalRequest as any)._retry = true

      const refreshToken = useAuthStore.getState().refreshToken

      if (refreshToken) {
        try {
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refreshToken,
          })

          const { tokens } = response.data.data
          useAuthStore.getState().setTokens(tokens.accessToken, tokens.refreshToken)

          // Riprova richiesta originale
          originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`
          return api(originalRequest)
        } catch (refreshError) {
          // Refresh fallito, logout
          useAuthStore.getState().logout()
          window.location.href = '/login'
          return Promise.reject(refreshError)
        }
      } else {
        useAuthStore.getState().logout()
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  }
)

export default api

// === AUTH API ===

export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),

  register: (data: { email: string; password: string; firstName: string; lastName: string; role?: string }) =>
    api.post('/auth/register', data),

  refresh: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),

  logout: () =>
    api.post('/auth/logout'),

  me: () =>
    api.get('/auth/me'),

  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),

  resetPassword: (token: string, password: string) =>
    api.post('/auth/reset-password', { token, password }),

  changePassword: (currentPassword: string, newPassword: string) =>
    api.post('/auth/change-password', { currentPassword, newPassword }),
}

// === DOCUMENTS API ===

export const documentsApi = {
  list: (params?: Record<string, string | number | undefined>) =>
    api.get('/documents', { params }),

  get: (id: string) =>
    api.get(`/documents/${id}`),

  create: (data: FormData) =>
    api.post('/documents', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  update: (id: string, data: Record<string, unknown>) =>
    api.patch(`/documents/${id}`, data),

  delete: (id: string) =>
    api.delete(`/documents/${id}`),

  restore: (id: string) =>
    api.post(`/documents/${id}/restore`),

  permanentDelete: (id: string) =>
    api.delete(`/documents/${id}/permanent`),

  download: (id: string, versionId?: string) =>
    api.get(`/documents/${id}/download`, { params: { versionId } }),

  versions: (id: string) =>
    api.get(`/documents/${id}/versions`),

  createVersion: (id: string, data: FormData) =>
    api.post(`/documents/${id}/versions`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  checkout: (id: string) =>
    api.post(`/documents/${id}/checkout`),

  checkin: (id: string, data?: FormData) =>
    api.post(`/documents/${id}/checkin`, data || {}, {
      headers: data ? { 'Content-Type': 'multipart/form-data' } : undefined,
    }),

  transitions: (id: string) =>
    api.get(`/documents/${id}/transitions`),

  transition: (id: string, toStateId: string, comment?: string) =>
    api.post(`/documents/${id}/transition`, { toStateId, comment }),

  audit: (id: string, params?: Record<string, string>) =>
    api.get(`/documents/${id}/audit`, { params }),

  trash: (params?: Record<string, string | number>) =>
    api.get('/documents/trash', { params }),

  email: (id: string) =>
    api.get(`/documents/${id}/email`, { responseType: 'blob' }),
}

// === VAULTS API ===

export const vaultsApi = {
  list: () =>
    api.get('/vaults'),

  get: (id: string) =>
    api.get(`/vaults/${id}`),

  create: (data: { name: string; description?: string; icon?: string; color?: string; metadataClassId?: string }) =>
    api.post('/vaults', data),

  update: (id: string, data: Record<string, unknown>) =>
    api.patch(`/vaults/${id}`, data),

  delete: (id: string) =>
    api.delete(`/vaults/${id}`),

  stats: (id: string) =>
    api.get(`/vaults/${id}/stats`),
}

// === SEARCH API ===

export const searchApi = {
  search: (params: Record<string, string | number | undefined>) =>
    api.get('/search', { params }),

  advanced: (data: Record<string, unknown>) =>
    api.post('/search/advanced', data),

  suggestions: (q: string) =>
    api.get('/search/suggestions', { params: { q } }),

  recent: (limit?: number) =>
    api.get('/search/recent', { params: { limit } }),

  expiring: (days?: number) =>
    api.get('/search/expiring', { params: { days } }),
}

// === WORKFLOWS API ===

export const workflowsApi = {
  list: () =>
    api.get('/workflows'),

  get: (id: string) =>
    api.get(`/workflows/${id}`),

  create: (data: { name: string; description?: string }) =>
    api.post('/workflows', data),

  update: (id: string, data: Record<string, unknown>) =>
    api.patch(`/workflows/${id}`, data),

  delete: (id: string) =>
    api.delete(`/workflows/${id}`),

  createState: (workflowId: string, data: Record<string, unknown>) =>
    api.post(`/workflows/${workflowId}/states`, data),

  updateState: (workflowId: string, stateId: string, data: Record<string, unknown>) =>
    api.patch(`/workflows/${workflowId}/states/${stateId}`, data),

  deleteState: (workflowId: string, stateId: string) =>
    api.delete(`/workflows/${workflowId}/states/${stateId}`),

  createTransition: (workflowId: string, data: Record<string, unknown>) =>
    api.post(`/workflows/${workflowId}/transitions`, data),

  deleteTransition: (workflowId: string, transitionId: string) =>
    api.delete(`/workflows/${workflowId}/transitions/${transitionId}`),
}

// === ATTRIBUTES API ===

export const attributesApi = {
  list: () =>
    api.get('/attributes'),

  get: (id: string) =>
    api.get(`/attributes/${id}`),

  create: (data: {
    name: string
    label: string
    type: string
    isRequired?: boolean
    isSearchable?: boolean
    defaultValue?: string
    options?: string[]
  }) =>
    api.post('/attributes', data),

  update: (id: string, data: Record<string, unknown>) =>
    api.patch(`/attributes/${id}`, data),

  delete: (id: string) =>
    api.delete(`/attributes/${id}`),
}

// === METADATA CLASSES API ===

export const metadataApi = {
  listClasses: () =>
    api.get('/metadata/classes'),

  getClass: (id: string) =>
    api.get(`/metadata/classes/${id}`),

  createClass: (data: { name: string; description?: string }) =>
    api.post('/metadata/classes', data),

  updateClass: (id: string, data: Record<string, unknown>) =>
    api.patch(`/metadata/classes/${id}`, data),

  deleteClass: (id: string) =>
    api.delete(`/metadata/classes/${id}`),

  // Attributi della classe
  addAttribute: (classId: string, data: { attributeId: string; isRequired?: boolean; order?: number }) =>
    api.post(`/metadata/classes/${classId}/attributes`, data),

  removeAttribute: (classId: string, attributeId: string) =>
    api.delete(`/metadata/classes/${classId}/attributes/${attributeId}`),

  updateAttribute: (classId: string, attributeId: string, data: { isRequired?: boolean; order?: number }) =>
    api.patch(`/metadata/classes/${classId}/attributes/${attributeId}`, data),

  // Campi legacy
  createField: (classId: string, data: Record<string, unknown>) =>
    api.post(`/metadata/classes/${classId}/fields`, data),

  updateField: (fieldId: string, data: Record<string, unknown>) =>
    api.patch(`/metadata/fields/${fieldId}`, data),

  deleteField: (fieldId: string) =>
    api.delete(`/metadata/fields/${fieldId}`),
}

// === TAGS API ===

export const tagsApi = {
  list: () =>
    api.get('/tags'),

  get: (id: string) =>
    api.get(`/tags/${id}`),

  create: (data: { name: string; color?: string }) =>
    api.post('/tags', data),

  update: (id: string, data: { name?: string; color?: string }) =>
    api.patch(`/tags/${id}`, data),

  delete: (id: string) =>
    api.delete(`/tags/${id}`),
}

// === SAVED VIEWS API ===

export const viewsApi = {
  list: () =>
    api.get('/views'),

  get: (id: string) =>
    api.get(`/views/${id}`),

  execute: (id: string) =>
    api.get(`/views/${id}/execute`),

  create: (data: {
    name: string
    description?: string
    icon?: string
    color?: string
    filters: Record<string, any>
    isPublic?: boolean
  }) =>
    api.post('/views', data),

  update: (id: string, data: Record<string, any>) =>
    api.patch(`/views/${id}`, data),

  delete: (id: string) =>
    api.delete(`/views/${id}`),
}

// === USER GROUPS API ===

export const userGroupsApi = {
  list: () =>
    api.get('/user-groups'),

  get: (id: string) =>
    api.get(`/user-groups/${id}`),

  create: (data: { name: string; description?: string; color?: string }) =>
    api.post('/user-groups', data),

  update: (id: string, data: { name?: string; description?: string; color?: string }) =>
    api.patch(`/user-groups/${id}`, data),

  delete: (id: string) =>
    api.delete(`/user-groups/${id}`),

  addMember: (groupId: string, userId: string) =>
    api.post(`/user-groups/${groupId}/members`, { userId }),

  removeMember: (groupId: string, userId: string) =>
    api.delete(`/user-groups/${groupId}/members/${userId}`),
}

// === USERS API ===

export const usersApi = {
  list: (params?: Record<string, string | number>) =>
    api.get('/users', { params }),

  get: (id: string) =>
    api.get(`/users/${id}`),

  update: (id: string, data: Record<string, unknown>) =>
    api.patch(`/users/${id}`, data),

  deactivate: (id: string) =>
    api.post(`/users/${id}/deactivate`),

  activate: (id: string) =>
    api.post(`/users/${id}/activate`),

  delete: (id: string) =>
    api.delete(`/users/${id}`),

  audit: (id: string, params?: Record<string, string>) =>
    api.get(`/users/${id}/audit`, { params }),
}

// === LICENSE API ===

export const licenseApi = {
  info: () =>
    api.get('/license'),

  stats: () =>
    api.get('/license/stats'),

  activate: (licenseKey: string) =>
    api.post('/license/activate', { licenseKey }),

  renew: (additionalDays: number) =>
    api.post('/license/renew', { additionalDays }),

  upgrade: (newPlan: string) =>
    api.post('/license/upgrade', { newPlan }),
}

// === AUDIT API ===

export const auditApi = {
  list: (params?: Record<string, string | number>) =>
    api.get('/audit', { params }),

  stats: (days?: number) =>
    api.get('/audit/stats', { params: { days } }),

  export: (params?: Record<string, string>, format?: 'json' | 'csv') =>
    api.get('/audit/export', { params: { ...params, format } }),

  actions: () =>
    api.get('/audit/actions'),
}

// === RETENTION API ===

export const retentionApi = {
  list: () =>
    api.get('/retention'),

  get: (id: string) =>
    api.get(`/retention/${id}`),

  create: (data: { name: string; description?: string; retentionDays: number; action: string }) =>
    api.post('/retention', data),

  update: (id: string, data: Record<string, unknown>) =>
    api.patch(`/retention/${id}`, data),

  delete: (id: string) =>
    api.delete(`/retention/${id}`),

  stats: () =>
    api.get('/retention/stats'),

  expiring: (days?: number) =>
    api.get('/retention/expiring', { params: { days } }),

  apply: (policyId: string, documentId: string) =>
    api.post(`/retention/${policyId}/apply/${documentId}`),

  remove: (documentId: string) =>
    api.delete(`/retention/documents/${documentId}`),
}
