"use client";
import { Upload, FileText, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

import { authClient } from "@/lib/auth-client";
import SignOutButton from "@/components/auth/sign-out-button";
import UploadCareerDoc from "@/components/upload-career-doc";

const experiences = [
  {
    id: 1,
    title: "Led cross-functional team to deliver product ahead of schedule",
    status: "STAR Ready",
  },
  {
    id: 2,
    title: "Resolved critical production bug affecting 10K+ users",
    status: "STAR Ready",
  },
  {
    id: 3,
    title: "Mentored junior developer to improve code quality by 40%",
    status: "STAR Ready",
  },
  {
    id: 4,
    title: "Implemented new testing framework reducing bugs by 60%",
    status: "STAR Ready",
  },
  {
    id: 5,
    title: "Negotiated with stakeholders to align on project priorities",
    status: "STAR Ready",
  },
];

export default function DashboardPage() {
  // Mock data for parsed experiences
  const { data, isPending, error } = authClient.useSession();

  console.log(data);

  console.log("lets go");

  if (isPending) {
    return <div>Loading...</div>;
  }

  if (!data?.session) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        Not authenticated
        <Button>
          <Link href="/sign-in">Sign In</Link>
        </Button>
      </div>
    );
  }

  if (error) {
    console.log(error);
    return <div>Error!</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4">
          <h1 className="text-2xl font-semibold text-foreground">
            Welcome {data?.user.name}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Practice behavioral interviews with AI-powered feedback
          </p>
        </div>
        <div>
          <SignOutButton />
          <UploadCareerDoc />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-2 gap-6 max-w-7xl mx-auto">
          {/* Left Panel - Document Upload */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl">Document Upload</CardTitle>
              <CardDescription>
                Upload your career document to generate STAR stories
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-border rounded-lg p-12 text-center hover:border-teal-500/50 transition-colors cursor-pointer bg-muted/20">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-teal-500/10 flex items-center justify-center">
                    <Upload className="w-8 h-8 text-teal-500" />
                  </div>
                  <div>
                    <p className="text-lg font-medium text-foreground mb-1">
                      Upload Career Document
                    </p>
                    <p className="text-sm text-muted-foreground">
                      PDF, DOCX, TXT
                    </p>
                  </div>
                  <Button variant="outline" className="mt-2 bg-transparent">
                    <FileText className="w-4 h-4 mr-2" />
                    Choose File
                  </Button>
                </div>
              </div>

              {/* Status Indicator */}
              <div className="mt-6 flex items-center gap-2 p-4 bg-teal-500/10 border border-teal-500/20 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-teal-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    Parsing Complete
                  </p>
                  <p className="text-xs text-muted-foreground">
                    5 STAR experiences extracted
                  </p>
                </div>
                <Badge
                  variant="secondary"
                  className="bg-teal-500/20 text-teal-400 border-teal-500/30"
                >
                  Ready for Analysis
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Right Panel - Experiences List */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl">
                Parsed STAR Experiences (5/5)
              </CardTitle>
              <CardDescription>
                AI-generated stories from your career document
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {experiences.map((exp) => (
                  <div
                    key={exp.id}
                    className="p-4 bg-card border border-border rounded-lg hover:border-teal-500/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm text-foreground leading-relaxed flex-1">
                        {exp.title}
                      </p>
                      <Badge
                        variant="outline"
                        className="bg-teal-500/10 text-teal-400 border-teal-500/30 shrink-0"
                      >
                        {exp.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Call to Action */}
        <div className="max-w-7xl mx-auto mt-8">
          <Card className="shadow-xl bg-linear-to-br from-teal-500/10 to-blue-500/10 border-teal-500/20">
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-semibold text-foreground mb-2">
                Ready to Practice?
              </h2>
              <p className="text-muted-foreground mb-6">
                Start your first practice session with AI-guided coaching
              </p>
              <Link href="/practice">
                <Button
                  size="lg"
                  className="bg-teal-600 hover:bg-teal-700 text-white px-8"
                >
                  Start Practice Session
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
