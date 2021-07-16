import { Flow as IFlow } from "@bitflow/core";
import { Flow } from "@bitflow/flow";
import {
  Box,
  ButtonPrimary,
  ButtonSecondary,
  Card,
  CardFooter,
  CardHeader,
} from "@openpatch/patches";
import { useTranslations } from "@vocab/react";
import { useRouter } from "next/router";
import translations from "../locales.vocab";

export type FlowCardProps = {
  flow: IFlow;
  id: string;
};

export const FlowCard = ({ flow, id }: FlowCardProps) => {
  const { t } = useTranslations(translations);
  const router = useRouter();

  return (
    <Card>
      <CardHeader>{flow.name}</CardHeader>
      <Box height="300px">
        <Flow {...flow} autoFitView interactive={false} />
      </Box>
      <CardFooter>
        <ButtonPrimary fullWidth onClick={() => router.push(`/do/${id}`)}>
          {t("do-flow")}
        </ButtonPrimary>
        <ButtonSecondary fullWidth onClick={() => router.push(`/editor/${id}`)}>
          {t("edit-flow")}
        </ButtonSecondary>
      </CardFooter>
    </Card>
  );
};
