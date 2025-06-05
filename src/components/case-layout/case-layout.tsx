import { BaseControl, Form, FormControl } from "@lib/react";
import { Button } from "../button";
import { StateWatcher, ValueWatcher } from "../watchers";

import "./case-layout.css";

export type CaseLayoutWatchConfig = {
  title?: string;
  control?: BaseControl;
  /** Default: true */
  alsoWatchState?: boolean;
};

export type CaseLayoutProps = {
  description?: React.ReactNode;
  children: React.ReactNode;
  form: FormControl<any>;
  watchConfigs?: CaseLayoutWatchConfig[];
};

export function CaseLayout({
  children,
  form,
  watchConfigs,
  description,
  ...formProps
}: CaseLayoutProps) {
  return (
    <div className="case-layout">
      <Form form={form} className="case-layout__form" {...formProps}>
        {description && <div className="case-layout__description">{description}</div>}
        <div className="case-layout__form-content">{children}</div>
        <div>
          <Button type="submit">Submit</Button>
        </div>
      </Form>

      <div>
        {watchConfigs?.map(({ title, control, alsoWatchState = true }) => {
          if (!control) {
            return null;
          }
          return (
            <div key={title} className="case-layout__watch-container">
              <h3>{title}</h3>

              <div className="case-layout__watch-section">
                <ValueWatcher control={control} />
                {alsoWatchState && <StateWatcher control={control} />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

type CaseActionProps = {
  description: string;
  buttonText?: string;
  onClick: () => void;
};

export function CaseAction({ description, buttonText = "Click", onClick }: CaseActionProps) {
  return (
    <div className="case-action">
      <span>• {description}</span>
      <Button onClick={onClick}>{buttonText}</Button>
    </div>
  );
}
