import express from 'express'
import db from '../database.js'

const router = express.Router()

// 获取所有房源（带租客信息）
router.get('/', (req, res) => {
  try {
    const properties = db.prepare(`
      SELECT p.*,
             c.id as contract_id, c.end_date as contract_end_date,
             t.name as tenant_name, t.phone as tenant_phone
      FROM properties p
      LEFT JOIN contracts c ON p.id = c.property_id AND c.status = '生效'
      LEFT JOIN tenants t ON c.tenant_id = t.id
      ORDER BY p.created_at DESC
    `).all()
    res.json({ code: 0, data: properties })
  } catch (err) {
    res.status(500).json({ code: 1, message: err.message })
  }
})

// 获取单个房源
router.get('/:id', (req, res) => {
  try {
    const property = db.prepare('SELECT * FROM properties WHERE id = ?').get(req.params.id)
    if (!property) {
      return res.status(404).json({ code: 1, message: '房源不存在' })
    }
    res.json({ code: 0, data: property })
  } catch (err) {
    res.status(500).json({ code: 1, message: err.message })
  }
})

// 创建房源
router.post('/', (req, res) => {
  try {
    const { name, address, type, status, monthly_rent, area, description } = req.body
    const result = db.prepare(`
      INSERT INTO properties (name, address, type, status, monthly_rent, area, description)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(name, address, type, status, monthly_rent, area, description)

    res.json({ code: 0, data: { id: result.lastInsertRowid }, message: '创建成功' })
  } catch (err) {
    res.status(500).json({ code: 1, message: err.message })
  }
})

// 更新房源
router.put('/:id', (req, res) => {
  try {
    const { name, address, type, status, monthly_rent, area, description } = req.body
    const result = db.prepare(`
      UPDATE properties SET name = ?, address = ?, type = ?, status = ?, monthly_rent = ?, area = ?, description = ?
      WHERE id = ?
    `).run(name, address, type, status, monthly_rent, area, description, req.params.id)

    if (result.changes === 0) {
      return res.status(404).json({ code: 1, message: '房源不存在' })
    }
    res.json({ code: 0, message: '更新成功' })
  } catch (err) {
    res.status(500).json({ code: 1, message: err.message })
  }
})

// 删除房源
router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM properties WHERE id = ?').run(req.params.id)
    if (result.changes === 0) {
      return res.status(404).json({ code: 1, message: '房源不存在' })
    }
    res.json({ code: 0, message: '删除成功' })
  } catch (err) {
    res.status(500).json({ code: 1, message: err.message })
  }
})

export default router
