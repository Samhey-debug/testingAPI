const generateDiscordServer = (prompt) => {
  const keywords = extractKeywords(prompt);
  const serverType = determineServerType(keywords);
  const theme = determineTheme(keywords);
  const size = determineSize(keywords);
  const features = determineFeatures(keywords);
  const language = determineLanguage(keywords);

  if (isNSFW(keywords)) {
    return { error: "I'm sorry, but I can't create NSFW servers." };
  }

  const serverConfig = {
    name: generateServerName(keywords, theme, serverType),
    description: generateDescription(keywords, theme, serverType),
    channels: generateChannels(keywords, theme, serverType, size, features),
    categories: generateCategories(keywords, theme, serverType, size),
    roles: generateRoles(keywords, theme, serverType, size),
    color: generateColor(keywords, theme),
    emojis: generateEmojis(keywords, theme, serverType),
    features: generateServerFeatures(features),
    language: language,
    moderationSettings: generateModerationSettings(size, serverType),
    welcomeMessage: generateWelcomeMessage(keywords, theme, serverType),
    rulesTemplate: generateRulesTemplate(serverType),
    suggestedBots: suggestBots(serverType, features),
    customEmojis: generateCustomEmojis(keywords, theme, serverType),
    bannerImage: suggestBannerImage(theme, serverType),
    integrations: suggestIntegrations(serverType, features),
  };

  return serverConfig;
};

const extractKeywords = (prompt) => {
  const words = prompt.toLowerCase().split(/\s+/);
  const commonWords = new Set(['a', 'an', 'the', 'me', 'make', 'create', 'discord', 'server', 'with', 'for', 'about', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'of', 'that', 'this', 'it', 'as', 'from', 'by', 'be', 'was', 'were', 'will', 'would', 'could', 'should', 'has', 'have', 'had', 'is', 'are', 'am']);
  return words.filter(word => !commonWords.has(word));
};

const determineServerType = (keywords) => {
  const types = {
    gaming: ['game', 'gaming', 'esports', 'streamer', 'twitch', 'minecraft', 'fortnite', 'rpg', 'mmo', 'fps'],
    community: ['community', 'social', 'chat', 'hangout', 'friends', 'club'],
    education: ['education', 'school', 'college', 'university', 'study', 'learning', 'academic'],
    business: ['business', 'work', 'professional', 'startup', 'entrepreneur', 'networking'],
    technology: ['tech', 'technology', 'programming', 'coding', 'developer', 'software', 'hardware'],
    creative: ['art', 'music', 'writing', 'design', 'photography', 'film', 'animation'],
    hobby: ['hobby', 'craft', 'diy', 'collecting', 'gardening', 'cooking', 'fitness'],
    fandom: ['fan', 'fandom', 'anime', 'manga', 'movie', 'tv', 'book', 'comic', 'cosplay'],
  };

  for (const [type, typeKeywords] of Object.entries(types)) {
    if (keywords.some(keyword => typeKeywords.includes(keyword))) {
      return type;
    }
  }
  return 'general';
};

const determineTheme = (keywords) => {
  const themes = {
    aesthetic: ['aesthetic', 'beautiful', 'pretty', 'cute', 'kawaii', 'pastel'],
    minimalist: ['minimalist', 'simple', 'clean', 'sleek'],
    retro: ['retro', 'vintage', 'old-school', '80s', '90s'],
    futuristic: ['futuristic', 'sci-fi', 'cyberpunk', 'high-tech'],
    nature: ['nature', 'forest', 'ocean', 'mountain', 'wildlife'],
    fantasy: ['fantasy', 'magical', 'enchanted', 'mythical'],
    spooky: ['spooky', 'horror', 'halloween', 'gothic', 'creepy'],
    elegant: ['elegant', 'sophisticated', 'luxurious', 'classy'],
  };

  for (const [theme, themeKeywords] of Object.entries(themes)) {
    if (keywords.some(keyword => themeKeywords.includes(keyword))) {
      return theme;
    }
  }
  return 'standard';
};

