"use client";
import { Mistral } from "@mistralai/mistralai";
import { useState } from "react";
import ReactMarkdown from "react-markdown";

const HomePage = () => {
  const [base64Pdf, setBase64Pdf] = useState<string | null>(null);
  const [ocrMarkdown, setOcrMarkdown] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const apiKey = process.env.NEXT_PUBLIC_OCR_API_KEY;
  const client = new Mistral({ apiKey: apiKey });
  const [selectedFileName, setSelectedFileName] = useState<string>("");
  const [fileType, setFileType] = useState<string | null>(null);

  // Handle file input change
  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf" && !file.type.startsWith("image/")) {
      alert("Please select a PDF or image file.");
      return;
    }
    setSelectedFileName(file.name);
    setFileType(file.type);

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data:*/*;base64, prefix if present
      const base64 = result.split(",")[1] || result;
      setBase64Pdf(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleClick = async () => {
    if (!base64Pdf || !fileType) {
      alert("Please select a PDF or image file first.");
      return;
    }
    setLoading(true);
    try {
      let ocrResponse;
      if (fileType === "application/pdf") {
        ocrResponse = await client.ocr.process({
          model: "mistral-ocr-latest",
          document: {
            type: "document_url",
            documentUrl: "data:application/pdf;base64," + base64Pdf,
          },
          includeImageBase64: true,
        });
      } else if (fileType.startsWith("image/")) {
        ocrResponse = await client.ocr.process({
          model: "mistral-ocr-latest",
          document: {
            type: "image_url",
            imageUrl: `data:${fileType};base64,${base64Pdf}`,
          },
          includeImageBase64: true,
        });
      } else {
        throw new Error("Unsupported file type.");
      }
      const allMarkdown =
        ocrResponse?.pages
          ?.map((page: { markdown: string }) => page.markdown)
          .join("\n\n") || "No markdown found.";
      setOcrMarkdown(allMarkdown);
      console.log(ocrResponse);
    } catch (error) {
      console.error("Error processing OCR:", error);
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadMarkdown = () => {
    downloadFile(ocrMarkdown, "ocr-result.md", "text/markdown");
  };

  const handleDownloadText = () => {
    // Remove markdown formatting for plain text
    const plainText = ocrMarkdown.replace(/[#_*`>\\-]/g, "");
    downloadFile(plainText, "ocr-result.txt", "text/plain");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100">
      <div className="w-full max-w-xl bg-white shadow-lg rounded-xl p-8 flex flex-col items-center">
        <h1 className="text-2xl font-bold mb-6 text-blue-700">
          Mestral OCR 
        </h1>
        <label className="w-full flex flex-col items-center px-4 py-6 bg-blue-100 text-blue-700 rounded-lg shadow-md tracking-wide uppercase border border-blue-300 cursor-pointer hover:bg-blue-200 transition mb-4">
          <span className="mt-2 text-base leading-normal">
            {selectedFileName
              ? `Selected: ${selectedFileName}`
              : "Select a PDF or image file"}
          </span>
          <input
            type="file"
            accept="application/pdf,image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
        <button
          onClick={handleClick}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-md transition mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!base64Pdf || loading}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg
                className="animate-spin h-5 w-5 mr-2 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                ></path>
              </svg>
              Loading...
            </span>
          ) : (
            "Extract Text"
          )}
        </button>
        {/* Response container */}
        <div className="w-full mt-4 p-4 border rounded bg-gray-50 min-h-[200px] max-h-96 overflow-y-auto prose prose-blue">
          <ReactMarkdown>{ocrMarkdown}</ReactMarkdown>
        </div>
        <div className="flex gap-4 mt-2 w-full">
          <button
            onClick={handleDownloadMarkdown}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-md transition"
            disabled={!ocrMarkdown}
          >
            Download as Markdown
          </button>
          <button
            onClick={handleDownloadText}
            className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-md transition"
            disabled={!ocrMarkdown}
          >
            Download as Text
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
