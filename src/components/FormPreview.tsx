import { Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { FormField } from "@/lib/types";

interface FormPreviewProps {
  name: string;
  fields: FormField[];
}

/**
 * Mirrors the applicant-facing /form/[id] page (see SubmissionForm) field
 * for field, so a form owner never has to guess how their form reads.
 * Inputs are read-only — this shows exactly what will render, it doesn't
 * accept input of its own.
 */
export function FormPreview({ name, fields }: FormPreviewProps) {
  return (
    <div className="space-y-3">
      <Badge className="mx-auto w-fit sm:mx-0">
        <Eye className="h-3 w-3" />
        Live preview
      </Badge>

      <div className="space-y-1 text-center sm:text-left">
        <h2 className="truncate font-display text-xl font-medium">
          {name.trim() || "Untitled form"}
        </h2>
        <p className="text-xs text-muted-foreground">
          Your responses are encrypted in your browser and only readable by the form owner.
        </p>
      </div>

      <Card>
        <CardContent className="space-y-5 pt-6">
          {fields.length === 0 ? (
            <p className="text-sm text-muted-foreground">Add a field to see it here.</p>
          ) : (
            fields.map((field) => (
              <div key={field.id} className="space-y-2">
                <Label className="block truncate">
                  {field.label.trim() || "Untitled field"}
                  {field.required && <span className="text-brass"> *</span>}
                </Label>
                <Input
                  readOnly
                  tabIndex={-1}
                  value=""
                  placeholder={
                    field.type === "email" ? "name@example.com" : field.type === "url" ? "https://" : "Response"
                  }
                />
              </div>
            ))
          )}

          <Button variant="seal" className="w-full" disabled tabIndex={-1}>
            Encrypt &amp; submit onchain
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