const determineSize = (keywords) => {
  if (keywords.includes('small') || keywords.includes('tiny')) return 'small';
  if (keywords.includes('big') || keywords.includes('large')) return 'large';
  return 'medium';
};

const determineFeatures = (keywords) => {
  const featureKeywords = {
    leveling: ['leveling', 'xp', 'ranks'],
    economy: ['economy', 'currency', 'shop'],
    music: ['music', 'radio', 'playlist'],
    moderation: ['moderation', 'automod', 'security'],
    games: ['minigames', 'trivia', 'quiz'],
    roleplay: ['roleplay', 'rp', 'character'],
    polls: ['polls', 'voting', 'surveys'],
    ticketing: ['tickets', 'support', 'helpdesk'],
    streaming: ['streaming', 'live', 'broadcast'],
    events: ['events', 'tournaments', 'competitions'],
  };

  return Object.entries(featureKeywords)
    .filter(([feature, keywords]) => keywords.some(keyword => keywords.includes(keyword)))
    .map(([feature]) => feature);
};

const determineLanguage = (keywords) => {
  const languages = {
    english: ['english', 'en'],
    spanish: ['spanish', 'español', 'es'],
    french: ['french', 'français', 'fr'],
    german: ['german', 'deutsch', 'de'],
    japanese: ['japanese', '日本語', 'jp'],
    korean: ['korean', '한국어', 'kr'],
    chinese: ['chinese', '中文', 'cn'],
    russian: ['russian', 'русский', 'ru'],
    portuguese: ['portuguese', 'português', 'pt'],
    italian: ['italian', 'italiano', 'it'],
  };

  for (const [language, languageKeywords] of Object.entries(languages)) {
    if (keywords.some(keyword => languageKeywords.includes(keyword))) {
      return language;
    }
  }
  return 'english';
};

const isNSFW = (keywords) => {
  const nsfwKeywords = ['nsfw', 'adult', 'xxx', 'porn', 'sexy', 'erotic', 'nude', 'fetish'];
  return keywords.some(keyword => nsfwKeywords.includes(keyword));
};

const generateServerName = (keywords, theme, serverType) => {
  const themeEmojis = {
    aesthetic: '✨',
    minimalist: '◻️',
    retro: '🕹️',
    futuristic: '🚀',
    nature: '🌿',
    fantasy: '🔮',
    spooky: '👻',
    elegant: '💎',
  };

  const typeWords = {
    gaming: ['Gamers', 'Players', 'Guild'],
    community: ['Community', 'Hub', 'Hangout'],
    education: ['Academy', 'School', 'Campus'],
    business: ['Network', 'Professionals', 'Innovators'],
    technology: ['Tech', 'Coders', 'Devs'],
    creative: ['Studio', 'Workshop', 'Atelier'],
    hobby: ['Enthusiasts', 'Club', 'Society'],
    fandom: ['Fans', 'Admirers', 'Devotees'],
  };

  const uniqueKeywords = [...new Set(keywords)];
  const randomKeyword = uniqueKeywords[Math.floor(Math.random() * uniqueKeywords.length)];
  const typeWord = typeWords[serverType][Math.floor(Math.random() * typeWords[serverType].length)];
  const themeEmoji = theme in themeEmojis ? themeEmojis[theme] : '';

  let name = `${capitalize(randomKeyword)} ${typeWord}`;
  if (theme === 'aesthetic') {
    name = `✧･ﾟ: *✧･ﾟ:* ${name} *:･ﾟ✧*:･ﾟ✧`;
  } else if (themeEmoji) {
    name = `${themeEmoji} ${name} ${themeEmoji}`;
  }

  return name;
};

