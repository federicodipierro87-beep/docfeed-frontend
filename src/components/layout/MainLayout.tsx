import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import SidebarContent from './SidebarContent'
import { Sheet, SheetContent } from '@/components/ui/sheet'

export default function MainLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="h-full flex bg-background">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Mobile Sidebar (Sheet) */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-64 p-0 bg-sidebar">
          <SidebarContent onNavigate={() => setMobileMenuOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar - fixed height */}
        <TopBar onMenuClick={() => setMobileMenuOpen(true)} />

        {/* Page content - scrollable */}
        <main className="flex-1 overflow-auto">
          <div className="p-4 md:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
