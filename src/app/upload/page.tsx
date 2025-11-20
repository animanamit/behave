import { Heading } from "@/components/ui/typography";
import { HomeLayout } from "@/components/layouts/home-layout";
import UploadCareerDoc from "@/components/upload-career-doc";

export default function UploadPage() {
  return (
    <HomeLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="border-b border-border pb-4">
          <Heading as="h2">Upload Documents</Heading>
        </div>
        <UploadCareerDoc />
      </div>
    </HomeLayout>
  );
}
