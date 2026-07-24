const express = require('express');
const router = express.Router();
const wordBankService = require('../services/WordBankService');

// GET /api/categories
// Returns each enabled category with its active words
router.get('/', async (req, res) => {
  try {
    const categories = await wordBankService.getCategories(false); // Only active
    
    // Filter out inactive words before sending
    const filteredCategories = categories.map(cat => {
      const catObj = cat.toObject ? cat.toObject() : cat;
      return {
        ...catObj,
        words: catObj.words.filter(w => w.isActive)
      };
    });

    res.json(filteredCategories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
