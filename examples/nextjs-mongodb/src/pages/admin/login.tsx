import {
  Box,
  ButtonPrimary,
  Card,
  CardContent,
  CardFooter,
  Container,
  Form,
  FormErrorText,
  FormLabel,
  Input,
  PasswordInput,
  PatternCenter,
} from "@openpatch/patches";
import { post } from "@utils/fetcher";
import { useRouter } from "next/router";
import { FormEvent, useState } from "react";

export default function Login() {
  const router = useRouter();
  const redirect = router.query.redirect as string;
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const login = (e?: FormEvent) => {
    e?.preventDefault();
    post("/api/auth/login", {
      emailOrUsername,
      password,
    })
      .then((res) => {
        if (res.status === 200) {
          if (redirect) {
            router.push(redirect);
          } else {
            router.push("/admin");
          }
        } else if (res.status === 401) {
          setError("Invalid username/e-mail or password.");
        }
      })
      .catch((e) => {
        console.error(e);
      });
  };

  return (
    <PatternCenter>
      <Box p="standard">
        <Container maxWidth="small">
          <Form onSubmit={login}>
            <Card>
              <CardContent>
                <FormLabel htmlFor="emailOrUsername">
                  Username or E-Mail
                </FormLabel>
                <Input
                  id="emailOrUsername"
                  value={emailOrUsername}
                  onChange={setEmailOrUsername}
                />
                <FormLabel htmlFor="password">Password</FormLabel>
                <PasswordInput
                  id="password"
                  value={password}
                  onChange={setPassword}
                />
                {error && <FormErrorText>{error}</FormErrorText>}
              </CardContent>
              <CardFooter>
                <ButtonPrimary type="submit" fullWidth onClick={login}>
                  Log In
                </ButtonPrimary>
              </CardFooter>
            </Card>
          </Form>
        </Container>
      </Box>
    </PatternCenter>
  );
}
