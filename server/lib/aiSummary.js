export const summarizeMessages = async (messages) => {
    try {
        const conversation = messages
            .filter(m => m.text)
            .slice(-20)
            .map(m => `${m.senderId?.fullName || "User"}: ${m.text}`)
            .join("\n");

        if (!conversation.trim() || conversation.length < 50) {
            return "Not enough messages to summarize.";
        }

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
            },
            body: JSON.stringify({
                model: "llama-3.1-8b-instant", // ✅ use lighter active model
                max_tokens: 150,
                messages: [
                    {
                        role: "system",
                        content:
                            "You summarize student chats. Focus only on important points like deadlines, tasks, and decisions. Keep it short.",
                    },
                    {
                        role: "user",
                        content: `Summarize this chat in 2-3 short bullet points:\n\n${conversation}`,
                    },
                ],
            }), 
        });

        const data = await response.json();

        // ✅ better error handling
        if (!response.ok) {
            throw new Error(data.error?.message || "API Error");
        }

        return data.choices?.[0]?.message?.content || "Could not generate summary.";
    } catch (error) {
        console.error("Summary error:", error.message);

        // ✅ fallback (VERY IMPORTANT for demo)
        return "Summary unavailable right now.";
    }
};