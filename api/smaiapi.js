const http = require('http');
const url = require('url');

const generateDiscordServer = (prompt) => {
  const keywords = extractKeywords(prompt);
  const theme = detectTheme(keywords, prompt);
  const serverSize = detectServerSize(keywords, prompt);
  const sentiment = analyzeSentiment(prompt);
  const formality = detectFormality(prompt);

  const serverConfig = {
    name: generateServerName(keywords, theme, sentiment),
    description: generateDescription(keywords, theme, sentiment, formality),
    channels: generateChannels(keywords, theme, serverSize, sentiment),
    categories: generateCategories(keywords, theme, serverSize),
    roles: generateRoles(keywords, theme, serverSize, formality),
    color: generateColor(keywords, theme, sentiment),
    emojis: generateEmojis(keywords, theme),
    rules: generateRules(theme, serverSize, formality),
    welcomeMessage: generateWelcomeMessage(theme, sentiment, formality),
    botSuggestions: suggestBots(theme, serverSize),
    growthStrategies: generateGrowthStrategies(theme, serverSize, sentiment),
    customizationOptions: generateCustomizationOptions(serverSize),
    visualElements: generateVisualElements(theme, sentiment),
    moderationTools: suggestModerationTools(serverSize, formality),
    externalIntegrations: suggestExternalIntegrations(theme, keywords),
    verificationLevel: generateVerificationLevel(serverSize, formality),
    communityFeatures: generateCommunityFeatures(theme, serverSize, sentiment),
    partnershipOpportunities: generatePartnershipOpportunities(theme, keywords),
    contentCreationIdeas: generateContentCreationIdeas(theme, keywords, sentiment)
  };

  return serverConfig;
};

const extractKeywords = (prompt) => {
  const words = prompt.toLowerCase().match(/[\w]+/g) || [];
  const commonWords = new Set(['a', 'an', 'the', 'me', 'make', 'create', 'discord', 'server', 'with', 'for', 'about', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'of', 'that', 'this', 'it', 'as', 'by', 'from', 'be', 'was', 'were', 'will', 'would', 'could', 'should', 'can', 'may', 'might', 'must', 'shall']);
  return words.filter(word => !commonWords.has(word));
};

const detectTheme = (keywords, prompt) => {
  const themeKeywords = {
    gaming: ['game', 'gaming', 'esports', 'rpg', 'mmorpg', 'fps', 'minecraft', 'fortnite', 'league', 'overwatch', 'steam', 'playstation', 'xbox', 'nintendo'],
    art: ['art', 'drawing', 'painting', 'illustration', 'design', 'creative', 'sketch', 'digital', 'traditional', 'photography', 'sculpture', 'crafts'],
    music: ['music', 'band', 'concert', 'instrument', 'song', 'playlist', 'genre', 'album', 'artist', 'producer', 'dj', 'remix', 'soundtrack'],
    education: ['study', 'learning', 'school', 'college', 'university', 'course', 'teach', 'student', 'professor', 'academic', 'research', 'thesis', 'lecture'],
    technology: ['tech', 'coding', 'programming', 'developer', 'software', 'hardware', 'ai', 'machine learning', 'data science', 'cybersecurity', 'blockchain', 'iot'],
    community: ['community', 'social', 'friends', 'chat', 'hangout', 'meetup', 'network', 'support', 'help', 'advice', 'discussion'],
    fitness: ['fitness', 'workout', 'gym', 'exercise', 'health', 'nutrition', 'diet', 'bodybuilding', 'yoga', 'running', 'sports'],
    business: ['business', 'entrepreneur', 'startup', 'finance', 'marketing', 'management', 'investing', 'ecommerce', 'networking', 'career'],
    entertainment: ['movies', 'tv', 'shows', 'anime', 'manga', 'comics', 'books', 'literature', 'writing', 'storytelling', 'fanfiction'],
    food: ['cooking', 'baking', 'recipe', 'cuisine', 'foodie', 'restaurant', 'chef', 'culinary', 'gourmet', 'vegan', 'vegetarian', 'keto'],
    travel: ['travel', 'adventure', 'explore', 'vacation', 'tourism', 'backpacking', 'culture', 'international', 'destination', 'hostel', 'sightseeing'],
    science: ['science', 'physics', 'chemistry', 'biology', 'astronomy', 'geology', 'environment', 'climate', 'research', 'experiment', 'theory'],
  };

  let maxCount = 0;
  let detectedTheme = 'general';

  for (const [theme, themeWords] of Object.entries(themeKeywords)) {
    const count = keywords.filter(word => themeWords.includes(word)).length;
    if (count > maxCount) {
      maxCount = count;
      detectedTheme = theme;
    }
  }

  // Check for explicit theme mentions
  for (const [theme, themeWords] of Object.entries(themeKeywords)) {
    if (prompt.toLowerCase().includes(`${theme} server`)) {
      return theme;
    }
  }

  return detectedTheme;
};

const detectServerSize = (keywords, prompt) => {
  if (keywords.some(word => ['big', 'large', 'huge', 'massive', 'expansive'].includes(word)) || prompt.toLowerCase().includes('large server')) {
    return 'large';
  } else if (keywords.some(word => ['small', 'tiny', 'intimate', 'cozy', 'niche'].includes(word)) || prompt.toLowerCase().includes('small server')) {
    return 'small';
  }
  return 'medium';
};

const analyzeSentiment = (prompt) => {
  const positiveWords = ['happy', 'fun', 'exciting', 'friendly', 'positive', 'welcoming', 'enthusiastic', 'joyful', 'lively', 'upbeat'];
  const negativeWords = ['serious', 'strict', 'professional', 'formal', 'focused', 'intense', 'competitive', 'challenging'];

  const words = prompt.toLowerCase().split(/\s+/);
  const positiveCount = words.filter(word => positiveWords.includes(word)).length;
  const negativeCount = words.filter(word => negativeWords.includes(word)).length;

  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
};

const detectFormality = (prompt) => {
  const formalWords = ['professional', 'formal', 'serious', 'business', 'corporate', 'academic'];
  const informalWords = ['casual', 'relaxed', 'chill', 'laid-back', 'fun', 'friendly'];

  const words = prompt.toLowerCase().split(/\s+/);
  const formalCount = words.filter(word => formalWords.includes(word)).length;
  const informalCount = words.filter(word => informalWords.includes(word)).length;

  if (formalCount > informalCount) return 'formal';
  if (informalCount > formalCount) return 'informal';
  return 'neutral';
};

