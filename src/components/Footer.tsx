import { Link } from "react-router-dom";
import deltaLogo from "@/assets/delta-logo.png";

const Footer = () => {
  return (
    <footer className="py-16 bg-card border-t border-border">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <img src={deltaLogo} alt="The Human Delta" className="h-6 w-6" loading="lazy" width={512} height={512} />
              <span className="font-sans text-foreground text-sm font-bold">
                The Human Delta™
              </span>
            </div>
          </div>

          {/* Framework */}
          <div>
            <p className="text-muted-foreground text-xs tracking-[0.2em] uppercase mb-4 font-sans font-bold">
              The Framework
            </p>
            <ul className="space-y-2">
              <li>
                <Link to="/methodology" className="text-muted-foreground/60 hover:text-foreground text-sm font-sans transition-colors duration-300">
                  Methodology
                </Link>
              </li>
              <li>
                <Link to="/plasticity" className="text-muted-foreground/60 hover:text-foreground text-sm font-sans transition-colors duration-300">
                  Notice of Plasticity
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <p className="text-muted-foreground text-xs tracking-[0.2em] uppercase mb-4 font-sans font-bold">
              Legal
            </p>
            <ul className="space-y-2">
              <li>
                <Link to="/privacy" className="text-muted-foreground/60 hover:text-foreground text-sm font-sans transition-colors duration-300">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-muted-foreground/60 hover:text-foreground text-sm font-sans transition-colors duration-300">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/my-reports" className="text-muted-foreground/60 hover:text-foreground text-sm font-sans transition-colors duration-300">
                  Delete My Data
                </Link>
              </li>
            </ul>
          </div>

          {/* Origin & Standard */}
          <div>
            <p className="text-muted-foreground text-xs tracking-[0.2em] uppercase mb-4 font-sans font-bold">
              Origin
            </p>
            <p className="text-muted-foreground/60 text-sm font-sans font-light mb-4">
              Powered by TEMR Growth (Sweden)
            </p>
            <p className="text-muted-foreground/40 text-xs font-sans font-light tracking-wider">
              Framework v3.1 | British English
            </p>
          </div>
        </div>

        <div className="border-t border-border pt-6 text-center">
          <p className="text-muted-foreground/50 text-xs font-sans font-light">
            THE HUMAN DELTA™ | Powered by TEMR Growth (Sweden) | © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
