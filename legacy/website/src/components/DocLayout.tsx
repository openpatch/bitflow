import {
  Box,
  Grid,
  Main,
  PageHeader,
  Sidenav,
  SidenavProps,
} from "@openpatch/patches";
import { useRouter } from "next/router";
import { FC, PropsWithChildren } from "react";
import { NavLayout } from "./NavLayout";
import {
  taskBits,
  startBits,
  titleBits,
  inputBits,
  endBits,
} from "@bitflow/bits";

export type DocLayoutProps = {
  meta: {
    title: string;
  };
};

const transformName = (s: string) => {
  return s
    .split("-")
    .map((s) => s[0].toUpperCase() + s.substring(1))
    .join(" ");
};

const nav: SidenavProps["sections"] = [
  {
    href: "/docs/getting-started",
    label: "Getting Started",
  },
  {
    href: "/docs/flow",
    label: "Flow",
  },
  {
    href: "/docs/bits",
    label: "Bits",
    links: [
      ...Object.keys(startBits).map((b) => ({
        href: `/docs/bits/start/${b}`,
        label: `Start - ${transformName(b)}`,
      })),
      ...Object.keys(taskBits).map((b) => ({
        href: `/docs/bits/task/${b}`,
        label: `Task - ${transformName(b)}`,
      })),
      ...Object.keys(titleBits).map((b) => ({
        href: `/docs/bits/title/${b}`,
        label: `Title - ${transformName(b)}`,
      })),
      ...Object.keys(inputBits).map((b) => ({
        href: `/docs/bits/input/${b}`,
        label: `Input - ${transformName(b)}`,
      })),
      ...Object.keys(endBits).map((b) => ({
        href: `/docs/bits/end/${b}`,
        label: `End - ${transformName(b)}`,
      })),
    ],
  },
  {
    href: "/docs/do",
    label: "Do",
  },
  {
    href: "/docs/shells",
    label: "Shells",
    links: [
      {
        href: "/docs/shells/end",
        label: "End",
      },
      {
        href: "/docs/shells/input",
        label: "Input",
      },
      {
        href: "/docs/shells/start",
        label: "Start",
      },
      {
        href: "/docs/shells/task",
        label: "Task",
      },
      {
        href: "/docs/shells/title",
        label: "Title",
      },
    ],
  },
  {
    href: "/docs/report",
    label: "Report",
  },
  {
    href: "/docs/examples",
    label: "Examples",
  },
  {
    href: "/docs/contributing",
    label: "Contributing",
    links: [
      {
        href: "/docs/contributing/bug-report",
        label: "Bug Report",
      },
      {
        href: "/docs/contributing/update-translations",
        label: "Update Translations",
      },
      {
        href: "/docs/contributing/new-end-bit",
        label: "New End Bit",
      },
      {
        href: "/docs/contributing/new-input-bit",
        label: "New Input Bit",
      },
      {
        href: "/docs/contributing/new-task-bit",
        label: "New Task Bit",
      },
      {
        href: "/docs/contributing/new-start-bit",
        label: "New Start Bit",
      },
      {
        href: "/docs/contributing/new-title-bit",
        label: "New Title Bit",
      },
      {
        href: "/docs/contributing/new-flow-node",
        label: "New Flow Node",
      },
      {
        href: "/docs/contributing/new-language",
        label: "New Language",
      },
    ],
  },
];

export const DocLayout: FC<PropsWithChildren<DocLayoutProps>> = ({
  children,
  meta: { title },
}) => {
  const router = useRouter();

  return (
    <NavLayout active="docs">
      <PageHeader variant="overlap">{title}</PageHeader>
      <Main variant="overlap">
        <Grid gridGap="standard" gridTemplateColumns={["1fr", "240px 1fr"]}>
          <Box>
            <Sidenav
              position={["initial", "sticky"]}
              sections={nav.map((n) => ({
                ...n,
                active: router.pathname.includes(n.href),
                links: router.pathname.includes(n.href)
                  ? n.links?.map((l) => ({
                      ...l,
                      active: l.href === router.pathname,
                    }))
                  : [],
              }))}
            />
          </Box>
          <Box>{children}</Box>
        </Grid>
      </Main>
    </NavLayout>
  );
};
