import {
  Box,
  Grid,
  Main,
  PageHeader,
  Sidenav,
  SidenavProps,
} from "@openpatch/patches";
import { useRouter } from "next/router";
import { FC } from "react";
import { NavLayout } from "./NavLayout";

export type DocLayoutProps = {
  meta: {
    title: string;
  };
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
      {
        href: "/docs/bits/end-tries",
        label: "End - Tries",
      },
      {
        href: "/docs/bits/input-markdown",
        label: "Input - Markdown",
      },
      {
        href: "/docs/bits/start-simple",
        label: "Start - Simple",
      },
      {
        href: "/docs/bits/task-choice",
        label: "Task - Choice",
      },
      {
        href: "/docs/bits/task-fill-in-the-blank",
        label: "Task - Fill in the blank",
      },
      {
        href: "/docs/bits/task-input",
        label: "Task - Input",
      },
      {
        href: "/docs/bits/title-simple",
        label: "Title - Simple",
      },
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
        href: "/docs/shells/input",
        label: "Input",
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
    href: "/docs/contributing",
    label: "Contributing",
    links: [
      {
        href: "/docs/contributing/new-bit",
        label: "New Bit",
      },
      {
        href: "/docs/contributing/new-flow-node",
        label: "New Flow Node",
      },
      {
        href: "/docs/contributing/update-translations",
        label: "Update Translations",
      },
      {
        href: "/docs/contributing/new-language",
        label: "New Language",
      },
      {
        href: "/docs/contributing/bug-report",
        label: "Bug Report",
      },
    ],
  },
];

export const DocLayout: FC<DocLayoutProps> = ({
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
          {children}
        </Grid>
      </Main>
    </NavLayout>
  );
};
