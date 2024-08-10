import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { set } from "mongoose";
import { useForm } from "react-hook-form";
import Input from "../components/Input";
import { useSocket } from "../context/SocketContext";

function SignIn({ setUsername, setPassword }) {
  const [userNameContent, setUsernameContent] = useState(""); // State for the content in username input field
  const [passwordContent, setPasswordContent] = useState(""); // State for the content in password input field

  const navigate = useNavigate();
  const {
    register,
    formState: { errors },
    handleSubmit,
  } = useForm();

  const socket = useSocket(); // Use custom hook to get the socket object from the context

  // const onUserNameChange = (e) => {
  //   console.log("User name change:", e.target.value);
  //   setUsernameContent(e.target.value); // Update the state with the content in the input field
  // };
  // const onPasswordChange = (e) => {
  //   console.log("Password change:", e.target.value);
  //   setPasswordContent(e.target.value); // Update the state with the content in the input field
  // };

  useEffect(() => {
    // Set up the sign-in response listener once
    if (!socket) return;
    socket.on("sign_in_response", (response) => {
      if (response) {
        console.log("Sign in successful");
        navigate("/main");
      } else {
        console.log("Sign in failed");
        alert("Username or password is incorrect");
      }
    });

    // Clean up the listener when the component is unmounted
    return () => {
      socket.off("sign_in_response");
    };
  }, [socket, navigate]);

  const onSubmit = handleSubmit((data) => {
    console.log("Sign In Data:", data);
    setUsername(data.username);
    setPassword(data.password);
    // Emit a "sign_in" event to the server to check the user credentials
    socket.emit("sign_in", data.username, data.password);
  });

  const handleCreateAccount = () => {
    navigate("/create-account");
  };

  return (
    <div className="flex min-h-full flex-col justify-center px-6 py-24 2xl:py-80 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <img
          className="mx-auto h-20 w-auto"
          src="./favicon.png"
          alt="TeeChat"
        />
        <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
          Sign in
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <form
          className="space-y-6"
          action="#"
          method="POST"
          onSubmit={onSubmit}
          noValidate
        >
          <Input type="username" register={register} errors={errors} />

          <div>
            <div className="flex items-center justify-between">
              <label
                for="password"
                className="block text-md font-bold leading-6 text-gray-900"
              >
                Password
              </label>

              <div className="text-sm">
                <a
                  href="#"
                  className="font-semibold text-purple-600 hover:text-purple-500"
                >
                  Forgot password?
                </a>
              </div>
            </div>
            <div className="mt-2">
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="block w-full rounded-md border-0 ps-2 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-purple-300 sm:text-sm sm:leading-6"
                {...register("password", { required: true })}
              />
            </div>
            {errors.password?.type === "required" && (
              <p className="text-red-500 text-sm">* This field is required</p>
            )}
          </div>

          <div>
            <button
              type="submit"
              className="flex w-full justify-center rounded-md bg-purple-600 px-3 py-2 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-purple-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600"
            >
              Sign in
            </button>
          </div>
        </form>

        <h4 className="mt-6 text-center leading-9 tracking-tight text-gray-900">
          Don't have an account? &nbsp;
          <div
            className="inline-flex hover:cursor-pointer text-purple-600 hover:text-purple-400 font-semibold"
            onClick={handleCreateAccount}
          >
            Create an account.
          </div>
        </h4>
      </div>
    </div>
  );
}

export default SignIn;
