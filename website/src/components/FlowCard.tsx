import { Flow as IFlow } from "@bitflow/core";
import { Flow } from "@bitflow/flow";
import {
  Box,
  ButtonPrimaryLink,
  ButtonSecondaryLink,
  Card,
  CardFooter,
  CardHeader,
} from "@openpatch/patches";

export type FlowCardProps = {
  flow: IFlow;
  id: string;
};

export const FlowCard = ({ flow, id }: FlowCardProps) => {
  return (
    <Card>
      <CardHeader>{flow.name}</CardHeader>
      <Box height="300px">
        <Flow {...flow} autoFitView interactive={false} />
      </Box>
      <CardFooter>
        <ButtonPrimaryLink fullWidth href={`/do/${id}`}>
          Do
        </ButtonPrimaryLink>
        <ButtonSecondaryLink fullWidth href={`/editor/${id}`}>
          Edit
        </ButtonSecondaryLink>
      </CardFooter>
    </Card>
  );
};
