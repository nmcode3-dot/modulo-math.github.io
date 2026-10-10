import { Link, useRouterState } from "@tanstack/react-router";
import { BarChart3, BookOpen, Moon, Sun, Tags } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const NAV = [
  { to: "/", label: "Contest Practice", icon: BookOpen },
  { to: "/topics", label: "Topic Drills", icon: Tags },
  { to: "/progress", label: "My Progress", icon: BarChart3 },
] as const;

function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const d = localStorage.getItem("modulo-theme") === "dark";
    setDark(d);
    document.documentElement.classList.toggle("dark", d);
  }, []);
  return (
    <Button
      variant="ghost"
      size="sm"
      className="w-full justify-start"
      onClick={() => {
        const d = !dark;
        setDark(d);
        document.documentElement.classList.toggle("dark", d);
        localStorage.setItem("modulo-theme", d ? "dark" : "light");
      }}
    >
      {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
      {dark ? "Light mode" : "Dark mode"}
    </Button>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const topicWorkspace = useRouterState({ select: state => state.location.pathname.startsWith("/topics/") && state.location.pathname !== "/topics/" });
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="px-4 py-5">
          <Link to="/" className="font-display text-3xl tracking-tight">
            Modulo<span className="text-primary">.</span>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarMenu>
              {NAV.map((n) => (
                <SidebarMenuItem key={n.to}>
                  <SidebarMenuButton asChild>
                    <Link
                      to={n.to}
                      activeOptions={{ exact: n.to === "/" }}
                      activeProps={{ "data-active": true } as never}
                    >
                      <n.icon /> {n.label}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <ThemeToggle />
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="min-w-0">
        <header className="flex h-12 items-center border-b px-3 md:hidden">
          <SidebarTrigger />
          <span className="ml-2 font-display text-xl">Modulo</span>
        </header>
        <main className={`mx-auto w-full min-w-0 flex-1 px-4 py-8 md:px-8 ${topicWorkspace ? "max-w-7xl" : "max-w-3xl"}`}>{children}</main>
        <footer className="border-t px-4 py-6 text-center text-xs text-muted-foreground">
          Problems from the{" "}
          <a className="underline" href="https://artofproblemsolving.com/wiki/" target="_blank" rel="noopener noreferrer">
            Art of Problem Solving Wiki
          </a>
          . AMC 8, AMC 10, AMC 12 and AIME problems are copyright the{" "}
          <a className="underline" href="https://maa.org/student-programs/amc/" target="_blank" rel="noopener noreferrer">
            Mathematical Association of America
          </a>
          . Each problem links to its original page.
        </footer>
      </SidebarInset>
    </SidebarProvider>
  );
}
