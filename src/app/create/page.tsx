import { FormBuilder } from "@/components/FormBuilder";

export default function CreateFormPage() {
  return (
    <div className="container max-w-5xl py-16">
      <div className="mb-8 space-y-1.5 text-center sm:text-left">
        <h1 className="font-display text-3xl font-medium">Create a form</h1>
        <p className="text-sm text-muted-foreground">
          Applicants will encrypt their responses to your wallet before submitting onchain.
        </p>
      </div>
      <FormBuilder />
    </div>
  );
}
