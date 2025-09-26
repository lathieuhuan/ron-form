import { Form, ReactBaseControl, ReactFormControl } from "@lib/react";
import { Button } from "../button";
import { StateWatcher, ValueWatcher } from "../watchers";

export type CaseLayoutWatchConfig = {
  title?: string;
  control?: ReactBaseControl;
  /** Default: true */
  alsoWatchState?: boolean;
};

export type CaseLayoutProps = {
  description?: React.ReactNode;
  children: React.ReactNode;
  form: ReactFormControl<any, any>;
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
    <div className="max-h-screen p-4 flex">
      <Form
        form={form}
        className="max-w-96 w-112 shrink-0 max-h-full overflow-y-auto overflow-x-hidden pr-4 mr-4 border-r border-border"
        {...formProps}
      >
        {description && (
          <div className="mb-4 text-sm text-muted [&>ul]:list-disc [&>ul]:ml-4">{description}</div>
        )}
        <div className="mt-2 p-3 bg-black rounded-sm flex flex-col gap-2">{children}</div>
        <div>
          <Button type="submit">Submit</Button>
        </div>
      </Form>

      <div className="max-h-full overflow-y-auto overflow-x-hidden">
        {watchConfigs?.map(({ title, control, alsoWatchState = true }) => {
          if (!control) {
            return null;
          }
          return (
            <div key={title} className="py-4 border-b border-border">
              <h3>{title}</h3>

              <div className="flex gap-8">
                <ValueWatcher className="w-48 shrink-0" control={control} />
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
    <div className="flex justify-between items-center gap-2">
      <span>• {description}</span>
      <Button onClick={onClick}>{buttonText}</Button>
    </div>
  );
}