const generateDescription = (keywords, theme, serverType) => {
  const themeDescriptions = {
    aesthetic: 'A visually pleasing and harmonious space',
    minimalist: 'A clean and uncluttered environment',
    retro: 'A blast from the past with vintage vibes',
    futuristic: 'An advanced and forward-thinking community',
    nature: 'A serene and natural sanctuary',
    fantasy: 'A magical realm of wonder and imagination',
    spooky: 'A chilling and thrilling atmosphere',
    elegant: 'A sophisticated and refined gathering place',
  };

  const typeDescriptions = {
    gaming: 'for passionate gamers and enthusiasts',
    community: 'for like-minded individuals to connect and share',
    education: 'for learning, growth, and academic pursuits',
    business: 'for professionals and entrepreneurs to network and collaborate',
    technology: 'for tech enthusiasts and innovators',
    creative: 'for artists and creators to inspire and be inspired',
    hobby: 'for hobbyists to share their passion and expertise',
    fandom: 'for fans to celebrate and discuss their favorite content',
  };

  const themeDesc = themeDescriptions[theme] || 'An exciting Discord server';
  const typeDesc = typeDescriptions[serverType];
  const keywordDesc = keywords.slice(0, 3).join(', ');

  return `${themeDesc} ${typeDesc}. Join us to explore ${keywordDesc} and more!`;
};

const generateChannels = (keywords, theme, serverType, size, features) => {
  const baseChannels = [
    'welcome', 'rules', 'announcements', 'general', 'introductions', 'off-topic',
    'media-share', 'voice-chat', 'afk'
  ];

  const themeChannels = {
    aesthetic: ['aesthetic-sharing', 'outfit-of-the-day', 'color-palettes'],
    minimalist: ['declutter-tips', 'minimalist-lifestyle', 'simple-living'],
    retro: ['retro-gaming', 'vintage-finds', 'nostalgia-corner'],
    futuristic: ['future-tech', 'sci-fi-discussion', 'innovation-hub'],
    nature: ['nature-photography', 'outdoor-adventures', 'eco-friendly-tips'],
    fantasy: ['worldbuilding', 'character-creation', 'magical-creatures'],
    spooky: ['horror-stories', 'paranormal-experiences', 'creepy-art'],
    elegant: ['fashion-advice', 'fine-dining', 'etiquette-tips'],
  };

  const typeChannels = {
    gaming: ['game-discussion', 'lfg', 'streams', 'clips', 'esports'],
    community: ['events', 'suggestions', 'polls', 'community-projects'],
    education: ['study-groups', 'homework-help', 'resource-sharing', 'academic-discussion'],
    business: ['networking', 'job-board', 'startup-advice', 'industry-news'],
    technology: ['tech-support', 'coding-help', 'project-showcase', 'tech-news'],
    creative: ['art-showcase', 'feedback', 'collaborations', 'inspiration'],
    hobby: ['show-and-tell', 'tips-and-tricks', 'equipment-discussion', 'events'],
    fandom: ['fan-art', 'theories', 'fanfiction', 'watch-parties'],
  };

  const featureChannels = {
    leveling: ['level-ups', 'rank-roles', 'leaderboard'],
    economy: ['shop', 'trading', 'daily-rewards'],
    music: ['music-commands', 'playlist-sharing', 'music-discussion'],
    moderation: ['mod-logs', 'reports', 'staff-chat'],
    games: ['game-corner', 'trivia', 'minigames'],
    roleplay: ['character-sheets', 'roleplay-discussion', 'in-character'],
    polls: ['community-polls', 'suggestion-voting'],
    ticketing: ['create-ticket', 'support'],
    streaming: ['stream-announcements', 'streamer-chat'],
    events: ['event-calendar', 'event-planning', 'tournaments'],
  };

  let channels = [...baseChannels];
  channels = channels.concat(themeChannels[theme] || []);
  channels = channels.concat(typeChannels[serverType] || []);
  features.forEach(feature => channels = channels.concat(featureChannels[feature] || []));

  // Add keyword-specific channels
  keywords.forEach(keyword => {
    channels.push(`${keyword}-discussion`, `${keyword}-showcase`);
  });

  // Shuffle and select channels based on server size
  channels = shuffleArray(channels);
  const numChannels = size === 'small' ? 15 : size === 'large' ? 50 : 30;
  channels = channels.slice(0, numChannels);

  // Apply theme-based separator
  const separator = getThemeSeparator(theme);
  return channels.map(channel => `${separator}${channel}`);
};

