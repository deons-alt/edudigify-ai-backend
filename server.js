import express from "express";
import cors from "cors";
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

app.get("/", (req, res) => {
  res.send("✅ Edudigify AI Backend Running (Stable SDK)");
});

app.post("/generateLessonNote", async (req, res) => {
  try {
    const { classLevel, subject, topic, week, term } = req.body;

    if (!classLevel || !subject || !topic) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const prompt = `
Generate a structured lesson note for:
- Class: ${classLevel}
- Subject: ${subject}
- Topic: ${topic}
- Term: ${term || "Current Term"}
- Week: ${week || "Not specified"}

Include these sections clearly:
1. Objectives
2. Lesson Procedure / Content
3. Evaluation & Assignment
`;

    // Correct model name (SDK format, NOT REST format)
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash", 
    });

    // 30-second timeout controller
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    const result = await model.generateContent(
      {
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
      },
      { signal: controller.signal }
    );

    clearTimeout(timeout);

    const response = result.response;
    const text = response.text();

    res.json({ lessonNote: text });
  } catch (error) {
    console.error("AI Generation Error:", error);

    // Handle timeouts
    if (error.name === "AbortError") {
      return res.status(504).json({
        error:
          "AI request timed out. (Likely due to Render free-tier cold start). Please try again.",
      });
    }

    res.status(500).json({
      error: "Failed to generate lesson note",
      details: error.message,
    });
  }
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
