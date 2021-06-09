import { FlowView } from "@bitflow/flow";
import {
  AutoGrid,
  Box,
  ButtonPrimaryLink,
  Card,
  CardContent,
  CardHeader,
  PatternCenter,
} from "@openpatch/patches";
import { useActivity } from "hooks/activity";
import { useRouter } from "next/router";

export default function Activity() {
  const router = useRouter();
  const [activity] = useActivity(router.query.id as string);
  return (
    <PatternCenter>
      <Box p="standard" width="90vw">
        {activity && (
          <AutoGrid gap="standard">
            <Card>
              <CardHeader>{activity.name}</CardHeader>
              <Box height="400px">
                <FlowView {...activity.flow} />
              </Box>
              {activity.description && (
                <CardContent>{activity.description}</CardContent>
              )}
            </Card>
            <AutoGrid columns={2}>
              <Card>
                <CardContent>
                  <ButtonPrimaryLink
                    fullWidth
                    href={`/?activityId=` + encodeURIComponent(activity._id)}
                  >
                    Do Link
                  </ButtonPrimaryLink>
                </CardContent>
              </Card>
            </AutoGrid>
          </AutoGrid>
        )}
      </Box>
    </PatternCenter>
  );
}
