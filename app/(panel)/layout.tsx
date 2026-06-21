import { requireUser } from "@/lib/auth";
import { ROL_LABEL } from "@/lib/constantes";
import { Sidebar } from "@/components/panel/sidebar";
import { LogoutButton } from "@/components/panel/logout-button";

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar rol={user.rol} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-3">
          <div className="md:hidden text-sm font-semibold text-blue-700">
            Créditos
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="text-right leading-tight">
              <p className="text-sm font-medium text-slate-900">{user.name}</p>
              <p className="text-xs text-slate-500">{ROL_LABEL[user.rol]}</p>
            </div>
            <LogoutButton />
          </div>
        </header>
        <main className="flex-1 p-5">{children}</main>
      </div>
    </div>
  );
}
