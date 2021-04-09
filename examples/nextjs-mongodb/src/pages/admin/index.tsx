import { FlowTeaser } from "@bitflow/flow";
import {
  AutoGrid,
  Box,
  ButtonPrimaryLink,
  ButtonSecondary,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  Container,
  PatternCenter,
  useConfirm,
} from "@openpatch/patches";
import { Activity } from "@schemas/activity";
import { getAuth } from "@utils/auth";
import { del } from "@utils/fetcher";
import { useActivities } from "hooks/activity";
import { GetServerSideProps } from "next";
import { useState } from "react";
export default function Admin() {
  const [activities, { mutate }] = useActivities();
  const [selectedActivity, setSelectedActivity] = useState<Activity>();
  const onDelete = () => {
    if (selectedActivity) {
      del("/api/activities/" + selectedActivity._id).then(() => {
        mutate({
          activities: activities.filter((a) => a._id !== selectedActivity._id),
        });
      });
    }
  };

  const [requestDelete, deleteModal, setTitle] = useConfirm({
    onConfirm: onDelete,
    title: "Are you sure you want to delete the activity?",
    onCancel: () => null,
    severity: "danger",
    labels: {
      cancel: "Cancel",
      confirm: "Delete",
    },
  });

  const handleDelete = (activity: Activity) => {
    setTitle(`Are you sure you want to delete ${activity.name}?`);
    setSelectedActivity(activity);
    requestDelete();
  };

  return (
    <PatternCenter>
      <Box p="standard" width="100%">
        {deleteModal}
        <Container maxWidth="small">
          <AutoGrid gap="standard">
            <ButtonPrimaryLink href={`/admin/activities/create`}>
              Create new Activity
            </ButtonPrimaryLink>
            {activities.map((activity) => (
              <Card key={activity._id}>
                <CardHeader>{activity.name}</CardHeader>
                <Box height="200px">
                  <FlowTeaser {...activity.flow} />
                </Box>
                {activity.description && (
                  <CardContent>{activity.description}</CardContent>
                )}
                <CardFooter>
                  <ButtonSecondary
                    tone="error"
                    onClick={() => handleDelete(activity)}
                  >
                    Delete
                  </ButtonSecondary>
                  <ButtonPrimaryLink href={`/admin/activities/${activity._id}`}>
                    View
                  </ButtonPrimaryLink>
                </CardFooter>
              </Card>
            ))}
          </AutoGrid>
        </Container>
      </Box>
    </PatternCenter>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  const user = await getAuth(req);
  if (!user) {
    return {
      redirect: {
        destination: "/admin/login",
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
};
