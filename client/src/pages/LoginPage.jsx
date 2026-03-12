import React from "react";
import assets from "../assets/assets";
import { useState } from "react";

const LoginPage = () => {
  const [currState, setCurrState] = useState("Sign up");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [bio, setBio] = useState("");
  const [isDateSubmitted, setIsDateSubmitted] = useState(false);

  const onSubmitHandler = (event) => {
    event.preventDefault();

    if (currState === "Sign up" && !isDateSubmitted) {
      setIsDateSubmitted(true)
      return;
    } 
  }

  return (
    <div className="min-h-screen bg-cover bg-center flex items-center justify-center gap-8 sm:justify-evenly max-sm:flex0-col backdrop-blur-2xl">
      {/*-------left side-----*/}
      <img src={assets.logo_big} alt="Login" className="w-[min(30vw,350px)]" />

      {/*-------right side-----*/}
      <form onSubmit={onSubmitHandler} className="border-2 bg-white/8 text-white border-gray-500 p-6 flex flex-col gap-6 rounded-lg shadow-lg">
        <h2 className="font-medium text-2xl flex justify-between items-center">
          {currState}
          {isDateSubmitted && (
            <img
              onClick={() => setIsDateSubmitted(false)}
              src={assets.arrow_icon}
              alt=""
              className="w-5 cursor-pointer"
            />
          )}
        </h2>

        {currState === "Sign up" && !isDateSubmitted && (
          <input
            onChange={(e) => setFullName(e.target.value)}
            value={fullName}
            type="text"
            placeholder="Enter your name"
            className="p-2 border border-gray-500 focus:outline-none rounded-md"
            required
          />
        )}

        {!isDateSubmitted && (
          <>
            <input
              onChange={(e) => setEmail(e.target.value)}
              value={email}
              type="email"
              placeholder="Enter your email"
              className="p-2 border border-gray-500 focus:outline-none rounded-md focus:ring-2 focus:ring-indigo-500"
              required
            />
            <input
              onChange={(e) => setPassword(e.target.value)}
              value={password}
              type="password"
              placeholder="Enter your password"
              className="p-2 border border-gray-500 focus:outline-none rounded-md focus:ring-2 focus:ring-indigo-500"
              required
            />
          </>
        )}

        {currState === "Sign up" && isDateSubmitted && (
          <textarea
            onChange={(e) => setBio(e.target.value)}
            value={bio}
            rows={4}
            placeholder="provide a short bio..."
            className="p-2 border border-gray-500 focus:outline-none rounded-md focus:ring-2 focus:ring-indigo-500"
            required
          ></textarea>
        )}

        <button
          type="submit"
          className="py-3 bg-linear-to-r from-purple-400 to-violet-600 text-white rounded-md cursor-pointer"
        >
          {currState === "Sign up" ? "Create Account" : "Login"}
        </button>

        <div className="flex items-center gap-2 text-sm text-gray-500">
          <input type="checkbox" />
          <p>Agree to the terms of use & privacy policy.</p>
        </div>

        <div className="flex flex-col gap-2">
          {currState === "Sign up" ? (
            <p className="text-sm text-gray-600">
              Already have an account?
              <span
                onClick={() => {
                  setCurrState("Login");
                  setIsDateSubmitted(false);
                }}
                className="font-medium text-violet-500 cursor-pointer"
              >
                Login here
              </span>
            </p>
          ) : (
            <p className="text-sm text-gray-600">
              Don't have an account?
              <span
                onClick={() => {
                  setCurrState("Sign up");
                }}
                className="font-medium text-violet-500 cursor-pointer"
              >
                Click here
              </span>
            </p>
          )}
        </div>
      </form>
    </div>
  );
};

export default LoginPage;
