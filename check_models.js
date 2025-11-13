/*
 * This script fetches all available Gemini models for your API key
 * and filters them to show only the ones that can be used for
 * generating content (like in your app).
 */

// Uses Node.js's built-in fetch
async function listAvailableModels() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error(
      "\n❌ Error: GEMINI_API_KEY environment variable is not set."
    );
    console.log(
      "Please set it before running the script. For example:\n"
    );
    console.log(
      "  (On Mac/Linux)   export GEMINI_API_KEY='your_api_key_here'"
    );
    console.log(
      "  (On Windows CMD) set GEMINI_API_KEY=your_api_key_here"
    );
    console.log(
      "  (On PowerShell)  $env:GEMINI_API_KEY='your_api_key_here'\n"
    );
    return;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

  console.log("Fetching available models from Google AI...\n");

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `API call failed with status ${response.status}: ${response.statusText}`
      );
    }

    const data = await response.json();
    const models = data.models || [];

    if (models.length === 0) {
      console.log("No models found for this API key.");
      return;
    }

    // Filter for models that support the "generateContent" method
    const supportedModels = models.filter((model) =>
      model.supportedGenerationMethods.includes("generateContent")
    );

    if (supportedModels.length === 0) {
      console.log(
        "Found models, but none support 'generateContent'. This is unusual."
      );
      return;
    }

    console.log(
      "✅ Success! Here are the models your API key can use for 'generateContent':\n"
    );
    
    // Sort to put "flash" models first as they are good for your use case
    supportedModels.sort((a, b) => {
        if (a.name.includes("flash") && !b.name.includes("flash")) return -1;
        if (!a.name.includes("flash") && b.name.includes("flash")) return 1;
        return a.name.localeCompare(b.name);
    });

    supportedModels.forEach((model) => {
      console.log(`- ${model.name}`);
      console.log(`    (Display Name: ${model.displayName})\n`);
    });

    console.log(
      "\nSuggestion: Use one of these model names in your server.js file."
    );
    console.log(
      "For example: 'models/gemini-1.5-flash-001' (if listed)"
    );
  } catch (error) {
    console.error("Error fetching models:", error.message);
    if (error.message.includes("403")) {
        console.error("This often means the API key is invalid or has restrictions.");
    }
  }
}

listAvailableModels();