const generateServerName = (keywords, theme, sentiment) => {
  const themeNames = {
    gaming: ['Pixel', 'Joystick', 'Respawn', 'Loot', 'Quest'],
    art: ['Canvas', 'Palette', 'Muse', 'Sketch', 'Gallery'],
    music: ['Rhythm', 'Harmony', 'Melody', 'Beat', 'Chord'],
    education: ['Scholar', 'Mentor', 'Insight', 'Wisdom', 'Intellect'],
    technology: ['Tech', 'Code', 'Byte', 'Circuit', 'Data'],
    community: ['Nexus', 'Hub', 'Commons', 'Agora', 'Forum'],
    fitness: ['Flex', 'Endurance', 'Vigor', 'Strength', 'Wellness'],
    business: ['Venture', 'Capital', 'Market', 'Trade', 'Enterprise'],
    entertainment: ['Scene', 'Stage', 'Spotlight', 'Marquee', 'Premiere'],
    food: ['Flavor', 'Aroma', 'Feast', 'Culinary', 'Gourmet'],
    travel: ['Wanderlust', 'Odyssey', 'Nomad', 'Voyage', 'Expedition'],
    science: ['Lab', 'Theory', 'Quantum', 'Cosmos', 'Element'],
  };

  const sentimentAdjectives = {
    positive: ['Vibrant', 'Radiant', 'Stellar', 'Prime', 'Epic'],
    negative: ['Intense', 'Resolute', 'Driven', 'Focused', 'Determined'],
    neutral: ['Central', 'Core', 'Main', 'Primary', 'Essential']
  };

  const names = themeNames[theme] || ['Community', 'Circle', 'Network', 'Alliance', 'Collective'];
  const adjectives = sentimentAdjectives[sentiment];

  const name = `${adjectives[Math.floor(Math.random() * adjectives.length)]} ${names[Math.floor(Math.random() * names.length)]}`;
  const keyword = keywords[Math.floor(Math.random() * keywords.length)];
  
  return `${capitalize(keyword)} ${name}`;
};

const generateDescription = (keywords, theme, sentiment, formality) => {
  const themeDescriptions = {
    gaming: 'A realm for gamers to unite, compete, and level up together.',
    art: 'A canvas for creatives to inspire, share, and grow their artistic vision.',
    music: 'A symphony of musical minds collaborating and celebrating sound.',
    education: 'An academy of knowledge seekers and mentors expanding horizons.',
    technology: 'A nexus of innovation where tech enthusiasts push boundaries.',
    community: 'A vibrant hub for like-minded individuals to connect and thrive.',
    fitness: 'A powerhouse of motivation for health and fitness enthusiasts.',
    business: 'An incubator for entrepreneurs and professionals to network and grow.',
    entertainment: 'A stage for fans and creators to celebrate and discuss pop culture.',
    food: 'A feast of flavors for culinary adventurers and food lovers.',
    travel: 'An atlas of wanderlust for globetrotters and adventure seekers.',
    science: 'A laboratory of ideas for curious minds to explore and discover.',
  };

  const sentimentPhrases = {
    positive: 'Join us for an exciting journey',
    negative: 'Engage in focused discussions',
    neutral: 'Explore and connect with others'
  };

  const formalityAdjectives = {
    formal: 'professional',
    informal: 'friendly',
    neutral: 'welcoming'
  };

  const baseDescription = themeDescriptions[theme] || 'A dynamic space for passionate individuals to gather and share ideas.';
  const sentimentPhrase = sentimentPhrases[sentiment];
  const formalityAdjective = formalityAdjectives[formality];

  return `${baseDescription} ${sentimentPhrase} in our ${formalityAdjective} community centered around ${keywords.slice(0, 3).join(', ')} and more!`;
};

