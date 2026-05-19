import { redirect } from "next/navigation";
import { SignupForm } from "@/features/auth/components/signup-form";

export default function SignupPage() {
	const disableSignupValue = process.env.DISABLE_SIGNUP?.toLowerCase();
	const signupDisabled = disableSignupValue === "true"
	if (signupDisabled) {
		redirect("/login");
	}

	return <SignupForm />;
}
