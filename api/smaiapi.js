const http = require('http');
const url = require('url');

const generateDiscordServer = (prompt) => {
  const keywords = extractKeywords(prompt);
  const theme = detectTheme(keywords);
  const serverSize = detectServerSize(keywords);
  const sentiment = analyzeSentiment(prompt);

  const serverConfig = {
    name: generateServerName(keywords, theme),
    description: generateDescription(keywords, theme),
    channels: generateChannels(keywords, theme, serverSize),
    categories: generateCategories(keywords, theme, serverSize),
    roles: generateRoles(keywords, theme, serverSize),
    color: generateColor(keywords, theme),
    emojis: generateEmojis(keywords, theme),
    rules: generateRules(theme, serverSize),
    welcomeMessage: generateWelcomeMessage(theme),
    botSuggestions: suggestBots(theme, serverSize),
    growthStrategies: generateGrowthStrategies(theme, serverSize),
    customizationOptions: generateCustomizationOptions(),
    visualElements: generateVisualElements(theme),
    moderationTools: suggestModerationTools(serverSize),
    externalIntegrations: suggestExternalIntegrations(theme),
    verificationLevel: generateVerificationLevel(serverSize),
    communityFeatures: generateCommunityFeatures(theme, serverSize),
    partnershipOpportunities: generatePartnershipOpportunities(theme),
    contentCreationIdeas: generateContentCreationIdeas(theme)
  };

  return serverConfig;
};

const extractKeywords = (prompt) => {
  const words = prompt.toLowerCase().match(/[\w]+/g) || [];
  const commonWords = new Set(['a', 'an', 'the', 'me', 'make', 'create', 'discord', 'server', 'with', 'for', 'about', 'and', 'or', 'but']);
  return words.filter(word => !commonWords.has(word));
};

