import { EndBit } from "@bitflow/core";
import { generateDoResult } from "@bitflow/mock";
import { EndShell } from "@bitflow/shell";
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
import { toKebab, toSentence } from "../utils/case";
import { DocLayout } from "./DocLayout";

export type EndBitDocProps<T extends Bitflow.End> = {
  endBit: EndBit;
  name: string;
  example: T;
  description: string;
};

export function EndBitDoc<T extends Bitflow.End>({
  endBit,
  name,
  example,
  description,
}: EndBitDocProps<T>) {
  const formDefaultValues = example as DefaultValues<T>;
  const methods = useForm<T>({
    resolver: zodResolver(endBit.EndSchema),
    reValidateMode: "onBlur",
    shouldUnregister: false,
    defaultValues: formDefaultValues,
    mode: "onBlur",
  });
  const end = methods.watch() as any;

  return (
    <DocLayout meta={{ title: `End - ${toSentence(name)}` }}>
      <Grid gridGap="standard">
        <Card>
          <CardHeader>Description</CardHeader>
          <CardContent>{description}</CardContent>
          <CardFooter>
            <ButtonGroup space="standard">
              <ButtonSecondaryLink
                href={`https://github.com/openpatch/bitflow/tree/main/packages/end-${toKebab(
                  name
                )}`}
              >
                View Repository
              </ButtonSecondaryLink>
              <ButtonSecondaryLink
                href={`https://www.npmjs.com/package/@bitflow/end-${toKebab(
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
            This is an interactive example of the {toSentence(name)} end.
          </CardContent>
          <FormProvider {...methods}>
            <Tabs>
              <TabList inverted>
                <Tab>End</Tab>
                <Tab>View Form</Tab>
              </TabList>
              <TabPanel p="none">
                <Box position="relative" height="600px" overflowY="auto">
                  <EndShell
                    EndComponent={endBit.End}
                    end={{ ...end }}
                    getResult={generateDoResult}
                    onNext={async () => {}}
                  />
                </Box>
              </TabPanel>
              <TabPanel>
                <endBit.ViewForm name="" />
              </TabPanel>
            </Tabs>
          </FormProvider>
        </Card>
        <Card>
          <CardHeader>Imports</CardHeader>
          <CardContent>
            This is a list of all exported components and functions. These are
            only relevant if you want to use this end in a standalone way.
            <Code language="javascript">{`import { 
  End, EndSchema, 
  ViewForm 
} from "@bitflow/end-${toKebab(name)}"`}</Code>
            <ul>
              <li>
                <b>End</b>: The component displays the end.
              </li>
              <li>
                <b>ViewForm</b>: A form to set the neccessary data for a end.
              </li>
              <li>
                <b>EndSchema</b>: Is a{" "}
                <Link external href="https://github.com/colinhacks/zod">
                  zod
                </Link>{" "}
                schema, which can be used to validate an end object. It follows
                the JSON schema down below.
              </li>
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>Usage</CardHeader>
          <CardContent>
            We recommand that you wrap this component with the{" "}
            <Link href="/docs/shells/end">EndShell component</Link> like so, if
            you want to use the component on its own.
            <Code language="typescript">{`import { EndShell } from "@bitflow/shell";
import { evaluate, End } from "@bitflow/end-${toKebab(name)}";
 
const My = () => (
  <EndShell
    onNext={async () => {}}
    EndComponent={End}
    end={end}
  />
);
            `}</Code>
            You can also use this end with the{" "}
            <Link href="/docs/do">Do component</Link>.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>JSON Schema</CardHeader>
          <CardContent>
            If you do not want to use the provided forms to create an end
            object, you can build something yourself which produces a object,
            which follows this JSON schema.
            <Code language="json">
              {JSON.stringify(zodToJsonSchema(endBit.EndSchema), null, 2)}
            </Code>
          </CardContent>
        </Card>
      </Grid>
    </DocLayout>
  );
}