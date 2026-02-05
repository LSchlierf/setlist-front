import { useState } from "react";
import { Button } from "./ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import storage from "@/lib/storage";

export type LoginCardProps = {
  onClose: () => void;
  onLogin: (loggedIn: boolean) => void;
};

export default function LoginCard({ onClose, onLogin }: LoginCardProps) {
  const [loggedIn, setLoggedIn] = useState(storage.user !== undefined);
  const [login, setLogin] = useState(true);
  const [changePw, setChangePw] = useState(false);
  const [error, setError] = useState<boolean | string>(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword1, setNewPassword1] = useState("");
  const [newPassword2, setNewPassword2] = useState("");

  const doLogin = async () => {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username: username, password: password }),
    });
    if (!response.ok) {
      setError(true);
      return;
    }
    const token = await response.json();
    localStorage.setItem("AUTH_TOKEN", token);
    if (await storage.init()) {
      setLoggedIn(true);
      onLogin(true);
      onClose();
    }
  };

  const doSignup = async () => {
    const response = await fetch("/api/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username: username, password: password }),
    });
    if (!response.ok) {
      const message = await response.json();
      setError(!!message.error ? message.error : true);
      return;
    }
    const token = await response.json();
    localStorage.setItem("AUTH_TOKEN", token);
    if (await storage.init()) {
      setLoggedIn(true);
      onLogin(true);
      onClose();
    }
  };

  const formSubmit = () => {
    login ? doLogin() : doSignup();
  };

  const LogoutFrom = () => (
    <Card className="w-full max-w-sm fixed top-[50%] left-[50%] transform-(--center-transform)">
      <CardHeader>
        <CardTitle>Logged in as {storage.user?.name}</CardTitle>
      </CardHeader>
      <CardFooter className="flex-col gap-2">
        <Button
          className="w-full"
          onClick={() => {
            storage.logout();
            setLoggedIn(false);
            onLogin(false);
            onClose();
          }}
        >
          Log out
        </Button>
        <Button
          className="w-full"
          onClick={() => setChangePw(true)}
          variant={"secondary"}
        >
          Change Password
        </Button>
        <Button className="w-full" onClick={onClose} variant="secondary">
          Close
        </Button>
      </CardFooter>
    </Card>
  );

  const changePasswordForm = () => (
    <Card className="w-full max-w-sm absolute top-[50%] left-[50%] transform-(--center-transform)">
      <CardHeader>
        <CardTitle>Change password for {storage.user?.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-6">
          <div className="grid gap-2">
            <Label htmlFor="password">Old Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            ></Input>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="newPassword1">New Password</Label>
            <Input
              id="newPassword1"
              type="password"
              placeholder="Password"
              value={newPassword1}
              onChange={(e) => setNewPassword1(e.target.value)}
            ></Input>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="newPassword2">Repeat New Password</Label>
            <Input
              id="newPassword2"
              type="password"
              placeholder="Password"
              value={newPassword2}
              onChange={(e) => setNewPassword2(e.target.value)}
            ></Input>
          </div>
          {newPassword2.length > 0 &&
            (newPassword1 === newPassword2
              ? "New Passwords match"
              : "New Passwords don't match")}

          <Button
            disabled={
              password.length < 1 ||
              newPassword1.length < 6 ||
              newPassword1 !== newPassword2
            }
            onClick={() =>
              storage
                .changePassword(password, newPassword1)
                .then((v) =>
                  v ? onClose() : setError("Error while changing password")
                )
            }
          >
            Submit
          </Button>
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full" onClick={onClose} variant="secondary">
          Close
        </Button>
      </CardFooter>
    </Card>
  );

  const ErrorForm = () => (
    <Card className="w-full max-w-sm absolute top-[50%] left-[50%] transform-(--center-transform)">
      <CardHeader>
        <CardTitle>Error</CardTitle>
        <CardDescription>
          That didn't work
          {typeof error === "string" && (
            <>
              :<br />
              {error}
            </>
          )}
        </CardDescription>
      </CardHeader>
      <CardFooter className="flex-col gap-2">
        <Button className="w-full" onClick={() => setError(false)}>
          Try again
        </Button>
        <Button className="w-full" onClick={onClose} variant="secondary">
          Close
        </Button>
      </CardFooter>
    </Card>
  );

  return error ? (
    <ErrorForm />
  ) : loggedIn ? (
    changePw ? (
      changePasswordForm()
    ) : (
      <LogoutFrom />
    )
  ) : (
    <Card className="w-full max-w-sm absolute top-[50%] left-[50%] transform-(--center-transform)">
      <CardHeader>
        <CardTitle>{login ? "Log in to your Account" : "Sign up"}</CardTitle>
        <CardDescription>
          {login
            ? "Enter your username and password below to log in"
            : "Choose a username and password to sign up"}
        </CardDescription>
        <CardAction>
          <Button onClick={() => setLogin((l) => !l)}>
            {login ? "Sign up" : "Log in"}
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-6">
          <div className="grid gap-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            ></Input>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            ></Input>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex-col gap-2">
        <Button className="w-full" onClick={formSubmit}>
          {login ? "Log in" : "Sign up"}
        </Button>
        <Button className="w-full" variant={"secondary"} onClick={onClose}>
          Close
        </Button>
      </CardFooter>
    </Card>
  );
}