const generateChannels = (keywords, theme, serverSize, sentiment) => {
  const baseChannels = ['welcome', 'rules', 'announcements', 'general-chat', 'introductions', 'off-topic'];
const themeChannels = {
  gaming: [
    'game-discussion', 'lfg', 'strategy', 'patch-notes', 'memes', 'tournaments', 'game-reviews', 'indie-games', 
    'streamers-and-content', 'game-news', 'speedrunning', 'modding-community', 'esports-talk', 'retro-gaming',
    'horror-games', 'sandbox-games', 'rpg-talk', 'fps-discussion', 'mobile-games', 'console-talk', 'vr-gaming', 
    'game-lore', 'game-deals', 'game-glitches', 'game-suggestions', 'game-art'
  ],
  art: [
    'artwork-showcase', 'critique-corner', 'tutorials', 'inspiration', 'commissions', 'sketching', 'digital-painting', 
    'traditional-art', 'sculpture', '3d-modeling', 'character-design', 'fan-art', 'concept-art', 'illustrations', 
    'art-challenges', 'color-theory', 'art-resources', 'portfolio-feedback', 'art-jobs', 'art-events', 'sketch-daily', 
    'speed-painting', 'art-history', 'comic-creation', 'motion-graphics', 'calligraphy'
  ],
  music: [
    'track-sharing', 'genre-talk', 'production-tips', 'gear-discussion', 'collaboration', 'songwriting', 'music-theory',
    'mixing-and-mastering', 'dj-tips', 'live-performance', 'music-news', 'album-reviews', 'music-debates', 'music-events',
    'genre-analysis', 'music-promotion', 'underground-artists', 'playlist-sharing', 'music-resources', 'audio-software',
    'vocal-techniques', 'instrument-lessons', 'musical-inspirations', 'band-promotions', 'music-video-sharing'
  ],
  education: [
    'study-groups', 'resource-sharing', 'q-and-a', 'debate-club', 'research-topics', 'exam-prep', 'homework-help', 
    'tutoring', 'online-courses', 'study-tips', 'language-learning', 'essay-writing', 'book-club', 'history-debates',
    'math-help', 'science-fair-projects', 'career-advice', 'educational-podcasts', 'documentary-discussion', 
    'lecture-notes', 'academic-news', 'college-applications', 'research-papers', 'educational-events', 'study-music'
  ],
  technology: [
    'tech-news', 'coding-help', 'project-showcase', 'troubleshooting', 'future-tech', 'hardware-reviews', 'cybersecurity',
    'ai-discussion', 'cloud-computing', 'gadgets-talk', 'robotics', 'programming-languages', 'open-source-projects', 
    'web-development', 'mobile-development', 'tech-support', 'devops-discussion', 'blockchain-and-crypto', 'game-dev',
    'software-recommendations', 'tech-tutorials', 'career-in-tech', 'tech-entrepreneurship', 'home-automation',
    'emerging-technologies'
  ],
  community: [
    'events', 'support', 'ideas-and-feedback', 'spotlight', 'celebrations', 'introductions', 'local-meetups', 
    'community-projects', 'volunteering', 'storytelling', 'shared-hobbies', 'collaboration-corner', 'community-rules',
    'member-of-the-week', 'creative-challenges', 'community-news', 'charity-events', 'group-chats', 'fan-art-contests',
    'feedback-requests', 'shoutouts', 'new-member-questions', 'community-mentorship', 'skill-sharing', 'help-requests'
  ],
  fitness: [
    'workout-logs', 'nutrition-advice', 'progress-pics', 'form-check', 'motivation', 'workout-routines', 'yoga-and-meditation',
    'home-workouts', 'running-club', 'calisthenics', 'weightlifting', 'bodybuilding-tips', 'cardio-challenges', 
    'dietary-discussions', 'meal-planning', 'fitness-resources', 'fitness-gear', 'crossfit-talk', 'supplements-discussion', 
    'mental-health-and-wellness', 'stretching-tips', 'personal-training', 'fitness-transformation-stories', 
    'injury-recovery', 'fitness-news'
  ],
  business: [
    'networking', 'startups', 'marketing-strategies', 'finance-talk', 'job-board', 'entrepreneurship', 'investment-tips', 
    'sales-tactics', 'small-business-advice', 'freelancing', 'branding-strategies', 'business-news', 'legal-advice',
    'venture-capital', 'business-podcasts', 'side-hustles', 'e-commerce', 'remote-working', 'business-books', 
    'stock-market', 'business-courses', 'product-development', 'customer-support', 'tax-advice', 'business-plans'
  ],
  entertainment: [
    'reviews', 'fan-theories', 'watch-parties', 'creative-writing', 'cosplay', 'tv-show-discussions', 'movie-talk', 
    'anime-club', 'comic-discussion', 'meme-sharing', 'celebrity-news', 'book-recommendations', 'fan-fiction', 
    'trivia-nights', 'podcast-discussions', 'classic-cinema', 'movie-soundtracks', 'character-analysis', 'cartoons-talk', 
    'musicals', 'film-festivals', 'board-games', 'stand-up-comedy', 'game-shows', 'entertainment-gossip'
  ],
  food: [
    'recipe-sharing', 'restaurant-reviews', 'cooking-tips', 'dietary-discussions', 'food-pics', 'baking-tips', 
    'vegetarian-and-vegan', 'keto-and-low-carb', 'snacks-and-desserts', 'ethnic-cuisines', 'meal-prep', 'kitchen-tools',
    'food-challenges', 'culinary-news', 'foodie-photography', 'wine-and-beer-talk', 'street-food', 'food-pairings', 
    'seasonal-cooking', 'cheese-talk', 'bbq-tips', 'coffee-lovers', 'fermentation-and-pickling', 'recipe-requests', 
    'home-cooking-questions'
  ],
  travel: [
    'trip-planning', 'destination-spotlight', 'travel-tips', 'photo-gallery', 'cultural-exchange', 'budget-travel', 
    'backpacking', 'luxury-travel', 'road-trips', 'solo-travel', 'travel-hacks', 'travel-insurance', 'group-travel', 
    'airlines-and-flights', 'adventure-travel', 'language-barriers', 'travel-bloggers', 'long-term-travel', 
    'digital-nomad-tips', 'historical-sites', 'beach-destinations', 'mountain-trekking', 'eco-tourism', 'local-food',
    'travel-companions'
  ],
  science: [
    'latest-discoveries', 'experiment-ideas', 'journal-club', 'ask-a-scientist', 'citizen-science', 'space-talk', 
    'biology-discussion', 'chemistry-lab', 'physics-theories', 'earth-sciences', 'technology-in-science', 'medical-research',
    'science-fiction', 'climate-change', 'robotics-and-ai', 'psychology-talk', 'anthropology', 'evolutionary-biology',
    'quantum-physics', 'data-science', 'marine-biology', 'archaeology', 'science-podcasts', 'nobel-prize-discussion', 
    'science-books'
  ]
};

const sentimentChannels = {
  positive: [
    'achievements', 'gratitude', 'fun-and-games', 'success-stories', 'positivity-challenges', 'random-acts-of-kindness',
    'happy-moments', 'daily-affirmations', 'self-care-tips', 'kindness-initiatives', 'positive-news', 'encouragement',
    'celebrations', 'uplifting-quotes', 'good-deeds', 'thank-you-notes', 'random-smiles', 'motivational-messages',
    'positivity-hub', 'best-of-the-day', 'favorite-memories', 'support-circle', 'cheer-up-messages', 'accomplishment-goals',
    'community-gratitude'
  ],
  negative: [
    'serious-discussion', 'challenges', 'improvement', 'venting-zone', 'tough-times', 'mental-health-awareness',
    'relationship-struggles', 'career-frustrations', 'self-improvement-tips', 'overcoming-obstacles', 'financial-struggles',
    'anxiety-support', 'depression-awareness', 'personal-growth', 'loss-and-grief', 'anger-management', 'stress-relief',
    'difficult-decisions', 'fear-talk', 'loneliness-support', 'therapy-advice', 'hard-lessons', 'recovery-zone', 
    'problem-solving', 'emotional-support'
  ],
  neutral: [
    'resources', 'faq', 'general-discussion', 'open-topics', 'suggestions', 'tips-and-tricks', 'how-to-guides', 'frequently-asked-questions', 'advice-column', 'help-desk', 
    'announcements', 'community-guidelines', 'shared-resources', 'best-practices', 'knowledge-sharing',
    'reference-materials', 'public-discussions', 'daily-polls', 'community-news', 'member-introductions', 
    'off-topic-chat', 'neutral-ground', 'fact-checking', 'wiki', 'shared-insights', 'updates', 'general-info',
    'open-mic', 'discussion-forum'
  ]
};
  let channels = [...baseChannels, ...(themeChannels[theme] || []), ...sentimentChannels[sentiment]];
  channels = channels.concat(keywords.map(keyword => `${keyword}-talk`));

  const uniqueChannels = [...new Set(channels)];
  const channelCount = serverSize === 'small' ? 10 : serverSize === 'large' ? 30 : 20;
  return shuffleArray(uniqueChannels).slice(0, channelCount);
};

