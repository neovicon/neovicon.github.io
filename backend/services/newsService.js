const NewsAPI = require('newsapi');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { Post, Category, User } = require('../models');

const newsApi = new NewsAPI(process.env.NEWS_API_KEY);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

class NewsService {
  constructor() {
    this.model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    this.categories = [
      { name: 'Technology', keywords: ['technology', 'tech', 'ai', 'software', 'internet'] },
      { name: 'Politics', keywords: ['politics', 'government', 'election', 'policy'] },
      { name: 'Business', keywords: ['business', 'economy', 'finance', 'market', 'stock'] },
      { name: 'Sports', keywords: ['sports', 'football', 'basketball', 'soccer', 'olympics'] },
      { name: 'Health', keywords: ['health', 'medical', 'medicine', 'covid', 'vaccine'] },
      { name: 'Science', keywords: ['science', 'research', 'study', 'discovery', 'climate'] },
      { name: 'Entertainment', keywords: ['entertainment', 'celebrity', 'movie', 'music', 'tv'] },
      { name: 'World', keywords: ['international', 'global', 'world', 'foreign'] }
    ];
  }

  async fetchAndProcessNews() {
    try {
      console.log('Starting news fetch and processing...');
      
      // Get admin user
      const adminUser = await User.findOne({ role: 'admin' });
      if (!adminUser) {
        throw new Error('Admin user not found');
      }

      const processedCount = { success: 0, failed: 0 };
      
      // Fetch news for each category
      for (const category of this.categories) {
        try {
          await this.processCategoryNews(category, adminUser._id, processedCount);
          // Add delay between API calls to respect rate limits
          await this.delay(2000);
        } catch (error) {
          console.error(`Error processing ${category.name} news:`, error);
          processedCount.failed++;
        }
      }

      console.log(`News processing completed. Success: ${processedCount.success}, Failed: ${processedCount.failed}`);
      return processedCount;

    } catch (error) {
      console.error('Error in fetchAndProcessNews:', error);
      throw error;
    }
  }

  async processCategoryNews(category, adminUserId, processedCount) {
    try {
      // Get category from database
      const dbCategory = await Category.findOne({ name: category.name });
      if (!dbCategory) {
        console.log(`Category ${category.name} not found in database`);
        return;
      }

      // Fetch latest news for this category
      const response = await newsApi.v2.everything({
        language: 'en',
        pageSize: 5, // Limit to avoid overwhelming
        q: category.keywords.join(' OR '),
        sortBy: 'publishedAt'
      });

      if (!response.articles || response.articles.length === 0) {
        console.log(`No articles found for category: ${category.name}`);
        return;
      }

      // Process each article
      for (const article of response.articles) {
        try {
          // Check if article already exists
          const existingPost = await Post.findOne({ 
            originalSource: article.url,
            isNews: true 
          });

          if (existingPost) {
            console.log(`Article already exists: ${article.title}`);
            continue;
          }

          // Skip articles without proper content
          if (!article.title || !article.description || article.title === '[Removed]') {
            console.log('Skipping article with missing content');
            continue;
          }

          // Process with AI
          const processedArticle = await this.processWithAI(article, category.name);
          
          if (processedArticle) {
            // Create post in database
            await this.createNewsPost(processedArticle, dbCategory._id, adminUserId, article);
            processedCount.success++;
            console.log(`Successfully processed: ${processedArticle.title}`);
          } else {
            processedCount.failed++;
          }

        } catch (error) {
          console.error(`Error processing individual article:`, error);
          processedCount.failed++;
        }
      }

    } catch (error) {
      console.error(`Error in processCategoryNews for ${category.name}:`, error);
      throw error;
    }
  }