const generateCategories = (keywords, theme, serverType, size) => {
  const baseCategories = ['INFORMATION', 'GENERAL', 'COMMUNITY'];

  const themeCategories = {
    aesthetic: ['VISUALS', 'INSPIRATION'],
    minimalist: ['ESSENTIALS', 'SIMPLICITY'],
    retro: ['NOSTALGIA', 'CLASSICS'],
    futuristic: ['INNOVATION', 'TECHNOLOGY'],
    nature: ['OUTDOORS', 'ENVIRONMENT'],
    fantasy: ['REALMS', 'MAGIC'],
    spooky: ['HORROR', 'MYSTERIES'],
    elegant: ['REFINEMENT', 'LUXURY'],
  };

  const typeCategories = {
    gaming: ['GAMING', 'VOICE CHANNELS'],
    community: ['EVENTS', 'ACTIVITIES'],
    education: ['ACADEMICS', 'RESOURCES'],
    business: ['NETWORKING', 'INDUSTRY'],
    technology: ['TECH TALK', 'PROJECTS'],
    creative: ['SHOWCASE', 'WORKSHOPS'],
    hobby: ['INTERESTS', 'DISCUSSIONS'],
    fandom: ['FAN CONTENT', 'THEORIES'],
  };

  let categories = [...baseCategories];
  categories = categories.concat(themeCategories[theme] || []);
  categories = categories.concat(typeCategories[serverType] || []);

  // Add keyword-specific categories
  keywords.forEach(keyword => categories.push(keyword.toUpperCase()));

  // Shuffle and select categories based on server size
  categories = shuffleArray(categories);
  const numCategories = size === 'small' ? 5 : size === 'large' ? 15 : 10;
  return categories.slice(0, numCategories);
};

const generateRoles = (keywords, theme, serverType, size) => {
  const baseRoles = ['Admin', 'Moderator', 'Member', 'New Member'];

  const themeRoles = {
    aesthetic: ['Aesthetic Guru', 'Vibe Curator'],
    minimalist: ['Declutter Master', 'Zen Achiever'],
    retro: ['Time Traveler', 'Nostalgia Expert'],
    futuristic: ['Futurist', 'Tech Visionary'],
    nature: ['Nature Explorer', 'Eco Warrior'],
    fantasy: ['Lore Keeper', 'Mythical Creature'],
    spooky: ['Ghost Hunter', 'Creepypasta Author'],
    elegant: ['Sophisticate', 'Trendsetter'],
  };

  const typeRoles = {
    gaming: ['Pro Gamer', 'Speedrunner', 'Strategist'],
    community: ['Community Leader', 'Event Organizer'],
    education: ['Tutor', 'Research Assistant', 'Study Buddy'],
    business: ['Entrepreneur', 'Investor', 'Mentor'],
    technology: ['Code Wizard', 'Bug Hunter', 'Tech Guru'],
    creative: ['Master Artist', 'Muse', 'Collaborator'],
    hobby: ['Hobby Expert', 'Enthusiast', 'Collector'],
    fandom: ['Super Fan', 'Lore Master', 'Cosplayer'],
  };

  let roles = [...baseRoles];
  roles = roles.concat(themeRoles[theme] || []);
  roles = roles.concat(typeRoles[serverType] || []);

  // Add keyword-specific roles
  keywords.forEach(keyword => roles.push(`${capitalize(keyword)} Expert`));

  // Add level-based roles if 'leveling' is a feature
  if (keywords.includes('leveling')) {
    roles = roles.concat(['Novice', 'Intermediate', 'Expert', 'Master', 'Legend']);
  }

  // Shuffle and select roles based on server size
  roles = shuffleArray(roles);
  const numRoles = size === 'small' ? 8 : size === 'large' ? 20 : 12;
  roles = roles.slice(0, numRoles);

  // Apply theme-based formatting
  return applyThemeFormatting(roles, theme);
};

