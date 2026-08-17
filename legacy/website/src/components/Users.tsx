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
import usersList from "../../../users.json";

type UserProps = {
  title: string;
  subtitle?: string;
  logo: string;
  href: string;
};
const User = ({ title, subtitle, logo, href }: UserProps) => {
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

export const Users = () => {
  return (
    <Card>
      <CardHeader>Users</CardHeader>
      <CardContent>
        <AutoGrid gap="standard">
          {(usersList as any).map((s: UserProps, i: number) => (
            <User key={i} {...s} />
          ))}
        </AutoGrid>
      </CardContent>
      <CardFooter noSpacing>
        <Text>
          Do you use Bitflow in one of your project?{" "}
          <TextLink href="mailto:contact@openpatch.org">Contact us</TextLink> to
          be incluced here.
        </Text>
      </CardFooter>
    </Card>
  );
};
