import { FlowSchema, FlowTeaser, IFlow } from "@bitflow/flow";
import { BitflowProvider } from "@bitflow/provider";
import { Box, Heading } from "@openpatch/patches";
import atob from "atob";
import { GetServerSideProps } from "next";

type TeaserProps = {
  flow: IFlow;
  locale?: string;
};

export default function Teaser({ flow, locale }: TeaserProps) {
  return (
    <BitflowProvider config={{}} locale={locale}>
      <Box position="relative" height="100vh" width="100vw">
        <FlowTeaser {...flow} />
        <Box
          position="absolute"
          bottom="20%"
          left="0"
          right="0"
          textAlign="center"
          backgroundColor="neutral.100"
          textColor="neutral.900"
          borderColor="neutral.900"
          borderWidth="medium"
          borderTopStyle="solid"
          borderBottomStyle="solid"
          padding="large"
        >
          <Heading fontSize="xxlarge">{flow.name}</Heading>
        </Box>
      </Box>
    </BitflowProvider>
  );
}

export const getServerSideProps: GetServerSideProps<TeaserProps> = async ({
  params,
  locale,
}) => {
  try {
    const flowJson = JSON.parse(atob(params?.flow as string));
    const flow = FlowSchema.parse(flowJson);

    return {
      props: {
        flow,
        locale,
      },
    };
  } catch (e) {
    console.error(e);
    return {
      notFound: true,
    };
  }
};
