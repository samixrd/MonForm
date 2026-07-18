import { FileQuestion } from "lucide-react";
import { SubmissionForm } from "@/components/SubmissionForm";
import { EmptyState } from "@/components/EmptyState";
import { getForm } from "@/lib/api";

/** Public applicant-facing page for a single form. */
export default async function FormPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const form = await getForm(Number(id));

  if (!form) {
    return (
      <div className="container max-w-md py-24">
        <EmptyState
          icon={FileQuestion}
          title="Form not found"
          description="This link doesn't point to a form. Check it for typos and try again."
        />
      </div>
    );
  }

  return (
    <div className="container max-w-lg py-16">
      <div className="mb-8 space-y-1.5 text-center">
        <h1 className="font-display text-3xl font-medium">{form.name}</h1>
        <p className="text-sm text-muted-foreground">
          Your responses are encrypted in your browser and only readable by the form owner.
        </p>
      </div>
      <SubmissionForm form={form} />
    </div>
  );
}
