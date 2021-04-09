import { connectToDatabase } from "@db";
import {
  Box,
  ButtonPrimary,
  Card,
  CardContent,
  CardFooter,
  Container,
  Form,
  FormLabel,
  Input,
  PasswordInput,
  PatternCenter,
} from "@openpatch/patches";
import { post } from "@utils/fetcher";
import { countUsers } from "db/users";
import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { useState } from "react";

export default function Setup() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordCheck, setPasswordCheck] = useState("");

  const createAdmin = () => {
    if (password === passwordCheck) {
      post<{ username: string; email: string; password: string }, any>(
        "/api/auth/signup",
        {
          username,
          email,
          password,
        }
      )
        .then(async (res) => {
          if (res.status === 201) {
            router.push("/admin");
          } else {
            console.error(await res.json());
          }
        })
        .catch((e) => {
          console.error(e);
        });
    }
  };

  return (
    <PatternCenter>
      <Box p="standard">
        <Container maxWidth="small">
          <Card>
            <CardContent>
              <Form>
                <FormLabel htmlFor="username">Username</FormLabel>
                <Input id="username" value={username} onChange={setUsername} />
                <FormLabel htmlFor="email">E-Mail</FormLabel>
                <Input id="email" value={email} onChange={setEmail} />
                <FormLabel htmlFor="password">Password</FormLabel>
                <PasswordInput
                  id="password"
                  value={password}
                  onChange={setPassword}
                />
                <FormLabel htmlFor="passwordCheck">Password Check</FormLabel>
                <PasswordInput
                  id="passwordCheck"
                  value={passwordCheck}
                  onChange={setPasswordCheck}
                  error={password !== passwordCheck}
                />
              </Form>
            </CardContent>
            <CardFooter>
              <ButtonPrimary fullWidth onClick={createAdmin}>
                Create Admin
              </ButtonPrimary>
            </CardFooter>
          </Card>
        </Container>
      </Box>
    </PatternCenter>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  const { db } = await connectToDatabase();
  const count = await countUsers(db);

  if (count > 0) {
    return {
      redirect: {
        destination: "/admin",
        permanent: true,
      },
    };
  }

  return {
    props: {},
  };
};
