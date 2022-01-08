import { makeLinkComponent } from "@openpatch/patches";
import NextLink from "next/link";

export const Link = makeLinkComponent(({ href, ...restProps }, ref) =>
  href[0] === "/" ? (
    <NextLink href={href} passHref>
      <a ref={ref} {...restProps}></a>
    </NextLink>
  ) : (
    <a href={href} ref={ref} {...restProps} />
  )
);
