const express = require('express');
const cors = require('cors');
const { ImageAnnotatorClient } = require('@google-cloud/vision');
const { OpenAI } = require('openai');

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const visionClient = new ImageAnnotatorClient();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
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

    let detectedLocationName = 'An unknown beautiful place';
    let detectedCoordinates = `${location.latitude},${location.longitude}`;

    if (landmarks.length > 0 && landmarks[0].description) {
      detectedLocationName = landmarks[0].description;
      if (landmarks[0].locations && landmarks[0].locations.length > 0) {
          const { latitude, longitude } = landmarks[0].locations[0].latLng;
          detectedCoordinates = `${latitude},${longitude}`;
      }
    } else {
        // Если Vision не нашел, используем обратный геокодинг (будущая фича)
        // или оставляем GPS как есть.
    }
    
    const prompt = `You are a creative historian and tour guide. Tell a compelling short story (3-4 paragraphs) about the location: "${detectedLocationName}".
    After the story, provide a separate list of 3 "Fun Facts" about it. 
    Then, create one engaging "Quest" related to this place.
    Format the response as a JSON object with keys: "title", "location", "coordinates", "story", "funFacts" (array of strings), "relatedQuests" (array of objects, each with id, title, description, difficulty, reward), "readTime" (string like "5 minutes"), "likes" (number), "comments" (number).
    The location name should be "${detectedLocationName}".`;
    
    const aiResponse = await openai.chat.completions.create({
        model: "gpt-4-turbo",
        response_format: { type: "json_object" },
        messages: [{ role: "user", content: prompt }]
    });
    
    const storyData = JSON.parse(aiResponse.choices[0].message.content);

    return res.status(200).json({
      ...storyData,
      coordinates: detectedCoordinates, // Перезаписываем координаты точными данными
      location: detectedLocationName // И точным названием
    });

  } catch (error) {
    console.error('Error processing image:', error);
    return res.status(500).json({ message: 'Internal Server Error', details: error.message });
  }
});

module.exports = app;