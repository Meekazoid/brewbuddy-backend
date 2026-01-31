import express from 'express';
import cors from 'cors';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Coffee Companion Backend is running!' });
});

// Analyze coffee image endpoint
app.post('/api/analyze-coffee', async (req, res) => {
  try {
    const { imageData, mediaType } = req.body;

    if (!imageData) {
      return res.status(400).json({ error: 'No image data provided' });
    }

    console.log('Analyzing coffee image...');

    // Call Claude API
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType || 'image/jpeg',
                data: imageData,
              },
            },
            {
              type: 'text',
              text: `Analysiere diese Kaffeepackung und extrahiere folgende Informationen. Antworte NUR mit einem JSON-Objekt, ohne jeglichen anderen Text, Markdown-Formatierung oder Backticks:

{
  "name": "Name des Kaffees/der Farm",
  "origin": "Land und Region",
  "process": "Aufbereitungsmethode",
  "cultivar": "Kaffeevarietät(en)",
  "altitude": "Höhe in masl (nur die Zahl)",
  "roaster": "Name des Rösters",
  "tastingNotes": "Geschmacksnoten als kommagetrennte Liste"
}

Wichtig:
- Wenn eine Information nicht sichtbar ist, nutze "Unbekannt"
- Bei altitude nur die Zahl angeben, z.B. "1650" statt "1650 masl"
- Sei präzise und extrahiere nur die sichtbaren Informationen`,
            },
          ],
        },
      ],
    });

    // Extract text response
    const textContent = message.content.find((block) => block.type === 'text');
    if (!textContent) {
      throw new Error('No text response from Claude');
    }

    let responseText = textContent.text.trim();
    
    // Remove markdown code blocks if present
    responseText = responseText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    
    // Try to find JSON object
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('Could not find JSON in response:', responseText);
      throw new Error('Invalid response format from Claude');
    }

    const coffeeData = JSON.parse(jsonMatch[0]);
    
    console.log('Coffee analyzed successfully:', coffeeData.name);

    res.json({
      success: true,
      data: coffeeData,
    });
  } catch (error) {
    console.error('Error analyzing coffee:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to analyze coffee image',
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Coffee Companion Backend running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
});