const generateCategories = (keywords, theme, serverSize) => {
  const baseCategories = ['INFORMATION', 'GENERAL', 'COMMUNITY'];

const themeCategories = {
  gaming: [
    'GAMES', 'ESPORTS', 'STRATEGIES', 'STREAMING', 'MODDING', 'GAME NEWS', 'GAME REVIEWS', 
    'COMMUNITY EVENTS', 'DEVELOPMENT', 'ROLE-PLAYING'
  ],
  art: [
    'GALLERIES', 'WORKSHOPS', 'RESOURCES', 'CRITIQUES', 'COLLABORATIONS', 'INSPIRATION', 
    'TECHNIQUES', 'CHALLENGES', 'COMMISSIONS', 'EXHIBITIONS'
  ],
  music: [
    'GENRES', 'PRODUCTION', 'PERFORMANCES', 'SONGWRITING', 'MUSIC NEWS', 'COLLABORATIONS', 
    'GIGS', 'INSTRUMENTS', 'MIXING AND MASTERING', 'MUSIC THEORY'
  ],
  education: [
    'SUBJECTS', 'STUDY GROUPS', 'RESOURCES', 'EXAM PREP', 'ONLINE COURSES', 'HOMEWORK HELP', 
    'LANGUAGE LEARNING', 'TUTORING', 'EDUCATIONAL GAMES', 'ACADEMIC DISCUSSIONS'
  ],
  technology: [
    'TECH TOPICS', 'DEVELOPMENT', 'INNOVATIONS', 'GADGETS', 'PROGRAMMING', 'AI DISCUSSIONS', 
    'STARTUPS', 'REVIEWS', 'SECURITY', 'FUTURE TECH'
  ],
  community: [
    'EVENTS', 'SUPPORT', 'ACTIVITIES', 'MEMBER INTRODUCTIONS', 'SUGGESTIONS', 'FEEDBACK', 
    'SHOUTOUTS', 'LOCAL MEETUPS', 'COLLABORATIVE PROJECTS', 'CHARITY EVENTS'
  ],
  fitness: [
    'WORKOUTS', 'NUTRITION', 'CHALLENGES', 'MOTIVATION', 'DIET PLANS', 'PROGRESS TRACKING', 
    'SUPPLEMENTS', 'FITNESS RESOURCES', 'YOGA AND MEDITATION', 'COMMUNITY WORKOUTS'
  ],
  business: [
    'NETWORKING', 'STRATEGIES', 'INDUSTRIES', 'STARTUPS', 'MARKETING', 'FINANCE', 
    'CAREER ADVICE', 'FREELANCING', 'BUSINESS NEWS', 'PRODUCTIVITY'
  ],
  entertainment: [
    'REVIEWS', 'DISCUSSIONS', 'CREATIVE', 'TV SHOWS', 'MOVIES', 'ANIME', 
    'COMICS', 'FAN THEORIES', 'CULTURE', 'CELEBRITY NEWS'
  ],
  food: [
    'CUISINES', 'COOKING', 'REVIEWS', 'RECIPES', 'NUTRITION', 'MEAL PREP', 
    'FOOD PHOTOGRAPHY', 'KITCHEN TIPS', 'FOOD EVENTS', 'DIET DISCUSSIONS'
  ],
  travel: [
    'DESTINATIONS', 'TIPS', 'EXPERIENCES', 'ITINERARIES', 'BUDGET TRAVEL', 'TRAVEL GEAR', 
    'CULTURE', 'LOCAL CUISINE', 'TRAVEL PHOTOGRAPHY', 'SUSTAINABLE TRAVEL'
  ],
  science: [
    'DISCIPLINES', 'RESEARCH', 'DISCOVERIES', 'EXPERIMENTS', 'TECHNOLOGY IN SCIENCE', 
    'SPACE', 'BIOLOGY', 'PHYSICS', 'CHEMISTRY', 'ENVIRONMENTAL SCIENCE'
  ]
};
  let categories = [...baseCategories, ...(themeCategories[theme] || [])];
  categories = categories.concat(keywords.map(keyword => keyword.toUpperCase()));

  const uniqueCategories = [...new Set(categories)];
  const categoryCount = serverSize === 'small' ? 5 : serverSize === 'large' ? 10 : 7;
  return shuffleArray(uniqueCategories).slice(0, categoryCount);
};

