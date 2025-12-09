const { onCall } = require("firebase-functions/v2/https");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.generateAI = onCall({ 
    secrets: ["GEMINI_API_KEY"], 
    cors: true 
}, async (request) => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(request.data.prompt);
        const response = result.response.text();
        return { success: true, data: response };
    } catch (error) {
        return { success: false, error: error.message };
    }
});