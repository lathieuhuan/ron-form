import { FormApi, FormControl, FormControlOptions } from "@lib/core/FormControl";
import { useState } from "react";

export interface UseFormOptions<TFormValues> extends FormControlOptions<TFormValues> {}

export function useForm<TFormValues>(options: UseFormOptions<TFormValues>) {
  const [formControl] = useState(() => new FormControl<TFormValues>(options));

  return formControl as FormApi<TFormValues>;
}
