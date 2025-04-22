export const formatNumber = (number) => {
    if (typeof number !== 'number') return number;
  
    if (Math.abs(number) >= 1e9) {
      return (number / 1e9).toFixed(2) + 'B';
    } else if (Math.abs(number) >= 1e6) {
      return (number / 1e6).toFixed(2) + 'M';
    } else if (Math.abs(number) >= 1e3) {
      return (number / 1e3).toFixed(2) + 'K';
    } else if (Number.isInteger(number)) {
      return number.toString();
    } else {
      return number.toFixed(2);
    }
  };