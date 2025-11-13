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

    // ✅ Configure the model
    // Note: Use "gemini-1.5-flash" for stability, or "gemini-2.0-flash-exp" if you have access to the preview.
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // ✅ Generate Content
    const result = await model.generateContent(prompt);
    const response = await result.response;

    // ✅ Fix: text() is a FUNCTION, not a property
    const text = response.text(); 
    
    res.json({ lessonNote: text });

  } catch (error) {
    console.error("AI Generation Error:", error);
    
    // Handle safety blocks explicitly
    if (error.message && error.message.includes("SAFETY")) {
        return res.status(400).json({ error: "Content blocked by safety filters." });
    }

    res.status(500).json({
      error: "Failed to generate lesson note",
      details: error.message,
    });
  }
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));