import { FlowTeaser, IFlow } from "@bitflow/flow";
import {
  ButtonPrimary,
  ButtonSecondary,
  Card,
  CardFooter,
  CardHeader,
} from "@openpatch/patches";
import { useTranslations } from "@vocab/react";
import { useRouter } from "next/router";
import translations from "../locales.vocab";
import { convertFromJsonToString } from "../utils/convertFlow";

export type FlowCardProps = {
  flow: IFlow;
};

export const FlowCard = ({ flow }: FlowCardProps) => {
  const { t } = useTranslations(translations);
  const router = useRouter();
  return (
    <Card>
      <CardHeader>{flow.name}</CardHeader>
      <FlowTeaser height="300px" {...flow} />
      <CardFooter>
        <ButtonPrimary
          fullWidth
          onClick={() => router.push(`/do/${convertFromJsonToString(flow)}`)}
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
  );
};
