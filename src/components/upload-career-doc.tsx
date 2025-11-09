"use client";

import { authClient } from "@/lib/auth-client";
import { useState } from "react";

import { toast } from "sonner";

const UploadCareerDoc = () => {
  const [document, setDocument] = useState<File | null>(null);

  const { data: session } = authClient.useSession();
  const user = session?.user.name?.replaceAll(" ", "-");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log(document);
    if (document) {
      try {
        const fileName = user
          ? user + "-" + document.name.replaceAll(" ", "-")
          : document.name;
        const contentType = document.type;

        const body = {
          fileName: fileName,
          contentType: contentType,
        };

        const response = await fetch("/api/get-s3-presigned-url", {
          method: "POST",
          body: JSON.stringify(body),
        });
        const { uploadURL } = await response.json();

        const uploadResponse = await fetch(uploadURL, {
          method: "PUT",
          body: document,
          headers: {
            "Content-Type": document.type,
          },
        });

        if (uploadResponse.ok) {
          toast("Successfully uploaded file!");
        }
      } catch (error) {
        if (error instanceof Error) {
          toast(error.message);
        } else toast("Unknown Error Encountered");
      }
    } else {
      toast("You haven't selected a file!");
      return;
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
