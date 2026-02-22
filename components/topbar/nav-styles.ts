export const linkBase =
	"inline-flex h-9 items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-colors";

export const linkIdle = "text-foreground hover:text-foreground hover:underline";

export const linkActive = "text-primary";

export const triggerClass = [
	"text-foreground!",
	"bg-transparent!",
	"hover:bg-transparent!",
	"hover:text-foreground!",
	"hover:underline!",
	"focus:bg-transparent!",
	"focus:text-foreground!",
	"data-[state=open]:bg-transparent!",
	"data-[state=open]:text-foreground!",
	"data-[state=open]:underline!",
	"px-3!",
].join(" ");