const detectTheme = (keywords) => {
  const themeKeywords = {
    gaming: ['game', 'gaming', 'esports', 'rpg', 'mmorpg', 'fps', 'minecraft', 'fortnite'],
    art: ['art', 'drawing', 'painting', 'illustration', 'design', 'creative'],
    music: ['music', 'band', 'concert', 'instrument', 'song', 'playlist'],
    education: ['study', 'learning', 'school', 'college', 'university', 'course'],
    technology: ['tech', 'coding', 'programming', 'developer', 'software', 'hardware'],
    community: ['community', 'social', 'friends', 'chat', 'hangout'],
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

  return detectedTheme;
};

const detectServerSize = (keywords) => {
  if (keywords.some(word => ['big', 'large', 'huge', 'massive'].includes(word))) {
    return 'large';
  } else if (keywords.some(word => ['small', 'tiny', 'intimate'].includes(word))) {
    return 'small';
  }
  return 'medium';
};

const analyzeSentiment = (prompt) => {
  const positiveWords = ['happy', 'fun', 'exciting', 'friendly', 'positive', 'welcoming'];
  const negativeWords = ['serious', 'strict', 'professional', 'formal'];

  const words = prompt.toLowerCase().split(/\s+/);
  const positiveCount = words.filter(word => positiveWords.includes(word)).length;
  const negativeCount = words.filter(word => negativeWords.includes(word)).length;

  return positiveCount > negativeCount ? 'positive' : 'neutral';
};

const generateServerName = (keywords, theme) => {
  const themeNames = {
    gaming: ['Gamer\'s Paradise', 'Pixel Hangout', 'Controller Club'],
    art: ['Creative Canvas', 'Artistic Haven', 'Palette Playground'],
    music: ['Melody Makers', 'Rhythm Realm', 'Harmony Hub'],
    education: ['Knowledge Nexus', 'Study Sanctuary', 'Learning Lounge'],
    technology: ['Tech Talk', 'Code Crafters', 'Digital Dynamos'],
    community: ['Community Corner', 'Friendly Faces', 'Social Sphere'],
  };

  const names = themeNames[theme] || ['Community Hub', 'Discord Delight', 'Server Central'];
  const name = `${capitalize(keywords[0] || '')} ${names[Math.floor(Math.random() * names.length)]}`;
  return name.trim();
};

const generateDescription = (keywords, theme) => {
  const themeDescriptions = {
    gaming: 'A gaming paradise for enthusiasts and casual players alike.',
    art: 'A creative haven for artists to share, inspire, and grow together.',
    music: 'A harmonious community for music lovers and creators.',
    education: 'A knowledge hub for learners and educators to connect and share.',
    technology: 'A tech-savvy community for innovation and problem-solving.',
    community: 'A welcoming space for friends to chat, share, and have fun.',
  };

  return `${themeDescriptions[theme] || 'A vibrant community for like-minded individuals.'} Join us to discuss ${keywords.slice(0, 3).join(', ')} and more!`;
};

const generateChannels = (keywords, theme, serverSize) => {
  const baseChannels = ['welcome', 'rules', 'announcements', 'general-chat', 'introductions', 'media-share'];
  const themeChannels = {
    gaming: ['game-discussion', 'looking-for-group', 'game-news', 'streaming', 'tournaments'],
    art: ['art-showcase', 'critique-corner', 'art-resources', 'challenges', 'commissions'],
    music: ['music-sharing', 'genre-discussion', 'instrument-chat', 'collaborations', 'gig-announcements'],
    education: ['study-groups', 'homework-help', 'resource-sharing', 'academic-discussion', 'career-advice'],
    technology: ['tech-support', 'coding-help', 'project-showcase', 'tech-news', 'job-postings'],
    community: ['events', 'hobbies', 'food-and-cooking', 'book-club', 'movie-night'],
  };

  let channels = [...baseChannels, ...(themeChannels[theme] || [])];
  channels = channels.concat(keywords.map(keyword => `${keyword}-chat`));

  const channelCount = serverSize === 'small' ? 10 : serverSize === 'large' ? 30 : 20;
  return shuffleArray(channels).slice(0, channelCount);
};

const generateCategories = (keywords, theme, serverSize) => {
  const baseCategories = ['INFORMATION', 'GENERAL', 'COMMUNITY'];
  const themeCategories = {
    gaming: ['GAMES', 'MATCHMAKING', 'ESPORTS'],
    art: ['GALLERIES', 'WORKSHOPS', 'RESOURCES'],
    music: ['GENRES', 'CREATION', 'PERFORMANCES'],
    education: ['SUBJECTS', 'STUDY GROUPS', 'RESOURCES'],
    technology: ['TECH TALK', 'DEVELOPMENT', 'PROJECTS'],
    community: ['EVENTS', 'INTERESTS', 'MEDIA'],
  };

  let categories = [...baseCategories, ...(themeCategories[theme] || [])];
  categories = categories.concat(keywords.map(keyword => keyword.toUpperCase()));

  const categoryCount = serverSize === 'small' ? 5 : serverSize === 'large' ? 10 : 7;
  return shuffleArray(categories).slice(0, categoryCount);
};

const generateRoles = (keywords, theme, serverSize) => {
  const baseRoles = ['Admin', 'Moderator', 'Member', 'New Member'];
  const themeRoles = {
    gaming: ['Pro Gamer', 'Speedrunner', 'Casual Player', 'Game Master'],
    art: ['Master Artist', 'Sketch Artist', 'Digital Artist', 'Art Enthusiast'],
    music: ['Musician', 'Music Producer', 'Vocalist', 'Music Lover'],
    education: ['Teacher', 'Student', 'Tutor', 'Graduate'],
    technology: ['Developer', 'Designer', 'Tech Guru', 'IT Professional'],
    community: ['Event Organizer', 'Community Leader', 'Active Member', 'Helper'],
  };

  let roles = [...baseRoles, ...(themeRoles[theme] || [])];
  roles = roles.concat(keywords.map(keyword => `${capitalize(keyword)} Enthusiast`));

  const roleCount = serverSize === 'small' ? 7 : serverSize === 'large' ? 15 : 10;
  return shuffleArray(roles).slice(0, roleCount);
};

const generateColor = (keywords, theme) => {
  const themeColors = {
    gaming: ['#7289DA', '#43B581', '#FAA61A'],
    art: ['#FF7F50', '#8A2BE2', '#20B2AA'],
    music: ['#1DB954', '#FF6B6B', '#4A90E2'],
    education: ['#4285F4', '#34A853', '#FBBC05'],
    technology: ['#00ACED', '#3B5998', '#DD4B39'],
    community: ['#FFA07A', '#98FB98', '#DDA0DD'],
  };

  const colors = themeColors[theme] || ['#7289DA', '#43B581', '#FAA61A'];
  return colors[Math.floor(Math.random() * colors.length)];
};

const generateEmojis = (keywords, theme) => {
  const baseEmojis = ['👍', '👎', '❤️', '🎉', '🤔', '😂', '🔥', '✨', '🌟', '💯'];
  const themeEmojis = {
    gaming: ['🎮', '🕹️', '🏆', '⚔️', '🛡️'],
    art: ['🎨', '✏️', '🖌️', '🖼️', '📷'],
    music: ['🎵', '🎶', '🎸', '🥁', '🎤'],
    education: ['📚', '🎓', '✏️', '🔬', '🧮'],
    technology: ['💻', '🖥️', '📱', '⌨️', '🖱️'],
    community: ['🤝', '🌈', '🌿', '☕', '🍕'],
  };

  let emojis = [...baseEmojis, ...(themeEmojis[theme] || [])];
  emojis = emojis.concat(keywords.map(keyword => `:${keyword}:`));

  return shuffleArray(emojis).slice(0, 15);
};

const generateRules = (theme, serverSize) => {
  const baseRules = [
    'Be respectful to all members',
    'No spam or self-promotion without permission',
    'No NSFW content',
    'Follow Discord\'s Terms of Service',
  ];

  const themeRules = {
    gaming: ['No cheating or hacking discussions', 'Use spoiler tags for game spoilers'],
    art: ['Credit original artists when sharing work', 'Constructive criticism only'],
    music: ['No illegal file sharing', 'Respect copyright laws'],
    education: ['No plagiarism', 'Respect diverse learning styles'],
    technology: ['No piracy or cracking discussions', 'Use code blocks for code snippets'],
    community: ['No hate speech or discrimination', 'Respect others\' privacy'],
  };

  let rules = [...baseRules, ...(themeRules[theme] || [])];
  const ruleCount = serverSize === 'small' ? 5 : serverSize === 'large' ? 10 : 7;
  return rules.slice(0, ruleCount);
};

const generateWelcomeMessage = (theme) => {
  const welcomeMessages = {
    gaming: 'Welcome to our gaming community! Ready to level up your experience?',
    art: 'Welcome, creative souls! We\'re excited to see your artistic journey unfold here.',
    music: 'Welcome to our melodious community! Let\'s make some noise together.',
    education: 'Welcome, learners and educators! Your journey of knowledge starts here.',
    technology: 'Welcome, tech enthusiasts! Get ready to innovate and problem-solve together.',
    community: 'Welcome to our friendly community! We\'re glad you\'re here to join the conversation.',
  };

  return welcomeMessages[theme] || 'Welcome to our server! We\'re excited to have you join our community.';
};

const suggestBots = (theme, serverSize) => {
  const baseBots = ['MEE6', 'Dyno', 'Carl-bot'];
  const themeBots = {
    gaming: ['Statbot', 'Pokécord', 'DiscordRPG'],
    art: ['Dank Memer', 'NQN (Not Quite Nitro)', 'Emoji.gg'],
    music: ['Rythm', 'Groovy', 'FredBoat'],
    education: ['StudyBot', 'Quizlet', 'Wikipedia'],
    technology: ['GitBot', 'StackOverflow', 'CodeStats'],
    community: ['Tatsumaki', 'Idle Miner', 'TicketTool'],
  };

  let bots = [...baseBots, ...(themeBots[theme] || [])];
  const botCount = serverSize === 'small' ? 3 : serverSize === 'large' ? 7 : 5;
  return shuffleArray(bots).slice(0, botCount);
};

const generateGrowthStrategies = (theme, serverSize) => {
  const baseStrategies = [
    'Engage with members regularly',
    'Host events and competitions',
    'Collaborate with other servers',
  ];

  const themeStrategies = {
    gaming: ['Host game tournaments', 'Offer exclusive roles for active gamers'],
    art: ['Feature artist of the week', 'Host art challenges with prizes'],
    music: ['Organize listening parties', 'Create collaborative playlists'],
    education: ['Offer study groups', 'Host Q&A sessions with experts'],
    technology: ['Host hackathons', 'Create a job board for tech positions'],
    community: ['Organize meetups', 'Create a mentorship program'],
  };

  let strategies = [...baseStrategies, ...(themeStrategies[theme] || [])];
  const strategyCount = serverSize === 'small' ? 3 : serverSize === 'large' ? 7 : 5;
  return strategies.slice(0, strategyCount);
};

const generateCustomizationOptions = () => {
  return {
    customRoles: true,
    customEmojis: true,
    serverBoosts: Math.floor(Math.random() * 3) + 1,
    customInviteBackground: true,
    customServerIcon: true,
  };
};

const generateVisualElements = (theme) => {
  const themeColors = {
    gaming: ['#7289DA', '#43B581', '#FAA61A'],
    art: ['#FF7F50', '#8A2BE2', '#20B2AA'],
    music: ['#1DB954', '#FF6B6B', '#4A90E2'],
    education: ['#4285F4', '#34A853', '#FBBC05'],
    technology: ['#00ACED', '#3B5998', '#DD4B39'],
    community: ['#FFA07A', '#98FB98', '#DDA0DD'],
  };

  const themeIcons = {
    gaming: '🎮',
    art: '🎨',
    music: '🎵',
    education: '📚',
    technology: '💻',
    community: '🤝',
  };

  const colors = themeColors[theme] || ['#7289DA', '#43B581', '#FAA61A'];
  const icon = themeIcons[theme] || '📣';

  return {
    primaryColor: colors[0],
    secondaryColor: colors[1],
    accentColor: colors[2],
    serverIcon: icon,
    bannerIdeas: [
      `A ${theme}-themed banner with the server name in ${colors[0]} color`,
      `An abstract design using ${colors[1]} and ${colors[2]}`,
      `A minimalist banner featuring the ${icon} icon`,
    ],
  };
};

const suggestModerationTools = (serverSize) => {
  const baseTools = ['Automated welcome messages', 'Basic auto-moderation (spam, excessive caps, etc.)'];
  const advancedTools = [
    'Customizable auto-moderation rules',
    'Raid protection',
    'Temporary mute and ban features',
    'Logging system for mod actions',
    'Ticket system for user reports',
  ];

  if (serverSize === 'small') {
    return baseTools;
  } else if (serverSize === 'large') {
    return [...baseTools, ...advancedTools];
  } else {
    return [...baseTools, ...advancedTools.slice(0, 2)];
  }
};

const suggestExternalIntegrations = (theme) => {
  const baseIntegrations = ['Twitter', 'YouTube'];
  const themeIntegrations = {
    gaming: ['Twitch', 'Steam', 'Xbox Live', 'PlayStation Network'],
    art: ['DeviantArt', 'ArtStation', 'Instagram'],
    music: ['Spotify', 'SoundCloud', 'Bandcamp'],
    education: ['Khan Academy', 'Coursera', 'Google Classroom'],
    technology: ['GitHub', 'Stack Overflow', 'LinkedIn'],
    community: ['Facebook Groups', 'Meetup', 'Eventbrite'],
  };

  return [...baseIntegrations, ...(themeIntegrations[theme] || [])];
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


// New functions
const generateVerificationLevel = (serverSize) => {
  const levels = ['None', 'Low', 'Medium', 'High', 'Highest'];
  const index = serverSize === 'small' ? 1 : serverSize === 'large' ? 3 : 2;
  return levels[index];
};

const generateCommunityFeatures = (theme, serverSize) => {
  const baseFeatures = ['Server Discovery', 'Welcome Screen'];
  const advancedFeatures = [
    'Community Updates Channel',
    'Insights',
    'Member Screening',
    'Server Boosting Tiers'
  ];

  if (serverSize === 'small') {
    return baseFeatures;
  } else if (serverSize === 'large') {
    return [...baseFeatures, ...advancedFeatures];
  } else {
    return [...baseFeatures, ...advancedFeatures.slice(0, 2)];
  }
};

const generatePartnershipOpportunities = (theme) => {
  const baseOpportunities = ['Cross-promotion with similar servers', 'Collaborative events'];
  const themeOpportunities = {
    gaming: ['Partnerships with game developers', 'Esports team sponsorships'],
    art: ['Art supply company sponsorships', 'Gallery exhibition collaborations'],
    music: ['Record label partnerships', 'Music festival collaborations'],
    education: ['Educational institution partnerships', 'Online course platform collaborations'],
    technology: ['Tech company sponsorships', 'Hackathon partnerships'],
    community: ['Local business partnerships', 'Charity organization collaborations']
  };

  return [...baseOpportunities, ...(themeOpportunities[theme] || [])];
};

const generateContentCreationIdeas = (theme) => {
  const baseIdeas = ['Weekly community spotlight', 'Monthly server newsletter'];
  const themeIdeas = {
    gaming: ['Game review series', 'Esports match analysis'],
    art: ['Artist interview series', 'Time-lapse creation videos'],
    music: ['Album listening parties', 'Music theory workshops'],
    education: ['Study tip videos', 'Subject-specific crash courses'],
    technology: ['Tech news roundup', 'Coding challenge series'],
    community: ['Member success stories', 'Community project showcases']
  };

  return [...baseIdeas, ...(themeIdeas[theme] || [])];
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