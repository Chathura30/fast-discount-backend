const Groq = require("groq-sdk");
const db = require("../models/db");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

exports.analyzeProduct = async (req, res) => {
  const productId = req.params.id;

  try {
    const [rows] = await db.promise().query("SELECT * FROM products WHERE id = ?", [
      productId,
    ]);

    if (!rows.length) {
      return res.json({
        success: false,
        message: "Product not found",
      });
    }

    const product = rows[0];

    const prompt = `
You are a professional food scientist and nutrition expert.

PRODUCT DATA:
- Name: ${product.name}
- Description: ${product.description}
- Ingredients: ${product.ingredients || "Not provided"}
- Expire Date: ${product.expire_date}

TASK:
1. Determine if the ingredients are healthy/unhealthy.
2. Check risk related to expiry date.
3. Provide a simple explanation.
4. Generate a HEALTH SCORE between 0 and 100.

STRICT FORMAT:
Health Score: <number>
Analysis: <your explanation>
    `;

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    });

    const aiText = completion.choices[0].message.content;

    const scoreMatch = aiText.match(/Health Score:\s*(\d+)/i);
    const healthScore = scoreMatch ? parseInt(scoreMatch[1]) : null;

    res.json({
      success: true,
      product,
      health_score: healthScore,
      ai_analysis: aiText,
    });
  } catch (err) {
    console.error("AI ERROR:", err);
    res.json({
      success: false,
      message: "AI request failed",
      error: err.message,
    });
  }
};
