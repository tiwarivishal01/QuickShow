import React from 'react'
import { assets } from '../../assets'
import { LayoutDashboardIcon, ListCollapseIcon, ListIcon, PlusSquareIcon } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const AdminSideBar = () => {
  const user = {
    firstName: 'Admin',
    lastName: 'User',
    imageUrl: assets.profile,
  }

  const adminNavLinks = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboardIcon },
    { name: 'Add Shows', path: '/admin/add-shows', icon: PlusSquareIcon },
    { name: 'List Shows', path: '/admin/list-shows', icon: ListIcon },
    { name: 'List Bookings', path: '/admin/list-bookings', icon: ListCollapseIcon },
  ]

  return (
    <div class="h-[calc(100vh-64px)] md:flex flex-col items-center pt-8 md:max-w-60 w-[10%] border-r border-gray-300/20 text-sm">
      {/* User section */}
      <img className="h-9 md:h-14 w-9 md:w-14 rounded-full mx-auto" src={user.imageUrl} alt="sidebar user" />
      <p className="mt-2 text-base max-md:hidden">{user.firstName} {user.lastName}</p>

      {/* Nav Links */}
      <div className="w-full mt-6">
        {adminNavLinks.map((link, index) => (
          <NavLink
            key={index}
            to={link.path}
            end
            className={({ isActive }) =>
              `relative flex items-center md:justify-start justify-center gap-2 w-full py-2.5 md:pl-10 text-gray-400 hover:bg-primary/10 hover:text-primary transition 
              ${isActive ? 'bg-primary/15 text-primary' : ''}`
            }
          >
            <link.icon className="w-5 h-5" />
            <p className="max-md:hidden">{link.name}</p>

            {/* Active Indicator */}
            {({ isActive }) => (
              isActive && <span className="w-1.5 h-10 rounded-l bg-primary absolute right-0"></span>
            )}
          </NavLink>
        ))}
      </div>
    </div>
  )
}

export default AdminSideBar
