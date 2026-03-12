// Base para links diretos e triggers — pill arredondado
export const linkBase =
	"inline-flex h-8 items-center justify-center rounded-full px-3 text-sm font-medium transition-all lowercase";

// Estado inativo: muted, hover suave sem underline
export const linkIdle = "text-black/75 hover:bg-black/10 hover:text-black";

// Estado ativo: pill com cor primária
export const linkActive = "bg-black/10 text-black";

// Trigger do NavigationMenu — espelha linkBase + linkIdle, remove estilos padrão
export const triggerClass = [
	"h-8!",
	"rounded-full!",
	"px-3!",
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
