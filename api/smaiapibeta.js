const http = require('http');
const url = require('url');

const generateDiscordServer = (prompt) => {
  const keywords = extractKeywords(prompt);
  const theme = detectTheme(keywords, prompt);
  const serverSize = detectServerSize(keywords, prompt);
  const sentiment = analyzeSentiment(prompt);

  const serverConfig = {
    name: generateServerName(keywords, theme, sentiment),
    description: generateDescription(keywords, theme, sentiment),
    channels: generateChannels(keywords, theme, serverSize, sentiment),
    categories: generateCategories(keywords, theme, serverSize),
    roles: generateRoles(keywords, theme, serverSize),
    color: generateColor(keywords, theme, sentiment),
    emojis: generateEmojis(keywords, theme)
  };

  return serverConfig;
};

// Helper functions
const extractKeywords = (prompt) => {
  const words = prompt.toLowerCase().match(/[\w]+/g) || [];
  const commonWords = new Set(['a', 'an', 'the', 'me', 'make', 'create', 'discord', 'server', 'with', 'for', 'about', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'of', 'that', 'this', 'it', 'as', 'by', 'from', 'be', 'was', 'were', 'will', 'would', 'could', 'should', 'can', 'may', 'might', 'must', 'shall']);
  return words.filter(word => !commonWords.has(word));
};

