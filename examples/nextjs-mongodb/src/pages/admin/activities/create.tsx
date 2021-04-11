import { zodResolver } from "@hookform/resolvers/zod";
import { runAuth } from "@middlewares/auth";
import {
  Box,
  ButtonPrimary,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  Container,
  Form,
  HookFormController,
  Input,
  PatternCenter,
} from "@openpatch/patches";
import { Activity, ActivitySchema } from "@schemas/activity";
import { post } from "@utils/fetcher";
import { FlowUploadField } from "components/FlowUploadField";
import { useAuth } from "hooks/auth";
import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { useState } from "react";
import {
  FormProvider,
  SubmitErrorHandler,
  SubmitHandler,
  useForm,
} from "react-hook-form";

export default function Create() {
  const router = useRouter();
  const [user] = useAuth();
  const [state, setState] = useState<"edit" | "post">("edit");
  const methods = useForm<Omit<Activity, "_id" | "userId">>({
    defaultValues: {
      description: "",
      flowState: {
        nodes: {},
      },
      name: "",
    },
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    shouldUnregister: false,
    resolver: zodResolver(ActivitySchema.omit({ _id: true, userId: true })),
  });

  const handleSuccess: SubmitHandler<Omit<Activity, "_id" | "userId">> = (
    activity
  ) => {
    setState("post");
    if (user?._id) {
      post<Omit<Activity, "_id">, { activity: Activity }>("/api/activities", {
        ...activity,
        userId: user._id,
      })
        .then((r) => r.json())
        .then(({ activity }) => {
          router.push("/admin/activities/" + activity._id);
        })
        .catch((e) => {
          setState("edit");
        });
    }
  };

  const handleError: SubmitErrorHandler<Omit<Activity, "_id">> = (e) => {
    console.error(e);
  };
  return (
    <PatternCenter>
      <Box p="standard">
        <Container maxWidth="small">
          <Card>
            <FormProvider {...methods}>
              <Form onSubmit={methods.handleSubmit(handleSuccess, handleError)}>
                <CardHeader>Create new Activity</CardHeader>
                <CardContent>
                  <HookFormController name="name" label="Name" render={Input} />
                  <HookFormController
                    name="description"
                    label="Description"
                    render={Input}
                  />
                  <HookFormController
                    name="flow"
                    label="Flow (JSON-File)"
                    render={FlowUploadField}
                  />
                </CardContent>
                <CardFooter>
                  <ButtonPrimary disabled={state === "post"} type="submit">
                    Create
                  </ButtonPrimary>
                </CardFooter>
              </Form>
            </FormProvider>
          </Card>
        </Container>
      </Box>
    </PatternCenter>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  const user = await runAuth(req, res);
  if (user === null) {
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
