"use client"

import type React from "react"

import { useState } from "react"
import { Upload, FileText, Loader2, ArrowRight, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function UploadPage() {
  const router = useRouter()
  const [textInput, setTextInput] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [uploadMethod, setUploadMethod] = useState<"text" | "file">("text")

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("[v0] File input changed", e.target.files)
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      console.log("[v0] File selected:", selectedFile.name, selectedFile.size, "bytes")
      setFile(selectedFile)
      setUploadMethod("file")
    }
  }

  const triggerFileInput = () => {
    console.log("[v0] Triggering file input click")
    document.getElementById("file-upload")?.click()
  }

  const handleSubmit = async () => {
    if (!textInput && !file) {
      alert("Please provide either text input or upload a file")
      return
    }

    setIsProcessing(true)

    try {
      let content = textInput

      // If file is selected, read its content
      if (file && uploadMethod === "file") {
        console.log("[v0] Reading file content...")
        content = await file.text()
        console.log("[v0] File content length:", content.length)
      }

      // Call API to generate answers
      const response = await fetch("/api/generate-answers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate answers")
      }

      const data = await response.json()

      // Store results in sessionStorage and navigate to results page
      sessionStorage.setItem("interviewAnswers", JSON.stringify(data.answers))
      router.push("/upload/results")
    } catch (error) {
      console.error("[v0] Error generating answers:", error)
      alert("Failed to generate answers. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Interview Coach AI</h1>
              <p className="text-sm text-muted-foreground mt-1">Upload your career document</p>
            </div>
            <Link href="/">
              <Button variant="ghost">Back to Dashboard</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl">Upload Career Document</CardTitle>
              <CardDescription>
                Provide your resume or career experiences to generate up to 50 behavioral interview answers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Upload Method Tabs */}
              <div className="flex gap-2 p-1 bg-muted rounded-lg">
                <button
                  onClick={() => setUploadMethod("text")}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    uploadMethod === "text"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Text Input
                </button>
                <button
                  onClick={() => setUploadMethod("file")}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    uploadMethod === "file"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  File Upload
                </button>
              </div>

              {/* Text Input */}
              {uploadMethod === "text" && (
                <div className="space-y-3">
                  <label className="text-sm font-medium text-foreground">Paste your resume or career experiences</label>
                  <Textarea
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Paste your resume, career highlights, or project descriptions here..."
                    className="min-h-[300px] bg-background border-border focus:border-teal-500 transition-colors"
                  />
                  <p className="text-xs text-muted-foreground">
                    Include your work experiences, projects, achievements, and responsibilities
                  </p>
                </div>
              )}

              {/* File Upload */}
              {uploadMethod === "file" && (
                <div className="space-y-3">
                  <label className="text-sm font-medium text-foreground">Upload your career document</label>
                  <div
                    onClick={triggerFileInput}
                    className={`border-2 border-dashed rounded-lg p-12 text-center transition-all cursor-pointer ${
                      file ? "border-teal-500 bg-teal-500/10" : "border-border hover:border-teal-500/50 bg-muted/20"
                    }`}
                  >
                    <input
                      type="file"
                      id="file-upload"
                      accept=".txt,.pdf,.doc,.docx"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <div className="flex flex-col items-center gap-4">
                      <div
                        className={`w-16 h-16 rounded-full flex items-center justify-center ${
                          file ? "bg-teal-500/20" : "bg-teal-500/10"
                        }`}
                      >
                        {file ? (
                          <CheckCircle2 className="w-8 h-8 text-teal-500" />
                        ) : (
                          <Upload className="w-8 h-8 text-teal-500" />
                        )}
                      </div>
                      <div>
                        <p className="text-lg font-medium text-foreground mb-1">
                          {file ? file.name : "Click to choose a file"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {file ? `${(file.size / 1024).toFixed(2)} KB` : "PDF, DOCX, TXT (Max 10MB)"}
                        </p>
                      </div>
                      <Button variant="outline" className="mt-2 bg-transparent pointer-events-none" type="button">
                        <FileText className="w-4 h-4 mr-2" />
                        {file ? "Change File" : "Browse Files"}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-4">
                <Button
                  onClick={handleSubmit}
                  disabled={isProcessing || (!textInput && !file)}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white h-12 text-base"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Generating Interview Answers...
                    </>
                  ) : (
                    <>
                      Generate Interview Answers
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>
              </div>

              {/* Info Box */}
              <div className="p-4 bg-teal-500/10 border border-teal-500/20 rounded-lg">
                <p className="text-sm text-foreground">
                  <strong>What happens next?</strong> Our AI will analyze your career document and generate up to 50
                  behavioral interview answers in STAR format (Situation, Task, Action, Result).
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
