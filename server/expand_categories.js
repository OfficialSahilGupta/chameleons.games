require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('./models/Category');
const https = require('https');

function fetchDatamuse(word) {
  return new Promise((resolve, reject) => {
    // URL encode the word to handle spaces (e.g. "Action Movies")
    const query = encodeURIComponent(word.replace(/ /g, '+'));
    https.get(`https://api.datamuse.com/words?ml=${query}&max=40`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          const words = parsed.map(w => w.word);
          resolve(words);
        } catch (e) {
          resolve([]);
        }
      });
    }).on('error', err => resolve([]));
  });
}

// Capitalize first letter of each word
function titleCase(str) {
  return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

async function expand() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chameleons');
  
  const categories = await Category.find({});
  console.log(`Found ${categories.length} categories to expand.`);

  for (let i = 0; i < categories.length; i++) {
    const cat = categories[i];
    console.log(`[${i+1}/${categories.length}] Expanding ${cat.name}...`);
    
    // Existing words mapped to lower case for comparison
    const existingWords = new Set(cat.words.map(w => w.text.toLowerCase()));
    const finalWords = [...cat.words];
    
    // Fetch new words
    const fetched = await fetchDatamuse(cat.name);
    
    for (const w of fetched) {
      if (finalWords.length >= 50) break; // Reached 50 words
      if (!existingWords.has(w.toLowerCase())) {
        existingWords.add(w.toLowerCase());
        finalWords.push({ text: titleCase(w), isActive: true });
      }
    }
    
    // If still less than 50, fetch some related words using 'topics' or broader terms if it's multiple words
    if (finalWords.length < 50 && cat.name.includes(' ')) {
        const lastWord = cat.name.split(' ').pop();
        const fetched2 = await fetchDatamuse(lastWord);
        for (const w of fetched2) {
          if (finalWords.length >= 50) break;
          if (!existingWords.has(w.toLowerCase())) {
            existingWords.add(w.toLowerCase());
            finalWords.push({ text: titleCase(w), isActive: true });
          }
        }
    }

    cat.words = finalWords;
    await cat.save();
    
    // Sleep 100ms to avoid rate limits
    await new Promise(r => setTimeout(r, 100));
  }
  
  console.log('Finished expanding all categories!');
  process.exit(0);
}

expand().catch(err => {
  console.error(err);
  process.exit(1);
});
