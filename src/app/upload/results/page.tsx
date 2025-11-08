"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Download, Star } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface InterviewAnswer {
  id: number
  competency: string
  question: string
  situation: string
  task: string
  action: string
  result: string
  fullAnswer: string
}

export default function ResultsPage() {
  const router = useRouter()
  const [answers, setAnswers] = useState<InterviewAnswer[]>([])
  const [selectedAnswer, setSelectedAnswer] = useState<InterviewAnswer | null>(null)

  useEffect(() => {
    // Retrieve answers from sessionStorage
    const storedAnswers = sessionStorage.getItem("interviewAnswers")
    if (storedAnswers) {
      const parsed = JSON.parse(storedAnswers)
      setAnswers(parsed)
      if (parsed.length > 0) {
        setSelectedAnswer(parsed[0])
      }
    } else {
      // Redirect back if no data
      router.push("/upload")
    }
  }, [router])

  const handleDownload = () => {
    const content = answers
      .map((answer, index) => {
        return `
ANSWER ${index + 1}
Competency: ${answer.competency}
Question: ${answer.question}

SITUATION:
${answer.situation}

TASK:
${answer.task}

ACTION:
${answer.action}

RESULT:
${answer.result}

${"=".repeat(80)}
`
      })
      .join("\n")

    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "interview-answers.txt"
    a.click()
    URL.revokeObjectURL(url)
  }

  if (answers.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading results...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Interview Answers Generated</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {answers.length} behavioral interview answers ready for practice
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleDownload}>
                <Download className="w-4 h-4 mr-2" />
                Download All
              </Button>
              <Link href="/upload">
                <Button variant="ghost">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {/* Left Panel - Answers List */}
          <div className="lg:col-span-1">
            <Card className="shadow-lg sticky top-6">
              <CardHeader>
                <CardTitle className="text-lg">All Answers ({answers.length})</CardTitle>
                <CardDescription>Click to view details</CardDescription>
              </CardHeader>
              <CardContent className="max-h-[calc(100vh-200px)] overflow-y-auto">
                <div className="space-y-2">
                  {answers.map((answer) => (
                    <button
                      key={answer.id}
                      onClick={() => setSelectedAnswer(answer)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selectedAnswer?.id === answer.id
                          ? "bg-teal-500/10 border-teal-500/50"
                          : "bg-card border-border hover:border-teal-500/30"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="text-xs font-medium text-teal-400">#{answer.id}</span>
                        <Badge variant="outline" className="text-xs">
                          {answer.competency}
                        </Badge>
                      </div>
                      <p className="text-sm text-foreground line-clamp-2">{answer.question}</p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Selected Answer Details */}
          <div className="lg:col-span-2">
            {selectedAnswer && (
              <Card className="shadow-xl">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-teal-500/20 text-teal-400 border-teal-500/30">
                          {selectedAnswer.competency}
                        </Badge>
                        <span className="text-xs text-muted-foreground">Answer #{selectedAnswer.id}</span>
                      </div>
                      <CardTitle className="text-xl leading-relaxed">{selectedAnswer.question}</CardTitle>
                    </div>
                    <Button variant="ghost" size="icon">
                      <Star className="w-5 h-5" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* STAR Format Sections */}
                  <div className="space-y-4">
                    {/* Situation */}
                    <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-lg">
                      <h3 className="text-sm font-semibold text-blue-400 mb-2 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-xs">
                          S
                        </span>
                        SITUATION
                      </h3>
                      <p className="text-sm text-foreground leading-relaxed">{selectedAnswer.situation}</p>
                    </div>

                    {/* Task */}
                    <div className="p-4 bg-purple-500/5 border border-purple-500/20 rounded-lg">
                      <h3 className="text-sm font-semibold text-purple-400 mb-2 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-xs">
                          T
                        </span>
                        TASK
                      </h3>
                      <p className="text-sm text-foreground leading-relaxed">{selectedAnswer.task}</p>
                    </div>

                    {/* Action */}
                    <div className="p-4 bg-teal-500/5 border border-teal-500/20 rounded-lg">
                      <h3 className="text-sm font-semibold text-teal-400 mb-2 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-teal-500/20 flex items-center justify-center text-xs">
                          A
                        </span>
                        ACTION
                      </h3>
                      <p className="text-sm text-foreground leading-relaxed">{selectedAnswer.action}</p>
                    </div>

                    {/* Result */}
                    <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-lg">
                      <h3 className="text-sm font-semibold text-green-400 mb-2 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center text-xs">
                          R
                        </span>
                        RESULT
                      </h3>
                      <p className="text-sm text-foreground leading-relaxed">{selectedAnswer.result}</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <Link href="/practice" className="flex-1">
                      <Button className="w-full bg-teal-600 hover:bg-teal-700">Practice This Answer</Button>
                    </Link>
                    <Button variant="outline" className="flex-1 bg-transparent">
                      Copy to Clipboard
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
