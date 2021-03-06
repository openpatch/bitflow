import { Flow } from "@bitflow/core";
import { FlowEditor, FlowEditorRef } from "@bitflow/flow-editor";
import { useFlow } from "@bitflow/provider";
import {
  Box,
  ButtonGroup,
  ButtonSecondary,
  Card,
  Heading,
  PatternCenter,
} from "@openpatch/patches";
import { GetServerSideProps } from "next";
import { useRef } from "react";
import * as flows from "../../flows";

type EditorProps = {
  flow: Flow;
};

export default function Editor({ flow }: EditorProps) {
  const flowEditorRef = useRef<FlowEditorRef>(null);
  const { evaluate } = useFlow();

  const handleDownload = () => {
    if (flowEditorRef.current) {
      const flow = flowEditorRef.current?.getValues();
      var dataStr =
        "data:text/json;charset=utf-8," +
        encodeURIComponent(JSON.stringify(flow));
      var downloadAnchorNode = document.createElement("a");
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", flow.name + ".json");
      document.body.appendChild(downloadAnchorNode); // required for firefox
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
    }
  };

  return (
    <PatternCenter>
      <Box
        display="flex"
        height="5vh"
        alignItems="center"
        width="90vw"
        mt="large"
      >
        <Box flex={1}>
          <Heading textColor="primary.50" as="h1">
            {flow?.name}
          </Heading>
        </Box>
        <Box>
          <ButtonGroup attached space="standard">
            {flow && (
              <ButtonSecondary onClick={handleDownload}>
                Download
              </ButtonSecondary>
            )}
          </ButtonGroup>
        </Box>
      </Box>
      <Box width="90vw" mb="large">
        <Card>
          <FlowEditor
            height="85vh"
            {...flow}
            onEvaluate={evaluate}
            ref={flowEditorRef}
            submitVariant="extern"
          />
        </Card>
      </Box>
    </PatternCenter>
  );
}

export const getServerSideProps: GetServerSideProps<
  EditorProps,
  { name: string }
> = async ({ params }) => {
  const name = params?.name as keyof typeof flows;
  const flow = flows[name];
  return {
    props: { flow },
  };
};
