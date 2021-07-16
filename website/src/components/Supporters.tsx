import {
  AutoGrid,
  Box,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  Image,
  Text,
  TextLink,
} from "@openpatch/patches";
import supportersList from "../../../supporters.json";

type SupporterProps = {
  title: string;
  subtitle?: string;
  logo: string;
  href: string;
};
const Supporter = ({ title, subtitle, logo, href }: SupporterProps) => {
  return (
    <Box display="flex" alignItems="center">
      <Image src={logo} height="80px" m="standard" />
      <Box>
        <TextLink href={href}>{title}</TextLink>
        <Text>{subtitle}</Text>
      </Box>
    </Box>
  );
};

export const Supporters = () => {
  return (
    <Card>
      <CardHeader>Supporters</CardHeader>
      <CardContent>
        <AutoGrid gap="standard">
          {(supportersList as any).map((s: SupporterProps, i: number) => (
            <Supporter key={i} {...s} />
          ))}
        </AutoGrid>
      </CardContent>
      <CardFooter noSpacing>
        <Text pr="xxsmall">Do you want to support Bitflow? Feel free to</Text>
        <TextLink href="mailto:contact@openpatch.org">contact us</TextLink>.
      </CardFooter>
    </Card>
  );
};
