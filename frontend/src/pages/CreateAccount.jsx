import React, { useEffect, useState, useContext } from "react";
import { useForm } from "react-hook-form";
import { Form } from "react-router-dom";
import Input from "../components/Input";
import { Link, useNavigate } from "react-router-dom";
import { useSocket } from "../context/SocketContext";
import { userContext } from "../App";

const CreateAccount = ({
  setPassword,
  setShowCreateAccount,
  setShowSetUp,
  createAccountData,
  setCreateAccountData,
  handleBackClick,
}) => {
  const navigate = useNavigate();
  const socket = useSocket();
  const {
    register,
    formState: { errors },
    handleSubmit,
  } = useForm();

  const onSubmit = handleSubmit((data) => {
    console.log("Data:", data);
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
  });

  // const clickSignIn = () => {
  //   setShowCreateAccount(false);
  // };

  return (
    <div className="">
      <button
        className="absolute top-5 left-5 px-3 py-1 bg-gray-100 hover:bg-opacity-40 bg-opacity-70 rounded-lg font-semibold"
        onClick={handleBackClick}
      >
        Back
      </button>
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <form className=" space-y-3" onSubmit={onSubmit} noValidate>
          <img
            className="mx-auto h-28 w-auto"
            src="./favicon.png"
            alt="TeeChat"
          />

          <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
            Create an account
          </h2>
          <h5 className="text-center mb-6">
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
              className="flex w-full justify-center rounded-md bg-purple-600 my-6 px-3 py-2 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-purple-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600"
            >
              Next
            </button>
          </div>
          <div>
            <h5 className="mt-6 text-center leading-3 tracking-tight text-gray-900">
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
