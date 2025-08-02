import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import axios from "../../axiosConfig";
import { useNavigate, useLocation } from "react-router-dom";

const VerifyOtpPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  const [otp, setOtp] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [resendVisible, setResendVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!email) {
      toast.error("Missing email. Please restart the flow.");
      navigate("/forgot-password");
    }
  }, [email, navigate]);

  useEffect(() => {
    let interval;
    if (secondsLeft > 0) {
      interval = setInterval(() => setSecondsLeft((prev) => prev - 1), 1000);
    } else {
      setResendVisible(true);
    }
    return () => clearInterval(interval);
  }, [secondsLeft]);

  const handleVerify = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("/api/auth/verify-otp", { email, otp });
      toast.success(res.data.message);
      navigate("/reset-password", { state: { email } });
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid OTP");
    }
  };

  const handleResend = async () => {
    try {
      setLoading(true);
      await axios.post("/api/auth/forgot-password", { email });
      toast.success("OTP resent to your email");
      setSecondsLeft(60);
      setResendVisible(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto mt-20">
      <h2 className="text-xl font-semibold mb-4">Verify OTP</h2>
      <form onSubmit={handleVerify} className="space-y-4">
        <Input
          label="OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
        />
        <Button type="submit" className="w-full">Verify</Button>

        {!resendVisible && (
          <p className="text-sm text-gray-500 text-center">
            Resend available in {secondsLeft}s
          </p>
        )}

        {resendVisible && (
          <div className="text-center">
            <button
              type="button"
              onClick={handleResend}
              disabled={loading}
              className="text-blue-600 hover:underline text-sm font-medium"
            >
              Resend OTP
            </button>
          </div>
        )}
      </form>
    </Card>
  );
};

export default VerifyOtpPage;
