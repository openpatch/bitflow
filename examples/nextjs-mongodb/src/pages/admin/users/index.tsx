import {
  AutoGrid,
  Box,
  ButtonSecondary,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  Container,
  PatternCenter,
  useConfirm,
} from "@openpatch/patches";
import { User } from "@schemas/user";
import { del } from "@utils/fetcher";
import { useUsers } from "hooks/user";
import { useState } from "react";

export default function Users() {
  const [users, { mutate }] = useUsers();
  const [selectedUser, setSelectedUser] = useState<User>();
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

  return (
    <PatternCenter>
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
          </AutoGrid>
        </Container>
      </Box>
    </PatternCenter>
  );
}
