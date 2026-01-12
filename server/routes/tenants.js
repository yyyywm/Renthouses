import express from 'express'
import db from '../database.js'

const router = express.Router()

// 获取所有租客（带房源信息）
router.get('/', (req, res) => {
  try {
    const tenants = db.prepare(`
      SELECT t.*,
             c.id as contract_id, c.end_date as contract_end_date,
             p.name as property_name, p.address as property_address
      FROM tenants t
      LEFT JOIN contracts c ON t.id = c.tenant_id AND c.status = '生效'
      LEFT JOIN properties p ON c.property_id = p.id
      ORDER BY t.created_at DESC
    `).all()
    res.json({ code: 0, data: tenants })
  } catch (err) {
    res.status(500).json({ code: 1, message: err.message })
  }
})

// 获取单个租客
router.get('/:id', (req, res) => {
  try {
    const tenant = db.prepare('SELECT * FROM tenants WHERE id = ?').get(req.params.id)
    if (!tenant) {
      return res.status(404).json({ code: 1, message: '租客不存在' })
    }
    res.json({ code: 0, data: tenant })
  } catch (err) {
    res.status(500).json({ code: 1, message: err.message })
  }
})

// 创建租客
router.post('/', (req, res) => {
  try {
    const { name, phone, id_card, emergency_contact } = req.body
    const result = db.prepare(`
      INSERT INTO tenants (name, phone, id_card, emergency_contact)
      VALUES (?, ?, ?, ?)
    `).run(name, phone, id_card, emergency_contact)

    res.json({ code: 0, data: { id: result.lastInsertRowid }, message: '创建成功' })
  } catch (err) {
    res.status(500).json({ code: 1, message: err.message })
  }
})

// 更新租客
router.put('/:id', (req, res) => {
  try {
    const { name, phone, id_card, emergency_contact } = req.body
    const result = db.prepare(`
      UPDATE tenants SET name = ?, phone = ?, id_card = ?, emergency_contact = ?
      WHERE id = ?
    `).run(name, phone, id_card, emergency_contact, req.params.id)

    if (result.changes === 0) {
      return res.status(404).json({ code: 1, message: '租客不存在' })
    }
    res.json({ code: 0, message: '更新成功' })
  } catch (err) {
    res.status(500).json({ code: 1, message: err.message })
  }
})

// 删除租客
router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM tenants WHERE id = ?').run(req.params.id)
    if (result.changes === 0) {
      return res.status(404).json({ code: 1, message: '租客不存在' })
    }
    res.json({ code: 0, message: '删除成功' })
  } catch (err) {
    res.status(500).json({ code: 1, message: err.message })
  }
})

export default router
