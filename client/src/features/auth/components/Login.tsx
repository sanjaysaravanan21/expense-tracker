// src/components/Login.tsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "@/lib/app-context";
import { signIn, verifyOtp } from "../api";

const Login = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);

  const { dispatch } = useAppContext();

  const navigate = useNavigate();

  const handleSendOtp = async () => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      await signIn(phoneNumber);
      alert("OTP sent to Email");
      setIsOtpSent(true);
    } catch (error) {
      console.error("Error sending OTP:", error);
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const handleVerifyOtp = async () => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      const response = await verifyOtp(otp, phoneNumber);
      if (response.status === 200) {
        const { message = "", userDetails = null } = response.data;
        setIsOtpVerified(true);
        alert(message);
        dispatch({ type: "SET_AUTHENTICATED", payload: true });
        dispatch({ type: "SET_USER_DETAILS", payload: userDetails });
        navigate("/");
      } else {
        alert("Invalid OTP");
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Login with Phone Number</h2>
      {!isOtpSent ? (
        <div>
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
            onClick={handleSendOtp}
            className="w-full bg-primary text-white rounded-lg p-2"
          >
            Get OTP
          </button>
        </div>
      ) : !isOtpVerified ? (
        <div>
          <div className="mb-4">
            <label className="block text-gray-700">Enter OTP:</label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="border rounded-lg p-2 w-full"
              placeholder="Enter the OTP"
              required
            />
          </div>
          <button
            onClick={handleVerifyOtp}
            className="w-full bg-primary text-white rounded-lg p-2"
          >
            Verify OTP
          </button>
        </div>
      ) : (
        <div className="text-green-600">
          <h3 className="font-bold">OTP Verified Successfully!</h3>
        </div>
      )}
    </div>
  );
};

export default Login;
