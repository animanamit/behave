"use client";

import { authClient } from "@/lib/auth-client";
import { PresignedURLRequestSchema } from "@/lib/zod-schemas";
import { useState } from "react";

import { toast } from "sonner";
import z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { SaveFileRequest } from "@/lib/zod-schemas";

const UploadCareerDoc = () => {
  const queryClient = useQueryClient();
  const [document, setDocument] = useState<File | null>(null);
  const { data: session } = authClient.useSession();
  const user = session?.user.name?.replaceAll(" ", "-");
  const userId = session?.user.id;

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
      toast("Successfully added file metadata to database!");
      if (userId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.files.byUser(userId),
        });
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to save file metadata");
    },
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    console.log(document);

    if (!document) {
      toast("Please select a file");
      return;
    }

    try {
      const fileName = user
        ? user + "-" + document.name.replaceAll(" ", "-")
        : document.name;
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
        toast(error.error);
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
        toast(error.error);
        return;
      }

      toast("Successfully uploaded file!");

      // Add this:
      const mutationResult = await mutation.mutateAsync({
        s3Key,
        fileName,
        fileSize: document.size,
        contentType,
        userId: userId!,
      });

      setDocument(null);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast(error.errors[0].message);
      } else if (error instanceof Error) {
        toast(error.message);
      } else {
        toast("Unknown error");
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="file-upload">Upload your Career Document</label>
      <input
        type="file"
        id="file-upload"
        accept=".txt,.pdf,.doc,.docx"
        onChange={(event) => {
          if (event.target.files) {
            setDocument(event.target.files[0]);
          }
        }}
      />
      <button type="submit">Submit</button>
    </form>
  );
};

export default UploadCareerDoc;
