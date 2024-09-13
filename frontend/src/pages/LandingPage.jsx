import { useState } from "react";
import SignIn from "./SignIn";
import CreateAccount from "./CreateAccount";
import { Transition } from "@headlessui/react";

function LandingPage({ setPassword }) {
  const [showCreateAccount, setShowCreateAccount] = useState(false); // State to show the create account form
  const [showSignIn, setShowSignIn] = useState(true); // State to show the sign in form

  return (
    <div className="flex bg-gradient-to-r from-purple-600 via-rose-600 to-purple-600 bg-[length:200%_auto] animate-gradient h-screen flex-col justify-center">
      <div
        className="relative bg-gray-200 bg-opacity-50 mx-auto flex justify-center items-center h-[45rem] w-[40rem] shadow-md rounded-xl overflow-auto"
        style={{ maxHeight: "90vh" }}
      >
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

        <Transition
          show={showCreateAccount}
          enter="transition-opacity duration-300 delay-100 "
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
          afterLeave={() => setShowSignIn(true)}
        >
          <div className="">
            <CreateAccount
              setPassword={setPassword}
              setShowCreateAccount={setShowCreateAccount}
            />
          </div>
        </Transition>
      </div>
    </div>
  );
}

export default LandingPage;
