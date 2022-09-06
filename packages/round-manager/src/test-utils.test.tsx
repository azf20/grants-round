import React, {createContext, useContext} from "react";
import {render} from "@testing-library/react";
import {wrapInContexts} from "./test-utils";
import {ProgramContextType} from "./context/ProgramContext";

type ExampleContextValueType = { value: string | null };
let ExampleContext = createContext<ExampleContextValueType>({value: null});

let ExampleContextConsumer = () => {
  const context = useContext(ExampleContext);

  return <div>
    {context.value}
  </div>
}

describe('wraps tested elements with contexts', function () {
  it("should access context value", function () {
    let component = wrapInContexts<ExampleContextValueType | ProgramContextType>(<ExampleContextConsumer />, [
      {context: ExampleContext, value: {value: "test value"}},
    ]);

    let view = render(component);
    expect(view.getByText('test value')).toBeInTheDocument();
  });
});
