import express from "express";
import cors from "cors";
import { GoogleGenerativeAI } from "@google/generative-ai"; // Stable SDK

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

app.get("/", (req, res) => {
  res.send("✅ Edudigify AI Backend Running with Stable SDK");
});

// ======================
//   AI ENDPOINT
// ======================
app.post("/generateLessonNote", async (req, res) => {
  try {
    const { classLevel, subject, topic, week, term } = req.body;

    if (!classLevel || !subject || !topic) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const prompt = `
Generate a structured Nigerian-style lesson note for:

Class: ${classLevel}
Subject: ${subject}
Topic: ${topic}
Term: ${term || "Current Term"}
Week: ${week || "Not specified"}

Include:

1. Objectives
2. Introduction
3. Lesson Procedure
4. Student Activities
5. Teacher Activities
6. Evaluation Questions
7. Assignment
`;

    // Retry + timeout settings
    const MAX_RETRIES = 3;
    const TIMEOUT_MS = 60000; // 60 seconds

    async function callGeminiWithRetry(retry = 0) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

        const model = genAI.getGenerativeModel({
          model: "models/gemini-2.5-flash",
        });

        const result = await model.generateContent({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          signal: controller.signal,
        });

        clearTimeout(timeout);
        return result;
      } catch (err) {
        console.error(`Retry ${retry + 1} failed:`, err.message);

        if (retry < MAX_RETRIES) {
          console.log("Retrying...");
          return await callGeminiWithRetry(retry + 1);
        }

        throw err;
      }
    }

    // Execute Gemini
    const result = await callGeminiWithRetry();
    const output = result.response.text();

    res.json({ lessonNote: output });

  } catch (error) {
    console.error("AI Generation Error:", error);

    if (error.name === "AbortError") {
      return res.status(504).json({
        error: "AI request timeout (free backend cold start). Please try again.",
      });
    }

    res.status(500).json({
      error: "Failed to generate lesson note",
      details: error.message,
    });
  }
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
