// Required Libraries
const http = require('http');
const natural = require('natural');
const Sentiment = require('sentiment');

// Initialize NLP Tools
const tokenizer = new natural.WordTokenizer();
const sentimentAnalyzer = new Sentiment();

// Core Server Generation Logic
class DiscordServerAI {
    constructor(prompt) {
        this.prompt = prompt;
        this.keywords = this.extractKeywords(prompt);
        this.sentiment = this.analyzeSentiment(prompt);
        this.theme = this.detectTheme();
        this.formality = this.detectFormality();
    }

    // Extract relevant keywords from the user's prompt
    extractKeywords(prompt) {
        const words = tokenizer.tokenize(prompt.toLowerCase());
        const stopwords = new Set(['the', 'and', 'to', 'for', 'a', 'is', 'of']);
        return words.filter(word => !stopwords.has(word));
    }

    // Perform sentiment analysis on the prompt
    analyzeSentiment(prompt) {
        const sentimentResult = sentimentAnalyzer.analyze(prompt);
        if (sentimentResult.score > 0) return 'positive';
        if (sentimentResult.score < 0) return 'negative';
        return 'neutral';
    }

    // Detect the main theme of the server based on keywords
    detectTheme() {
        const themeKeywords = {
            gaming: ['game', 'play', 'fps', 'rpg', 'multiplayer', 'league', 'battle'],
            tech: ['tech', 'code', 'ai', 'programming', 'software', 'developer'],
            music: ['music', 'song', 'band', 'dj', 'genre', 'track'],
            fitness: ['fitness', 'workout', 'gym', 'nutrition', 'health'],
            community: ['chat', 'talk', 'hangout', 'meetup', 'friends', 'support'],
            education: ['study', 'learn', 'college', 'university', 'academic', 'teach']
        };

        for (const [theme, keywords] of Object.entries(themeKeywords)) {
            if (this.keywords.some(word => keywords.includes(word))) {
                return theme;
            }
        }
        return 'general';
    }

    // Determine the formality of the server based on the prompt
    detectFormality() {
        const formalWords = ['professional', 'formal', 'business', 'serious'];
        const informalWords = ['casual', 'fun', 'friendly', 'relaxed'];
        const wordMatchesFormal = this.keywords.filter(word => formalWords.includes(word)).length;
        const wordMatchesInformal = this.keywords.filter(word => informalWords.includes(word)).length;

        return wordMatchesFormal > wordMatchesInformal ? 'formal' : 'informal';
    }

    // Generate server channels based on theme and sentiment
    generateChannels() {
        const baseChannels = ['general-chat', 'announcements', 'introductions'];
        const themeChannels = {
            gaming: ['game-discussion', 'lfg', 'patch-notes'],
            tech: ['code-help', 'tech-news', 'project-showcase'],
            music: ['track-sharing', 'collaborations', 'live-jams'],
            fitness: ['workout-logs', 'diet-tips', 'motivation'],
            community: ['events', 'support', 'off-topic'],
            education: ['study-groups', 'resources', 'q-and-a']
        };

        return [...baseChannels, ...(themeChannels[this.theme] || [])];
    }

    // Generate roles based on the formality of the server
    generateRoles() {
        const baseRoles = ['Admin', 'Moderator', 'Member'];
        const formalRoles = ['Senior Member', 'Junior Member', 'Distinguished'];
        const informalRoles = ['Super Fan', 'Rising Star', 'Active Member'];

        return this.formality === 'formal' ? [...baseRoles, ...formalRoles] : [...baseRoles, ...informalRoles];
    }

    // Generate server rules
    generateRules() {
        const baseRules = ['Be respectful', 'No spamming', 'Follow Discord guidelines'];
        const formalRules = ['Maintain professionalism', 'Use appropriate language'];
        const informalRules = ['Keep it chill', 'Have fun and be respectful'];

        return this.formality === 'formal' ? [...baseRules, ...formalRules] : [...baseRules, ...informalRules];
    }

    // Generate the complete server configuration
    generateServerConfig() {
        return {
            name: `${this.capitalize(this.keywords[0])} ${this.capitalize(this.theme)} Hub`,
            description: `A ${this.sentiment} ${this.formality} ${this.theme} server.`,
            channels: this.generateChannels(),
            roles: this.generateRoles(),
            rules: this.generateRules(),
            theme: this.theme,
            formality: this.formality,
            sentiment: this.sentiment,
        };
    }

    // Helper function to capitalize a word
    capitalize(word) {
        return word.charAt(0).toUpperCase() + word.slice(1);
    }
}

// API Server to generate Discord servers based on user prompts
const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);

    if (parsedUrl.pathname === '/api/testingsmai' && req.method === 'GET') {
        const prompt = parsedUrl.query.prompt;

        if (!prompt) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Missing prompt parameter' }));
            return;
        }

        const discordAI = new DiscordServerAI(prompt);
        const serverConfig = discordAI.generateServerConfig();

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(serverConfig, null, 2));
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
    }
});

// Start Server on Port 3000
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});