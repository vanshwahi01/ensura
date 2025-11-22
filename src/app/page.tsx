"use client";

import { useState } from "react";

export default function Home() {
  const [textValue, setTextValue] = useState("");

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Text Input</h1>
      <input
        type="text"
        value={textValue}
        onChange={(e) => setTextValue(e.target.value)}
        placeholder="Enter text here..."
        className="border border-gray-300 rounded px-4 py-2 w-full max-w-md"
      />
      <p className="mt-4 text-gray-600">
        Current value: {textValue}
      </p>
    </div>
  );
}
