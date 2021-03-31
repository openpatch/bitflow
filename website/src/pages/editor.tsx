import { FlowEditor, FlowEditorRef, FlowSchema, IFlow } from "@bitflow/flow";
import {
  Box,
  ButtonGroup,
  ButtonPrimary,
  ButtonSecondary,
  Card,
  Heading,
  PatternCenter,
} from "@openpatch/patches";
import { useTranslations } from "@vocab/react";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import translations from "../locales.vocab";
import {
  convertFromJsonToString,
  convertFromStringToJson,
} from "../utils/convertFlow";

export default function Editor() {
  const router = useRouter();
  const { t } = useTranslations(translations);
  const flowEditorRef = useRef<FlowEditorRef>(null);
  const [flow, setFlow] = useState<IFlow>();
  const [key, setKey] = useState<string>();

  useEffect(() => {
    if (typeof router.query.flow === "string") {
      try {
        const flowData = convertFromStringToJson(router.query.flow);
        if (flowData) {
          setFlow(flowData);
          setKey(router.query.flow);
        }
      } catch (e) {}
    }
  }, [router.query]);

  const handleSubmit = (flow: IFlow) => {
    setFlow(flow);
    const flowString = convertFromJsonToString(flow);
    const myFlowsString = localStorage.getItem("flows");
    if (!myFlowsString) {
      const myFlows = { [flow.name]: flow };
      localStorage.setItem("flows", JSON.stringify(myFlows));
    } else {
      const unsafeMyFlows = JSON.parse(myFlowsString);
      const myFlows: Record<string, IFlow> = {};
      Object.entries(unsafeMyFlows).forEach(([name, flow]) => {
        unsafeMyFlows[name] = FlowSchema.parse(flow);
      });
      myFlows[flow.name] = flow;
      localStorage.setItem("flows", JSON.stringify(myFlows));
    }

    router.push({ query: { flow: flowString } });
  };

  const handleDownload = () => {
    if (flow) {
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

  const handleSave = () => {
    if (flowEditorRef.current) {
      flowEditorRef.current.submit();
    }
  };

  const handlePreview = () => {
    if (flow) {
      const flowQuery = convertFromJsonToString(flow);
      if (flowQuery) {
        router.push(`do/${flowQuery}`);
      }
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
            <ButtonPrimary onClick={handleSave}>{t("save")}</ButtonPrimary>
            {flow && (
              <ButtonSecondary onClick={handleDownload}>
                {t("download")}
              </ButtonSecondary>
            )}
            {flow && (
              <ButtonSecondary onClick={handlePreview}>
                {t("preview")}
              </ButtonSecondary>
            )}
          </ButtonGroup>
        </Box>
      </Box>
      <Box width="90vw" mb="large">
        <Card>
          <FlowEditor
            key={key}
            height="85vh"
            {...flow}
            ref={flowEditorRef}
            submitVariant="extern"
            onSubmit={handleSubmit}
          />
        </Card>
      </Box>
    </PatternCenter>
  );
}
