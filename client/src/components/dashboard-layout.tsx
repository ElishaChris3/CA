import { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Home,
  Building,
  BarChart3,
  Shield,
  Users,
  Tags,
  Database,
  FileText,
  Settings,
  Bell,
  Calendar,
  LogOut,
  AlertTriangle,
  TrendingUp,
  CheckCircle,
  Users2,
  Leaf,
} from "lucide-react";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user } = useAuth();
  // const navigate = useNa

  const handleLogout = () => {
    fetch("/api/logout", {
      method: "GET",
    })
      .then((response) => {
        if (response.ok) {
          window.location.href = "/";
        }
      })
      .catch((error) => {
        console.error("Logout failed:", error);
      });
  };

  const organizationNavItems = [
    { icon: Home, label: "Home", href: "/", validPaths: ["/", "/dashboard"] },
    { icon: Building, label: "Company Profile", href: "/company-profile" },
    { icon: BarChart3, label: "Emission Overview", href: "/emission-overview" },
    { icon: Shield, label: "Gov & Policies", href: "/governance-policies" },
    { icon: AlertTriangle, label: "Risk Management", href: "/risk-management" },
    { icon: Users, label: "Stakeholder Data", href: "/stakeholders" },
    {
      icon: Tags,
      label: "Materiality Assessment",
      href: "/materiality-assessment",
    },
    { icon: Database, label: "Data Collection", href: "/data-collection" },
    {
      icon: TrendingUp,
      label: "Performance Metrics",
      href: "/performance-metrics",
    },
    { icon: CheckCircle, label: "Compliance", href: "/compliance" },
    { icon: FileText, label: "Reports", href: "/reports" },
    { icon: Users2, label: "Team", href: "/team" },
  ];

  const consultantNavItems = [
    { icon: Home, label: "Home", href: "/", validPaths: ["/", "/dashboard"] },
    { icon: Building, label: "Client Organizations", href: "/clients" },
    { icon: Building, label: "Company Profile", href: "/company-profile" },
    { icon: BarChart3, label: "Emission Overview", href: "/emission-overview" },
    { icon: Shield, label: "Gov & Policies", href: "/governance-policies" },
    { icon: AlertTriangle, label: "Risk Management", href: "/risk-management" },
    {
      icon: Tags,
      label: "Materiality Assessment",
      href: "/materiality-assessment",
    },
    { icon: Database, label: "Data Collection", href: "/data-collection" },
    { icon: FileText, label: "Reports", href: "/reports" },
    { icon: Settings, label: "Settings", href: "/settings" },
  ];

  const navItems =
    user?.role === "organization" ? organizationNavItems : consultantNavItems;
  const currentPath = window.location.pathname;

  return (
    <div className="min-h-screen bg-[var(--ca-grey-light)]">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-lg min-h-screen">
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-8">
              {/* <img
                src="/carbon-aegis-logo.png"
                alt="Carbon Aegis Logo"
                className="w-10 h-10 rounded-xl"
              /> */}
              <div className="w-10 h-10 bg-[var(--ca-green-normal)] rounded-lg flex items-center justify-center">
                <Leaf className="text-white h-5 w-5" />
              </div>
              <span className="text-xl font-medium text-[var(--ca-grey-darker)]">
                Carbon Aegis
              </span>
            </div>

            <nav className="space-y-2">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className={`ca-sidebar-nav ${
                    item?.validPaths?.includes(currentPath) ||
                    currentPath === item.href
                      ? "ca-sidebar-nav-active"
                      : ""
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </a>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="bg-white shadow-sm border-b border-[var(--ca-grey-light-active)] px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Calendar className="h-4 w-4 text-[var(--ca-grey-normal)]" />
                <span className="text-sm text-[var(--ca-grey-dark)]">
                  Current Reporting Year 2024
                </span>
              </div>

              <div className="flex items-center space-x-4">
                <Button variant="ghost" size="sm">
                  <Bell className="h-4 w-4" />
                </Button>

                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={user?.profileImageUrl}
                      alt={user?.firstName}
                    />
                    <AvatarFallback className="bg-[var(--ca-green-normal)] text-white">
                      {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-sm font-medium text-[var(--ca-grey-darker)]">
                      {user?.firstName
                        ? `${user.firstName} ${user.lastName}`
                        : user?.email}
                    </div>
                    <div className="text-xs text-[var(--ca-grey-dark)] capitalize">
                      {user?.role}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="text-[var(--ca-grey-dark)] hover:text-[var(--ca-grey-darker)]"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 p-8">{children}</div>
        </div>
      </div>
    </div>
  );
}

export default DashboardLayout;
