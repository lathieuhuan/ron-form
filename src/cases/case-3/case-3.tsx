import { REQUIRED, FormControl, ListControl } from "@lib";
import { FormItem, FormList, ItemControl } from "@lib/react";
import { useMemo } from "react";

import { Button } from "@src/components/button";
import { CaseLayout, CaseLayoutWatchConfig } from "@src/components/case-layout";
import { FormField } from "@src/components/form-field/form-field";
import { Input } from "@src/components/input";

import "./case-styles.css";

export function Case3() {
  const form = useMemo(() => {
    return new FormControl({
      names: new ListControl(new ItemControl("", [REQUIRED])),
    });
  }, []);

  const watchConfigs: CaseLayoutWatchConfig[] = [
    {
      title: "Names",
      control: form.getControl(["names"]),
    },
    {
      title: "Form root",
      control: form,
    },
  ];

  return (
    <CaseLayout
      form={form}
      description={
        <ul>
          <li>Simple form list with required string fields.</li>
        </ul>
      }
      watchConfigs={watchConfigs}
    >
      <FormList<string, ItemControl<string>> name={["names"]}>
        {({ items, insert, remove }) => {
          return (
            <div className="case-3">
              {items.length ? (
                <div>
                  {items.map((item, index) => {
                    return (
                      <div key={item.id} className="name-control">
                        <FormField
                          key={item.id}
                          label={`Name ${index + 1}`}
                          control={item.control}
                          className="name-field"
                        >
                          {(state) => {
                            return (
                              <FormItem control={item.control}>
                                <Input isError={state.isError} />
                              </FormItem>
                            );
                          }}
                        </FormField>
                        <Button onClick={() => remove(item.id)}>Remove</Button>
                      </div>
                    );
                  })}
                </div>
              ) : null}

              <div>
                <Button className="add-button" onClick={() => insert(items.length)}>
                  Add
                </Button>
              </div>
            </div>
          );
        }}
      </FormList>
    </CaseLayout>
  );
}
