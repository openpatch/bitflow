import { Flow as IFlow } from "@bitflow/core";
import { Flow } from "@bitflow/flow";
import { useFlow } from "@bitflow/provider";
import {
  AutoGrid,
  Box,
  Card,
  CardContent,
  Heading,
  Text,
  TextLink,
} from "@openpatch/patches";
import { useTranslations } from "@vocab/react";
import { useEffect, useState } from "react";
import { FlowCard } from "../components/FlowCard";
import { NavLayout } from "../components/NavLayout";
import { Supporters } from "../components/Supporters";
import { Users } from "../components/Users";
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
        <Heading>{t("demo-flows")}</Heading>
        <AutoGrid gap="standard" columns={[1, 1, 2]}>
          {Object.entries(flows).map(([key, flow]) => (
            <FlowCard flow={flow} id={key} key={key} />
          ))}
        </AutoGrid>
      </Box>
      <Box maxWidth="large" mx="auto" width="100%" px="standard" my="xlarge">
        <AutoGrid gapY="standard">
          <Supporters />
          <Users />
          <Card>
            <CardContent>
              <Text textAlign="center">
                This libary is based on the awesome work of{" "}
                <TextLink href="https://webkid.io/">webkid</TextLink> and their{" "}
                <TextLink href="https://github.com/wbkd/react-flow/">
                  React Flow library
                </TextLink>
                .
              </Text>
            </CardContent>
          </Card>
        </AutoGrid>
      </Box>
    </NavLayout>
  );
}
