import SidebarContent from './SidebarContent'

export default function Sidebar() {
  return (
    <div className="hidden md:flex w-64 flex-col border-r bg-sidebar h-full overflow-y-auto overflow-x-hidden shrink-0">
      <SidebarContent />
    </div>
  )
}
