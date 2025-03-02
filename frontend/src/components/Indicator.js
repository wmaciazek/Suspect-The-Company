import React, { useState } from 'react';

/* TO W PRZYSZŁOŚCI DO API DOPISAĆ */
const monetaryIndicators = [
    "marketCap",
    "totalRevenue",
    "freeCashflow",
    "totalDebt",
    "totalCash",
  ];
  

const Indicator = ({ name, description, value, currency }) => {
  const [isHovered, setIsHovered] = useState(false);

  const isMonetary = monetaryIndicators.includes(name);

  return (
    <div
      className="cursor-pointer w-full p-4 border rounded shadow-md hover:shadow-lg transition-shadow duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex justify-between items-center">
        <span className="text-lg font-semibold">{name}</span>
        <span className="text-lg">
        {value} {isMonetary && currency && ` ${currency}`}
        </span>
      </div>
      {isHovered && (
        <div className="mt-2 p-3 border rounded-md">
          <p className="text-sm">{description}</p>
        </div>
      )}
    </div>
  );
};

export default Indicator;



