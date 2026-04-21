// ============================================================
// T3 Module — Invoices API 
// Prefix: /api/invoices
// Required endpoints:
//   GET    /api/invoices              — list all 
//   POST   /api/invoices              — create new 
//   PATCH  /api/invoices/:id/status   — update status 
// Extra endpoints (bonus):
//   GET    /api/invoices/stats        — KPI summary
//   GET    /api/invoices/:id          — single detail
//   PUT    /api/invoices/:id          — update notes/dueDate
//   DELETE /api/invoices/:id          — delete PENDING only
//   POST   /api/invoices/:id/items    — add line item
//   DELETE /api/invoices/:id/items/:itemId
// ============================================================

import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// ─── Helper: Auto-generate Invoice Number ────────────────────
async function generateInvoiceNumber() {
  const year = new Date().getFullYear();
  const count = await prisma.invoice.count();
  const seq = String(count + 1).padStart(4, '0');
  return `INV-${year}-${seq}`;
}

// ─── Helper: Recalculate invoice total from items ─────────────
async function recalcAmount(invoiceId) {
  const items = await prisma.invoiceItem.findMany({ where: { invoiceId } });
  const total = items.reduce((sum, item) => sum + parseFloat(item.totalPrice), 0);
  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { amount: total },
  });
  return total;
}

// ─── Helper: Recalculate invoice paid amount and auto-status ──
async function recalcInvoicePayments(invoiceId) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { payments: true }
  });
  if (!invoice) return;

  const paidAmount = invoice.payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
  
  let newStatus = invoice.status;
  if (paidAmount >= parseFloat(invoice.amount) && invoice.amount > 0) {
    newStatus = 'PAID';
  } else if (invoice.status === 'PAID' && paidAmount < parseFloat(invoice.amount)) {
    newStatus = 'PENDING';
  }

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { paidAmount, status: newStatus }
  });
  return { paidAmount, newStatus };
}

