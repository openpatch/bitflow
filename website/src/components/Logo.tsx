import { Box, Text } from "@openpatch/patches";
import * as React from "react";
import { Link } from "./Link";

export function Logo(props: React.SVGProps<SVGSVGElement>) {
  return (
    <Link href="/">
      <Box display="flex" alignItems="center" justifyContent="center">
        <svg
          height="40px"
          width="40px"
          xmlns="http://www.w3.org/2000/svg"
          data-name="Layer 1"
          viewBox="0 0 100 100"
          fill="currentColor"
          {...props}
        >
          <path d="M82.5 41H64.9v-3.2a7 7 0 00-7-7h-18V26h16.6a10 10 0 0010-10v-4a10 10 0 00-10-10h-39a10 10 0 00-10 10v4a10 10 0 0010 10h14.4v5.8a7 7 0 007 7h18V41H42.5a10 10 0 00-10 10v4a10 10 0 0010 10h10.9v9H42.5a10 10 0 00-10 10v4a10 10 0 0010 10h40a10 10 0 0010-10v-4a10 10 0 00-10-10H61.4v-9h21.1a10 10 0 0010-10v-4a10 10 0 00-10-10zm-67-25v-4a2 2 0 012-2h39a2 2 0 012 2v4a2 2 0 01-2 2h-39a2 2 0 01-2-2zm69 68v4a2 2 0 01-2 2h-40a2 2 0 01-2-2v-4a2 2 0 012-2h40a2 2 0 012 2zm0-29a2 2 0 01-2 2h-40a2 2 0 01-2-2v-4a2 2 0 012-2h40a2 2 0 012 2z" />
        </svg>
        <Text fontWeight="bold" ml="standard">
          Bitflow
        </Text>
      </Box>
    </Link>
  );
}
