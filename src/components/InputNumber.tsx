import type { ChangeEvent } from "react";
import type { InputProps } from "./Input";

import { Input } from "./Input";

interface BaseInputNumberProps extends Omit<InputProps, "value" | "onChange"> {
  value?: number | null;
}

interface NonNullableInputNumberProps extends BaseInputNumberProps {
  allowNull: false;
  /** Default 0 */
  nullValue?: number;
  onChange?: (value: number, e: ChangeEvent<HTMLInputElement>) => void;
}

interface NullableInputNumberProps extends BaseInputNumberProps {
  allowNull?: true;
  onChange?: (value: number | null, e: ChangeEvent<HTMLInputElement>) => void;
}

export type InputNumberProps = NonNullableInputNumberProps | NullableInputNumberProps;

export function InputNumber(props: InputNumberProps) {
  const handleChange = (value: string, e: ChangeEvent<HTMLInputElement>) => {
    const numberValue = Number(value);

    if (isNaN(numberValue)) {
      return;
    }

    onChange?.(numberValue, e);
  };

  if (props.allowNull === false) {
    const { value, nullValue = 0, allowNull, onChange, ...rest } = props;

    return (
      <Input
        {...rest}
        value={value != null ? value.toString() : `${nullValue}`}
        onChange={(value, e) => {
          if (value === "") {
            onChange?.(nullValue, e);
            return;
          }

          handleChange(value, e);
        }}
      />
    );
  }

  const { value, allowNull, onChange, ...rest } = props;

  return (
    <Input
      {...rest}
      value={value != null ? value.toString() : ""}
      onChange={(value, e) => {
        if (value === "") {
          onChange?.(null, e);
          return;
        }

        handleChange(value, e);
      }}
    />
  );
}
