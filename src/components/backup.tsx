"use client";

import React, { useState } from "react";

const HomePage = () => {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleResponse = async () => {
    setLoading(true);
    setError("");
    setResponse("");
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer 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`,
          "HTTP-Referer": "http://localhost:3000/", // Optional
          "X-Title": "OpenRouter", // Optional
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "mistralai/mistral-7b-instruct",
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
        }),
      });
      const data = await res.json();
      if (
        data.choices &&
        data.choices[0] &&
        data.choices[0].message &&
        data.choices[0].message.content
      ) {
        setResponse(data.choices[0].message.content);
      } else {
        setError("No response from model.");
      }
    } catch (err) {
      setError("Error fetching from OpenRouter.");
      console.error("Error fetching from OpenRouter:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-10  border flex flex-col items-center justify-center min-h-screen gap-4">
      <input
        type="text"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Enter your prompt..."
        className="border p-2 rounded-md w-full mb-2"
      />
      <button
        onClick={handleResponse}
        className="bg-blue-500 text-white p-2 rounded-md w-full"
        disabled={loading || !prompt.trim()}
      >
        {loading ? "Loading..." : "Get Response"}
      </button>
      {response && (
        <div className="mt-4 p-3 bg-gray-100 rounded w-full whitespace-pre-line">
          {response}
        </div>
      )}
      {error && <div className="mt-2 text-red-500">{error}</div>}
    </div>
  );
};

export default HomePage;
