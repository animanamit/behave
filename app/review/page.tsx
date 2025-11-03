import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Play, ArrowLeft, CheckCircle2, AlertCircle, TrendingUp } from "lucide-react"
import Link from "next/link"

export default function ReviewPage() {
  const sessions = [
    { id: 1, date: "Jan 15, 2025", question: "Tell me about a time you handled conflict..." },
    { id: 2, date: "Jan 14, 2025", question: "Describe a challenging project you led..." },
    { id: 3, date: "Jan 13, 2025", question: "How do you prioritize competing deadlines..." },
  ]

  const suggestions = [
    "Maintain eye contact during the STAR Action section to convey confidence",
    "Rethink the opening sentence for stronger impact and immediate engagement",
    "Slow down pacing in the middle section - you rushed through key details",
    "Add more specific metrics to strengthen the Result section",
    "Your body language was excellent - keep that natural energy",
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4 flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-foreground">Session Review</h1>
            <p className="text-sm text-muted-foreground mt-1">Watch your recording and review AI feedback</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {/* Left Panel - Video Playback */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-lg">
              <CardContent className="p-6">
                {/* Video Player Placeholder */}
                <div className="relative aspect-video bg-muted rounded-lg overflow-hidden mb-4">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Button size="lg" className="bg-teal-600 hover:bg-teal-700 text-white rounded-full w-20 h-20 p-0">
                      <Play className="w-10 h-10 fill-current ml-1" />
                    </Button>
                  </div>
                  {/* Video Controls Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/90 to-transparent p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-1 flex-1 bg-muted rounded-full">
                        <div className="h-full w-1/3 bg-teal-500 rounded-full" />
                      </div>
                      <span className="text-xs text-muted-foreground font-mono">01:23 / 03:45</span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Question:</span> Tell me about a time you handled
                  conflict with a teammate.
                </p>
              </CardContent>
            </Card>

            {/* Session History */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">Recent Practice Sessions</CardTitle>
                <CardDescription>Your last 3 practice sessions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {sessions.map((session) => (
                    <button
                      key={session.id}
                      className="w-full p-3 bg-card border border-border rounded-lg hover:border-teal-500/50 transition-colors text-left"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{session.question}</p>
                          <p className="text-xs text-muted-foreground mt-1">{session.date}</p>
                        </div>
                        <Play className="w-4 h-4 text-muted-foreground shrink-0" />
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - AI Feedback */}
          <div className="lg:col-span-1">
            <Card className="shadow-lg sticky top-6">
              <CardHeader className="bg-teal-500/10 border-b border-teal-500/20">
                <CardTitle className="text-lg text-foreground">AI Interview Coach Feedback</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {/* Score Badges */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                      <span className="text-sm font-medium text-foreground">Content Fidelity</span>
                    </div>
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30">8/10</Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-yellow-500" />
                      <span className="text-sm font-medium text-foreground">Pacing</span>
                    </div>
                    <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Too Fast</Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-blue-500" />
                      <span className="text-sm font-medium text-foreground">Confidence</span>
                    </div>
                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Strong</Badge>
                  </div>
                </div>

                {/* Actionable Suggestions */}
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-3">Key Takeaways</h4>
                  <ul className="space-y-3">
                    {suggestions.map((suggestion, index) => (
                      <li key={index} className="flex gap-3 text-sm leading-relaxed">
                        <span className="text-teal-500 shrink-0 mt-0.5">•</span>
                        <span className="text-muted-foreground">{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Action Button */}
                <div className="mt-6 pt-6 border-t border-border">
                  <Link href="/practice">
                    <Button className="w-full bg-teal-600 hover:bg-teal-700 text-white">
                      Practice Another Question
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
