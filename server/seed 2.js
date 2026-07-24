const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Category = require('./models/Category');

dotenv.config({ path: '../.env' });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/chameleons';

const animals = [
  'Dog', 'Cat', 'Lion', 'Tiger', 'Elephant', 'Giraffe', 'Zebra', 'Monkey', 'Gorilla', 'Chimpanzee',
  'Bear', 'Wolf', 'Fox', 'Deer', 'Moose', 'Kangaroo', 'Koala', 'Panda', 'Sloth', 'Rhino',
  'Hippo', 'Crocodile', 'Alligator', 'Snake', 'Lizard', 'Turtle', 'Frog', 'Toad', 'Salamander', 'Shark',
  'Whale', 'Dolphin', 'Seal', 'Walrus', 'Penguin', 'Ostrich', 'Emu', 'Eagle', 'Hawk', 'Falcon',
  'Owl', 'Parrot', 'Pigeon', 'Crow', 'Raven', 'Swan', 'Duck', 'Goose', 'Chicken', 'Turkey',
  'Pig', 'Cow', 'Horse', 'Sheep', 'Goat', 'Donkey', 'Rabbit', 'Hare', 'Squirrel', 'Chipmunk',
  'Mouse', 'Rat', 'Hamster', 'Guinea Pig', 'Bat', 'Hedgehog', 'Porcupine', 'Skunk', 'Raccoon', 'Badger',
  'Beaver', 'Otter', 'Platypus', 'Cheetah', 'Leopard', 'Jaguar', 'Panther', 'Cougar', 'Lynx', 'Bobcat',
  'Hyena', 'Jackal', 'Camel', 'Llama', 'Alpaca', 'Bison', 'Buffalo', 'Yak', 'Gazelle', 'Antelope',
  'Baboon', 'Orangutan', 'Lemur', 'Meerkat', 'Mongoose', 'Wolverine', 'Armadillo', 'Anteater', 'Tapir', 'Manatee',
  'Flamingo', 'Peacock', 'Pelican'
];

async function seedDatabase() {
  try {
    console.log(`Connecting to MongoDB at ${MONGO_URI}...`);
    await mongoose.connect(MONGO_URI);
    console.log('Connected.');

    // Clear existing category if exists
    await Category.deleteOne({ name: 'Animals' });

    const words = animals.map(text => ({ text, isActive: true }));

    const category = new Category({
      name: 'Animals',
      isActive: true,
      words: words
    });

    await category.save();
    console.log(`Successfully seeded 'Animals' category with ${words.length} words.`);

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

seedDatabase();