const generateRoles = (keywords, theme, serverSize, formality) => {
  const baseRoles = ['Admin', 'Moderator', 'Member'];

const themeRoles = {
  gaming: [
    'Pro Gamer', 'Speedrunner', 'Strategist', 'Completionist', 'Casual Gamer', 'Game Developer', 
    'Streamer', 'Esports Coach', 'Content Creator', 'Lore Master', 'Game Tester', 'Achievement Hunter', 
    'Community Manager', 'Game Artist', 'Narrative Designer', 'Mod Creator', 'Voice Actor', 
    'Tournament Organizer', 'Game Journalist', 'Console Collector', 'Retro Gamer', 'Fan Theorist', 
    'Competitive Player', 'Fan Artist', 'Speedrun Timer'
  ],
  art: [
    'Master Artist', 'Curator', 'Art Critic', 'Innovative Creator', 'Graphic Designer', 'Illustrator', 
    'Photographer', 'Art Historian', 'Digital Artist', 'Sculptor', 'Mixed Media Artist', 'Street Artist', 
    'Tattoo Artist', 'Art Teacher', 'Fashion Designer', 'Character Designer', 'Concept Artist', 
    'Color Theory Expert', 'Art Event Organizer', 'Culinary Artist', 'Craftsperson', 'Textile Artist', 
    'Printmaker', 'Art Enthusiast', 'Art Collector'
  ],
  music: [
    'Virtuoso', 'Composer', 'Sound Engineer', 'Music Theorist', 'Producer', 'DJ', 
    'Lyricist', 'Arranger', 'Music Reviewer', 'Vocal Coach', 'Instrumentalist', 'Band Member', 
    'Music Blogger', 'Music Festival Organizer', 'Choral Director', 'Acoustic Artist', 
    'Music Historian', 'Music Enthusiast', 'Singing Instructor', 'Orchestrator', 'Music Editor', 
    'Music Entrepreneur', 'Audio Technician', 'Melody Maker', 'Beat Maker'
  ],
  education: [
    'Scholar', 'Tutor', 'Researcher', 'Academic', 'Educator', 'Learning Facilitator', 
    'Instructional Designer', 'Course Developer', 'E-learning Specialist', 'Librarian', 
    'Study Coach', 'Mentor', 'Subject Matter Expert', 'Exam Coordinator', 'Curriculum Developer', 
    'Assessment Designer', 'Language Instructor', 'Career Counselor', 'Child Development Specialist', 
    'PhD Candidate', 'Alumni', 'Guest Lecturer', 'Academic Advisor', 'Education Policy Advocate', 
    'Online Instructor'
  ],
  technology: [
    'Tech Guru', 'Code Wizard', 'Innovator', 'Data Scientist', 'System Architect', 
    'Software Engineer', 'Web Developer', 'AI Specialist', 'Cybersecurity Expert', 
    'Network Administrator', 'Database Manager', 'Tech Reviewer', 'App Developer', 
    'IT Support Specialist', 'Blockchain Developer', 'Hardware Technician', 'Game Developer', 
    'Robotics Engineer', 'Tech Entrepreneur', 'Gadget Tester', 'Cloud Architect', 
    'UX/UI Designer', 'DevOps Engineer', 'Automation Specialist', 'Technical Writer'
  ],
  community: [
    'Community Leader', 'Event Organizer', 'Mentor', 'Contributor', 'Volunteer', 
    'Social Coordinator', 'Project Manager', 'Advocate', 'Civic Leader', 
    'Community Builder', 'Peer Supporter', 'Networker', 'Engagement Specialist', 
    'Outreach Coordinator', 'Diversity Advocate', 'Fundraiser', 'Community Designer', 
    'Public Relations Specialist', 'Event Facilitator', 'Member Liaison', 
    'Youth Leader', 'Resource Manager', 'Community Researcher', 'Feedback Facilitator', 
    'Strategic Planner'
  ],
  fitness: [
    'Fitness Coach', 'Nutritionist', 'Workout Warrior', 'Wellness Expert', 'Personal Trainer', 
    'Yoga Instructor', 'Pilates Coach', 'Sports Nutritionist', 'Health Coach', 
    'Fitness Blogger', 'Strength Coach', 'Aerobics Instructor', 'Group Fitness Leader', 
    'Zumba Instructor', 'Martial Arts Instructor', 'Kinesiologist', 'Wellness Advocate', 
    'Exercise Physiologist', 'Rehabilitation Specialist', 'Fitness Enthusiast', 
    'Health Educator', 'Dance Instructor', 'Lifestyle Coach', 'CrossFit Trainer', 
    'Outdoor Guide'
  ],
  business: [
    'Entrepreneur', 'Investor', 'Consultant', 'Industry Expert', 'Business Analyst', 
    'Marketing Specialist', 'Sales Executive', 'Customer Service Manager', 
    'Financial Advisor', 'Corporate Trainer', 'Business Strategist', 'HR Manager', 
    'Operations Manager', 'Supply Chain Specialist', 'Brand Manager', 
    'Product Manager', 'Public Relations Officer', 'Project Coordinator', 
    'Executive Assistant', 'Market Researcher', 'Franchise Owner', 
    'Business Development Manager', 'Social Media Manager', 'E-commerce Specialist', 
    'Risk Manager'
  ],
  entertainment: [
    'Critic', 'Content Creator', 'Superfan', 'Trendsetter', 'Film Buff', 
    'TV Enthusiast', 'Theater Director', 'Event Planner', 'Pop Culture Expert', 
    'Cosplay Designer', 'Media Producer', 'Scriptwriter', 'Podcast Host', 
    'Visual Effects Artist', 'Fan Club Leader', 'Entertainment Journalist', 
    'Influencer', 'Documentary Filmmaker', 'Cinematographer', 
    'Film Editor', 'Screenwriter', 'Music Video Director', 'Video Editor', 
    'Cultural Commentator'
  ],
  food: [
    'Chef', 'Food Critic', 'Recipe Developer', 'Culinary Explorer', 'Baker', 
    'Food Photographer', 'Nutrition Coach', 'Restaurant Reviewer', 
    'Catering Specialist', 'Food Stylist', 'Gastronomy Enthusiast', 
    'Home Cook', 'Brewmaster', 'Winemaker', 'Food Historian', 
    'Sustainable Food Advocate', 'Food Blogger', 'Fermentation Specialist', 
    'Culinary Instructor', 'Dietitian', 'Street Food Expert', 
    'Vegan Chef', 'Gourmet Cook', 'Culinary Event Coordinator', 
    'Ethnic Cuisine Specialist'
  ],
  travel: [
    'Globetrotter', 'Travel Guide', 'Culture Enthusiast', 'Adventure Seeker', 
    'Travel Blogger', 'Travel Photographer', 'Itinerary Planner', 
    'Backpacker', 'Luxury Traveler', 'Budget Traveler', 'Travel Influencer', 
    'Travel Writer', 'Sustainable Traveler', 'Road Tripper', 
    'Food Traveler', 'Cultural Ambassador', 'Historical Traveler', 
    'Travel Enthusiast', 'Travel Reviewer', 'Nature Explorer', 
    'Photography Enthusiast', 'Wildlife Explorer', 'Family Traveler', 
    'Group Travel Organizer', 'Tour Coordinator'
  ],
  science: [
    'Scientist', 'Theorist', 'Lab Technician', 'Science Communicator', 'Researcher', 
    'Field Researcher', 'Data Analyst', 'Environmental Scientist', 
    'Biochemist', 'Astronomer', 'Physicist', 'Chemist', 
    'Social Scientist', 'Medical Researcher', 'Geologist', 'Psychologist', 
    'Statistician', 'Science Teacher', 'Wildlife Biologist', 
    'Science Policy Advocate', 'Geneticist', 'Neuroscientist', 
    'Engineering Specialist', 'Science Writer', 'Science Enthusiast', 
    'Public Health Advocate'
  ]
};

  const formalityRoles = {
    formal: ['Senior Member', 'Distinguished Contributor', 'Expert'],
    informal: ['Super Fan', 'Rising Star', 'Community Favorite'],
    neutral: ['Active Participant', 'Dedicated Member', 'Contributor']
  };

  let roles = [...baseRoles, ...(themeRoles[theme] || []), ...formalityRoles[formality]];
  roles = roles.concat(keywords.map(keyword => `${capitalize(keyword)} Enthusiast`));

  const uniqueRoles = [...new Set(roles)];
  const roleCount = serverSize === 'small' ? 7 : serverSize === 'large' ? 15 : 10;
  return shuffleArray(uniqueRoles).slice(0, roleCount);
};

const generateColor = (keywords, theme, sentiment) => {
  const themeColors = {
    gaming: ['#7289DA', '#43B581', '#FAA61A'],
    art: ['#FF7F50', '#8A2BE2', '#20B2AA'],
    music: ['#1DB954', '#FF6B6B', '#4A90E2'],
    education: ['#4285F4', '#34A853', '#FBBC05'],
    technology: ['#00ACED', '#3B5998', '#DD4B39'],
    community: ['#FFA07A', '#98FB98', '#DDA0DD'],
    fitness: ['#FF4136', '#2ECC40', '#0074D9'],
    business: ['#001f3f', '#39CCCC', '#FF851B'],
    entertainment: ['#F012BE', '#FFDC00', '#B10DC9'],
    food: ['#FF4136', '#2ECC40', '#FF851B'],
    travel: ['#0074D9', '#7FDBFF', '#3D9970'],
    science: ['#F012BE', '#01FF70', '#FFDC00']
  };

  const sentimentColors = {
    positive: ['#2ECC40', '#01FF70', '#7FDBFF'],
    negative: ['#FF4136', '#85144b', '#B10DC9'],
    neutral: ['#AAAAAA', '#DDDDDD', '#7FDBFF']
  };

  const colors = [...(themeColors[theme] || []), ...sentimentColors[sentiment]];
  return colors[Math.floor(Math.random() * colors.length)];
};

