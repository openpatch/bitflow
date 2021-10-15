import { TaskBit } from "@bitflow/core";
import { TaskShell } from "@bitflow/shell";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Box,
  ButtonGroup,
  ButtonPrimary,
  ButtonSecondaryLink,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  Code,
  Grid,
  Link,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  Text,
} from "@openpatch/patches";
import { Fragment, useState } from "react";
import { DefaultValues, FormProvider, useForm } from "react-hook-form";
import { zodToJsonSchema } from "zod-to-json-schema";
import { toKebab, toSentence } from "../utils/case";
import { DocLayout } from "./DocLayout";

export type TaskBitDocProps<T extends Bitflow.Task> = {
  name: string;
  taskBit: TaskBit<T>;
  example: T;
  description: string;
};

export function TaskBitDoc<T extends Bitflow.Task>({
  name,
  example,
  taskBit,
  description,
}: TaskBitDocProps<T>) {
  const [statistic, setStatistic] = useState<Bitflow.TaskStatistic>();
  const [nextKey, setNextKey] = useState(new Date());
  const methods = useForm<T>({
    resolver: zodResolver(taskBit.TaskSchema),
    reValidateMode: "onBlur",
    shouldUnregister: false,
    mode: "onBlur",
    defaultValues: example as DefaultValues<T>,
  });

  const task = methods.watch() as any;

  const handleEvaluate = async (
    answer: Bitflow.TaskAnswer
  ): Promise<Bitflow.TaskResult> => {
    const result = taskBit.evaluate({ answer, task });
    const updateStatistic = await taskBit.updateStatistic({
      statistic,
      answer,
      task,
    });
    console.log(updateStatistic);
    setStatistic(updateStatistic);
    return result;
  };

  return (
    <DocLayout
      meta={{
        title: `Task - ${toSentence(name)}`,
      }}
    >
      <Grid gridGap="standard">
        <Card>
          <CardHeader>Description</CardHeader>
          <CardContent>{description}</CardContent>
          <CardFooter>
            <ButtonGroup space="standard">
              <ButtonSecondaryLink
                href={`https://github.com/openpatch/bitflow/tree/main/packages/task-${toKebab(
                  name
                )}`}
              >
                View Repository
              </ButtonSecondaryLink>
              <ButtonSecondaryLink
                href={`https://www.npmjs.com/package/@bitflow/task-${toKebab(
                  name
                )}`}
              >
                View on NPM
              </ButtonSecondaryLink>
            </ButtonGroup>
          </CardFooter>
        </Card>
        <Card>
          <CardHeader>Example</CardHeader>
          <CardContent>
            This is an interactive example of the {toSentence(name)} task. You
            can submit new answers, show a statistic based on thoses answers or
            modify the task by using the different forms.
          </CardContent>
          <FormProvider {...methods}>
            <Tabs>
              <TabList inverted>
                <Tab>Task</Tab>
                <Tab>View Form</Tab>
                <Tab>Evaluation Form</Tab>
                <Tab>Feedback Form</Tab>
                <Tab>Statistic</Tab>
              </TabList>
              <TabPanel p="none">
                <Box position="relative" height="600px" overflowY="auto">
                  <TaskShell
                    key={nextKey.toISOString()}
                    onNext={async () => setNextKey(new Date())}
                    evaluate={handleEvaluate}
                    TaskComponent={taskBit.Task as any}
                    mode="default"
                    task={{ ...task }}
                  />
                </Box>
              </TabPanel>
              <TabPanel>
                <taskBit.ViewForm name="" />
              </TabPanel>
              <TabPanel>
                <taskBit.EvaluationForm name="" />
              </TabPanel>
              <TabPanel>
                <taskBit.FeedbackForm name="" />
              </TabPanel>
              <TabPanel>
                {statistic ? (
                  <Fragment>
                    <taskBit.Statistic
                      statistic={{ ...statistic }}
                      task={{ ...task }}
                    />
                    <ButtonPrimary
                      fullWidth
                      onClick={() => setStatistic(undefined)}
                    >
                      Reset Statistic
                    </ButtonPrimary>
                  </Fragment>
                ) : (
                  <Text>
                    Submit some answers in the Task tab to see the statistic.
                  </Text>
                )}
              </TabPanel>
            </Tabs>
          </FormProvider>
        </Card>
        <Card>
          <CardHeader>Imports</CardHeader>
          <CardContent>
            This is a list of all exported components and functions. These are
            only relevant if you want to use this task in a standalone way.
            <Code language="javascript">{`import { 
  Task, TaskSchema, 
  ViewForm, EvaluationForm, FeedbackForm, 
  evaluate, updateStatistic, Statistic 
} from "@bitflow/task-${toKebab(name)}"`}</Code>
            <ul>
              <li>
                <b>Task</b>: The task component displays the task.
              </li>
              <li>
                <b>ViewForm</b>: A form to set the neccessary data for a task.
              </li>
              <li>
                <b>EvaluationForm</b>: A form to set how an answer for a task
                will be evaluated.
              </li>
              <li>
                <b>FeedbackForm</b>: A form to set when and how feedback will be
                displayed.
              </li>
              <li>
                <b>evaluate</b>: Evaluates if a answer for a task is correct and
                may add feedback.
              </li>
              <li>
                <b>updateStatistic</b>: Generates/updates a statistic for a task
                based on an answer and result.
              </li>
              <li>
                <b>Statistic</b>: Visualizes the statistic for a task. You can
                use updateStatistic to generate a statistic.
              </li>
              <li>
                <b>TaskSchema</b>: Is a{" "}
                <Link external href="https://github.com/colinhacks/zod">
                  zod
                </Link>{" "}
                schema, which can be used to validate a task object. It follows
                the JSON schema down below.
              </li>
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>Usage</CardHeader>
          <CardContent>
            We recommand that you wrap this component with the{" "}
            <Link href="/docs/shells/task">TaskShell component</Link> like so,
            if you want to use the component on its own.
            <Code language="typescript">{`import { TaskShell } from "@bitflow/shell";
import { evaluate, Task } from "@bitflow/task-${toKebab(name)}";
 
const My = () => (
  <TaskShell
    onNext={async () => {}}
    evaluate={evaluate}
    TaskComponent={Task}
    mode="default"
    task={task}
  />
);
            `}</Code>
            You can also use this task with the{" "}
            <Link href="/docs/do">Do component</Link>.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>Actions</CardHeader>
          <CardContent>
            Each task emits different actions, which can be used for{" "}
            <Link href="/docs/bits/capute-and-replay">capture and replay</Link>{" "}
            the solving process. These are defined by the IAction type.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>JSON Schema</CardHeader>
          <CardContent>
            If you do not want to use the provided forms to create a task
            object, you can build something yourself which produces a object,
            which follows this JSON schema.
            <Code language="json">
              {JSON.stringify(zodToJsonSchema(taskBit.TaskSchema), null, 2)}
            </Code>
          </CardContent>
        </Card>
      </Grid>
    </DocLayout>
  );
}
