import React from "react";
import { useForm } from "react-hook-form";

function Input({ type, register, errors }) {
  const capitalizeFirstLetter = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  let inputType = type === "confirmPassword" ? "password" : type; // Change input type to password if confirmPassword
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
        <input
          id={`${type}`}
          name={`${type}`}
          type={inputType}
          autoComplete={`${type}`}
          required
          pattern={inputPattern}
          className="block w-full rounded-md border-0 ps-2 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-purple-300 sm:text-sm sm:leading-6"
          {...register(`${type}`, { required: true })}
        />
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
