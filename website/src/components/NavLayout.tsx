import { Footer, Nav } from "@openpatch/patches";
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
            label: "Discord",
            href: "https://discord.gg/dCMM4kV",
          },
        ]}
      ></Nav>
      {children}
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
