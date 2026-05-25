import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

const DEFAULT_QUALIFICATION_TYPES = [
  { code: 'SPL', name: 'Student Pilot Licence', description: 'Entry-level student pilot licence required before solo operations.' },
  { code: 'PPL', name: 'Private Pilot Licence', description: 'Primary pilot licence for non-commercial single-engine operations.' },
  { code: 'CPL', name: 'Commercial Pilot Licence', description: 'Commercial operations licence for advanced training and paid flying duties.' },
  { code: 'IR', name: 'Instrument Rating', description: 'Qualification for flying under instrument flight rules and low-visibility operations.' },
  { code: 'ME', name: 'Multi-Engine Rating', description: 'Rating required to operate approved multi-engine aircraft.' },
  { code: 'FI', name: 'Flight Instructor Rating', description: 'Instructor qualification for conducting ab-initio and recurrent flight training.' },
  { code: 'RTR', name: 'Radio Telephony Restricted', description: 'Restricted radio telephony qualification for pilot communications.' },
  { code: 'MED1', name: 'Class I Medical', description: 'Commercial pilot medical certification with periodic renewal.' },
  { code: 'MED2', name: 'Class II Medical', description: 'Private pilot medical certification for student and private operations.' },
];

function mapTypeRow(row) {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description,
    validityDays: null,
    isActive: Boolean(row.isActive),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    _count: { records: Number(row.recordCount || 0) },
  };
}

async function fetchTypeByWhere(sqlValue, field = 'id') {
  const rows = field === 'id'
    ? await prisma.$queryRaw`
        SELECT
          qt.id,
          qt.code,
          qt.name,
          qt.description,
          qt.isActive,
          qt.createdAt,
          qt.updatedAt,
          (
            SELECT COUNT(*)
            FROM qualification_records qr
            WHERE qr.qualificationTypeId = qt.id
          ) AS recordCount
        FROM qualification_types qt
        WHERE qt.id = ${sqlValue}
        LIMIT 1
      `
    : await prisma.$queryRaw`
        SELECT
          qt.id,
          qt.code,
          qt.name,
          qt.description,
          qt.isActive,
          qt.createdAt,
          qt.updatedAt,
          (
            SELECT COUNT(*)
            FROM qualification_records qr
            WHERE qr.qualificationTypeId = qt.id
          ) AS recordCount
        FROM qualification_types qt
        WHERE qt.code = ${sqlValue}
        LIMIT 1
      `;

  return rows[0] || null;
}

router.get('/', async (req, res) => {
  try {
    const { search, active } = req.query;
    const rows = await prisma.$queryRaw`
      SELECT
        qt.id,
        qt.code,
        qt.name,
        qt.description,
        qt.isActive,
        qt.createdAt,
        qt.updatedAt,
        (
          SELECT COUNT(*)
          FROM qualification_records qr
          WHERE qr.qualificationTypeId = qt.id
        ) AS recordCount
      FROM qualification_types qt
      ORDER BY qt.name ASC
    `;

    let types = rows.map(mapTypeRow);

    if (search) {
      const text = search.trim().toLowerCase();
      types = types.filter((type) =>
        [type.name, type.code, type.description]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(text)
      );
    }

    if (active !== undefined) {
      const activeFlag = active === 'true';
      types = types.filter((type) => type.isActive === activeFlag);
    }

    res.json(types);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/seed-defaults', async (_req, res) => {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const created = [];
      const updated = [];

      for (const type of DEFAULT_QUALIFICATION_TYPES) {
        const existingRows = await tx.$queryRaw`
          SELECT id, name, description, isActive
          FROM qualification_types
          WHERE code = ${type.code}
          LIMIT 1
        `;
        const existing = existingRows[0];

        if (!existing) {
          await tx.$executeRaw`
            INSERT INTO qualification_types (code, name, description, isActive, createdAt, updatedAt)
            VALUES (${type.code}, ${type.name}, ${type.description}, true, NOW(3), NOW(3))
          `;
          created.push(mapTypeRow(await fetchTypeByWhere(type.code, 'code')));
          continue;
        }

        const needsUpdate =
          existing.name !== type.name ||
          existing.description !== type.description ||
          existing.isActive !== true;

        if (needsUpdate) {
          await tx.$executeRaw`
            UPDATE qualification_types
            SET
              name = ${type.name},
              description = ${type.description},
              isActive = true,
              updatedAt = NOW(3)
            WHERE id = ${existing.id}
          `;
          updated.push(mapTypeRow(await fetchTypeByWhere(existing.id)));
        }
      }

      return { created, updated };
    });

    res.status(201).json({
      message: result.created.length || result.updated.length
        ? `Qualification catalog synced: ${result.created.length} created, ${result.updated.length} updated.`
        : 'Standard qualification types already exist.',
      created: result.created,
      updated: result.updated,
      defaults: DEFAULT_QUALIFICATION_TYPES.map((type) => ({ ...type, validityDays: null })),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const row = await fetchTypeByWhere(id);
    if (!row) return res.status(404).json({ error: 'Qualification type not found' });
    res.json(mapTypeRow(row));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { code, name, description, isActive } = req.body;
    if (!code || !name) {
      return res.status(400).json({ error: 'code and name are required' });
    }

    await prisma.$executeRaw`
      INSERT INTO qualification_types (code, name, description, isActive, createdAt, updatedAt)
      VALUES (${code}, ${name}, ${description || null}, ${isActive !== undefined ? isActive : true}, NOW(3), NOW(3))
    `;

    res.status(201).json(mapTypeRow(await fetchTypeByWhere(code, 'code')));
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: `A qualification type with code "${req.body.code}" already exists.` });
    }
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { code, name, description, isActive } = req.body;
    const id = parseInt(req.params.id, 10);
    const existingRows = await prisma.$queryRaw`
      SELECT id, code, name, description, isActive
      FROM qualification_types
      WHERE id = ${id}
      LIMIT 1
    `;
    if (!existingRows.length) return res.status(404).json({ error: 'Qualification type not found' });

    const existing = existingRows[0];
    await prisma.$executeRaw`
      UPDATE qualification_types
      SET
        code = ${code !== undefined ? code : existing.code},
        name = ${name !== undefined ? name : existing.name},
        description = ${description !== undefined ? description : existing.description},
        isActive = ${isActive !== undefined ? isActive : existing.isActive},
        updatedAt = NOW(3)
      WHERE id = ${id}
    `;

    res.json(mapTypeRow(await fetchTypeByWhere(id)));
  } catch (error) {
    if (error.code === 'P2002') return res.status(409).json({ error: 'Code already in use' });
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const updated = await prisma.$executeRaw`
      UPDATE qualification_types
      SET isActive = false, updatedAt = NOW(3)
      WHERE id = ${id}
    `;
    if (!updated) return res.status(404).json({ error: 'Qualification type not found' });

    res.json({ message: 'Qualification type deactivated', type: mapTypeRow(await fetchTypeByWhere(id)) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
