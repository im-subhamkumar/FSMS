import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Get all document categories
router.get('/', async (req, res) => {
  try {
    const categories = await prisma.documentCategory.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(categories);
  } catch (error) {
    console.error("Error fetching document categories:", error);
    res.status(500).json({ error: error.message });
  }
});

// Create a new document category
router.post('/', async (req, res) => {
  try {
    const { name, description, requiresExpiry, warningThresholdDays } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const category = await prisma.documentCategory.create({
      data: {
        name,
        description,
        requiresExpiry: requiresExpiry || false,
        warningThresholdDays: warningThresholdDays !== undefined ? parseInt(warningThresholdDays) : 30
      }
    });

    res.status(201).json(category);
  } catch (error) {
    console.error("Error creating document category:", error);
    res.status(500).json({ error: error.message });
  }
});

// Update a document category
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, requiresExpiry, warningThresholdDays } = req.body;

    const category = await prisma.documentCategory.update({
      where: { id: parseInt(id) },
      data: {
        name,
        description,
        requiresExpiry,
        warningThresholdDays: warningThresholdDays !== undefined ? parseInt(warningThresholdDays) : undefined
      }
    });

    res.json(category);
  } catch (error) {
    console.error("Error updating document category:", error);
    res.status(500).json({ error: error.message });
  }
});

// Delete a document category
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if category is used by any documents
    const docCount = await prisma.document.count({
      where: { categoryId: parseInt(id) }
    });
    
    if (docCount > 0) {
      return res.status(400).json({ 
        error: `Cannot delete category. It is used by ${docCount} document(s).` 
      });
    }

    await prisma.documentCategory.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error("Error deleting document category:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
