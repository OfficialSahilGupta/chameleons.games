const express = require('express');
const router = express.Router();
const wordBankService = require('../services/WordBankService');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// All routes here are protected by auth and adminAuth
router.use(auth, adminAuth);

// GET /api/admin/categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await wordBankService.getCategories(true); // Include inactive
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/admin/categories
router.post('/categories', async (req, res) => {
  try {
    const category = await wordBankService.createCategory(req.body.name);
    res.json(category);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/admin/categories/:id
router.patch('/categories/:id', async (req, res) => {
  try {
    const category = await wordBankService.updateCategory(req.params.id, req.body);
    res.json(category);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/admin/categories/:id
router.delete('/categories/:id', async (req, res) => {
  try {
    await wordBankService.deleteCategory(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/categories/:id/words (Can just use GET categories but fine to have it)
router.get('/categories/:id/words', async (req, res) => {
  try {
    const category = await wordBankService.getCategoryById(req.params.id);
    res.json(category ? category.words : []);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/admin/categories/:id/words (Bulk Add)
router.post('/categories/:id/words', async (req, res) => {
  try {
    const { words } = req.body; // Array of strings
    if (!Array.isArray(words)) return res.status(400).json({ message: 'Words must be an array' });
    
    const category = await wordBankService.addWordsToCategory(req.params.id, words, req.user.id);
    res.json(category);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/admin/categories/:id/words/:wordId
router.patch('/categories/:id/words/:wordId', async (req, res) => {
  try {
    const category = await wordBankService.updateWordStatus(req.params.id, req.params.wordId, req.body.isActive);
    res.json(category);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/admin/categories/:id/words/:wordId
router.delete('/categories/:id/words/:wordId', async (req, res) => {
  try {
    const category = await wordBankService.deleteWord(req.params.id, req.params.wordId);
    res.json(category);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
