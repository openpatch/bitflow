import { connectToDatabase } from "@db";
import {
  Box,
  ButtonPrimary,
  Card,
  CardContent,
  Container,
  Form,
  FormErrorText,
  FormLabel,
  Input,
  PatternCenter,
} from "@openpatch/patches";
import { start } from "@utils/activitySession";
import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { useState } from "react";

type HomeProps = {
  activityId: string;
  isConnected: boolean;
};

export default function Home({
  activityId: defaultActivityId,
  isConnected,
}: HomeProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [activityId, setActivityId] = useState(defaultActivityId);

  function handleActivityIdChange(value: string) {
    setActivityId(value);
    setError(null);
  }

  const handleStart = async () => {
    // fetch session cookie, redirect to session
    if (activityId) {
      await start(activityId)
        .then(() => {
          router.push("/do");
        })
        .catch((e) => {
          setError("Unknown Activity ID");
        });
    }
  };

  return (
    <PatternCenter>
      <Box p="standard">
        <Container maxWidth="small">
          <Card>
            <CardContent>
              {!isConnected && "Currently Offline"}
              <Form>
                <FormLabel htmlFor="activityId">Activity ID</FormLabel>
                <Input
                  id="activityId"
                  value={activityId}
                  onChange={handleActivityIdChange}
                  error={Boolean(error)}
                />
                {Boolean(error) && <FormErrorText>{error}</FormErrorText>}
                <Box mt="standard">
                  <ButtonPrimary
                    fullWidth
                    onClick={handleStart}
                    disabled={!activityId}
                  >
                    Start
                  </ButtonPrimary>
                </Box>
              </Form>
            </CardContent>
          </Card>
        </Container>
      </Box>
    </PatternCenter>
  );
}

export const getServerSideProps: GetServerSideProps<HomeProps> = async (
  ctx
) => {
  const { client } = await connectToDatabase();
  const isConnected = client.isConnected();
  const activityId = (ctx.query?.activityId as string) || "";

  return {
    props: {
      activityId,
      isConnected,
    },
  };
};
