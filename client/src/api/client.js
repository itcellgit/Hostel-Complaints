import axios from 'axios'

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
})

let refreshPromise = null

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const { config, response } = error
    const isAuthRoute = config?.url?.startsWith('/auth/')

    if (response?.status === 401 && !config._retried && !isAuthRoute) {
      config._retried = true
      try {
        refreshPromise ??= api.post('/auth/refresh').finally(() => {
          refreshPromise = null
        })
        await refreshPromise
        return api(config)
      } catch {
        window.dispatchEvent(new CustomEvent('auth:expired'))
      }
    }

    return Promise.reject(error)
  },
)
