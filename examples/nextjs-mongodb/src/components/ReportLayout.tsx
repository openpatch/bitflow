import {
  AutoGrid,
  Box,
  ButtonGroup,
  ButtonPrimaryLink,
  ButtonSecondary,
  Card,
  CardFooter,
  CardHeader,
  Flex,
  PatternCenter,
  Select,
} from "@openpatch/patches";
import { ActivityReport } from "@schemas/activityReport";
import { FC } from "react";

export type ReportLayoutProps = {
  activity: {
    id: string;
    name?: string;
  };
  report: ActivityReport | null;
  mode: "first" | "last" | "partial";
  onModeChange: (mode: ReportLayoutProps["mode"]) => void;
  active: "flow" | "concepts" | "persons" | "tasks";
};

export const ReportLayout: FC<ReportLayoutProps> = ({
  activity,
  onModeChange,
  active,
  report,
  mode,
  children,
}) => {
  const baseUrl = `/admin/activities/${activity?.id}/report`;

  const handleModeChange = (value: string) => {
    if (value === "first" || value === "last" || value === "partial") {
      onModeChange(value);
    }
  };

  const handleDownload = () => {
    if (report) {
      const a = document.createElement("a");
      const file = new Blob([JSON.stringify(report)], {
        type: "application/json",
      });
      a.href = URL.createObjectURL(file);
      a.download = activity?.name?.replace(" ", "_").replace(".", "") + `.json`;
      a.click();
    }
  };

  return (
    <PatternCenter>
      <Box p="standard" width="90vw">
        <AutoGrid gap="standard">
          <Card>
            <CardHeader>{`Report for ${activity?.name}`}</CardHeader>
            <CardFooter>
              <ButtonGroup space="small">
                <ButtonPrimaryLink
                  href={`${baseUrl}/flow`}
                  tone={active === "flow" ? "primary" : "neutral"}
                >
                  Flow
                </ButtonPrimaryLink>
                <ButtonPrimaryLink
                  href={`${baseUrl}/concepts`}
                  tone={active === "concepts" ? "primary" : "neutral"}
                >
                  Concepts
                </ButtonPrimaryLink>
                <ButtonPrimaryLink
                  href={`${baseUrl}/persons`}
                  tone={active === "persons" ? "primary" : "neutral"}
                >
                  Persons
                </ButtonPrimaryLink>
                <ButtonPrimaryLink
                  href={`${baseUrl}/tasks`}
                  tone={active === "tasks" ? "primary" : "neutral"}
                >
                  Tasks
                </ButtonPrimaryLink>
              </ButtonGroup>
              <Flex flex="1" />
              <Box flex="1" display="flex" alignItems="center">
                <Box mr="standard" width="100%">
                  <Select value={mode} onChange={handleModeChange}>
                    <option
                      title="Show results based on first try"
                      value="first"
                    >
                      First Try
                    </option>
                    <option title="Show results based on last try" value="last">
                      Last Try
                    </option>
                    <option
                      title="Show results based on all tries. Deduct points for using more tries."
                      value="partial"
                    >
                      Partial
                    </option>
                  </Select>
                </Box>
                <ButtonSecondary
                  fullWidth
                  disabled={report === null}
                  onClick={handleDownload}
                >
                  Download Report (JSON)
                </ButtonSecondary>
              </Box>
            </CardFooter>
          </Card>
          {children}
        </AutoGrid>
      </Box>
    </PatternCenter>
  );
};
