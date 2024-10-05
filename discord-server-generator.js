const generateDiscordServer = (prompt) => {
  const keywords = extractKeywords(prompt);
  const isAesthetic = keywords.includes('aesthetic');
  const isGameThemed = keywords.includes('game') || keywords.includes('gaming');
  const isBigServer = keywords.includes('big') || keywords.includes('large');
  const isSmallServer = keywords.includes('small') || keywords.includes('tiny');
  const separator = chooseSeparator(isAesthetic);

  const serverConfig = {
    name: generateServerName(keywords, isAesthetic, isGameThemed),
    description: generateDescription(keywords, isAesthetic, isGameThemed),
    channels: generateChannels(keywords, isAesthetic, isGameThemed, isBigServer, isSmallServer, separator),
    categories: generateCategories(keywords, isGameThemed, isBigServer, isSmallServer),
    roles: generateRoles(keywords, isAesthetic, isGameThemed, isBigServer, isSmallServer),
    color: generateColor(keywords),
    emojis: generateEmojis(keywords, isGameThemed, isAesthetic),
  };

  return serverConfig;
};

const extractKeywords = (prompt) => {
  const words = prompt.toLowerCase().split(' ');
  const commonWords = new Set(['a', 'an', 'the', 'me', 'make', 'create', 'discord', 'server', 'with', 'for', 'about', 'and', 'or', 'but']);
  return words.filter(word => !commonWords.has(word));
};

const generateServerName = (keywords, isAesthetic, isGameThemed) => {
  let name = `${capitalize(keywords[0])} ${capitalize(keywords[1])} `;
  name += isGameThemed ? 'Gamers' : 'Community';
  return isAesthetic ? `✨ ${name} ✨` : name;
};

const generateDescription = (keywords, isAesthetic, isGameThemed) => {
  let description = `A ${keywords.join(' ')} themed `;
  description += isGameThemed ? 'gaming paradise' : 'vibrant community';
  description += ' for passionate enthusiasts and creative minds!';
  return isAesthetic ? `🌟 ${description} 🌟` : description;
};

const generateChannels = (keywords, isAesthetic, isGameThemed, isBigServer, isSmallServer, separator) => {
  const baseChannels = [
    'welcome', 'rules', 'announcements', 'general-chat', 'introductions', 'media-share',
    'voice-lounges', 'afk', 'bot-commands', 'suggestions', 'faq', 'resources',
    'events', 'collaborations', 'challenges', 'achievements', 'memes', 'off-topic',
    'polls', 'server-updates', 'roles', 'emote-suggestions', 'community-spotlight',
    'highlights', 'weekly-themes', 'goals', 'inspiration', 'feedback', 'partnerships'
  ];

  const gameChannels = [
    'game-news', 'looking-for-group', 'strategies', 'game-clips', 'tournaments',
    'game-development', 'mod-discussion', 'speedrunning', 'game-deals', 'esports',
    'game-reviews', 'character-builds', 'lore-discussion', 'gaming-setups',
    'game-releases', 'gaming-memes', 'stream-announcements', 'game-guides',
    'gaming-challenges', 'guild-recruitment', 'patch-notes', 'gaming-art',
    'game-suggestions', 'gaming-history', 'retro-gaming', 'indie-games',
    'gaming-trivia', 'gaming-music', 'gaming-cosplay', 'game-bugs-glitches'
  ];

  const communityChannels = [
    'art-showcase', 'music-sharing', 'book-club', 'movie-night', 'pet-pictures',
    'food-and-cooking', 'fitness', 'tech-support', 'language-exchange', 'job-listings',
    'market-place', 'self-improvement', 'mental-health', 'creative-writing',
    'podcasts', 'streaming', 'photography', 'diy-crafts', 'fashion', 'travel',
    'science-and-tech', 'sports-talk', 'gardening', 'finance-tips', 'movie-tv-discussion',
    'anime-manga', 'cosplay', 'tabletop-games', 'collectibles', 'current-events',
    'volunteer-opportunities', 'studying-together', 'life-hacks', 'meme-factory',
    'art-commissions', 'motivational', 'nature-appreciation', 'pet-advice',
    'tech-gadgets', 'home-decor', 'music-production', 'fitness-challenges',
    'book-recommendations', 'language-learning', 'career-advice', 'relationship-advice',
    'parenting-tips', 'education-resources', 'daily-challenges', 'mindfulness-meditation'
  ];

  let channels = [...baseChannels];

  if (isGameThemed) {
    channels = channels.concat(gameChannels);
  } else {
    channels = channels.concat(communityChannels);
  }

  // Add keyword-specific channels consistently
  const keywordChannels = keywords.flatMap(keyword => [
    `${keyword}-discussion`,
    `${keyword}-showcase`,
    `${keyword}-help`,
    `${keyword}-events`
  ]);
  channels = [...new Set([...channels, ...keywordChannels])]; // Ensure unique channels

  // Select a fixed number of channels based on server size
  const numChannels = isSmallServer ? 6 : isBigServer ? 50 : 30; // 6, 50, or 30 channels
  channels = channels.slice(0, numChannels);

  // Apply separator
  return channels.map(channel => `${separator}${channel}`);
};

