import { Link } from "react-router-dom";
import deltaLogo from "@/assets/delta-logo.png";

const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-foreground/95 backdrop-blur-md border-b border-accent/10">
      <div className="container mx-auto md:px-6 h-16 items-center justify-between text-sm font-extralight px-[10px] flex flex-row">
        <Link to="/" className="flex items-center gap-2 md:gap-3 min-w-0">
          <img src={deltaLogo} alt="The Human Delta" className="h-8 w-auto" />
          <span className="font-sans font-bold md:text-lg text-primary-foreground tracking-normal md:tracking-wide whitespace-nowrap text-xs">
            THE HUMAN DELTA<span className="text-accent">™</span>
          </span>
        </Link>
        <div className="flex items-center gap-3 md:gap-6">
          <Link
            to="/methodology"
            className="hidden sm:inline-flex text-primary-foreground/70 hover:text-primary-foreground text-sm font-sans transition-colors duration-300"
          >
            Methodology
          </Link>
          <Link
            to="/my-reports"
            className="hidden sm:inline-flex text-primary-foreground/70 hover:text-primary-foreground text-sm font-sans transition-colors duration-300"
          >
            My Reports
          </Link>
          <Link
            to="/questionnaire"
            className="bg-accent text-foreground font-sans font-semibold px-3 md:px-5 py-2 rounded-lg text-sm hover:opacity-90 transition-all duration-300 whitespace-nowrap"
          >
            Start Assessment
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
