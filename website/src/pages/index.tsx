import { FlowTeaser, FlowView } from "@bitflow/flow";
import {
  AutoGrid,
  Box,
  ButtonPrimary,
  ButtonSecondary,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  Heading,
  Text,
} from "@openpatch/patches";
import { useTranslations } from "@vocab/react";
import { useRouter } from "next/router";
import { NavLayout } from "../components/NavLayout";
import { flows } from "../flows";
import { simpleAnswerSplit } from "../flows/simpleAnswerSplit";
import translations from "../locales.vocab";
import { convertFromJsonToString } from "../utils/convertFlow";

export default function Home() {
  const router = useRouter();
  const { t } = useTranslations(translations);
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
        <FlowView {...simpleAnswerSplit} />
      </Box>
      <Box maxWidth="large" width="100%" mx="auto" my="xlarge">
        <AutoGrid gap="xlarge">
          <Heading>{t("getting-started")}</Heading>
          <Card>
            <CardContent>Hallo</CardContent>
          </Card>
          <Heading>{t("demo-flows")}</Heading>
          <AutoGrid>
            {flows.map((flow, i) => (
              <Card key={i}>
                <CardHeader>{flow.name}</CardHeader>
                <FlowTeaser height="300px" {...flow} />
                <CardFooter>
                  <ButtonPrimary
                    fullWidth
                    onClick={() =>
                      router.push(`/do/${convertFromJsonToString(flow)}`)
                    }
                  >
                    {t("do-flow")}
                  </ButtonPrimary>
                  <ButtonSecondary
                    fullWidth
                    onClick={() =>
                      router.push({
                        pathname: "/editor",
                        query: { flow: convertFromJsonToString(flow) },
                      })
                    }
                  >
                    {t("edit-flow")}
                  </ButtonSecondary>
                </CardFooter>
              </Card>
            ))}
          </AutoGrid>
        </AutoGrid>
      </Box>
    </NavLayout>
  );
}