// ─── GET /api/invoices/stats ──────────────────────────────────
// KPI summary — must be registered BEFORE /:id
router.get('/stats', async (req, res) => {
  try {
    const invoices = await prisma.invoice.findMany({
      select: { amount: true, paidAmount: true, status: true },
    });

    const totalRevenue = invoices.reduce((s, i) => s + parseFloat(i.paidAmount || 0), 0);

    const outstanding = invoices
      .filter(i => i.status === 'PENDING' || i.status === 'OVERDUE')
      .reduce((s, i) => s + (parseFloat(i.amount || 0) - parseFloat(i.paidAmount || 0)), 0);

    const overdue = invoices
      .filter(i => i.status === 'OVERDUE')
      .reduce((s, i) => s + (parseFloat(i.amount || 0) - parseFloat(i.paidAmount || 0)), 0);

    res.json({
      totalRevenue: totalRevenue.toFixed(2),
      outstanding: outstanding.toFixed(2),
      overdue: overdue.toFixed(2),
      totalCount: invoices.length,
      paidCount: invoices.filter(i => i.status === 'PAID').length,
      pendingCount: invoices.filter(i => i.status === 'PENDING').length,
      overdueCount: invoices.filter(i => i.status === 'OVERDUE').length,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── GET /api/invoices ───────────────────────────────────────
// T10 required: List all invoices
// Optional filters: ?status=PAID&userId=3&from=2026-01-01&to=2026-12-31
router.get('/', async (req, res) => {
  try {
    const { status, studentId, from, to } = req.query;
    const where = {};

    if (status) where.status = status;
    if (studentId) where.studentId = parseInt(studentId);
    if (from || to) {
      where.issuedDate = {};
      if (from) where.issuedDate.gte = new Date(from);
      if (to)   where.issuedDate.lte = new Date(to);
    }

    const invoices = await prisma.invoice.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        student:  { select: { id: true, firstName: true, lastName: true, email: true } },
        issuedBy: { select: { id: true, firstName: true, lastName: true } },
        items:    true,
      },
    });

    res.json(invoices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── GET /api/invoices/:id ───────────────────────────────────
// Get single invoice with line items and payments
router.get('/:id', async (req, res) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        student:  { select: { id: true, firstName: true, lastName: true, email: true } },
        issuedBy: { select: { id: true, firstName: true, lastName: true, role: true } },
        items:    { orderBy: { id: 'asc' } },
        payments: { orderBy: { paidAt: 'desc' } },
      },
    });

    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── POST /api/invoices ──────────────────────────────────────

router.post('/', async (req, res) => {
  try {
    const { studentId, issuedById, dueDate, notes, amount, items } = req.body;

    if (!studentId || !issuedById) {
      return res.status(400).json({ error: 'studentId and issuedById are required' });
    }

    const invoiceNumber = await generateInvoiceNumber();

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        studentId:  parseInt(studentId),
        issuedById: parseInt(issuedById),
        dueDate:    dueDate ? new Date(dueDate) : null,
        notes:      notes || null,
        status:     'PENDING',
        amount:     amount ? parseFloat(amount) : 0,
        paidAmount: 0,
        items: items && items.length > 0
          ? {
              create: items.map(item => ({
                description: item.description,
                quantity:    parseInt(item.quantity) || 1,
                unitPrice:   parseFloat(item.unitPrice) || 0,
                totalPrice:  (parseInt(item.quantity) || 1) * (parseFloat(item.unitPrice) || 0),
              })),
            }
          : undefined,
      },
      include: { items: true },
    });

    // If items were added, recalculate from them (overrides manual amount)
    if (items && items.length > 0) {
      await recalcAmount(invoice.id);
    }

    const updated = await prisma.invoice.findUnique({
      where: { id: invoice.id },
      include: { items: true, student: { select: { id: true, firstName: true, lastName: true, email: true } } },
    });
    res.status(201).json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ─── POST /api/invoices/:id/payments ────────────────────────
router.post('/:id/payments', async (req, res) => {
  try {
    const invoiceId = parseInt(req.params.id);
    const { amount, method, notes } = req.body;

    if (!amount || parseFloat(amount) <= 0) {
      return res.status(400).json({ error: 'Valid payment amount is required' });
    }

    const existing = await prisma.invoice.findUnique({ where: { id: invoiceId } });
    if (!existing) return res.status(404).json({ error: 'Invoice not found' });

    const payment = await prisma.payment.create({
      data: {
        invoiceId,
        amount: parseFloat(amount),
        method: method || 'BANK_TRANSFER',
        notes: notes || null
      }
    });

    await recalcInvoicePayments(invoiceId);

    const updated = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { 
        payments: { orderBy: { paidAt: 'desc' } },
        items: true,
        student: { select: { id: true, firstName: true, lastName: true, email: true } }
      }
    });
    
    res.status(201).json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ─── PATCH /api/invoices/:id/status ─────────────────────────
// T10 required: Update payment status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const id = parseInt(req.params.id);
    const validStatuses = ['PENDING', 'PAID', 'OVERDUE'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const existing = await prisma.invoice.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Invoice not found' });

    // If admin forces PAID, auto-generate a payment for the remaining balance to keep ledger intact
    if (status === 'PAID' && existing.status !== 'PAID') {
      const balanceDue = parseFloat(existing.amount) - parseFloat(existing.paidAmount);
      if (balanceDue > 0) {
        await prisma.payment.create({
          data: {
            invoiceId: id,
            amount: balanceDue,
            method: 'MANUAL_OVERRIDE',
            notes: 'Auto-generated ledger entry from admin status override'
          }
        });
        await recalcInvoicePayments(id);
        const autoUpdated = await prisma.invoice.findUnique({ 
          where: { id },
          include: { payments: { orderBy: { paidAt: 'desc' } } }
        });
        return res.json(autoUpdated);
      }
    }

    const updated = await prisma.invoice.update({
      where: { id },
      data: { status },
      include: { payments: { orderBy: { paidAt: 'desc' } } }
    });

    res.json(updated);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    res.status(400).json({ error: error.message });
  }
});

// ─── PUT /api/invoices/:id ───────────────────────────────────
// Update invoice metadata (notes, dueDate, paidAmount)
router.put('/:id', async (req, res) => {
  try {
    const { notes, dueDate, paidAmount, items } = req.body;
    const id = parseInt(req.params.id);

    const existing = await prisma.invoice.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Invoice not found' });

    // Block line-item edits on PAID/PARTIALLY PAID invoices to maintain data integrity
    if (existing.status !== 'PENDING' && items && items.length > 0) {
      return res.status(400).json({ error: 'Only PENDING invoices can have their line items modified.' });
    }

    let invoice;
    if (items && Array.isArray(items)) {
      invoice = await prisma.$transaction(async (tx) => {
        await tx.invoice.update({
          where: { id },
          data: {
            notes: notes !== undefined ? notes : existing.notes,
            dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : existing.dueDate,
          }
        });

        await tx.invoiceItem.deleteMany({ where: { invoiceId: id } });

        const newItems = items.map(it => ({
          invoiceId: id,
          description: it.description,
          quantity: parseInt(it.quantity) || 1,
          unitPrice: parseFloat(it.unitPrice) || 0,
          totalPrice: (parseInt(it.quantity) || 1) * (parseFloat(it.unitPrice) || 0)
        }));

        if (newItems.length > 0) {
          await tx.invoiceItem.createMany({ data: newItems });
        }

        return tx.invoice.findUnique({
          where: { id },
          include: { 
            items: true,
            student: { select: { id: true, firstName: true, lastName: true, email: true } }
          }
        });
      });
      await recalcAmount(id);
      
      invoice = await prisma.invoice.findUnique({
        where: { id },
        include: { 
          items: true,
          student: { select: { id: true, firstName: true, lastName: true, email: true } }
        }
      });
    } else {
      invoice = await prisma.invoice.update({
        where: { id },
        data: {
          notes: notes !== undefined ? notes : existing.notes,
          dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : existing.dueDate,
          paidAmount: paidAmount !== undefined ? parseFloat(paidAmount) : existing.paidAmount,
        },
        include: { 
          items: true,
          student: { select: { id: true, firstName: true, lastName: true, email: true } }
        }
      });
    }

    res.json(invoice);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    res.status(400).json({ error: error.message });
  }
});

// ─── DELETE /api/invoices/:id ────────────────────────────────
// Delete invoice — only allowed when status is PENDING
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existing = await prisma.invoice.findUnique({ where: { id } });

    if (!existing) return res.status(404).json({ error: 'Invoice not found' });
    if (existing.status !== 'PENDING') {
      return res.status(400).json({ error: 'Only PENDING invoices can be deleted' });
    }

    await prisma.invoice.delete({ where: { id } });
    res.json({ message: `Invoice ${existing.invoiceNumber} deleted successfully` });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    res.status(500).json({ error: error.message });
  }
});

// ─── POST /api/invoices/:id/items ───────────────────────────
// Add a line item
router.post('/:id/items', async (req, res) => {
  try {
    const invoiceId = parseInt(req.params.id);
    const { description, quantity, unitPrice } = req.body;

    if (!description || unitPrice === undefined) {
      return res.status(400).json({ error: 'description and unitPrice are required' });
    }

    const qty   = parseInt(quantity) || 1;
    const price = parseFloat(unitPrice);

    const item = await prisma.invoiceItem.create({
      data: { invoiceId, description, quantity: qty, unitPrice: price, totalPrice: qty * price },
    });

    const newAmount = await recalcAmount(invoiceId);
    res.status(201).json({ item, newAmount });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ─── DELETE /api/invoices/:id/items/:itemId ─────────────────
// Remove a line item
router.delete('/:id/items/:itemId', async (req, res) => {
  try {
    const invoiceId = parseInt(req.params.id);
    const itemId    = parseInt(req.params.itemId);

    await prisma.invoiceItem.delete({ where: { id: itemId } });
    const newAmount = await recalcAmount(invoiceId);
    res.json({ message: 'Item removed', newAmount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
