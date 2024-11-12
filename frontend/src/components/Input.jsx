import { React, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import interest_suggestions from "./Interest_Suggestions";
import { TagPicker, Tag } from "rsuite";
import "rsuite/TagPicker/styles/index.css";

function Input({ type, register, errors, defaultValue, setValue, watch }) {
  const capitalizeFirstLetter = (string) => {
    const requirdFields = [
      "email",
      "username",
      "password",
      "confirmPassword",
      "birthday",
    ];

    // If the field is not required, add "Optional" to the label
    if (!requirdFields.includes(string)) {
      return {
        label: string.charAt(0).toUpperCase() + string.slice(1),
        optional: true,
      };
    }

    if (string === "confirmPassword") {
      return { label: "Confirm Password", optional: false }; // Return Confirm Password if type is confirmPassword
    } else {
      return {
        label: string.charAt(0).toUpperCase() + string.slice(1),
        optional: false,
      };
    }
  };

  if (watch) {
    const interests = watch("interests"); // Watch the interests field

    useEffect(() => {
      console.log("Watched interests:", interests); // Logs changes in interests
    }, [interests]);
  }

  let inputType =
    type === "confirmPassword"
      ? "password"
      : type === "birthday"
      ? "date"
      : type;

  const validationRules =
    type === "email"
      ? {
          required: true,
          pattern: {
            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            message: "Invalid email address",
          },
        }
      : type === "birthday"
      ? {
          required: true,
          validate: (value) => {
            const date = new Date(value);
            const today = new Date();

            if (date > today) {
              return "Birthday cannot be in the future!";
            }

            const age = today.getFullYear() - date.getFullYear(); // Calculate the age
            if (age < 13) {
              return "You must be at least 13 years old";
            }
          },
        }
      : { required: true };

  return (
    <div>
      <link
        rel="stylesheet"
        href="https://cdn.materialdesignicons.com/6.5.95/css/materialdesignicons.min.css"
      ></link>
      <div className="flex justify-between">
        <label
          htmlFor={`${type}`}
          className="block text-md font-bold leading-6 text-gray-900"
        >
          {capitalizeFirstLetter(type).label}{" "}
          {capitalizeFirstLetter(type).optional && (
            <span className="text-gray-900 text-sm italic"> - Optional</span>
          )}
        </label>
      </div>
      <div className="mt-1">
        {inputType === "interests" ? (
          <TagPicker
            data={interest_suggestions}
            style={{ width: "100%" }}
            name="interests"
            menuStyle={{
              maxHeight: 260,
              overflowY: "auto",
            }}
            renderValue={(values, items, tags) => {
              return values.map((tag, index) => (
                <Tag
                  key={index}
                  name={tag}
                  className="text-[0.8rem] px-2 py-1 bg-gray-200 cursor-pointer hover:bg-gray-300 rounded-lg w-auto inline-block"
                  onClick={() => {
                    const updatedValues = values.filter(
                      (value) => value !== tag
                    );
                    setValue(type, updatedValues); // Update the form with the new values
                  }}
                >
                  {tag}
                  <span className="ps-1 text-sm">&#x2715;</span>
                </Tag>
              ));
            }}
            onChange={(newValues) => setValue(type, newValues)}
            value={watch("interests")}
          />
        ) : inputType === "socials" ? ( // Social media links
          <div className="grid grid-rows-3 gap-2">
            {/* Instagram */}
            <div className="flex items-center space-x-2 bg-gray-100 bg-opacity-70 rounded-md">
              <div className="ps-2 w-10 flex items-center justify-center">
                <i className="mdi mdi-instagram text-purple-400"></i>
              </div>
              <input
                id="instagram"
                name="instagram"
                type="url"
                placeholder="Instagram"
                className="block w-full rounded-e-md border-0 ps-2 md:py-2 py-[0.3rem] text-gray-900 shadow-sm placeholder:text-gray-400 text-sm leading-6"
                {...register("instagram", {
                  pattern: {
                    value:
                      /^(https?:\/\/)?(www\.)?instagram\.com\/[A-Za-z0-9._%+-]+\/?$/,
                    message: "Invalid Instagram link",
                  },
                })}
              />
              {errors.instagram && (
                <p className="text-red-500 text-sm">* Invalid Instagram link</p>
              )}
            </div>

            <div className="flex items-center space-x-2 bg-gray-100 bg-opacity-70 rounded-md">
              <div className="ps-2 w-10 flex items-center justify-center">
                <i className="mdi mdi-facebook text-blue-400"></i>
              </div>
              <input
                id="facebook"
                name="facebook"
                type="url"
                placeholder="Facebook"
                className="block w-full rounded-e-md border-0 ps-2 md:py-2 py-[0.3rem] text-gray-900 shadow-sm placeholder:text-gray-400 text-sm leading-6"
                {...register("facebook", {
                  pattern: {
                    value:
                      /^(https?:\/\/)?(www\.)?facebook\.com\/[A-Za-z0-9._%+-]+\/?$/,
                    message: "Invalid Facebook link",
                  },
                })}
              />
              {errors.facebook && (
                <p className="text-red-500 text-sm">
                  * {errors.facebook.message}
                </p>
              )}
            </div>

            {/* LinkedIn */}
            <div className="flex items-center space-x-2 bg-gray-100 bg-opacity-70 rounded-md">
              <div className="ps-2 w-10 flex items-center justify-center">
                <i className="mdi mdi-linkedin text-sky-400"></i>
              </div>
              <input
                id="linkedin"
                name="linkedin"
                type="url"
                placeholder="LinkedIn"
                className="block w-full rounded-e-md border-0 ps-2 md:py-2 py-[0.3rem] text-gray-900 shadow-sm placeholder:text-gray-400 text-sm leading-6"
                {...register("linkedin", {
                  pattern: {
                    value:
                      /^(https?:\/\/)?(www\.)?linkedin\.com\/(in|company|pub|jobs)\/[A-Za-z0-9._%+-]+\/?$/,
                    message: "Invalid Linkedin link",
                  },
                })}
              />
              {errors.linkedin && (
                <p className="text-red-500 text-sm">
                  * {errors.linkedin.message}
                </p>
              )}
            </div>
          </div>
        ) : (
          <input
            id={`${type}`}
            name={`${type}`}
            type={inputType}
            autoComplete={`${type}`}
            required
            defaultValue={defaultValue ? defaultValue : ""}
            className={`block w-full rounded-md border-0 ps-2 md:py-2 py-[0.3rem] text-gray-900 shadow-sm 
         placeholder:text-gray-400 sm:text-sm sm:leading-6 ${
           inputType === "date" ? "cursor-pointer py-1 px-5" : ""
         }`}
            {...register(`${type}`, validationRules)}
          />
        )}
      </div>
      {errors[type]?.type === "required" && (
        <p className="text-red-600 font-semibold text-sm">
          * This field is required
        </p>
      )}
      {errors[type]?.message && (
        <p className="text-red-500 font-semibold text-sm">
          * {errors[type]?.message}
        </p>
      )}
    </div>
  );
}

export default Input;