const generateEmojis = (keywords, theme) => {
  const baseEmojis = ['👍', '👎', '❤️', '🎉', '🤔', '😂', '🔥', '✨', '🌟', '💯'];
  const themeEmojis = {
    gaming: ['🎮', '🕹️', '🏆', '⚔️', '🛡️', '🧙', '🐉', '🚀'],
    art: ['🎨', '✏️', '🖌️', '🖼️', '📷', '🎭', '🗿', '📸'],
    music: ['🎵', '🎶', '🎸', '🥁', '🎤', '🎹', '🎷', '🎺'],
    education: ['📚', '🎓', '✏️', '🔬', '🧮', '🗺️', '🔭', '📝'],
    technology: ['💻', '🖥️', '📱', '⌨️', '🖱️', '🤖', '📡', '💾'],
    community: ['🤝', '🌈', '🌿', '☕', '🍕', '🎈', '🏠', '🌻'],
    fitness: ['💪', '🏋️', '🧘', '🏃', '🚴', '🥗', '🏅', '⚽'],
    business: ['💼', '📈', '💰', '🤝', '📊', '💡', '🏢', '📱'],
    entertainment: ['🎬', '📺', '🎭', '🎤', '🎨', '📚', '🎮', '🎵'],
    food: ['🍽️', '🍳', '🥘', '🍰', '🍷', '🍴', '🥑', '🍕'],
    travel: ['✈️', '🗺️', '🏖️', '🗽', '🏰', '🚆', '🏞️', '🥾'],
    science: ['🧪', '🔬', '🧬', '🔭', '🧠', '🌍', '🚀', '⚛️']
  };

  let emojis = [...baseEmojis, ...(themeEmojis[theme] || [])];
  emojis = emojis.concat(keywords.map(keyword => `:${keyword}:`));

  const uniqueEmojis = [...new Set(emojis)];
  return shuffleArray(uniqueEmojis).slice(0, 15);
};

const generateRules = (theme, serverSize, formality) => {
  const baseRules = [
    'Be respectful to all members',
    'No hate speech, discrimination, or harassment',
    'No spam or excessive self-promotion',
    'Keep content relevant to the channel topics',
    'Follow Discord\'s Terms of Service and Community Guidelines'
  ];

  const themeRules = {
    gaming: ['No cheating or hacking discussions', 'Use spoiler tags for game spoilers'],
    art: ['Credit original artists when sharing work', 'Constructive criticism only, no bashing'],
    music: ['No illegal file sharing', 'Respect copyright laws for covers and remixes'],
    education: ['No plagiarism', 'Respect diverse learning styles and opinions'],
    technology: ['No piracy or cracking discussions', 'Use code blocks for sharing code snippets'],
    community: ['Respect others\' privacy', 'Be supportive and encouraging'],
    fitness: ['No promotion of unsafe or extreme practices', 'Respect personal fitness journeys'],
    business: ['No unsolicited advertising', 'Maintain professionalism in discussions'],
    entertainment: ['Use spoiler tags for recent releases', 'Respect others\' opinions on media'],
    food: ['No shaming of dietary choices', 'Include allergen warnings when sharing recipes'],
    travel: ['Respect local cultures and customs', 'No illegal border crossing advice'],
    science: ['Cite sources for scientific claims', 'Maintain academic integrity']
  };

  const formalityRules = {
    formal: ['Maintain a professional tone in all interactions', 'Use appropriate titles and honorifics when addressing others'],
    informal: ['Keep the atmosphere friendly and relaxed', 'Humor is welcome, but always be mindful of others'],
    neutral: ['Strike a balance between casual and professional communication', 'Be mindful of the context when posting']
  };

  let rules = [...baseRules, ...(themeRules[theme] || []), ...formalityRules[formality]];
  const uniqueRules = [...new Set(rules)];
  const ruleCount = serverSize === 'small' ? 5 : serverSize === 'large' ? 10 : 7;
  return uniqueRules.slice(0, ruleCount);
};

const generateWelcomeMessage = (theme, sentiment, formality) => {
  const themeMessages = {
    gaming: 'Welcome to our gaming community! Ready to level up your experience?',
    art: 'Welcome, creative souls! We\'re excited to see your artistic journey unfold here.',
    music: 'Welcome to our melodious community! Let\'s make some noise together.',
    education: 'Welcome, learners and educators! Your journey of knowledge starts here.',
    technology: 'Welcome, tech enthusiasts! Get ready to innovate and problem-solve together.',
    community: 'Welcome to our friendly community! We\'re glad you\'re here to join the conversation.',
    fitness: 'Welcome to our fitness family! Ready to sweat, grow, and achieve together?',
    business: 'Welcome, professionals and entrepreneurs! Let\'s network and grow together.',
    entertainment: 'Welcome, entertainment lovers! Get ready for exciting discussions and fan moments.',
    food: 'Welcome, food enthusiasts! Prepare your taste buds for a culinary adventure.',
    travel: 'Welcome, fellow travelers! Your next adventure begins in this community.',
    science: 'Welcome, curious minds! Let\'s explore the wonders of science together.'
  };

  const sentimentMessages = {
    positive: 'We\'re thrilled to have you join us!',
    negative: 'We appreciate your commitment to our focused community.',
    neutral: 'We look forward to your contributions.'
  };

  const formalityMessages = {
    formal: 'Please take a moment to familiarize yourself with our guidelines and introduce yourself.',
    informal: 'Jump right in, make yourself at home, and don\'t be shy!',
    neutral: 'Feel free to introduce yourself and get to know the community.'
  };

  const themeMessage = themeMessages[theme] || 'Welcome to our server!';
  const sentimentMessage = sentimentMessages[sentiment];
  const formalityMessage = formalityMessages[formality];

  return `${themeMessage} ${sentimentMessage} ${formalityMessage}`;
};

const suggestBots = (theme, serverSize) => {
  const baseBots = ['Hyena Town', 'Dyno', 'Carl-bot'];
  const themeBots = {
    gaming: ['Statbot', 'Pokétwo', 'DiscordRPG'],
    art: ['Dank Memer', 'NQN (Not Quite Nitro)', 'Emoji.gg'],
    music: ['ProBot', 'Hyena Town', 'Maki'],
    education: ['StudyBot', 'Quizlet', 'Wikipedia'],
    technology: ['GitBot', 'StackOverflow', 'CodeStats'],
    community: ['Tatsumaki', 'IdleRPG', 'TicketTool'],
    fitness: ['FitBot', 'Calorie Counter', 'Workout Scheduler'],
    business: ['LinkedIn Bot', 'Stock Tracker', 'Networking Assistant'],
    entertainment: ['Movie Database', 'Spoiler Alert', 'Giphy'],
    food: ['Recipe Bot', 'Calorie Counter', 'Restaurant Finder'],
    travel: ['Currency Converter', 'Language Translator', 'Time Zone Bot'],
    science: ['NASA Bot', 'Wolfram Alpha', 'Research Paper Finder']
  };

  let bots = [...baseBots, ...(themeBots[theme] || [])];
  const uniqueBots = [...new Set(bots)];
  const botCount = serverSize === 'small' ? 3 : serverSize === 'large' ? 7 : 5;
  return shuffleArray(uniqueBots).slice(0, botCount);
};

