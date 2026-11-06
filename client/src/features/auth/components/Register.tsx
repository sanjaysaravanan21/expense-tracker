// src/components/Register.tsx

import { useState } from "react";
import { registerUser } from "../api";

const Register = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await registerUser(fullName, email, phoneNumber);
      alert("User registered successfully");
      setRegistrationSuccess(true);
      setError("");
    } catch (error) {
      console.error("Error registering user:", error);
      setError("Registration failed. Please try again.");
      setRegistrationSuccess(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Register</h2>
      <form onSubmit={handleRegister}>
        <div className="mb-4">
          <label className="block text-gray-700">Full Name:</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="border rounded-lg p-2 w-full"
            placeholder="Enter your full name"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border rounded-lg p-2 w-full"
            placeholder="Enter your email"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">Phone Number:</label>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="border rounded-lg p-2 w-full"
            placeholder="Enter your phone number"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-primary text-white rounded-lg p-2"
        >
          Register
        </button>
      </form>
      {registrationSuccess && (
        <div className="mt-4 text-green-600">
          <h3 className="font-bold">Registration Successful!</h3>
        </div>
      )}
      {error && (
        <div className="mt-4 text-red-600">
          <h3 className="font-bold">{error}</h3>
        </div>
      )}
    </div>
  );
};

export default Register;
