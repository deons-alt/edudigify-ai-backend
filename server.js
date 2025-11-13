import express from "express";
import cors from "cors";
import { GoogleGenerativeAI } from "@google/generative-ai"; // ✅ Use the stable SDK

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// ✅ Initialize Gemini client correctly
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

app.get("/", (req, res) => {
  res.send("✅ Edudigify AI Backend Running with Stable SDK");
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

    const model = genAI.getGenerativeModel({ model: "models/gemini-2.5-flash" });

    // ✅ Add timeout support (30 seconds)
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

    const result = await model.generateContent(
      { contents: [{ role: "user", parts: [{ text: prompt }] }] },
      { signal: controller.signal }
    );

    clearTimeout(timeout);

    const response = await result.response;
    const text = response.text();

    res.json({ lessonNote: text });
  } catch (error) {
    console.error("AI Generation Error:", error);

    if (error.name === "AbortError") {
      return res.status(504).json({ error: "AI request timed out. Please try again." });
    }

    res.status(500).json({
      error: "Failed to generate lesson note",
      details: error.message,
    });
  }
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));