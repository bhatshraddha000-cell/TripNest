import { api } from './api.js'

export const documentApi = {
  uploadDocument: async (tripId, file, documentType) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('documentType', documentType)
    const response = await api.post(`/api/trips/${tripId}/documents`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  listDocuments: async (tripId) => {
    const response = await api.get(`/api/trips/${tripId}/documents`)
    return response.data
  },

  deleteDocument: async (documentId) => {
    await api.delete(`/api/documents/${documentId}`)
  },

  downloadDocument: async (fileUrl, fileName) => {
    const response = await api.get(fileUrl, {
      responseType: 'blob',
    })
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', fileName)
    document.body.appendChild(link)
    link.click()
    link.parentNode.removeChild(link)
  }
}
