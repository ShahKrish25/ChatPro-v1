from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from groq import Groq
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
CORS(app)

# Store chat history per session (key: session_id, value: list of messages)
chat_histories = {}

# Get API key from environment variable
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY environment variable is not set")

client = Groq(api_key=GROQ_API_KEY)

def chat_with_groq(messages, model="meta-llama/llama-3-8b-instruct"):
    try:
        response = client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=0.7,
            max_completion_tokens=1024,
            top_p=0.9,
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"Groq SDK Error: {str(e)}"

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    session_id = data.get('session_id', 'default')
    model = data.get('model', 'llama-3.3-70b-versatile')
    prompt = data.get('prompt')

    if not prompt:
        return jsonify({"error": "Prompt is required"}), 400

    # Initialize chat history for this session if it doesn't exist
    if session_id not in chat_histories:
        chat_histories[session_id] = []

    # Add the user's message to the history
    chat_histories[session_id].append({"role": "user", "content": prompt})

    # Prepare the full conversation history for the Groq API
    messages = chat_histories[session_id]

    # Get response from Groq API
    response_text = chat_with_groq(messages, model)

    # Add the assistant's response to the history
    chat_histories[session_id].append({"role": "assistant", "content": response_text})

    return jsonify({
        "response_text": response_text
    })

@app.route('/api/playground', methods=['POST'])
def playground():
    data = request.json
    task = data.get('task')
    input_text = data.get('input')
    model = data.get('model', 'llama3-8b-8192')

    if not input_text:
        return jsonify({"error": "Input text is required"}), 400

    if not task:
        return jsonify({"error": "Task type is required"}), 400

    formatted_prompt = format_prompt(task, input_text)
    response = chat_with_groq([{"role": "user", "content": formatted_prompt}], model)
    return jsonify({"response": response})

def format_prompt(task, input_text):
    prompts = {
        'summarize': f"Please provide a clear and concise summary of the following text:\n\n{input_text}",
        'explain-code': f"""Explain the coding problem: {input_text} in a highly structured, beginner-friendly, and visually enriched manner.
        🔥 Format your response strictly as follows:
        1️⃣ Problem Statement 🎯 → Explain the problem in simple terms with clear input/output examples.
        2️⃣ Understanding the Core Concept 💡 → Break down the key ideas/concepts needed to solve the problem. Use small examples to build intuition.
        4️⃣ Well-Commented Code 💻 → Provide a fully explained code solution in [java]. Ensure:
        Proper indentation & readability
        5️⃣ Dry Run Table 📊 → Show how the algorithm works step-by-step using a table format with relevant columns.
        6️⃣ Edge Cases 🛑 → Cover tricky cases that may cause bugs or incorrect results.
        7️⃣ Complexity Analysis ⏳ → Clearly explain the time (O(?)) and space (O(?)) complexity.
        8️⃣ Key Takeaways 📌 → Summarize the most important learning points for easy revision.
        🎨 Ensure the explanation is clean, structured, and engaging. Use bold text, bullet points, and emojis to enhance clarity!""",
        'creative-writing': f"Please help with the following creative writing task:\n\n{input_text}"
    }
    return prompts.get(task, input_text)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 10000))
    app.run(host='0.0.0.0', port=port)