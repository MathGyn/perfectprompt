"use client";

import { forwardRef } from "react";
import type { Skill, SkillField } from "@/lib/skills";
import type { Answers } from "@/lib/types";
import ChipGroup from "./ChipGroup";
import ImageUploader, { type ImageUploaderHandle } from "./ImageUploader";

/**
 * Painel de refino — os campos secundários (tudo menos o "conceito", que é o
 * campo central no hero). Selects viram grupos de chips; nada de dropdown.
 */
const PromptForm = forwardRef<
  ImageUploaderHandle,
  {
    skill: Skill;
    answers: Answers;
    onAnswer: (name: string, value: string | boolean) => void;
  }
>(function PromptForm({ skill, answers, onAnswer }, ref) {
  const fields = skill.fields.filter((f) => f.name !== "concept");

  return (
    <div className="space-y-5">
      {fields.map((field) => (
        <Field
          key={field.name}
          field={field}
          value={answers[field.name]}
          onChange={(v) => onAnswer(field.name, v)}
        />
      ))}

      {skill.supportsImages && (
        <div className="pt-1">
          <ImageUploader key={skill.id} ref={ref} />
        </div>
      )}
    </div>
  );
});

export default PromptForm;

function Field({
  field,
  value,
  onChange,
}: {
  field: SkillField;
  value: string | boolean | undefined;
  onChange: (v: string | boolean) => void;
}) {
  const id = `f-${field.name}`;

  // Selects → chips
  if (field.type === "select" && field.options) {
    return (
      <ChipGroup
        label={field.label}
        help={field.help}
        options={field.options}
        value={(value as string) ?? ""}
        onChange={onChange}
        allowCustom={field.allowCustom}
      />
    );
  }

  const label = (
    <label htmlFor={id} className="text-sm font-medium text-ink">
      {field.label}
    </label>
  );
  const help = field.help && (
    <p className="text-xs text-muted mt-0.5 leading-snug">{field.help}</p>
  );

  if (field.type === "textarea") {
    return (
      <div>
        {label}
        {help}
        <textarea
          id={id}
          className="field mt-2"
          rows={2}
          placeholder={field.placeholder}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    );
  }

  if (field.type === "toggle") {
    return (
      <label className="flex items-center gap-2.5 cursor-pointer">
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 accent-[var(--accent)]"
        />
        <span className="text-sm text-ink">{field.label}</span>
      </label>
    );
  }

  // text
  return (
    <div>
      {label}
      {help}
      <input
        id={id}
        className="field mt-2"
        placeholder={field.placeholder}
        value={(value as string) ?? ""}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
