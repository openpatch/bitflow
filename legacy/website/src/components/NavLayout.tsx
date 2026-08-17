import { Box, Footer, Nav } from "@openpatch/patches";
import Link from "next/link";
import Image from "next/image";
import { FC, Fragment, PropsWithChildren } from "react";
import { Logo } from "./Logo";

export type NavLayoutProps = {
  active: "docs" | "editor" | "home" | "converter";
};

export const NavLayout: FC<PropsWithChildren<NavLayoutProps>> = ({
  children,
}) => {
  return (
    <Fragment>
      <Nav
        logo={<Logo />}
        links={[
          {
            label: "Documentation",
            href: "/docs/getting-started",
          },
          {
            label: "GitHub",
            href: "https://github.com/openpatch/bitflow",
          },
          {
            label: "Matrix",
            href: "https://matrix.to/#/#openpatch:matrix.org",
          },
        ]}
      ></Nav>
      {children}
      <Box mb="medium" textAlign="center">
        <Link href="https://vercel.com?utm_source=openpatch&utm_campaign=oss">
          <a>
            <Image
              src="/static/powered-by-vercel-black.svg"
              width={212}
              height={44}
            />
          </a>
        </Link>
      </Box>
      <Footer
        links={[
          {
            href: "mailto:contact@openpatch.org",
            label: "Contact",
          },
        ]}
      ></Footer>
    </Fragment>
  );
};
