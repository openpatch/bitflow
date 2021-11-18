import {
  DoResult,
  DoTry,
  EndBit,
  EndSchema as EndSchemaBase,
  FlowTaskNode,
  groupBy,
} from "@bitflow/core";
import {
  CorrectIcon,
  ManualIcon,
  SkippedIcon,
  UnknownIcon,
  WrongIcon,
} from "@bitflow/icons";
import { useBitTask } from "@bitflow/provider";
import { Shell, ShellContent, ShellHeader } from "@bitflow/shell";
import {
  AutoGrid,
  Box,
  Card,
  HookFormController,
  Markdown,
  MarkdownEditor,
  Text,
} from "@openpatch/patches";
import { useTranslations as useVocabTranslations } from "@vocab/react";
import { Fragment, useEffect, useState } from "react";
import { z } from "zod";
import translations from "./locales.vocab";

export const EndSchema = EndSchemaBase.merge(
  z.object({
    subtype: z.literal("tries"),
    view: z.object({
      markdown: z.string(),
    }),
  })
);

export type IEnd = z.infer<typeof EndSchema>;

export const useInformation: EndBit<IEnd>["useInformation"] = () => {
  const { t } = useVocabTranslations(translations);
  return {
    name: t("name"),
    description: t("description"),
    example: {
      name: t("name"),
      description: t("description"),
      subtype: "tries",
      view: {
        markdown: t("example.markdown"),
      },
    },
  };
};

type DoTaskTry = DoTry & { node: FlowTaskNode };

const isDoTaskTry = (d: DoTry): d is DoTaskTry => {
  return d.node.type === "task";
};

type DoTriesProps = {
  tries: DoTaskTry[];
  onClick: (t: DoTaskTry) => void;
};

const DoTries = ({ tries, onClick }: DoTriesProps) => {
  return (
    <Card>
      <Text ml="small" mt="small" fontWeight="bold">
        {tries[0].node.data.name}
      </Text>
      <Box display="flex" flexWrap="wrap" justifyContent="start">
        {tries.map((t) => {
          let icon = null;

          if (t.status === "skipped") {
            icon = <SkippedIcon />;
          } else if (t.status === "finished") {
            if (t.result?.state === "correct") {
              icon = <CorrectIcon />;
            } else if (t.result?.state === "wrong") {
              icon = <WrongIcon />;
            } else if (t.result?.state === "manual") {
              icon = <ManualIcon />;
            } else if (t.result?.state === "unknown") {
              icon = <UnknownIcon />;
            }
          }

          if (!icon) return null;

          return (
            <Box
              m="small"
              key={String(t.startDate)}
              title={tries[0].node.data.name}
              cursor="pointer"
              onClick={() => onClick(t)}
            >
              {icon}
            </Box>
          );
        })}
      </Box>
    </Card>
  );
};

export const End: EndBit<IEnd>["End"] = ({ end, getResult }) => {
  const { t } = useVocabTranslations(translations);
  const [result, setResult] = useState<DoResult>();
  const [triesPerNode, setTriesPerNode] = useState<DoTaskTry[][]>();
  const [selectedTry, setSelectedTry] = useState<DoTaskTry>();

  const taskBit = useBitTask(
    selectedTry?.node.type === "task"
      ? (selectedTry?.node.data.subtype as any)
      : undefined
  );

  useEffect(() => {
    getResult().then((result) => {
      const groupedTries = groupBy(
        result.tries.filter(isDoTaskTry),
        (t: DoTry) => t.node.id
      );
      setResult(result);
      setTriesPerNode(groupedTries);
    });
  }, []);

  if (selectedTry && taskBit) {
    const TaskComponent = taskBit.Task;

    if (TaskComponent) {
      return (
        <Shell>
          <ShellHeader onClose={() => setSelectedTry(undefined)}>
            {selectedTry.node.data.name}
          </ShellHeader>
          <ShellContent>
            <TaskComponent
              mode="result"
              answer={
                selectedTry.status === "finished"
                  ? (selectedTry.answer as any)
                  : undefined
              }
              result={
                selectedTry.status === "finished"
                  ? (selectedTry.result as any)
                  : undefined
              }
              task={selectedTry.node.data as any}
            />
          </ShellContent>
        </Shell>
      );
    }
  }

  return (
    <Box padding="standard">
      <AutoGrid gap="standard">
        <Markdown markdown={end.view.markdown} />
        {result && (
          <Text textAlign="center" textColor="primary.600" fontSize="xxlarge">
            {t("points", {
              points: result.points,
              maxPoints: result.maxPoints,
            })}
          </Text>
        )}
        {triesPerNode?.map((t, i) => {
          return <DoTries key={i} tries={t} onClick={setSelectedTry} />;
        })}
      </AutoGrid>
    </Box>
  );
};

export const ViewForm: EndBit<IEnd>["ViewForm"] = ({ name }) => {
  const { t } = useVocabTranslations(translations);

  return (
    <Fragment>
      <HookFormController
        name={`${name}.view.markdown`}
        label={t("markdown")}
        defaultValue=""
        render={({ value, onChange }) => (
          <MarkdownEditor
            value={value}
            variant="input"
            onChange={(v) => onChange(v)}
          />
        )}
      />
    </Fragment>
  );
};
