import { runAuth } from "@middlewares/auth";
import {
  AutoGrid,
  Box,
  ButtonSecondary,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  Container,
  Form,
  FormLabel,
  Input,
  PasswordInput,
  PatternCenter,
  useConfirm,
} from "@openpatch/patches";
import { User } from "@schemas/user";
import { del } from "@utils/fetcher";
import { postUser } from "@utils/user";
import { useUsers } from "hooks/user";
import { GetServerSideProps } from "next";
import { useState } from "react";

export default function Users() {
  const [users, { mutate }] = useUsers();
  const [selectedUser, setSelectedUser] = useState<User>();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    submitting: false,
  });
  const onDelete = () => {
    if (selectedUser) {
      del("/api/users/" + selectedUser._id).then(() => {
        mutate({
          users: users.filter((u) => u._id !== selectedUser._id),
        });
      });
    }
  };

  const [requestDelete, deleteModal, setTitle] = useConfirm({
    onConfirm: onDelete,
    title: "Are you sure you want to delete the user?",
    severity: "danger",
    labels: {
      cancel: "Cancel",
      confirm: "Delete",
    },
  });

  const handleDelete = (user: User) => {
    setTitle(`Are you sure you want to delte ${user.username}`);
    setSelectedUser(user);
    requestDelete();
  };

  const handleCreate = () => {
    setForm((f) => ({ ...f, submitting: true }));
    postUser(form)
      .then((r) => r.json())
      .then((user) => {
        mutate({
          users: [...users, user],
        });
        setForm((f) => ({
          username: "",
          email: "",
          password: "",
          submitting: false,
        }));
      })
      .catch(() => {
        setForm((f) => ({ ...f, submitting: false }));
      });
  };

  return (
    <PatternCenter>
      {deleteModal}
      <Box p="standard" width="100%">
        <Container maxWidth="small">
          <AutoGrid gap="standard">
            {users.map((user) => (
              <Card key={user._id}>
                <CardHeader>{user.username}</CardHeader>
                <CardContent>{user.email}</CardContent>
                <CardFooter>
                  <ButtonSecondary
                    tone="error"
                    onClick={() => handleDelete(user)}
                  >
                    Delete
                  </ButtonSecondary>
                </CardFooter>
              </Card>
            ))}
            <Card>
              <CardHeader>Create User</CardHeader>
              <Form onSubmit={handleCreate}>
                <CardContent>
                  <FormLabel htmlFor="username">Username</FormLabel>
                  <Input
                    id="username"
                    value={form.username}
                    onChange={(v) => setForm((f) => ({ ...f, username: v }))}
                  />
                  <FormLabel htmlFor="email">E-Mail</FormLabel>
                  <Input
                    id="email"
                    value={form.email}
                    onChange={(v) => setForm((f) => ({ ...f, email: v }))}
                  />
                  <FormLabel htmlFor="password">Password</FormLabel>
                  <PasswordInput
                    id="password"
                    value={form.password}
                    error={form.password.length < 8}
                    onChange={(v) => setForm((f) => ({ ...f, password: v }))}
                  />
                </CardContent>
                <CardFooter>
                  <ButtonSecondary type="submit" loading={form.submitting}>
                    Create
                  </ButtonSecondary>
                </CardFooter>
              </Form>
            </Card>
          </AutoGrid>
        </Container>
      </Box>
    </PatternCenter>
  );
}

export const getServerSideProps: GetServerSideProps = async ({
  req,
  res,
  resolvedUrl,
}) => {
  const user = await runAuth(req, res);
  if (user === null) {
    return {
      redirect: {
        destination: "/admin/login?redirect=" + encodeURIComponent(resolvedUrl),
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
};
