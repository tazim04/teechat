import { useState, useEffect, useContext } from "react";
import { useForm } from "react-hook-form";
import Input from "../components/Input";
import { useSocket } from "../context/SocketContext";
import { Link, useNavigate } from "react-router-dom";
import { userContext } from "../context/UserContext";
import Cookies from "js-cookie";

function SetUpProfile({
  setShowCreateAccount,
  setShowSetUp,
  profileData,
  setProfileData,
  createAccountData,
  handleBackClick,
}) {
  const socket = useSocket();
  const navigate = useNavigate();
  const { setUser } = useContext(userContext);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm();

  const onSubmit = handleSubmit((data) => {
    console.log("Data:", data);
    if (data.password === data.confirmPassword) {
      const socials = {
        instagram: data?.instagram,
        facebook: data?.facebook,
        linkedin: data?.linkedin,
      };
      setProfileData({
        birthday: data.birthday,
        interests: data.interests,
        socials: socials,
      }); // Store account data in state

      if (socket) {
        // Emit a "create_account" event to the server
        socket.emit(
          "create_account",
          createAccountData.email,
          createAccountData.username,
          createAccountData.password,
          data.birthday,
          data.interests,
          socials
        );
      }
    } else {
      alert("Passwords do not match");
    }
  });

  // Handle account creation response
  useEffect(() => {
    const handleAccountCreated = (response) => {
      // Handle account creation response
      if (response.success) {
        console.log("Account created successfully", response);

        setUser(response.user);

        const accessToken = response.accessToken;
        const refreshToken = response.refreshToken;

        Cookies.set("accessToken", accessToken, {
          expires: 15 / 1440, // Expires in 15 minutes
          secure: true,
          sameSite: "Strict",
        });

        Cookies.set("refreshToken", refreshToken, {
          expires: 7, // Token expires in 7 days
          secure: true, // Use secure cookies (HTTPS)
          sameSite: "Strict", // Prevent CSRF attacks
        });

        socket.auth = { accessToken };
        socket.connect();

        navigate("/main");
      } else {
        switch (response.reason) {
          case "email":
            alert("Email already being used!");
            break;
          case "username":
            alert("Username already exist!");
            break;
          default:
            alert("Account creation failed for some reason, sorry! :(");
            break;
        }
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
  }, [socket, navigate]);

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
          <h5 className="text-center mb-6">Let's get to know you better!</h5>
          <Input
            type="birthday"
            register={register}
            errors={errors}
            defaultValue={profileData.birthday}
          />
          <Input
            type="interests"
            register={register}
            errors={errors}
            defaultValue={profileData.interests}
            setValue={setValue}
            watch={watch}
          />
          <Input
            type="socials"
            register={register}
            errors={errors}
            defaultValue={profileData.socials}
          />

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
}

export default SetUpProfile;
