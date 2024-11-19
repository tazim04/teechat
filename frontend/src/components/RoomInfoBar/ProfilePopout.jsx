import { React, useRef, useContext, useState, useEffect } from "react";
import AvatarIcon from "../AvatarIcon";
import { format, isToday } from "date-fns";
import { userContext } from "../../context/UserContext";
import { isMobileContext } from "../../context/IsMobileContext";
import RemoveParticipantContextMenu from "./RemoveParticipantContextMenu";
import RemoveParticipantConfirmationModal from "./RemoveParticipantConfirmationModal";

function ProfilePopout({ participant, room, setActiveProfile, isOnline }) {
  const { user } = useContext(userContext);
  const contextMenuRef = useRef(null);
  const contextMenuIconRef = useRef(null);
  const [showContextMenu, setShowContextMenu] = useState(""); // state to show context menu for removing a participant, will open the confirmation modal first
  const [showConfirmationModal, setShowConfirmationModal] = useState(false); // state to show modal for removing a participant
  const { isMobile } = useContext(isMobileContext);

  // Handle closing context menu which clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        contextMenuRef.current &&
        !contextMenuRef.current.contains(e.target) &&
        contextMenuIconRef.current &&
        !contextMenuIconRef.current.contains(e.target)
      ) {
        setShowContextMenu(""); // Close the context menu if click is outside of it
      }
    };
    // Add event listener to the document to listen for clicks
    document.addEventListener("mousedown", handleClickOutside);

    // Clean up the event listener when the component is unmounted
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleContextMenu = (e) => {
    e.stopPropagation();

    if (showContextMenu === participant._id) {
      setShowContextMenu(""); // Close the context menu if it's already open
    } else {
      console.log("participant: ", participant);
      setShowContextMenu(participant._id); // Show the context menu for the clicked participant (participant id)
    }
  };

  const formatBirthday = (birthday) => {
    const date = new Date(birthday);

    return format(date, "MMMM d, yyyy");
  };

  return (
    <>
      <link
        rel="stylesheet"
        href="https://cdn.materialdesignicons.com/6.5.95/css/materialdesignicons.min.css"
      ></link>

      <div
        className={`absolute z-50 md:mr-1 w-[20rem] md:pt-7 md:pb-4 pt-5 pb-2 bg-gray-100 md:opacity-90 hover:opacity-100 transition-opacity ease-in-out duration-200 shadow-md border rounded-lg`}
      >
        <div className="flex flex-col items-center">
          {participant.username !== user.username && (
            <div className="absolute right-2 top-2">
              <img
                ref={contextMenuIconRef}
                src="./room_context_menu.svg"
                className="w-5 trasntion-all ease-in-out hover:invert-[40%] m-2 cursor-pointer"
                onClick={handleContextMenu}
                alt=""
              />
            </div>
          )}

          <div className="relative h-14 w-14 mb-1">
            {/* {participant.username !== user.username && ( */}
            {/* )} */}
            <AvatarIcon name={participant.username} showStatus={false} />
            <div className="absolute left-[2.5rem] bottom-[0.1rem]">
              {isOnline ? (
                <span className="flex w-3 h-3 bg-green-400 rounded-full flex-shrink-0"></span>
              ) : (
                <span className="flex w-3 h-3 bg-gray-400 rounded-full flex-shrink-0"></span>
              )}
            </div>
          </div>
          <p className="font-bold text-gray-800">{participant.username}</p>
          <p className="text-gray-500 text-[0.8rem]">{participant.email}</p>

          {/* Social Media Links */}
          <div className="flex flex-row mb-2">
            {participant.socials?.instagram && (
              <a
                href={participant.socials.instagram}
                className="flex rounded-full hover:bg-orange-50 h-10 w-10"
              >
                <i className="mdi mdi-instagram text-orange-400 mx-auto mt-2"></i>
              </a>
            )}
            {participant.socials?.facebook && (
              <a
                href={participant.socials.facebook}
                className="flex rounded-full hover:bg-blue-50 h-10 w-10"
              >
                <i className="mdi mdi-facebook text-blue-400 mx-auto mt-2"></i>
              </a>
            )}
            {participant.socials?.linkedin && (
              <a
                href={participant.socials.linkedin}
                className="flex rounded-full hover:bg-indigo-50 h-10 w-10"
              >
                <i className="mdi mdi-linkedin text-indigo-400 mx-auto mt-2"></i>
              </a>
            )}
          </div>
        </div>
        <div className="grid grid-rows-2 p-1 text-center">
          <div className="row">
            <p className="font-semibold text-[0.9rem] text-gray-800 py-1">
              My Interests
            </p>
            <div className="w-full flex flex-wrap justify-center">
              {participant.interests != null &&
                participant?.interests.map((interest, index) => (
                  <span
                    key={index}
                    className="bg-gray-300 rounded-full px-2 py-1 m-1 text-gray-700 text-[0.7rem]"
                  >
                    {interest}
                  </span>
                ))}
            </div>
          </div>
          <div className="row mt-3">
            <p className="font-semibold text-[0.9rem] text-gray-800">
              My Birthday
            </p>
            <p className="text-gray-600 text-[0.8rem]">
              {formatBirthday(participant.birthday)}
            </p>
          </div>
        </div>
      </div>
      {showContextMenu === participant._id && (
        <div
          ref={contextMenuRef}
          className={`absolute left-40 md:bottom-1 ${
            isMobile && "top-10"
          }  z-50`}
        >
          <RemoveParticipantContextMenu
            participant={participant}
            setShowConfirmationModal={setShowConfirmationModal}
          />
        </div>
      )}
      <RemoveParticipantConfirmationModal
        participant={participant}
        room={room}
        setShowContextMenu={setShowContextMenu}
        showConfirmationModal={showConfirmationModal}
        setShowConfirmationModal={setShowConfirmationModal}
      />
    </>
  );
}

export default ProfilePopout;
