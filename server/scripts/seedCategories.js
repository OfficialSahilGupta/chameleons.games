const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Category = require('../models/Category');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/chameleons';

async function seedCategories() {
  try {
    console.log(`Connecting to MongoDB at ${MONGO_URI}...`);
    await mongoose.connect(MONGO_URI);
    console.log('Connected.');

    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) {
      console.log(`Data directory ${dataDir} not found.`);
      process.exit(1);
    }

    const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));
    
    if (files.length === 0) {
      console.log('No JSON files found in data directory.');
      process.exit(0);
    }

    for (const file of files) {
      const categoryName = file.replace('.json', '');
      const filePath = path.join(dataDir, file);
      
      const fileData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      const wordList = Array.isArray(fileData) ? fileData : fileData.words;
      
      if (!wordList || !Array.isArray(wordList)) {
        console.log(`Skipping ${file} - Invalid format (expected array of strings).`);
        continue;
      }

      const words = wordList.map(text => ({ text, isActive: true, createdAt: new Date() }));

      // Find or create category
      let category = await Category.findOne({ name: categoryName });
      
      if (category) {
        // Option to overwrite or append. Let's just overwrite for simplicity of a seed script.
        await Category.deleteOne({ name: categoryName });
        console.log(`Deleted existing category ${categoryName}.`);
      }

      category = new Category({
        name: categoryName,
        isActive: true,
        words
      });

      await category.save();
      console.log(`Successfully seeded '${categoryName}' category with ${words.length} words.`);
    }

  } catch (error) {
    console.error('Error seeding categories:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

seedCategories();
