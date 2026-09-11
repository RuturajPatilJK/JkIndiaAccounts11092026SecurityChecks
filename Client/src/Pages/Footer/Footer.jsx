import React, { useEffect, useRef } from "react";
import { FaFacebookF, FaTwitter, FaLinkedinIn, FaInstagram } from "react-icons/fa";
import { SiX } from "react-icons/si";
import "./Footer.css";

const Footer = () => {
  const rawAccountingYear = sessionStorage.getItem("Accounting_Year");
  const Company_Name = sessionStorage.getItem("Company_Name");
  const footerLeftRef = useRef(null);
  const footerCenterRef = useRef(null);
  const footerRightRef = useRef(null);

  const formatDate = (dateStr) => {
    const [year, month, day] = dateStr.split("-");
    return `${day}-${month}-${year}`;
  };

  let formattedAccountingYear = "";
  if (rawAccountingYear) {
    const [startDate, endDate] = rawAccountingYear.split(" - ");
    formattedAccountingYear = `${formatDate(startDate)} to ${formatDate(endDate)}`;
  }

  useEffect(() => {
    const createParticles = (e, element) => {
      const particles = [];
      const particleCount = 5;

      for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement("div");
        particle.className = "footer-section-particle";
        element.appendChild(particle);

        const size = Math.random() * 3 + 2;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;

        const x = e.clientX - element.getBoundingClientRect().left;
        const y = e.clientY - element.getBoundingClientRect().top;

        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;

        const angle = Math.random() * Math.PI * 2;
        const velocity = Math.random() * 2 + 1;
        const lifetime = Math.random() * 1000 + 500;

        particles.push({
          element: particle,
          x: 0,
          y: 0,
          vx: Math.cos(angle) * velocity,
          vy: Math.sin(angle) * velocity,
          lifetime,
          birthTime: Date.now()
        });
      }

      let alive = true;

      const animate = () => {
        if (!alive) return;

        const now = Date.now();
        let allDead = true;

        particles.forEach(p => {
          if (now - p.birthTime < p.lifetime) {
            allDead = false;
            p.x += p.vx;
            p.y += p.vy;
            p.element.style.transform = `translate(${p.x}px, ${p.y}px)`;
            p.element.style.opacity = 1 - ((now - p.birthTime) / p.lifetime);
          } else {
            p.element.remove();
          }
        });

        if (allDead) {
          alive = false;
        } else {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    };

    const leftElement = footerLeftRef.current;
    const centerElement = footerCenterRef.current;
    const rightElement = footerRightRef.current;

    const handleLeftMouseMove = (e) => createParticles(e, leftElement);
    const handleCenterMouseMove = (e) => createParticles(e, centerElement);
    const handleRightMouseMove = (e) => createParticles(e, rightElement);

    leftElement.addEventListener('mousemove', handleLeftMouseMove);
    centerElement.addEventListener('mousemove', handleCenterMouseMove);
    rightElement.addEventListener('mousemove', handleRightMouseMove);

    return () => {
      leftElement.removeEventListener('mousemove', handleLeftMouseMove);
      centerElement.removeEventListener('mousemove', handleCenterMouseMove);
      rightElement.removeEventListener('mousemove', handleRightMouseMove);
    };
  }, []);

  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-left" ref={footerLeftRef}>
          <span className="footer-text">
            Logged in as : <span className="highlight-text">{Company_Name}</span>
          </span>
        </div>
        <div className="footer-center" ref={footerCenterRef}>
          <span className="footer-text">
            Financial Year : <span className="highlight-text">{formattedAccountingYear}</span>
          </span>
        </div>
        <div className="footer-right" ref={footerRightRef}>
          <span className="footer-text">
            Copyright © {new Date().getFullYear()} : <span className="highlight-text">JK India eAgriTech Limited</span>
          </span>
        </div>
        <div className="footer-social-row">
          <a href="https://www.facebook.com/eBuySugar/" target="_blank" rel="noopener noreferrer"><FaFacebookF /></a>
          <a href="https://in.linkedin.com/company/ebuysugar" target="_blank" rel="noopener noreferrer"><FaLinkedinIn /></a>
          <a href="https://www.instagram.com/ebuysugar/" target="_blank" rel="noopener noreferrer"><FaInstagram /></a>
          <a href="https://twitter.com/ebuysugar" target="_blank" rel="noopener noreferrer"><SiX /></a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;