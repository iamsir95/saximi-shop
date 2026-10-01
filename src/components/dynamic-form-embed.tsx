import { DynamicForm } from "@/types";
import { getApiBaseUrl } from "@/utils/request";
import { useState } from "react";
import toast from "react-hot-toast";
import CommerceIcon from "./commerce-icon";

export default function DynamicFormEmbed({
  form,
  placement = "news",
}: {
  form: DynamicForm;
  placement?: string;
}) {
  const [values, setValues] = useState<Record<string, string | boolean>>({});
  const [submitting, setSubmitting] = useState(false);

  const updateValue = (id: string, value: string | boolean) => {
    setValues((current) => ({ ...current, [id]: value }));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const nameField = form.fields.find((field) =>
        /tên|name/i.test(field.label)
      );
      const phoneField = form.fields.find((field) => field.type === "phone");
      const response = await fetch(
        `${getApiBaseUrl()}/forms/${form.id}/submissions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            placement,
            customerName: nameField ? String(values[nameField.id] || "") : "",
            customerPhone: phoneField ? String(values[phoneField.id] || "") : "",
            values,
          }),
        }
      );
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || "Chưa gửi được form.");
      }
      setValues({});
      toast.success("Đã gửi thông tin đến quản trị viên");
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="dynamic-form-embed" onSubmit={submit}>
      <div className="dynamic-form-embed__header">
        <div className="dynamic-form-embed__icon">
          <CommerceIcon name="note" size={20} />
        </div>
        <div>
          <h2>{form.title}</h2>
          {form.description && <p>{form.description}</p>}
        </div>
      </div>
      <div className="dynamic-form-embed__fields">
        {form.fields.map((field) => {
          const commonProps = {
            id: `dynamic-form-${form.id}-${field.id}`,
            required: field.required,
            value: String(values[field.id] || ""),
            onChange: (
              event:
                | React.ChangeEvent<HTMLInputElement>
                | React.ChangeEvent<HTMLTextAreaElement>
                | React.ChangeEvent<HTMLSelectElement>
            ) => updateValue(field.id, event.currentTarget.value),
            placeholder: field.placeholder || field.label,
          };
          return (
            <label key={field.id} className="dynamic-form-embed__field">
              <span>
                {field.label}
                {field.required && <b>*</b>}
              </span>
              {field.type === "textarea" ? (
                <textarea {...commonProps} rows={4} />
              ) : field.type === "select" ? (
                <select {...commonProps}>
                  <option value="">Chọn {field.label.toLowerCase()}</option>
                  {(field.options || []).map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : field.type === "checkbox" ? (
                <label className="dynamic-form-embed__check">
                  <input
                    type="checkbox"
                    checked={Boolean(values[field.id])}
                    required={field.required}
                    onChange={(event) =>
                      updateValue(field.id, event.currentTarget.checked)
                    }
                  />
                  <span>{field.placeholder || "Đồng ý"}</span>
                </label>
              ) : (
                <input
                  {...commonProps}
                  type={
                    field.type === "phone"
                      ? "tel"
                      : field.type === "email"
                        ? "email"
                        : "text"
                  }
                />
              )}
            </label>
          );
        })}
      </div>
      <button type="submit" disabled={submitting}>
        {submitting ? "Đang gửi..." : form.submitLabel}
      </button>
    </form>
  );
}
