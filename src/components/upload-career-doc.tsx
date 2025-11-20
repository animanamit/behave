"use client";

import { authClient } from "@/lib/auth-client";
import { UploadCareerDocSchema } from "@/lib/zod-schemas";
import { useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { trpc } from "@/lib/trpc-client";
import { z } from "zod";
import { Upload, FileText, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Text } from "@/components/ui/typography";

const UploadFormSchema = z.object({
  customName: z.string().max(50, "File name must be less than 50 characters"),
});

const UploadCareerDoc = () => {
  const queryClient = useQueryClient();
  const [document, setDocument] = useState<File | null>(null);
  const { data: session } = authClient.useSession();
  const user = session?.user.name?.replaceAll(" ", "-");
  const userId = session?.user.id;

  const form = useForm({
    defaultValues: {
      customName: "",
    },
    validators: {
      onSubmit: UploadFormSchema,
    },
    onSubmit: async ({ value }) => {
      await handleFormSubmit(value);
    },
  });

  const presignedUrlMutation = trpc.files.getPresignedUrl.useMutation({
    onError: (error) => {
      toast.error(error.message || "Failed to generate upload URL");
    },
  });

  const saveFileMutation = trpc.files.saveFile.useMutation({
    onSuccess: () => {
      toast.success("File uploaded successfully!");
      if (userId) {
        queryClient.invalidateQueries({
          queryKey: ["trpc", "files", "getUserFiles"],
        });
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to save file metadata");
    },
  });

  const handleFormSubmit = async (formValues: { customName: string }) => {
    if (!document) {
      toast.error("Please select a file");
      return;
    }

    try {
      const baseFileName = formValues.customName.trim()
        ? formValues.customName.replaceAll(" ", "-")
        : document.name.replaceAll(" ", "-");

      const fileName = user ? `${user}-${baseFileName}` : baseFileName;
      const contentType = (document.type as any) || "application/pdf";

      const { uploadURL, s3Key } = await presignedUrlMutation.mutateAsync({
        fileName,
        contentType,
      });

      const uploadResponse = await fetch(uploadURL, {
        method: "PUT",
        body: document,
        headers: { "Content-Type": contentType },
      });

      if (!uploadResponse.ok) {
        const error = await uploadResponse.json();
        toast.error(error.error);
        return;
      }

      await saveFileMutation.mutateAsync({
        s3Key,
        fileName,
        fileSize: document.size,
        contentType,
        userId: userId!,
      });

      setDocument(null);
      form.reset();
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Unknown error");
      }
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
      className="space-y-6"
    >
      <div className="space-y-4">
        {/* Custom Dropzone UI */}
        <div className="relative group">
          <Card className="border-dashed border-2 border-border hover:border-primary transition-colors cursor-pointer bg-muted/20 relative overflow-hidden">
            <Input
              type="file"
              id="file-upload"
              accept=".txt,.pdf,.doc,.docx"
              onChange={(event) => {
                if (event.target.files) {
                  setDocument(event.target.files[0]);
                }
              }}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <CardContent className="flex flex-col items-center justify-center py-12 space-y-4 pointer-events-none">
              <div className="p-4 bg-background rounded-sm border border-border group-hover:scale-110 transition-transform duration-300">
                <Upload className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <div className="text-center space-y-1">
                <Text className="font-normal">
                  {document
                    ? "File Selected"
                    : "Click to upload or drag and drop"}
                </Text>
                <Text variant="muted">
                  {document
                    ? `${document.name} (${(document.size / 1024).toFixed(
                        2
                      )} KB)`
                    : "PDF, TXT, DOCX (Max 10MB)"}
                </Text>
              </div>
            </CardContent>
          </Card>

          {document && (
            <div className="absolute top-2 right-2 z-20">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-sm bg-background/80 hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setDocument(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* File Name Input */}
        <form.Field
          name="customName"
          children={(field) => (
            <div className="space-y-2">
              <label
                htmlFor={field.name}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                File Name (Optional)
              </label>
              <Input
                id={field.name}
                type="text"
                placeholder="e.g., Resume 2024"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                className="font-mono"
              />
              {field.state.meta.isTouched &&
                field.state.meta.errors.length > 0 && (
                  <p className="text-xs text-destructive font-mono mt-1">
                    {field.state.meta.errors.join(", ")}
                  </p>
                )}
            </div>
          )}
        />

        <Button
          type="submit"
          className="w-full"
          disabled={
            saveFileMutation.isPending ||
            presignedUrlMutation.isPending ||
            !document
          }
        >
          {saveFileMutation.isPending || presignedUrlMutation.isPending
            ? "Uploading..."
            : "Upload Document"}
        </Button>
      </div>
    </form>
  );
};

export default UploadCareerDoc;