const generateColor = (keywords, theme) => {
  const themeColors = {
    aesthetic: ['#FFB6C1', '#87CEFA', '#98FB98', '#DDA0DD', '#F0E68C'],
    minimalist: ['#FFFFFF', '#F5F5F5', '#DCDCDC', '#D3D3D3', '#C0C0C0'],
    retro: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FDCB6E', '#6A0572'],
    futuristic: ['#00FFFF', '#FF00FF', '#7FFF00', '#1E90FF', '#FF1493'],
    nature: ['#228B22', '#32CD32', '#20B2AA', '#66CDAA', '#7CFC00'],
    fantasy: ['#9B59B6', '#3498DB', '#E74C3C', '#27AE60', '#F1C40F'],
    spooky: ['#800000', '#8B008B', '#556B2F', '#4B0082', '#191970'],
    elegant: ['#000000', '#FFFFFF', '#C0C0C0', '#808080', '#A9A9A9'],
  };

  const colorMap = {
    red: '#FF0000', crimson: '#DC143C', maroon: '#800000', pink: '#FFC0CB',
    coral: '#FF7F50', salmon: '#FA8072', orange: '#FFA500', gold: '#FFD700',
    yellow: '#FFFF00', khaki: '#F0E68C', lavender: '#E6E6FA', purple: '#800080',
    indigo: '#4B0082', blue: '#0000FF', cyan: '#00FFFF', turquoise: '#40E0D0',
    teal: '#008080', green: '#00FF00', lime: '#00FF00', olive: '#808000',
    brown: '#A52A2A', beige: '#F5F5DC', ivory: '#FFFFF0', white: '#FFFFFF',
    silver: '#C0C0C0', gray: '#808080', black: '#000000'
  };

  // First, check if there's a specific color mentioned in the keywords
  const colorKeyword = keywords.find(word => colorMap.hasOwnProperty(word));
  if (colorKeyword) {
    return colorMap[colorKeyword];
  }

  // If no specific color is mentioned, use a theme-based color
  if (theme in themeColors) {
    return themeColors[theme][Math.floor(Math.random() * themeColors[theme].length)];
  }

  // Default to Discord's blurple if no theme or specific color is found
  return '#7289DA';
};

const generateEmojis = (keywords, theme, serverType) => {
  const baseEmojis = ['👍', '👎', '❤️', '😊', '😂', '🎉', '🔥', '💯', '🙌', '👀'];

  const themeEmojis = {
    aesthetic: ['✨', '🌸', '🌈', '🦋', '🌙'],
    minimalist: ['◻️', '◽', '▫️', '⬜', '⚪'],
    retro: ['👾', '🕹️', '💾', '📼', '☎️'],
    futuristic: ['🚀', '🤖', '👽', '🛸', '🔮'],
    nature: ['🌿', '🌳', '🌊', '🌄', '🐾'],
    fantasy: ['🧙', '🐉', '🧝', '🦄', '🏰'],
    spooky: ['👻', '🎃', '🦇', '🕸️', '🌚'],
    elegant: ['💎', '👑', '🥂', '🕯️', '🎭'],
  };

  const typeEmojis = {
    gaming: ['🎮', '🏆', '⚔️', '🛡️', '🧩'],
    community: ['🤝', '🗣️', '👥', '🌐', '📢'],
    education: ['📚', '🎓', '✏️', '🔬', '🧠'],
    business: ['💼', '📈', '💡', '🤝', '📊'],
    technology: ['💻', '🖥️', '📱', '⌨️', '🖱️'],
    creative: ['🎨', '🎵', '📷', '✍️', '🎬'],
    hobby: ['🧶', '🏹', '🎣', '🧩', '🏃'],
    fandom: ['🎬', '📺', '🎭', '📚', '🎤'],
  };

  let emojis = [...baseEmojis];
  emojis = emojis.concat(themeEmojis[theme] || []);
  emojis = emojis.concat(typeEmojis[serverType] || []);

  // Add keyword-specific emojis
  keywords.forEach(word => emojis.push(`:${word}:`));

  // Shuffle and select a subset of emojis
  return shuffleArray(emojis).slice(0, 20);
};

