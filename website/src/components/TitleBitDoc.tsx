import { TitleBit } from "@bitflow/core";
import { TitleShell } from "@bitflow/shell";
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

export type TitleBitDocProps<T extends Bitflow.Title> = {
  titleBit: TitleBit<T>;
  example: T;
  name: string;
  description: string;
};

export function TitleBitDoc<T extends Bitflow.Title>({
  titleBit,
  example,
  name,
  description,
}: TitleBitDocProps<T>) {
  const formDefaultValues = example as DefaultValues<T>;
  const methods = useForm<T>({
    resolver: zodResolver(titleBit.TitleSchema),
    reValidateMode: "onBlur",
    shouldUnregister: false,
    defaultValues: formDefaultValues,
    mode: "onBlur",
  });
  const title = methods.watch() as any;

  return (
    <DocLayout meta={{ title: `Title - ${toSentence(name)}` }}>
      <Grid gridGap="standard">
        <Card>
          <CardHeader>Description</CardHeader>
          <CardContent>{description}</CardContent>
          <CardFooter>
            <ButtonGroup space="standard">
              <ButtonSecondaryLink
                href={`https://github.com/openpatch/bitflow/tree/main/packages/title-${toKebab(
                  name
                )}`}
              >
                View Repository
              </ButtonSecondaryLink>
              <ButtonSecondaryLink
                href={`https://www.npmjs.com/package/@bitflow/title-${toKebab(
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
            This is an interactive example of the {toSentence(name)} title.
          </CardContent>
          <FormProvider {...methods}>
            <Tabs>
              <TabList inverted>
                <Tab>Title</Tab>
                <Tab>View Form</Tab>
              </TabList>
              <TabPanel p="none">
                <Box position="relative" height="600px" overflowY="auto">
                  <TitleShell
                    TitleComponent={titleBit.Title}
                    title={{ ...title }}
                    onNext={async () => {}}
                  />
                </Box>
              </TabPanel>
              <TabPanel>
                <titleBit.ViewForm name="" />
              </TabPanel>
            </Tabs>
          </FormProvider>
        </Card>
        <Card>
          <CardHeader>Imports</CardHeader>
          <CardContent>
            This is a list of all exported components and functions. These are
            only relevant if you want to use this title in a standalone way.
            <Code language="javascript">{`import { 
  Title, TitleSchema, 
  ViewForm 
} from "@bitflow/title-${toKebab(name)}"`}</Code>
            <ul>
              <li>
                <b>Title</b>: The component displays the title.
              </li>
              <li>
                <b>ViewForm</b>: A form to set the neccessary data for a title.
              </li>
              <li>
                <b>TitleSchema</b>: Is a{" "}
                <Link external href="https://github.com/colinhacks/zod">
                  zod
                </Link>{" "}
                schema, which can be used to validate an title object. It
                follows the JSON schema down below.
              </li>
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>Usage</CardHeader>
          <CardContent>
            We recommand that you wrap this component with the{" "}
            <Link href="/docs/shells/title">TitleShell component</Link> like so,
            if you want to use the component on its own.
            <Code language="typescript">{`import { TitleShell } from "@bitflow/shell";
import { evaluate, Title } from "@bitflow/title-${toKebab(name)}";
 
const My = () => (
  <TitleShell
    onNext={async () => {}}
    TitleComponent={Title}
    title={input}
  />
);
            `}</Code>
            You can also use this title with the{" "}
            <Link href="/docs/do">Do component</Link>.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>JSON Schema</CardHeader>
          <CardContent>
            If you do not want to use the provided forms to create an title
            object, you can build something yourself which produces a object,
            which follows this JSON schema.
            <Code language="json">
              {JSON.stringify(zodToJsonSchema(titleBit.TitleSchema), null, 2)}
            </Code>
          </CardContent>
        </Card>
      </Grid>
    </DocLayout>
  );
}