const generateCategories = (keywords, isGameThemed, isBigServer, isSmallServer) => {
  let categories = ['INFORMATION', 'GENERAL', 'COMMUNITY', 'MEDIA', 'VOICE CHANNELS'];

  if (isGameThemed) {
    categories = categories.concat(['GAMING', 'STRATEGIES', 'TOURNAMENTS', 'GAME CHAT']);
  } else {
    categories = categories.concat(['CREATIVE', 'LIFESTYLE', 'HOBBIES', 'LEARNING']);
  }

  if (isBigServer) {
    categories = categories.concat(['EVENTS', 'COLLABORATIONS', 'CHALLENGES', 'SHOWCASES']);
  }

  keywords.forEach(keyword => categories.push(keyword.toUpperCase()));

  // Shuffle and select categories based on server size
  categories = shuffleArray(categories);
  let numCategories;
  if (isSmallServer) {
    numCategories = Math.floor(Math.random() * 3) + 3; // 3 to 5 categories
  } else if (isBigServer) {
    numCategories = Math.floor(Math.random() * 6) + 10; // 10 to 15 categories
  } else {
    numCategories = Math.floor(Math.random() * 6) + 5; // 5 to 10 categories
  }
  return categories.slice(0, numCategories);
};

const generateRoles = (keywords, isAesthetic, isGameThemed, isBigServer, isSmallServer) => {
  const baseRoles = [
    `${capitalize(keywords[0])} Expert`,
    `${capitalize(keywords[1])} Enthusiast`,
    'Active Member',
    'Member',
    'Newcomer',
  ];

  const gameRoles = [
    'Pro Gamer', 'Casual Gamer', 'Speedrunner', 'Lore Master', 'Strategist',
    'Completionist', 'Beta Tester', 'Esports Player', 'Game Developer', 'Streamer',
    'Clan Leader', 'Raid Boss', 'Puzzle Solver', 'Roleplayer', 'Modder'
  ];

  const communityRoles = [
    'Moderator', 'Content Creator', 'Event Organizer', 'Artisan', 'Mentor',
    'Ambassador', 'Curator', 'Trendsetter', 'Guru', 'Scholar', 'Innovator',
    'Peacekeeper', 'Trailblazer', 'Sage', 'Luminary', 'Connoisseur', 'Virtuoso'
  ];

  const funRoles = [
    'Night Owl', 'Early Bird', 'Meme Lord', 'Friendly Neighbor', 'Helping Hand',
    'Chatterbox', 'Silent Observer', 'Pun Master', 'Emoji Enthusiast', 'Trivia Champion',
    'Resident DJ', 'Bookworm', 'Globe Trotter', 'Foodie', 'Fitness Fanatic',
    'Tech Wizard', 'Green Thumb', 'Pet Whisperer', 'Movie Buff', 'Fashionista'
  ];

  let roles = [...baseRoles];

  if (isGameThemed) {
    roles = roles.concat(shuffleArray(gameRoles).slice(0, 5));
  } else {
    roles = roles.concat(shuffleArray(communityRoles).slice(0, 5));
  }

  roles = roles.concat(shuffleArray(funRoles).slice(0, 3));

  if (isBigServer) {
    roles = roles.concat(['VIP', 'Patron', 'Contributor', 'Partner']);
  }

  if (isSmallServer) {
    roles = shuffleArray(roles).slice(0, 8); // Limit to 8 roles for small servers
  } else if (!isBigServer) {
    roles = shuffleArray(roles).slice(0, 15); // Limit to 15 roles for medium servers
  }

  if (isAesthetic) {
    return roles.map(role => `✧･ﾟ: ${role} :･ﾟ✧`);
  }
  return roles;
};

