import { getToken } from '@/utils/auth.js'

// 上传合同图片
export async function uploadContractImage(file) {
  const formData = new FormData()
  formData.append('contract', file)

  const token = getToken()
  const res = await fetch('/api/upload/contract', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  })
  return await res.json()
}
