import { FormControl, FormControlOptions } from "@lib/core/FormControl";
import { useState } from "react";

type UseFormOptions<TFormValues> = FormControlOptions<TFormValues>;

export function useForm<TFormValues>(options: UseFormOptions<TFormValues>) {
  const [formControl] = useState(() => new FormControl<TFormValues>(options));

  return formControl;
}
