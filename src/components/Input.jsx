import React from "react";
import { useForm } from "react-hook-form";

function Input({ type, register, errors }) {
  const capitalizeFirstLetter = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  return (
    <div>
      <div className="flex justify-between">
        <label
          for={`${type}`}
          className="block text-md font-bold leading-6 text-gray-900"
        >
          {/* Capitalize first letter */}
          {capitalizeFirstLetter(type)}
        </label>
      </div>
      <div className="mt-2">
        <input
          id={`${type}`}
          name={`${type}`}
          type={`${type}`}
          autoComplete={`${type}`}
          required
          className="block w-full rounded-md border-0 ps-2 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-purple-300 sm:text-sm sm:leading-6"
          {...register(`${type}`, { required: true })}
        />
      </div>
      {errors[type]?.type === "required" && (
        <p className="text-red-500 text-sm">* This field is required</p>
      )}
    </div>
  );
}

export default Input;
