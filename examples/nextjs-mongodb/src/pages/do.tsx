import { FlowDo } from "@bitflow/flow";
import { BitflowProvider } from "@bitflow/provider";
import { Box, Card, PatternCenter } from "@openpatch/patches";
import {
  evaluate,
  getConfig,
  getCurrent,
  getNext,
  getPrevious,
  getProgress,
  getResult,
  onEnd,
  onSkip,
} from "@utils/activitySession";
import { GetServerSideProps } from "next";

type DoProps = {
  locale: string;
};

export default function Do({ locale }: DoProps) {
  return (
    <BitflowProvider config={{}} locale={locale}>
      <PatternCenter>
        <Card>
          <Box position="relative" height="90vh" width="90vw">
            <FlowDo
              evaluate={evaluate}
              getConfig={getConfig}
              getCurrent={getCurrent}
              getNext={getNext}
              getPrevious={getPrevious}
              getProgress={getProgress}
              getResult={getResult}
              onEnd={onEnd}
              onSkip={onSkip}
            />
          </Box>
        </Card>
      </PatternCenter>
    </BitflowProvider>
  );
}

export const getServerSideProps: GetServerSideProps<DoProps> = async ({
  req,
  locale,
}) => {
  const session = req.cookies.activitySession;

  if (!session) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  return {
    props: {
      locale: locale || "en",
    },
  };
};
