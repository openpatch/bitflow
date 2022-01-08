import { InputBit } from "@bitflow/core";
import { InputShell } from "@bitflow/shell";
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
import { zodToJsonSchema } from "zod-to-json-schema";
import { toKebab, toSentence } from "../../../../utils/case";
import { DocLayout } from "../../../../components/DocLayout";
import { bits, InputBitKey } from "@bitflow/bits";
import { GetStaticPaths, GetStaticProps } from "next";

export type InputBitDocProps = {
  id: InputBitKey
};

export default function InputBitDoc({
  id
}: InputBitDocProps) {
  const inputBit = bits.input[id];
  const { example, name, description } = inputBit.useInformation();
  const formDefaultValues = example as DefaultValues<Bitflow.Input>;
  const methods = useForm<Bitflow.Input>({
    resolver: zodResolver(inputBit.InputSchema),
    reValidateMode: "onBlur",
    shouldUnregister: false,
    defaultValues: formDefaultValues,
    mode: "onBlur",
  });
  const input = methods.watch() as any;

  return (
    <DocLayout meta={{ title: `Input - ${toSentence(name)}` }}>
      <Grid gridGap="standard">
        <Card>
          <CardHeader>Description</CardHeader>
          <CardContent>{description}</CardContent>
          <CardFooter>
            <ButtonGroup space="standard">
              <ButtonSecondaryLink
                href={`https://github.com/openpatch/bitflow/tree/main/packages/input-${toKebab(
                  name
                )}`}
              >
                View Repository
              </ButtonSecondaryLink>
              <ButtonSecondaryLink
                href={`https://www.npmjs.com/package/@bitflow/input-${toKebab(
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
            This is an interactive example of the {toSentence(name)} input.
          </CardContent>
          <FormProvider {...methods}>
            <Tabs>
              <TabList inverted>
                <Tab>Input</Tab>
                <Tab>View Form</Tab>
              </TabList>
              <TabPanel p="none">
                <Box position="relative" height="600px" overflowY="auto">
                  <InputShell
                    InputComponent={inputBit.Input}
                    input={{ ...input }}
                    onNext={async () => {}}
                  />
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
} from "@bitflow/input-${toKebab(name)}"`}</Code>
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
import { evaluate, Input } from "@bitflow/input-${toKebab(name)}";

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
              {JSON.stringify(zodToJsonSchema(inputBit.InputSchema), null, 2)}
            </Code>
          </CardContent>
        </Card>
      </Grid>
    </DocLayout>
  );
}

export const getStaticProps: GetStaticProps = async (context) => {
  const params = context.params as any
  return {
    props: {
      id: params.id,
    },
  };
}

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = Object.keys(bits.input).map((id) => ({
    params: { id },
  }));
  return {
    paths,
    fallback: false,
  };
}
