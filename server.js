import express from "express";
import cors from "cors";
import { GoogleGenAI } from "@google/genai";  // ✅ correct export for stable SDK

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// ✅ Initialize Gemini client
const ai = new GoogleGenAI({
  apiKey: GEMINI_API_KEY,
});

app.get("/", (req, res) => {
  res.send("✅ Edudigify AI Backend Running with Google GenAI SDK");
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

    // ✅ use gemini-2.0-flash or gemini-2.5-flash depending on support
    const result = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });

    const text = result.response.text;
    res.json({ lessonNote: text });
  } catch (error) {
    console.error("AI Generation Error:", error);
    res.status(500).json({
      error: "Failed to generate lesson note",
      details: error.message,
    });
  }
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
