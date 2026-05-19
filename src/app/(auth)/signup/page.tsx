import { redirect } from "next/navigation";
import { isSignupDisabled } from "@/shared/lib/auth/signup";
import { SignupForm } from "@/features/auth/components/signup-form";

export default function SignupPage() {
	if (isSignupDisabled()) {
		redirect("/login");
	}

	return <SignupForm />;
}
