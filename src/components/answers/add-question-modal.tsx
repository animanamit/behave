"use client";

import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Plus, Sparkles } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { trpc } from "@/lib/trpc-client";
import { CreateSingleQuestionSchema } from "@/lib/zod-schemas";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Text } from "@/components/ui/typography";

const COMPETENCY_OPTIONS = [
  "Leadership",
  "Teamwork",
  "Problem Solving",
  "Communication",
  "Adaptability",
  "Conflict Resolution",
  "Initiative",
  "Time Management",
  "Decision Making",
  "Customer Focus",
];

interface AddQuestionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddQuestionModal({ open, onOpenChange }: AddQuestionModalProps) {
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();
  const userId = session?.user.id;

  // Fetch user's uploaded files for the document selector
  const filesQuery = trpc.files.getUserFiles.useQuery(
    { userId: userId ?? "" },
    { enabled: !!userId }
  );

  const createAnswerMutation = trpc.answers.createAnswer.useMutation({
    onSuccess: () => {
      toast.success("Question added and script generated!");
      queryClient.invalidateQueries({
        queryKey: ["trpc", "answers", "getUserAnswers"],
      });
      onOpenChange(false);
      form.reset();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to generate script");
    },
  });

  const form = useForm({
    defaultValues: {
      question: "",
      fileId: "",
      competency: "",
    },
    validators: {
      onSubmit: CreateSingleQuestionSchema,
    },
    onSubmit: async ({ value }) => {
      await createAnswerMutation.mutateAsync({
        question: value.question,
        fileId: value.fileId,
        competency: value.competency || undefined,
      });
    },
  });

  const hasFiles = filesQuery.data && filesQuery.data.length > 0;
  const isSubmitting = createAnswerMutation.isPending;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Question
          </SheetTitle>
          <SheetDescription>
            Add a behavioral interview question and generate a personalized STAR script.
          </SheetDescription>
        </SheetHeader>

        {!hasFiles ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center space-y-4">
            <div className="p-4 bg-muted rounded-full">
              <Sparkles className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <Text className="font-medium">No documents uploaded</Text>
              <Text variant="muted" className="text-sm">
                Upload a resume or career document first to give the AI context about your experience.
              </Text>
            </div>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
            className="space-y-6 p-4"
          >
            {/* Document Selector */}
            <form.Field
              name="fileId"
              children={(field) => (
                <div className="space-y-2">
                  <label
                    htmlFor={field.name}
                    className="text-sm font-medium leading-none"
                  >
                    Select Document *
                  </label>
                  <select
                    id={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Choose a document...</option>
                    {filesQuery.data?.map((file) => (
                      <option key={file.id} value={file.id}>
                        {file.fileName}
                      </option>
                    ))}
                  </select>
                  <Text variant="muted" className="text-xs">
                    This document will provide context for generating your personalized answer.
                  </Text>
                  {field.state.meta.isTouched &&
                    field.state.meta.errors.length > 0 && (
                      <p className="text-xs text-destructive mt-1">
                        {field.state.meta.errors.join(", ")}
                      </p>
                    )}
                </div>
              )}
            />

            {/* Question Input */}
            <form.Field
              name="question"
              children={(field) => (
                <div className="space-y-2">
                  <label
                    htmlFor={field.name}
                    className="text-sm font-medium leading-none"
                  >
                    Interview Question *
                  </label>
                  <Textarea
                    id={field.name}
                    placeholder="e.g., Tell me about a time you led a team through a difficult project"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    rows={3}
                    className="resize-none"
                  />
                  {field.state.meta.isTouched &&
                    field.state.meta.errors.length > 0 && (
                      <p className="text-xs text-destructive mt-1">
                        {field.state.meta.errors.join(", ")}
                      </p>
                    )}
                </div>
              )}
            />

            {/* Competency Selector */}
            <form.Field
              name="competency"
              children={(field) => (
                <div className="space-y-2">
                  <label
                    htmlFor={field.name}
                    className="text-sm font-medium leading-none"
                  >
                    Competency (Optional)
                  </label>
                  <select
                    id={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Let AI determine...</option>
                    {COMPETENCY_OPTIONS.map((comp) => (
                      <option key={comp} value={comp}>
                        {comp}
                      </option>
                    ))}
                  </select>
                  <Text variant="muted" className="text-xs">
                    The AI will infer the competency if not specified.
                  </Text>
                </div>
              )}
            />

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || !form.state.values.fileId || !form.state.values.question}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Script...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Script
                </>
              )}
            </Button>

            {isSubmitting && (
              <Text variant="muted" className="text-xs text-center">
                This may take 5-10 seconds...
              </Text>
            )}
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
}
