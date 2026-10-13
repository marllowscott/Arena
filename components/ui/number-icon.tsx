import * as React from "react";

export type NumberIconProps = React.HTMLAttributes<HTMLSpanElement>;
export type LucideIcon = React.ComponentType<NumberIconProps>;

function createNumberedIcon(number: number): LucideIcon {
  return function NumberedIcon({ className, style, ...props }) {
    return (
      <span
        {...props}
        className={`inline-flex shrink-0 items-center justify-center font-mono font-bold leading-none ${className ?? ""}`}
        data-icon-number={number}
        style={{ fontSize: "0.7em", ...style, color: "#B15EFF" }}
      >
        {number}
      </span>
    );
  };
}

export const Activity = createNumberedIcon(1);
export const ArrowDown = createNumberedIcon(2);
export const ArrowLeft = createNumberedIcon(3);
export const ArrowRight = createNumberedIcon(4);
export const ArrowUp = createNumberedIcon(5);
export const ArrowUpRight = createNumberedIcon(6);
export const Award = createNumberedIcon(7);
export const BadgeCheck = createNumberedIcon(8);
export const Bell = createNumberedIcon(9);
export const BookOpen = createNumberedIcon(10);
export const Bug = createNumberedIcon(11);
export const Building2 = createNumberedIcon(12);
export const CalendarClock = createNumberedIcon(13);
export const CalendarDays = createNumberedIcon(14);
export const Camera = createNumberedIcon(15);
export const Check = createNumberedIcon(16);
export const CheckCheck = createNumberedIcon(17);
export const CheckCircle2 = createNumberedIcon(18);
export const ChevronDown = createNumberedIcon(19);
export const ChevronLeft = createNumberedIcon(20);
export const ChevronRight = createNumberedIcon(21);
export const CircleDot = createNumberedIcon(22);
export const ClipboardCheck = createNumberedIcon(23);
export const Clock = createNumberedIcon(24);
export const Coins = createNumberedIcon(25);
export const Compass = createNumberedIcon(26);
export const CornerUpLeft = createNumberedIcon(27);
export const Database = createNumberedIcon(28);
export const ExternalLink = createNumberedIcon(29);
export const FileCode2 = createNumberedIcon(30);
export const FileText = createNumberedIcon(31);
export const Flag = createNumberedIcon(32);
export const Flame = createNumberedIcon(33);
export const Gauge = createNumberedIcon(34);
export const Gift = createNumberedIcon(35);
export const GitBranch = createNumberedIcon(36);
export const GraduationCap = createNumberedIcon(37);
export const GripVertical = createNumberedIcon(38);
export const Hammer = createNumberedIcon(39);
export const HandHelping = createNumberedIcon(40);
export const HelpCircle = createNumberedIcon(41);
export const ImageIcon = createNumberedIcon(42);
export const Inbox = createNumberedIcon(43);
export const Info = createNumberedIcon(44);
export const KeyRound = createNumberedIcon(45);
export const LifeBuoy = createNumberedIcon(46);
export const Lightbulb = createNumberedIcon(47);
export const Link2 = createNumberedIcon(48);
export const ListChecks = createNumberedIcon(49);
export const Lock = createNumberedIcon(50);
export const LogOut = createNumberedIcon(51);
export const MapPin = createNumberedIcon(52);
export const Menu = createNumberedIcon(53);
export const MessageCircle = createNumberedIcon(54);
export const MessageSquare = createNumberedIcon(55);
export const Minus = createNumberedIcon(56);
export const Monitor = createNumberedIcon(57);
export const MonitorPlay = createNumberedIcon(58);
export const PauseCircle = createNumberedIcon(59);
export const Plus = createNumberedIcon(60);
export const Presentation = createNumberedIcon(61);
export const Rocket = createNumberedIcon(62);
export const RotateCcw = createNumberedIcon(63);
export const Save = createNumberedIcon(64);
export const ScrollText = createNumberedIcon(65);
export const Search = createNumberedIcon(66);
export const Send = createNumberedIcon(67);
export const ShieldAlert = createNumberedIcon(68);
export const ShieldCheck = createNumberedIcon(69);
export const Siren = createNumberedIcon(70);
export const Sliders = createNumberedIcon(71);
export const SlidersHorizontal = createNumberedIcon(72);
export const Sparkles = createNumberedIcon(73);
export const Store = createNumberedIcon(74);
export const Swords = createNumberedIcon(75);
export const Target = createNumberedIcon(76);
export const ThumbsUp = createNumberedIcon(77);
export const Trash2 = createNumberedIcon(78);
export const TrendingUp = createNumberedIcon(79);
export const Trophy = createNumberedIcon(80);
export const UserRound = createNumberedIcon(81);
export const UserRoundCheck = createNumberedIcon(82);
export const Users = createNumberedIcon(83);
export const Wrench = createNumberedIcon(84);
export const X = createNumberedIcon(85);
export const XCircle = createNumberedIcon(86);
export const Zap = createNumberedIcon(87);
export const LayoutDashboard = createNumberedIcon(88);
