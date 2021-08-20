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
import { useRouter } from "next/router";

export type FlowCardProps = {
  flow: IFlow;
  id: string;
};

export const FlowCard = ({ flow, id }: FlowCardProps) => {
  const router = useRouter();

  return (
    <Card>
      <CardHeader>{flow.name}</CardHeader>
      <Box height="300px">
        <Flow {...flow} autoFitView interactive={false} />
      </Box>
      <CardFooter>
        <ButtonPrimary fullWidth onClick={() => router.push(`/do/${id}`)}>
          Do
        </ButtonPrimary>
        <ButtonSecondary fullWidth onClick={() => router.push(`/editor/${id}`)}>
          Edit
        </ButtonSecondary>
      </CardFooter>
    </Card>
  );
};