const generateGrowthStrategies = (theme, serverSize, sentiment) => {
  const baseStrategies = [
    'Engage with members regularly',
    'Host events and competitions',
    'Collaborate with other servers',
    'Create high-quality content',
    'Encourage member-generated content'
  ];

  const themeStrategies = {
    gaming: ['Host game tournaments', 'Create guides for popular games', 'Stream gameplay sessions'],
    art: ['Feature artist of the week', 'Host art challenges with prizes', 'Organize virtual gallery events'],
    music: ['Organize listening parties', 'Host live performances', 'Create collaborative playlists'],
    education: ['Offer study groups', 'Host Q&A sessions with experts', 'Create study resources'],
    technology: ['Host hackathons', 'Organize coding challenges', 'Create a job board for tech positions'],
    community: ['Organize meetups', 'Create a mentorship program', 'Host community spotlight series'],
    fitness: ['Create workout challenges', 'Host nutrition workshops', 'Organize virtual fitness classes'],
    business: ['Host networking events', 'Create a mentorship program', 'Organize industry-specific webinars'],
    entertainment: ['Host watch parties', 'Organize fan art contests', 'Create trivia nights'],
    food: ['Host virtual cooking classes', 'Organize recipe contests', 'Create a community cookbook'],
    travel: ['Host virtual tours', 'Create travel tip series', 'Organize photo contests'],
    science: ['Host science fairs', 'Organize journal clubs', 'Create citizen science projects']
  };

  const sentimentStrategies = {
    positive: ['Implement a recognition system for active members', 'Create a "Good News" channel'],
    negative: ['Host structured debates on challenging topics', 'Implement a rigorous member vetting process'],
    neutral: ['Conduct regular surveys for member feedback', 'Create a suggestion box for server improvements']
  };

  let strategies = [...baseStrategies, ...(themeStrategies[theme] || []), ...sentimentStrategies[sentiment]];
  const uniqueStrategies = [...new Set(strategies)];
  const strategyCount = serverSize === 'small' ? 3 : serverSize === 'large' ? 7 : 5;
  return shuffleArray(uniqueStrategies).slice(0, strategyCount);
};

const generateCustomizationOptions = (serverSize) => {
  const baseOptions = {
    customRoles: true,
    customEmojis: true,
    customStickers: serverSize !== 'small',
    serverBoosts: serverSize === 'small' ? 1 : serverSize === 'large' ? 3 : 2,
    customInviteBackground: serverSize !== 'small',
    customServerIcon: true,
    customServerBanner: serverSize === 'large',
  };

  const additionalOptions = {
    vanityURL: serverSize === 'large',
    welcomeScreen: serverSize !== 'small',
    serverInsights: serverSize === 'large',
    communityFeatures: serverSize !== 'small',
  };

  return { ...baseOptions, ...additionalOptions };
};

const generateVisualElements = (theme, sentiment) => {
  const themeColors = {
    gaming: ['#7289DA', '#43B581', '#FAA61A'],
    art: ['#FF7F50', '#8A2BE2', '#20B2AA'],
    music: ['#1DB954', '#FF6B6B', '#4A90E2'],
    education: ['#4285F4', '#34A853', '#FBBC05'],
    technology: ['#00ACED', '#3B5998', '#DD4B39'],
    community: ['#FFA07A', '#98FB98', '#DDA0DD'],
    fitness: ['#FF4136', '#2ECC40', '#0074D9'],
    business: ['#001f3f', '#39CCCC', '#FF851B'],
    entertainment: ['#F012BE', '#FFDC00', '#B10DC9'],
    food: ['#FF4136', '#2ECC40', '#FF851B'],
    travel: ['#0074D9', '#7FDBFF', '#3D9970'],
    science: ['#F012BE', '#01FF70', '#FFDC00']
  };

  const themeIcons = {
    gaming: '🎮',
    art: '🎨',
    music: '🎵',
    education: '📚',
    technology: '💻',
    community: '🤝',
    fitness: '💪',
    business: '💼',
    entertainment: '🎬',
    food: '🍽️',
    travel: '✈️',
    science: '🔬'
  };

  const sentimentStyles = {
    positive: 'bright and cheerful',
    negative: 'sleek and professional',
    neutral: 'balanced and harmonious'
  };

  const colors = themeColors[theme] || ['#7289DA', '#43B581', '#FAA61A'];
  const icon = themeIcons[theme] || '📣';
  const style = sentimentStyles[sentiment];

  return {
    primaryColor: colors[0],
    secondaryColor: colors[1],
    accentColor: colors[2],
    serverIcon: icon,
    bannerIdeas: [
      `A ${style} ${theme}-themed banner with the server name in ${colors[0]} color`,
      `An abstract design using ${colors[1]} and ${colors[2]} to create a ${style} atmosphere`,
      `A minimalist banner featuring the ${icon} icon with a ${style} background gradient`
    ],
    logoIdeas: [
      `A ${style} logo incorporating the ${icon} icon and the primary color ${colors[0]}`,
      `A modern, ${style} wordmark using the server name and the accent color ${colors[2]}`,
      `A combination of the ${icon} icon and a relevant symbol from the ${theme} theme, creating a ${style} emblem`
    ]
  };
};

const suggestModerationTools = (serverSize, formality) => {
  const baseTools = ['Automated welcome messages', 'Basic auto-moderation (spam, excessive caps, etc.)'];
  const advancedTools = [
    'Customizable auto-moderation rules',
    'Raid protection',
    'Temporary mute and ban features',
    'Logging system for mod actions',
    'Ticket system for user reports',
    'Auto-role assignment',
    'Scheduled announcements',
    'Content filtering',
  ];

  const formalityTools = {
    formal: ['Professional language filter', 'Strict moderation queue'],
    informal: ['Meme approval system', 'Community-driven moderation'],
    neutral: ['Balanced keyword filtering', 'Tiered moderation system']
  };

  let tools = [...baseTools, ...formalityTools[formality]];

  if (serverSize === 'small') {
    tools = tools.concat(advancedTools.slice(0, 2));
  } else if (serverSize === 'large') {
    tools = tools.concat(advancedTools);
  } else {
    tools = tools.concat(advancedTools.slice(0, 4));
  }

  return [...new Set(tools)];
};

const suggestExternalIntegrations = (theme, keywords) => {
  const baseIntegrations = ['Twitter', 'YouTube', 'Twitch'];
  const themeIntegrations = {
    gaming: ['Steam', 'Xbox Live', 'PlayStation Network', 'Blizzard Battle.net'],
    art: ['DeviantArt', 'ArtStation', 'Behance', 'Instagram'],
    music: ['Spotify', 'SoundCloud', 'Bandcamp', 'Last.fm'],
    education: ['Coursera', 'edX', 'Khan Academy', 'Google Classroom'],
    technology: ['GitHub', 'Stack Overflow', 'GitLab', 'Bitbucket'],
    community: ['Facebook Groups', 'Meetup', 'Eventbrite', 'LinkedIn'],
    fitness: ['Strava', 'MyFitnessPal', 'Fitbit', 'Nike Run Club'],
    business: ['LinkedIn', 'AngelList', 'Crunchbase', 'Slack'],
    entertainment: ['IMDb', 'Rotten Tomatoes', 'Goodreads', 'Letterboxd'],
    food: ['Yelp', 'TripAdvisor', 'OpenTable', 'Zomato'],
    travel: ['TripAdvisor', 'Airbnb', 'Booking.com', 'Couchsurfing'],
    science: ['ResearchGate', 'arXiv', 'Mendeley', 'Academia.edu']
  };

  let integrations = [...baseIntegrations, ...(themeIntegrations[theme] || [])];
  integrations = integrations.concat(keywords.filter(keyword => keyword.length > 3).map(keyword => `${capitalize(keyword)} API`));

  return [...new Set(integrations)].slice(0, 8);
};

