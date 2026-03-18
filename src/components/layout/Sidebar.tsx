import SidebarContent from './SidebarContent'

export default function Sidebar() {
  return (
    <div className="hidden md:flex w-64 flex-col border-r bg-sidebar">
      <SidebarContent />
    </div>
  )
}
