const Category = require('../models/Category');

class WordBankService {
  async getRandomWord(categoryName) {
    const category = await Category.findOne({ name: categoryName, isActive: true });
    if (!category) throw new Error('Category not found or inactive');
    
    const activeWords = category.words.filter(w => w.isActive);
    if (activeWords.length === 0) throw new Error('No active words in category');
    
    const randomIndex = Math.floor(Math.random() * activeWords.length);
    return activeWords[randomIndex].text;
  }

  async getCategories(includeInactive = false) {
    const query = includeInactive ? {} : { isActive: true };
    return Category.find(query);
  }

  async getCategoryById(id) {
    return Category.findById(id);
  }

  async createCategory(name) {
    const category = new Category({ name });
    return category.save();
  }

  async updateCategory(id, updateData) {
    return Category.findByIdAndUpdate(id, updateData, { new: true });
  }

  async deleteCategory(id) {
    return Category.findByIdAndDelete(id);
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
    return category.save();
  }

  async updateWordStatus(categoryId, wordId, isActive) {
    const category = await Category.findById(categoryId);
    if (!category) throw new Error('Category not found');

    const word = category.words.id(wordId);
    if (!word) throw new Error('Word not found');

    word.isActive = isActive;
    return category.save();
  }

  async deleteWord(categoryId, wordId) {
    const category = await Category.findById(categoryId);
    if (!category) throw new Error('Category not found');

    category.words.pull(wordId);
    return category.save();
  }
}

module.exports = new WordBankService();
