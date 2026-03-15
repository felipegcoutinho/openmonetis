import { Logo } from "@/shared/components/logo";
import { DotPattern } from "@/shared/components/ui/dot-pattern";

function AuthSidebar() {
	return (
		<div className="relative hidden flex-col overflow-hidden bg-primary md:flex">
			<div className="pointer-events-none absolute inset-0">
				<DotPattern
					width={18}
					height={18}
					cx={1.15}
					cy={1.15}
					cr={1.15}
					className="text-black/10 mask-[radial-gradient(circle_at_top_left,black,transparent_80%)]"
				/>
				<div className="absolute inset-0 bg-linear-to-br from-white/9 via-transparent to-black/7" />
			</div>
			<div className="relative flex flex-1 flex-col justify-between p-10 lg:p-12">
				<Logo
					variant="compact"
					invertTextOnDark={false}
					className="opacity-92 [&_img]:brightness-0 [&_img]:saturate-0"
				/>

				<div className="max-w-sm space-y-4.5">
					<h2 className="text-[2rem] font-semibold leading-[1.04] tracking-[-0.03em] text-black/84 lg:text-[2.35rem]">
						Controle suas finanças com clareza e foco diário.
					</h2>
					<p className="max-w-2xs text-sm leading-6 text-black/68">
						Centralize despesas, organize cartões e acompanhe metas mensais em
						um painel inteligente feito para o seu dia a dia.
					</p>
				</div>
			</div>
		</div>
	);
}

export default AuthSidebar;
