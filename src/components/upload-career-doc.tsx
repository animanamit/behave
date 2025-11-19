"use client";

import { authClient } from "@/lib/auth-client";
import {
  PresignedURLRequestSchema,
  UploadCareerDocSchema,
} from "@/lib/zod-schemas";
import { useState } from "react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { SaveFileRequest } from "@/lib/zod-schemas";
import { useForm } from "@tanstack/react-form";

import { z } from "zod";

import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// Schema for just the customName field

const UploadFormSchema = z.object({
  customName: z.string().max(50, "File name must be less than 50 characters"),
});

const UploadCareerDoc = () => {
  const queryClient = useQueryClient();
  const [document, setDocument] = useState<File | null>(null);
  const { data: session } = authClient.useSession();
  const user = session?.user.name?.replaceAll(" ", "-");
  const userId = session?.user.id;

  // Initialize the form with useForm hook
  // defaultValues: sets initial form state
  // validators: runs validation with Zod schema on form submit
  // onSubmit: called only if validation passes
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

  // Mutation for saving file metadata to database
  const mutation = useMutation<{ success: boolean }, Error, SaveFileRequest>({
    mutationFn: async (data: SaveFileRequest) => {
      const response = await fetch("/api/add-file-to-db", {
        method: "POST",
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Failed to save file" }));
        throw new Error(
          errorData.error || `Failed to save file: ${response.statusText}`
        );
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success("Successfully added file metadata to database!");
      if (userId) {
        // Invalidate the query so the file list refetches
        queryClient.invalidateQueries({
          queryKey: queryKeys.files.byUser(userId),
        });
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to save file metadata");
    },
  });

  // Main form submission handler
  // This runs when form.handleSubmit() is called
  // It validates the file separately (not in schema)

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
      const contentType = document.type || "application/octet-stream";

      const payload = {
        fileName: fileName,
        contentType: contentType,
      };

      const validatedPayload = PresignedURLRequestSchema.parse(payload);
      const response = await fetch("/api/get-s3-presigned-url", {
        method: "POST",
        body: JSON.stringify(validatedPayload),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error);
        return;
      }

      const { uploadURL, s3Key } = await response.json();

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

      toast.success("Successfully uploaded file to S3!");

      await mutation.mutateAsync({
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
        // Trigger form submission, which validates and calls onSubmit
        form.handleSubmit();
      }}
      className="space-y-6"
    >
      {/* File Input Field */}
      <Field>
        <FieldLabel htmlFor="file-upload">
          Upload your Career Document
        </FieldLabel>
        <FieldDescription>
          Supported formats: .txt, .pdf, .doc, .docx
        </FieldDescription>
        <Input
          type="file"
          id="file-upload"
          accept=".txt,.pdf,.doc,.docx"
          onChange={(event) => {
            // Store the selected file in state
            // This is separate from the form state
            if (event.target.files) {
              setDocument(event.target.files[0]);
            }
          }}
          className="block w-full text-sm"
        />
        {document && (
          <p className="text-sm text-muted-foreground mt-2">
            Selected: {document.name} ({(document.size / 1024).toFixed(2)} KB)
          </p>
        )}
      </Field>

      {/* Custom Name Field - Connected to form state */}
      <form.Field
        name="customName"
        children={(field) => {
          // Check if field has validation errors and has been touched
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid;

          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>File Name (optional)</FieldLabel>
              <FieldDescription>
                Give your file a custom name for easier organization
              </FieldDescription>
              <Input
                id={field.name}
                name={field.name}
                type="text"
                placeholder="e.g., Resume 2024"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                aria-invalid={isInvalid}
              />
              {/* Show error message if validation failed */}
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          );
        }}
      />

      {/* Submit Button */}
      <Button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? "Uploading..." : "Upload"}
      </Button>
    </form>
  );
};

export default UploadCareerDoc;
