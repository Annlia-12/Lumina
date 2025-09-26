import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_KEY || ""
});

export interface MatchingSuggestion {
  type: 'donation' | 'request' | 'volunteer';
  score: number;
  reason: string;
  itemId: string;
}

export interface ChatResponse {
  message: string;
  suggestions?: MatchingSuggestion[];
}

export async function generateSmartMatches(
  userProfile: any,
  availableItems: any[]
): Promise<MatchingSuggestion[]> {
  try {
    const prompt = `
    Analyze the user profile and available items to generate smart matching suggestions.
    
    User Profile:
    - Type: ${userProfile.userType}
    - Location: ${JSON.stringify(userProfile.location)}
    - Bio: ${userProfile.bio || 'No bio provided'}
    
    Available Items:
    ${JSON.stringify(availableItems, null, 2)}
    
    Generate matching suggestions with scores (0-1) and reasons. Consider:
    1. Geographic proximity
    2. User type compatibility 
    3. Item relevance to user's interests/needs
    4. Urgency levels
    5. Capacity matching
    
    Respond with JSON in this format:
    {
      "matches": [
        {
          "type": "donation",
          "score": 0.95,
          "reason": "High compatibility reason",
          "itemId": "item-id"
        }
      ]
    }
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are an AI matching expert for a donation and volunteering platform. Provide intelligent matching suggestions."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || '{"matches": []}');
    return result.matches || [];
  } catch (error) {
    console.error('Error generating smart matches:', error);
    return [];
  }
}

export async function chatWithAI(
  message: string,
  userContext?: any
): Promise<ChatResponse> {
  try {
    const contextPrompt = userContext ? `
    User Context:
    - Type: ${userContext.userType}
    - Location: ${userContext.location?.address || 'Not specified'}
    ` : '';

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: `You are Lumina's AI assistant, helping users with donations, volunteering, and community engagement. 
          Be helpful, empathetic, and provide actionable advice. ${contextPrompt}
          
          You can help with:
          - Finding donation opportunities
          - Suggesting volunteer activities
          - Connecting users with NGOs
          - Emergency disaster relief coordination
          - Donation tracking and impact measurement
          
          Always be encouraging and focus on the positive impact users can make.`
        },
        {
          role: "user",
          content: message
        }
      ],
    });

    return {
      message: response.choices[0].message.content || "I'm here to help you make a positive impact in your community!"
    };
  } catch (error) {
    console.error('Error in AI chat:', error);
    return {
      message: "I'm having trouble responding right now, but I'm here to help you connect with your community and make a difference!"
    };
  }
}

export async function analyzeImage(base64Image: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this donation/request image. Identify what items are shown, their condition, quantity, and any relevant details for donation matching."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ],
        },
      ],
      max_completion_tokens: 1024,
    });

    return response.choices[0].message.content || "Unable to analyze image";
  } catch (error) {
    console.error('Error analyzing image:', error);
    return "Image analysis temporarily unavailable";
  }
}

export async function generateDonationSuggestions(
  userType: string,
  location?: any
): Promise<string[]> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "Generate relevant donation suggestions based on user type and location. Respond with JSON array of suggestion strings."
        },
        {
          role: "user",
          content: `User type: ${userType}, Location: ${JSON.stringify(location)}`
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || '{"suggestions": []}');
    return result.suggestions || [];
  } catch (error) {
    console.error('Error generating donation suggestions:', error);
    return [];
  }
}
