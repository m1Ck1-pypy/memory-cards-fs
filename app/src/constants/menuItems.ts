import { Play, Users, Settings, X } from "lucide-react";

export const menuItems = [
  {
    id: "start",
    label: "Start",
    icon: Play,
    color: "from-emerald-400 to-emerald-600",
  },
  {
    id: "join",
    label: "Join",
    icon: Users,
    color: "from-blue-400 to-blue-600",
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    color: "from-purple-400 to-purple-600",
  },
  { id: "exit", label: "Exit", icon: X, color: "from-red-400 to-red-600" },
];
