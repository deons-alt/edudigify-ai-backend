import express from "express";
import cors from "cors";
import axios from "axios";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Base URL
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
const MAX_RETRIES = 3;

app.get("/", (req, res) => {
  res.send("✅ Edudigify AI Backend Running (Direct API Mode)");
});

app.post("/generateLessonNote", async (req, res) => {
  const { classLevel, subject, topic, week, term } = req.body;

  if (!classLevel || !subject || !topic) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const prompt = `
Generate a structured lesson note for:
- Class: ${classLevel}
- Subject: ${subject}
- Topic: ${topic}
- Week: ${week || "Not specified"}
- Term: ${term || "Current Term"}

Include:
1. Objectives
2. Lesson Procedure
3. Evaluation & Assignment
`;

  async function callGoogleAPI(attempt = 1) {
    try {
      const response = await axios.post(
        GEMINI_URL,
        {
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        },
        {
          timeout: 60000, // 60 seconds
        }
      );

      return response.data;
    } catch (err) {
      console.log(`Retry ${attempt} failed:`, err.message);

      if (attempt < MAX_RETRIES) {
        return await callGoogleAPI(attempt + 1);
      }

      throw err;
    }
  }

  try {
    const data = await callGoogleAPI();
    const output =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No response generated.";

    res.json({ lessonNote: output });
  } catch (error) {
    console.error("AI ERROR:", error.response?.data || error.message);

    if (error.code === "ECONNABORTED") {
      return res.status(504).json({
        error: "AI request timeout. Please try again.",
      });
    }

    res.status(500).json({
      error: "Failed to generate lesson note",
      details: error.response?.data || error.message,
    });
  }
});

app.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT}`)
);
