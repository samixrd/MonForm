import { GripVertical, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { FieldType, FormField } from "@/lib/types";

interface FieldEditorProps {
  field: FormField;
  onChange: (field: FormField) => void;
  onRemove: () => void;
}

const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: "text", label: "Text" },
  { value: "email", label: "Email" },
  { value: "url", label: "URL" },
];

/**
 * One row in the form builder's field list: label, type, and required —
 * all editable in place, no separate dialog. The type and required
 * controls are small toggle groups rather than a native <select>, to stay
 * in the same visual language as the rest of the product.
 */
export function FieldEditor({ field, onChange, onRemove }: FieldEditorProps) {
  return (
    <div className="flex flex-col gap-2.5 rounded-lg bg-ink/30 px-3 py-2.5 hairline sm:flex-row sm:items-center sm:gap-3">
      <div className="flex flex-1 items-center gap-2.5 min-w-0">
        <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground/50" aria-hidden="true" />
        <Input
          value={field.label}
          onChange={(event) => onChange({ ...field, label: event.target.value })}
          placeholder="Field label"
          aria-label="Field label"
          className="h-8 min-w-0 border-none bg-transparent px-1 focus-visible:ring-0"
        />
      </div>

      <div className="flex shrink-0 items-center gap-1.5 pl-6 sm:pl-0">
        <div
          className="flex items-center gap-0.5 rounded-md bg-ink/50 p-0.5 hairline"
          role="group"
          aria-label="Field type"
        >
          {FIELD_TYPES.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange({ ...field, type: option.value })}
              aria-pressed={field.type === option.value}
              className={cn(
                "rounded px-2 py-1 text-xs font-medium uppercase tracking-widest transition-colors",
                field.type === option.value
                  ? "bg-brass/15 text-brass"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => onChange({ ...field, required: !field.required })}
          aria-pressed={field.required}
          className={cn(
            "shrink-0 whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-medium tracking-wide transition-colors hairline",
            field.required ? "bg-brass/15 text-brass" : "text-muted-foreground hover:text-foreground",
          )}
        >
          Required
        </button>

        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${field.label || "field"}`}
          className="shrink-0 p-1 text-muted-foreground/60 transition-colors hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