const generateColor = (keywords) => {
  const colorMap = {
    red: '#FF0000', crimson: '#DC143C', maroon: '#800000', pink: '#FFC0CB',
    coral: '#FF7F50', salmon: '#FA8072', orange: '#FFA500', gold: '#FFD700',
    yellow: '#FFFF00', khaki: '#F0E68C', lavender: '#E6E6FA', purple: '#800080',
    indigo: '#4B0082', blue: '#0000FF', cyan: '#00FFFF', turquoise: '#40E0D0',
    teal: '#008080', green: '#00FF00', lime: '#00FF00', olive: '#808000',
    brown: '#A52A2A', beige: '#F5F5DC', ivory: '#FFFFF0', white: '#FFFFFF',
    silver: '#C0C0C0', gray: '#808080', black: '#000000'
  };

  const colorKeyword = keywords.find(word => colorMap.hasOwnProperty(word));
  return colorKeyword ? colorMap[colorKeyword] : '#7289DA'; // Default Discord color
};

const generateEmojis = (keywords, isGameThemed, isAesthetic) => {
  const baseEmojis = ['👍', '👎', '❤️', '🎉', '🤔', '😂', '🔥', '✨', '🌟', '💯', '🙌', '👀', '🎊', '🌈', '💖'];
  const gameEmojis = ['🎮', '🕹️', '🏆', '⚔️', '🛡️', '🚀', '🧙', '🦸', '🌈', '💣', '🏹', '🗡️', '🔮', '🎲', '👾'];
  const aestheticEmojis = ['🌸', '🌺', '🌷', '🌹', '🌻', '🍃', '🦋', '🌙', '🌊', '🍄', '🕊️', '🎐', '🧚', '🌠', '🍡'];
  
  let emojis = [...baseEmojis];
  if (isGameThemed) {
    emojis = emojis.concat(gameEmojis);
  }
  if (isAesthetic) {
    emojis = emojis.concat(aestheticEmojis);
  }
  keywords.forEach(word => emojis.push(`:${word}:`));
  
  return shuffleArray(emojis).slice(0, 20);  // Return 20 random emojis
};

const chooseSeparator = (isAesthetic) => {
  const aestheticSeparators = ['・❀・', '◗', '◖', '❁', '✧', '✿', '❋', '❃', '✤', '✻', '✽', '♡', '☆', '✮', '✭', '✯', '✰'];
  const regularSeparators = ['│', '┃', '┊', '┇', '┆', '┋', '╏', '╎', '┆', '┇', '┊', '┋', '╽', '╿', '║'];
  const separators = isAesthetic ? aestheticSeparators : regularSeparators;
  return separators[Math.floor(Math.random() * separators.length)];
};

const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

// Example usage
const prompt = "A simple community";
const serverConfig = generateDiscordServer(prompt);
console.log(JSON.stringify(serverConfig, null, 2))