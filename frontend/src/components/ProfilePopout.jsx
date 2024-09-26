import React from "react";
import AvatarIcon from "./AvatarIcon";
import { format, isToday } from "date-fns";
import { userContext } from "../context/UserContext";

function ProfilePopout({ participant, setActiveProfile, isOnline }) {
  const { user } = React.useContext(userContext);

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

      <div className="absolute right-[108%] top-0 mr-1 w-[20rem] pt-7 pb-4 bg-gray-100 opacity-90 hover:opacity-100 transition-opacity ease-in-out duration-200 shadow-md border rounded-lg">
        <div className="flex flex-col items-center">
          {participant.username !== user.username && (
            <div className="absolute right-2 top-2">
              <img
                // ref={contextMenuIconRef}
                src="./room_context_menu.svg"
                className="w-5 trasntion-all ease-in-out hover:invert-[40%] m-2 cursor-pointer"
                // onClick={handleContextMenu}
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
                class="flex rounded-full hover:bg-orange-50 h-10 w-10"
              >
                <i class="mdi mdi-instagram text-orange-400 mx-auto mt-2"></i>
              </a>
            )}
            {participant.socials?.facebook && (
              <a
                href={participant.socials.facebook}
                class="flex rounded-full hover:bg-blue-50 h-10 w-10"
              >
                <i class="mdi mdi-facebook text-blue-400 mx-auto mt-2"></i>
              </a>
            )}
            {participant.socials?.linkedin && (
              <a
                href={participant.socials.linkedin}
                class="flex rounded-full hover:bg-indigo-50 h-10 w-10"
              >
                <i class="mdi mdi-linkedin text-indigo-400 mx-auto mt-2"></i>
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
              {participant.interests.map((interest, index) => (
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
    </>
  );
}

export default ProfilePopout;
