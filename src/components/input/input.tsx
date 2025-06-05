import { InputHTMLAttributes } from "react";
import clsx from "clsx";
import "./input.css";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  isError?: boolean;
};

export function Input({ isError, ...props }: InputProps) {
  return <input {...props} className={clsx("input", props.className, { error: isError })} />;
}
