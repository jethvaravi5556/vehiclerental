import { useState } from "react";
import { toast } from "react-hot-toast";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import axios from "../../axiosConfig";
import { useNavigate } from "react-router-dom";

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email) return toast.error("Please enter your email");
    try {
      const res = await axios.post("/api/auth/forgot-password", { email });
      toast.success(res.data.message);
      navigate("/verify-otp", { state: { email } }); // ✅ FIXED
    } catch (err) {
      toast.error(err.response?.data?.message || "Error sending OTP");
    }
  };

  return (
    <Card className="max-w-md mx-auto mt-20">
      <h2 className="text-xl font-semibold mb-4">Forgot Password</h2>
      <form onSubmit={handleSendOtp} className="space-y-4">
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Button type="submit" className="w-full">Send OTP</Button>
      </form>
    </Card>
  );
};

export default ForgotPasswordPage;
