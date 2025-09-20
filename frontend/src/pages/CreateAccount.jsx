import React, { useEffect, useState, useContext } from "react";
import { useForm } from "react-hook-form";
import { Form } from "react-router-dom";
import Input from "../components/Input";
import { useSocket } from "../context/SocketContext";
import { userContext } from "../context/UserContext";

const CreateAccount = ({
  setPassword,
  setShowCreateAccount,
  setShowSetUp,
  createAccountData,
  setCreateAccountData,
  handleBackClick,
}) => {
  const socket = useSocket();
  const {
    register,
    formState: { errors },
    handleSubmit,
  } = useForm();

  const onSubmit = handleSubmit((data) => {
    console.log("Data:", data);
    if (socket) {
      // check if email and username are being used already in db
      socket.emit("check_existing_user", data);

      socket.once("user_check_result", async (result) => {
        if (result.emailExists) {
          alert("Email is already being used!");
          return;
        } else if (result.usernameExists) {
          alert("Username already exists!");
          return;
        } else {
          if (data.password === data.confirmPassword) {
            setCreateAccountData({
              email: data.email,
              username: data.username,
              password: data.password,
            }); // Store account data in state
            setPassword(data.password); // Set the password state
            setShowCreateAccount(false); // Hide create account form
          } else {
            alert("Passwords do not match");
          }
        }
      });
    }
    return () => {
      if (socket) {
        socket.off("user_check_result");
      }
    };
  });
  return (
    <div className="">
      <button
        className="absolute top-5 left-5 px-2 py-1 bg-gray-100 hover:bg-opacity-40 bg-opacity-70 rounded-lg font-semibold"
        onClick={handleBackClick}
      >
        Back
      </button>
      <div className="sm:mx-auto sm:w-full px-6 sm:max-w-sm">
        <form className=" space-y-3" onSubmit={onSubmit} noValidate>
          <img
            className="mx-auto md:h-28 h-24 md:mt-8 mt-20 w-auto"
            src="./favicon.png"
            alt="TeeChat"
          />

          <h2 className="mt-10 text-center md:text-xl text-[1.6rem] font-bold leading-9 tracking-tight text-gray-900">
            Create an account
          </h2>
          <h5 className="text-center text-[0.9rem] mb-6">
            Create an account to start chatting with the world!
          </h5>
          <Input
            type="email"
            register={register}
            errors={errors}
            defaultValue={createAccountData.email}
          />
          <Input
            type="username"
            register={register}
            errors={errors}
            defaultValue={createAccountData.username}
          />
          <Input
            type="password"
            register={register}
            errors={errors}
            defaultValue={createAccountData.password}
          />
          <Input
            type="confirmPassword"
            register={register}
            errors={errors}
            defaultValue={createAccountData.confirmPassword}
          />

          <div>
            <button
              type="submit"
              className="flex w-full justify-center rounded-md bg-purple-600 my-6 px-3 md:py-2 py-[0.3rem] text-sm font-semibold leading-6 text-white shadow-sm hover:bg-purple-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600"
            >
              Next
            </button>
          </div>
          <div>
            <h5 className="mt-6 text-center md:text-[1rem] text-[0.8rem] leading-3 tracking-tight text-gray-900">
              Already have an account? &nbsp;
              <div
                className="inline-flex hover:cursor-pointer text-purple-600 hover:text-purple-400 font-semibold"
                // onClick={clickSignIn}
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
