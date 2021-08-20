import { Flow as IFlow } from "@bitflow/core";
import { DoLocal } from "@bitflow/do-local";
import { Box, Card, PatternCenter } from "@openpatch/patches";
import { GetServerSideProps } from "next";
import * as flows from "../../flows";

type DoPageProps = {
  flow: IFlow;
};

export default function DoPage({ flow }: DoPageProps) {
  return (
    <PatternCenter>
      <Card>
        <Box position="relative" height="90vh" width="90vw">
          <DoLocal flow={flow} />
        </Box>
      </Card>
    </PatternCenter>
  );
}

export const getServerSideProps: GetServerSideProps<
  DoPageProps,
  {
    name: string;
  }
> = async ({ params }) => {
  const name = params?.name as keyof typeof flows;
  try {
    const flow = flows[name];

    return {
      props: {
        flow,
      },
    };
  } catch (e) {
    console.error(e);
    return {
      notFound: true,
    };
  }
};
