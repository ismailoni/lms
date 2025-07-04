import Link from "next/link";
import React from "react";

const Footer = () => {
  return (
    <div className="footer">
      <p className="footer__text">&copy; 2024 Susu. All rights reserved.</p>
      <div className="footer__links">
        {["About", "Privacy Policy", "Licensing", "Contact"].map((link, i) => (
          <Link
            key={i}
            href={`/${link.toLowerCase().replace(" ", "-")}`}
            className="footer__link"
            scroll={false}
          >
            {link}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Footer;
