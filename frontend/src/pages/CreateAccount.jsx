import React, { useEffect, useState, useContext } from "react";
import { useForm } from "react-hook-form";
import { Form } from "react-router-dom";
import Input from "../components/Input";
import { Link, useNavigate } from "react-router-dom";
import { useSocket } from "../context/SocketContext";
// import { userContext } from "../App";

const CreateAccount = ({ setPassword }) => {
  const navigate = useNavigate();
  const socket = useSocket();

  // const { setUser } = useContext(userContext);

  useEffect(() => {
    const handleAccountCreated = (response) => {
      if (response.username && response.username) {
        console.log("Account created successfully");
        setUser({ useraname: response.username });
        setPassword(response.username);
        navigate("/main");
      } else if (response === "existing email") {
        alert("Email already exists");
      } else if (response === "existing username") {
        alert("Username already exists");
      }
    };

    if (socket && socket.connected) {
      socket.on("account_created", handleAccountCreated);
    }

    // Cleanup listeners on component unmount
    return () => {
      if (socket) {
        socket.off("account_created", handleAccountCreated);
      }
    };
  }, [socket, navigate, username, password]); // Dependencies include username and password to ensure they are up-to-date

  const {
    register,
    formState: { errors },
    handleSubmit,
  } = useForm();

  const onSubmit = handleSubmit((data) => {
    console.log("Data:", data);
    if (data.password === data.confirmPassword) {
      socket.emit("create_account", data.email, data.username, data.password); // Emit a "create_account" to server to create account and store in database
    } else {
      alert("Passwords do not match");
    }
  });

  const clickSignIn = () => {
    navigate("/sign-in");
  };

  return (
    <div className="flex justify-center py-16 2xl:py-52">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <form className=" space-y-3" onSubmit={onSubmit} noValidate>
          <img
            className="mx-auto h-20 w-auto mb-5"
            src="./favicon.png"
            alt="TeeChat"
          />

          <h2 className="text-center font-bold mb-6">Create an account</h2>
          <h5 className="text-center mb-6">
            Create an account to start chatting with the world!
          </h5>
          <Input type="email" register={register} errors={errors} />
          <Input type="username" register={register} errors={errors} />
          <Input type="password" register={register} errors={errors} />
          <Input type="confirmPassword" register={register} errors={errors} />

          <div>
            <button
              type="submit"
              className="flex w-full justify-center rounded-md bg-purple-600 my-6 px-3 py-2 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-purple-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600"
            >
              Create Account
            </button>
          </div>
          <div>
            <h5 className="mt-6 text-center leading-3 tracking-tight text-gray-900">
              Already have an account? &nbsp;
              <div
                className="inline-flex hover:cursor-pointer text-purple-600 hover:text-purple-400 font-semibold"
                onClick={clickSignIn}
              >
                Sign in here.
              </div>
            </h5>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAccount;
