import { LoginForm } from "@/features/auth/components/login-form";

export default function LoginPage() {
	const disableSignupValue = process.env.DISABLE_SIGNUP?.toLowerCase();
	const signupDisabled = disableSignupValue === "true";

	return <LoginForm signupDisabled={signupDisabled} />;
}