  async processWithAI(article, categoryName) {
    try {
      const prompt = `
You are an AI news editor for Intelixir, a social news platform. Your task is to rewrite and summarize news articles to make them unique, engaging, and platform-appropriate.

Original Article:
Title: ${article.title}
Description: ${article.description}
Content: ${article.content || article.description}
Category: ${categoryName}

Please provide:
1. A new, engaging title (max 100 characters) that captures the essence but uses different wording
2. A concise, well-written summary (200-400 words) that:
   - Covers the key points
   - Is completely rewritten in your own words
   - Is engaging and informative
   - Avoids direct copying
   - Maintains factual accuracy
3. 3-5 relevant tags (single words, comma-separated)

Format your response exactly like this:
TITLE: [Your new title here]
SUMMARY: [Your summary here]
TAGS: [tag1, tag2, tag3, tag4, tag5]
`;

      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      // Parse the AI response
      const titleMatch = text.match(/TITLE: (.+)/);
      const summaryMatch = text.match(/SUMMARY: ([\s\S]+?)(?=TAGS:|$)/);
      const tagsMatch = text.match(/TAGS: (.+)/);

      if (!titleMatch || !summaryMatch) {
        console.error('AI response format invalid');
        return null;
      }

      const processedArticle = {
        title: titleMatch[1].trim().substring(0, 200),
        content: summaryMatch[1].trim(),
        tags: tagsMatch ? tagsMatch[1].split(',').map(tag => tag.trim().toLowerCase()) : [],
        image: article.urlToImage,
        originalUrl: article.url,
        publishedAt: new Date(article.publishedAt)
      };

      return processedArticle;

    } catch (error) {
      console.error('AI processing error:', error);
      return null;
    }
  }

  async createNewsPost(processedArticle, categoryId, adminUserId, originalArticle) {
    try {
      const post = new Post({
        title: processedArticle.title,
        content: processedArticle.content,
        author: adminUserId,
        type: processedArticle.image ? 'image' : 'news',
        image: processedArticle.image,
        categories: [categoryId],
        tags: processedArticle.tags,
        isNews: true,
        originalSource: originalArticle.url,
        publishedAt: processedArticle.publishedAt,
        link: {
          url: originalArticle.url,
          title: originalArticle.title,
          description: originalArticle.description,
          image: originalArticle.urlToImage
        }
      });

      await post.save();
      return post;

    } catch (error) {
      console.error('Error creating news post:', error);
      throw error;
    }
  }

  async fetchBreakingNews() {
    try {
      // Fetch breaking news (last 2 hours)
      const twoHoursAgo = new Date();
      twoHoursAgo.setHours(twoHoursAgo.getHours() - 2);

      const response = await newsApi.v2.everything({
        language: 'en',
        sortBy: 'publishedAt',
        from: twoHoursAgo.toISOString(),
        pageSize: 10
      });

      return response.articles || [];

    } catch (error) {
      console.error('Error fetching breaking news:', error);
      return [];
    }
  }

  async searchNews(query, category = null, page = 1, pageSize = 10) {
    try {
      const searchParams = {
        q: query,
        language: 'en',
        sortBy: 'relevancy',
        page: page,
        pageSize: pageSize
      };

      if (category) {
        // Add category-specific keywords to search
        const categoryData = this.categories.find(cat => 
          cat.name.toLowerCase() === category.toLowerCase()
        );
        if (categoryData) {
          searchParams.q += ` AND (${categoryData.keywords.join(' OR ')})`;
        }
      }

      const response = await newsApi.v2.everything(searchParams);
      return {
        articles: response.articles || [],
        totalResults: response.totalResults || 0
      };

    } catch (error) {
      console.error('Error searching news:', error);
      return { articles: [], totalResults: 0 };
    }
  }

  async categorizeContent(content) {
    try {
      const prompt = `
Analyze the following content and determine which category it best fits into:
Categories: Technology, Politics, Business, Sports, Health, Science, Entertainment, World

Content: ${content}

Respond with just the category name that best matches this content.
`;

      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const category = response.text().trim();

      // Find matching category
      const matchedCategory = await Category.findOne({ 
        name: { $regex: new RegExp(category, 'i') }
      });

      return matchedCategory ? [matchedCategory._id] : [];

    } catch (error) {
      console.error('Error categorizing content:', error);
      return [];
    }
  }

  async generateTags(content) {
    try {
      const prompt = `
Generate 3-5 relevant tags for the following content. Tags should be single words, lowercase, and comma-separated.

Content: ${content}

Respond with just the tags, comma-separated.
`;

      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const tags = response.text().trim().split(',').map(tag => tag.trim().toLowerCase());

      return tags.filter(tag => tag.length > 0 && tag.length <= 20);

    } catch (error) {
      console.error('Error generating tags:', error);
      return [];
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new NewsService();