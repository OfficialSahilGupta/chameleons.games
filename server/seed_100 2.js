require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('./models/Category');

const categories = {
  "Birds": ["Eagle", "Parrot", "Penguin", "Ostrich", "Owl", "Flamingo", "Peacock", "Swan", "Hawk", "Pigeon", "Crow", "Woodpecker", "Seagull", "Pelican", "Falcon", "Hummingbird"],
  "Pets": ["Dog", "Cat", "Hamster", "Goldfish", "Guinea Pig", "Rabbit", "Turtle", "Parrot", "Ferret", "Lizard", "Snake", "Tarantula", "Mouse", "Gerbil", "Chinchilla", "Hedgehog"],
  "Bollywood": ["Shah Rukh Khan", "Amitabh Bachchan", "Salman Khan", "Aamir Khan", "Hrithik Roshan", "Akshay Kumar", "Deepika Padukone", "Priyanka Chopra", "Kareena Kapoor", "Alia Bhatt", "Ranbir Kapoor", "Ranveer Singh", "Katrina Kaif", "Anushka Sharma", "Kajol", "Madhuri Dixit"],
  "Hollywood": ["Tom Cruise", "Leonardo DiCaprio", "Brad Pitt", "Johnny Depp", "Will Smith", "Tom Hanks", "Robert De Niro", "Al Pacino", "Morgan Freeman", "Denzel Washington", "Meryl Streep", "Angelina Jolie", "Scarlett Johansson", "Jennifer Lawrence", "Natalie Portman", "Julia Roberts"],
  "Foods": ["Pizza", "Burger", "Pasta", "Sushi", "Tacos", "Steak", "Salad", "Soup", "Sandwich", "Curry", "Noodles", "Rice", "Bread", "Cheese", "Eggs", "Bacon"],
  "Transportation": ["Car", "Bus", "Train", "Airplane", "Helicopter", "Boat", "Ship", "Bicycle", "Motorcycle", "Scooter", "Subway", "Tram", "Truck", "Van", "Ferry", "Hot Air Balloon"],
  "Poets": ["William Shakespeare", "Robert Frost", "Edgar Allan Poe", "Emily Dickinson", "Walt Whitman", "Maya Angelou", "Sylvia Plath", "Langston Hughes", "Pablo Neruda", "John Keats", "William Wordsworth", "Rumi", "Homer", "Dante Alighieri", "T.S. Eliot", "William Blake"],
  "Wild Animals": ["Lion", "Tiger", "Elephant", "Giraffe", "Zebra", "Rhinoceros", "Hippopotamus", "Cheetah", "Leopard", "Gorilla", "Chimpanzee", "Kangaroo", "Koala", "Panda", "Bear", "Wolf"],
  "Marine Life": ["Dolphin", "Whale", "Shark", "Octopus", "Squid", "Crab", "Lobster", "Jellyfish", "Seahorse", "Starfish", "Stingray", "Turtle", "Seal", "Walrus", "Penguin", "Manatee"],
  "Insects": ["Ant", "Bee", "Butterfly", "Mosquito", "Fly", "Beetle", "Spider", "Cockroach", "Grasshopper", "Cricket", "Moth", "Wasp", "Dragonfly", "Flea", "Tick", "Termite"],
  "Reptiles": ["Snake", "Lizard", "Crocodile", "Alligator", "Turtle", "Tortoise", "Iguana", "Chameleon", "Gecko", "Skink", "Monitor Lizard", "Komodo Dragon", "Python", "Cobra", "Viper", "Boa Constrictor"],
  "Fruits": ["Apple", "Banana", "Orange", "Grape", "Strawberry", "Watermelon", "Mango", "Pineapple", "Peach", "Pear", "Cherry", "Plum", "Kiwi", "Lemon", "Lime", "Blueberry"],
  "Vegetables": ["Carrot", "Potato", "Tomato", "Onion", "Garlic", "Broccoli", "Cauliflower", "Spinach", "Lettuce", "Cucumber", "Pepper", "Corn", "Peas", "Beans", "Mushroom", "Zucchini"],
  "Fast Food": ["McDonalds", "Burger King", "Wendys", "KFC", "Taco Bell", "Subway", "Pizza Hut", "Dominos", "Papa Johns", "Chipotle", "Panera Bread", "Chick-fil-A", "Sonic", "Dairy Queen", "Arbys", "Popeyes"],
  "Desserts": ["Cake", "Ice Cream", "Cookie", "Pie", "Brownie", "Cupcake", "Donut", "Pudding", "Cheesecake", "Tart", "Pastry", "Macaron", "Crepe", "Waffle", "Pancake", "Muffin"],
  "Beverages": ["Water", "Coffee", "Tea", "Milk", "Juice", "Soda", "Beer", "Wine", "Whiskey", "Vodka", "Rum", "Gin", "Tequila", "Cocktail", "Smoothie", "Milkshake"],
  "Spices": ["Salt", "Pepper", "Cinnamon", "Cumin", "Paprika", "Turmeric", "Ginger", "Garlic Powder", "Onion Powder", "Oregano", "Basil", "Thyme", "Rosemary", "Nutmeg", "Cloves", "Cardamom"],
  "European Countries": ["France", "Germany", "Italy", "Spain", "United Kingdom", "Russia", "Ukraine", "Poland", "Romania", "Netherlands", "Belgium", "Greece", "Portugal", "Sweden", "Hungary", "Austria"],
  "Asian Countries": ["China", "India", "Japan", "South Korea", "Indonesia", "Pakistan", "Bangladesh", "Russia", "Philippines", "Vietnam", "Turkey", "Iran", "Thailand", "Myanmar", "Iraq", "Afghanistan"],
  "African Countries": ["Nigeria", "Ethiopia", "Egypt", "DR Congo", "Tanzania", "South Africa", "Kenya", "Uganda", "Algeria", "Sudan", "Morocco", "Angola", "Mozambique", "Ghana", "Madagascar", "Cameroon"],
  "South American Countries": ["Brazil", "Colombia", "Argentina", "Peru", "Venezuela", "Chile", "Ecuador", "Bolivia", "Paraguay", "Uruguay", "Guyana", "Suriname", "French Guiana", "Falkland Islands", "South Georgia", "Bouvet Island"],
  "US States": ["California", "Texas", "Florida", "New York", "Pennsylvania", "Illinois", "Ohio", "Georgia", "North Carolina", "Michigan", "New Jersey", "Virginia", "Washington", "Arizona", "Massachusetts", "Tennessee"],
  "Capital Cities": ["London", "Paris", "Rome", "Berlin", "Madrid", "Moscow", "Beijing", "Tokyo", "New Delhi", "Washington DC", "Ottawa", "Canberra", "Brasilia", "Buenos Aires", "Cairo", "Pretoria"],
  "Rivers": ["Amazon", "Nile", "Yangtze", "Mississippi", "Yenisei", "Yellow River", "Ob", "Parana", "Congo", "Amur", "Lena", "Mekong", "Mackenzie", "Niger", "Murray", "Tocantins"],
  "Mountains": ["Everest", "K2", "Kangchenjunga", "Lhotse", "Makalu", "Cho Oyu", "Dhaulagiri", "Manaslu", "Nanga Parbat", "Annapurna", "Gasherbrum", "Broad Peak", "Shishapangma", "Kilimanjaro", "Denali", "Mont Blanc"],
  "Oceans": ["Pacific", "Atlantic", "Indian", "Southern", "Arctic", "Mediterranean Sea", "Caribbean Sea", "South China Sea", "Bering Sea", "Gulf of Mexico", "Okhotsk Sea", "East China Sea", "Hudson Bay", "Japan Sea", "Andaman Sea", "North Sea"],
  "Planets": ["Mercury", "Venus", "Earth", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto", "Ceres", "Eris", "Haumea", "Makemake", "Moon", "Sun", "Asteroid"],
  "Constellations": ["Orion", "Ursa Major", "Ursa Minor", "Cassiopeia", "Pegasus", "Andromeda", "Centaurus", "Crux", "Cygnus", "Lyra", "Scorpius", "Taurus", "Gemini", "Leo", "Virgo", "Canis Major"],
  "Elements": ["Hydrogen", "Helium", "Lithium", "Beryllium", "Boron", "Carbon", "Nitrogen", "Oxygen", "Fluorine", "Neon", "Sodium", "Magnesium", "Aluminum", "Silicon", "Phosphorus", "Sulfur"],
  "Gemstones": ["Diamond", "Ruby", "Sapphire", "Emerald", "Amethyst", "Topaz", "Opal", "Pearl", "Garnet", "Aquamarine", "Turquoise", "Jade", "Onyx", "Lapis Lazuli", "Citrine", "Zircon"],
  "Tools": ["Hammer", "Screwdriver", "Wrench", "Pliers", "Saw", "Drill", "Tape Measure", "Level", "Chisel", "File", "Utility Knife", "Clamp", "Vise", "Crowbar", "Mallet", "Axe"],
  "Furniture": ["Chair", "Table", "Sofa", "Bed", "Desk", "Dresser", "Cabinet", "Bookshelf", "Wardrobe", "Stool", "Bench", "Ottoman", "Recliner", "Futon", "Crib", "Hammock"],
  "Appliances": ["Refrigerator", "Oven", "Microwave", "Dishwasher", "Washing Machine", "Dryer", "Toaster", "Blender", "Coffee Maker", "Vacuum Cleaner", "Iron", "Hair Dryer", "Fan", "Heater", "Air Conditioner", "Television"],
  "Clothing": ["Shirt", "Pants", "Dress", "Skirt", "Jacket", "Coat", "Sweater", "Hoodie", "Shorts", "Jeans", "T-shirt", "Suit", "Tie", "Socks", "Underwear", "Bra"],
  "Footwear": ["Shoes", "Boots", "Sneakers", "Sandals", "Slippers", "Heels", "Flats", "Loafers", "Oxfords", "Wedges", "Mules", "Clogs", "Flip Flops", "Cleats", "Water Shoes", "Snow Boots"],
  "Accessories": ["Watch", "Necklace", "Earrings", "Bracelet", "Ring", "Sunglasses", "Hat", "Scarf", "Gloves", "Belt", "Wallet", "Purse", "Backpack", "Umbrella", "Tie", "Hairband"],
  "Makeup": ["Foundation", "Concealer", "Powder", "Blush", "Bronzer", "Highlighter", "Eyeshadow", "Eyeliner", "Mascara", "Lipstick", "Lip Gloss", "Lip Liner", "Nail Polish", "Perfume", "Makeup Brush", "Sponge"],
  "Colors": ["Red", "Blue", "Green", "Yellow", "Orange", "Purple", "Pink", "Brown", "Black", "White", "Gray", "Silver", "Gold", "Cyan", "Magenta", "Teal"],
  "Shapes": ["Circle", "Square", "Triangle", "Rectangle", "Oval", "Star", "Heart", "Diamond", "Pentagon", "Hexagon", "Octagon", "Cylinder", "Sphere", "Cube", "Pyramid", "Cone"],
  "Musical Instruments": ["Piano", "Guitar", "Violin", "Drums", "Flute", "Saxophone", "Trumpet", "Clarinet", "Cello", "Harp", "Bass", "Trombone", "Tuba", "Accordion", "Banjo", "Ukulele"],
  "Genres of Music": ["Rock", "Pop", "Hip Hop", "Jazz", "Classical", "Country", "Blues", "Electronic", "R&B", "Reggae", "Folk", "Metal", "Punk", "Disco", "Gospel", "Ska"],
  "Famous Bands": ["The Beatles", "Rolling Stones", "Queen", "Led Zeppelin", "Pink Floyd", "U2", "AC/DC", "Nirvana", "Metallica", "Coldplay", "Radiohead", "Green Day", "Red Hot Chili Peppers", "The Doors", "The Who", "Eagles"],
  "Classical Composers": ["Beethoven", "Mozart", "Bach", "Chopin", "Tchaikovsky", "Vivaldi", "Wagner", "Brahms", "Handel", "Debussy", "Schubert", "Verdi", "Stravinsky", "Haydn", "Mahler", "Puccini"],
  "Pop Stars": ["Michael Jackson", "Madonna", "Elvis Presley", "Beyonce", "Lady Gaga", "Taylor Swift", "Justin Bieber", "Katy Perry", "Rihanna", "Ariana Grande", "Bruno Mars", "Ed Sheeran", "Adele", "Drake", "The Weeknd", "Billie Eilish"],
  "Rappers": ["Eminem", "Jay-Z", "Tupac", "Notorious BIG", "Snoop Dogg", "Dr Dre", "Nas", "Ice Cube", "Kendrick Lamar", "J Cole", "Drake", "Kanye West", "Lil Wayne", "50 Cent", "Travis Scott", "Cardi B"],
  "Sports": ["Soccer", "Basketball", "Baseball", "Tennis", "Golf", "Football", "Volleyball", "Hockey", "Cricket", "Rugby", "Boxing", "MMA", "Swimming", "Track and Field", "Gymnastics", "Cycling"],
  "Board Games": ["Monopoly", "Scrabble", "Chess", "Checkers", "Catan", "Risk", "Clue", "Ticket to Ride", "Pandemic", "Codenames", "Battleship", "Sorry", "Life", "Guess Who", "Connect 4", "Jenga"],
  "Video Games": ["Minecraft", "Tetris", "Grand Theft Auto", "Wii Sports", "PUBG", "Super Mario", "Pokemon", "Call of Duty", "FIFA", "League of Legends", "Fortnite", "Zelda", "Red Dead Redemption", "Overwatch", "Roblox", "Sims"],
  "Card Games": ["Poker", "Blackjack", "Solitaire", "Uno", "Go Fish", "Crazy Eights", "Rummy", "Hearts", "Spades", "Bridge", "Euchre", "Pinochle", "War", "Baccarat", "Texas Holdem", "Magic the Gathering"],
  "Olympic Events": ["100m Dash", "Marathon", "Swimming", "Gymnastics", "Diving", "Weightlifting", "Wrestling", "Judo", "Boxing", "Fencing", "Archery", "Rowing", "Cycling", "Equestrian", "Tennis", "Basketball"],
  "Gym Equipment": ["Treadmill", "Elliptical", "Stationary Bike", "Rowing Machine", "Dumbbells", "Barbell", "Kettlebell", "Weight Bench", "Squat Rack", "Leg Press", "Pull Up Bar", "Resistance Bands", "Medicine Ball", "Yoga Mat", "Foam Roller", "Jump Rope"],
  "Martial Arts": ["Karate", "Taekwondo", "Judo", "Brazilian Jiu-Jitsu", "Kung Fu", "Muay Thai", "Kickboxing", "Boxing", "Wrestling", "Krav Maga", "Aikido", "Capoeira", "Tai Chi", "Hapkido", "Sambo", "Silat"],
  "Car Brands": ["Toyota", "Volkswagen", "Ford", "Honda", "Chevrolet", "Nissan", "Hyundai", "Kia", "Mercedes-Benz", "BMW", "Audi", "Tesla", "Subaru", "Porsche", "Ferrari", "Lamborghini"],
  "Motorcycle Brands": ["Harley-Davidson", "Honda", "Yamaha", "Kawasaki", "Suzuki", "Ducati", "BMW", "Triumph", "KTM", "Aprilia", "Indian", "Royal Enfield", "Moto Guzzi", "MV Agusta", "Husqvarna", "Vespa"],
  "Airlines": ["Delta", "American Airlines", "United", "Southwest", "Emirates", "Qatar Airways", "Singapore Airlines", "Lufthansa", "British Airways", "Air France", "Cathay Pacific", "ANA", "Qantas", "Turkish Airlines", "Ryanair", "EasyJet"],
  "Tech Companies": ["Apple", "Microsoft", "Amazon", "Alphabet", "Facebook", "Tencent", "Alibaba", "Samsung", "TSMC", "Intel", "Nvidia", "Cisco", "Oracle", "IBM", "Netflix", "Tesla"],
  "Social Media": ["Facebook", "YouTube", "WhatsApp", "Instagram", "WeChat", "TikTok", "LinkedIn", "Twitter", "Snapchat", "Pinterest", "Reddit", "Tumblr", "Discord", "Telegram", "Twitch", "Quora"],
  "Programming Languages": ["Python", "Java", "JavaScript", "C++", "C#", "Ruby", "PHP", "Swift", "Go", "Kotlin", "Rust", "TypeScript", "Scala", "Perl", "Haskell", "Lua"],
  "Operating Systems": ["Windows", "macOS", "Linux", "Android", "iOS", "Chrome OS", "Ubuntu", "Debian", "Fedora", "CentOS", "Arch Linux", "FreeBSD", "Unix", "Solaris", "MS-DOS", "BlackBerry OS"],
  "Web Browsers": ["Chrome", "Safari", "Firefox", "Edge", "Opera", "Brave", "Vivaldi", "Tor", "Internet Explorer", "UC Browser", "Yandex", "Samsung Internet", "Maxthon", "Pale Moon", "SeaMonkey", "Waterfox"],
  "Famous Scientists": ["Albert Einstein", "Isaac Newton", "Galileo Galilei", "Charles Darwin", "Marie Curie", "Nikola Tesla", "Stephen Hawking", "Niels Bohr", "Louis Pasteur", "Thomas Edison", "Johannes Kepler", "Copernicus", "Max Planck", "Michael Faraday", "Richard Feynman", "Rosalind Franklin"],
  "Inventors": ["Thomas Edison", "Alexander Graham Bell", "Nikola Tesla", "Wright Brothers", "Henry Ford", "Leonardo da Vinci", "Johannes Gutenberg", "Eli Whitney", "Samuel Morse", "Tim Berners-Lee", "Guglielmo Marconi", "Charles Babbage", "James Watt", "Benjamin Franklin", "Steve Jobs", "Elon Musk"],
  "Historical Figures": ["Julius Caesar", "Alexander the Great", "Napoleon Bonaparte", "George Washington", "Abraham Lincoln", "Winston Churchill", "Mahatma Gandhi", "Nelson Mandela", "Martin Luther King Jr", "Cleopatra", "Queen Victoria", "Joan of Arc", "Genghis Khan", "Christopher Columbus", "Marco Polo", "Mother Teresa"],
  "Philosophers": ["Socrates", "Plato", "Aristotle", "Confucius", "Rene Descartes", "Immanuel Kant", "Friedrich Nietzsche", "John Locke", "Karl Marx", "Jean-Jacques Rousseau", "David Hume", "Thomas Aquinas", "Niccolo Machiavelli", "Arthur Schopenhauer", "Soren Kierkegaard", "Jean-Paul Sartre"],
  "Authors": ["William Shakespeare", "Charles Dickens", "Jane Austen", "Mark Twain", "Leo Tolstoy", "Fyodor Dostoevsky", "George Orwell", "JRR Tolkien", "JK Rowling", "Stephen King", "Agatha Christie", "Ernest Hemingway", "F Scott Fitzgerald", "Gabriel Garcia Marquez", "Homer", "Virginia Woolf"],
  "Fictional Characters": ["Sherlock Holmes", "Harry Potter", "James Bond", "Batman", "Superman", "Spider-Man", "Mickey Mouse", "Bugs Bunny", "Homer Simpson", "Darth Vader", "Luke Skywalker", "Indiana Jones", "Frodo Baggins", "Katniss Everdeen", "Iron Man", "Wonder Woman"],
  "Superheroes": ["Superman", "Batman", "Spider-Man", "Wonder Woman", "Iron Man", "Captain America", "Thor", "Hulk", "Wolverine", "Flash", "Green Lantern", "Aquaman", "Black Panther", "Doctor Strange", "Deadpool", "Captain Marvel"],
  "Villains": ["Joker", "Darth Vader", "Voldemort", "Thanos", "Hannibal Lecter", "Sauron", "Lex Luthor", "Magneto", "Loki", "Green Goblin", "Venom", "Doctor Doom", "Harley Quinn", "Bane", "Freddy Krueger", "Jason Voorhees"],
  "Disney Characters": ["Mickey Mouse", "Donald Duck", "Goofy", "Pluto", "Minnie Mouse", "Snow White", "Cinderella", "Ariel", "Belle", "Jasmine", "Mulan", "Simba", "Aladdin", "Peter Pan", "Winnie the Pooh", "Elsa"],
  "Harry Potter Characters": ["Harry Potter", "Ron Weasley", "Hermione Granger", "Albus Dumbledore", "Severus Snape", "Voldemort", "Sirius Black", "Draco Malfoy", "Hagrid", "Neville Longbottom", "Luna Lovegood", "Ginny Weasley", "Bellatrix Lestrange", "Remus Lupin", "Minerva McGonagall", "Dobby"],
  "Star Wars Characters": ["Luke Skywalker", "Darth Vader", "Han Solo", "Princess Leia", "Yoda", "Obi-Wan Kenobi", "Chewbacca", "R2-D2", "C-3PO", "Boba Fett", "Emperor Palpatine", "Kylo Ren", "Rey", "Finn", "Poe Dameron", "Padme Amidala"],
  "Anime Series": ["Naruto", "Dragon Ball Z", "One Piece", "Attack on Titan", "Death Note", "Fullmetal Alchemist", "My Hero Academia", "Sword Art Online", "Demon Slayer", "Hunter x Hunter", "Tokyo Ghoul", "Bleach", "Fairy Tail", "Neon Genesis Evangelion", "Cowboy Bebop", "JoJos Bizarre Adventure"],
  "Sitcoms": ["Friends", "The Office", "Seinfeld", "How I Met Your Mother", "The Big Bang Theory", "Brooklyn Nine-Nine", "Parks and Recreation", "Modern Family", "Two and a Half Men", "That 70s Show", "Scrubs", "New Girl", "Arrested Development", "Community", "It's Always Sunny", "The Simpsons"],
  "Drama Series": ["Breaking Bad", "Game of Thrones", "The Wire", "The Sopranos", "Mad Men", "Stranger Things", "The Crown", "Peaky Blinders", "Better Call Saul", "House of Cards", "Chernobyl", "Succession", "Westworld", "Fargo", "True Detective", "The Handmaids Tale"],
  "Oscar Winning Movies": ["Titanic", "Lord of the Rings", "Ben-Hur", "West Side Story", "The English Patient", "Gigi", "The Last Emperor", "Slumdog Millionaire", "Amadeus", "Gandhi", "Lawrence of Arabia", "On the Waterfront", "Schindlers List", "Gone with the Wind", "Forrest Gump", "The Godfather"],
  "Sci-Fi Movies": ["Star Wars", "The Matrix", "Blade Runner", "Alien", "Terminator", "Back to the Future", "Interstellar", "Inception", "Jurassic Park", "Avatar", "ET", "2001 A Space Odyssey", "The Martian", "Mad Max Fury Road", "Wall-E", "Dune"],
  "Horror Movies": ["The Exorcist", "The Shining", "Halloween", "A Nightmare on Elm Street", "Friday the 13th", "Scream", "The Texas Chain Saw Massacre", "Psycho", "The Conjuring", "It", "Get Out", "Hereditary", "Saw", "The Ring", "Rosemarys Baby", "Alien"],
  "Comedy Movies": ["Superbad", "The Hangover", "Anchorman", "Step Brothers", "Dumb and Dumber", "Ghostbusters", "Monty Python and the Holy Grail", "Airplane", "Groundhog Day", "Mean Girls", "Shaun of the Dead", "Bridesmaids", "Zoolander", "Tropic Thunder", "Borat", "Napoleon Dynamite"],
  "Action Movies": ["Die Hard", "Terminator 2", "The Matrix", "Mad Max Fury Road", "John Wick", "Gladiator", "The Dark Knight", "Aliens", "Avengers", "Raiders of the Lost Ark", "Predator", "Lethal Weapon", "Mission Impossible", "Speed", "Rambo", "Kill Bill"],
  "Famous Paintings": ["Mona Lisa", "Starry Night", "The Last Supper", "The Scream", "Guernica", "The Kiss", "Girl with a Pearl Earring", "The Birth of Venus", "Las Meninas", "Creation of Adam", "American Gothic", "Persistence of Memory", "Night Watch", "Water Lilies", "Son of Man", "Cafe Terrace at Night"],
  "Art Movements": ["Renaissance", "Impressionism", "Cubism", "Surrealism", "Expressionism", "Abstract", "Pop Art", "Baroque", "Romanticism", "Realism", "Minimalism", "Fauvism", "Dada", "Art Nouveau", "Neoclassicism", "Post-Impressionism"],
  "World Religions": ["Christianity", "Islam", "Hinduism", "Buddhism", "Sikhism", "Judaism", "Bahai", "Jainism", "Shinto", "Zoroastrianism", "Taoism", "Confucianism", "Paganism", "Wicca", "Rastafari", "Scientology"],
  "Mythological Gods": ["Zeus", "Hera", "Poseidon", "Hades", "Athena", "Apollo", "Artemis", "Ares", "Aphrodite", "Hephaestus", "Hermes", "Odin", "Thor", "Loki", "Ra", "Anubis"],
  "Zodiac Signs": ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces", "Ophiuchus", "Dragon", "Snake", "Tiger"],
  "Medical Specialties": ["Cardiology", "Neurology", "Oncology", "Pediatrics", "Psychiatry", "Dermatology", "Gastroenterology", "Endocrinology", "Radiology", "Anesthesiology", "Surgery", "Orthopedics", "Urology", "Ophthalmology", "Pathology", "Gynecology"],
  "Human Anatomy": ["Brain", "Heart", "Lungs", "Liver", "Kidneys", "Stomach", "Intestines", "Skin", "Bones", "Muscles", "Blood", "Veins", "Arteries", "Nerves", "Spine", "Skull"],
  "Diseases": ["Cancer", "Diabetes", "Asthma", "Alzheimers", "Parkinsons", "Arthritis", "Hypertension", "Tuberculosis", "Malaria", "HIV", "COVID", "Influenza", "Cholera", "Ebola", "Zika", "Rabies"],
  "Phobias": ["Arachnophobia", "Claustrophobia", "Acrophobia", "Agoraphobia", "Cynophobia", "Astraphobia", "Trypanophobia", "Social Phobia", "Ophidiophobia", "Mysophobia", "Aerophobia", "Emetophobia", "Carcinophobia", "Thanatophobia", "Glossophobia", "Monophobia"],
  "Hobbies": ["Reading", "Writing", "Painting", "Drawing", "Photography", "Cooking", "Baking", "Gardening", "Knitting", "Sewing", "Woodworking", "Fishing", "Hiking", "Camping", "Gaming", "Collecting"],
  "College Majors": ["Computer Science", "Engineering", "Business", "Biology", "Psychology", "Nursing", "English", "History", "Political Science", "Economics", "Communications", "Art", "Education", "Mathematics", "Physics", "Chemistry"],
  "Professions": ["Doctor", "Nurse", "Teacher", "Engineer", "Lawyer", "Accountant", "Police Officer", "Firefighter", "Chef", "Pilot", "Plumber", "Electrician", "Carpenter", "Mechanic", "Artist", "Writer"],
  "Office Supplies": ["Pen", "Pencil", "Paper", "Notebook", "Stapler", "Paperclip", "Tape", "Scissors", "Folder", "Binder", "Highlighter", "Marker", "Whiteboard", "Desk", "Chair", "Computer"],
  "Kitchen Utensils": ["Knife", "Fork", "Spoon", "Spatula", "Whisk", "Tongs", "Ladle", "Peeler", "Grater", "Can Opener", "Measuring Cup", "Cutting Board", "Rolling Pin", "Colander", "Oven Mitt", "Pot"],
  "Weather Phenomena": ["Rain", "Snow", "Hail", "Sleet", "Fog", "Thunder", "Lightning", "Tornado", "Hurricane", "Blizzard", "Drought", "Heatwave", "Monsoon", "Rainbow", "Aurora", "Typhoon"],
  "Natural Disasters": ["Earthquake", "Tsunami", "Volcano", "Avalanche", "Landslide", "Wildfire", "Flood", "Meteor Strike", "Sinkhole", "Limnic Eruption", "Solar Flare", "Blizzard", "Hurricane", "Tornado", "Drought", "Famine"],
  "Biomes": ["Desert", "Tundra", "Rainforest", "Savanna", "Taiga", "Grassland", "Coral Reef", "Ocean", "Wetland", "Estuary", "Chaparral", "Alpine", "Deciduous Forest", "Mangrove", "Kelp Forest", "Ice Sheet"]
};

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chameleons');
  
  // Remove Animals category
  await Category.deleteOne({ name: 'Animals' });
  
  // Insert all
  for (const [name, wordsArr] of Object.entries(categories)) {
    // Upsert to not duplicate if already exists
    const words = wordsArr.map(text => ({ text, isActive: true }));
    await Category.findOneAndUpdate(
      { name },
      { name, description: `The ${name} category.`, words, isActive: true, isDefault: true },
      { upsert: true }
    );
  }
  
  console.log(`Seeded ${Object.keys(categories).length} categories! Removed 'Animals'`);
  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
