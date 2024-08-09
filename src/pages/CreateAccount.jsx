import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Form } from "react-router-dom";
import Input from "../components/Input";
import { Link, useNavigate } from "react-router-dom";

const CreateAccount = ({ setUsername, setPassword }) => {
  // const [usernameContent, setUsernameContent] = useState("");
  // const [email, setEmail] = useState("");
  // const [passwordContent, setPasswordContent] = useState("");
  // const [confirmPassword, setConfirmPassword] = useState("");

  const navigate = useNavigate();

  const {
    register,
    formState: { errors },
    handleSubmit,
  } = useForm();

  const onSubmit = handleSubmit((data) => {
    console.log("Data:", data);
    if (data.password === data.confirmPassword) {
      //   setUsername(usernameContent);
      //   setPassword(passwordContent);
    } else {
      alert("Passwords do not match");
    }
  });

  const clickSignIn = () => {
    navigate("/sign-in");
  };

  return (
    <div className="flex justify-center py-52">
      <div className="space-y-6 sm:mx-auto sm:w-full sm:max-w-sm">
        <form className=" space-y-6" onSubmit={onSubmit} noValidate>
          <img
            className="mx-auto h-20 w-auto mb-5"
            src="./favicon.png"
            alt="TeeChat"
          />

          <h2 className="text-center font-bold mb-6">Create an account</h2>
          <h4 className="text-center mb-6">
            Create an account to start chatting with the world!
          </h4>
          <Input type="email" register={register} errors={errors} />
          <Input type="username" register={register} errors={errors} />
          <Input type="password" register={register} errors={errors} />
          <Input type="confirmPassword" register={register} errors={errors} />

          <div>
            <button
              type="submit"
              className="flex w-full justify-center rounded-md bg-purple-600 px-3 py-2 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-purple-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600"
            >
              Create Account
            </button>
          </div>
          <div>
            <h4 className="mt-6 text-center leading-3 tracking-tight text-gray-900">
              Already have an account? &nbsp;
              <div
                className="inline-flex hover:cursor-pointer text-purple-600 hover:text-purple-400 font-semibold"
                onClick={clickSignIn}
              >
                Sign in here.
              </div>
            </h4>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAccount;
