import { useState } from "react";
import SignIn from "./SignIn";
import CreateAccount from "./CreateAccount";
import SetUpProfile from "./SetUpProfile";
import { Transition } from "@headlessui/react";

function LandingPage({ setPassword }) {
  const [showCreateAccount, setShowCreateAccount] = useState(false); // State to show the create account form
  const [showSignIn, setShowSignIn] = useState(true); // State to show the sign in form
  const [showSetUp, setShowSetUp] = useState(false); // State to show set up profile form

  // state for navigating BACK  to the previous form
  const [navigateToSignIn, setNavigateToSignIn] = useState(false); // State to track "Back" navigation
  const [navigateToCreateAccount, setNavigateToCreateAccount] = useState(false); // State to track "Back" navigation

  const [createAccountData, setCreateAccountData] = useState({
    email: "",
    username: "",
    password: "",
  });
  const [profileData, setProfileData] = useState({
    birthday: "",
    interests: [],
    socials: {
      facebook: "",
      instagram: "",
      linkedin: "",
    },
  });

  const handleBackClick_createAccount = () => {
    setNavigateToSignIn(true); // Set this to true when clicking "Back" on the create account form
    setShowCreateAccount(false);
  };
  const handleBackClick_setUp = () => {
    setNavigateToCreateAccount(true);
    setShowSetUp(false);
  };

  return (
    <div className="flex bg-gradient-to-r from-purple-600 via-rose-600 to-purple-600 bg-[length:200%_auto] animate-gradient h-screen flex-col justify-center">
      <div
        className="relative bg-gray-200 bg-opacity-60 mx-auto flex justify-center items-center h-[45rem] w-[40rem] shadow-md rounded-xl overflow-auto"
        style={{ maxHeight: "90vh" }}
      >
        {/* SignIn Transition */}
        <Transition
          show={showSignIn}
          enter="transition-opacity duration-300 delay-100"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
          afterLeave={() => setShowCreateAccount(true)}
        >
          <div className="">
            <SignIn setPassword={setPassword} setShowSignIn={setShowSignIn} />
          </div>
        </Transition>

        {/* CreateAccount Transition */}
        <Transition
          show={showCreateAccount}
          enter="transition-opacity duration-300 delay-100"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
          afterLeave={() =>
            navigateToSignIn ? setShowSignIn(true) : setShowSetUp(true)
          }
        >
          <div className="">
            <CreateAccount
              setPassword={setPassword}
              setShowCreateAccount={setShowCreateAccount}
              setShowSetUp={setShowSetUp}
              createAccountData={createAccountData}
              setCreateAccountData={setCreateAccountData}
              handleBackClick={handleBackClick_createAccount}
            />
          </div>
        </Transition>

        {/* SetUpProfile Transition */}
        <Transition
          show={showSetUp}
          enter="transition-opacity duration-300 delay-100"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
          afterLeave={() =>
            navigateToCreateAccount && setShowCreateAccount(true)
          }
        >
          <div>
            <SetUpProfile
              setShowCreateAccount={setShowCreateAccount}
              setShowSetUp={setShowSetUp}
              profileData={profileData}
              setProfileData={setProfileData}
              createAccountData={createAccountData}
              handleBackClick={handleBackClick_setUp}
            />
          </div>
        </Transition>
      </div>
    </div>
  );
}

export default LandingPage;
