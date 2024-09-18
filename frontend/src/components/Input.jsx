import React from "react";
import { useForm } from "react-hook-form";
import interest_suggestions from "./Interest_Suggestions";
import { TagPicker, Tag } from "rsuite";
import "rsuite/TagPicker/styles/index.css";

function Input({ type, register, errors, defaultValue, setValue, watch }) {
  const capitalizeFirstLetter = (string) => {
    if (string === "confirmPassword") {
      return "Confirm Password"; // Return Confirm Password if type is confirmPassword
    } else {
      return string.charAt(0).toUpperCase() + string.slice(1);
    }
  };

  let inputType =
    type === "confirmPassword"
      ? "password"
      : type === "birthday"
      ? "date"
      : type;

  let inputPattern =
    type === "email" ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/ : undefined; // Set pattern for email

  return (
    <div>
      <div className="flex justify-between">
        <label
          htmlFor={`${type}`}
          className="block text-md font-bold leading-6 text-gray-900"
        >
          {/* Capitalize first letter */}
          {capitalizeFirstLetter(type)}
        </label>
      </div>
      <div className="mt-1">
        {inputType === "interests" ? (
          <TagPicker
            data={interest_suggestions}
            style={{ width: "100%" }}
            menuStyle={{
              maxHeight: 260,
              overflowY: "auto",
            }}
            renderValue={(values, items, tags) => {
              return values.map((tag, index) => (
                <Tag
                  key={index}
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
            value={watch(type)}
          />
        ) : inputType === "socials" ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <input
                id="instagram"
                name="instagram"
                type="url"
                placeholder="Instagram"
                className="block w-full rounded-md border-0 ps-2 py-2 text-gray-900 shadow-sm 
              ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset 
              focus:ring-purple-300 sm:text-sm sm:leading-6"
                {...register("instagram")}
              />
              {errors.instagram && (
                <p className="text-red-500 text-sm">* Invalid Instagram link</p>
              )}
            </div>
            <div>
              <input
                id="facebook"
                name="facebook"
                type="url"
                placeholder="Facebook"
                className="block w-full rounded-md border-0 ps-2 py-2 text-gray-900 shadow-sm 
              ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset 
              focus:ring-purple-300 sm:text-sm sm:leading-6"
                {...register("facebook")}
              />
              {errors.facebook && (
                <p className="text-red-500 text-sm">* Invalid Facebook link</p>
              )}
            </div>
            <div>
              <input
                id="linkedin"
                name="linkedin"
                type="url"
                placeholder="LinkedIn"
                className="block w-full rounded-md border-0 ps-2 py-2 text-gray-900 shadow-sm 
              ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset 
              focus:ring-purple-300 sm:text-sm sm:leading-6"
                {...register("linkedin")}
              />
              {errors.linkedin && (
                <p className="text-red-500 text-sm">* Invalid LinkedIn link</p>
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
            pattern={inputPattern}
            defaultValue={defaultValue ? defaultValue : ""}
            className={`block w-full rounded-md border-0 ps-2 py-2 text-gray-900 shadow-sm 
          ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset 
          focus:ring-purple-300 sm:text-sm sm:leading-6 ${
            inputType === "date" ? "cursor-pointer py-1 px-5" : ""
          }`}
            {...register(`${type}`, { required: true })}
          />
        )}
      </div>
      {errors[type]?.type === "required" && (
        <p className="text-red-500 text-sm">* This field is required</p>
      )}
      {errors[type]?.type === "pattern" && (
        <p className="text-red-500 text-sm">* Invalid email address</p>
      )}
    </div>
  );
}

export default Input;