const detectTheme = (keywords, prompt) => {
  const themeKeywords = {
    gaming: ['game', 'gaming', 'esports', 'rpg', 'fps', 'minecraft', 'fortnite', 'league', 'overwatch', 'steam', 'playstation', 'xbox', 'nintendo'],
    art: ['art', 'drawing', 'painting', 'design', 'sketch', 'digital', 'photography', 'sculpture', 'crafts'],
    music: ['music', 'band', 'concert', 'instrument', 'song', 'playlist', 'album', 'artist', 'producer'],
    education: ['study', 'learning', 'school', 'college', 'university', 'course', 'teach', 'research'],
    technology: ['tech', 'coding', 'programming', 'developer', 'software', 'hardware', 'ai', 'cybersecurity'],
    community: ['community', 'friends', 'chat', 'hangout', 'meetup', 'support', 'help', 'advice', 'discussion'],
    fitness: ['fitness', 'workout', 'gym', 'exercise', 'health', 'nutrition', 'diet', 'bodybuilding', 'yoga'],
    business: ['business', 'entrepreneur', 'startup', 'finance', 'marketing', 'management', 'ecommerce'],
    entertainment: ['movies', 'tv', 'anime', 'comics', 'books', 'writing', 'storytelling'],
    food: ['cooking', 'baking', 'recipe', 'cuisine', 'foodie', 'restaurant', 'chef', 'gourmet', 'vegetarian'],
    travel: ['travel', 'adventure', 'explore', 'vacation', 'tourism', 'backpacking', 'culture'],
    science: ['science', 'physics', 'biology', 'chemistry', 'astronomy', 'geology', 'environment'],
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

const detectServerSize = (keywords, prompt) => {
  if (keywords.some(word => ['big', 'large', 'huge', 'massive'].includes(word)) || prompt.toLowerCase().includes('large server')) {
    return 'large';
  } else if (keywords.some(word => ['small', 'tiny', 'cozy'].includes(word)) || prompt.toLowerCase().includes('small server')) {
    return 'small';
  }
  return 'medium';
};

const analyzeSentiment = (prompt) => {
  const positiveWords = ['happy', 'fun', 'exciting', 'friendly', 'positive', 'enthusiastic', 'joyful'];
  const negativeWords = ['serious', 'strict', 'formal', 'focused', 'intense', 'competitive'];

  const words = prompt.toLowerCase().split(/\s+/);
  const positiveCount = words.filter(word => positiveWords.includes(word)).length;
  const negativeCount = words.filter(word => negativeWords.includes(word)).length;

  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
};

// Roles (25+ roles per theme)
const generateRoles = (keywords, theme, serverSize) => {
  const baseRoles = ['Admin', 'Moderator', 'Member'];

  const themeRoles = {
    gaming: ['Pro Gamer', 'Speedrunner', 'Strategist', 'Streamer', 'Game Developer', 'Content Creator', 'Lore Master', 'Casual Gamer', 'Achievement Hunter', 'Tournament Organizer', 'Esports Coach', 'Competitive Player', 'Community Manager', 'Mod Creator', 'Fan Artist', 'Game Journalist', 'Game Tester', 'Retro Gamer', 'Fan Theorist', 'Lore Expert', 'Clan Leader', 'Squad Leader', 'PVP Champion', 'PvE Master', 'Raid Organizer', 'Glitch Finder'],
    art: ['Master Artist', 'Art Critic', 'Illustrator', 'Graphic Designer', 'Photographer', 'Concept Artist', 'Painter', 'Sculptor', 'Mixed Media Artist', 'Street Artist', 'Fashion Designer', 'Art Historian', 'Art Collector', 'Curator', 'Commission Artist', 'Tattoo Artist', 'Portrait Artist', 'Character Designer', 'Art Enthusiast', 'Digital Artist', 'Traditional Artist', 'Craftsman', 'Animator', 'Comic Artist', 'Illustrator Pro'],
    music: ['Virtuoso', 'Composer', 'DJ', 'Music Theorist', 'Producer', 'Songwriter', 'Instrumentalist', 'Band Member', 'Singer', 'Vocal Coach', 'Sound Engineer', 'Music Enthusiast', 'Music Promoter', 'Drummer', 'Guitarist', 'Pianist', 'Lyricist', 'Concert Organizer', 'Record Collector', 'Album Reviewer', 'Music Teacher', 'Music Fan', 'Chorus Leader', 'Vocalist', 'Backup Singer', 'Choir Director'],
    education: ['Scholar', 'Researcher', 'Professor', 'Student', 'Mentor', 'Lecturer', 'Tutor', 'PhD Candidate', 'Academic', 'Graduate', 'Language Teacher', 'Math Tutor', 'Science Tutor', 'Study Group Leader', 'Subject Expert', 'Curriculum Designer', 'Online Instructor', 'Home Schooler', 'Essay Reviewer', 'Career Advisor', 'Class Representative', 'Exam Prep Coach', 'Quiz Master', 'Homework Helper', 'Educational Enthusiast'],
    technology: ['Tech Guru', 'Programmer', 'Developer', 'Data Scientist', 'System Architect', 'Cybersecurity Expert', 'Software Engineer', 'Web Developer', 'Cloud Architect', 'AI Specialist', 'Blockchain Developer', 'Tech Blogger', 'Gadget Reviewer', 'Startup Founder', 'IT Support Specialist', 'Tech Entrepreneur', 'Hardware Specialist', 'Game Developer', 'Full Stack Developer', 'Mobile App Developer', 'Cloud Engineer', 'DevOps Specialist', 'Digital Designer', 'Tech Consultant', 'Automation Engineer'],
    community: ['Community Leader', 'Event Organizer', 'Volunteer', 'Mentor', 'Peer Supporter', 'Networker', 'Social Coordinator', 'Community Builder', 'Feedback Facilitator', 'Resource Manager', 'Engagement Specialist', 'Outreach Coordinator', 'Event Host', 'Community Moderator', 'Discussion Leader', 'Local Organizer', 'Fundraiser', 'Diversity Advocate', 'Member of the Week', 'Collaboration Leader', 'Group Facilitator', 'Charity Organizer', 'Skill Sharer', 'Community Ambassador', 'Volunteer Coordinator']
  };

  let roles = [...baseRoles, ...(themeRoles[theme] || [])];
  roles = roles.concat(keywords.map(keyword => `${capitalize(keyword)} Expert`));

  const uniqueRoles = [...new Set(roles)];
  const roleCount = serverSize === 'small' ? 10 : serverSize === 'large' ? 25 : 15;
  return shuffleArray(uniqueRoles).slice(0, roleCount);
};

// Channels (20+ channels per theme with emojis and separators)
const generateChannels = (keywords, theme, serverSize, sentiment) => {
  const baseChannels = [
    '👋│welcome',
    '📜│rules',
    '📢│announcements',
    '💬│general-chat',
    '📸│introductions',
    '🎉│off-topic',
    '❓│help-desk',
    '📊│server-feedback',
    '🔗│server-links',
    '🎮│games-room'
  ];

  const themeChannels = {
    gaming: [
      '🎮│game-discussion', 
      '🎯│lfg', 
      '🏆│tournaments', 
      '📺│streamers', 
      '🎥│clips-and-highlights', 
      '📊│rankings', 
      '💡│strategy-and-tips', 
      '🛠️│game-mods', 
      '🕹️│retro-games', 
      '🎉│memes', 
      '📝│game-reviews', 
      '📢│game-news', 
      '🤖│bot-commands', 
      '🎥│live-streams', 
      '🔗│game-deals', 
      '🧩│puzzles-and-trivia', 
      '🖼️│fan-art', 
      '💬│voice-chat', 
      '🔊│stream-chat', 
      '🚨│esports-events'
    ],
    art: [
      '🎨│art-showcase', 
      '🖌️│critiques', 
      '🖼️│inspiration', 
      '📸│photography', 
      '💼│commissions', 
      '🎨│digital-art', 
      '✍️│traditional-art', 
      '🖍️│sketching', 
      '🖥️│graphic-design', 
      '📘│art-resources', 
      '🎉│art-challenges', 
      '📚│art-history', 
      '🖊️│illustrations', 
      '🎥│speed-paintings', 
      '📝│portfolio-feedback', 
      '🧑‍🎨│artist-of-the-week', 
      '🖍️│art-memes', 
      '📖│concept-art', 
      '🖼️│fan-art', 
      '🧑‍🏫│art-tutorials'
    ],
    music: [
      '🎶│music-sharing', 
      '🎧│production-tips', 
      '🎤│live-performances', 
      '🎼│music-news', 
      '🎹│instrument-tutorials', 
      '🎙️│podcasts', 
      '🎛️│mixing-and-mastering', 
      '📻│dj-room', 
      '📝│songwriting', 
      '🎧│listening-parties', 
      '🎵│music-theory', 
      '🎧│remix-challenges', 
      '📝│lyric-feedback', 
      '🎷│jazz-lounge', 
      '🎸│rock-and-metal', 
      '🎶│underground-artists', 
      '🎤│freestyle-sessions', 
      '🎼│album-reviews', 
      '🎵│chill-vibes', 
      '🎧│music-production'
    ],
    education: [
      '📚│study-groups', 
      '✍️│homework-help', 
      '📖│essay-reviews', 
      '🎓│career-advice', 
      '🔬│research-topics', 
      '💻│coding-tutorials', 
      '📘│science-discussions', 
      '📕│math-help', 
      '📚│history-debates', 
      '📘│language-learning', 
      '📖│exam-prep', 
      '📝│q-and-a', 
      '🎓│study-tips', 
      '📖│book-club', 
      '🎓│thesis-support', 
      '📑│presentation-help', 
      '📊│data-analysis', 
      '📜│academic-writing', 
      '📚│resource-sharing', 
      '📈│learning-strategies'
    ],
    // Similar expansions for other server types...
  };

  let channels = [...baseChannels, ...(themeChannels[theme] || [])];
  channels = channels.concat(keywords.map(keyword => `#${keyword}-discussion`));

  const uniqueChannels = [...new Set(channels)];
  const channelCount = serverSize === 'small' ? 20 : serverSize === 'large' ? 40 : 30;
  return shuffleArray(uniqueChannels).slice(0, channelCount);
};

// Categories (15+ per theme)
const generateCategories = (keywords, theme, serverSize) => {
  const baseCategories = ['🔰│INFORMATION', '💬│GENERAL', '🧑‍🤝‍🧑│COMMUNITY'];

  const themeCategories = {
    gaming: [
      '🎮│GAMES', '🏆│ESPORTS', '📺│STREAMING', '🕹️│RETRO GAMING', '💬│VOICE CHAT', 
      '📚│GUIDES', '🛠️│MODDING', '🚨│TOURNAMENTS', '📊│LEADERBOARDS', '🎉│MEMES', 
      '📢│ANNOUNCEMENTS', '📝│REVIEWS', '🔊│LIVE CHAT', '🎯│STRATEGY', '🔧│TROUBLESHOOTING'
    ],
    art: [
      '🎨│GALLERIES', '🖌️│WORKSHOPS', '🖼️│SHOWCASE', '🖍️│SKETCHING', '✍️│CRITIQUES', 
      '📘│RESOURCES', '🖼️│PORTFOLIOS', '📚│ART HISTORY', '🎉│CHALLENGES', '💼│COMMISSIONS', 
      '🖌️│DIGITAL ART', '📝│FEEDBACK', '🖊️│ILLUSTRATIONS', '📸│PHOTOGRAPHY', '🎨│CONCEPT ART'
    ],
    music: [
      '🎶│GENRES', '🎧│PRODUCTION', '🎤│LIVE SHOWS', '🎛️│DJ BOOTH', '🎼│MUSIC THEORY', 
      '📢│ANNOUNCEMENTS', '📝│SONGWRITING', '🎧│REMIXES', '🎵│LISTENING PARTIES', '📻│RADIO', 
      '📚│MUSIC RESOURCES', '📝│ALBUM REVIEWS', '🎹│INSTRUMENT TIPS', '🎤│VOCAL TRAINING', '🎧│PODCASTS'
    ],
    education: [
      '📚│SUBJECTS', '🎓│STUDY GROUPS', '🔬│SCIENCE', '🧮│MATH', '📕│HISTORY', 
      '✍️│WRITING', '📖│LANGUAGES', '💻│TECH', '📘│ONLINE COURSES', '📊│DATA ANALYSIS', 
      '🎓│EXAM PREP', '📖│TUTORING', '📚│RESOURCES', '🎓│CAREER SUPPORT', '📜│ACADEMIC WRITING'
    ],
    // Additional categories for other server types...
  };

  let categories = [...baseCategories, ...(themeCategories[theme] || [])];
  categories = categories.concat(keywords.map(keyword => keyword.toUpperCase()));

  const uniqueCategories = [...new Set(categories)];
  const categoryCount = serverSize === 'small' ? 15 : serverSize === 'large' ? 30 : 20;
  return shuffleArray(uniqueCategories).slice(0, categoryCount);
};

// Server generation API
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);

  if (parsedUrl.pathname === '/api/smaiapibeta' && req.method === 'GET') {
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

// Utility functions
const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};