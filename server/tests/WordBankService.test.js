const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const WordCategory = require('../models/WordCategory');
const wordBankService = require('../services/WordBankService');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany();
  }
});

describe('WordBankService', () => {
  test('should create a new category', async () => {
    const cat = await wordBankService.createCategory('Animals', 'List of animals');
    expect(cat.name).toBe('Animals');
    expect(cat.description).toBe('List of animals');
    expect(cat.words).toHaveLength(0);
  });

  test('should fetch active categories', async () => {
    await wordBankService.createCategory('ActiveCat', 'active');
    const inactive = await wordBankService.createCategory('InactiveCat', 'inactive');
    await wordBankService.updateCategory(inactive._id, { isActive: false });

    const categories = await wordBankService.getActiveCategories();
    expect(categories).toHaveLength(1);
    expect(categories[0].name).toBe('ActiveCat');
  });

  test('should add a word to a category', async () => {
    const cat = await wordBankService.createCategory('Colors', '');
    const updated = await wordBankService.addWord(cat._id, 'Red');
    expect(updated.words).toHaveLength(1);
    expect(updated.words[0].word).toBe('Red');
    expect(updated.words[0].isActive).toBe(true);
  });

  test('should select a random word', async () => {
    const cat = await wordBankService.createCategory('Fruits', '');
    await wordBankService.addWord(cat._id, 'Apple');
    await wordBankService.addWord(cat._id, 'Banana');
    
    // Deactivate Banana
    const category = await WordCategory.findById(cat._id);
    const banana = category.words.find(w => w.word === 'Banana');
    await wordBankService.updateWord(cat._id, banana._id, { isActive: false });

    const randomWord = await wordBankService.getRandomWord('Fruits');
    expect(randomWord).toBe('Apple'); // Since Banana is inactive
  });
});
