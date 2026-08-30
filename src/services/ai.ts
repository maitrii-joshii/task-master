import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

/**
 * Generate a task description using Groq AI
 */
export const generateTaskDescription = async (title: string): Promise<string> => {
  const response = await groq.chat.completions.create({
    model: "openai/gpt-oss-20b",
    messages: [
      {
        role: "system",
        content:
          "You are an assistant for a task management application. Generate clear, concise, and actionable task descriptions.",
      },
      {
        role: "user",
        content: `Generate a useful task description for this task title:

"${title}"

The description should:
- Clearly explain what needs to be done
- Mention the expected outcome
- Be concise
- Be suitable for a professional task management application

Return only the task description.`,
      },
    ],
    temperature: 0.5,
    max_tokens: 300,
  });

  const description = response.choices[0]?.message?.content?.trim();

  if (!description) {
    throw new Error("AI failed to generate a task description");
  }

  return description;
};
