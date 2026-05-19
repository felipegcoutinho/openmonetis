import { isSignupDisabled } from "@/shared/lib/auth/signup";
import { LoginForm } from "@/features/auth/components/login-form";

export default function LoginPage() {
	return <LoginForm signupDisabled={isSignupDisabled()} />;
}
