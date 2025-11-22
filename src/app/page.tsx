"use client";

import { useState } from "react";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleQuery = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setError("");
    setResponse("");

    try {
      const res = await fetch('/api/ai/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Handle specific error codes
        if (data.code === 'PROVIDER_NOT_ACKNOWLEDGED') {
          setError('Setting up provider... This is a one-time setup.');
          // Automatically acknowledge provider
          await fetch('/api/ai/setup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'acknowledgeProvider',
              providerAddress: process.env.NEXT_PUBLIC_PROVIDER_LLAMA_70B
            }),
          });
          setError('Provider setup complete. Please try again.');
        } else {
          setError(data.error || 'Failed to get response');
        }
        return;
      }

      setResponse(data.response);
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Ensura AI Assistant</h1>
      <p className="text-gray-600 mb-4">
        Powered by 0G Decentralized Compute Network
      </p>

      <div className="mb-4">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask about insurance coverage, risk assessment, or anything else..."
          className="border border-gray-300 rounded px-4 py-3 w-full h-32 resize-none"
          disabled={loading}
        />
      </div>

      <button
        onClick={handleQuery}
        disabled={loading || !prompt.trim()}
        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {loading ? 'Thinking...' : 'Ask AI'}
      </button>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded text-red-700">
          {error}
        </div>
      )}

      {response && (
        <div className="mt-6 p-6 bg-gray-50 border border-gray-200 rounded">
          <h2 className="text-xl font-semibold mb-3">Response:</h2>
          <p className="whitespace-pre-wrap text-gray-800">{response}</p>
        </div>
      )}
    </div>
  );
}