// Base para links diretos e triggers — pill arredondado
export const linkBase =
	"inline-flex h-8 items-center justify-center rounded-full px-3 text-sm font-medium transition-all lowercase";

// Estado inativo: muted, hover suave sem underline
export const linkIdle =
	"text-muted-foreground hover:text-foreground hover:bg-accent";

// Estado ativo: pill com cor primária
export const linkActive = "bg-primary/10 text-primary";

// Trigger do NavigationMenu — espelha linkBase + linkIdle, remove estilos padrão
export const triggerClass = [
	"h-8!",
	"rounded-full!",
	"px-3!",
	"py-0!",
	"text-sm!",
	"font-medium!",
	"bg-transparent!",
	"text-muted-foreground!",
	"hover:text-foreground!",
	"hover:bg-accent!",
	"focus:text-foreground!",
	"focus:bg-accent!",
	"data-[state=open]:text-foreground!",
	"data-[state=open]:bg-accent!",
	"shadow-none!",
].join(" ");
