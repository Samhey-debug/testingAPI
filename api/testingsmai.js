const express = require('express');
const natural = require('natural');
const colorThief = require('colorthief');
const emojiLib = require('node-emoji');

const app = express();
const tokenizer = new natural.WordTokenizer();
const tfidf = new natural.TfIdf();

const themes = ['gaming', 'art', 'music', 'education', 'technology', 'community', 'fitness', 'business', 'entertainment', 'food', 'travel', 'science'];

const generateServer = (prompt) => {
  const tokens = tokenizer.tokenize(prompt.toLowerCase());
  const theme = detectTheme(tokens);
  const sentiment = analyzeSentiment(tokens);
  const formality = detectFormality(tokens);
  const size = detectSize(tokens);

  return {
    name: generateName(tokens, theme),
    description: generateDescription(tokens, theme, sentiment),
    channels: generateChannels(tokens, theme, size),
    roles: generateRoles(tokens, theme, formality),
    color: generateColor(theme, sentiment),
    emojis: generateEmojis(theme, tokens),
    rules: generateRules(theme, formality),
    welcomeMessage: generateWelcomeMessage(theme, sentiment, formality),
    features: generateFeatures(theme, size, sentiment),
    growthStrategies: generateGrowthStrategies(theme, size),
    integrations: generateIntegrations(theme, tokens),
    verificationLevel: generateVerificationLevel(size, formality),
    customization: generateCustomization(size),
  };
};

const detectTheme = (tokens) => {
  let maxScore = 0;
  let detectedTheme = 'general';

  themes.forEach(theme => {
    tfidf.addDocument(themeKeywords[theme]);
    const score = tokens.reduce((sum, token) => sum + tfidf.tfidf(token, 0), 0);
    if (score > maxScore) {
      maxScore = score;
      detectedTheme = theme;
    }
    tfidf.removeDocument(0);
  });

  return detectedTheme;
};

const analyzeSentiment = (tokens) => {
  const sentiment = natural.SentimentAnalyzer.analyze(tokens.join(' '));
  return sentiment.score > 0 ? 'positive' : sentiment.score < 0 ? 'negative' : 'neutral';
};

const detectFormality = (tokens) => {
  const formalWords = new Set(['professional', 'formal', 'serious', 'business', 'corporate', 'academic']);
  const informalWords = new Set(['casual', 'relaxed', 'chill', 'fun', 'friendly']);
  
  const formalCount = tokens.filter(token => formalWords.has(token)).length;
  const informalCount = tokens.filter(token => informalWords.has(token)).length;

  return formalCount > informalCount ? 'formal' : informalCount > formalCount ? 'informal' : 'neutral';
};

const detectSize = (tokens) => {
  const sizeWords = {small: ['small', 'tiny', 'intimate'], large: ['big', 'large', 'huge']};
  for (const [size, words] of Object.entries(sizeWords)) {
    if (tokens.some(token => words.includes(token))) return size;
  }
  return 'medium';
};

const generateName = (tokens, theme) => {
  const adjectives = ['Epic', 'Awesome', 'Ultimate', 'Prime', 'Elite'];
  const nouns = {
    gaming: ['Gamers', 'Players', 'Guild'],
    art: ['Artists', 'Creators', 'Studio'],
    music: ['Musicians', 'Melody', 'Harmony'],
    // ... (other themes)
  };
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[theme][Math.floor(Math.random() * nouns[theme].length)];
  return `${adj} ${noun} ${capitalize(tokens[Math.floor(Math.random() * tokens.length)])}`;
};

const generateDescription = (tokens, theme, sentiment) => {
  const descriptions = {
    gaming: 'A community for passionate gamers to connect and level up together.',
    art: 'A canvas for creative minds to inspire and be inspired.',
    music: 'A symphony of musical talents collaborating in harmony.',
    // ... (other themes)
  };
  const sentimentAdjectives = {
    positive: 'vibrant',
    negative: 'focused',
    neutral: 'diverse'
  };
  return `Welcome to our ${sentimentAdjectives[sentiment]} ${theme} community! ${descriptions[theme]} Join us to explore ${tokens.slice(0, 3).join(', ')} and more!`;
};

const generateChannels = (tokens, theme, size) => {
  const baseChannels = ['welcome', 'rules', 'announcements', 'general'];
  const themeChannels = {
    gaming: ['game-discussion', 'looking-for-group', 'strategies', 'clips'],
    art: ['artwork-showcase', 'critiques', 'resources', 'challenges'],
    music: ['music-sharing', 'collaboration', 'gear-talk', 'industry-news'],
    // ... (other themes)
  };
  const channelCount = size === 'small' ? 10 : size === 'large' ? 20 : 15;
  let channels = [...baseChannels, ...themeChannels[theme], ...tokens.map(token => `${token}-chat`)];
  return [...new Set(channels)].slice(0, channelCount).map(channel => `📌 ${channel.replace(/-/g, ' ').toUpperCase()}`);
};

const generateRoles = (tokens, theme, formality) => {
  const baseRoles = ['Admin', 'Moderator', 'Member'];
  const themeRoles = {
    gaming: ['Pro Gamer', 'Speedrunner', 'Completionist'],
    art: ['Master Artist', 'Curator', 'Visionary'],
    music: ['Virtuoso', 'Composer', 'Audio Engineer'],
    // ... (other themes)
  };
  const formalityRoles = {
    formal: ['Distinguished', 'Esteemed', 'Respected'],
    informal: ['Cool Cat', 'Superstar', 'Rockstar'],
    neutral: ['Active', 'Dedicated', 'Valued']
  };
  return [...baseRoles, ...themeRoles[theme], ...formalityRoles[formality], ...tokens.map(token => `${capitalize(token)} Expert`)];
};

