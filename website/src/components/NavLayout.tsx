import { Footer, Grid, Nav } from "@openpatch/patches";
import { useTranslations } from "@vocab/react";
import { FC } from "react";
import translations from "../locales.vocab";
import { Logo } from "./Logo";

export type NavLayoutProps = {
  active: "docs" | "editor" | "home" | "converter";
};

export const NavLayout: FC<NavLayoutProps> = ({ children }) => {
  const { t } = useTranslations(translations);
  return (
    <Grid gridRow={`auto 1fr auto`}>
      <Nav
        logo={<Logo />}
        links={[
          {
            label: t("documentation"),
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
            href: "/contact",
            label: t("contact"),
          },
        ]}
      ></Footer>
    </Grid>
  );
};
