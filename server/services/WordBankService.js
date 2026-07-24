const Category = require('../models/Category');
const redisClient = require('../redisClient');

class WordBankService {
  async getRandomWord(categoryName) {
    const category = await Category.findOne({ name: categoryName, isActive: true });
    if (!category) throw new Error('Category not found or inactive');
    
    const activeWords = category.words.filter(w => w.isActive);
    if (activeWords.length === 0) throw new Error('No active words in category');
    
    const randomIndex = Math.floor(Math.random() * activeWords.length);
    return activeWords[randomIndex].text;
  }

  async getRoundBoard(categoryName, count = 16) {
    const category = await Category.findOne({ name: categoryName, isActive: true });
    if (!category) throw new Error('Category not found or inactive');
    
    const activeWords = category.words.filter(w => w.isActive);
    if (activeWords.length === 0) throw new Error('No active words in category');
    
    // Shuffle and pick `count` words (or less if not enough)
    const shuffled = activeWords.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, count).map(w => w.text);
    
    const secretWord = selected[Math.floor(Math.random() * selected.length)];
    
    return { boardWords: selected, secretWord };
  }

  async invalidateCache() {
    try {
      if (redisClient.isReady) {
        await redisClient.del('categories:active');
      }
    } catch (err) {
      console.error('Redis cache invalidation error:', err);
    }
  }

  async getCategories(includeInactive = false) {
    if (!includeInactive && redisClient.isReady) {
      try {
        const cached = await redisClient.get('categories:active');
        if (cached) return JSON.parse(cached);
      } catch (err) {
        console.error('Redis GET Error:', err);
      }
    }

    const query = includeInactive ? {} : { isActive: true };
    const categories = await Category.find(query);

    if (!includeInactive && redisClient.isReady) {
      try {
        await redisClient.setEx('categories:active', 86400, JSON.stringify(categories));
      } catch (err) {
        console.error('Redis SET Error:', err);
      }
    }

    return categories;
  }

  async getCategoryById(id) {
    return Category.findById(id);
  }

  async createCategory(name) {
    const category = new Category({ name });
    const saved = await category.save();
    await this.invalidateCache();
    return saved;
  }

  async updateCategory(id, updateData) {
    const updated = await Category.findByIdAndUpdate(id, updateData, { new: true });
    await this.invalidateCache();
    return updated;
  }

  async deleteCategory(id) {
    const deleted = await Category.findByIdAndDelete(id);
    await this.invalidateCache();
    return deleted;
  }

  async addWordsToCategory(categoryId, wordsList, userId) {
    const category = await Category.findById(categoryId);
    if (!category) throw new Error('Category not found');

    const newWords = wordsList.map(text => ({
      text,
      isActive: true,
      createdBy: userId,
      createdAt: new Date()
    }));

    category.words.push(...newWords);
    const saved = await category.save();
    await this.invalidateCache();
    return saved;
  }

  async updateWordStatus(categoryId, wordId, isActive) {
    const category = await Category.findById(categoryId);
    if (!category) throw new Error('Category not found');

    const word = category.words.id(wordId);
    if (!word) throw new Error('Word not found');

    word.isActive = isActive;
    const saved = await category.save();
    await this.invalidateCache();
    return saved;
  }

  async deleteWord(categoryId, wordId) {
    const category = await Category.findById(categoryId);
    if (!category) throw new Error('Category not found');

    category.words.pull(wordId);
    const saved = await category.save();
    await this.invalidateCache();
    return saved;
  }
}

module.exports = new WordBankService();
