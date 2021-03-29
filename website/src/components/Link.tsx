import { Link as PLink, LinkProps as PLinkProps } from "@openpatch/patches";
import NLink, { LinkProps as NLinkProps } from "next/link";

export type LinkProps = PLinkProps & NLinkProps & { anchor?: string };

export const Link = ({
  href,
  as,
  prefetch,
  replace,
  scroll,
  shallow,
  locale,
  anchor,
  ...props
}: LinkProps) => {
  if (anchor) {
    return <PLink href={anchor} {...props} />;
  }

  return (
    <NLink
      as={as}
      href={href}
      prefetch={prefetch}
      replace={replace}
      scroll={scroll}
      shallow={shallow}
      locale={locale}
      passHref
    >
      <PLink {...props} />
    </NLink>
  );
};