const generateVerificationLevel = (serverSize, formality) => {
  const levels = ['None', 'Low', 'Medium', 'High', '(╯°□°）╯︵ ┻━┻'];
  
  if (formality === 'formal' || serverSize === 'large') {
    return levels[3]; // High
  } else if (formality === 'informal' && serverSize === 'small') {
    return levels[1]; // Low
  } else {
    return levels[2]; // Medium
  }
};

const generateCommunityFeatures = (theme, serverSize, sentiment) => {
  const baseFeatures = ['Server Discovery', 'Welcome Screen'];
  const advancedFeatures = [
    'Community Updates Channel',
    'Membership Screening',
    'Server Insights',
    'Partner Program Eligibility',
    'Discovery Category Selection',
    'Animated Server Icon',
    'Vanity URL',
    'News Channels'
  ];

  const themeFeatures = {
    gaming: ['Game Night Events', 'Esports Team Management'],
    art: ['Artist Spotlight Program', 'Virtual Gallery System'],
    music: ['Live Performance Stage', 'Collaborative Playlist Curation'],
    education: ['Study Group Organizer', 'Resource Library'],
    technology: ['Code Review System', 'Project Showcase Platform'],
    community: ['Member of the Month Program', 'Community Polls'],
    fitness: ['Workout Challenge Tracker', 'Nutrition Log Integration'],
    business: ['Networking Event Scheduler', 'Mentorship Program'],
    entertainment: ['Fan Theory Database', 'Watch Party Organizer'],
    food: ['Recipe Exchange Program', 'Virtual Cooking Class Platform'],
    travel: ['Trip Planning Assistant', 'Travel Photo Contest'],
    science: ['Research Collaboration Tools', 'Experiment Design Workshop']
  };

  const sentimentFeatures = {
    positive: ['Achievements and Badges System', 'Positivity Board'],
    negative: ['Structured Debate Platform', 'Peer Review System'],
    neutral: ['Anonymous Feedback Channel', 'Balanced Discussion Forums']
  };

  let features = [...baseFeatures, ...(themeFeatures[theme] || []), ...sentimentFeatures[sentiment]];

  if (serverSize === 'small') {
    features = features.concat(advancedFeatures.slice(0, 2));
  } else if (serverSize === 'large') {
    features = features.concat(advancedFeatures);
  } else {
    features = features.concat(advancedFeatures.slice(0, 4));
  }

  return [...new Set(features)];
};

const generatePartnershipOpportunities = (theme, keywords) => {
  const baseOpportunities = ['Cross-promotion with similar servers', 'Collaborative events'];
  const themeOpportunities = {
    gaming: ['Game developer partnerships', 'Esports team sponsorships', 'Gaming peripheral brands'],
    art: ['Art supply company sponsorships', 'Online art course collaborations', 'Gallery exhibition partnerships'],
    music: ['Record label partnerships', 'Music festival collaborations', 'Instrument manufacturer sponsorships'],
    education: ['Educational institution partnerships', 'Online course platform collaborations', 'Textbook publisher sponsorships'],
    technology: ['Tech company sponsorships', 'Coding bootcamp partnerships', 'Software tool collaborations'],
    community: ['Local business partnerships', 'Nonprofit organization collaborations', 'Community event sponsorships'],
    fitness: ['Fitness app partnerships', 'Supplement brand sponsorships', 'Gym chain collaborations'],
    business: ['Startup incubator partnerships', 'Business software collaborations', 'Professional association sponsorships'],
    entertainment: ['Streaming service partnerships', 'Fan convention collaborations', 'Media review site sponsorships'],
    food: ['Restaurant chain partnerships', 'Cooking equipment sponsorships', 'Food delivery service collaborations'],
    travel: ['Tourism board partnerships', 'Travel gear sponsorships', 'Hotel chain collaborations'],
    science: ['Research institution partnerships', 'Scientific journal collaborations', 'Lab equipment sponsorships']
  };

  let opportunities = [...baseOpportunities, ...(themeOpportunities[theme] || [])];
  opportunities = opportunities.concat(keywords.map(keyword => `${capitalize(keyword)}-related brand partnerships`));

  return [...new Set(opportunities)].slice(0, 7);
};

const generateContentCreationIdeas = (theme, keywords, sentiment) => {
  const baseIdeas = ['Weekly community spotlight', 'Monthly server newsletter', 'User-generated content contests'];
  const themeIdeas = {
    gaming: ['Game review series', 'Esports match analysis', 'Gaming tip of the day'],
    art: ['Artist interview series', 'Time-lapse creation videos', 'Art style exploration posts'],
    music: ['Album listening parties', 'Music theory workshops', 'Instrument showcase series'],
    education: ['Study tip videos', 'Subject-specific crash courses', 'Academic paper discussions'],
    technology: ['Tech news roundup', 'Coding challenge series', 'New tool spotlight'],
    community: ['Member success stories', 'Community project showcases', 'Local event highlights'],
    fitness: ['Workout routine videos', 'Healthy recipe sharing', 'Fitness myth-busting series'],
    business: ['Entrepreneur spotlight', 'Market trend analysis', 'Startup pitch practice sessions'],
    entertainment: ['Fan theory discussions', 'Behind-the-scenes content', 'Character analysis series'],
    food: ['Recipe of the week', 'Cuisine exploration series', 'Cooking technique tutorials'],
    travel: ['Destination spotlight series', 'Travel hack videos', 'Cultural etiquette guides'],
    science: ['Experiment of the month', 'Scientific breakthrough discussions', 'Researcher interviews']
  };

  const sentimentIdeas = {
    positive: ['Inspirational member stories', 'Achievement celebration posts'],
    negative: ['Debate topic of the week', 'Constructive criticism workshops'],
    neutral: ['Balanced perspective series', 'Fact-check roundups']
  };

  let ideas = [...baseIdeas, ...(themeIdeas[theme] || []), ...sentimentIdeas[sentiment]];
  ideas = ideas.concat(keywords.map(keyword => `${capitalize(keyword)}-focused content series`));

  return [...new Set(ideas)].slice(0, 10);
};

// Helper functions
const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

// API Server
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);

  if (parsedUrl.pathname === '/api/smaiapi' && req.method === 'GET') {
    const prompt = parsedUrl.query.prompt;

    if (!prompt) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Missing prompt parameter' }));
      return;
    }

    const serverConfig = generateDiscordServer(prompt);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(serverConfig, null, 2));
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found');
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});