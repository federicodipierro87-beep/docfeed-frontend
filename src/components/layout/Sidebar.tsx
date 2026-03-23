import SidebarContent from './SidebarContent'

export default function Sidebar() {
  return (
    <aside className="hidden md:flex md:w-64 md:flex-col border-r bg-sidebar">
      <SidebarContent />
    </aside>
  )
}
