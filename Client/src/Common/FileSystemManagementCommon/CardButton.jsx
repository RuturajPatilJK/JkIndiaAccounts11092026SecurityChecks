import React, { useState } from "react";

const CardButton = ({
  image,
  title,
  subtitle,
  onClick,
  socialIcons = [],
  titleColor = "text-white",
  titleBg = "bg-white/10",
  pulseSubtitle = true
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [hoveredIcon, setHoveredIcon] = useState(null);

  const cardGradient = isHovered
    ? "bg-gradient-to-br from-purple-500 to-pink-500"
    : "bg-gradient-to-br from-blue-500 to-teal-400";

  return (
    <div
      className={`
        ${cardGradient} w-64 p-3 border-2 border-white/30
        shadow-lg rounded-2xl text-center
        font-poppins cursor-pointer transition-all duration-500
        hover:-translate-y-3 hover:shadow-xl hover:border-white/50
        relative overflow-hidden group
        backdrop-blur-sm bg-opacity-20
      `}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="
        absolute inset-0 rounded-xl
        opacity-0 group-hover:opacity-100
        transition-opacity duration-500
        bg-white/10
      "></div>

      <div className="
        overflow-hidden w-36 h-36 mx-auto mb-4
        rounded-full flex justify-center items-center
        transition-all duration-700 group-hover:rotate-3
        p-1 bg-gradient-to-tr from-amber-200 to-fuchsia-400
        group-hover:from-amber-300 group-hover:to-fuchsia-500
        shadow-md
      ">
        <img
          src={image}
          alt={title}
          className="
            w-full h-full rounded-full object-cover 
            border-4 border-white/80
            transition-transform duration-500 
            group-hover:scale-105
          "
        />
      </div>

      <div className="relative z-10">
        <h3 className={`
          mt-2 mb-1 font-bold text-xl
          ${titleBg} ${titleColor} px-4 py-2 rounded-lg
          inline-block transition-colors duration-300
          group-hover:shadow-sm
          ${isHovered ? 'group-hover:brightness-110' : ''}
        `}>
          {title}
        </h3>

        {subtitle && (
          <p className={`
            ${titleColor}/90 font-medium text-sm
            ${pulseSubtitle ? 'animate-pulse' : ''} mt-2
            transition-all duration-300
          `}>
            {subtitle}
          </p>
        )}
      </div>

      {socialIcons.length > 0 && (
        <div className="flex justify-center gap-5 mt-6 mb-2 flex-wrap">
          {socialIcons.map((icon, idx) => (
            <a
              key={idx}
              href={icon.link}
              className="
                text-white no-underline relative
                hover:-translate-y-1 transition-transform
              "
              onMouseEnter={() => setHoveredIcon(idx)}
              onMouseLeave={() => setHoveredIcon(null)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="
                p-2 rounded-full bg-white/20
                transition-all duration-300
                hover:bg-white/30 hover:scale-125
                backdrop-blur-sm
              ">
                {React.cloneElement(icon.svg, {
                  className: "w-5 h-5"
                })}
              </div>

              <div className={`
                absolute -top-10 left-1/2 -translate-x-1/2
                bg-white text-gray-800 px-3 py-1 rounded-full
                text-xs font-bold whitespace-nowrap
                transition-all duration-200 shadow-sm
                ${hoveredIcon === idx ?
                  'opacity-100 visible translate-y-0' :
                  'opacity-0 invisible translate-y-2'}
              `}>
                {icon.name}
              </div>
            </a>
          ))}
        </div>
      )}

      {isHovered && (
        <>
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="
                absolute rounded-full bg-white/30
                animate-float pointer-events-none
              "
              style={{
                width: `${Math.random() * 6 + 4}px`,
                height: `${Math.random() * 6 + 4}px`,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDuration: `${Math.random() * 3 + 2}s`,
                animationDelay: `${Math.random() * 1}s`
              }}
            ></div>
          ))}
        </>
      )}
    </div>
  );
};

CardButton.TitleColors = {
  WHITE: "text-white",
  AMBER: "text-amber-300",
  CYAN: "text-cyan-300",
  ROSE: "text-rose-300",
  EMERALD: "text-emerald-300",
  PURPLE: "text-purple-300",
  YELLOW: "text-yellow-300",
};

CardButton.TitleBackgrounds = {
  GLASS: "bg-white/10",
  SOLID_WHITE: "bg-white/90 text-gray-800",
  SOLID_BLACK: "bg-black/80",
  GRADIENT_BLUE: "bg-gradient-to-r from-blue-500 to-cyan-500",
  GRADIENT_PURPLE: "bg-gradient-to-r from-purple-500 to-pink-500"
};

export default CardButton;