import express from 'express'
import db from '../database.js'

const router = express.Router()

// 获取所有租金记录（带关联信息）
router.get('/', (req, res) => {
  try {
    const rents = db.prepare(`
      SELECT r.*,
             c.start_date, c.end_date, c.monthly_rent,
             p.name as property_name, p.address as property_address,
             t.name as tenant_name
      FROM rent_records r
      LEFT JOIN contracts c ON r.contract_id = c.id
      LEFT JOIN properties p ON c.property_id = p.id
      LEFT JOIN tenants t ON c.tenant_id = t.id
      ORDER BY r.pay_date DESC
    `).all()
    res.json({ code: 0, data: rents })
  } catch (err) {
    res.status(500).json({ code: 1, message: err.message })
  }
})

// 获取单个记录
router.get('/:id', (req, res) => {
  try {
    const rent = db.prepare(`
      SELECT r.*,
             c.start_date, c.end_date, c.monthly_rent,
             p.name as property_name, p.address as property_address,
             t.name as tenant_name
      FROM rent_records r
      LEFT JOIN contracts c ON r.contract_id = c.id
      LEFT JOIN properties p ON c.property_id = p.id
      LEFT JOIN tenants t ON c.tenant_id = t.id
      WHERE r.id = ?
    `).get(req.params.id)

    if (!rent) {
      return res.status(404).json({ code: 1, message: '记录不存在' })
    }
    res.json({ code: 0, data: rent })
  } catch (err) {
    res.status(500).json({ code: 1, message: err.message })
  }
})

// 创建租金记录
router.post('/', (req, res) => {
  try {
    const { contract_id, amount, pay_date, status, remark } = req.body
    const result = db.prepare(`
      INSERT INTO rent_records (contract_id, amount, pay_date, status, remark)
      VALUES (?, ?, ?, ?, ?)
    `).run(contract_id, amount, pay_date, status || '已支付', remark)

    res.json({ code: 0, data: { id: result.lastInsertRowid }, message: '创建成功' })
  } catch (err) {
    res.status(500).json({ code: 1, message: err.message })
  }
})

// 更新租金记录
router.put('/:id', (req, res) => {
  try {
    const { contract_id, amount, pay_date, status, remark } = req.body
    const result = db.prepare(`
      UPDATE rent_records SET contract_id = ?, amount = ?, pay_date = ?, status = ?, remark = ?
      WHERE id = ?
    `).run(contract_id, amount, pay_date, status, remark, req.params.id)

    if (result.changes === 0) {
      return res.status(404).json({ code: 1, message: '记录不存在' })
    }
    res.json({ code: 0, message: '更新成功' })
  } catch (err) {
    res.status(500).json({ code: 1, message: err.message })
  }
})

// 删除租金记录
router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM rent_records WHERE id = ?').run(req.params.id)
    if (result.changes === 0) {
      return res.status(404).json({ code: 1, message: '记录不存在' })
    }
    res.json({ code: 0, message: '删除成功' })
  } catch (err) {
    res.status(500).json({ code: 1, message: err.message })
  }
})

export default router
