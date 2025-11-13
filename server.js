import express from "express";
import cors from "cors";
import axios from "axios";

const app = express();
app.use(cors());
app.use(express.json());

// === GEMINI CONFIG ===
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-1.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1/models/${GEMINI_MODEL}:generateContent`;



// === ROUTE ===
app.post("/generateLessonNote", async (req, res) => {
  try {
    const { subject, topic, classLevel, week, term } = req.body;

    const prompt = `
Generate a detailed lesson note for:
Class: ${classLevel}
Subject: ${subject}
Topic: ${topic}
Week: ${week || "N/A"}, Term: ${term || "N/A"}

Include sections:
1. Lesson Objectives
2. Materials/Teaching Aids
3. Lesson Development/Content
4. Summary
5. Evaluation/Assignment
Format the result as clear text.
`;

    const response = await axios.post(
  GEMINI_URL,
  {
    contents: [{ parts: [{ text: prompt }] }],
  },
  {
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": GEMINI_API_KEY, // ✅ API key now passed in header
    },
  }
);

const output =
  response.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
  "No response generated.";

res.json({ lessonNote: output });
} catch (error) {
  console.error("AI Generation Error:", error.response?.data || error.message);
  res.status(500).json({
    error: "Failed to generate lesson note",
    details: error.response?.data || error.message,
  });
}

});

app.get("/", (req, res) => res.send("✅ Edudigify AI Backend Running"));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
