import { Input } from "@bitflow/base";
import { InputBit } from "@bitflow/bits";
import { zodToJsonSchema } from "@bitflow/zod-json-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Box,
  ButtonGroup,
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
} from "@openpatch/patches";
import { DefaultValues, FormProvider, useForm } from "react-hook-form";
import { toSentence } from "../utils/case";
import { DocLayout } from "./DocLayout";

export type InputBitDocProps<T extends Input> = {
  inputBit: InputBit;
  defaultValues: T;
  description: string;
};

export function InputBitDoc<T extends Input>({
  inputBit,
  defaultValues,
  description,
}: InputBitDocProps<T>) {
  const formDefaultValues = defaultValues as DefaultValues<T>;
  const methods = useForm<T>({
    resolver: zodResolver(inputBit.InputSchema),
    reValidateMode: "onBlur",
    shouldUnregister: false,
    defaultValues: formDefaultValues,
    mode: "onBlur",
  });
  const input = methods.watch() as any;
  const name = defaultValues.subtype;

  return (
    <DocLayout meta={{ title: `Inputbit - ${toSentence(name)}` }}>
      <Grid gridGap="standard">
        <Card>
          <CardContent>{description}</CardContent>
          <CardFooter>
            <ButtonGroup space="standard">
              <ButtonSecondaryLink
                href={`https://github.com/openpatch/bitflow/tree/main/packages/input-${name}`}
              >
                View Repository
              </ButtonSecondaryLink>
              <ButtonSecondaryLink
                href={`https://github.com/openpatch/bitflow/tree/main/website/src/pages/docs/bits/input-${name}`}
              >
                View Example Source
              </ButtonSecondaryLink>
              <ButtonSecondaryLink
                href={`https://www.npmjs.com/package/@bitflow/input-${name}`}
              >
                View on NPM
              </ButtonSecondaryLink>
            </ButtonGroup>
          </CardFooter>
        </Card>
        <Card>
          <CardHeader>Example</CardHeader>
          <CardContent>
            This is an interactive example of the {toSentence(name)} input. You
            can submit new answers, show a statistic based on thoses answers or
            modify the input by using the different forms.
          </CardContent>
          <FormProvider {...methods}>
            <Tabs>
              <TabList inverted>
                <Tab>Task</Tab>
                <Tab>View Form</Tab>
              </TabList>
              <TabPanel p="none">
                <Box position="relative" height="600px">
                  <inputBit.Input input={input} />
                </Box>
              </TabPanel>
              <TabPanel>
                <inputBit.ViewForm name="" />
              </TabPanel>
            </Tabs>
          </FormProvider>
        </Card>
        <Card>
          <CardHeader>Imports</CardHeader>
          <CardContent>
            This is a list of all exported components and functions. These are
            only relevant if you want to use this input in a standalone way.
            <Code language="javascript">{`import { 
  Input, InputSchema, 
  ViewForm 
} from "@bitflow/input-${name}"`}</Code>
            <ul>
              <li>
                <b>Input</b>: The component displays the input.
              </li>
              <li>
                <b>ViewForm</b>: A form to set the neccessary data for a input.
              </li>
              <li>
                <b>InputSchema</b>: Is a{" "}
                <Link external href="https://github.com/colinhacks/zod">
                  zod
                </Link>{" "}
                schema, which can be used to validate an input object. It
                follows the JSON schema down below.
              </li>
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>Usage</CardHeader>
          <CardContent>
            We recommand that you wrap this component with the{" "}
            <Link href="/docs/shells/input">InputShell component</Link> like so,
            if you want to use the component on its own.
            <Code language="typescript">{`import { InputShell } from "@bitflow/shell";
import { evaluate, Input } from "@bitflow/input-${name}";
 
const My = () => (
  <InputShell
    onNext={async () => {}}
    InputComponent={Input}
    input={input}
  />
);
            `}</Code>
            You can also use this input with the{" "}
            <Link href="/docs/do">Do component</Link>.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>JSON Schema</CardHeader>
          <CardContent>
            If you do not want to use the provided forms to create an input
            object, you can build something yourself which produces a object,
            which follows this JSON schema.
            <Code language="json">
              {JSON.stringify(
                zodToJsonSchema(inputBit.InputSchema as any),
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
