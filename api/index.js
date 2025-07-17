const express = require('express');
const cors = require('cors');
const { ImageAnnotatorClient } = require('@google-cloud/vision');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const visionClient = new ImageAnnotatorClient();
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
const geminiModel = genAI.getGenerativeModel({ model: "gemini-pro" });


app.get("/api/health", (req, res) => {
    console.log("Health check endpoint was hit!");
    res.status(200).json({ status: "ok", time: new Date().toISOString() });
  });

app.post('/api/recognize', async (req, res) => {
  const { image, location } = req.body;

  if (!image) {
    return res.status(400).json({ message: 'Image data is required.' });
  }

  try {
    const imageBuffer = Buffer.from(image, 'base64');
    const [landmarkResult] = await visionClient.landmarkDetection({ image: { content: imageBuffer } });
    const landmarks = landmarkResult.landmarkAnnotations;

    let detectedLocationName = 'an unknown beautiful place';
    let detectedCoordinates = location ? `${location.latitude},${location.longitude}` : '0,0';

    if (landmarks.length > 0 && landmarks[0].description) {
      detectedLocationName = landmarks[0].description;
      if (landmarks[0].locations && landmarks[0].locations.length > 0 && landmarks[0].locations[0].latLng) {
        const { latitude, longitude } = landmarks[0].locations[0].latLng;
        detectedCoordinates = `${latitude},${longitude}`;
      }
    }
    
    const prompt = `You are a creative tour guide. Your task is to generate a JSON object for the location: "${detectedLocationName}". The JSON output must strictly follow this structure: {"title": "A Creative Title about ${detectedLocationName}", "story": "A compelling short story (2-3 paragraphs max) about the location.", "funFacts": ["fact 1", "fact 2", "fact 3"], "relatedQuests": [{"id": 1, "title": "Engaging Quest Title", "description": "Short quest description.", "difficulty": "Medium", "reward": 150}]}. Do not include any text outside of the JSON object.`;
    
    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    let storyData;
    try {
        storyData = JSON.parse(text);
    } catch(e) {
        console.error("Failed to parse Gemini JSON response:", text);
        return res.status(500).json({ message: 'AI returned invalid data format.' });
    }

    const fullResponse = {
        ...storyData,
        location: detectedLocationName,
        coordinates: detectedCoordinates,
        readTime: "5 min",
        likes: Math.floor(Math.random() * 500),
        comments: Math.floor(Math.random() * 100),
        isLiked: false,
    };
    
    return res.status(200).json(fullResponse);

  } catch (error) {
    console.error('Error processing image:', error.message);
    return res.status(500).json({ message: 'Error on server', details: error.message });
  }
});

module.exports = app;