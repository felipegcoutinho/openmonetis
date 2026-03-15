export const linkBase =
	"inline-flex h-8 items-center justify-center rounded-md px-2 text-sm font-medium transition-all lowercase";

export const linkIdle = "text-black/75 hover:bg-black/10 hover:text-black";

export const linkActive = "bg-black/15 text-black";

export const triggerActiveClass = ["bg-black/15!", "text-black!"].join(" ");

export const triggerClass = [
	"h-8!",
	"rounded-md!",
	"px-2!",
	"py-0!",
	"text-sm!",
	"font-medium!",
	"bg-transparent!",
	"text-black/75!",
	"hover:text-black!",
	"hover:bg-black/10!",
	"focus:text-black!",
	"focus:bg-black/10!",
	"focus-visible:ring-black/20!",
	"data-[state=open]:text-black!",
	"data-[state=open]:bg-black/10!",
	"shadow-none!",
	"[&_svg]:text-current!",
	"lowercase!",
].join(" ");
