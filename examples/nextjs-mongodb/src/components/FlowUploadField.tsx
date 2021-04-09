import { FlowSchema, FlowView } from "@bitflow/flow";
import { Box, ButtonPrimary, StyledInput } from "@openpatch/patches";
import { Activity } from "@schemas/activity";
import { useRef, useState } from "react";

export type FlowUploadField = {
  value?: Activity["flow"];
  onChange: (flow: Activity["flow"]) => void;
  onBlur: () => void;
};

export const FlowUploadField = ({
  value,
  onChange,
  onBlur,
}: FlowUploadField) => {
  const [flow, setFlow] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const reader = useRef<FileReader>();

  const handleFlowParse = () => {
    if (typeof reader.current?.result === "string") {
      const flow = JSON.parse(reader.current.result);
      const result = FlowSchema.safeParse(flow);
      if (result.success) {
        onChange(result.data);
        setFlow(result.data);
      } else {
        console.error(result.error.errors);
      }
    }
  };

  const onUpload = () => {
    if (inputRef.current && inputRef.current.files) {
      const file = inputRef.current.files[0];
      reader.current = new FileReader();
      reader.current.onloadend = handleFlowParse;
      reader.current.readAsText(file);
    }
  };

  return (
    <Box>
      <Box display="flex">
        <StyledInput onBlur={onBlur} type="file" ref={inputRef} />
        <ButtonPrimary onClick={onUpload}>Upload</ButtonPrimary>
      </Box>
      {flow && (
        <Box height="400px">
          <FlowView {...flow}></FlowView>
        </Box>
      )}
    </Box>
  );
};