const generateColor = (theme, sentiment) => {
  const colors = {
    gaming: ['#7289DA', '#43B581', '#FAA61A'],
    art: ['#FF7F50', '#8A2BE2', '#20B2AA'],
    music: ['#1DB954', '#FF6B6B', '#4A90E2'],
    // ... (other themes)
  };
  const colorIndex = sentiment === 'positive' ? 0 : sentiment === 'negative' ? 2 : 1;
  return colors[theme][colorIndex];
};

const generateEmojis = (theme, tokens) => {
  const themeEmojis = {
    gaming: ['🎮', '🕹️', '🏆'],
    art: ['🎨', '🖌️', '🖼️'],
    music: ['🎵', '🎶', '🎸'],
    // ... (other themes)
  };
  return [...themeEmojis[theme], ...tokens.map(token => emojiLib.search(token)[0]?.emoji || '✨')];
};

const generateRules = (theme, formality) => {
  const baseRules = [
    'Be respectful to all members',
    'No hate speech or harassment',
    'Keep content relevant to channels',
    'No spamming or excessive self-promotion'
  ];
  const themeRules = {
    gaming: ['No cheating or hacking discussions', 'Use spoiler tags for game spoilers'],
    art: ['Credit original artists when sharing work', 'Constructive criticism only'],
    music: ['No illegal file sharing', 'Respect copyright laws'],
    // ... (other themes)
  };
  const formalityRules = {
    formal: ['Maintain professional conduct', 'Use appropriate language'],
    informal: ['Keep it fun and friendly', 'Memes are welcome in appropriate channels'],
    neutral: ['Be mindful of diverse perspectives', 'Engage in constructive discussions']
  };
  return [...baseRules, ...themeRules[theme], ...formalityRules[formality]];
};

const generateWelcomeMessage = (theme, sentiment, formality) => {
  const messages = {
    gaming: 'Level up your gaming experience!',
    art: 'Unleash your creativity!',
    music: 'Let\'s make some noise!',
    // ... (other themes)
  };
  const sentimentAdj = {positive: 'exciting', negative: 'focused', neutral: 'unique'};
  const formalityAdj = {formal: 'esteemed', informal: 'awesome', neutral: 'valued'};
  return `Welcome to our ${sentimentAdj[sentiment]} ${theme} community, ${formalityAdj[formality]} new member! ${messages[theme]} We're thrilled to have you join us.`;
};

const generateFeatures = (theme, size, sentiment) => {
  const baseFeatures = ['Server Discovery', 'Welcome Screen', 'Community Updates'];
  const themeFeatures = {
    gaming: ['Game Night Events', 'Esports Team Management'],
    art: ['Artist Spotlight Program', 'Virtual Gallery'],
    music: ['Live Performance Stage', 'Collaborative Playlist'],
    // ... (other themes)
  };
  const sizeFeatures = {
    small: ['Intimate Discussion Groups'],
    medium: ['Regular Community Events', 'Member of the Month'],
    large: ['Advanced Analytics', 'Partner Program', 'Verified Server Status']
  };
  const sentimentFeatures = {
    positive: ['Achievement System', 'Positivity Board'],
    negative: ['Structured Debate Platform', 'Peer Review System'],
    neutral: ['Anonymous Feedback', 'Balanced Discussion Forums']
  };
  return [...baseFeatures, ...themeFeatures[theme], ...sizeFeatures[size], ...sentimentFeatures[sentiment]];
};

const generateGrowthStrategies = (theme, size) => {
  const strategies = [
    'Engage with members regularly',
    'Host events and competitions',
    'Collaborate with other servers',
    'Create high-quality content',
    'Encourage member-generated content',
    'Optimize server for discoverability',
    'Implement a referral program',
    'Leverage social media promotion'
  ];
  return strategies.slice(0, size === 'small' ? 3 : size === 'large' ? 8 : 5);
};

const generateIntegrations = (theme, tokens) => {
  const baseIntegrations = ['Twitter', 'YouTube', 'Twitch'];
  const themeIntegrations = {
    gaming: ['Steam', 'Xbox Live', 'PlayStation Network'],
    art: ['DeviantArt', 'ArtStation', 'Behance'],
    music: ['Spotify', 'SoundCloud', 'Bandcamp'],
    // ... (other themes)
  };
  return [...baseIntegrations, ...themeIntegrations[theme], ...tokens.map(token => `${capitalize(token)} API`)].slice(0, 6);
};

const generateVerificationLevel = (size, formality) => {
  const levels = ['Low', 'Medium', 'High', '(╯°□°）╯︵ ┻━┻'];
  if (formality === 'formal' || size === 'large') return levels[2];
  if (formality === 'informal' && size === 'small') return levels[0];
  return levels[1];
};

const generateCustomization = (size) => ({
  customRoles: true,
  customEmojis: true,
  customStickers: size !== 'small',
  serverBoosts: size === 'small' ? 1 : size === 'large' ? 3 : 2,
  customInviteBackground: size !== 'small',
  customServerIcon: true,
  customServerBanner: size === 'large',
});

const capitalize = str => str.charAt(0).toUpperCase() + str.slice(1);

app.get('/api/testingsmai', (req, res) => {
  const prompt = req.query.prompt;
  if (!prompt) {
    return res.status(400).json({ error: 'Missing prompt parameter' });
  }
  const serverConfig = generateServer(prompt);
  res.json(serverConfig);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));