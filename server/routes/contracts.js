import express from 'express'
import db from '../database.js'

const router = express.Router()

// 获取所有合同（带关联信息）
router.get('/', (req, res) => {
  try {
    const contracts = db.prepare(`
      SELECT c.*,
             p.name as property_name, p.address as property_address,
             t.name as tenant_name, t.phone as tenant_phone
      FROM contracts c
      LEFT JOIN properties p ON c.property_id = p.id
      LEFT JOIN tenants t ON c.tenant_id = t.id
      ORDER BY c.created_at DESC
    `).all()
    res.json({ code: 0, data: contracts })
  } catch (err) {
    res.status(500).json({ code: 1, message: err.message })
  }
})

// 获取单个合同
router.get('/:id', (req, res) => {
  try {
    const contract = db.prepare(`
      SELECT c.*,
             p.name as property_name, p.address as property_address,
             t.name as tenant_name, t.phone as tenant_phone
      FROM contracts c
      LEFT JOIN properties p ON c.property_id = p.id
      LEFT JOIN tenants t ON c.tenant_id = t.id
      WHERE c.id = ?
    `).get(req.params.id)

    if (!contract) {
      return res.status(404).json({ code: 1, message: '合同不存在' })
    }
    res.json({ code: 0, data: contract })
  } catch (err) {
    res.status(500).json({ code: 1, message: err.message })
  }
})

// 创建合同
router.post('/', (req, res) => {
  try {
    const { property_id, tenant_id, contract_image, start_date, end_date, monthly_rent, deposit, status } = req.body
    const result = db.prepare(`
      INSERT INTO contracts (property_id, tenant_id, contract_image, start_date, end_date, monthly_rent, deposit, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(property_id, tenant_id, contract_image, start_date, end_date, monthly_rent, deposit, status || '生效')

    // 更新房源状态
    if (status === '生效') {
      db.prepare('UPDATE properties SET status = ? WHERE id = ?').run('已租', property_id)
    }

    res.json({ code: 0, data: { id: result.lastInsertRowid }, message: '创建成功' })
  } catch (err) {
    res.status(500).json({ code: 1, message: err.message })
  }
})

// 更新合同
router.put('/:id', (req, res) => {
  try {
    const { property_id, tenant_id, contract_image, start_date, end_date, monthly_rent, deposit, status } = req.body

    // 获取旧状态
    const old = db.prepare('SELECT property_id, status FROM contracts WHERE id = ?').get(req.params.id)
    if (!old) {
      return res.status(404).json({ code: 1, message: '合同不存在' })
    }

    const result = db.prepare(`
      UPDATE contracts SET property_id = ?, tenant_id = ?, contract_image = ?, start_date = ?, end_date = ?, monthly_rent = ?, deposit = ?, status = ?
      WHERE id = ?
    `).run(property_id, tenant_id, contract_image, start_date, end_date, monthly_rent, deposit, status, req.params.id)

    // 处理房源状态变化
    if (status === '生效' && old.status !== '生效') {
      db.prepare('UPDATE properties SET status = ? WHERE id = ?').run('已租', property_id)
    } else if (status !== '生效' && old.status === '生效') {
      db.prepare('UPDATE properties SET status = ? WHERE id = ?').run('空置', property_id)
    }

    res.json({ code: 0, message: '更新成功' })
  } catch (err) {
    res.status(500).json({ code: 1, message: err.message })
  }
})

// 删除合同
router.delete('/:id', (req, res) => {
  try {
    const contract = db.prepare('SELECT property_id, status FROM contracts WHERE id = ?').get(req.params.id)
    if (!contract) {
      return res.status(404).json({ code: 1, message: '合同不存在' })
    }

    const result = db.prepare('DELETE FROM contracts WHERE id = ?').run(req.params.id)

    // 恢复房源状态
    if (contract.status === '生效') {
      db.prepare('UPDATE properties SET status = ? WHERE id = ?').run('空置', contract.property_id)
    }

    res.json({ code: 0, message: '删除成功' })
  } catch (err) {
    res.status(500).json({ code: 1, message: err.message })
  }
})

export default router
