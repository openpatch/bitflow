import { TaskShell } from "@bitflow/shell";
import * as bitflowTask from "@bitflow/task-choice";
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
import { FormProvider, useForm } from "react-hook-form";
import zodToJsonSchema from "zod-to-json-schema";
import { DocLayout } from "../../../components/DocLayout";

const meta = {
  title: "Task - Choice",
};

export default function TaskChoice() {
  const [statistic, setStatistic] = useState<bitflowTask.IStatistic>();
  const [nextKey, setNextKey] = useState(new Date());
  const methods = useForm<bitflowTask.ITask>({
    resolver: zodResolver(bitflowTask.TaskSchema),
    reValidateMode: "onBlur",
    shouldUnregister: false,
    defaultValues: {
      subtype: "choice",
      view: {
        instruction: "**This is an instruction**",
        variant: "single",
        choices: [
          { markdown: "Answer A" },
          { markdown: "Answer B" },
          { markdown: "Answer C" },
          { markdown: "Answer D" },
        ],
      },
      evaluation: {
        mode: "auto",
        correct: ["a"],
      },
    },
    mode: "onBlur",
  });
  const task = methods.watch();

  const handleEvaluate = async (
    answer: bitflowTask.IAnswer
  ): Promise<bitflowTask.IResult> => {
    const result = bitflowTask.evaluate({ answer, task });
    const updateSstatistic = await bitflowTask.updateStatistic({
      statistic,
      answer,
      task,
    });
    setStatistic(updateSstatistic);
    return result;
  };

  return (
    <DocLayout meta={meta}>
      <Grid gridGap="standard">
        <Card>
          <CardContent>
            A multiple-choice or single-choice bit type depending on the
            configuration. You can give precise feedback to each individual
            choice, whether it was choosen or not. You can also give feedback
            based on answer patterns. For example if Option A, Option B and
            Option D is selected. All choices and the instruction support
            Markdown for more flexibility.
          </CardContent>
          <CardFooter>
            <ButtonGroup space="standard">
              <ButtonSecondaryLink href="https://github.com/openpatch/bitflow/tree/main/packages/task-choice">
                View Repository
              </ButtonSecondaryLink>
              <ButtonSecondaryLink href="https://github.com/openpatch/bitflow/tree/main/website/src/pages/docs/bits/task-choice">
                View Example Source
              </ButtonSecondaryLink>
              <ButtonSecondaryLink href="https://www.npmjs.com/package/@bitflow/task-choice">
                View on NPM
              </ButtonSecondaryLink>
            </ButtonGroup>
          </CardFooter>
        </Card>
        <Card>
          <CardHeader>Example</CardHeader>
          <CardContent>
            This is an interactive example of the choice task. You can submit
            new answers, show a statistic based on thoses answers or modify the
            task by using the different forms.
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
                <Box position="relative" height="600px">
                  <TaskShell
                    key={nextKey.toISOString()}
                    onNext={async () => setNextKey(new Date())}
                    evaluate={handleEvaluate}
                    TaskComponent={bitflowTask.Task}
                    mode="default"
                    task={task}
                  />
                </Box>
              </TabPanel>
              <TabPanel>
                <bitflowTask.ViewForm name="" />
              </TabPanel>
              <TabPanel>
                <bitflowTask.EvaluationForm name="" />
              </TabPanel>
              <TabPanel>
                <bitflowTask.FeedbackForm name="" />
              </TabPanel>
              <TabPanel>
                {statistic ? (
                  <Fragment>
                    <bitflowTask.Statistic statistic={statistic} task={task} />
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
} from "@bitflow/task-choice"`}</Code>
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
import { evaluate, Task } from "@bitflow/task-choice";
 
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
            the solving process. The choice task emits the following:
            <Code language="json">
              {`
  "type": "check",
  "payload": {
    "choice": "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h",
    "variant": "single" | "multiple"
  }
`}
            </Code>
            <Code language="json">
              {`
  "type": "uncheck",
  "payload": {
    "choice": "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h",
    "variant": "single" | "multiple"
  }
`}
            </Code>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>JSON Schema</CardHeader>
          <CardContent>
            If you do not want to use the provided forms to create a task
            object, you can build something yourself which produces a object,
            which follows this JSON schema.
            <Code language="json">
              {JSON.stringify(
                zodToJsonSchema(bitflowTask.TaskSchema, "bitflow/task-choice"),
                null,
                2
              )}
            </Code>
          </CardContent>
        </Card>
      </Grid>
    </DocLayout>
  );
}
