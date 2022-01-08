import {
  AutoGrid,
  Badge,
  Box,
  Text,
  Card,
  CardContent,
  CardHeader,
  CardFooter,
  Link,
} from "@openpatch/patches";
import { GetStaticProps } from "next";
import { useRouter } from "next/router";
import { DocLayout } from "../../components/DocLayout";

type Pkg = {
  name: string;
  description?: string;
  keywords?: string[];
};

const KeywordLink = ({ keyword }: { keyword: string }) => {
  const router = useRouter();
  const { keyword: activeKeyword } = router.query;
  return (
    <Badge tone={activeKeyword === keyword ? "primary" : "neutral"}>
      <Link href={`?keyword=${keyword}`}>{keyword}</Link>
    </Badge>
  );
};

export default function Examples({
  examples,
  keywords,
}: {
  examples: Pkg[];
  keywords: string[];
}) {
  const router = useRouter();
  const { keyword } = router.query;

  if (typeof keyword === "string" && keyword !== "all") {
    examples = examples.filter((e) => e.keywords?.includes(keyword));
  }

  return (
    <DocLayout meta={{ title: "Examples" }}>
      <Card>
        <CardContent>
          <Text>
            Enjoy our selection of Bitflow examples to lern from or incorporate
            into your projects.
          </Text>
        </CardContent>
        <CardFooter>
          <KeywordLink keyword="all" />
          {keywords?.map((k) => (
            <KeywordLink keyword={k} key={k} />
          ))}
        </CardFooter>
      </Card>
      <Box mt="standard">
        <AutoGrid columns={[1, 2, 2]}>
          {examples.map((e) => (
            <Card key={e.name}>
              <CardHeader
                href={`https://github.com/openpatch/bitflow/tree/main/examples/${e.name}`}
              >
                {e.name}
              </CardHeader>
              <CardContent>{e.description}</CardContent>
              <CardFooter>
                {e.keywords?.map((k) => (
                  <KeywordLink keyword={k} key={k} />
                ))}
              </CardFooter>
            </Card>
          ))}
        </AutoGrid>
      </Box>
    </DocLayout>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const fs = require("fs/promises");
  const path = require("path");
  const process = require("process");

  const examplesPath = path.join(process.cwd(), "..", "examples");
  const examplesDirs: string[] = await fs.readdir(examplesPath);

  const keywords = new Set<string>([]);
  const examples: Pkg[] = await Promise.all(
    examplesDirs.map(async (dir) => {
      const pkgFile = await fs.readFile(
        path.join(examplesPath, dir, "package.json")
      );
      const pkgJson: Pkg = JSON.parse(pkgFile);

      pkgJson.keywords?.forEach((k) => keywords.add(k));
      pkgJson.name = dir;

      return pkgJson;
    })
  );

  return {
    props: {
      examples,
      keywords: Array.from(keywords),
    },
  };
};