const generateServerFeatures = (features) => {
  const featureDescriptions = {
    leveling: 'Experience points and level-up system',
    economy: 'Virtual currency and economy system',
    music: 'Music bot for playing tunes in voice channels',
    moderation: 'Advanced moderation and auto-moderation tools',
    games: 'Mini-games and interactive bot games',
    roleplay: 'Role-playing features and character systems',
    polls: 'Polling and voting system for community decisions',
    ticketing: 'Support ticket system for user assistance',
    streaming: 'Streaming announcements and Twitch integration',
    events: 'Event planning and management tools',
  };

  return features.map(feature => featureDescriptions[feature] || feature);
};

const generateModerationSettings = (size, serverType) => {
  const baseSettings = {
    explicitContentFilter: 'MEMBERS_WITHOUT_ROLES',
    verificationLevel: 'LOW',
  };

  if (size === 'large' || serverType === 'gaming') {
    baseSettings.explicitContentFilter = 'ALL_MEMBERS';
    baseSettings.verificationLevel = 'MEDIUM';
  }

  if (serverType === 'education' || serverType === 'business') {
    baseSettings.verificationLevel = 'HIGH';
  }

  return baseSettings;
};

const generateWelcomeMessage = (keywords, theme, serverType) => {
  const themeMessages = {
    aesthetic: 'Welcome to our visually pleasing sanctuary!',
    minimalist: 'Welcome to our clutter-free space.',
    retro: 'Step back in time and join our retro community!',
    futuristic: 'Welcome to the future of Discord communities!',
    nature: 'Welcome to our natural oasis!',
    fantasy: 'Enter a realm of magic and wonder!',
    spooky: 'Dare to enter our spooky domain...',
    elegant: 'Welcome to our sophisticated gathering.',
  };

  const typeMessages = {
    gaming: 'Get ready to level up your Discord experience!',
    community: 'Join our vibrant community of like-minded individuals!',
    education: 'Prepare to expand your knowledge and skills!',
    business: 'Network, collaborate, and grow with fellow professionals!',
    technology: 'Dive into the cutting edge of technology!',
    creative: 'Unleash your creativity in our artistic haven!',
    hobby: 'Share your passion and discover new interests!',
    fandom: 'Celebrate your fandom with fellow enthusiasts!',
  };

  const themeMsg = themeMessages[theme] || 'Welcome to our server!';
  const typeMsg = typeMessages[serverType] || 'We're excited to have you here!';
  const keywordMsg = `Explore ${keywords.slice(0, 3).join(', ')} and more!`;

  return `${themeMsg} ${typeMsg} ${keywordMsg}`;
};

const generateRulesTemplate = (serverType) => {
  const baseRules = [
    'Be respectful to all members',
    'No spamming or excessive self-promotion',
    'Keep content in appropriate channels',
    'Follow Discord's Terms of Service',
  ];

  const typeSpecificRules = {
    gaming: [
      'No cheating or exploiting game mechanics',
      'Be a good sport in competitive play',
      'Use spoiler tags for game spoilers',
    ],
    comm