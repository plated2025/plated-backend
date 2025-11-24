const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// AI Service for Plated App
class AIService {
  constructor() {
    this.model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    this.visionModel = genAI.getGenerativeModel({ model: 'gemini-pro-vision' });
  }

  /**
   * Generate recipe suggestions based on ingredients
   * @param {Array} ingredients - List of ingredients
   * @returns {Array} Recipe suggestions
   */
  async generateRecipes(ingredients) {
    try {
      const prompt = `As a professional chef, suggest 3 creative and delicious recipes using these ingredients: ${ingredients.join(', ')}.

For each recipe, provide:
1. Recipe name (creative and appetizing)
2. Cooking time (in minutes)
3. Difficulty level (Easy, Medium, or Hard)
4. Brief description (one sentence)

Format your response as JSON array like this:
[
  {
    "name": "Recipe Name",
    "time": "25min",
    "difficulty": "Easy",
    "description": "Brief description"
  }
]

Only return the JSON array, no additional text.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Parse JSON from response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      throw new Error('Failed to parse AI response');
    } catch (error) {
      console.error('AI Recipe Generation Error:', error);
      throw error;
    }
  }

  /**
   * Analyze food image and detect ingredients
   * @param {String} imageBase64 - Base64 encoded image
   * @returns {Object} Detected ingredients and recipe suggestions
   */
  async analyzeFoodImage(imageBase64) {
    try {
      // Remove data URL prefix if present
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      
      const imagePart = {
        inlineData: {
          data: base64Data,
          mimeType: 'image/jpeg'
        }
      };

      const prompt = `Analyze this food/ingredient image and:
1. List all visible ingredients or food items
2. Suggest 3 recipes that can be made with these items

Format response as JSON:
{
  "detected": ["ingredient1", "ingredient2", ...],
  "recipes": [
    {
      "name": "Recipe Name",
      "match": "95%",
      "time": "30min",
      "description": "Brief description"
    }
  ]
}

Only return JSON, no additional text.`;

      const result = await this.visionModel.generateContent([prompt, imagePart]);
      const response = await result.response;
      const text = response.text();
      
      // Parse JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      throw new Error('Failed to parse AI response');
    } catch (error) {
      console.error('AI Image Analysis Error:', error);
      throw error;
    }
  }

  /**
   * Analyze product/food package and provide nutritional insights
   * @param {String} imageBase64 - Base64 encoded product image
   * @returns {Object} Product analysis with nutrition data
   */
  async analyzeProduct(imageBase64) {
    try {
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      
      const imagePart = {
        inlineData: {
          data: base64Data,
          mimeType: 'image/jpeg'
        }
      };

      const prompt = `Analyze this food product package/label and provide:
1. Product name
2. Brand
3. Health score (0-100)
4. Key nutritional information
5. Health pros and cons
6. Healthier alternatives

Format as JSON:
{
  "productName": "Product Name",
  "brand": "Brand Name",
  "healthScore": 75,
  "servingSize": "50g",
  "calories": 200,
  "nutritionGrade": "B",
  "macros": {
    "protein": {"amount": 10, "unit": "g"},
    "carbs": {"amount": 25, "unit": "g"},
    "fat": {"amount": 8, "unit": "g"},
    "fiber": {"amount": 3, "unit": "g"}
  },
  "positives": ["High in protein", "Good source of fiber"],
  "concerns": ["High in sugar", "Contains additives"],
  "alternatives": [
    {"name": "Alternative 1", "healthScore": 85, "reason": "Lower sugar"},
    {"name": "Alternative 2", "healthScore": 82, "reason": "More natural"}
  ]
}

Only return JSON, no additional text.`;

      const result = await this.visionModel.generateContent([prompt, imagePart]);
      const response = await result.response;
      const text = response.text();
      
      // Parse JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      throw new Error('Failed to parse AI response');
    } catch (error) {
      console.error('AI Product Analysis Error:', error);
      throw error;
    }
  }

  /**
   * Get cooking tips and recommendations
   * @param {String} query - User's cooking question
   * @returns {String} AI response
   */
  async getCookingAdvice(query) {
    try {
      const prompt = `As a professional chef, provide helpful cooking advice for this question: "${query}"
      
Keep the response concise (2-3 sentences), practical, and friendly.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('AI Cooking Advice Error:', error);
      throw error;
    }
  }

  /**
   * Conversational AI assistant for food-related queries
   * @param {String} message - User's message
   * @param {Array} conversationHistory - Previous conversation (optional)
   * @returns {String} AI response
   */
  async chat(message, conversationHistory = []) {
    try {
      // Build context from conversation history
      let context = `You are a helpful AI food assistant for the Plated app. You can help users with:
- Finding recipes and food creators
- Nutrition advice and meal planning
- Fitness nutrition and workout meals
- Cooking tips and techniques
- Shopping lists and ingredient suggestions
- Diet recommendations

Be friendly, concise, and helpful. Format responses with line breaks for readability.

`;

      // Add conversation history for context
      if (conversationHistory.length > 0) {
        context += "Conversation history:\n";
        conversationHistory.forEach(msg => {
          context += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`;
        });
        context += "\n";
      }

      context += `User: ${message}\nAssistant:`;

      const result = await this.model.generateContent(context);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('AI Chat Error:', error);
      throw error;
    }
  }
}

module.exports = new AIService();
