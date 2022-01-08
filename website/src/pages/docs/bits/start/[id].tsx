import { StartShell } from "@bitflow/shell";
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
import { bits, StartBitKey } from "@bitflow/bits";
import { GetStaticPaths, GetStaticProps } from "next";

type StartBitDocProps = {
  id: StartBitKey;
};

export default function StartBitDoc({ id }: StartBitDocProps) {
  const startBit = bits.start[id];
  const { example, name, description } = startBit.useInformation();
  const formDefaultValues = example as DefaultValues<Bitflow.Start>;
  const methods = useForm<Bitflow.Start>({
    resolver: zodResolver(startBit.StartSchema),
    reValidateMode: "onBlur",
    shouldUnregister: false,
    defaultValues: formDefaultValues,
    mode: "onBlur",
  });
  const start = methods.watch() as any;

  return (
    <DocLayout meta={{ title: `Start - ${toSentence(name)}` }}>
      <Grid gridGap="standard">
        <Card>
          <CardHeader>Description</CardHeader>
          <CardContent>{description}</CardContent>
          <CardFooter>
            <ButtonGroup space="standard">
              <ButtonSecondaryLink
                href={`https://github.com/openpatch/bitflow/tree/main/packages/start-${toKebab(
                  name
                )}`}
              >
                View Repository
              </ButtonSecondaryLink>
              <ButtonSecondaryLink
                href={`https://www.npmjs.com/package/@bitflow/start-${toKebab(
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
            This is an interactive example of the {toSentence(name)} start.
          </CardContent>
          <FormProvider {...methods}>
            <Tabs>
              <TabList inverted>
                <Tab>Start</Tab>
                <Tab>View Form</Tab>
              </TabList>
              <TabPanel p="none">
                <Box position="relative" height="600px" overflowY="auto">
                  <StartShell
                    start={{ ...start }}
                    StartComponent={startBit.Start}
                    onNext={async () => {}}
                  />
                </Box>
              </TabPanel>
              <TabPanel>
                <startBit.ViewForm name="" />
              </TabPanel>
            </Tabs>
          </FormProvider>
        </Card>
        <Card>
          <CardHeader>Imports</CardHeader>
          <CardContent>
            This is a list of all exported components and functions. These are
            only relevant if you want to use this start in a standalone way.
            <Code language="javascript">{`import {
  Start, StartSchema,
  ViewForm
} from "@bitflow/start-${toKebab(name)}"`}</Code>
            <ul>
              <li>
                <b>Start</b>: The component displays the start.
              </li>
              <li>
                <b>ViewForm</b>: A form to set the neccessary data for a start.
              </li>
              <li>
                <b>StartSchema</b>: Is a{" "}
                <Link external href="https://github.com/colinhacks/zod">
                  zod
                </Link>{" "}
                schema, which can be used to validate an start object. It
                follows the JSON schema down below.
              </li>
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>Usage</CardHeader>
          <CardContent>
            We recommand that you wrap this component with the{" "}
            <Link href="/docs/shells/start">StartShell component</Link> like so,
            if you want to use the component on its own.
            <Code language="typescript">{`import { StartShell } from "@bitflow/shell";
import { evaluate, Start } from "@bitflow/start-${toKebab(name)}";

const My = () => (
  <StartShell
    onNext={async () => {}}
    StartComponent={Start}
    start={input}
  />
);
            `}</Code>
            You can also use this start with the{" "}
            <Link href="/docs/do">Do component</Link>.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>JSON Schema</CardHeader>
          <CardContent>
            If you do not want to use the provided forms to create an start
            object, you can build something yourself which produces a object,
            which follows this JSON schema.
            <Code language="json">
              {JSON.stringify(zodToJsonSchema(startBit.StartSchema), null, 2)}
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
  const paths = Object.keys(bits.start).map((id) => ({
    params: { id },
  }));
  return {
    paths,
    fallback: false,
  };
}
