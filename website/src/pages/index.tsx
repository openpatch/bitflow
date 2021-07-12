import { Flow as IFlow } from "@bitflow/core";
import { Flow } from "@bitflow/flow";
import { useFlow } from "@bitflow/provider";
import { AutoGrid, Box, Heading, Text } from "@openpatch/patches";
import { useTranslations } from "@vocab/react";
import { Fragment, useEffect, useState } from "react";
import { FlowCard } from "../components/FlowCard";
import { NavLayout } from "../components/NavLayout";
import * as flows from "../flows";
import { simpleAnswerSplit } from "../flows/simpleAnswerSplit";
import translations from "../locales.vocab";

export default function Home() {
  const { t } = useTranslations(translations);
  const { FlowSchema } = useFlow();
  const [myFlows, setMyFlows] = useState<Record<string, IFlow>>();

  useEffect(() => {
    const flowsString = localStorage.getItem("flows");
    if (flowsString) {
      try {
        const unsafeFlows = JSON.parse(flowsString);
        const flows: Record<string, IFlow> = {};
        Object.entries(unsafeFlows).forEach(([name, flow]) => {
          flows[name] = FlowSchema.parse(flow);
        });
        setMyFlows(flows);
      } catch (e) {}
    }
  }, []);

  return (
    <NavLayout active="home">
      <Box height="400px" position="relative">
        <Box position="absolute" left="0" right="0" top="100px">
          <Box maxWidth="large" mx="auto" px={["small", "medium", "medium"]}>
            <Box width="400px">
              <Heading as="h1" fontSize="xxlarge">
                {t("bitflow")}
              </Heading>
              <Text>{t("bitflow-description")}</Text>
            </Box>
          </Box>
        </Box>
        <Flow autoFitView {...simpleAnswerSplit} />
      </Box>
      <Box maxWidth="large" mx="auto" width="100%" px="standard" my="xlarge">
        <AutoGrid gap="xlarge">
          <Heading>{t("demo-flows")}</Heading>
          <AutoGrid gap="standard" columns={[1, 1, 2]}>
            {Object.values(flows).map((flow, i) => (
              <FlowCard flow={flow} key={i} />
            ))}
          </AutoGrid>
          {myFlows && (
            <Fragment>
              <Heading>{t("my-flows")}</Heading>
              <AutoGrid>
                {Object.entries(myFlows).map(([name, flow]) => (
                  <FlowCard flow={flow} key={name} />
                ))}
              </AutoGrid>
            </Fragment>
          )}
        </AutoGrid>
      </Box>
    </NavLayout>
  );
}
